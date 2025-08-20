import { useState, useRef, useEffect } from "react";
import { Upload, FileText, FolderOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

interface AnalysisItem {
  id: string;
  name: string;
  date: string;
  status: 'completed' | 'analyzing' | 'failed';
  uploadedFiles?: UploadedFile[];
  analysisReport?: string;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const location = useLocation();

  // Get current analysis data
  const currentAnalysisData = analysisHistory.find(item => item.id === currentAnalysis);
  const uploadedFiles = currentAnalysisData?.uploadedFiles || [];
  const analysis = currentAnalysisData?.analysisReport || "";

  // Check if we have GitHub repository files passed from navigation
  useEffect(() => {
    const state = location.state as any;
    if (state?.repoFiles && Array.isArray(state.repoFiles) && currentAnalysis) {
      const githubFiles: UploadedFile[] = state.repoFiles.map((file: any) => ({
        name: file.name,
        size: file.content?.length || 0,
        type: file.type || 'text/plain',
        content: file.content
      }));
      
      // Update the current analysis with GitHub files
      const updatedHistory = analysisHistory.map(item => 
        item.id === currentAnalysis 
          ? { ...item, uploadedFiles: githubFiles }
          : item
      );
      setAnalysisHistory(updatedHistory);
      
      toast({
        title: `Repository "${state.repoName}" loaded`,
        description: `${githubFiles.length} files ready for analysis from GitHub`,
      });
    }
  }, [location.state, toast, currentAnalysis, analysisHistory, setAnalysisHistory]);

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
    if (!currentAnalysis) return;

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
    
    // Update the current analysis with new files
    const updatedHistory = analysisHistory.map(item => 
      item.id === currentAnalysis 
        ? { ...item, uploadedFiles: [...(item.uploadedFiles || []), ...newFiles] }
        : item
    );
    setAnalysisHistory(updatedHistory);
    
    toast({
      title: "Files uploaded successfully",
      description: `${newFiles.length} file(s) uploaded and ready for analysis.`,
    });
  };

  const startAnalysis = async () => {
    if (!currentAnalysis || !uploadedFiles.length) {
      toast({
        title: "No files to analyze",
        description: "Please upload some files first.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    
    // Clear previous analysis report
    const updatedHistory = analysisHistory.map(item => 
      item.id === currentAnalysis 
        ? { ...item, analysisReport: "", status: 'analyzing' as const }
        : item
    );
    setAnalysisHistory(updatedHistory);

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
                // Update the analysis report incrementally
                const updatedHistory = analysisHistory.map(item => 
                  item.id === currentAnalysis 
                    ? { ...item, analysisReport: (item.analysisReport || '') + data.text }
                    : item
                );
                setAnalysisHistory(updatedHistory);
              } else if (data.type === 'complete') {
                setIsAnalyzing(false);
                // Update analysis status to completed
                const finalHistory = analysisHistory.map(item => 
                  item.id === currentAnalysis 
                    ? { ...item, status: 'completed' as const }
                    : item
                );
                setAnalysisHistory(finalHistory);
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
    if (!currentAnalysis) return;
    
    const updatedHistory = analysisHistory.map(item => 
      item.id === currentAnalysis 
        ? { ...item, uploadedFiles: (item.uploadedFiles || []).filter((_, i) => i !== index) }
        : item
    );
    setAnalysisHistory(updatedHistory);
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
            <h1 className="text-2xl font-bold text-foreground bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {line.substring(2)}
            </h1>
          </div>
        );
        return;
      }

      if (line.startsWith('## ')) {
        flushList();
        elements.push(
          <h2 key={index} className="text-lg font-semibold text-foreground mt-6 mb-3 border-l-2 border-primary pl-3">
            {line.substring(3)}
          </h2>
        );
        return;
      }

      if (line.startsWith('### ')) {
        flushList();
        elements.push(
          <h3 key={index} className="text-base font-medium text-foreground mt-4 mb-2">
            {line.substring(4)}
          </h3>
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
        elements.push(<div key={index} className="h-2"></div>);
        return;
      }

      // Handle regular paragraphs
      flushList();
      if (line.trim()) {
        elements.push(
          <p key={index} className="text-muted-foreground mb-3 leading-relaxed text-sm">
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

  // Show two-panel layout if files are uploaded and analysis has started/completed
  if (uploadedFiles.length > 0 && (analysis || isAnalyzing)) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Code Analysis Workspace
          </h1>
        </div>
        
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Left Panel - Uploaded Files */}
          <ResizablePanel defaultSize={40} minSize={30}>
            <div className="h-full p-6">
              <Card className="h-full">
                <div className="p-6 h-full flex flex-col">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Uploaded Files ({uploadedFiles.length})
                  </h3>
                  
                  <div className="flex-1 space-y-2 overflow-y-auto">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="flex-shrink-0"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t space-y-3">
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
                          Re-run Analysis
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Panel - Analysis Report */}
          <ResizablePanel defaultSize={60} minSize={40}>
            <div className="h-full p-6">
              <Card className="h-full flex flex-col">
                <div className="p-6 pb-0 flex-shrink-0">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-accent" />
                    Analysis Report
                    {isAnalyzing && (
                      <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin ml-2" />
                    )}
                  </h3>
                </div>
                
                <div className="flex-1 overflow-y-auto px-6 pb-6">
                  {isAnalyzing && !analysis ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center space-y-4">
                        <div className="animate-pulse">
                          <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
                        </div>
                        <div className="text-muted-foreground">
                          Analyzing codebase and generating insights...
                        </div>
                      </div>
                    </div>
                  ) : analysis ? (
                    <div className="space-y-4 min-h-full">
                      {formatAnalysis(analysis)}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-muted-foreground">
                      <div className="text-center">
                        <Sparkles className="w-12 h-12 mx-auto mb-4" />
                        <p>Analysis report will appear here after processing</p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    );
  }

  // Default single-panel layout for file upload
  return (
    <div className="flex-1 flex flex-col">
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

          {/* Uploaded Files Preview */}
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
        </div>
      </div>
    </div>
  );
};
