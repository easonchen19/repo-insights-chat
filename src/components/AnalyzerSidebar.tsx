import { useState } from "react";
import { Plus, History, FileText, Clock, CheckCircle2, XCircle, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface AnalysisItem {
  id: string;
  name: string;
  date: string;
  status: 'completed' | 'analyzing' | 'failed';
}

interface AnalyzerSidebarProps {
  analysisHistory: AnalysisItem[];
  setAnalysisHistory: (history: AnalysisItem[]) => void;
  currentAnalysis: string | null;
  setCurrentAnalysis: (id: string | null) => void;
  onNewAnalysisSession: () => void;
}

export const AnalyzerSidebar = ({ 
  analysisHistory, 
  setAnalysisHistory, 
  currentAnalysis, 
  setCurrentAnalysis,
  onNewAnalysisSession 
}: AnalyzerSidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'analyzing':
        return <Clock className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const startNewAnalysis = () => {
    // First reset the current session to clear all state
    onNewAnalysisSession();
    
    // Generate a proper UUID-like string for the analysis session
    const newId = crypto.randomUUID();
    const newAnalysis = {
      id: newId,
      name: `New Analysis ${analysisHistory.length + 1}`,
      date: new Date().toLocaleDateString(),
      status: 'analyzing' as const
    };
    
    setAnalysisHistory([newAnalysis, ...analysisHistory]);
    setCurrentAnalysis(newId);
  };

  return (
    <div className={cn(
      "bg-muted/30 border-r border-border/50 flex flex-col transition-all duration-300",
      isCollapsed ? "w-16" : "w-80"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold">Code Analyzer</h2>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="ml-auto"
          >
            {isCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </Button>
        </div>
        
        {!isCollapsed && (
          <Button 
            onClick={startNewAnalysis}
            className="w-full mt-3 bg-gradient-primary hover:opacity-90 text-white"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Analysis
          </Button>
        )}
        
        {isCollapsed && (
          <Button 
            onClick={startNewAnalysis}
            className="w-full mt-3 bg-gradient-primary hover:opacity-90 text-white"
            size="sm"
          >
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Analysis History */}
      <div className="flex-1 overflow-hidden">
        {!isCollapsed && (
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <History className="w-4 h-4" />
              Recent Analyses
            </div>
          </div>
        )}
        
        <ScrollArea className="flex-1">
          <div className="p-2">
            {analysisHistory.map((analysis) => (
              <Button
                key={analysis.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start p-3 h-auto mb-2 rounded-lg",
                  currentAnalysis === analysis.id && "bg-muted"
                )}
                onClick={() => setCurrentAnalysis(analysis.id)}
              >
                <div className="flex items-start gap-3 w-full">
                  {getStatusIcon(analysis.status)}
                  {!isCollapsed && (
                    <div className="flex-1 text-left min-w-0">
                      <div className="font-medium text-sm truncate">
                        {analysis.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {analysis.date}
                      </div>
                    </div>
                  )}
                </div>
              </Button>
            ))}
            
            {analysisHistory.length === 0 && !isCollapsed && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No analyses yet</p>
                <p className="text-xs">Start by creating a new analysis</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};