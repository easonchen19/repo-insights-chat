import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FileEntry {
  name: string;
  metadata?: { size?: number };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, question, maxFiles = 8, maxChars = 16000 } = await req.json();

    if (!projectId || !question) {
      return new Response(JSON.stringify({ error: 'projectId and question are required' }), {
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

    // Fetch project
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

    const listPath = (project.upload_path || '').replace(/^\/+|\/+$/g, '');
    const { data: files, error: filesError } = await supabase.storage
      .from('project-uploads')
      .list(listPath, { limit: 100, offset: 0 });

    if (filesError) {
      console.error('Error listing files:', filesError);
      return new Response(JSON.stringify({ error: 'Failed to list project files' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Sort files by size desc if available, prefer code file extensions
    const codeExts = new Set(['ts','tsx','js','jsx','json','md','yml','yaml','css','scss','html','rs','go','py','java','rb','php','cpp','c','svelte','vue']);
    const sorted = (files as FileEntry[])
      .filter(f => (f.metadata && typeof f.metadata.size === 'number'))
      .sort((a,b) => (b.metadata?.size ?? 0) - (a.metadata?.size ?? 0));

    const selected: { path: string; name: string; content: string }[] = [];
    let totalChars = 0;

    for (const f of sorted) {
      if (selected.length >= maxFiles) break;
      const ext = f.name.split('.').pop()?.toLowerCase();
      if (ext && !codeExts.has(ext)) continue;

      const fullPath = `${listPath}/${f.name}`.replace(/\/+/,'/');
      const { data: fileBlob, error: dlError } = await supabase.storage
        .from('project-uploads')
        .download(fullPath);
      if (dlError || !fileBlob) continue;
      const text = await fileBlob.text();
      if (!text) continue;

      // Avoid huge files
      const slice = text.substring(0, Math.max(2000, Math.floor(maxChars/ maxFiles)));
      if (totalChars + slice.length > maxChars) break;
      totalChars += slice.length;

      selected.push({ path: fullPath, name: f.name, content: slice });
    }

    const contextBlock = selected.map(s => `FILE: ${s.path}\nCONTENT:\n${s.content}\n---`).join('\n');

    const system = `You are an expert code assistant. Answer user questions using ONLY the provided project files. If something is not present, say you don't know. Provide concise answers, include file paths when relevant.`;

    const userPrompt = `PROJECT NAME: ${project.name}\n\nQUESTION: ${question}\n\nPROJECT FILE CONTEXT (truncated for brevity):\n${contextBlock}`;

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': claudeApiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1200,
        system,
        messages: [
          { role: 'user', content: userPrompt }
        ]
      }),
    });

    if (!claudeResponse.ok) {
      const errText = await claudeResponse.text();
      console.error('Claude API error (code-chat):', errText);
      return new Response(JSON.stringify({ error: 'AI call failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const claudeData = await claudeResponse.json();
    const answer: string = claudeData.content?.[0]?.text ?? '';

    return new Response(JSON.stringify({
      answer,
      usedFiles: selected.map(s => s.path),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in code-chat function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
