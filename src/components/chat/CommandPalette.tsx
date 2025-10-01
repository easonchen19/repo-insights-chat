import { useEffect, useState } from "react";
import { Search, MessageSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useChatContext } from "@/contexts/ChatContext";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const { state, selectConversation, getFilteredConversations, searchConversations } = useChatContext();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [open]);

  useEffect(() => {
    searchConversations(query);
  }, [query, searchConversations]);

  const results = getFilteredConversations();

  const handleSelect = (id: string) => {
    selectConversation(id);
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex].id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0" aria-describedby="command-palette-description">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle>Search Conversations</DialogTitle>
          <p id="command-palette-description" className="sr-only">
            Search through your chat history using keyboard navigation
          </p>
        </DialogHeader>
        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search conversations..."
              className="pl-9"
              autoFocus
              aria-label="Search conversations"
            />
          </div>
        </div>
        <ScrollArea className="max-h-[400px]">
          <div className="p-2" role="listbox" aria-label="Search results">
            {results.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                No conversations found
              </div>
            ) : (
              results.map((conv, index) => (
                <button
                  key={conv.id}
                  onClick={() => handleSelect(conv.id)}
                  className={cn(
                    "w-full flex items-start gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200",
                    selectedIndex === index
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  )}
                  role="option"
                  aria-selected={selectedIndex === index}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <MessageSquare className="h-4 w-4 mt-1 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{conv.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {conv.messages.length} messages • {new Date(conv.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
