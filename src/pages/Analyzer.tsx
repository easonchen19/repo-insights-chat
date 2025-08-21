import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AnalyzerSidebar } from "@/components/AnalyzerSidebar";
import { AnalyzerMain } from "@/components/AnalyzerMain";
import ProtectedRoute from "@/components/ProtectedRoute";

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  content?: string;
}

interface SessionData {
  id: string;
  files: UploadedFile[];
  analysis: string;
  showTwoPanel: boolean;
}

const Analyzer = () => {
  const [currentAnalysis, setCurrentAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisHistory, setAnalysisHistory] = useState<Array<{
    id: string;
    name: string;
    date: string;
    status: 'completed' | 'analyzing' | 'failed';
  }>>([]);
  
  // Store session data for each analysis
  const [sessionData, setSessionData] = useState<Record<string, SessionData>>({});

  const resetAnalysisSession = () => {
    setCurrentAnalysis(null);
    setIsAnalyzing(false);
  };

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AnalyzerSidebar 
            analysisHistory={analysisHistory}
            setAnalysisHistory={setAnalysisHistory}
            currentAnalysis={currentAnalysis}
            setCurrentAnalysis={setCurrentAnalysis}
            onNewAnalysisSession={resetAnalysisSession}
          />
          <AnalyzerMain 
            currentAnalysis={currentAnalysis}
            setCurrentAnalysis={setCurrentAnalysis}
            isAnalyzing={isAnalyzing}
            setIsAnalyzing={setIsAnalyzing}
            analysisHistory={analysisHistory}
            setAnalysisHistory={setAnalysisHistory}
            sessionData={sessionData}
            setSessionData={setSessionData}
          />
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
};

export default Analyzer;