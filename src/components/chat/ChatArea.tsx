import { useEffect, useRef, useState } from "react";
import { Menu, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { TypingIndicator } from "./TypingIndicator";
import { WelcomePrompts } from "./WelcomePrompts";
import { CommandPalette } from "./CommandPalette";
import { Conversation } from "@/contexts/ChatContext";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";

interface ChatAreaProps {
  currentChat: Conversation | undefined;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onSendMessage: (content: string) => void;
  isGenerating?: boolean;
  onStopGeneration?: () => void;
  onRegenerate?: (messageId: string) => void;
  error?: string | null;
  onMobileSidebarToggle: () => void;
}

export function ChatArea({
  currentChat,
  onToggleSidebar,
  onSendMessage,
  isGenerating,
  onStopGeneration,
  onRegenerate,
  error,
  onMobileSidebarToggle,
}: ChatAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Swipe gesture for mobile
  useSwipeGesture({
    onSwipeRight: onMobileSidebarToggle,
  });

  // Keyboard shortcut: Cmd/Ctrl + K for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentChat?.messages, isGenerating]);

  const handlePromptSelect = (prompt: string) => {
    onSendMessage(prompt);
  };

  return (
    <div className="flex-1 flex flex-col h-screen">
      <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
      
      {/* Header */}
      <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center px-4 gap-3 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMobileSidebarToggle}
          className="md:hidden active:scale-95 transition-transform"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="hidden md:flex active:scale-95 transition-transform"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold truncate">
          {currentChat?.title || "New Chat"}
        </h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCommandPaletteOpen(true)}
          className="ml-auto hidden sm:flex active:scale-95 transition-transform"
          aria-label="Open command palette (Cmd+K)"
        >
          <span className="text-xs text-muted-foreground">⌘K</span>
        </Button>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div ref={scrollRef} className="max-w-4xl mx-auto px-4 py-6">
            {!currentChat || currentChat.messages.length === 0 ? (
              <WelcomePrompts onSelectPrompt={handlePromptSelect} />
            ) : (
              <div className="space-y-6" role="log" aria-live="polite" aria-label="Chat messages">
                {currentChat.messages.map((message, index) => (
                  <div
                    key={message.id}
                    className="animate-slide-up-fade"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <ChatMessage
                      message={message}
                      onRegenerate={
                        message.role === "assistant" && onRegenerate
                          ? () => onRegenerate(message.id)
                          : undefined
                      }
                    />
                  </div>
                ))}
                {isGenerating && (
                  <div className="animate-slide-up-fade">
                    <TypingIndicator />
                  </div>
                )}
                {error && (
                  <Alert variant="destructive" className="animate-slide-up-fade">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                      <span>{error}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRegenerate?.(currentChat.messages[currentChat.messages.length - 1]?.id)}
                        className="active:scale-95 transition-transform"
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
