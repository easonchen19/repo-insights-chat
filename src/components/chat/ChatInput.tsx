import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  onSend: (content: string) => void;
  isGenerating?: boolean;
  onStopGeneration?: () => void;
}

export function ChatInput({ onSend, isGenerating, onStopGeneration }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSend = () => {
    if (input.trim()) {
      onSend(input);
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const charCount = input.length;
  const maxChars = 2000;

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Handle file upload logic here
      console.log("Files selected:", files);
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative flex items-end gap-2">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message ChatGPT..."
            className="min-h-[44px] max-h-[200px] resize-none pr-24 pl-4"
            rows={1}
            disabled={isGenerating}
          />
          <div className="absolute right-2 bottom-2 flex gap-1">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              multiple
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleFileClick}
              disabled={isGenerating}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={isGenerating}
            >
              <Mic className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {isGenerating ? (
          <Button
            onClick={onStopGeneration}
            size="icon"
            variant="destructive"
            className="h-11 w-11 shrink-0"
          >
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSend}
            disabled={!input.trim()}
            size="icon"
            className="h-11 w-11 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex justify-between items-center text-xs text-muted-foreground px-1">
        <span>Press Enter to send, Shift+Enter for new line</span>
        <span className={charCount > maxChars ? "text-destructive" : ""}>
          {charCount}/{maxChars}
        </span>
      </div>
    </div>
  );
}
