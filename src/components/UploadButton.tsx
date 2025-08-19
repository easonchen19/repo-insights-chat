
import { useState, useRef, useCallback } from "react";
import { Upload, Loader2, FolderOpen, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UploadButtonProps {
  variant?: "outline" | "hero";
  size?: "sm" | "default";
}

const UploadButton = ({ variant = "outline", size = "sm" }: UploadButtonProps) => {
  const [uploadedItem, setUploadedItem] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
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
    
    const { error } = await supabase
      .from('projects')
      .insert({
        name: projectName,
        file_count: files.length,
        total_size: totalSize,
        upload_path: uploadPath
      });
      
    if (error) {
      console.error('Failed to save project to database:', error);
      throw error;
    }
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
      await saveProjectToDatabase(projectName, files, uploadedFiles);

      setUploadedItem(projectName);
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

  return (
    <div className="relative">
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
        <div className="absolute top-full left-0 mt-2 text-sm text-accent font-medium whitespace-nowrap">
          ✓ Uploaded: {uploadedItem}
        </div>
      )}
    </div>
  );
};

export default UploadButton;
