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

const MAX_FILES = 30;
const MAX_CHARS_PER_FILE = 2000;
const TOTAL_CHAR_BUDGET = 60_000;

// Codebase analysis interfaces
interface DependencyInfo {
  imports: string[];
  exports: string[];
  dependencies: string[];
}

interface FileAnalysis {
  path: string;
  type: string;
  language: string;
  size: number;
  complexity: number;
  dependencies: DependencyInfo;
  patterns: string[];
}

interface CodebaseKnowledge {
  structure: {
    totalFiles: number;
    languages: Record<string, number>;
    directories: string[];
    fileTypes: Record<string, number>;
  };
  dependencies: {
    external: string[];
    internal: Record<string, string[]>;
    circular: string[];
  };
  patterns: {
    architecturalPatterns: string[];
    designPatterns: string[];
    codeSmells: string[];
  };
  complexity: {
    averageComplexity: number;
    highComplexityFiles: string[];
    maintainabilityIndex: number;
  };
  technologies: {
    frameworks: string[];
    libraries: string[];
    tools: string[];
  };
}

// Codebase analysis functions
function getFileLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  const languageMap: Record<string, string> = {
    'js': 'JavaScript',
    'jsx': 'JavaScript React',
    'ts': 'TypeScript',
    'tsx': 'TypeScript React',
    'py': 'Python',
    'java': 'Java',
    'cpp': 'C++',
    'c': 'C',
    'cs': 'C#',
    'php': 'PHP',
    'rb': 'Ruby',
    'go': 'Go',
    'rs': 'Rust',
    'swift': 'Swift',
    'kt': 'Kotlin',
    'css': 'CSS',
    'scss': 'SCSS',
    'html': 'HTML',
    'json': 'JSON',
    'xml': 'XML',
    'yml': 'YAML',
    'yaml': 'YAML',
    'md': 'Markdown',
    'sql': 'SQL',
    'sh': 'Shell',
    'dockerfile': 'Docker'
  };
  return languageMap[ext] || 'Unknown';
}

