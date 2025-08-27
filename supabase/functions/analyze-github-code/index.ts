import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FileData {
  path: string;
  content: string;
  type?: string;
}

type SafeFile = Required<Pick<FileData, 'path' | 'content'>> & { type?: string };

const MAX_FILES = 40;
const MAX_CHARS_PER_FILE = 4000;
const TOTAL_CHAR_BUDGET = 120_000;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { files, repoName } = body as { files?: FileData[]; repoName?: string };

    if (!files || !Array.isArray(files) || files.length === 0) {
      return new Response(JSON.stringify({ error: 'No files provided for analysis' }), {
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

    // Sanitize, filter and truncate files
    const sanitized: SafeFile[] = files
      .filter((f): f is FileData => !!f && typeof (f as any).content === 'string')
      .map((f) => ({
        path: typeof (f as any).path === 'string' && (f as any).path.length ? (f as any).path : (f as any).name || 'unknown',
        content: (f as any).content || '',
        type: (f as any).type,
      }))
      .filter((f) => f.path && f.content);

    if (sanitized.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid files with content provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Apply per-file truncation and overall budget
    const limited: SafeFile[] = [];
    let remaining = TOTAL_CHAR_BUDGET;

    for (const file of sanitized.slice(0, MAX_FILES)) {
      if (remaining <= 0) break;
      const sliceLen = Math.min(MAX_CHARS_PER_FILE, Math.max(0, remaining));
      const truncated = file.content.slice(0, sliceLen);
      if (!truncated) continue;
      remaining -= truncated.length;
      limited.push({ ...file, content: truncated });
    }

    // Build prompt with clear boundaries
    const header = `Analyze the selected files from the repository "${repoName || 'repository'}" and produce a clear, structured report with:
- Project overview
- Architecture & structure
- Key components and responsibilities
- Technology stack
- Code quality observations (performance, security, readability)
- Concrete recommendations (prioritized)

Use concise sections and bullet points where helpful.`;

    const codeSections = limited
      .map((f) => `FILE: ${f.path}\nTYPE: ${f.type || 'text'}\n-----\n${f.content}\n\n`)
      .join("\n\n");

    const userContent = `${header}\n\n${codeSections}`;

    console.log('📦 analyze-github-code: files received:', files.length, 'valid:', sanitized.length, 'limited:', limited.length, 'budgetLeft:', remaining);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        temperature: 0.5,
        messages: [
          { role: 'user', content: userContent }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Claude API error:', response.status, errorText);
      return new Response(JSON.stringify({ error: `Claude API error: ${response.status}`, details: errorText }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const analysis = data?.content?.[0]?.text || data?.content?.[0]?.content || '';

    if (!analysis) {
      console.error('⚠️ No analysis content returned by Claude');
      return new Response(JSON.stringify({ error: 'No analysis content received from Claude API' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ analysis, filesAnalyzed: limited.length, repoName: repoName || null }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('💥 Error in analyze-github-code function:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unexpected error', stack: (error as any)?.stack }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
