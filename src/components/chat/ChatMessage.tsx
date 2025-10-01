import { useState } from "react";
import { Copy, Check, RotateCcw, Bot, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { ChatMessage as ChatMessageType } from "@/contexts/ChatContext";
import { MarkdownMessage } from "./MarkdownMessage";

interface ChatMessageProps {
  message: ChatMessageType;
  onRegenerate?: () => void;
}

export function ChatMessage({ message, onRegenerate }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [showTimestamp, setShowTimestamp] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "flex w-full gap-4 group",
        isUser ? "justify-end" : "justify-start"
      )}
      onMouseEnter={() => setShowTimestamp(true)}
      onMouseLeave={() => setShowTimestamp(false)}
    >
      {/* Avatar - Left side for AI */}
      {!isUser && (
        <Avatar className="h-8 w-8 shrink-0 mt-1">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}

      <div className={cn("flex flex-col gap-2", isUser ? "items-end" : "items-start")}>
        {/* Message bubble */}
        <div
          className={cn(
            "max-w-[700px] rounded-2xl px-4 py-3 shadow-sm relative",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-muted text-foreground rounded-bl-sm"
          )}
        >
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </p>
          ) : (
            <MarkdownMessage content={message.content} />
          )}
        </div>

        {/* Action buttons and timestamp */}
        <div
          className={cn(
            "flex items-center gap-2 transition-opacity",
            showTimestamp ? "opacity-100" : "opacity-0"
          )}
        >
          <span className="text-xs text-muted-foreground">
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>

          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 mr-1" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </>
            )}
          </Button>

          {!isUser && onRegenerate && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2"
              onClick={onRegenerate}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Regenerate
            </Button>
          )}
        </div>
      </div>

      {/* Avatar - Right side for User */}
      {isUser && (
        <Avatar className="h-8 w-8 shrink-0 mt-1">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <UserIcon className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
