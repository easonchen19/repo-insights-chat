import { useEffect, useRef } from "react";
import { Menu, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { TypingIndicator } from "./TypingIndicator";
import { WelcomePrompts } from "./WelcomePrompts";
import { Conversation } from "@/contexts/ChatContext";

interface ChatAreaProps {
  currentChat: Conversation | undefined;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onSendMessage: (content: string) => void;
  isGenerating?: boolean;
  onStopGeneration?: () => void;
  onRegenerate?: (messageId: string) => void;
  error?: string | null;
}

export function ChatArea({
  currentChat,
  onToggleSidebar,
  onSendMessage,
  isGenerating,
  onStopGeneration,
  onRegenerate,
  error,
}: ChatAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentChat?.messages, isGenerating]);

  const handlePromptSelect = (prompt: string) => {
    onSendMessage(prompt);
  };

  return (
    <div className="flex-1 flex flex-col h-screen">
      {/* Header */}
      <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center px-4 gap-3 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="md:flex"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold truncate">
          {currentChat?.title || "New Chat"}
        </h1>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div ref={scrollRef} className="max-w-4xl mx-auto px-4 py-6">
            {!currentChat || currentChat.messages.length === 0 ? (
              <WelcomePrompts onSelectPrompt={handlePromptSelect} />
            ) : (
              <div className="space-y-6">
                {currentChat.messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    onRegenerate={
                      message.role === "assistant" && onRegenerate
                        ? () => onRegenerate(message.id)
                        : undefined
                    }
                  />
                ))}
                {isGenerating && <TypingIndicator />}
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                      <span>{error}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRegenerate?.(currentChat.messages[currentChat.messages.length - 1]?.id)}
                      >
                        Retry
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Input Bar */}
      <div className="border-t border-border bg-card/50 backdrop-blur-sm shrink-0">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <ChatInput
            onSend={onSendMessage}
            isGenerating={isGenerating}
            onStopGeneration={onStopGeneration}
          />
        </div>
      </div>
    </div>
  );
}
