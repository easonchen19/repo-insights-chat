import { useState, useEffect, useRef } from "react";
import { Send, Github, Upload, Paperclip, Settings, Loader2, MessageCircle, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useNavigate } from "react-router-dom";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  language: string;
  private: boolean;
}

const Chat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Connection state
  const [isGitHubConnected, setIsGitHubConnected] = useState(false);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [githubUsername, setGithubUsername] = useState<string | null>(null);
  
  // UI state
  const [showSetup, setShowSetup] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    checkGitHubConnection();
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const checkGitHubConnection = async () => {
    if (!user) return;

    try {
      const { data: profile, error } = await supabase
        .from('profiles_secure_data')
        .select('has_github_token, github_username')
        .eq('id', user.id)
        .maybeSingle();

      if (!error && (profile as any)?.has_github_token) {
        setIsGitHubConnected(true);
        setGithubUsername((profile as any).github_username);
        await fetchRepositories();
      }
    } catch (error) {
      console.error('Error checking GitHub connection:', error);
    }
  };

  const fetchRepositories = async () => {
    try {
      const authToken = (await supabase.auth.getSession()).data.session?.access_token;
      
      const response = await supabase.functions.invoke('github-repos', {
        body: { action: 'fetchRepos' },
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });

      if (response.data?.repositories) {
        setRepositories(response.data.repositories);
        // Auto-select first repo if none selected
        if (!selectedRepo && response.data.repositories.length > 0) {
          setSelectedRepo(response.data.repositories[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching repositories:', error);
    }
  };

  const connectGitHub = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setIsConnecting(true);
    
    try {
      localStorage.setItem('linkingGitHub', 'true');
      localStorage.setItem('originalUserId', user.id);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          scopes: 'repo read:user',
          redirectTo: `${window.location.origin}/chat`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('GitHub OAuth error:', error);
      toast({
        title: "Connection failed",
        description: error.message || "Failed to connect to GitHub",
        variant: "destructive"
      });
      setIsConnecting(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      if (selectedRepo) {
        // Use GitHub repo analysis
        const { data, error } = await supabase.functions.invoke('analyze-github-code', {
          body: { 
            repoName: selectedRepo.full_name,
            question: userMessage.content 
          }
        });

        if (error) throw error;

        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.analysis || "I couldn't analyze the repository. Please try again.",
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        // Fallback message
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "Please connect your GitHub account or upload files to start analyzing your codebase.",
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      toast({
        title: 'Error',
        description: 'Failed to get response. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-16 z-40">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h1 className="font-semibold text-foreground">Chat with your codebase</h1>
                  {selectedRepo ? (
                    <p className="text-sm text-muted-foreground">
                      Connected to <span className="text-primary">{selectedRepo.name}</span>
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Connect GitHub or upload files to start
                    </p>
                  )}
                </div>
              </div>
              
              <Dialog open={showSetup} onOpenChange={setShowSetup}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Setup
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Connect Your Codebase</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Card className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Github className="w-5 h-5 text-primary" />
                        <div>
                          <h3 className="font-medium">GitHub Integration</h3>
                          <p className="text-sm text-muted-foreground">
                            Connect your GitHub repositories
                          </p>
                        </div>
                      </div>
                      {isGitHubConnected ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                              Connected as {githubUsername}
                            </Badge>
                          </div>
                          {repositories.length > 0 && (
                            <div>
                              <label className="text-sm font-medium mb-2 block">
                                Select Repository:
                              </label>
                              <div className="space-y-2 max-h-32 overflow-y-auto">
                                {repositories.map((repo) => (
                                  <div
                                    key={repo.id}
                                    className={`p-2 rounded border cursor-pointer transition-colors ${
                                      selectedRepo?.id === repo.id
                                        ? 'border-primary bg-primary/10'
                                        : 'border-border hover:border-primary/50'
                                    }`}
                                    onClick={() => setSelectedRepo(repo)}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-medium">{repo.name}</span>
                                      <Badge variant="outline" className="text-xs">
                                        {repo.language}
                                      </Badge>
                                    </div>
                                    {repo.description && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {repo.description}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <Button 
                          onClick={connectGitHub} 
                          disabled={isConnecting}
                          className="w-full"
                        >
                          {isConnecting ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Github className="w-4 h-4 mr-2" />
                          )}
                          Connect GitHub
                        </Button>
                      )}
                    </Card>

                    <Separator />

                    <Card className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Upload className="w-5 h-5 text-primary" />
                        <div>
                          <h3 className="font-medium">Upload Files</h3>
                          <p className="text-sm text-muted-foreground">
                            Upload project files manually
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => navigate('/analyzer')}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload & Analyze
                      </Button>
                    </Card>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-6">
          <ScrollArea className="flex-1 py-6" ref={scrollRef}>
            <div className="space-y-6">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <Code className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Ready to analyze your codebase</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Ask questions about your code, request explanations, or get suggestions for improvements.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-lg mx-auto">
                    {[
                      "What does the main function do?",
                      "How can I improve this code?",
                      "Explain the project structure",
                      "Generate a prompt for adding a new feature"
                    ].map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => setInput(suggestion)}
                        className="text-left justify-start h-auto p-3 text-wrap"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card border border-border text-card-foreground'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-70 mt-2">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Analyzing...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t border-border/50 py-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask about your codebase..."
                  className="pr-12 min-h-[48px] resize-none"
                  disabled={isLoading}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => setShowSetup(true)}
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
              </div>
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                size="lg"
                className="px-6"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Chat;