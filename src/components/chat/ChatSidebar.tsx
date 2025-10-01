import { useState, useEffect } from "react";
import { Plus, Trash2, Settings, Moon, LogOut, Edit2, GripVertical, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
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
  onRenameChat?: (chatId: string, newTitle: string) => void;
}

function groupChatsByDate(sessions: ChatSession[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const groups = {
    today: [] as ChatSession[],
    yesterday: [] as ChatSession[],
    previous7Days: [] as ChatSession[],
    previous30Days: [] as ChatSession[],
    older: [] as ChatSession[],
  };

  sessions.forEach((session) => {
    const sessionDate = new Date(session.timestamp);
    if (sessionDate >= today) {
      groups.today.push(session);
    } else if (sessionDate >= yesterday) {
      groups.yesterday.push(session);
    } else if (sessionDate >= sevenDaysAgo) {
      groups.previous7Days.push(session);
    } else if (sessionDate >= thirtyDaysAgo) {
      groups.previous30Days.push(session);
    } else {
      groups.older.push(session);
    }
  });

  return groups;
}

export function ChatSidebar({
  isCollapsed,
  chatSessions,
  currentChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onRenameChat,
}: ChatSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Keyboard shortcut: Cmd/Ctrl + B
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        setIsMobileOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const groupedChats = groupChatsByDate(chatSessions);

  const handleEdit = (chat: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(chat.id);
    setEditTitle(chat.title);
  };

  const handleSaveEdit = (chatId: string) => {
    if (editTitle.trim() && onRenameChat) {
      onRenameChat(chatId, editTitle.trim());
    }
    setEditingId(null);
  };

  const renderChatGroup = (title: string, chats: ChatSession[]) => {
    if (chats.length === 0) return null;

    return (
      <div className="mb-4">
        {!isCollapsed && (
          <h3 className="text-xs font-semibold text-muted-foreground px-3 mb-2">
            {title}
          </h3>
        )}
        <div className="space-y-1">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={cn(
                "group relative flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-all duration-200 hover:scale-[1.02]",
                currentChatId === chat.id
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
              onClick={() => onSelectChat(chat.id)}
              title={chat.title}
            >
              {!isCollapsed ? (
                <>
                  {editingId === chat.id ? (
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => handleSaveEdit(chat.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit(chat.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="h-7 text-sm"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <div className="flex-1 truncate">
                        <p className="text-sm font-medium truncate">
                          {chat.title.length > 35
                            ? `${chat.title.slice(0, 35)}...`
                            : chat.title}
                        </p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={(e) => handleEdit(chat, e)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteChat(chat.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full flex justify-center">
                  <div className="h-2 w-2 rounded-full bg-current" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const sidebarContent = (
    <>
      {/* Header */}
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
        <div className="p-2">
          {renderChatGroup("Today", groupedChats.today)}
          {renderChatGroup("Yesterday", groupedChats.yesterday)}
          {renderChatGroup("Previous 7 Days", groupedChats.previous7Days)}
          {renderChatGroup("Previous 30 Days", groupedChats.previous30Days)}
          {renderChatGroup("Older", groupedChats.older)}
        </div>
      </ScrollArea>

      {/* Drag Handle */}
      {!isCollapsed && (
        <div className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 items-center justify-center w-1 h-20 cursor-col-resize hover:bg-primary/20 transition-colors group">
          <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      )}

      {/* Footer */}
      <div className="p-3 border-t border-border space-y-2">
        {!isCollapsed && (
          <div className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                JD
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 truncate">
              <p className="text-sm font-medium">John Doe</p>
              <p className="text-xs text-muted-foreground">john@example.com</p>
            </div>
          </div>
        )}
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
          className="w-full justify-start gap-2 text-destructive hover:text-destructive"
          size={isCollapsed ? "icon" : "default"}
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && <span>Logout</span>}
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-border bg-card/50 backdrop-blur-sm transition-all duration-300 ease-in-out relative",
          isCollapsed ? "w-[60px]" : "w-[280px]"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            onClick={() => setIsMobileOpen(false)}
          />
          <aside className="md:hidden fixed left-0 top-0 bottom-0 w-[280px] bg-card border-r border-border z-50 flex flex-col animate-slide-in-right">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3"
              onClick={() => setIsMobileOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
