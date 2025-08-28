
import { useState, useRef, useEffect } from "react";
import { Upload, FileText, FolderOpen, Sparkles, Copy, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import FileUpload from "./FileUpload";
import { ModelSelector, useModelSelection } from "./ModelSelector";
import { useLocation } from "react-router-dom";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { supabase } from "@/integrations/supabase/client";

interface AnalysisItem {
  id: string;
  name: string;
  date: string;
  status: 'completed' | 'analyzing' | 'failed';
}

interface SessionData {
  id: string;
  files: UploadedFile[];
  analysis: string;
  showTwoPanel: boolean;
}

interface AnalyzerMainProps {
  currentAnalysis: string | null;
  setCurrentAnalysis: (id: string | null) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (analyzing: boolean) => void;
  analysisHistory: AnalysisItem[];
  setAnalysisHistory: (history: AnalysisItem[]) => void;
  sessionData: Record<string, SessionData>;
  setSessionData: React.Dispatch<React.SetStateAction<Record<string, SessionData>>>;
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
  setAnalysisHistory,
  sessionData,
  setSessionData
}: AnalyzerMainProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [analysis, setAnalysis] = useState<string>("");
  const [showTwoPanel, setShowTwoPanel] = useState(false);

  const [isInitializing, setIsInitializing] = useState(false);

  const { selectedModel, setSelectedModel } = useModelSelection();

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: "Prompt copied successfully!",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please copy the text manually.",
        variant: "destructive",
      });
    }
  };

  const samplePrompts = [
    {
      title: "Add Authentication System",
      prompt: "Add a complete authentication system to my app with login, signup, and logout functionality. I want users to be able to register with email and password, sign in securely, and have their session persist. Include a user profile page where they can view their information. Make sure to add proper error handling and redirect authenticated users appropriately."
    },
    {
      title: "Implement Payment Processing", 
      prompt: "Add Stripe payment integration to my app. I need users to be able to make one-time payments for products/services. Include a payment form, success/failure pages, and proper error handling. Make sure the payment flow is secure and user-friendly with loading states and confirmation messages."
    },
    {
      title: "Create User Onboarding Flow",
      prompt: "Build a comprehensive user onboarding experience for new users. Include a multi-step welcome wizard that guides users through setting up their profile, explaining key features, and helping them complete their first important action. Make it engaging with progress indicators and skip options."
    },
    {
      title: "Add Header Navigation Menu",
      prompt: "Create a responsive header navigation menu with logo, main navigation links, user menu (when logged in), and mobile hamburger menu. Include smooth animations and ensure it works well on all screen sizes. Add proper accessibility features and hover effects."
    },
    {
      title: "Build Dashboard with Analytics",
      prompt: "Create a user dashboard page that displays key metrics and analytics relevant to my app. Include charts, statistics cards, recent activity feed, and quick action buttons. Make it responsive and visually appealing with proper data visualization."
    },
    {
      title: "Implement File Upload System",
      prompt: "Add file upload functionality where users can drag and drop files or click to browse. Include file type validation, progress indicators, preview thumbnails for images, and proper error handling. Support multiple file uploads and display upload status."
    },
    {
      title: "Create Search & Filter Feature",
      prompt: "Build a comprehensive search and filtering system for my app's main content. Include text search, multiple filter options (dropdown, checkboxes, date ranges), sorting capabilities, and real-time results. Make sure it's fast and user-friendly with clear filter indicators."
    },
    {
      title: "Add Dark/Light Mode Toggle",
      prompt: "Implement a theme switching system with dark and light modes. Add a toggle button in the header/settings that smoothly transitions between themes. Make sure all components and pages properly support both themes with appropriate colors and contrast."
    }
  ];

  // Load session data when currentAnalysis changes
  useEffect(() => {
    setIsInitializing(true);
    
    if (!currentAnalysis) {
      // Reset for new session
      setUploadedFiles([]);
      setAnalysis("");
      setShowTwoPanel(false);
      setIsDragOver(false);
    } else if (sessionData[currentAnalysis]) {
      // Load existing session data
      const session = sessionData[currentAnalysis];
      setUploadedFiles(session.files);
      setAnalysis(session.analysis);
      setShowTwoPanel(session.showTwoPanel);
      setIsDragOver(false);
    } else {
      // Initialize new session
      setUploadedFiles([]);
      setAnalysis("");
      setShowTwoPanel(false);
      setIsDragOver(false);
    }
    
    // Small delay to prevent race condition with save effect
    setTimeout(() => setIsInitializing(false), 0);
  }, [currentAnalysis]);

  // Save session data whenever state changes (but not during initialization)
  useEffect(() => {
    if (currentAnalysis && !isInitializing) {
      setSessionData(prev => ({
        ...prev,
        [currentAnalysis]: {
          id: currentAnalysis,
          files: uploadedFiles,
          analysis,
          showTwoPanel
        }
      }));
    }
  }, [currentAnalysis, uploadedFiles, analysis, showTwoPanel, isInitializing, setSessionData]);
  
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
      setShowTwoPanel(true);
      
      toast({
        title: `Repository "${state.repoName}" loaded`,
        description: `${githubFiles.length} files ready for analysis from GitHub`,
      });

      // Auto-start analysis if autoStart flag is present
      if (state.autoStart && currentAnalysis) {
        setTimeout(() => {
          startAnalysis();
        }, 500); // Small delay to ensure UI is ready
      }
    }
  }, [location.state, toast, currentAnalysis]);

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

    setShowTwoPanel(true);
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
          isDirectAnalysis: true,
          model: selectedModel
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
          <h2 className="text-2xl font-bold mb-2">Welcome to VibePrompting</h2>
          <p className="text-muted-foreground">
            Start by creating a new analysis to upload and analyze your code files.
          </p>
        </div>
      </div>
    );
  }

  // Show two-panel layout after analysis starts
  if (showTwoPanel && uploadedFiles.length > 0) {
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
                     <Dialog>
                       <DialogTrigger asChild>
                         <Button 
                           variant="outline"
                           className="w-full"
                         >
                           <Lightbulb className="w-4 h-4 mr-2" />
                           Prompt Strategy
                         </Button>
                       </DialogTrigger>
                       <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                         <DialogHeader>
                           <DialogTitle className="flex items-center gap-2">
                             <Lightbulb className="w-5 h-5 text-primary" />
                             AI Prompt Strategy Guide
                           </DialogTitle>
                         </DialogHeader>
                         <div className="space-y-6">
                           <div className="text-sm text-muted-foreground">
                             <p className="mb-4">Here are proven prompts for building common features with AI. Click any prompt to copy it:</p>
                           </div>
                           
                           <div className="grid gap-4">
                             {samplePrompts.map((sample, index) => (
                               <div key={index} className="border border-border rounded-lg p-4">
                                 <div className="flex items-start justify-between mb-2">
                                   <h4 className="font-semibold text-foreground">{sample.title}</h4>
                                   <Button
                                     variant="ghost"
                                     size="sm"
                                     onClick={() => copyToClipboard(sample.prompt)}
                                     className="text-xs"
                                   >
                                     <Copy className="w-3 h-3 mr-1" />
                                     Copy
                                   </Button>
                                 </div>
                                 <p className="text-sm text-muted-foreground leading-relaxed">
                                   {sample.prompt}
                                 </p>
                               </div>
                             ))}
                           </div>
                           
                           <div className="border-t border-border pt-4">
                             <h4 className="font-semibold mb-2 text-foreground">Pro Tips for Effective Prompts:</h4>
                             <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                               <li>Be specific about what you want instead of asking "can you add..."</li>
                               <li>Mention the user experience and visual design you want</li>
                               <li>Include error handling and edge cases in your requirements</li>
                               <li>Specify responsive design and accessibility needs</li>
                               <li>Ask for proper integration with existing app structure</li>
                             </ul>
                           </div>
                         </div>
                       </DialogContent>
                     </Dialog>
                     
                     <Button 
                       onClick={() => setShowTwoPanel(false)}
                       variant="outline"
                       className="w-full"
                     >
                       Add More Files
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
              <Card className="h-full">
                <div className="p-6 h-full flex flex-col">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-accent" />
                    Analysis Report
                    {isAnalyzing && (
                      <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin ml-2" />
                    )}
                  </h3>
                  
                  <div className="flex-1 overflow-y-auto">
                    {isAnalyzing && !analysis ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center space-y-4">
                          <div className="animate-pulse">
                            <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
                          </div>
                          <div className="text-muted-foreground">
                            Analyzing codebase and generating insights...
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {formatAnalysis(analysis || '')}
                      </div>
                    )}
                  </div>
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
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">
                Uploaded Files ({uploadedFiles.length})
              </h3>
              <ModelSelector 
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                className="w-48"
              />
            </div>
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
                      Start Analysis
                    </>
                  )}
                </Button>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline"
                      className="w-full"
                    >
                      <Lightbulb className="w-4 h-4 mr-2" />
                      Prompt Strategy
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-primary" />
                        AI Prompt Strategy Guide
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      <div className="text-sm text-muted-foreground">
                        <p className="mb-4">Here are proven prompts for building common features with AI. Click any prompt to copy it:</p>
                      </div>
                      
                      <div className="grid gap-4">
                        {samplePrompts.map((sample, index) => (
                          <div key={index} className="border border-border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-semibold text-foreground">{sample.title}</h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(sample.prompt)}
                                className="text-xs"
                              >
                                <Copy className="w-3 h-3 mr-1" />
                                Copy
                              </Button>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {sample.prompt}
                            </p>
                          </div>
                        ))}
                      </div>
                      
                      <div className="border-t border-border pt-4">
                        <h4 className="font-semibold mb-2 text-foreground">Pro Tips for Effective Prompts:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                          <li>Be specific about what you want instead of asking "can you add..."</li>
                          <li>Mention the user experience and visual design you want</li>
                          <li>Include error handling and edge cases in your requirements</li>
                          <li>Specify responsive design and accessibility needs</li>
                          <li>Ask for proper integration with existing app structure</li>
                        </ul>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
