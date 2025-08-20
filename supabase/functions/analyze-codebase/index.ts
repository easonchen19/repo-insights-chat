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
    const { projectId, analysisId, files, isDirectAnalysis } = await req.json();
    
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

    // Prepare analysis prompt
    const analysisPrompt = `You are a Senior Software Engineer with 20 years of experience. Analyze this codebase and provide a comprehensive report for project managers.

PROJECT: ${projectName}
FILES TO ANALYZE: ${fileAnalyses.length} files

${fileAnalyses.map(file => `
FILE: ${file.path} (${file.type})
CONTENT:
${file.content}
---
`).join('\n')}

Please provide a detailed analysis report with the following sections:

1. **EXECUTIVE SUMMARY** (for project managers)
   - Project overview and purpose
   - Technology stack assessment
   - Overall code quality rating (1-10)
   - Key risks and recommendations

2. **ARCHITECTURE ANALYSIS**
   - Application structure and patterns
   - Component organization
   - Data flow and state management
   - API and backend integration

3. **CODE QUALITY ASSESSMENT**
   - Code organization and modularity
   - Best practices adherence
   - Potential technical debt
   - Performance considerations

4. **TECHNOLOGY STACK**
   - Frontend technologies and versions
   - Dependencies analysis
   - Security considerations
   - Upgrade recommendations

5. **COMPONENT BREAKDOWN**
   - Main components and their responsibilities
   - Reusability assessment
   - Coupling and cohesion analysis

6. **RECOMMENDATIONS**
   - Immediate action items
   - Long-term improvements
   - Team skills requirements
   - Estimated effort for major changes

7. **AI PROMPTING TIPS** (for extending this codebase)
   - Since this codebase may have been AI-generated, provide specific prompting strategies for adding new features
   - Include tips on how to describe new components that follow the existing patterns
   - Suggest how to prompt for modifications that maintain code consistency
   - Provide examples of effective prompts for common feature additions (forms, API endpoints, UI components)
   - Include guidelines for maintaining the existing design system and architecture patterns
   - Recommend how to ask AI to refactor or optimize existing code while preserving functionality

Format your response as clear, professional markdown that project managers can easily understand.`;

    // Call Claude API with streaming
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': claudeApiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
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
    return new Response(JSON.stringify({ error: error.message }), {
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