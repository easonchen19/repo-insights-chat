import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CodebaseChatDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const CodebaseChatDialog = ({ projectId, open, onOpenChange }: CodebaseChatDialogProps) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!input.trim() || sending) return;
    const question = input.trim();
    setMessages((m) => [...m, { role: 'user', content: question }]);
    setInput("");
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('code-chat', {
        body: { projectId, question }
      });
      if (error) throw error;
      const answer = data?.answer || "(No answer)";
      setMessages((m) => [...m, { role: 'assistant', content: answer }]);
    } catch (e) {
      console.error('Chat error:', e);
      toast({
        title: 'Chat failed',
        description: 'Unable to get a response from the AI. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Chat with your codebase</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <ScrollArea className="h-72 rounded-md border p-3 bg-background/40">
            <div className="space-y-3">
              {messages.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Ask questions about your uploaded project. Example: "What does the analyze-codebase function do?"
                </p>
              )}
              {messages.map((m, idx) => (
                <div key={idx} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                  <div className={`inline-block rounded-md px-3 py-2 text-sm ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="flex gap-2">
            <Input
              placeholder="Type your question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <Button onClick={send} disabled={sending || !input.trim()}>
              {sending ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CodebaseChatDialog;
