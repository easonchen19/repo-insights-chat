import { useState, useRef, useCallback } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface UploadButtonProps {
  variant?: "outline" | "hero";
  size?: "sm" | "default";
}

const UploadButton = ({ variant = "outline", size = "sm" }: UploadButtonProps) => {
  const [uploadedItem, setUploadedItem] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    // Get the first file or folder name
    const firstItem = files[0];
    let itemName = firstItem.name;

    // If multiple files, show folder-like name
    if (files.length > 1) {
      // Try to detect if it's a folder by checking for common path patterns
      const firstPath = firstItem.webkitRelativePath || firstItem.name;
      const pathParts = firstPath.split('/');
      if (pathParts.length > 1) {
        itemName = pathParts[0]; // Folder name
      } else {
        itemName = `${files.length} files`;
      }
    }

    setUploadedItem(itemName);
    toast({
      title: "Upload successful",
      description: `You have uploaded "${itemName}"`,
    });
  }, [toast]);

  const handleUploadClick = () => {
    // Create a temporary input to let user choose between files or folder
    const choice = confirm("Choose 'OK' for folder upload or 'Cancel' for file upload");
    
    if (choice) {
      // Folder upload
      folderInputRef.current?.click();
    } else {
      // File upload
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="relative">
      <Button variant={variant} size={size} onClick={handleUploadClick}>
        <Upload className="w-4 h-4 mr-2" />
        Upload Project
      </Button>
      
      {/* Hidden file input for files */}
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