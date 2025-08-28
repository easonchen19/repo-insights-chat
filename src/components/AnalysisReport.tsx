
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Brain, Clock, FileText, Users, TrendingUp, AlertTriangle, CheckCircle, XCircle, Info, BookOpen, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useModelSelection } from "./ModelSelector";

interface AnalysisReportProps {
  projectId: string;
  projectName: string;
  onAnalysisComplete?: (analysis: string) => void;
}

const AnalysisReport = ({ projectId, projectName, onAnalysisComplete }: AnalysisReportProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const { selectedModel } = useModelSelection();
  const { toast } = useToast();

  const samplePrompts = [
    {
      title: "Adding User Authentication",
      prompt: "Add user authentication with email/password signup and login. Include a profiles table to store user data like username and avatar. Create a dedicated /auth page with both signup and login forms, and protect routes that require authentication.",
      category: "Authentication"
    },
    {
      title: "User Onboarding Flow",
      prompt: "Create a 3-step onboarding flow for new users: 1) Welcome screen with app overview, 2) Profile setup form (name, bio, preferences), 3) Tutorial walkthrough of main features. Include progress indicators and skip options.",
      category: "Onboarding"
    },
    {
      title: "Payment Integration",
      prompt: "Add Stripe payment integration for subscription billing. Create a pricing page with 3 tiers (Basic $9/month, Pro $29/month, Enterprise $99/month). Include payment forms, subscription management, and billing history page.",
      category: "Payments"
    },
    {
      title: "Dashboard with Analytics",
      prompt: "Build a user dashboard with analytics charts showing user activity, growth metrics, and key performance indicators. Include filter options for date ranges and export functionality for reports.",
      category: "Dashboard"
    },
    {
      title: "File Upload System",
      prompt: "Create a file upload component that supports drag & drop, multiple file selection, and progress indicators. Store files in Supabase storage with proper access controls. Include file preview and delete functionality.",
      category: "File Management"
    },
    {
      title: "Real-time Chat Feature",
      prompt: "Add a real-time chat system where users can send messages in channels. Include message history, typing indicators, online status, and message reactions using Supabase realtime subscriptions.",
      category: "Real-time Features"
    },
    {
      title: "Search & Filtering",
      prompt: "Implement a powerful search system with filters for the main content. Include text search, category filters, date range selection, and sorting options. Add search suggestions and recent searches.",
      category: "Search"
    },
    {
      title: "Email Notifications",
      prompt: "Set up email notification system using Supabase Edge Functions and Resend. Include welcome emails, password reset, activity notifications, and user preference management for email types.",
      category: "Notifications"
    }
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard!",
      description: "You can now paste this prompt in your chat.",
    });
  };

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysis(''); // Clear previous analysis
    
    try {
      const SUPABASE_URL = "https://wfywmkdqyuucxftpvmfj.supabase.co";
      const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmeXdta2RxeXV1Y3hmdHB2bWZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NjkwNjEsImV4cCI6MjA3MTE0NTA2MX0.elHXCxBIqmz0IlcuOcKlY0gnIB88wK4rgbbpz9be244";
      const authToken = (await supabase.auth.getSession()).data.session?.access_token;
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/analyze-codebase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken || SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ projectId, model: selectedModel })
      });

      if (!response.ok) {
        throw new Error('Failed to start analysis');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response stream');
      }

      let accumulatedText = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'delta' && data.text) {
                accumulatedText += data.text;
                setAnalysis(accumulatedText);
              } else if (data.type === 'complete') {
                toast({
                  title: "Analysis Complete",
                  description: `Successfully analyzed ${data.fileCount} files in ${projectName}`,
                });
                onAnalysisComplete?.(accumulatedText);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze the codebase. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatAnalysis = (text: string) => {
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    let currentList: string[] = [];
    let isInCodeBlock = false;
    let codeBlockContent: string[] = [];

    // Check if this appears to be an AI-generated codebase
    const isAIGenerated = text.toLowerCase().includes('ai-generated') || 
                         text.toLowerCase().includes('generated by ai') ||
                         text.toLowerCase().includes('created with lovable') ||
                         text.toLowerCase().includes('react/vite/typescript template');

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={elements.length} className="list-disc list-inside space-y-2 mb-6 ml-4">
            {currentList.map((item, idx) => (
              <li key={idx} className="text-muted-foreground leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        );
        currentList = [];
      }
    };

    const flushCodeBlock = () => {
      if (codeBlockContent.length > 0) {
        elements.push(
          <div key={elements.length} className="bg-muted/30 border border-border rounded-lg p-4 mb-6 font-mono text-sm overflow-x-auto">
            <pre className="text-foreground whitespace-pre-wrap">
              {codeBlockContent.join('\n')}
            </pre>
          </div>
        );
        codeBlockContent = [];
      }
    };

    lines.forEach((line, index) => {
      // Handle code blocks
      if (line.trim().startsWith('```')) {
        if (isInCodeBlock) {
          flushCodeBlock();
          isInCodeBlock = false;
        } else {
          flushList();
          isInCodeBlock = true;
        }
        return;
      }

      if (isInCodeBlock) {
        codeBlockContent.push(line);
        return;
      }

      // Handle headers
      if (line.startsWith('# ')) {
        flushList();
        elements.push(
          <div key={index} className="flex items-center gap-3 mb-6 mt-8 first:mt-0">
            <div className="w-1 h-8 bg-gradient-to-b from-primary to-accent rounded-full"></div>
            <h1 className="text-3xl font-bold text-foreground bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {line.substring(2)}
            </h1>
          </div>
        );
        return;
      }

      if (line.startsWith('## ')) {
        flushList();
        const title = line.substring(3);
        let icon = <FileText className="w-5 h-5" />;
        let colorClass = "text-primary";

        // Add contextual icons and colors
        if (title.toLowerCase().includes('summary')) {
          icon = <Info className="w-5 h-5" />;
          colorClass = "text-accent";
        } else if (title.toLowerCase().includes('risk') || title.toLowerCase().includes('issue')) {
          icon = <AlertTriangle className="w-5 h-5" />;
          colorClass = "text-destructive";
        } else if (title.toLowerCase().includes('quality') || title.toLowerCase().includes('assessment')) {
          icon = <CheckCircle className="w-5 h-5" />;
          colorClass = "text-accent";
        } else if (title.toLowerCase().includes('technology') || title.toLowerCase().includes('stack')) {
          icon = <TrendingUp className="w-5 h-5" />;
          colorClass = "text-primary";
        }

        elements.push(
          <div key={index} className="flex items-center gap-3 mb-4 mt-8">
            <div className={`${colorClass}`}>
              {icon}
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              {title}
            </h2>
          </div>
        );
        return;
      }

      if (line.startsWith('### ')) {
        flushList();
        elements.push(
          <h3 key={index} className="text-lg font-medium text-foreground mt-6 mb-3 border-l-2 border-primary pl-3">
            {line.substring(4)}
          </h3>
        );
        return;
      }

      // Handle bold text
      if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
        flushList();
        elements.push(
          <div key={index} className="flex items-start gap-2 mb-3">
            <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0"></div>
            <p className="font-semibold text-foreground">
              {line.slice(2, -2)}
            </p>
          </div>
        );
        return;
      }

      // Handle list items
      if (line.startsWith('- ')) {
        currentList.push(line.substring(2));
        return;
      }

      // Handle empty lines
      if (line.trim() === '') {
        flushList();
        elements.push(<div key={index} className="h-4"></div>);
        return;
      }

      // Handle regular paragraphs
      flushList();
      if (line.trim()) {
        elements.push(
          <p key={index} className="text-muted-foreground mb-4 leading-relaxed text-base">
            {line}
          </p>
        );
      }
    });

    // Flush any remaining items
    flushList();
    flushCodeBlock();

    // Add AI guidance section if this is an AI-generated codebase
    if (isAIGenerated) {
      elements.push(
        <div key="ai-guidance" className="mt-8 p-6 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border border-blue-200/50 rounded-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-blue-100 border border-blue-200">
              <Brain className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-blue-900">AI-Generated Codebase Guidance</h3>
          </div>
          
          <div className="space-y-4 text-sm text-blue-800">
            <p className="font-medium">
              Your codebase appears to be AI-generated. Here's how to work effectively with AI-generated code and avoid common pitfalls:
            </p>
            
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold mb-2">🔧 Adding Authentication/Login</h4>
                <p className="text-blue-700 leading-relaxed">
                  <strong>Good prompt:</strong> "Add user authentication with email/password signup and login. Include a profiles table to store user data like username and avatar. Create a dedicated /auth page with both signup and login forms, and protect routes that require authentication."
                </p>
                <p className="text-blue-600 text-xs mt-1">
                  <strong>Avoid:</strong> "Add login" (too vague) or "Add authentication with OAuth, JWT, sessions, password reset, email verification" (too many features at once)
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">📝 Adding New Features</h4>
                <p className="text-blue-700 leading-relaxed">
                  <strong>Best practice:</strong> Break large features into smaller, specific requests. Instead of "Add a blog system", try: "Add a simple blog post creation form with title and content fields" first.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">🎨 UI/Design Changes</h4>
                <p className="text-blue-700 leading-relaxed">
                  <strong>Be specific:</strong> "Make the header dark blue with white text and add a subtle shadow" instead of "Make the header look better".
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">⚠️ Avoiding AI Hallucinations</h4>
                <ul className="list-disc list-inside space-y-1 text-blue-700 ml-4">
                  <li>Always test new features immediately after implementation</li>
                  <li>Request one feature at a time rather than multiple complex changes</li>
                  <li>Be explicit about data relationships (e.g., "each post belongs to a user")</li>
                  <li>Specify exact field names and types for database tables</li>
                  <li>Ask for error handling to be included in your requests</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">🔍 Code Review Tips</h4>
                <ul className="list-disc list-inside space-y-1 text-blue-700 ml-4">
                  <li>Check that new components are properly imported and exported</li>
                  <li>Verify database schema changes include proper relationships</li>
                  <li>Ensure new routes are added to your routing configuration</li>
                  <li>Test form validation and error states manually</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-100/50 rounded border border-blue-200">
              <p className="text-blue-800 text-xs">
                <strong>Pro tip:</strong> When requesting changes, describe the user experience you want to achieve, not just the technical implementation. 
                Example: "Users should be able to create an account, login, and see their personal dashboard" gives better context than just "add user system".
              </p>
            </div>
          </div>
        </div>
      );
    }

    return elements;
  };

  return (
    <div className="space-y-6">
      {/* Analysis Header */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-background to-muted/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div>
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                AI Codebase Analysis
              </span>
              <CardDescription className="mt-1">
                Get comprehensive insights about your project from a 20-year engineering perspective
              </CardDescription>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="font-medium text-lg">{projectName}</p>
              <p className="text-sm text-muted-foreground">
                Ready for detailed analysis and project management insights
              </p>
            </div>
            <Button 
              onClick={runAnalysis}
              disabled={isAnalyzing}
              className="flex items-center gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
              size="lg"
            >
              {isAnalyzing ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  Run Analysis
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {(isAnalyzing || analysis) && (
        <Card className="border border-accent/20 bg-gradient-to-br from-background via-background to-accent/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
                <FileText className="w-6 h-6 text-accent" />
              </div>
              <div>
                Analysis Report
                {isAnalyzing && (
                  <Clock className="w-4 h-4 animate-spin text-muted-foreground ml-2 inline" />
                )}
              </div>
            </CardTitle>
            <CardDescription>
              {isAnalyzing 
                ? "Generating comprehensive analysis..." 
                : "Comprehensive engineering analysis and project management insights"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isAnalyzing && !analysis ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <div className="animate-pulse">
                    <Brain className="w-12 h-12 text-primary mx-auto mb-4" />
                  </div>
                  <div className="text-muted-foreground font-medium">
                    Analyzing codebase structure and generating insights...
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-none">
                <div className="space-y-4">
                  {formatAnalysis(analysis || '')}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Analysis Features */}
      {!analysis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border border-primary/20 hover:border-primary/40 transition-colors bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">PM-Friendly Reports</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Clear explanations for project managers and stakeholders
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-accent/20 hover:border-accent/40 transition-colors bg-gradient-to-br from-accent/5 to-accent/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-accent/10 border border-accent/20">
                  <TrendingUp className="w-8 h-8 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Quality Assessment</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Comprehensive code quality and architecture analysis
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-destructive/20 hover:border-destructive/40 transition-colors bg-gradient-to-br from-destructive/5 to-destructive/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                  <AlertTriangle className="w-8 h-8 text-destructive" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Risk Assessment</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Identify potential risks and technical debt issues
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sample Prompts Button */}
      <div className="flex justify-center">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2 border-2 border-primary/20 hover:border-primary/40 transition-colors">
              <BookOpen className="w-4 h-4" />
              Sample Prompts
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Sample Prompts for Building Features
              </DialogTitle>
              <DialogDescription>
                Copy these example prompts to build common features effectively. Each prompt is designed to be specific and avoid AI hallucinations.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 mt-6">
              {samplePrompts.map((prompt, index) => (
                <div key={index} className="border border-border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{prompt.title}</h3>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        {prompt.category}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(prompt.prompt)}
                      className="flex items-center gap-2 text-primary hover:text-primary/80"
                    >
                      <Copy className="w-4 h-4" />
                      Copy
                    </Button>
                  </div>
                  <div className="bg-muted/30 rounded p-3 text-sm text-muted-foreground leading-relaxed">
                    "{prompt.prompt}"
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20 rounded-lg">
              <h4 className="font-semibold text-foreground mb-2">💡 Pro Tips for Better Prompts:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Be specific about what you want instead of using vague terms</li>
                <li>• Break large features into smaller, manageable requests</li>
                <li>• Describe the user experience you want to achieve</li>
                <li>• Include specific field names and data relationships</li>
                <li>• Always request error handling and validation</li>
              </ul>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AnalysisReport;
