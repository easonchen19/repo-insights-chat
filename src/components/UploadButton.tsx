
import { useState, useRef, useCallback } from "react";
import { Upload, Loader2, FolderOpen, File, Brain, MessageSquare, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import CodebaseChatDialog from "@/components/CodebaseChatDialog";

interface UploadButtonProps {
  variant?: "outline" | "hero";
  size?: "sm" | "default";
}

const UploadButton = ({ variant = "outline", size = "sm" }: UploadButtonProps) => {
  const [uploadedItem, setUploadedItem] = useState<string | null>(null);
  const [uploadedProjectId, setUploadedProjectId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [analysisReport, setAnalysisReport] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadFilesToStorage = async (files: FileList, projectName: string) => {
    const uploadPromises = Array.from(files).map(async (file) => {
      const filePath = file.webkitRelativePath || file.name;
      const fullPath = `${projectName}/${filePath}`;
      
      const { error } = await supabase.storage
        .from('project-uploads')
        .upload(fullPath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        console.error(`Failed to upload ${filePath}:`, error);
        throw error;
      }
      
      return { path: fullPath, size: file.size };
    });

    return await Promise.all(uploadPromises);
  };

  const saveProjectToDatabase = async (projectName: string, files: FileList, uploadedFiles: any[]) => {
    const totalSize = uploadedFiles.reduce((sum, file) => sum + file.size, 0);
    const uploadPath = `${projectName}/`;
    
    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: projectName,
        file_count: files.length,
        total_size: totalSize,
        upload_path: uploadPath
      })
      .select()
      .single();
      
    if (error) {
      console.error('Failed to save project to database:', error);
      throw error;
    }
    
    return data;
  };

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    try {
      // Determine project name
      const firstItem = files[0];
      let projectName = firstItem.name;

      // If multiple files, detect folder name
      if (files.length > 1) {
        const firstPath = firstItem.webkitRelativePath || firstItem.name;
        const pathParts = firstPath.split('/');
        if (pathParts.length > 1) {
          projectName = pathParts[0]; // Folder name
        } else {
          projectName = `project-${Date.now()}`; // Fallback name
        }
      }

      // Upload files to storage
      const uploadedFiles = await uploadFilesToStorage(files, projectName);
      
      // Save project metadata to database
      const project = await saveProjectToDatabase(projectName, files, uploadedFiles);

      setUploadedItem(projectName);
      setUploadedProjectId(project.id);
      toast({
        title: "Upload successful",
        description: `You have uploaded "${projectName}" with ${files.length} file(s)`,
      });
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [toast]);

  const handleFileClick = () => {
    if (isUploading) return;
    fileInputRef.current?.click();
  };

  const handleFolderClick = () => {
    if (isUploading) return;
    folderInputRef.current?.click();
  };

  const handleAnalyzeCodebase = async () => {
    if (!uploadedProjectId || isAnalyzing) return;

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-codebase', {
        body: { projectId: uploadedProjectId }
      });

      if (error) {
        throw error;
      }

      setAnalysisReport(data.analysis);
      toast({
        title: "Analysis Complete",
        description: `Successfully analyzed ${data.fileCount} files in ${uploadedItem}`,
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
    return text
      .split('\n')
      .map((line, index) => {
        if (line.startsWith('# ')) {
          return <h1 key={index} className="text-xl font-bold text-foreground mt-4 mb-2 first:mt-0">{line.substring(2)}</h1>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={index} className="text-lg font-semibold text-foreground mt-4 mb-2">{line.substring(3)}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-base font-medium text-foreground mt-3 mb-1">{line.substring(4)}</h3>;
        }
        if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={index} className="font-semibold text-foreground mb-1">{line.slice(2, -2)}</p>;
        }
        if (line.startsWith('- ')) {
          return <li key={index} className="text-muted-foreground ml-4 mb-1 list-disc">{line.substring(2)}</li>;
        }
        if (line.trim() === '') {
          return <div key={index} className="h-2" />;
        }
        return <p key={index} className="text-muted-foreground mb-2 leading-relaxed">{line}</p>;
      });
  };

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant={variant} 
            size={size} 
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {isUploading ? "Uploading..." : "Upload Project"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={handleFileClick}>
            <File className="w-4 h-4 mr-2" />
            Upload Files
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleFolderClick}>
            <FolderOpen className="w-4 h-4 mr-2" />
            Upload Folder
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Hidden file input for individual files */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={(e) => handleFileUpload(e.target.files)}
        className="hidden"
        accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.php,.rb,.go,.rs,.swift,.kt,.dart,.vue,.svelte,.html,.css,.scss,.sass,.less,.json,.xml,.yml,.yaml,.md,.txt,.zip,.tar,.tar.gz"
      />
      
      {/* Hidden folder input */}
      <input
        ref={folderInputRef}
        type="file"
        multiple
        {...({ webkitdirectory: "" } as any)}
        onChange={(e) => handleFileUpload(e.target.files)}
        className="hidden"
        accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.php,.rb,.go,.rs,.swift,.kt,.dart,.vue,.svelte,.html,.css,.scss,.sass,.less,.json,.xml,.yml,.yaml,.md,.txt,.zip,.tar,.tar.gz"
      />
      
      {uploadedItem && (
        <div className="mt-4 space-y-4">
          <div className="text-sm text-accent font-medium">
            ✓ Uploaded: {uploadedItem}
          </div>
          {uploadedProjectId && (
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleAnalyzeCodebase}
                disabled={isAnalyzing}
                className="flex items-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4" />
                    Analyze Codebase
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setChatOpen(true)}
                className="flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Chat with Codebase
              </Button>
            </div>
          )}
          
          {/* Analysis Report Display */}
          {analysisReport && (
            <div className="w-full max-w-5xl">
              <Card className="shadow-elegant border-primary/20">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="w-5 h-5 text-accent" />
                    Analysis Report for {uploadedItem}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Comprehensive engineering analysis and insights
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                    <div className="space-y-3 text-sm leading-relaxed">
                      {formatAnalysis(analysisReport)}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <p className="text-xs text-muted-foreground">
                      Scroll to view the complete analysis report
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
      
      {uploadedProjectId && (
        <CodebaseChatDialog projectId={uploadedProjectId} open={chatOpen} onOpenChange={setChatOpen} />
      )}
    </div>
  );
};

export default UploadButton;
