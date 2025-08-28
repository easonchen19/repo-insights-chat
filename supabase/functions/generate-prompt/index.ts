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

    const systemPrompt = `You are an expert software development prompt engineer. Your job is to take a user's feature request and transform it into a clear, comprehensive, and actionable prompt for a software development AI assistant.

Generate a well-structured prompt that:
1. Clearly defines the feature requirements
2. Provides technical context and specifications
3. Includes implementation guidelines
4. Suggests best practices
5. Considers edge cases and user experience

The codebase context: ${JSON.stringify(codebaseInfo, null, 2)}

Make the prompt specific, actionable, and comprehensive while maintaining clarity.`;

    const userPrompt = `Transform this feature request into a comprehensive development prompt:

Feature Request: "${feature}"

Generate a detailed prompt that would help an AI assistant implement this feature effectively in the given codebase context.`;

    console.log('🤖 Calling Anthropic API for prompt generation');
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1000,
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