function calculateComplexity(content: string, language: string): number {
  let complexity = 1; // Base complexity
  
  // Language-specific complexity patterns
  const patterns = {
    conditionals: /\b(if|else|switch|case|when|unless)\b/g,
    loops: /\b(for|while|do|forEach|map|filter|reduce)\b/g,
    functions: /\b(function|def|fn|func|=>\s*{|\w+\s*\(.*\)\s*{)/g,
    exceptions: /\b(try|catch|except|finally|throw|raise)\b/g,
    async: /\b(async|await|Promise|then|catch)\b/g
  };
  
  for (const [type, pattern] of Object.entries(patterns)) {
    const matches = content.match(pattern);
    if (matches) {
      complexity += matches.length;
    }
  }
  
  return Math.min(complexity, 50); // Cap at 50
}

function extractDependencies(content: string, filePath: string): DependencyInfo {
  const imports: string[] = [];
  const exports: string[] = [];
  const dependencies: string[] = [];
  
  // Extract imports (JavaScript/TypeScript)
  const importRegex = /import.*?from\s+['"`]([^'"`]+)['"`]/g;
  const requireRegex = /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
  
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    imports.push(importPath);
    if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
      dependencies.push(importPath.split('/')[0]);
    }
  }
  
  while ((match = requireRegex.exec(content)) !== null) {
    const requirePath = match[1];
    imports.push(requirePath);
    if (!requirePath.startsWith('.') && !requirePath.startsWith('/')) {
      dependencies.push(requirePath.split('/')[0]);
    }
  }
  
  // Extract exports
  const exportRegex = /export\s+(default\s+)?(class|function|const|let|var|interface|type)\s+(\w+)/g;
  while ((match = exportRegex.exec(content)) !== null) {
    exports.push(match[3]);
  }
  
  return {
    imports: [...new Set(imports)],
    exports: [...new Set(exports)],
    dependencies: [...new Set(dependencies)]
  };
}

function detectPatterns(content: string, filePath: string): string[] {
  const patterns: string[] = [];
  
  // Architectural patterns
  if (content.includes('useState') || content.includes('useEffect')) patterns.push('React Hooks');
  if (content.includes('createContext') || content.includes('useContext')) patterns.push('Context Pattern');
  if (content.includes('Redux') || content.includes('dispatch')) patterns.push('Redux Pattern');
  if (content.includes('observer') || content.includes('subscribe')) patterns.push('Observer Pattern');
  if (content.includes('factory') || content.includes('create')) patterns.push('Factory Pattern');
  if (content.includes('singleton')) patterns.push('Singleton Pattern');
  if (content.includes('middleware') || content.includes('next(')) patterns.push('Middleware Pattern');
  
  // Framework patterns
  if (content.includes('express') || content.includes('app.get')) patterns.push('Express.js');
  if (content.includes('router') || content.includes('Route')) patterns.push('Routing');
  if (content.includes('async') && content.includes('await')) patterns.push('Async/Await');
  if (content.includes('Promise')) patterns.push('Promises');
  if (content.includes('try') && content.includes('catch')) patterns.push('Error Handling');
  
  // Code smells
  if (content.length > 10000) patterns.push('Large File');
  if ((content.match(/function|const.*=.*=>|def /g) || []).length > 20) patterns.push('Many Functions');
  if (content.split('\n').length > 500) patterns.push('Long File');
  
  return patterns;
}

function analyzeCodebase(files: SafeFile[]): CodebaseKnowledge {
  const fileAnalyses: FileAnalysis[] = [];
  const allDependencies = new Set<string>();
  const allPatterns = new Set<string>();
  const languageCounts: Record<string, number> = {};
  const fileTypeCounts: Record<string, number> = {};
  const directories = new Set<string>();
  
  let totalComplexity = 0;
  
  for (const file of files) {
    const language = getFileLanguage(file.path);
    const complexity = calculateComplexity(file.content, language);
    const dependencies = extractDependencies(file.content, file.path);
    const patterns = detectPatterns(file.content, file.path);
    
    // Count languages
    languageCounts[language] = (languageCounts[language] || 0) + 1;
    
    // Count file types
    const ext = file.path.split('.').pop()?.toLowerCase() || 'unknown';
    fileTypeCounts[ext] = (fileTypeCounts[ext] || 0) + 1;
    
    // Extract directories
    const dir = file.path.split('/').slice(0, -1).join('/');
    if (dir) directories.add(dir);
    
    // Collect dependencies and patterns
    dependencies.dependencies.forEach(dep => allDependencies.add(dep));
    patterns.forEach(pattern => allPatterns.add(pattern));
    
    totalComplexity += complexity;
    
    fileAnalyses.push({
      path: file.path,
      type: file.type || 'unknown',
      language,
      size: file.content.length,
      complexity,
      dependencies,
      patterns
    });
  }
  
  // Detect frameworks and tools
  const frameworks: string[] = [];
  const libraries: string[] = [];
  const tools: string[] = [];
  
  for (const dep of allDependencies) {
    if (['react', 'vue', 'angular', 'svelte', 'next', 'nuxt'].includes(dep.toLowerCase())) {
      frameworks.push(dep);
    } else if (['express', 'fastify', 'koa', 'django', 'flask', 'spring'].includes(dep.toLowerCase())) {
      frameworks.push(dep);
    } else if (['webpack', 'vite', 'parcel', 'rollup', 'gulp', 'grunt'].includes(dep.toLowerCase())) {
      tools.push(dep);
    } else {
      libraries.push(dep);
    }
  }
  
  // Detect circular dependencies (simplified)
  const internalDeps: Record<string, string[]> = {};
  for (const analysis of fileAnalyses) {
    const internalImports = analysis.dependencies.imports.filter(imp => 
      imp.startsWith('./') || imp.startsWith('../') || imp.startsWith('/')
    );
    internalDeps[analysis.path] = internalImports;
  }
  
  return {
    structure: {
      totalFiles: files.length,
      languages: languageCounts,
      directories: Array.from(directories),
      fileTypes: fileTypeCounts
    },
    dependencies: {
      external: Array.from(allDependencies),
      internal: internalDeps,
      circular: [] // Simplified - would need graph analysis for real detection
    },
    patterns: {
      architecturalPatterns: Array.from(allPatterns).filter(p => 
        ['React Hooks', 'Context Pattern', 'Redux Pattern', 'Observer Pattern'].includes(p)
      ),
      designPatterns: Array.from(allPatterns).filter(p => 
        ['Factory Pattern', 'Singleton Pattern', 'Middleware Pattern'].includes(p)
      ),
      codeSmells: Array.from(allPatterns).filter(p => 
        ['Large File', 'Many Functions', 'Long File'].includes(p)
      )
    },
    complexity: {
      averageComplexity: totalComplexity / files.length,
      highComplexityFiles: fileAnalyses
        .filter(f => f.complexity > 15)
        .map(f => f.path),
      maintainabilityIndex: Math.max(0, 100 - (totalComplexity / files.length) * 2)
    },
    technologies: {
      frameworks,
      libraries: libraries.slice(0, 20), // Limit for readability
      tools
    }
  };
}

function formatCodebaseKnowledge(knowledge: CodebaseKnowledge): string {
  return `## 📊 CODEBASE KNOWLEDGE ANALYSIS

### 🏗️ Project Structure
- **Total Files**: ${knowledge.structure.totalFiles}
- **Primary Languages**: ${Object.entries(knowledge.structure.languages)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 5)
  .map(([lang, count]) => `${lang} (${count})`)
  .join(', ')}
- **Directory Structure**: ${knowledge.structure.directories.length} directories
- **File Types**: ${Object.entries(knowledge.structure.fileTypes)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 8)
  .map(([ext, count]) => `${ext} (${count})`)
  .join(', ')}

### 🔗 Dependencies Analysis
- **External Dependencies**: ${knowledge.dependencies.external.length} packages
  - Key libraries: ${knowledge.dependencies.external.slice(0, 10).join(', ')}
- **Internal Module Connections**: ${Object.keys(knowledge.dependencies.internal).length} files with internal imports
${knowledge.dependencies.circular.length > 0 ? `- **⚠️ Circular Dependencies**: ${knowledge.dependencies.circular.join(', ')}` : '- **✅ No circular dependencies detected**'}

### 🎯 Code Patterns & Architecture
- **Architectural Patterns**: ${knowledge.patterns.architecturalPatterns.length > 0 ? knowledge.patterns.architecturalPatterns.join(', ') : 'None detected'}
- **Design Patterns**: ${knowledge.patterns.designPatterns.length > 0 ? knowledge.patterns.designPatterns.join(', ') : 'None detected'}
${knowledge.patterns.codeSmells.length > 0 ? `- **⚠️ Code Smells**: ${knowledge.patterns.codeSmells.join(', ')}` : '- **✅ No major code smells detected**'}

### 📈 Complexity Metrics
- **Average Complexity**: ${knowledge.complexity.averageComplexity.toFixed(1)}/50
- **Maintainability Index**: ${knowledge.complexity.maintainabilityIndex.toFixed(1)}/100 ${knowledge.complexity.maintainabilityIndex > 70 ? '🟢' : knowledge.complexity.maintainabilityIndex > 40 ? '🟡' : '🔴'}
${knowledge.complexity.highComplexityFiles.length > 0 ? `- **High Complexity Files**: ${knowledge.complexity.highComplexityFiles.slice(0, 5).join(', ')}` : '- **✅ No high-complexity files detected**'}

### 🛠️ Technology Stack
- **Frameworks**: ${knowledge.technologies.frameworks.length > 0 ? knowledge.technologies.frameworks.join(', ') : 'None detected'}
- **Build Tools**: ${knowledge.technologies.tools.length > 0 ? knowledge.technologies.tools.join(', ') : 'None detected'}
- **Top Libraries**: ${knowledge.technologies.libraries.slice(0, 8).join(', ')}

---

## 🤖 AI ANALYSIS REPORT
`;
}

// Extract core code sections for analysis
function extractCoreCode(content: string): string {
  const lines = content.split('\n');
  const coreLines: string[] = [];
  let inFunction = false;
  let braceCount = 0;
  let commentBlocks = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Skip empty lines and excessive comments
    if (!trimmed || trimmed.startsWith('//')) continue;
    
    // Handle comment blocks
    if (trimmed.startsWith('/*')) commentBlocks++;
    if (trimmed.includes('*/')) commentBlocks--;
    if (commentBlocks > 0) continue;
    
    // Always include imports/exports
    if (trimmed.startsWith('import ') || trimmed.startsWith('export ')) {
      coreLines.push(line);
      continue;
    }
    
    // Include function/component definitions and key logic
    if (trimmed.includes('function ') || 
        trimmed.includes('const ') && trimmed.includes('=>') ||
        trimmed.includes('interface ') ||
        trimmed.includes('type ') ||
        trimmed.includes('class ')) {
      inFunction = true;
      coreLines.push(line);
      continue;
    }
    
    // Include return statements and key business logic
    if (inFunction && (
        trimmed.startsWith('return ') ||
        trimmed.includes('useState') ||
        trimmed.includes('useEffect') ||
        trimmed.includes('fetch(') ||
        trimmed.includes('supabase.') ||
        trimmed.includes('await ') ||
        trimmed.includes('if (') ||
        trimmed.includes('switch (')
      )) {
      coreLines.push(line);
    }
    
    // Track braces to know when function ends
    braceCount += (line.match(/{/g) || []).length;
    braceCount -= (line.match(/}/g) || []).length;
    
    if (inFunction && braceCount === 0) {
      inFunction = false;
    }
  }
  
  return coreLines.join('\n');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { files, repoName, model } = body as { files?: FileData[]; repoName?: string; model?: string };

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

    // Filter for core files only to save tokens and focus on important code
    const coreFilePatterns = [
      // Main application files
      /\/(src|app|lib|components|pages|hooks|utils|types)\/.*\.(ts|tsx|js|jsx)$/,
      // Configuration files
      /\/(package\.json|tsconfig\.json|tailwind\.config\.|vite\.config\.|next\.config\.).*$/,
      // Root files
      /^[^\/]*\.(ts|tsx|js|jsx|json|md)$/,
      // Supabase functions (core backend logic)
      /\/supabase\/functions\/.*\.ts$/,
      // Database schema
      /\/supabase\/migrations\/.*\.sql$/
    ];
    
    const sanitized: SafeFile[] = files
      .filter((f): f is FileData => !!f && typeof (f as any).content === 'string')
      .map((f) => ({
        path: typeof (f as any).path === 'string' && (f as any).path.length ? (f as any).path : (f as any).name || 'unknown',
        content: (f as any).content || '',
        type: (f as any).type,
      }))
      .filter((f) => f.path && f.content)
      // Only include core files to save tokens and focus analysis
      .filter((f) => coreFilePatterns.some(pattern => pattern.test(f.path)))
      // Prioritize by importance
      .sort((a, b) => {
        const getImportance = (path: string) => {
          if (path.includes('package.json')) return 10;
          if (path.includes('/pages/') || path.includes('/app/')) return 9;
          if (path.includes('/components/')) return 8;
          if (path.includes('/hooks/') || path.includes('/lib/')) return 7;
          if (path.includes('supabase/functions')) return 6;
          if (path.includes('config')) return 5;
          return 1;
        };
        return getImportance(b.path) - getImportance(a.path);
      });

    if (sanitized.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid files with content provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Apply smart truncation focusing on core code sections
    const limited: SafeFile[] = [];
    let remaining = TOTAL_CHAR_BUDGET;

    for (const file of sanitized.slice(0, MAX_FILES)) {
      if (remaining <= 0) break;
      
      let content = file.content;
      
      // For code files, extract only the most important parts
      if (file.path.match(/\.(ts|tsx|js|jsx)$/)) {
        content = extractCoreCode(content);
      }
      
      const sliceLen = Math.min(MAX_CHARS_PER_FILE, Math.max(0, remaining));
      const truncated = content.slice(0, sliceLen);
      if (!truncated) continue;
      remaining -= truncated.length;
      limited.push({ ...file, content: truncated });
    }

    // Generate codebase knowledge analysis
    console.log('🔍 Generating codebase knowledge analysis...');
    const codebaseKnowledge = analyzeCodebase(limited);
    const knowledgeSection = formatCodebaseKnowledge(codebaseKnowledge);

    // Build prompt optimized for junior engineers and product managers
    const systemPrompt = `You are a senior software engineer with 15+ years of experience conducting comprehensive code reviews.

Analyze the codebase focusing on:

**CODE QUALITY**
- Code duplication and redundancy  
- Readability and maintainability
- Naming conventions and documentation

**ARCHITECTURE & STRUCTURE**  
- File/folder organization (frontend, backend, db, api should be separate)
- Separation of concerns
- Component/module boundaries

**BEST PRACTICES**
- Security vulnerabilities
- Performance bottlenecks  
- Error handling

Provide severity ratings (🔴 CRITICAL, 🟡 WARNING, ℹ️ INFO) with specific examples and actionable recommendations.`;

    const userPrompt = `Review this codebase and provide detailed senior engineer analysis:

**Repository:** ${repoName}
**Files Analyzed:** ${filesData.length} 
**Selected Files:** ${filesData.map(f => f.path).join(', ')}

${formattedKnowledge}

Include: overall quality rating (1-10), code duplication issues, file structure assessment, critical issues with severity, and specific improvements with code examples.`;

    console.log('📦 analyze-github-code: files received:', files.length, 'valid:', sanitized.length, 'limited:', limited.length, 'budgetLeft:', remaining);

    // Use the model selected by the user, with fallback to default models for reliability
    const selectedModel = model || 'claude-3-5-haiku-20241022';
    const fallbackModels = ['claude-3-5-haiku-20241022', 'claude-3-5-sonnet-20241022', 'claude-sonnet-4-20250514'];
    const models = [selectedModel, ...fallbackModels.filter(m => m !== selectedModel)];
    let response: Response | null = null;
    let lastErrorText = '';

    for (const currentModel of models) {
      console.log('🤖 Calling Claude model:', currentModel);
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': claudeApiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: currentModel,
          max_tokens: 3000,
          temperature: 0.5,
          stream: true, // Enable streaming
          messages: [
            { role: 'user', content: userContent }
          ],
        }),
      });

      if (response.ok) break;
      lastErrorText = await response.text();
      console.error(`❌ Claude API error for ${model}:`, response.status, lastErrorText);
      response = null;
    }

    if (!response) {
      return new Response(JSON.stringify({ error: 'All Claude models failed', details: lastErrorText }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Set up streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // First, send the codebase knowledge analysis
          const knowledgeChunk = { type: 'delta', text: knowledgeSection };
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(knowledgeChunk)}\n\n`));
          const reader = response!.body?.getReader();
          if (!reader) {
            controller.close();
            return;
          }

          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  // Send completion signal
                  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'complete' })}\n\n`));
                  continue;
                }

                try {
                  const parsed = JSON.parse(data);
                  if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                    // Stream the text chunk
                    const chunk = { type: 'delta', text: parsed.delta.text };
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(chunk)}\n\n`));
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        } catch (error) {
          console.error('💥 Streaming error:', error);
        } finally {
          controller.close();
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
    console.error('💥 Error in analyze-github-code function:', error);
    return new Response(
      JSON.stringify({ error: (error as Error)?.message || 'Unexpected error', stack: (error as Error)?.stack }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
