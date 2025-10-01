import { Plus, Trash2, Settings, User, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ChatSession } from "@/pages/Chat";

interface ChatSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  chatSessions: ChatSession[];
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
}

export function ChatSidebar({
  isCollapsed,
  chatSessions,
  currentChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
}: ChatSidebarProps) {
  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r border-border bg-card/50 backdrop-blur-sm transition-all duration-300",
        isCollapsed ? "w-[60px]" : "w-[280px]"
      )}
    >
      {/* New Chat Button */}
      <div className="p-3 border-b border-border">
        <Button
          onClick={onNewChat}
          className="w-full justify-start gap-2"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
          {!isCollapsed && <span>New Chat</span>}
        </Button>
      </div>

      {/* Chat History */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {chatSessions.map((chat) => (
            <div
              key={chat.id}
              className={cn(
                "group relative flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-colors",
                currentChatId === chat.id
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
              onClick={() => onSelectChat(chat.id)}
            >
              {!isCollapsed ? (
                <>
                  <div className="flex-1 truncate">
                    <p className="text-sm font-medium truncate">{chat.title}</p>
                    <p className="text-xs opacity-70">
                      {chat.timestamp.toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(chat.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </>
              ) : (
                <div className="w-full flex justify-center">
                  <div className="h-2 w-2 rounded-full bg-current" />
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Bottom Section */}
      <div className="p-3 border-t border-border space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2"
          size={isCollapsed ? "icon" : "default"}
        >
          <Settings className="h-4 w-4" />
          {!isCollapsed && <span>Settings</span>}
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2"
          size={isCollapsed ? "icon" : "default"}
        >
          <Moon className="h-4 w-4" />
          {!isCollapsed && <span>Theme</span>}
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2"
          size={isCollapsed ? "icon" : "default"}
        >
          <User className="h-4 w-4" />
          {!isCollapsed && <span>Profile</span>}
        </Button>
      </div>
    </aside>
  );
}
