
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

interface AnalysisItem {
  id: string;
  name: string;
  date: string;
  status: 'completed' | 'analyzing' | 'failed';
  uploadedFiles?: UploadedFile[];
  analysisReport?: string;
}

const Analyzer = () => {
  const [currentAnalysis, setCurrentAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisItem[]>([]);

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
