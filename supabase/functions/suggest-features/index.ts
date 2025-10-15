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

    const systemPrompt = `You are a product strategist and senior engineer. Analyze the code review report and prioritize feature suggestions based on the findings.

**Prioritization Rules:**
1. If CRITICAL security issues found → Prioritize security/auth features
2. If performance issues found → Prioritize optimization features
3. If structural issues found → Prioritize refactoring/architecture
4. If missing core features → Prioritize essential functionality
5. If polish needed → Prioritize UX/UI improvements

Return ONLY a JSON array (3-5 suggestions) with this exact structure:
[
  {
    "title": "Add User Authentication",
    "description": "Implement secure login and signup functionality with JWT tokens",
    "priority": "high",
    "category": "Security"
  }
]

**Categories:** Security, UX, Performance, Features, Architecture, Testing, UI

**Priority levels:**
- high: Critical issues, missing core features, security
- medium: Important improvements, UX enhancements
- low: Nice-to-have, polish, minor optimizations

Each suggestion must be:
- Specific and actionable
- Based on actual findings in the report
- Implementable as a discrete task`;

    const userPrompt = `Based on this senior engineer code review, suggest 3-5 prioritized features/improvements:

${analysisReport}

Prioritize based on:
1. Critical/security issues mentioned
2. Missing core functionality
3. Architecture/structure problems
4. Performance bottlenecks
5. UX improvements

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
