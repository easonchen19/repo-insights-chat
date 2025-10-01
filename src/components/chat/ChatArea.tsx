import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { ChatSession } from "@/pages/Chat";

interface ChatAreaProps {
  currentChat: ChatSession | undefined;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onSendMessage: (content: string) => void;
}

export function ChatArea({
  currentChat,
  onToggleSidebar,
  onSendMessage,
}: ChatAreaProps) {
  return (
    <div className="flex-1 flex flex-col h-screen">
      {/* Header */}
      <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center px-4 gap-3">
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
      <ScrollArea className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {currentChat?.messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Start a conversation...</p>
            </div>
          ) : (
            currentChat?.messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Input Bar */}
      <div className="border-t border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <ChatInput onSend={onSendMessage} />
        </div>
      </div>
    </div>
  );
}
