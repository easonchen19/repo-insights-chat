import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { feature, codebaseInfo } = await req.json();
    
    if (!feature) {
      return new Response(
        JSON.stringify({ error: 'Feature description is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      console.error('ANTHROPIC_API_KEY not found');
      return new Response(
        JSON.stringify({ error: 'Anthropic API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const systemPrompt = `You are an expert AI prompt engineer specialized in creating precise, context-aware prompts for AI coding assistants.

Your task is to transform user feature requests into comprehensive, structured prompts that follow this enhanced template:

## Enhanced Prompt Template Structure:

You are an AI coding assistant helping a developer modify an existing project.  
You must respect the project's current structure and only make the requested change.  

## Repository Context
- File structure:
{{repo_file_tree}}
- Relevant files:
{{relevant_files_with_paths_and_summaries}}

## Task
{{user_task_description}}

## Implementation Requirements
1. Only modify these files if necessary: {{target_files}}
2. Do NOT create new files, rename functions, or change unrelated code.
3. Follow the coding style already used in the repo.
4. Ensure imports and dependencies are correct (use existing models/utilities).
5. Return error handling consistent with existing patterns.

## Validation
- After implementation, the following should work:
{{validation_steps}}

## Output Format
- Show the **exact code edits**, not just general guidance.
- If multiple files are changed, clearly separate them with filenames.
- Do not include unrelated explanations.

When generating prompts, you should:
1. Analyze the codebase structure from the provided context
2. Identify the most relevant files for the requested feature
3. Create specific validation steps that can be tested
4. Provide clear, actionable implementation requirements
5. Ensure the prompt respects existing code patterns and architecture

Codebase context available: ${JSON.stringify(codebaseInfo, null, 2)}`;

    const userPrompt = `Transform this feature request into a comprehensive, structured prompt using the enhanced template:

Feature Request: "${feature}"

Generate a detailed prompt that:
- Includes specific file structure context from the codebase
- Identifies the most relevant files that need modification
- Provides clear validation steps
- Follows the exact template structure shown above
- Helps an AI assistant implement this feature with precision and respect for existing code patterns

Make the prompt actionable and specific to this codebase context.`;

    console.log('🤖 Calling Anthropic API for prompt generation');
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: `${systemPrompt}\n\n${userPrompt}`
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to generate prompt' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await response.json();
    const generatedPrompt = data.content[0].text;

    console.log('✅ Successfully generated prompt');

    return new Response(
      JSON.stringify({ generatedPrompt }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in generate-prompt function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});