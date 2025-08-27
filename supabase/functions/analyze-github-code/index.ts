import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FileData {
  path: string;
  content: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { files, repoName } = await req.json();
    
    if (!files || !Array.isArray(files) || files.length === 0) {
      throw new Error('No files provided for analysis');
    }

    const claudeApiKey = Deno.env.get('CLAUDE_API_KEY');
    if (!claudeApiKey) {
      throw new Error('Claude API key not configured');
    }

    // Prepare the code content for analysis
    const codeContent = files.map((file: FileData) => {
      return `**File: ${file.path}**\n\`\`\`\n${file.content}\n\`\`\`\n`;
    }).join('\n\n');

    const prompt = `Please analyze this ${repoName} codebase and provide a comprehensive report. Focus on:

1. **Project Overview**: What does this project do? What's its main purpose?
2. **Architecture & Structure**: How is the code organized? What patterns are used?
3. **Key Components**: What are the main components/modules and their responsibilities?
4. **Technology Stack**: What technologies, frameworks, and libraries are being used?
5. **Code Quality**: Overall code quality, best practices, potential issues
6. **Recommendations**: Suggestions for improvements or areas of concern

Here's the codebase to analyze:

${codeContent}

Please provide a detailed, well-structured analysis that would be helpful for understanding this project.`;

    console.log('Sending request to Claude API...');
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${claudeApiKey}`,
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Claude API response received');
    
    const analysis = data.content[0]?.text;
    
    if (!analysis) {
      throw new Error('No analysis content received from Claude API');
    }

    return new Response(JSON.stringify({ 
      analysis,
      filesAnalyzed: files.length,
      repoName 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-github-code function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An unexpected error occurred during analysis'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});