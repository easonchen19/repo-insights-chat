
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Clock, FileText, Users, TrendingUp, AlertTriangle, CheckCircle, XCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AnalysisReportProps {
  projectId: string;
  projectName: string;
  onAnalysisComplete?: (analysis: string) => void;
}

const AnalysisReport = ({ projectId, projectName, onAnalysisComplete }: AnalysisReportProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const { toast } = useToast();

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
        body: JSON.stringify({ projectId })
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
    </div>
  );
};

export default AnalysisReport;
