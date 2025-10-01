import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef } from "react";
import { useToast } from "@/hooks/use-toast";

interface ExportImportButtonsProps {
  onExport: () => string;
  onImport: (json: string) => void;
}

export function ExportImportButtons({
  onExport,
  onImport,
}: ExportImportButtonsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleExport = () => {
    const json = onExport();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-history-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Exported successfully",
      description: "Chat history has been exported to a JSON file.",
    });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        onImport(json);
        toast({
          title: "Imported successfully",
          description: "Chat history has been imported.",
        });
      } catch (error) {
        toast({
          title: "Import failed",
          description: "Failed to import chat history. Please check the file format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);

    // Reset input
    e.target.value = "";
  };

  return (
    <div className="flex gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-2"
        onClick={handleExport}
      >
        <Download className="h-4 w-4" />
        Export Chats
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-2"
        onClick={handleImportClick}
      >
        <Upload className="h-4 w-4" />
        Import Chats
      </Button>
    </div>
  );
}
