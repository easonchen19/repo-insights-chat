import { useState, useEffect } from "react";
import { Github, Search, Star, GitBranch, Calendar, ExternalLink, Copy, Lightbulb, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { SUBSCRIPTION_TIERS } from "@/lib/subscription";
import { TierBasedSelector } from "./TierBasedSelector";

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  language: string;
  stars: number;
  updatedAt: string;
  private: boolean;
  html_url: string;
  default_branch: string;
}

const GitHubConnect = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [githubAccessToken, setGithubAccessToken] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [showRepositories, setShowRepositories] = useState(false);
  
  // File selection modal state
  const [showFileSelectionModal, setShowFileSelectionModal] = useState(false);
  const [repoFiles, setRepoFiles] = useState<{ [key: string]: any[] }>({});
  const [allFiles, setAllFiles] = useState<any[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [currentAnalysisRepo, setCurrentAnalysisRepo] = useState<Repository | null>(null);
  
  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState("");
  const [analyzedFiles, setAnalyzedFiles] = useState<any[]>([]);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [currentRepo, setCurrentRepo] = useState<Repository | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string>("");
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [featureInput, setFeatureInput] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [repoDisplayCount, setRepoDisplayCount] = useState(1);
  const [showRepoSelectionModal, setShowRepoSelectionModal] = useState(false);
  const [selectedRepositories, setSelectedRepositories] = useState<Set<number>>(new Set());
  const [displayedRepositories, setDisplayedRepositories] = useState<Repository[]>([]);
  
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied to clipboard", description: "Prompt copied successfully!" });
    } catch (err) {
      toast({ title: "Copy failed", description: "Please copy manually.", variant: "destructive" });
    }
  };

  const generatePrompt = async (repo: Repository) => {
    if (!featureInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter a feature description.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const codebaseInfo = {
        language: repo.language,
        type: repo.language?.toLowerCase().includes('javascript') || repo.language?.toLowerCase().includes('typescript') ? 'web app' : 
              repo.language?.toLowerCase().includes('swift') || repo.language?.toLowerCase().includes('kotlin') ? 'mobile app' : 'backend',
        description: repo.description,
        name: repo.name
      };
      
      const { data, error } = await supabase.functions.invoke('generate-prompt', {
        body: {
          feature: featureInput,
          codebaseInfo
        }
      });

      if (error) throw error;

      setGeneratedPrompt(data.generatedPrompt);
      toast({
        title: "Prompt generated!",
        description: "Your optimized prompt has been generated successfully.",
      });
    } catch (error) {
      console.error('Error generating prompt:', error);
      toast({
        title: "Error",
        description: "Failed to generate prompt. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Apply subscription-based filtering
  const { subscription } = useAuth();
  const maxProjects = subscription ? SUBSCRIPTION_TIERS[subscription.tier].features.projects : 1;
  
  const searchFilteredRepos = displayedRepositories
    .filter(repo =>
      repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repo.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  
  const filteredRepos = searchFilteredRepos.slice(0, repoDisplayCount);

  const handleRepositorySelection = (repoId: number, selected: boolean) => {
    setSelectedRepositories(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(repoId);
      } else {
        newSet.delete(repoId);
      }
      return newSet;
    });
  };

  const handleSelectAllRepos = (checked: boolean) => {
    if (checked) {
      const allRepoIds = repositories.slice(0, maxProjects).map(repo => repo.id);
      setSelectedRepositories(new Set(allRepoIds));
    } else {
      setSelectedRepositories(new Set());
    }
  };

  const handleConfirmSelection = () => {
    const selected = repositories.filter(repo => selectedRepositories.has(repo.id));
    setDisplayedRepositories(selected);
    setShowRepoSelectionModal(false);
    setShowRepositories(true);
  };
  
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🔍 GitHubConnect mounted, user:', user?.id);
    
    // Check if user is authenticated
    if (!user) {
      console.log('❌ No user found, redirecting to auth');
      navigate('/auth');
      return;
    }

    // Check for GitHub OAuth callback
    const checkForGitHubCallback = async () => {
      console.log('🔄 Checking for GitHub callback...');
      
      const { data: { session } } = await supabase.auth.getSession();
      const isLinkingGitHub = localStorage.getItem('linkingGitHub') === 'true';
      const originalUserId = localStorage.getItem('originalUserId');
      
      console.log('📋 Session data:', {
        hasSession: !!session,
        hasProviderToken: !!session?.provider_token,
        appProvider: session?.user?.app_metadata?.provider,
        userMetadata: session?.user?.user_metadata,
        isLinkingGitHub,
        originalUserId,
        currentUserId: session?.user?.id
      });
      
      if (session?.provider_token && session?.user?.app_metadata?.provider === 'github') {
        console.log('✅ Found GitHub provider token');
        
        const isLinkingGitHub = localStorage.getItem('linkingGitHub') === 'true';
        const originalUserId = localStorage.getItem('originalUserId');
        
        if (isLinkingGitHub && originalUserId) {
          console.log('🔗 Handling GitHub linking with data migration');
          
          // Migrate all user data from original email user to this GitHub user
          await migrateUserData(originalUserId, session.user.id);
          
          // Save GitHub connection data to the new GitHub user profile
          await saveGitHubConnection(session.provider_token, session.user?.user_metadata || {});
          
          // Clean up linking state
          localStorage.removeItem('linkingGitHub');
          localStorage.removeItem('originalUserId');
          localStorage.removeItem('originalUserEmail');
          
          toast({
            title: "GitHub Connected & Data Migrated!",
            description: "Your account is now fully connected with GitHub. All your projects and data have been transferred.",
          });
          
          // Stay logged in as the GitHub user (don't sign out)
          window.location.href = '/github';
          return;
        } else {
          // Normal GitHub login flow
          await saveGitHubConnection(session.provider_token, session.user?.user_metadata || {});
        }
      } else {
        console.log('ℹ️ No provider token found, checking existing connection');
        await checkGitHubConnection();
      }
    };

    checkForGitHubCallback();
  }, [user, navigate]);

  const checkGitHubConnection = async () => {
    if (!user) return;

    console.log('🔍 Checking GitHub connection for user:', user.id);

    try {
      const { data: profile, error } = await supabase
        .from('profiles_secure_data')
        .select('has_github_token, github_username, github_connected_at')
        .eq('id', user.id)
        .maybeSingle();

      console.log('👤 Profile check result:', {
        hasProfile: !!profile,
        hasToken: !!(profile as any)?.has_github_token,
        username: (profile as any)?.github_username,
        connectedAt: (profile as any)?.github_connected_at,
        error: (error as any)?.message
      });

      if (!error && (profile as any)?.has_github_token) {
        console.log('✅ GitHub connection found, setting connected state');
        setIsConnected(true);
        setUserInfo({ username: (profile as any).github_username });
        // Don't automatically fetch repositories - wait for user to click "Show Repo"
      } else {
        console.log('❌ No GitHub connection found');
        setIsConnected(false);
      }
    } catch (error) {
      console.error('💥 Error checking GitHub connection:', error);
      setIsConnected(false);
    }
  };

  const saveGitHubConnection = async (accessToken: string, userData: any) => {
    if (!user) return;
    
    console.log('💾 Saving GitHub connection...', {
      userId: user.id,
      hasToken: !!accessToken,
      userData: userData
    });
    
    try {
      const authToken = (await supabase.auth.getSession()).data.session?.access_token;
      
      const normalized = {
        login: userData?.user_name || userData?.login || userData?.preferred_username || 'github-user',
        id: (userData?.user_id || userData?.id || userData?.sub || '').toString(),
      };
      
      console.log('🔄 Calling saveGitHubConnection function with:', normalized);
      
      const response = await supabase.functions.invoke('github-repos', {
        body: {
          action: 'saveGitHubConnection',
          accessToken,
          githubUserData: normalized,
        },
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });

      console.log('📡 Edge function response:', response);

      if (response.error) {
        console.error('❌ Edge function error:', response.error);
        throw new Error(response.error.message || 'Edge function failed');
      }

      if (response.data?.error) {
        console.error('❌ Edge function returned error:', response.data.error);
        throw new Error(response.data.error);
      }

      console.log('✅ GitHub connection saved, refreshing status');
      // Refresh connection status after saving
      await checkGitHubConnection();
    } catch (error: any) {
      console.error('💥 Error saving GitHub connection:', error);
      toast({
        title: "Connection failed",
        description: error.message || "Failed to save GitHub connection",
        variant: "destructive"
      });
    }
  };

  const migrateUserData = async (fromUserId: string, toUserId: string) => {
    console.log('🔄 Migrating user data...', {
      fromUserId,
      toUserId
    });
    
    try {
      // Call the migration function in Supabase
      const { error } = await supabase.rpc('migrate_user_data', {
        from_user_id: fromUserId,
        to_user_id: toUserId
      });

      if (error) {
        throw error;
      }

      console.log('✅ User data migrated successfully');
    } catch (error: any) {
      console.error('💥 Error migrating user data:', error);
      toast({
        title: "Migration failed",
        description: error.message || "Failed to migrate your data",
        variant: "destructive"
      });
    }
  };

  const handleShowRepositories = async () => {
    if (!user || !isConnected) {
      toast({
        title: "Not connected",
        description: "Please connect your GitHub account first",
        variant: "destructive"
      });
      return;
    }

    if (repositories.length === 0) {
      setIsLoading(true);
      
      try {
        const authToken = (await supabase.auth.getSession()).data.session?.access_token;
        
        const response = await supabase.functions.invoke('github-repos', {
          body: { action: 'fetchRepos' },
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        });

        console.log('📡 Edge function response:', response);

        if (response.error) {
          console.error('❌ Edge function error:', response.error);
          throw new Error(response.error.message || 'Edge function failed');
        }

        if (response.data?.error) {
          console.error('❌ Edge function returned error:', response.data.error);
          throw new Error(response.data.error);
        }

        if (response.data?.repositories) {
          console.log('✅ Repositories fetched:', response.data.repositories.length);
          setRepositories(response.data.repositories);
          
          // Auto-select all repositories up to the user's tier limit by default
          const reposToSelect = response.data.repositories.slice(0, maxProjects);
          const repoIds = reposToSelect.map((repo: Repository) => repo.id);
          setSelectedRepositories(new Set(repoIds));
        }
      } catch (error: any) {
        console.error('💥 Error fetching repositories:', error);
        toast({
          title: "Failed to fetch repositories",
          description: error.message || "Could not load your GitHub repositories",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    // Open repository selection modal
    setShowRepoSelectionModal(true);
  };

  const handleConnect = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to connect your GitHub account",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    // Check if the current email user already has a GitHub account associated
    if (user.app_metadata?.provider === 'email') {
      toast({
        title: "No GitHub Account Found",
        description: "There is no GitHub account associated with your login email. Please login with another email or login with GitHub directly!",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    console.log('🔗 Starting GitHub OAuth connection for existing user...');
    setIsLoading(true);
    
    try {
      // Store current user state for migration after GitHub OAuth
      localStorage.setItem('linkingGitHub', 'true');
      localStorage.setItem('originalUserId', user.id);
      localStorage.setItem('originalUserEmail', user.email || '');
      
      // Use signInWithOAuth but we'll handle the user merge in the callback
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          scopes: 'repo read:user',
          redirectTo: `${window.location.origin}/github`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        console.error('❌ GitHub OAuth error:', error);
        localStorage.removeItem('linkingGitHub');
        localStorage.removeItem('originalUserId');
        throw error;
      }

      console.log('✅ GitHub OAuth initiated successfully');
    } catch (error: any) {
      console.error('💥 GitHub OAuth error:', error);
      toast({
        title: "Connection failed",
        description: error.message || "Failed to connect GitHub account",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    console.log('🔌 Disconnecting GitHub...');
    setIsLoading(true);
    
    try {
      const authToken = (await supabase.auth.getSession()).data.session?.access_token;
      
      const response = await supabase.functions.invoke('github-repos', {
        body: { action: 'disconnectGitHub' },
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });

      console.log('📡 Disconnect response:', response);

      if (response.error) {
        console.error('❌ Disconnect error:', response.error);
        throw new Error(response.error.message || 'Disconnect failed');
      }

      if (response.data?.error) {
        console.error('❌ Disconnect returned error:', response.data.error);
        throw new Error(response.data.error);
      }

      console.log('✅ GitHub disconnected successfully');
      setIsConnected(false);
      setRepositories([]);
      setDisplayedRepositories([]);
      setShowRepositories(false);
      setUserInfo(null);

      toast({
        title: "GitHub Disconnected",
        description: "Your GitHub account has been disconnected successfully.",
      });
    } catch (error: any) {
      console.error('💥 Error disconnecting GitHub:', error);
      toast({
        title: "Disconnect failed",
        description: error.message || "Failed to disconnect GitHub account",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              GitHub Integration
            </h1>
            <p className="text-muted-foreground">
              {isConnected ? `Connected as ${userInfo?.username || 'GitHub User'}` : 'Connect your GitHub account to access repositories'}
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button 
              onClick={isConnected ? handleShowRepositories : handleConnect}
              disabled={isLoading}
              className="relative"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <>
                  <Github className="w-4 h-4 mr-2" />
                  {isConnected ? 'Show Repo' : 'Connect GitHub'}
                </>
              )}
            </Button>
            {isConnected && (
              <Button variant="outline" size="sm" onClick={handleDisconnect}>
                Disconnect
              </Button>
            )}
          </div>
        </div>

        {!isConnected && !isLoading && repositories.length === 0 && (
          <Card className="p-8 bg-card/50 backdrop-blur-sm text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-primary/20 rounded-full flex items-center justify-center">
              <Github className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Connect GitHub Account</h3>
            <p className="text-muted-foreground mb-4">
              Click "Connect GitHub" to link your GitHub account and view your repositories
            </p>
            <div className="mt-4 p-4 bg-muted/50 rounded-lg border-l-4 border-primary">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> To connect GitHub, please login with GitHub directly or use the email address associated with your GitHub account.
              </p>
            </div>
          </Card>
        )}

        {isConnected && showRepositories && displayedRepositories.length > 0 && (
          <div>
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search repositories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <TierBasedSelector 
                label="Repositories to display"
                onSelectionChange={setRepoDisplayCount}
                defaultValue={1}
              />
            </div>

            {/* Subscription tier info */}
            <div className="mb-4 p-4 bg-card/30 rounded-lg border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Showing {filteredRepos.length} of {displayedRepositories.length} selected repositories 
                  ({subscription?.tier || 'free'} tier: {maxProjects} max available)
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowRepoSelectionModal(true)}
                >
                  Change Selection
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              {filteredRepos.map((repo) => (
                <Card 
                  key={repo.id} 
                  className="p-6 hover:shadow-elegant transition-all duration-300 bg-card/50 backdrop-blur-sm"
                >
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold flex items-center">
                          {repo.name}
                          {repo.private && (
                            <span className="ml-2 text-xs bg-muted px-2 py-1 rounded">
                              Private
                            </span>
                          )}
                        </h3>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <p className="text-muted-foreground mb-4">
                        {repo.description}
                      </p>
                      
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-accent mr-2"></div>
                          {repo.language}
                        </div>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 mr-1" />
                          {repo.stars}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          Updated {repo.updatedAt}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 flex-wrap justify-end">
                      <Button variant="outline">
                        <GitBranch className="w-4 h-4 mr-2" />
                        Branches
                      </Button>
                      <Button 
                        variant="hero"
                        onClick={() => {/* handleAnalyzeRepo(repo) */}}
                      >
                        Analyze Code
                      </Button>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline">
                            <Lightbulb className="w-4 h-4 mr-2" />
                            Prompt Strategy
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] bg-background z-50">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Lightbulb className="w-5 h-5 text-primary" />
                              AI Prompt Strategy for {repo.name}
                            </DialogTitle>
                            <DialogDescription>
                              Generate optimized prompts for your {repo.language} codebase
                            </DialogDescription>
                          </DialogHeader>
                          <ScrollArea className="max-h-[60vh]">
                            <div className="space-y-6">
                              {/* Feature Input Section */}
                              <div className="space-y-3">
                                <Label htmlFor="feature-input" className="text-sm font-semibold">
                                  Describe the feature you want to implement:
                                </Label>
                                <Textarea
                                  id="feature-input"
                                  placeholder="e.g., Add user authentication with login/logout functionality"
                                  value={featureInput}
                                  onChange={(e) => setFeatureInput(e.target.value)}
                                  className="min-h-[80px]"
                                />
                                <Button
                                  onClick={() => generatePrompt(repo)}
                                  disabled={isGenerating || !featureInput.trim()}
                                  className="w-full"
                                >
                                  {isGenerating ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Generating...
                                    </>
                                  ) : (
                                    <>
                                      <Send className="h-4 w-4 mr-2" />
                                      Generate Optimized Prompt
                                    </>
                                  )}
                                </Button>
                              </div>

                              {/* Generated Prompt Section */}
                              {generatedPrompt && (
                                <>
                                  <Separator />
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <h4 className="font-semibold text-sm">Generated Prompt</h4>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => copyToClipboard(generatedPrompt)}
                                        className="h-8"
                                      >
                                        <Copy className="h-4 w-4 mr-1" />
                                        Copy
                                      </Button>
                                    </div>
                                    <div className="text-sm bg-muted p-4 rounded-md whitespace-pre-wrap">
                                      {generatedPrompt}
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {filteredRepos.length === 0 && displayedRepositories.length === 0 && !isLoading && (
              <Card className="p-12 text-center">
                <Github className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No repositories selected</h3>
                <p className="text-muted-foreground mb-4">
                  Click "Show Repo" to select repositories to display
                </p>
              </Card>
            )}

            {filteredRepos.length === 0 && searchTerm && displayedRepositories.length > 0 && !isLoading && (
              <Card className="p-12 text-center">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No repositories found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search terms or check if you have access to the repository
                </p>
              </Card>
            )}
          </div>
        )}

        {/* Repository Selection Modal */}
        <Dialog open={showRepoSelectionModal} onOpenChange={setShowRepoSelectionModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] bg-background border z-50">
            <DialogHeader>
              <DialogTitle>Select Repositories to Display</DialogTitle>
              <DialogDescription>
                Choose up to {maxProjects} repositories from your GitHub account ({subscription?.tier || 'free'} tier)
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all-repos"
                    checked={selectedRepositories.size > 0 && selectedRepositories.size === Math.min(repositories.length, maxProjects)}
                    onCheckedChange={handleSelectAllRepos}
                  />
                  <Label htmlFor="select-all-repos" className="text-sm font-medium">
                    Select All (up to {maxProjects})
                  </Label>
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedRepositories.size} of {maxProjects} selected
                </div>
              </div>
              
              <ScrollArea className="h-[400px] border rounded-md p-4 bg-card/50">
                <div className="space-y-3">
                  {repositories.slice(0, maxProjects).map((repo) => (
                    <div
                      key={repo.id}
                      className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        id={`repo-${repo.id}`}
                        checked={selectedRepositories.has(repo.id)}
                        onCheckedChange={(checked) => handleRepositorySelection(repo.id, checked as boolean)}
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Label
                            htmlFor={`repo-${repo.id}`}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {repo.name}
                          </Label>
                          {repo.private && (
                            <Badge variant="secondary" className="text-xs">Private</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {repo.description || 'No description'}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-accent mr-1"></div>
                            {repo.language || 'Unknown'}
                          </span>
                          <span className="flex items-center">
                            <Star className="w-3 h-3 mr-1" />
                            {repo.stars}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              {repositories.length > maxProjects && (
                <div className="p-3 bg-muted/30 rounded-lg border border-primary/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {repositories.length - maxProjects} more repositories available
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate('/pricing')}
                    >
                      Upgrade Plan
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowRepoSelectionModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmSelection}
                  disabled={selectedRepositories.size === 0}
                >
                  Show Selected ({selectedRepositories.size})
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default GitHubConnect;