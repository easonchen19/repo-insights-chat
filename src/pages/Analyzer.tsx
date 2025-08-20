import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AnalyzerSidebar } from "@/components/AnalyzerSidebar";
import { AnalyzerMain } from "@/components/AnalyzerMain";
import ProtectedRoute from "@/components/ProtectedRoute";

const Analyzer = () => {
  const [currentAnalysis, setCurrentAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisHistory, setAnalysisHistory] = useState<Array<{
    id: string;
    name: string;
    date: string;
    status: 'completed' | 'analyzing' | 'failed';
  }>>([]);

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AnalyzerSidebar 
            analysisHistory={analysisHistory}
            setAnalysisHistory={setAnalysisHistory}
            currentAnalysis={currentAnalysis}
            setCurrentAnalysis={setCurrentAnalysis}
          />
          <AnalyzerMain 
            currentAnalysis={currentAnalysis}
            setCurrentAnalysis={setCurrentAnalysis}
            isAnalyzing={isAnalyzing}
            setIsAnalyzing={setIsAnalyzing}
            analysisHistory={analysisHistory}
            setAnalysisHistory={setAnalysisHistory}
          />
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
};

export default Analyzer;