
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
      
      if (session?.provider_token) {
        console.log('✅ Found provider token, saving GitHub connection');
        await saveGitHubConnection(session.provider_token, session.user?.user_metadata || {});
      } else {
        console.log('ℹ️ No provider token, checking existing connection');
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
        // Automatically fetch repositories when connected
        await fetchRepositories();
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
        throw new Error(response.error.message);
      }

      console.log('✅ GitHub connection saved, refreshing status');
      // Refresh connection status after saving
      await checkGitHubConnection();
      
      toast({
        title: "GitHub Connected",
        description: "Successfully connected to your GitHub account",
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
        toast({
          title: "Repositories loaded",
          description: `Found ${response.data.repositories.length} repositories`,
        });
      }
    } catch (error: any) {
      console.error('💥 Error fetching repositories:', error);
      toast({
        title: "Failed to load repositories",
        description: error.message || "Could not fetch GitHub repositories",
        variant: "destructive"
      });
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
        // Navigate to analyzer with the fetched files
        navigate('/analyzer', { 
          state: { 
            repoFiles: response.data.files,
            repoName: repo.name,
            repoDescription: repo.description
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

        {!isConnected ? (
          <Card className="p-12 bg-card/50 backdrop-blur-sm text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-primary rounded-full flex items-center justify-center">
              <Github className="w-10 h-10 text-white" />
            </div>
            
            <h3 className="text-2xl font-semibold mb-4">
              Connect GitHub Account
            </h3>
            
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Connect your GitHub account to access and analyze your repositories
            </p>
            
            <Button 
              variant="hero" 
              size="lg" 
              onClick={handleConnect}
              disabled={isLoading}
              className="min-w-48"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Connecting...
                </div>
              ) : (
                <>
                  <Github className="w-5 h-5 mr-2" />
                  Connect with GitHub
                </>
              )}
            </Button>
          </Card>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center text-sm text-muted-foreground">
                <Github className="w-4 h-4 mr-2" />
                Connected as {userInfo?.username || 'GitHub User'}
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="hero" 
                  onClick={fetchRepositories}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Loading...
                    </div>
                  ) : (
                    <>
                      <Github className="w-4 h-4 mr-2" />
                      Show GitHub Repos
                    </>
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={handleDisconnect}>
                  Disconnect
                </Button>
              </div>
            </div>

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
