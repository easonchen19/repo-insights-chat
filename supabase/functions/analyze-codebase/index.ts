import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FileAnalysis {
  path: string;
  content: string;
  type: 'component' | 'hook' | 'utility' | 'config' | 'style' | 'test' | 'other';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, analysisId, files, isDirectAnalysis, model = 'claude-3-5-haiku-20241022' } = await req.json();
    
    // Support both existing project analysis and direct file analysis
    const targetId = analysisId || projectId;
    
    if (!targetId) {
      return new Response(JSON.stringify({ error: 'Project ID or Analysis ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const claudeApiKey = Deno.env.get('CLAUDE_API_KEY');
    if (!claudeApiKey) {
      return new Response(JSON.stringify({ error: 'Claude API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? 'https://wfywmkdqyuucxftpvmfj.supabase.co';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseKey) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY in edge function environment');
      return new Response(JSON.stringify({ error: 'Server misconfiguration: missing service role key' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    let fileAnalyses: FileAnalysis[] = [];
    let projectName = 'Direct File Analysis';

    if (isDirectAnalysis && files) {
      // Handle direct file analysis (new analyzer page)
      console.log(`Processing ${files.length} directly uploaded files`);
      
      for (const file of files) {
        if (file.content && file.content.trim()) {
          const fileType = getFileType(file.name);
          fileAnalyses.push({
            path: file.name,
            content: file.content.substring(0, 8000), // Limit content size
            type: fileType,
          });
        }
      }
      
      projectName = `Analysis Session ${new Date().toLocaleDateString()}`;
    } else {
      // Handle existing project analysis (original upload button)
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError || !project) {
        return new Response(JSON.stringify({ error: 'Project not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      projectName = project.name;

      // Recursively get all files from the project folder
      const listPath = (project.upload_path || '').replace(/^\/+|\/+$/g, '');
      
      async function getAllFiles(path: string): Promise<{ name: string; fullPath: string; metadata: any }[]> {
        const { data: items, error } = await supabase.storage
          .from('project-uploads')
          .list(path, {
            limit: 1000,
            offset: 0,
          });

        if (error) {
          console.error(`Error listing files in ${path}:`, error);
          return [];
        }

        const allFiles: { name: string; fullPath: string; metadata: any }[] = [];
        
        for (const item of items || []) {
          const fullPath = path ? `${path}/${item.name}` : item.name;
          const meta: any = (item as any).metadata;
          const isFile = meta && typeof meta.size === 'number';
          
          if (isFile) {
            // It's a file
            allFiles.push({
              name: item.name,
              fullPath: fullPath,
              metadata: meta
            });
          } else {
            // It's a folder, recurse into it
            const subFiles = await getAllFiles(fullPath);
            allFiles.push(...subFiles);
          }
        }
        
        return allFiles;
      }

      const allFiles = await getAllFiles(listPath);
      console.log(`Found ${allFiles.length} files in project ${project.name}`);

      if (allFiles.length === 0) {
        return new Response(JSON.stringify({ 
          error: 'No files found in the uploaded project',
          projectPath: listPath 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Download and analyze files
      for (const fileInfo of allFiles) {
        try {
          const { data: fileContent, error: dlError } = await supabase.storage
            .from('project-uploads')
            .download(fileInfo.fullPath);

          if (dlError) {
            console.error(`Download error for ${fileInfo.fullPath}:`, dlError);
            continue;
          }

          if (fileContent) {
            const content = await fileContent.text();
            const fileType = getFileType(fileInfo.name);

            fileAnalyses.push({
              path: fileInfo.fullPath,
              content: content.substring(0, 8000),
              type: fileType,
            });
          }
        } catch (error) {
          console.error(`Error processing file ${fileInfo.name}:`, error);
        }
      }
    }

    if (fileAnalyses.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No files to analyze' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Updated analysis prompt for non-technical users
    const analysisPrompt = `You are a friendly Senior Software Engineer helping non-technical users understand their AI-generated code. Your audience includes beginners and junior developers who may have used AI to create this project but lack deep technical knowledge.

PROJECT: ${projectName}
FILES TO ANALYZE: ${fileAnalyses.length} files

${fileAnalyses.map(file => `
FILE: ${file.path} (${file.type})
CONTENT:
${file.content}
---
`).join('\n')}

Create a comprehensive but beginner-friendly report with these sections:

# 🚀 YOUR PROJECT OVERVIEW

## What You Built
Explain in simple terms what this project does, what kind of website/app it is, and what users can do with it. Use everyday language, not technical jargon.

## Your Tech Stack (Simplified)
List the main technologies used and explain each one in 1-2 simple sentences. For example:
- "React: Think of this as the foundation that builds your website's interactive parts"
- "Tailwind CSS: This makes your website look pretty with pre-designed styles"

## Project Health Score: X/10
Give an overall score and explain what this means in simple terms.

# 📋 WHAT'S IN YOUR CODE

## Main Components
List the key parts of your project and what each one does in simple language. Focus on the user-facing features.

## File Organization
Explain how your files are organized using simple analogies (like "think of folders as rooms in a house").

# ⚠️ THINGS TO WATCH OUT FOR

## Potential Issues
Identify any problems in simple terms and explain why they matter to a non-technical person.

## Missing Pieces
What important features or security measures might be missing?

# 🎯 HOW TO ADD NEW FEATURES (AI PROMPTING GUIDE)

This is the most important section! Teach users how to prompt AI effectively:

## ✅ GOOD PROMPTING STRATEGIES

### Be Specific and Clear
- **Bad:** "Add a login"
- **Good:** "Add a user login form with email and password fields that connects to the existing authentication system"

### Break Down Big Features
- **Bad:** "Build a complete e-commerce system"
- **Good:** "First, add a product display page. Then we'll add a shopping cart. Finally, we'll add checkout."

### Provide Context
Always mention:
- What file you want to modify
- How it should work with existing features
- What the user should see/experience

### Example Good Prompts:
1. "Add a contact form to the homepage with name, email, and message fields. When submitted, show a success message."
2. "Create a user profile page where logged-in users can edit their name and profile picture."
3. "Add a search bar to the navigation that filters the existing product list."

## ❌ PROMPTING MISTAKES TO AVOID

### Vague Requests
- "Make it better" → Instead: "Improve the homepage layout by making the buttons larger and adding more spacing"
- "Fix the bugs" → Instead: "The login button doesn't work when clicked - please fix the authentication"

### Too Many Changes at Once
- Don't ask for 10 features in one prompt
- Make one change, test it, then ask for the next

### Assuming AI Knows Your Vision
- Don't say "you know what I mean"
- Always describe exactly what you want to see

## 🔄 ITERATIVE DEVELOPMENT TIPS

1. **Start Small:** Add one feature at a time
2. **Test Everything:** Check that each new feature works before adding more
3. **Be Patient:** If something doesn't work, describe the specific error you see
4. **Ask Questions:** If you don't understand something, ask the AI to explain it simply

## 📝 PROMPT TEMPLATES YOU CAN USE

### Adding a New Page:
"Create a new [page name] page that shows [what content]. Add a navigation link to reach this page from the main menu."

### Modifying Existing Features:
"On the [page name] page, change the [specific element] to [desired behavior]. Make sure it still works with the existing [related feature]."

### Styling Changes:
"Update the [component name] to use [color/size/layout]. Keep the same functionality but make it look [describe desired appearance]."

# 🛠️ NEXT STEPS & RECOMMENDATIONS

## Immediate Priorities
List 3-5 specific improvements they should make first, in order of importance.

## Long-term Growth
Suggest features they might want to add later as they learn more.

## Learning Resources
Recommend beginner-friendly resources to learn more about their tech stack.

Remember: Write everything in simple, encouraging language. Avoid technical jargon. Use emojis and clear headings. Focus on empowering non-technical users to successfully work with AI to improve their projects.`;

    // Call Claude API with streaming
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': claudeApiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 4000,
        stream: true,
        messages: [{
          role: 'user',
          content: analysisPrompt
        }]
      }),
    });

    if (!claudeResponse.ok) {
      const error = await claudeResponse.text();
      console.error('Claude API error:', error);
      return new Response(JSON.stringify({ error: 'Failed to analyze codebase' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create a readable stream to pass through Claude's streaming response
    let fullAnalysis = '';
    
    const stream = new ReadableStream({
      async start(controller) {
        const reader = claudeResponse.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);

                try {
                  const parsed = JSON.parse(data);

                  if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                    fullAnalysis += parsed.delta.text;
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
                      type: 'delta',
                      text: parsed.delta.text
                    })}\n\n`));
                  }

                  if (parsed.type === 'message_stop') {
                    // Only store analysis for existing projects, not direct analysis
                    if (!isDirectAnalysis && projectId) {
                      const { error: insertError } = await supabase
                        .from('project_analyses')
                        .insert({
                          project_id: projectId,
                          analysis_report: fullAnalysis,
                          file_count: fileAnalyses.length,
                          created_at: new Date().toISOString()
                        });

                      if (insertError) {
                        console.error('Error storing analysis:', insertError);
                      }
                    }

                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
                      type: 'complete',
                      fileCount: fileAnalyses.length,
                      projectName: projectName
                    })}\n\n`));
                    controller.close();
                    return;
                  }
                } catch (_e) {
                  // Fallback for non-JSON terminator (e.g., [DONE])
                  if (data === '[DONE]') {
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
                      type: 'complete',
                      fileCount: fileAnalyses.length,
                      projectName: projectName
                    })}\n\n`));
                    controller.close();
                    return;
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error in analyze-codebase function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getFileType(filename: string): FileAnalysis['type'] {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  if (['tsx', 'jsx', 'vue', 'svelte'].includes(ext || '')) return 'component';
  if (filename.includes('hook') || filename.startsWith('use')) return 'hook';
  if (['js', 'ts', 'utils', 'helpers', 'lib'].includes(ext || '')) return 'utility';
  if (['json', 'config', 'toml', 'yaml', 'yml'].includes(ext || '')) return 'config';
  if (['css', 'scss', 'sass', 'less'].includes(ext || '')) return 'style';
  if (filename.includes('test') || filename.includes('spec')) return 'test';
  
  return 'other';
}
