import { useState, useRef, useEffect } from "react";
import { Upload, FileText, FolderOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";


interface AnalysisItem {
  id: string;
  name: string;
  date: string;
  status: 'completed' | 'analyzing' | 'failed';
}

interface AnalyzerMainProps {
  currentAnalysis: string | null;
  setCurrentAnalysis: (id: string | null) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (analyzing: boolean) => void;
  analysisHistory: AnalysisItem[];
  setAnalysisHistory: (history: AnalysisItem[]) => void;
}

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  content?: string;
}

export const AnalyzerMain = ({ 
  currentAnalysis, 
  setCurrentAnalysis, 
  isAnalyzing, 
  setIsAnalyzing,
  analysisHistory,
  setAnalysisHistory
}: AnalyzerMainProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [analysis, setAnalysis] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const location = useLocation();

  // Check if we have GitHub repository files passed from navigation
  useEffect(() => {
    const state = location.state as any;
    if (state?.repoFiles && Array.isArray(state.repoFiles)) {
      const githubFiles: UploadedFile[] = state.repoFiles.map((file: any) => ({
        name: file.name,
        size: file.content?.length || 0,
        type: file.type || 'text/plain',
        content: file.content
      }));
      
      setUploadedFiles(githubFiles);
      
      toast({
        title: `Repository "${state.repoName}" loaded`,
        description: `${githubFiles.length} files ready for analysis from GitHub`,
      });
    }
  }, [location.state, toast]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      processFiles(files);
    }
  };

  const processFiles = async (files: File[]) => {
    const newFiles: UploadedFile[] = [];
    
    for (const file of files) {
      if (file.type.startsWith('text/') || 
          file.name.endsWith('.js') || 
          file.name.endsWith('.jsx') || 
          file.name.endsWith('.ts') || 
          file.name.endsWith('.tsx') || 
          file.name.endsWith('.css') || 
          file.name.endsWith('.html') || 
          file.name.endsWith('.json') || 
          file.name.endsWith('.md')) {
        
        try {
          const content = await file.text();
          newFiles.push({
            name: file.name,
            size: file.size,
            type: file.type || 'text/plain',
            content
          });
        } catch (error) {
          console.error('Error reading file:', error);
        }
      } else {
        newFiles.push({
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream'
        });
      }
    }
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    toast({
      title: "Files uploaded successfully",
      description: `${newFiles.length} file(s) uploaded and ready for analysis.`,
    });
  };

  const startAnalysis = async () => {
    if (!currentAnalysis || uploadedFiles.length === 0) {
      toast({
        title: "No files to analyze",
        description: "Please upload some files first.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysis("");

    try {
      // Use direct fetch to stream SSE from the edge function
      const SUPABASE_URL = "https://wfywmkdqyuucxftpvmfj.supabase.co";
      const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmeXdta2RxeXV1Y3hmdHB2bWZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NjkwNjEsImV4cCI6MjA3MTE0NTA2MX0.elHXCxBIqmz0IlcuOcKlY0gnIB88wK4rgbbpz9be244";
      const authToken = (await supabase.auth.getSession()).data.session?.access_token;

      const response = await fetch(`${SUPABASE_URL}/functions/v1/analyze-codebase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken || SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          analysisId: currentAnalysis,
          files: uploadedFiles.map(file => ({
            name: file.name,
            content: file.content || '',
            type: file.type
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
                // Update analysis status to completed
                const updatedHistory = analysisHistory.map(item => 
                  item.id === currentAnalysis 
                    ? { ...item, status: 'completed' as const }
                    : item
                );
                setAnalysisHistory(updatedHistory);
                toast({
                  title: "Analysis completed",
                  description: `Successfully analyzed ${data.fileCount} files.`,
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
      // Update analysis status to failed
      const updatedHistory = analysisHistory.map(item => 
        item.id === currentAnalysis 
          ? { ...item, status: 'failed' as const }
          : item
      );
      setAnalysisHistory(updatedHistory);
      toast({
        title: "Analysis failed",
        description: "There was an error analyzing your files. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  if (!currentAnalysis) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md">
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Welcome to Code Analyzer</h2>
          <p className="text-muted-foreground">
            Start by creating a new analysis to upload and analyze your code files.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            Code Analysis Workspace
          </h1>
          
          {/* Upload Area */}
          <Card className="mb-6">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                isDragOver
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                Drop your files here or click to browse
              </h3>
              <p className="text-muted-foreground mb-6">
                Upload individual files or entire project folders for analysis
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Select Files
                </Button>
                
                <Button
                  onClick={() => folderInputRef.current?.click()}
                  variant="outline"
                >
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Select Folder
                </Button>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                accept=".js,.jsx,.ts,.tsx,.css,.html,.json,.md,.txt,.py,.java,.cpp,.c,.h,.php,.rb,.go,.rs,.swift,.kt,.scala,.sh,.yml,.yaml,.xml,.sql"
              />
              
              <input
                ref={folderInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                {...({ webkitdirectory: "", directory: "" } as any)}
              />
            </div>
          </Card>

          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <Card className="mb-6 p-6">
              <h3 className="text-lg font-semibold mb-4">
                Uploaded Files ({uploadedFiles.length})
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <Button 
                  onClick={startAnalysis}
                  disabled={isAnalyzing}
                  className="w-full bg-gradient-primary hover:opacity-90 text-white"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Start Analysis
                    </>
                  )}
                </Button>
              </div>
            </Card>
          )}

          {/* Analysis Results */}
          {(isAnalyzing || analysis) && (
            <Card className="mb-6">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-accent" />
                  Analysis Report
                  {isAnalyzing && (
                    <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin ml-2" />
                  )}
                </h3>
                
                {isAnalyzing && !analysis ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">
                      Analyzing codebase and generating insights...
                    </div>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto">
                    <div className="prose prose-sm max-w-none text-sm leading-relaxed whitespace-pre-wrap">
                      {analysis}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};