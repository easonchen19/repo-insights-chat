
import { useState, useEffect } from "react";
import { Github, Search, Star, GitBranch, Calendar, ExternalLink, Copy, Lightbulb, Send, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { ModelSelector, useModelSelection } from "@/components/ModelSelector";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { FeatureSuggestions } from "@/components/FeatureSuggestions";

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  language: string;
  stars: number;
  updatedAt: string;
  private: boolean;
  html_url: string;
  default_branch: string;
}

const GitHubConnect = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [githubAccessToken, setGithubAccessToken] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [showRepositories, setShowRepositories] = useState(false);
  
  // Model selection for AI features
  const { selectedModel, setSelectedModel } = useModelSelection();
  
  // Analysis mode state - controls whether we show two-panel layout
  const [isAnalyzingMode, setIsAnalyzingMode] = useState(false);
  
  // File selection state
  const [repoFiles, setRepoFiles] = useState<{ [key: string]: any[] }>({});
  const [allFiles, setAllFiles] = useState<any[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [currentAnalysisRepo, setCurrentAnalysisRepo] = useState<Repository | null>(null);
  
  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState("");
  const [analyzedFiles, setAnalyzedFiles] = useState<any[]>([]);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [currentRepo, setCurrentRepo] = useState<Repository | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string>("");
  const [featureInput, setFeatureInput] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [contextualPrompts, setContextualPrompts] = useState<{title: string; prompt: string}[]>([]);
  
  // Feature suggestions state
  const [featureSuggestions, setFeatureSuggestions] = useState<any[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<any>(null);
  
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied to clipboard", description: "Prompt copied successfully!" });
    } catch (err) {
      toast({ title: "Copy failed", description: "Please copy manually.", variant: "destructive" });
    }
  };

  // Default feature suggestions for quick demo
  const getDefaultSuggestions = () => [
    {
      title: "Add User Authentication",
      description: "Implement secure login and signup with email/password or social providers",
      priority: "high" as const,
      category: "Security"
    },
    {
      title: "Add Payment Integration",
      description: "Integrate Stripe for one-time payments or subscriptions",
      priority: "high" as const,
      category: "Features"
    },
    {
      title: "Add Testimonials Section",
      description: "Showcase customer reviews and social proof on landing page",
      priority: "medium" as const,
      category: "Marketing"
    },
    {
      title: "Add How It Works Section",
      description: "Explain your product's key features and workflow visually",
      priority: "medium" as const,
      category: "Marketing"
    },
    {
      title: "Add Loading States",
      description: "Improve UX with skeleton loaders and loading indicators",
      priority: "medium" as const,
      category: "UX"
    },
    {
      title: "Add Error Boundaries",
      description: "Implement error boundaries to gracefully handle runtime errors",
      priority: "low" as const,
      category: "Features"
    },
    {
      title: "Add Dark Mode Toggle",
      description: "Allow users to switch between light and dark themes",
      priority: "low" as const,
      category: "UI"
    },
    {
      title: "Add API Rate Limiting",
      description: "Protect your backend with rate limiting and request throttling",
      priority: "medium" as const,
      category: "Security"
    }
  ];

  // Load feature suggestions - now shows immediately without analysis
  const loadFeatureSuggestions = async () => {
    console.log('🔍 Loading feature suggestions (quick demo mode)');
    
    // Show default suggestions immediately
    setFeatureSuggestions(getDefaultSuggestions());
    console.log('✅ Loaded default feature suggestions');
  };

  // Handle clicking on a feature suggestion
  const handleSuggestionClick = async (suggestion: any) => {
    setSelectedSuggestion(suggestion);
    setIsGenerating(true);
    setGeneratedPrompt("");
    
    try {
      console.log('🤖 Generating prompt for:', suggestion.title);
      
      // Build context from available data
      const codebaseContext = {
        repoName: currentAnalysisRepo?.name || 'your project',
        language: currentAnalysisRepo?.language || 'TypeScript/React',
        description: currentAnalysisRepo?.description || 'web application',
        analysis: analysisResult || 'No analysis available yet'
      };
      
      const SUPABASE_URL = "https://wfywmkdqyuucxftpvmfj.supabase.co";
      const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feature: `${suggestion.title}: ${suggestion.description}`,
          codebaseInfo: codebaseContext,
          model: selectedModel
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate prompt');
      }

      const data = await response.json();
      setGeneratedPrompt(data.generatedPrompt);
      
      console.log('✅ Prompt generated successfully');
      toast({
        title: "Prompt Generated!",
        description: "Ready to copy and use in your AI assistant.",
      });
    } catch (error) {
      console.error('❌ Error generating prompt:', error);
      toast({
        title: "Generation Failed",
        description: "Could not generate prompt for this feature.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Load contextual prompts for a repository
  const loadContextualPrompts = async (repo: Repository) => {
    try {
      const prompts = await generateContextualPrompts(repo);
      setContextualPrompts(prompts);
    } catch (error) {
      console.error('Error loading contextual prompts:', error);
      setContextualPrompts([]);
    }
  };

  const generatePrompt = async (repo?: Repository) => {
    const targetRepo = repo || currentRepo;
    if (!targetRepo) {
      toast({
        title: "Error",
        description: "No repository selected.",
        variant: "destructive"
      });
      return;
    }
    if (!featureInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter a feature description.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Use the new structured template with real repo analysis
      const structuredPrompt = await generateStructuredPrompt(targetRepo, featureInput);
      setGeneratedPrompt(structuredPrompt);
      
      toast({
        title: "Prompt generated!",
        description: "Your optimized structured prompt has been generated successfully.",
      });
    } catch (error) {
      console.error('Error generating prompt:', error);
      toast({
        title: "Error",
        description: "Failed to generate prompt. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate structured prompts using the comprehensive template
  const generateStructuredPrompt = async (repo: any, userTask: string) => {
    const language = repo.language?.toLowerCase() || 'javascript';
    const repoName = repo.name;
    const description = repo.description || 'No description available';
    
    // Fetch actual repository structure from GitHub API
    const getRepoStructure = async (repo: any) => {
      try {
        const response = await fetch(`https://api.github.com/repos/${repo.full_name}/contents`, {
          headers: {
            'Authorization': `token ${githubAccessToken}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        });
        
        if (!response.ok) throw new Error('Failed to fetch repo structure');
        
        const contents = await response.json();
        const structure = await analyzeRepoStructure(contents, repo.full_name, '', 0, 2); // Max 2 levels deep
        return structure;
      } catch (error) {
        console.error('Error fetching repo structure:', error);
        // Fallback to generic structure based on language
        return generateFallbackStructure(language, repoName);
      }
    };

    // Recursively analyze repository structure
    const analyzeRepoStructure = async (contents: any[], repoFullName: string, path: string, depth: number, maxDepth: number): Promise<string> => {
      if (depth >= maxDepth) return '';
      
      const structure = [];
      const indent = '  '.repeat(depth);
      
      for (const item of contents.slice(0, 20)) { // Limit to 20 items per level
        if (item.type === 'dir') {
          structure.push(`${indent}├── ${item.name}/`);
          if (depth < maxDepth - 1) {
            try {
              const subResponse = await fetch(`https://api.github.com/repos/${repoFullName}/contents/${item.path}`, {
                headers: {
                  'Authorization': `token ${githubAccessToken}`,
                  'Accept': 'application/vnd.github.v3+json',
                },
              });
              if (subResponse.ok) {
                const subContents = await subResponse.json();
                const subStructure = await analyzeRepoStructure(subContents, repoFullName, item.path, depth + 1, maxDepth);
                if (subStructure) structure.push(subStructure);
              }
            } catch (error) {
              // Skip if can't fetch subdirectory
            }
          }
        } else {
          structure.push(`${indent}├── ${item.name}`);
        }
      }
      
      return structure.join('\n');
    };

    // Generate fallback structure based on detected language/framework
    const generateFallbackStructure = (lang: string, name: string) => {
      if (lang.includes('react') || lang.includes('typescript') || lang.includes('javascript')) {
        return `${name}/
├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── utils/
│   └── assets/
├── public/
├── package.json
├── tsconfig.json
└── README.md`;
      } else if (lang.includes('python')) {
        return `${name}/
├── src/
│   ├── models/
│   ├── views/
│   ├── controllers/
│   └── utils/
├── tests/
├── requirements.txt
└── README.md`;
      } else if (lang.includes('java')) {
        return `${name}/
├── src/main/java/
├── src/main/resources/
├── src/test/java/
├── pom.xml
└── README.md`;
      } else {
        return `${name}/
├── src/
├── tests/
├── config/
└── README.md`;
      }
    };

    const fileTreeStructure = await getRepoStructure(repo);

    // Generate relevant files based on actual structure and task
    const getRelevantFiles = async (task: string, lang: string, repoFullName: string) => {
      try {
        const response = await fetch(`https://api.github.com/repos/${repoFullName}/contents`, {
          headers: {
            'Authorization': `token ${githubAccessToken}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        });
        
        if (!response.ok) throw new Error('Failed to fetch files');
        
        const contents = await response.json();
        const relevantFiles = [];
        
        // Always include root config files
        const configFiles = contents.filter((item: any) => 
          ['package.json', 'tsconfig.json', 'vite.config.ts', 'tailwind.config.ts', 'README.md', 'docker-compose.yml', 'Dockerfile'].includes(item.name)
        );
        
        configFiles.forEach((file: any) => {
          relevantFiles.push({
            path: file.name,
            summary: getFileSummary(file.name, lang)
          });
        });

        // Add framework-specific files based on task
        if (task.toLowerCase().includes('auth') && lang.includes('react')) {
          relevantFiles.push(
            { path: "src/hooks/useAuth.tsx", summary: "Authentication state management" },
            { path: "src/components/ProtectedRoute.tsx", summary: "Route protection logic" },
            { path: "src/pages/Auth.tsx", summary: "Authentication pages" }
          );
        }

        if (task.toLowerCase().includes('database') || task.toLowerCase().includes('data')) {
          relevantFiles.push(
            { path: "src/integrations/supabase/", summary: "Database client and types" },
            { path: "supabase/migrations/", summary: "Database schema migrations" }
          );
        }

        if (task.toLowerCase().includes('ui') || task.toLowerCase().includes('component')) {
          relevantFiles.push(
            { path: "src/components/ui/", summary: "Reusable UI components" },
            { path: "src/index.css", summary: "Global styles and design tokens" },
            { path: "tailwind.config.ts", summary: "Design system configuration" }
          );
        }

        return relevantFiles.map(f => `- ${f.path}: ${f.summary}`).join('\n');
      } catch (error) {
        // Fallback to generic files
        return `- package.json: Project dependencies and configuration
- src/main.tsx: Application entry point
- src/App.tsx: Main application component
- src/components/: Reusable UI components
- src/pages/: Application pages and routing`;
      }
    };

    // Get file summary based on filename and language
    const getFileSummary = (filename: string, lang: string) => {
      const summaries: Record<string, string> = {
        'package.json': 'Project dependencies and scripts configuration',
        'tsconfig.json': 'TypeScript compiler configuration',
        'vite.config.ts': 'Build tool configuration and plugins',
        'tailwind.config.ts': 'Design system and styling configuration',
        'README.md': 'Project documentation and setup instructions',
        'docker-compose.yml': 'Container orchestration configuration',
        'Dockerfile': 'Container build instructions'
      };
      return summaries[filename] || `${filename} configuration file`;
    };

    // Generate validation steps based on actual tech stack and task
    const getValidationSteps = (task: string, lang: string, repoName: string) => {
      const steps = [];
      
      // Framework-specific validation
      if (lang.includes('react') || lang.includes('typescript')) {
        steps.push("- Run `npm run build` to ensure compilation works");
        steps.push("- Check for TypeScript errors with `npm run type-check`");
      }
      
      if (lang.includes('python')) {
        steps.push("- Run tests with `pytest` or `python -m unittest`");
        steps.push("- Check code formatting with `black` and `flake8`");
      }
      
      // Task-specific validation
      if (task.toLowerCase().includes('auth')) {
        steps.push("- Test user registration and login flows");
        steps.push("- Verify JWT token handling and refresh logic");
        steps.push("- Test protected route access controls");
        steps.push("- Verify logout clears all session data");
      }
      
      if (task.toLowerCase().includes('database') || task.toLowerCase().includes('api')) {
        steps.push("- Test all CRUD operations via API endpoints");
        steps.push("- Verify database constraints and relationships");
        steps.push("- Test error responses for invalid data");
        steps.push("- Check database migrations run successfully");
      }
      
      if (task.toLowerCase().includes('ui') || task.toLowerCase().includes('component')) {
        steps.push("- Test responsive design on mobile, tablet, desktop");
        steps.push("- Verify keyboard navigation and screen reader support");
        steps.push("- Test dark/light mode if applicable");
        steps.push("- Validate component state changes work correctly");
      }
      
      // Repository-specific validations
      steps.push(`- Clone and run \`${repoName}\` locally to test integration`);
      steps.push("- Verify all existing functionality still works");
      steps.push("- Test the new feature end-to-end in production-like environment");
      
      return steps.join('\n');
    };

    const relevantFiles = await getRelevantFiles(userTask, language, repo.full_name);

    return `You are an AI coding assistant helping a developer modify an existing project.  
Always respect the repo structure and follow explicit instructions.  
Never hallucinate or assume functionality that is not present in the repo.

## Repository Context
**Project**: ${repoName} (${language})
**Description**: ${description}

**File structure**:
\`\`\`
${fileTreeStructure}
\`\`\`

**Key files relevant to this task**:
${relevantFiles}

## Task
${userTask}

## Implementation Requirements

### Architecture Analysis
- **Framework**: Based on the structure, this appears to be a ${getFrameworkType(language, fileTreeStructure)} project
- **Build System**: ${getBuildSystem(fileTreeStructure)}
- **Styling**: ${getStylingApproach(fileTreeStructure)}

### Database & Backend
- Check for ambiguous table/column names in existing schema
- Ensure correct table relationships are used based on current patterns
- Verify primary and foreign keys before making changes
- Do NOT introduce new tables/fields unless explicitly requested
- Follow existing database connection patterns

### Integration & Security
- Check tokens, authentication, and permissions in existing code
- Ensure secure handling of credentials following current patterns
- Use existing integration patterns from the repo
- Maintain consistent API endpoint structures

### Frontend & UI
- Follow existing component structure and naming conventions
- Ensure frontend updates reflect backend changes appropriately
- Use existing styling system and design tokens
- Maintain consistent state management patterns
- Follow existing routing and navigation patterns

### Code Quality
- Do NOT hallucinate new modules, functions, or APIs
- Avoid over-assumptions — only use code and patterns that exist
- Maintain consistent error handling with the rest of the codebase
- Follow existing code formatting and linting rules

## Validation Steps
${getValidationSteps(userTask, language, repoName)}

## Output Format
- Provide code edits with exact file paths relative to project root
- Use this format for multiple files: \`### File: path/to/file.js\`
- Include brief explanations only when implementation requires clarification
- Focus on the specific task without adding unnecessary features`;
  };

  // Helper functions for analyzing repository characteristics
  const getFrameworkType = (language: string, structure: string) => {
    if (structure.includes('vite.config') || structure.includes('src/main.tsx')) return 'React + Vite';
    if (structure.includes('next.config') || structure.includes('pages/')) return 'Next.js';
    if (structure.includes('nuxt.config')) return 'Nuxt.js';
    if (structure.includes('django') || language.includes('python')) return 'Django/Python';
    if (structure.includes('pom.xml') || language.includes('java')) return 'Spring Boot/Java';
    if (language.includes('react') || language.includes('typescript')) return 'React';
    return language || 'Web Application';
  };

  const getBuildSystem = (structure: string) => {
    if (structure.includes('vite.config')) return 'Vite';
    if (structure.includes('webpack.config')) return 'Webpack';
    if (structure.includes('package.json')) return 'npm/pnpm';
    if (structure.includes('pom.xml')) return 'Maven';
    if (structure.includes('build.gradle')) return 'Gradle';
    return 'Standard build tools';
  };

  const getStylingApproach = (structure: string) => {
    if (structure.includes('tailwind.config')) return 'Tailwind CSS';
    if (structure.includes('styled-components')) return 'Styled Components';
    if (structure.includes('.scss') || structure.includes('.sass')) return 'SCSS/Sass';
    if (structure.includes('emotion')) return 'Emotion';
    return 'CSS/Standard styling';
  };

  // Generate contextual prompts based on repository analysis
  const generateContextualPrompts = async (repo: any) => {
    const language = repo.language?.toLowerCase() || 'javascript';
    const repoName = repo.name;
    const isWebApp = language.includes('javascript') || language.includes('typescript') || language.includes('react');
    const isMobile = language.includes('swift') || language.includes('kotlin') || language.includes('dart');
    const isBackend = language.includes('python') || language.includes('java') || language.includes('go') || language.includes('rust');
    
    // Create all prompt generation tasks
    const promptTasks = [
      {
        title: `Add Authentication to ${repoName}`,
        task: generateStructuredPrompt(repo, `Implement a secure authentication system for the ${repoName} ${language} application. Include login/signup forms that match the current design system, proper session management, and protect routes appropriately.`)
      },
      {
        title: `Database Integration`,
        task: generateStructuredPrompt(repo, `Add database functionality to ${repoName} using the most appropriate database for this ${language} stack. Create models, migrations, and API endpoints that follow the existing code patterns and architecture.`)
      },
      {
        title: `Add Testing Suite`,
        task: generateStructuredPrompt(repo, `Set up comprehensive testing for the ${repoName} project using ${language}-appropriate testing frameworks. Include unit tests, integration tests, and end-to-end tests that cover the main functionality.`)
      }
    ];

    // Add language-specific prompts
    if (isWebApp) {
      promptTasks.push(
        {
          title: "Mobile Responsive Optimization",
          task: generateStructuredPrompt(repo, `Make the ${repoName} application fully mobile responsive. Analyze the current components and layouts, then optimize for mobile devices while maintaining the existing design system and user experience.`)
        },
        {
          title: "Add Real-time Features",
          task: generateStructuredPrompt(repo, `Integrate WebSocket or real-time functionality into ${repoName} using appropriate libraries for the ${language} stack. Consider the current architecture and add real-time updates where they would enhance user experience.`)
        }
      );
    }

    if (isMobile) {
      promptTasks.push(
        {
          title: "Push Notifications",
          task: generateStructuredPrompt(repo, `Implement push notifications for the ${repoName} mobile app. Set up notification services, handle permissions, and create a notification management system that works with the current ${language} architecture.`)
        },
        {
          title: "Offline Mode Support",
          task: generateStructuredPrompt(repo, `Add offline functionality to ${repoName}. Implement data caching, offline storage, and sync mechanisms that work seamlessly when the device reconnects to the internet.`)
        }
      );
    }

    if (isBackend) {
      promptTasks.push(
        {
          title: "API Rate Limiting",
          task: generateStructuredPrompt(repo, `Add rate limiting and security middleware to the ${repoName} API. Implement request throttling, authentication middleware, and monitoring that integrates with the existing ${language} backend architecture.`)
        },
        {
          title: "Background Job Processing",
          task: generateStructuredPrompt(repo, `Set up background job processing for ${repoName} using appropriate ${language} libraries. Add job queues, schedulers, and monitoring for long-running tasks.`)
        }
      );
    }

    // Resolve all prompts in parallel
    const resolvedPrompts = await Promise.all(
      promptTasks.slice(0, 6).map(async (item) => ({
        title: item.title,
        prompt: await item.task
      }))
    );

    return resolvedPrompts;
  };

  const getLanguageSpecificTips = (language: string) => {
    const lang = language?.toLowerCase() || 'javascript';
    
    if (lang.includes('javascript') || lang.includes('typescript')) {
      return [
        "Reference existing React components and hooks in your prompts.",
        "Mention TypeScript types and interfaces when applicable.",
        "Include error boundaries and loading states in feature requests.",
        "Specify responsive design requirements using the existing CSS framework."
      ];
    }
    
    if (lang.includes('python')) {
      return [
        "Mention Django/Flask patterns if using web frameworks.",
        "Include proper error handling and logging in requests.",
        "Specify database models and migrations needs.",
        "Consider async/await patterns for performance."
      ];
    }
    
    if (lang.includes('swift')) {
      return [
        "Reference existing ViewControllers and Storyboards.",
        "Include iOS design guidelines and accessibility.",
        "Mention Core Data or SwiftUI patterns as appropriate.",
        "Consider memory management and performance."
      ];
    }
    
    return [
      "Be specific about the architecture and patterns you want to follow.",
      "Include error handling, testing, and documentation requirements.",
      "Mention performance and security considerations.",
      "Reference existing code patterns and conventions in the repo."
    ];
  };

  const ghSamplePrompts: { title: string; prompt: string }[] = [
    {
      title: "Add Authentication System",
      prompt:
        "Implement a full email/password auth flow using Supabase: create /auth page with login + signup, persist sessions, redirect when logged in, protect private routes, add logout, handle errors, and include a simple profile section."
    },
    {
      title: "Implement One-off Payments (Stripe)",
      prompt:
        "Integrate Stripe one-off payments using a Supabase Edge Function (mode: payment). Add a 'Buy' button that calls the function and redirects to Checkout. Include success/cancel pages and basic error handling."
    },
    {
      title: "Onboard New Users",
      prompt:
        "Create a 3-step onboarding wizard (welcome, preferences, first action). Persist progress, allow skipping, show progress bar, mobile-friendly, and store settings to Supabase for the logged-in user."
    },
    {
      title: "Add Header Navigation Menu",
      prompt:
        "Build a responsive header with brand logo, main nav links, a user menu (when signed in), and a hamburger menu for mobile. Include keyboard navigation, focus states, and match the app's design tokens."
    },
    {
      title: "Add File Uploads",
      prompt:
        "Create drag-and-drop + browse file uploads with validation, progress bars, multiple files support, and previews for images. Show toasts for success/errors and keep the design consistent with the existing UI."
    },
    {
      title: "Create Search + Filters",
      prompt:
        "Implement search with debounce and filters (checkboxes, select, date range). Show result count, clear filters, and maintain URL query params for shareable filtered views."
    },
    {
      title: "Add Dark/Light Theme Toggle",
      prompt:
        "Add a theme toggle that persists user preference. Ensure all components look great in both themes using the existing design tokens and proper contrast."
    },
    {
      title: "Improve Accessibility",
      prompt:
        "Audit and improve accessibility: aria labels, roles, keyboard navigation, focus outlines, proper color contrast, and semantic HTML across pages."
    }
  ];
  
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🔍 GitHubConnect mounted, user:', user?.id);
    
    // Check if user is authenticated
    if (!user) {
      console.log('❌ No user found, redirecting to auth');
      navigate('/auth');
      return;
    }

    // Check for GitHub OAuth callback
    const checkForGitHubCallback = async () => {
      console.log('🔄 Checking for GitHub callback...');
      
      const { data: { session } } = await supabase.auth.getSession();
      const isLinkingGitHub = localStorage.getItem('linkingGitHub') === 'true';
      const originalUserId = localStorage.getItem('originalUserId');
      
      console.log('📋 Session data:', {
        hasSession: !!session,
        hasProviderToken: !!session?.provider_token,
        appProvider: session?.user?.app_metadata?.provider,
        userMetadata: session?.user?.user_metadata,
        isLinkingGitHub,
        originalUserId,
        currentUserId: session?.user?.id
      });
      
      if (session?.provider_token && session?.user?.app_metadata?.provider === 'github') {
        console.log('✅ Found GitHub provider token');
        
        const isLinkingGitHub = localStorage.getItem('linkingGitHub') === 'true';
        const originalUserId = localStorage.getItem('originalUserId');
        
        if (isLinkingGitHub && originalUserId) {
          console.log('🔗 Handling GitHub linking with data migration');
          
          // Migrate all user data from original email user to this GitHub user
          await migrateUserData(originalUserId, session.user.id);
          
          // Save GitHub connection data to the new GitHub user profile
          await saveGitHubConnection(session.provider_token, session.user?.user_metadata || {});
          
          // Clean up linking state
          localStorage.removeItem('linkingGitHub');
          localStorage.removeItem('originalUserId');
          localStorage.removeItem('originalUserEmail');
          
          toast({
            title: "GitHub Connected & Data Migrated!",
            description: "Your account is now fully connected with GitHub. All your projects and data have been transferred.",
          });
          
          // Stay logged in as the GitHub user (don't sign out)
          window.location.href = '/github';
          return;
        } else {
          // Normal GitHub login flow
          await saveGitHubConnection(session.provider_token, session.user?.user_metadata || {});
        }
      } else {
        console.log('ℹ️ No provider token found, checking existing connection');
        await checkGitHubConnection();
      }
    };

    checkForGitHubCallback();
  }, [user, navigate]);

  const checkGitHubConnection = async () => {
    if (!user) return;

    console.log('🔍 Checking GitHub connection for user:', user.id);

    try {
      const { data: profile, error } = await supabase
        .from('profiles_secure')
        .select('has_github_token, github_username, github_connected_at')
        .eq('id', user.id)
        .maybeSingle();

      console.log('👤 Profile check result:', {
        hasProfile: !!profile,
        hasToken: !!(profile as any)?.has_github_token,
        username: (profile as any)?.github_username,
        connectedAt: (profile as any)?.github_connected_at,
        error: (error as any)?.message
      });

      if (!error && (profile as any)?.has_github_token) {
        console.log('✅ GitHub connection found, setting connected state');
        setIsConnected(true);
        setUserInfo({ username: (profile as any).github_username });
        // Don't automatically fetch repositories - wait for user to click "Show Repo"
      } else {
        console.log('❌ No GitHub connection found');
        setIsConnected(false);
      }
    } catch (error) {
      console.error('💥 Error checking GitHub connection:', error);
      setIsConnected(false);
    }
  };

  const saveGitHubConnection = async (accessToken: string, userData: any) => {
    if (!user) return;
    
    console.log('💾 Saving GitHub connection...', {
      userId: user.id,
      hasToken: !!accessToken,
      userData: userData
    });
    
    try {
      const authToken = (await supabase.auth.getSession()).data.session?.access_token;
      
      const normalized = {
        login: userData?.user_name || userData?.login || userData?.preferred_username || 'github-user',
        id: (userData?.user_id || userData?.id || userData?.sub || '').toString(),
      };
      
      console.log('🔄 Calling saveGitHubConnection function with:', normalized);
      
      const response = await supabase.functions.invoke('github-repos', {
        body: {
          action: 'saveGitHubConnection',
          accessToken,
          githubUserData: normalized,
        },
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });

      console.log('📡 Edge function response:', response);

      if (response.error) {
        console.error('❌ Edge function error:', response.error);
        throw new Error(response.error.message || 'Edge function failed');
      }

      if (response.data?.error) {
        console.error('❌ Edge function returned error:', response.data.error);
        throw new Error(response.data.error);
      }

      console.log('✅ GitHub connection saved, refreshing status');
      // Refresh connection status after saving
      await checkGitHubConnection();
    } catch (error: any) {
      console.error('💥 Error saving GitHub connection:', error);
      toast({
        title: "Connection failed",
        description: error.message || "Failed to save GitHub connection",
        variant: "destructive"
      });
    }
  };

  const migrateUserData = async (fromUserId: string, toUserId: string) => {
    console.log('🔄 Migrating user data...', {
      fromUserId,
      toUserId
    });
    
    try {
      // Call the migration function in Supabase
      const { error } = await supabase.rpc('migrate_user_data', {
        from_user_id: fromUserId,
        to_user_id: toUserId
      });

      if (error) {
        console.error('❌ Migration error:', error);
        throw error;
      }

      console.log('✅ User data migration completed successfully');
    } catch (error: any) {
      console.error('💥 Error migrating user data:', error);
      throw new Error(`Failed to migrate user data: ${error.message}`);
    }
  };

  const saveGitHubConnectionToUser = async (userId: string, accessToken: string, userData: any) => {
    console.log('🔗 Saving GitHub connection to specific user...', {
      targetUserId: userId,
      hasToken: !!accessToken,
      userData: userData
    });
    
    try {
      const normalized = {
        login: userData?.user_name || userData?.login || userData?.preferred_username || 'github-user',
        id: (userData?.user_id || userData?.id || userData?.sub || '').toString(),
      };
      
      // Store token securely using RPC and update non-sensitive profile data
      const { error } = await supabase.rpc('update_github_token', {
        user_id_param: userId,
        new_token: accessToken,
        github_user_data: normalized as any,
      });

      if (error) {
        console.error('❌ Database error:', error);
        throw error;
      }

      console.log('✅ GitHub connection saved to user profile');
      
      toast({
        title: "GitHub Connected!",
        description: `Successfully linked GitHub account (@${normalized.login}) to your email account.`,
      });
    } catch (error: any) {
      console.error('💥 Error saving GitHub connection to user:', error);
      toast({
        title: "Connection failed",
        description: error.message || "Failed to link GitHub account",
        variant: "destructive"
      });
    }
  };

  const fetchRepositories = async () => {
    if (!user) return;
    
    console.log('📂 Fetching repositories for user:', user.id);
    
    try {
      setIsLoading(true);
      
      const authToken = (await supabase.auth.getSession()).data.session?.access_token;
      
      console.log('🔄 Calling fetchRepos function...');
      
      const response = await supabase.functions.invoke('github-repos', {
        body: {
          action: 'fetchRepos'
        },
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });

      console.log('📡 Fetch repos response:', response);

      if (response.error) {
        console.error('❌ Fetch repos error:', response.error);
        throw new Error(response.error.message);
      }

      if (response.data?.repositories) {
        console.log('✅ Repositories loaded:', response.data.repositories.length);
        setRepositories(response.data.repositories);
        
        // Show success message with GitHub username and repo count
        const username = userInfo?.username || response.data.username || 'your GitHub account';
        toast({
          title: `Connected to ${username}!`,
          description: `Successfully loaded ${response.data.repositories.length} repositories from your GitHub account.`,
        });
      }
    } catch (error: any) {
      console.error('💥 Error fetching repositories:', error);
      
      // Provide specific error messages based on the error type
      let errorMessage = error.message || "Could not fetch GitHub repositories";
      let errorTitle = "Failed to load repositories";
      
      if (error.message?.includes('GitHub account not connected')) {
        errorTitle = "GitHub Connection Lost";
        errorMessage = "Your GitHub connection has expired. Please reconnect your account.";
        setIsConnected(false);
        setUserInfo(null);
      } else if (error.message?.includes('GitHub API error: 401')) {
        errorTitle = "GitHub Token Expired";
        errorMessage = "Your GitHub access token has expired. Please reconnect your account.";
        setIsConnected(false);
        setUserInfo(null);
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const ensureTokenAndFetch = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔎 ensureTokenAndFetch check:', {
        isConnected,
        hasProviderToken: !!session?.provider_token,
        provider: session?.user?.app_metadata?.provider
      });

      if (!isConnected && session?.provider_token && session?.user?.app_metadata?.provider === 'github') {
        console.log('🔐 Provider token found in session; saving connection...');
        await saveGitHubConnection(session.provider_token, session.user.user_metadata || {});
        await fetchRepositories();
        return;
      }

      if (isConnected) {
        if (!showRepositories) {
          setShowRepositories(true);
          await fetchRepositories();
        } else {
          setShowRepositories(false);
        }
        return;
      }

      await handleConnect();
    } catch (e) {
      console.error('💥 ensureTokenAndFetch error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to connect your GitHub account",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    // Check if the current email user already has a GitHub account associated
    if (user.app_metadata?.provider === 'email') {
      toast({
        title: "No GitHub Account Found",
        description: "There is no GitHub account associated with your login email. Please login with another email or login with GitHub directly!",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    console.log('🔗 Starting GitHub OAuth connection for existing user...');
    setIsLoading(true);
    
    try {
      // Store current user state for migration after GitHub OAuth
      localStorage.setItem('linkingGitHub', 'true');
      localStorage.setItem('originalUserId', user.id);
      localStorage.setItem('originalUserEmail', user.email || '');
      
      // Use signInWithOAuth but we'll handle the user merge in the callback
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          scopes: 'repo read:user',
          redirectTo: `${window.location.origin}/github`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        console.error('❌ GitHub OAuth error:', error);
        localStorage.removeItem('linkingGitHub');
        localStorage.removeItem('originalUserId');
        throw error;
      }

      console.log('✅ GitHub OAuth initiated successfully');
    } catch (error: any) {
      console.error('💥 GitHub OAuth error:', error);
      toast({
        title: "Connection failed",
        description: error.message || "Failed to connect GitHub account",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };


  const handleAnalyzeRepo = async (repo: Repository) => {
    if (!user || !isConnected) {
      toast({
        title: "Not connected",
        description: "Please connect your GitHub account first",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const authToken = (await supabase.auth.getSession()).data.session?.access_token;
      
      // Fetch repository contents
      const response = await supabase.functions.invoke('github-repos', {
        body: {
          action: 'fetchRepoContents',
          repo_owner: repo.full_name.split('/')[0],
          repo_name: repo.full_name.split('/')[1]
        },
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.files) {
        // Normalize files to always have a `path` field
        const normalizedFiles = response.data.files.map((f: any) => ({
          ...f,
          path: typeof f?.path === 'string' ? f.path : f?.name || '',
        })).filter((f: any) => f.path);

        // Organize files by first-level folder structure for better display
        const organizedFiles = organizeFilesByFolder(normalizedFiles);
        setRepoFiles(organizedFiles);
        setAllFiles(normalizedFiles);
        setCurrentAnalysisRepo(repo);
        // Select all files by default (only valid ones)
        const allFilePaths = normalizedFiles.map((file: any) => file.path);
        setSelectedFiles(new Set(allFilePaths));
        // Enter analyzing mode instead of showing modal
        setIsAnalyzingMode(true);
        setAnalysisResult(""); // Clear previous results
        // Load feature suggestions immediately for quick demo
        loadFeatureSuggestions();
      }
    } catch (error: any) {
      console.error('Error analyzing repository:', error);
      toast({
        title: "Analysis failed",
        description: error.message || "Could not analyze repository",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to organize files by folder structure (first level only)
  const organizeFilesByFolder = (files: any[]) => {
    const organized: { [key: string]: any[] } = {
      'root': [] // Files in the root directory
    };

    files.forEach(file => {
      // Skip files without a valid path
      if (!file || !file.path || typeof file.path !== 'string') {
        console.warn('Skipping file with invalid path:', file);
        return;
      }

      const pathParts = file.path.split('/');
      
      if (pathParts.length === 1) {
        // Root level file
        organized.root.push(file);
      } else {
        // File in a folder
        const folderName = pathParts[0];
        if (!organized[folderName]) {
          organized[folderName] = [];
        }
        organized[folderName].push(file);
      }
    });

    return organized;
  };

  const handleFileSelection = (filePath: string, checked: boolean) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(filePath);
      } else {
        newSet.delete(filePath);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Filter out files without valid paths
      const validFilePaths = allFiles
        .filter(file => file && file.path && typeof file.path === 'string')
        .map(file => file.path);
      setSelectedFiles(new Set(validFilePaths));
    } else {
      setSelectedFiles(new Set());
    }
  };

  const handleStartAnalysis = async () => {
    if (selectedFiles.size === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one file to analyze.",
        variant: "destructive",
      });
      return;
    }

    console.log("Starting analysis with selected files:", Array.from(selectedFiles));
    
    // Clear previous results and start analyzing
    setAnalysisResult("");
    setIsAnalyzing(true);

    try {
      // Get selected files content
      const selectedFilesData = allFiles.filter(file => 
        selectedFiles.has(file.path)
      );

      // Apply client-side limits to avoid oversized request payloads
      const MAX_FILES = 40;
      const MAX_CHARS_PER_FILE = 4000;
      const TOTAL_CHAR_BUDGET = 120000;

      let remaining = TOTAL_CHAR_BUDGET;
      const payloadFiles = [] as any[];
      for (const f of selectedFilesData.slice(0, MAX_FILES)) {
        if (remaining <= 0) break;
        const sliceLen = Math.min(MAX_CHARS_PER_FILE, Math.max(0, remaining));
        const content = (f.content || '').slice(0, sliceLen);
        if (!content) continue;
        remaining -= content.length;
        payloadFiles.push({ path: f.path || f.name, content, type: f.type });
      }

      if (payloadFiles.length === 0) {
        throw new Error('Selected files are empty or too large to analyze. Try selecting fewer files.');
      }

      // Make streaming request to the edge function
      const SUPABASE_URL = "https://wfywmkdqyuucxftpvmfj.supabase.co";
      const response = await fetch(`${SUPABASE_URL}/functions/v1/analyze-github-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: payloadFiles,
          repoName: currentAnalysisRepo?.name,
          model: selectedModel
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'delta' && data.text) {
                // Append text chunk to the analysis result
                setAnalysisResult(prev => prev + data.text);
              } else if (data.type === 'complete') {
                console.log('✅ Analysis complete, loading suggestions...');
                setIsAnalyzing(false);
                toast({
                  title: "Analysis Complete",
                  description: `Successfully analyzed ${selectedFiles.size} files from ${currentAnalysisRepo?.name}.`,
                });
                // Load feature suggestions after analysis completes
                loadFeatureSuggestions();
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error: any) {
      console.error("Analysis failed:", error);
      toast({
        title: "Analysis Failed",
        description: error.message || "An error occurred during analysis.",
        variant: "destructive",
      });
      setIsAnalyzing(false);
    } finally {
      // Keep context for the modal; cleanup happens when modal closes
    }
  };

  const startAnalysis = async (files: any[]) => {
    setIsAnalyzing(true);
    setAnalysis("");

    try {
      const SUPABASE_URL = "https://wfywmkdqyuucxftpvmfj.supabase.co";
      const authToken = (await supabase.auth.getSession()).data.session?.access_token;
      const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmeXdta2RxeXV1Y3hmdHB2bWZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NjkwNjEsImV4cCI6MjA3MTE0NTA2MX0.elHXCxBIqmz0IlcuOcKlY0gnIB88wK4rgbbpz9be244";

      const response = await fetch(`${SUPABASE_URL}/functions/v1/analyze-codebase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken || SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          analysisId: `github-${currentRepo?.id}-${Date.now()}`,
          files: files.map(file => ({
            name: file.path,
            content: file.content || '',
            type: file.type || 'other'
          })),
          isDirectAnalysis: true
        })
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to start analysis');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'delta' && data.text) {
                setAnalysis(prev => prev + data.text);
              } else if (data.type === 'complete') {
                setIsAnalyzing(false);
                toast({
                  title: "Analysis completed",
                  description: `Successfully analyzed ${files.length} files.`,
                });
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      setIsAnalyzing(false);
      toast({
        title: "Analysis failed",
        description: "There was an error analyzing your files. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatAnalysis = (text: string) => {
    if (!text) return null;

    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let currentIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={currentIndex++} className="text-2xl font-bold mt-6 mb-3 text-foreground">
            {line.substring(2)}
          </h1>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={currentIndex++} className="text-xl font-semibold mt-5 mb-2 text-foreground">
            {line.substring(3)}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={currentIndex++} className="text-lg font-medium mt-4 mb-2 text-foreground">
            {line.substring(4)}
          </h3>
        );
      } else if (line.startsWith('```')) {
        let codeBlock = '';
        i++;
        while (i < lines.length && !lines[i].startsWith('```')) {
          codeBlock += lines[i] + '\n';
          i++;
        }
        elements.push(
          <pre key={currentIndex++} className="bg-muted p-4 rounded-lg my-3 overflow-x-auto">
            <code className="text-sm text-muted-foreground">{codeBlock}</code>
          </pre>
        );
      } else if (line.startsWith('- ')) {
        const listItems = [line];
        while (i + 1 < lines.length && lines[i + 1].startsWith('- ')) {
          i++;
          listItems.push(lines[i]);
        }
        elements.push(
          <ul key={currentIndex++} className="list-disc list-inside my-3 space-y-1">
            {listItems.map((item, idx) => (
              <li key={idx} className="text-muted-foreground">{item.substring(2)}</li>
            ))}
          </ul>
        );
      } else if (line.trim() !== '') {
        const boldRegex = /\*\*(.*?)\*\*/g;
        const parts = line.split(boldRegex);
        const formattedLine = parts.map((part, idx) => 
          idx % 2 === 1 ? <strong key={idx} className="font-semibold">{part}</strong> : part
        );
        
        elements.push(
          <p key={currentIndex++} className="mb-2 text-muted-foreground leading-relaxed">
            {formattedLine}
          </p>
        );
      }
    }

    return elements;
  };

  const handleDisconnect = async () => {
    if (!user) return;
    
    try {
      const authToken = (await supabase.auth.getSession()).data.session?.access_token;
      
      const response = await supabase.functions.invoke('github-repos', {
        body: {
          action: 'disconnectGitHub'
        },
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      // Update local state
      setIsConnected(false);
      setGithubAccessToken(null);
      setRepositories([]);
      setUserInfo(null);
      
      toast({
        title: "Disconnected",
        description: "GitHub account disconnected successfully",
      });
    } catch (error: any) {
      console.error('Error disconnecting GitHub:', error);
      toast({
        title: "Disconnect failed",
        description: error.message || "Failed to disconnect GitHub account",
        variant: "destructive"
      });
    }
  };

  const filteredRepos = repositories.filter(repo =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (showAnalysis) {
    return (
      <div className="min-h-screen pt-20 px-6">
        <div className="max-w-full mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-1">
                Analysis: {currentRepo?.name}
              </h1>
              <p className="text-muted-foreground text-sm">
                {currentRepo?.description}
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowAnalysis(false)}
            >
              Back to Repositories
            </Button>
          </div>

          <div className="flex gap-6 h-[calc(100vh-8rem)]">
            {/* Left Panel - Files */}
            <div className="w-1/3 bg-card/50 backdrop-blur-sm rounded-lg border p-4 overflow-y-auto">
              <h3 className="font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">
                Repository Files ({analyzedFiles.length})
              </h3>
              <div className="space-y-2">
                {analyzedFiles.map((file, index) => (
                  <div 
                    key={index}
                    className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="text-sm font-medium truncate">{file.path}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {file.type} • {file.content ? `${file.content.length} chars` : 'Empty'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Panel - Analysis */}
            <div className="flex-1 bg-card/50 backdrop-blur-sm rounded-lg border p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                  Analysis Report
                </h3>
                {isAnalyzing && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                    Analyzing...
                  </div>
                )}
              </div>

              {analysis ? (
                <div className="prose prose-sm max-w-none">
                  {formatAnalysis(analysis)}
                </div>
              ) : isAnalyzing ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Analyzing repository files...</p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No analysis available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
              GitHub Integration
            </h1>
            <p className="text-muted-foreground">
              Connect and manage your GitHub repositories
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center text-sm text-muted-foreground">
            <Github className="w-4 h-4 mr-2" />
            {isConnected ? `Connected as ${userInfo?.username || 'GitHub User'}` : 'GitHub Integration'}
          </div>
          <div className="flex gap-2">
            {isConnected && userInfo?.username && (
              <Button variant="outline" size="sm" asChild>
                <a 
                  href={`https://github.com/${userInfo.username}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View GitHub Profile
                </a>
              </Button>
            )}
            <Button 
              variant="hero" 
              onClick={ensureTokenAndFetch}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isConnected ? 'Loading...' : 'Connecting...'}
                </div>
              ) : (
                <>
                  <Github className="w-4 h-4 mr-2" />
                  {isConnected ? (showRepositories ? 'Hide Repo' : 'Show Repo') : 'Connect GitHub'}
                </>
              )}
            </Button>
            {isConnected && (
              <Button variant="outline" size="sm" onClick={handleDisconnect}>
                Disconnect
              </Button>
            )}
          </div>
        </div>

        {/* AI Settings - Show when connected */}
        {isConnected && (
          <Card className="p-4 mb-6 bg-card/30 backdrop-blur-sm border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  AI Analysis Settings
                </h3>
                <p className="text-xs text-muted-foreground">
                  Choose which Claude model to use for repository analysis and prompt generation
                </p>
              </div>
              <div className="w-64">
                <ModelSelector 
                  selectedModel={selectedModel} 
                  onModelChange={setSelectedModel}
                />
              </div>
            </div>
          </Card>
        )}

        {!isConnected && !isLoading && repositories.length === 0 && (
          <Card className="p-8 bg-card/50 backdrop-blur-sm text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-primary/20 rounded-full flex items-center justify-center">
              <Github className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Connect GitHub Account</h3>
            <p className="text-muted-foreground mb-4">
              Click "Connect GitHub" to link your GitHub account and view your repositories
            </p>
            <div className="mt-4 p-4 bg-muted/50 rounded-lg border-l-4 border-primary">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> To connect GitHub, please login with GitHub directly or use the email address associated with your GitHub account.
              </p>
            </div>
          </Card>
        )}

        {isConnected && showRepositories && (
          <div>
            {/* Two-panel Analysis Mode */}
            {isAnalyzingMode ? (
              <div className="mb-6">
                {/* Back Button */}
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAnalyzingMode(false);
                    setSelectedFiles(new Set());
                    setRepoFiles({});
                    setAllFiles([]);
                    setCurrentAnalysisRepo(null);
                    setAnalysisResult("");
                    setIsAnalyzing(false);
                    setFeatureSuggestions([]);
                    setGeneratedPrompt("");
                    setSelectedSuggestion(null);
                  }}
                  className="mb-4"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Repositories
                </Button>

                {/* Two-Panel Layout */}
                <ResizablePanelGroup direction="horizontal" className="min-h-[600px] rounded-lg border">
                  {/* Left Panel - File Selection or Feature Suggestions */}
                  <ResizablePanel defaultSize={40} minSize={30}>
                    <div className="h-full flex flex-col p-6 bg-background">
                      {/* Always show feature suggestions in demo mode */}
                      <div className="mb-6">
                        <h2 className="text-xl font-semibold mb-1">Quick Feature Suggestions</h2>
                        <p className="text-sm text-muted-foreground">
                          Click any feature to generate an AI prompt
                        </p>
                      </div>

                      <ScrollArea className="flex-1">
                        {isLoadingSuggestions ? (
                          <div className="flex flex-col items-center justify-center h-full space-y-4">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Loading suggestions...</p>
                          </div>
                        ) : featureSuggestions.length > 0 ? (
                          <FeatureSuggestions 
                            suggestions={featureSuggestions}
                            onSuggestionClick={handleSuggestionClick}
                            isGenerating={isGenerating}
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full space-y-4 text-center px-4">
                            <Lightbulb className="w-12 h-12 text-muted-foreground/50" />
                            <div>
                              <h3 className="font-semibold mb-2">Loading Features...</h3>
                              <p className="text-sm text-muted-foreground">
                                Feature suggestions will appear here
                              </p>
                            </div>
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                  </ResizablePanel>

                  <ResizableHandle withHandle />

                  {/* Right Panel - Analysis Results or Generated Prompt */}
                  <ResizablePanel defaultSize={60} minSize={40}>
                    <div className="h-full flex flex-col p-6 bg-muted/20">
                      <div className="mb-4">
                        <h2 className="text-xl font-semibold mb-1">
                          {generatedPrompt ? 'Generated Prompt' : 'Analysis Report'}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {generatedPrompt 
                            ? selectedSuggestion?.title 
                            : isAnalyzing ? 'Analyzing your code...' : analysisResult ? 'Analysis complete' : 'Results will appear here'
                          }
                        </p>
                      </div>

                      <ScrollArea className="flex-1">
                        {generatedPrompt ? (
                          // Show Generated Prompt
                          <div className="space-y-4">
                            <Card className="p-6 bg-background">
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <h3 className="font-semibold text-lg mb-1">{selectedSuggestion?.title}</h3>
                                  <p className="text-sm text-muted-foreground">{selectedSuggestion?.description}</p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => copyToClipboard(generatedPrompt)}
                                >
                                  <Copy className="w-4 h-4 mr-2" />
                                  Copy Prompt
                                </Button>
                              </div>
                              
                              <Separator className="my-4" />
                              
                              <div className="prose prose-sm max-w-none">
                                <pre className="whitespace-pre-wrap bg-muted p-4 rounded-lg text-sm">
                                  {generatedPrompt}
                                </pre>
                              </div>
                            </Card>
                            
                            <Button
                              variant="ghost"
                              onClick={() => {
                                setGeneratedPrompt("");
                                setSelectedSuggestion(null);
                              }}
                              className="w-full"
                            >
                              Back to Analysis
                            </Button>
                          </div>
                        ) : analysisResult ? (
                          // Show Analysis Report
                          <div className="prose prose-sm max-w-none bg-background p-4 rounded-lg">
                            {formatAnalysis(analysisResult)}
                          </div>
                        ) : isAnalyzing ? (
                          <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-muted-foreground">Analyzing your code...</p>
                            <p className="text-sm text-muted-foreground mt-2">This may take a few moments</p>
                          </div>
                        ) : (
                          <div className="text-center py-12 text-muted-foreground">
                            <p>Select files and click "Start Analysis" to begin</p>
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                  </ResizablePanel>
                </ResizablePanelGroup>
              </div>
            ) : (
              /* Repository List View */
              <div>

            {repositories.length > 0 && (
              <>
                <div className="mb-6">
                  <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search repositories..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="grid gap-4">
                  {filteredRepos.map((repo) => (
                    <Card 
                      key={repo.id} 
                      className="p-6 hover:shadow-elegant transition-all duration-300 bg-card/50 backdrop-blur-sm"
                    >
                      <div className="flex items-start justify-between flex-wrap gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold flex items-center">
                              {repo.name}
                              {repo.private && (
                                <span className="ml-2 text-xs bg-muted px-2 py-1 rounded">
                                  Private
                                </span>
                              )}
                            </h3>
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <p className="text-muted-foreground mb-4">
                            {repo.description}
                          </p>
                          
                          <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <div className="w-3 h-3 rounded-full bg-accent mr-2"></div>
                              {repo.language}
                            </div>
                            <div className="flex items-center">
                              <Star className="w-4 h-4 mr-1" />
                              {repo.stars}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              Updated {repo.updatedAt}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 flex-wrap justify-end">
                          <Button variant="outline">
                            <GitBranch className="w-4 h-4 mr-2" />
                            Branches
                          </Button>
                          <Button 
                            variant="hero"
                            onClick={() => handleAnalyzeRepo(repo)}
                          >
                            Analyze Code
                          </Button>
                          
                          <Dialog onOpenChange={(open) => {
                            if (open) {
                              setCurrentRepo(repo);
                              // Clear previous generated prompt for new repo
                              setGeneratedPrompt("");
                              setFeatureInput("");
                              loadContextualPrompts(repo);
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button variant="outline">
                                <Lightbulb className="w-4 h-4 mr-2" />
                                Prompt Strategy
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh]">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <Lightbulb className="w-5 h-5 text-primary" />
                                  AI Prompt Strategy for {repo.name}
                                </DialogTitle>
                                <DialogDescription>
                                  Generate optimized prompts for your {repo.language} codebase
                                </DialogDescription>
                              </DialogHeader>
                              <ScrollArea className="max-h-[60vh]">
                                <div className="space-y-6">
                                  {/* Feature Input Section */}
                                  <div className="space-y-3">
                                    <Label htmlFor="feature-input" className="text-sm font-semibold">
                                      Describe the feature you want to implement:
                                    </Label>
                                    <Textarea
                                      id="feature-input"
                                      placeholder="e.g., Add user authentication with login/logout functionality"
                                      value={featureInput}
                                      onChange={(e) => setFeatureInput(e.target.value)}
                                      className="min-h-[80px]"
                                    />
                                    <Button
                                      onClick={() => generatePrompt()}
                                      disabled={isGenerating || !featureInput.trim()}
                                      className="w-full"
                                    >
                                      {isGenerating ? (
                                        <>
                                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                          Generating...
                                        </>
                                      ) : (
                                        <>
                                          <Send className="h-4 w-4 mr-2" />
                                          Generate Optimized Prompt
                                        </>
                                      )}
                                    </Button>
                                  </div>

                                  {/* Generated Prompt Section */}
                                  {generatedPrompt && (
                                    <>
                                      <Separator />
                                      <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                          <h4 className="font-semibold text-sm">Generated Prompt</h4>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => copyToClipboard(generatedPrompt)}
                                            className="h-8"
                                          >
                                            <Copy className="h-4 w-4 mr-1" />
                                            Copy
                                          </Button>
                                        </div>
                                        <div className="text-sm bg-muted p-4 rounded-md whitespace-pre-wrap">
                                          {generatedPrompt}
                                        </div>
                                      </div>
                                    </>
                                  )}
                                  
                                  <Separator />
                                  
                                   {/* Predefined Prompts */}
                                   <div className="space-y-4">
                                     <h4 className="font-semibold text-sm">Quick Start Prompts</h4>
                                     <div className="grid gap-3">
                                       {contextualPrompts.map((s, i) => (
                                         <div key={i} className="border border-border rounded-lg overflow-hidden">
                                           <div className="p-4 bg-muted/30">
                                             <div className="flex items-start justify-between mb-2">
                                               <h5 className="font-medium text-foreground">{s.title}</h5>
                                               <Button 
                                                 variant="ghost" 
                                                 size="sm" 
                                                 className="text-xs" 
                                                 onClick={() => copyToClipboard(s.prompt)}
                                               >
                                                 <Copy className="w-3 h-3 mr-1" /> Copy Full Prompt
                                               </Button>
                                             </div>
                                             <p className="text-xs text-muted-foreground mb-3">
                                               Structured prompt with repository analysis, implementation requirements, and validation steps
                                             </p>
                                           </div>
                                           <details className="group">
                                             <summary className="cursor-pointer p-3 hover:bg-muted/20 text-sm font-medium flex items-center justify-between">
                                               <span>Preview Prompt Structure</span>
                                               <div className="text-xs text-muted-foreground group-open:hidden">Click to expand</div>
                                               <div className="text-xs text-muted-foreground hidden group-open:block">Click to collapse</div>
                                             </summary>
                                             <div className="p-4 pt-0 border-t border-border/50">
                                               <div className="text-xs space-y-2 text-muted-foreground">
                                                 <div className="font-medium text-foreground">📁 Repository Context</div>
                                                 <div className="ml-3">• Project structure analysis</div>
                                                 <div className="ml-3">• Framework detection ({currentRepo?.language})</div>
                                                 <div className="ml-3">• Key files identification</div>
                                                 
                                                 <div className="font-medium text-foreground mt-3">🎯 Task Definition</div>
                                                 <div className="ml-3">• {s.title.toLowerCase()}</div>
                                                 
                                                 <div className="font-medium text-foreground mt-3">⚙️ Implementation Requirements</div>
                                                 <div className="ml-3">• Architecture guidelines</div>
                                                 <div className="ml-3">• Security considerations</div>
                                                 <div className="ml-3">• Code quality standards</div>
                                                 
                                                 <div className="font-medium text-foreground mt-3">✅ Validation Steps</div>
                                                 <div className="ml-3">• Testing procedures</div>
                                                 <div className="ml-3">• Performance checks</div>
                                                 <div className="ml-3">• Integration validation</div>
                                               </div>
                                               <Button 
                                                 variant="outline" 
                                                 size="sm" 
                                                 className="w-full mt-4" 
                                                 onClick={() => copyToClipboard(s.prompt)}
                                               >
                                                 <Copy className="w-3 h-3 mr-2" />
                                                 Copy Complete Structured Prompt
                                               </Button>
                                             </div>
                                           </details>
                                         </div>
                                       ))}
                                     </div>
                                   </div>
                                  
                                  <Separator />
                                  
                                  <div className="space-y-3">
                                    <h4 className="font-semibold text-sm">Pro Tips for {repo.language}</h4>
                                    <ul className="text-sm text-muted-foreground space-y-2">
                                      {getLanguageSpecificTips(repo.language).map((tip, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                          <span className="text-primary font-bold mt-1">•</span>
                                          {tip}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </ScrollArea>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {repositories.length === 0 && !isLoading && isConnected && (
              <Card className="p-12 text-center">
                <Github className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No repositories loaded</h3>
                <p className="text-muted-foreground mb-4">
                  Click "Show GitHub Repos" to load your accessible repositories
                </p>
              </Card>
            )}

            {filteredRepos.length === 0 && searchTerm && repositories.length > 0 && !isLoading && (
              <Card className="p-12 text-center">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No repositories found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search terms or check if you have access to the repository
                </p>
              </Card>
            )}
          </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GitHubConnect;
