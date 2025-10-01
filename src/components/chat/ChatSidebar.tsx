import { useState } from "react";
import { Plus, Trash2, Settings, Moon, LogOut, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useChatContext } from "@/contexts/ChatContext";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { SearchBar } from "./SearchBar";
import { ExportImportButtons } from "./ExportImportButtons";

interface ChatSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

function groupChatsByDate(sessions: any[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const groups = {
    today: [] as any[],
    yesterday: [] as any[],
    previous7Days: [] as any[],
    previous30Days: [] as any[],
    older: [] as any[],
  };

  sessions.forEach((session) => {
    const sessionDate = new Date(session.updatedAt);
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

export function ChatSidebar({ isCollapsed }: ChatSidebarProps) {
  const {
    state,
    createNewChat,
    selectConversation,
    deleteConversation,
    updateChatTitle,
    searchConversations,
    exportChats,
    importChats,
    getFilteredConversations,
  } = useChatContext();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<{ id: string; title: string } | null>(null);

  const filteredConversations = getFilteredConversations();
  const groupedChats = groupChatsByDate(filteredConversations);

  const handleEdit = (chat: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(chat.id);
    setEditTitle(chat.title);
  };

  const handleSaveEdit = (chatId: string) => {
    if (editTitle.trim()) {
      updateChatTitle(chatId, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleDeleteClick = (chat: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setChatToDelete({ id: chat.id, title: chat.title });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (chatToDelete) {
      deleteConversation(chatToDelete.id);
      setDeleteDialogOpen(false);
      setChatToDelete(null);
    }
  };

  const renderChatGroup = (title: string, chats: any[]) => {
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
                state.currentConversationId === chat.id
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
              onClick={() => selectConversation(chat.id)}
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
                          onClick={(e) => handleDeleteClick(chat, e)}
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
      <div className="p-3 border-b border-border space-y-2">
        <Button
          onClick={createNewChat}
          className="w-full justify-start gap-2"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
          {!isCollapsed && <span>New Chat</span>}
        </Button>
        {!isCollapsed && (
          <SearchBar
            value={state.searchQuery}
            onChange={searchConversations}
            onClear={() => searchConversations("")}
          />
        )}
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

      {/* Footer */}
      <div className="p-3 border-t border-border space-y-2">
        {!isCollapsed && (
          <>
            <ExportImportButtons onExport={exportChats} onImport={importChats} />
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
          </>
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
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        chatTitle={chatToDelete?.title || ""}
      />

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-border bg-card/50 backdrop-blur-sm transition-all duration-300 ease-in-out relative",
          isCollapsed ? "w-[60px]" : "w-[280px]"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
