import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Clock, FileText, Users, TrendingUp, AlertTriangle } from "lucide-react";
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
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-codebase', {
        body: { projectId }
      });

      if (error) {
        throw error;
      }

      setAnalysis(data.analysis);
      onAnalysisComplete?.(data.analysis);
      
      toast({
        title: "Analysis Complete",
        description: `Successfully analyzed ${data.fileCount} files in ${projectName}`,
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze the codebase. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatAnalysis = (text: string) => {
    // Convert markdown-style formatting to HTML-like structure for display
    return text
      .split('\n')
      .map((line, index) => {
        if (line.startsWith('# ')) {
          return <h1 key={index} className="text-2xl font-bold text-foreground mt-6 mb-3">{line.substring(2)}</h1>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={index} className="text-xl font-semibold text-foreground mt-5 mb-2">{line.substring(3)}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-lg font-medium text-foreground mt-4 mb-2">{line.substring(4)}</h3>;
        }
        if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={index} className="font-bold text-foreground mb-2">{line.slice(2, -2)}</p>;
        }
        if (line.startsWith('- ')) {
          return <li key={index} className="text-muted-foreground ml-4 mb-1">{line.substring(2)}</li>;
        }
        if (line.trim() === '') {
          return <br key={index} />;
        }
        return <p key={index} className="text-muted-foreground mb-2 leading-relaxed">{line}</p>;
      });
  };

  return (
    <div className="space-y-6">
      {/* Analysis Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            AI Codebase Analysis
          </CardTitle>
          <CardDescription>
            Get comprehensive insights about your project from a 20-year engineering perspective
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">{projectName}</p>
              <p className="text-sm text-muted-foreground">
                Ready for detailed analysis and project management insights
              </p>
            </div>
            <Button 
              onClick={runAnalysis}
              disabled={isAnalyzing}
              className="flex items-center gap-2"
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
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-accent" />
              Analysis Report
            </CardTitle>
            <CardDescription>
              Comprehensive engineering analysis and project management insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <div className="space-y-4 text-sm">
                {formatAnalysis(analysis)}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Features */}
      {!analysis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-primary" />
                <div>
                  <h3 className="font-medium">PM-Friendly Reports</h3>
                  <p className="text-sm text-muted-foreground">
                    Clear explanations for project managers
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-accent" />
                <div>
                  <h3 className="font-medium">Quality Assessment</h3>
                  <p className="text-sm text-muted-foreground">
                    Code quality and architecture analysis
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-destructive" />
                <div>
                  <h3 className="font-medium">Risk Assessment</h3>
                  <p className="text-sm text-muted-foreground">
                    Identify potential risks and issues
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