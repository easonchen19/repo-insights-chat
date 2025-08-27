
import { useState, useEffect } from "react";
import { Github, Search, Star, GitBranch, Calendar, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

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
  
  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState("");
  const [analyzedFiles, setAnalyzedFiles] = useState<any[]>([]);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [currentRepo, setCurrentRepo] = useState<Repository | null>(null);
  
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
      console.log('📋 Session data:', {
        hasSession: !!session,
        hasProviderToken: !!session?.provider_token,
        // provider is not a property of Session; if needed, read it from user.app_metadata
        appProvider: session?.user?.app_metadata?.provider,
        userMetadata: session?.user?.user_metadata
      });
      
      if (session?.provider_token && session?.user?.app_metadata?.provider === 'github') {
        console.log('✅ Found GitHub provider token, saving connection');
        await saveGitHubConnection(session.provider_token, session.user?.user_metadata || {});
      } else {
        console.log('ℹ️ No provider token found, checking existing connection');
        // Just check existing connection
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
        .from('profiles')
        .select('github_access_token, github_username, github_connected_at')
        .eq('id', user.id)
        .single();

      console.log('👤 Profile check result:', {
        hasProfile: !!profile,
        hasToken: !!profile?.github_access_token,
        username: profile?.github_username,
        connectedAt: profile?.github_connected_at,
        error: error?.message
      });

      if (!error && profile?.github_access_token) {
        console.log('✅ GitHub connection found, setting connected state');
        setIsConnected(true);
        setUserInfo({ username: profile.github_username });
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
      
      toast({
        title: "GitHub Connected Successfully!",
        description: `Connected to ${normalized.login}'s GitHub account. Loading repositories...`,
      });
    } catch (error: any) {
      console.error('💥 Error saving GitHub connection:', error);
      toast({
        title: "Connection failed",
        description: error.message || "Failed to save GitHub connection",
        variant: "destructive"
      });
    }
  };

  const fetchRepositories = async () => {
    if (!user) return;
    
    console.log('📂 Fetching repositories for user:', user.id);
    
    try {
      setIsLoading(true);
      
      const authToken = (await supabase.auth.getSession()).data.session?.access_token;
      
      console.log('🔄 Calling fetchRepos function...');
      
      const response = await supabase.functions.invoke('github-repos', {
        body: {
          action: 'fetchRepos'
        },
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });

      console.log('📡 Fetch repos response:', response);

      if (response.error) {
        console.error('❌ Fetch repos error:', response.error);
        throw new Error(response.error.message);
      }

      if (response.data?.repositories) {
        console.log('✅ Repositories loaded:', response.data.repositories.length);
        setRepositories(response.data.repositories);
        
        // Show success message with GitHub username and repo count
        const username = userInfo?.username || response.data.username || 'your GitHub account';
        toast({
          title: `Connected to ${username}!`,
          description: `Successfully loaded ${response.data.repositories.length} repositories from your GitHub account.`,
        });
      }
    } catch (error: any) {
      console.error('💥 Error fetching repositories:', error);
      
      // Provide specific error messages based on the error type
      let errorMessage = error.message || "Could not fetch GitHub repositories";
      let errorTitle = "Failed to load repositories";
      
      if (error.message?.includes('GitHub account not connected')) {
        errorTitle = "GitHub Connection Lost";
        errorMessage = "Your GitHub connection has expired. Please reconnect your account.";
        setIsConnected(false);
        setUserInfo(null);
      } else if (error.message?.includes('GitHub API error: 401')) {
        errorTitle = "GitHub Token Expired";
        errorMessage = "Your GitHub access token has expired. Please reconnect your account.";
        setIsConnected(false);
        setUserInfo(null);
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const ensureTokenAndFetch = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔎 ensureTokenAndFetch check:', {
        isConnected,
        hasProviderToken: !!session?.provider_token,
        provider: session?.user?.app_metadata?.provider
      });

      if (!isConnected && session?.provider_token && session?.user?.app_metadata?.provider === 'github') {
        console.log('🔐 Provider token found in session; saving connection...');
        await saveGitHubConnection(session.provider_token, session.user.user_metadata || {});
        await fetchRepositories();
        return;
      }

      if (isConnected) {
        if (!showRepositories) {
          setShowRepositories(true);
          await fetchRepositories();
        } else {
          setShowRepositories(false);
        }
        return;
      }

      await handleConnect();
    } catch (e) {
      console.error('💥 ensureTokenAndFetch error:', e);
    } finally {
      setIsLoading(false);
    }
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

    console.log('🔗 Starting GitHub OAuth connection...');
    setIsLoading(true);
    
    try {
      // Sign in with GitHub OAuth through Supabase
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
        console.error('❌ OAuth error:', error);
        throw error;
      }

      console.log('✅ OAuth initiated successfully');
    } catch (error: any) {
      console.error('💥 GitHub OAuth error:', error);
      toast({
        title: "Connection failed",
        description: error.message || "Failed to connect to GitHub",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };


  const handleAnalyzeRepo = async (repo: Repository) => {
    if (!user || !isConnected) {
      toast({
        title: "Not connected",
        description: "Please connect your GitHub account first",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const authToken = (await supabase.auth.getSession()).data.session?.access_token;
      
      // Fetch repository contents
      const response = await supabase.functions.invoke('github-repos', {
        body: {
          action: 'fetchRepoContents',
          repo_owner: repo.full_name.split('/')[0],
          repo_name: repo.full_name.split('/')[1]
        },
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.files) {
        // Navigate to analyzer page with repo files
        navigate('/analyzer', {
          state: {
            repoFiles: response.data.files,
            repoName: repo.name,
            autoStart: true // Flag to auto-start analysis
          }
        });
      }
    } catch (error: any) {
      console.error('Error analyzing repository:', error);
      toast({
        title: "Analysis failed",
        description: error.message || "Could not analyze repository",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startAnalysis = async (files: any[]) => {
    setIsAnalyzing(true);
    setAnalysis("");

    try {
      const SUPABASE_URL = "https://wfywmkdqyuucxftpvmfj.supabase.co";
      const authToken = (await supabase.auth.getSession()).data.session?.access_token;
      const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmeXdta2RxeXV1Y3hmdHB2bWZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NjkwNjEsImV4cCI6MjA3MTE0NTA2MX0.elHXCxBIqmz0IlcuOcKlY0gnIB88wK4rgbbpz9be244";

      const response = await fetch(`${SUPABASE_URL}/functions/v1/analyze-codebase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken || SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          analysisId: `github-${currentRepo?.id}-${Date.now()}`,
          files: files.map(file => ({
            name: file.path,
            content: file.content || '',
            type: file.type || 'other'
          })),
          isDirectAnalysis: true
        })
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to start analysis');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'delta' && data.text) {
                setAnalysis(prev => prev + data.text);
              } else if (data.type === 'complete') {
                setIsAnalyzing(false);
                toast({
                  title: "Analysis completed",
                  description: `Successfully analyzed ${files.length} files.`,
                });
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      setIsAnalyzing(false);
      toast({
        title: "Analysis failed",
        description: "There was an error analyzing your files. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatAnalysis = (text: string) => {
    if (!text) return null;

    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let currentIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={currentIndex++} className="text-2xl font-bold mt-6 mb-3 text-foreground">
            {line.substring(2)}
          </h1>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={currentIndex++} className="text-xl font-semibold mt-5 mb-2 text-foreground">
            {line.substring(3)}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={currentIndex++} className="text-lg font-medium mt-4 mb-2 text-foreground">
            {line.substring(4)}
          </h3>
        );
      } else if (line.startsWith('```')) {
        let codeBlock = '';
        i++;
        while (i < lines.length && !lines[i].startsWith('```')) {
          codeBlock += lines[i] + '\n';
          i++;
        }
        elements.push(
          <pre key={currentIndex++} className="bg-muted p-4 rounded-lg my-3 overflow-x-auto">
            <code className="text-sm text-muted-foreground">{codeBlock}</code>
          </pre>
        );
      } else if (line.startsWith('- ')) {
        const listItems = [line];
        while (i + 1 < lines.length && lines[i + 1].startsWith('- ')) {
          i++;
          listItems.push(lines[i]);
        }
        elements.push(
          <ul key={currentIndex++} className="list-disc list-inside my-3 space-y-1">
            {listItems.map((item, idx) => (
              <li key={idx} className="text-muted-foreground">{item.substring(2)}</li>
            ))}
          </ul>
        );
      } else if (line.trim() !== '') {
        const boldRegex = /\*\*(.*?)\*\*/g;
        const parts = line.split(boldRegex);
        const formattedLine = parts.map((part, idx) => 
          idx % 2 === 1 ? <strong key={idx} className="font-semibold">{part}</strong> : part
        );
        
        elements.push(
          <p key={currentIndex++} className="mb-2 text-muted-foreground leading-relaxed">
            {formattedLine}
          </p>
        );
      }
    }

    return elements;
  };

  const handleDisconnect = async () => {
    if (!user) return;
    
    try {
      const authToken = (await supabase.auth.getSession()).data.session?.access_token;
      
      const response = await supabase.functions.invoke('github-repos', {
        body: {
          action: 'disconnectGitHub'
        },
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      // Update local state
      setIsConnected(false);
      setGithubAccessToken(null);
      setRepositories([]);
      setUserInfo(null);
      
      toast({
        title: "Disconnected",
        description: "GitHub account disconnected successfully",
      });
    } catch (error: any) {
      console.error('Error disconnecting GitHub:', error);
      toast({
        title: "Disconnect failed",
        description: error.message || "Failed to disconnect GitHub account",
        variant: "destructive"
      });
    }
  };

  const filteredRepos = repositories.filter(repo =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (showAnalysis) {
    return (
      <div className="min-h-screen pt-20 px-6">
        <div className="max-w-full mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-1">
                Analysis: {currentRepo?.name}
              </h1>
              <p className="text-muted-foreground text-sm">
                {currentRepo?.description}
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowAnalysis(false)}
            >
              Back to Repositories
            </Button>
          </div>

          <div className="flex gap-6 h-[calc(100vh-8rem)]">
            {/* Left Panel - Files */}
            <div className="w-1/3 bg-card/50 backdrop-blur-sm rounded-lg border p-4 overflow-y-auto">
              <h3 className="font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">
                Repository Files ({analyzedFiles.length})
              </h3>
              <div className="space-y-2">
                {analyzedFiles.map((file, index) => (
                  <div 
                    key={index}
                    className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="text-sm font-medium truncate">{file.path}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {file.type} • {file.content ? `${file.content.length} chars` : 'Empty'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Panel - Analysis */}
            <div className="flex-1 bg-card/50 backdrop-blur-sm rounded-lg border p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                  Analysis Report
                </h3>
                {isAnalyzing && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                    Analyzing...
                  </div>
                )}
              </div>

              {analysis ? (
                <div className="prose prose-sm max-w-none">
                  {formatAnalysis(analysis)}
                </div>
              ) : isAnalyzing ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Analyzing repository files...</p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No analysis available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
              GitHub Integration
            </h1>
            <p className="text-muted-foreground">
              Connect and manage your GitHub repositories
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center text-sm text-muted-foreground">
            <Github className="w-4 h-4 mr-2" />
            {isConnected ? `Connected as ${userInfo?.username || 'GitHub User'}` : 'GitHub Integration'}
          </div>
          <div className="flex gap-2">
            {isConnected && userInfo?.username && (
              <Button variant="outline" size="sm" asChild>
                <a 
                  href={`https://github.com/${userInfo.username}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View GitHub Profile
                </a>
              </Button>
            )}
            <Button 
              variant="hero" 
              onClick={ensureTokenAndFetch}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isConnected ? 'Loading...' : 'Connecting...'}
                </div>
              ) : (
                <>
                  <Github className="w-4 h-4 mr-2" />
                  {isConnected ? (showRepositories ? 'Hide Repo' : 'Show Repo') : 'Connect GitHub'}
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
            <p className="text-muted-foreground">
              Click "Show Repo" to connect your GitHub account and view your repositories
            </p>
          </Card>
        )}

        {isConnected && showRepositories && (
          <div>

            {repositories.length > 0 && (
              <>
                <div className="mb-6">
                  <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search repositories..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="grid gap-4">
                  {filteredRepos.map((repo) => (
                    <Card 
                      key={repo.id} 
                      className="p-6 hover:shadow-elegant transition-all duration-300 bg-card/50 backdrop-blur-sm"
                    >
                      <div className="flex items-start justify-between">
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
                        
                        <div className="flex gap-2">
                          <Button variant="outline">
                            <GitBranch className="w-4 h-4 mr-2" />
                            Branches
                          </Button>
                          <Button 
                            variant="hero"
                            onClick={() => handleAnalyzeRepo(repo)}
                          >
                            Analyze Code
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {repositories.length === 0 && !isLoading && isConnected && (
              <Card className="p-12 text-center">
                <Github className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No repositories loaded</h3>
                <p className="text-muted-foreground mb-4">
                  Click "Show GitHub Repos" to load your accessible repositories
                </p>
              </Card>
            )}

            {filteredRepos.length === 0 && searchTerm && repositories.length > 0 && !isLoading && (
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
      </div>
    </div>
  );
};

export default GitHubConnect;
