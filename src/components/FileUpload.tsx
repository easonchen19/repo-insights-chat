import { useState, useCallback } from "react";
import { Upload, File, FolderOpen, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface UploadedFile {
  name: string;
  size: number;
  type: string;
}

const FileUpload = () => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
  }, []);

  const processFiles = (files: File[]) => {
    setIsUploading(true);
    
    // Simulate file processing
    setTimeout(() => {
      const newFiles: UploadedFile[] = files.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type
      }));
      
      setUploadedFiles(prev => [...prev, ...newFiles]);
      setIsUploading(false);
      
      toast({
        title: "Files uploaded successfully",
        description: `${files.length} file(s) ready for analysis`,
      });
    }, 1500);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen pt-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Upload Your Project
          </h1>
          <p className="text-muted-foreground text-lg">
            Drag and drop your files or select them manually to begin analysis
          </p>
        </div>

        <Card 
          className={`p-12 border-2 border-dashed transition-all duration-300 ${
            isDragOver 
              ? 'border-primary bg-primary/5 shadow-glow' 
              : 'border-border hover:border-primary/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="text-center">
            <div className={`w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-primary flex items-center justify-center ${
              isDragOver ? 'animate-bounce' : ''
            }`}>
              <Upload className="w-8 h-8 text-white" />
            </div>
            
            <h3 className="text-xl font-semibold mb-2">
              {isDragOver ? 'Drop files here' : 'Upload your codebase'}
            </h3>
            
            <p className="text-muted-foreground mb-6">
              Support for .zip, .tar.gz, and individual source files
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" className="relative overflow-hidden">
                <FolderOpen className="w-4 h-4 mr-2" />
                Select Files
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.php,.rb,.go,.rs,.swift,.kt,.dart,.vue,.svelte,.html,.css,.scss,.sass,.less,.json,.xml,.yml,.yaml,.md,.txt,.zip,.tar,.tar.gz"
                />
              </Button>
              
              <Button variant="glow">
                <FolderOpen className="w-4 h-4 mr-2" />
                Select Folder
              </Button>
            </div>
          </div>
        </Card>

        {/* Loading State */}
        {isUploading && (
          <Card className="mt-6 p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
              <span className="text-muted-foreground">Processing files...</span>
            </div>
          </Card>
        )}

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <Card className="mt-6 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <CheckCircle className="w-5 h-5 text-accent mr-2" />
                Uploaded Files ({uploadedFiles.length})
              </h3>
              <Button 
                variant="hero" 
                onClick={() => {
                  toast({
                    title: "Analysis started",
                    description: "Your codebase is being analyzed...",
                  });
                }}
              >
                Start Analysis
              </Button>
            </div>
            
            <div className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center">
                    <File className="w-4 h-4 text-muted-foreground mr-3" />
                    <div>
                      <span className="font-medium">{file.name}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="hover:bg-destructive/20 hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default FileUpload;