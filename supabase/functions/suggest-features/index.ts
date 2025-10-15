import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { analysisReport, model } = await req.json();
    
    if (!analysisReport) {
      return new Response(
        JSON.stringify({ error: 'Analysis report is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY not found');
      return new Response(
        JSON.stringify({ error: 'Lovable API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const systemPrompt = `You are a product strategist analyzing a codebase. Based on the analysis report, suggest 3-5 impactful features that are missing or could be improved.

Return ONLY a JSON array with this exact structure:
[
  {
    "title": "Add User Authentication",
    "description": "Implement secure login and signup functionality",
    "priority": "high",
    "category": "Security"
  }
]

Categories: Security, UX, Performance, Features, UI, Marketing

Priority levels: high, medium, low

Focus on:
- Missing critical features (auth, database, API endpoints)
- UX improvements (testimonials, how it works sections, onboarding)
- Performance optimizations
- Marketing features (landing page sections, CTAs)

Be specific and actionable. Each suggestion should be clear and implementable.`;

    const userPrompt = `Based on this codebase analysis, suggest 3-5 missing features or improvements:

${analysisReport}

Return ONLY the JSON array, no other text.`;

    console.log('🤖 Calling Lovable AI for feature suggestions');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: model || 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to generate feature suggestions' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Extract JSON from response (handle markdown code blocks)
    let suggestions;
    try {
      // Try to parse as-is
      suggestions = JSON.parse(content);
    } catch (e) {
      // Try to extract from code block
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[1]);
      } else {
        // Try to find array in text
        const arrayMatch = content.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          suggestions = JSON.parse(arrayMatch[0]);
        } else {
          throw new Error('Could not parse suggestions');
        }
      }
    }

    console.log('✅ Successfully generated feature suggestions:', suggestions.length);

    return new Response(
      JSON.stringify({ suggestions }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in suggest-features function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
