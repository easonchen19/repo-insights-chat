import { Bot } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function TypingIndicator() {
  return (
    <div className="flex w-full gap-4" role="status" aria-live="polite" aria-label="AI is typing">
      <Avatar className="h-8 w-8 shrink-0 mt-1">
        <AvatarFallback className="bg-primary text-primary-foreground">
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>

      <div className="bg-muted text-foreground rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" />
        </div>
      </div>
      <span className="sr-only">AI is typing...</span>
    </div>
  );
}
