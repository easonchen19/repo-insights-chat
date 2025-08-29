
import { useState, useEffect } from "react";
import { Code, Github, Menu, X, FolderOpen, Brain, LogOut, User, Link, Unlink, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import UploadButton from "./UploadButton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGitHubConnected, setIsGitHubConnected] = useState(false);
  const [githubUsername, setGithubUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check GitHub connection status when user changes
  useEffect(() => {
    let cancelled = false;

    const checkGitHubConnection = async () => {
      if (!user) {
        setIsGitHubConnected(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('github_access_token, github_username')
          .eq('id', user.id)
          .maybeSingle();

        if (!cancelled) {
          setIsGitHubConnected(!error && !!profile?.github_access_token);
          setGithubUsername(profile?.github_username || null);
        }
      } catch (error) {
        console.error('Error checking GitHub connection:', error);
        if (!cancelled) {
          setIsGitHubConnected(false);
        }
      }
    };

    checkGitHubConnection();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleGitHubConnect = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to connect your GitHub account",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    setIsLoading(true);
    
    try {
      // Sign in with GitHub OAuth through Supabase
      // Store current user state to restore after GitHub OAuth
      localStorage.setItem('linkingGitHub', 'true');
      localStorage.setItem('originalUserId', user.id);
      
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
        throw error;
      }
    } catch (error: any) {
      console.error('GitHub OAuth error:', error);
      toast({
        title: "Connection failed",
        description: error.message || "Failed to connect to GitHub",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const handleGitHubDisconnect = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
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
      setIsGitHubConnected(false);
      setGithubUsername(null);
      
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <NavLink to="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <Code className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-vibe bg-clip-text text-transparent animate-shimmer bg-[length:200%_auto]">
              Lovable Mate
            </span>
          </NavLink>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <NavLink 
              to="/github" 
              className={({ isActive }) => 
                `flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`
              }
            >
              <Github className="w-4 h-4" />
              GitHub
            </NavLink>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <UploadButton variant="outline" size="sm" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <User className="w-4 h-4 mr-2" />
                      Account
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {isGitHubConnected ? (
                      <>
                        {githubUsername && (
                          <DropdownMenuItem asChild>
                            <a 
                              href={`https://github.com/${githubUsername}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center"
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              GitHub Homepage
                            </a>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleGitHubDisconnect} disabled={isLoading}>
                          <Unlink className="w-4 h-4 mr-2" />
                          {isLoading ? 'Disconnecting...' : 'GitHub Disconnect'}
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <DropdownMenuItem onClick={handleGitHubConnect} disabled={isLoading}>
                        <Link className="w-4 h-4 mr-2" />
                        {isLoading ? 'Connecting...' : 'GitHub Connect'}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" asChild>
                  <NavLink to="/auth">Sign In</NavLink>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50">
            <div className="flex flex-col space-y-4">
              <NavLink 
                to="/github" 
                className="flex items-center gap-2 text-sm font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                <Github className="w-4 h-4" />
                GitHub
              </NavLink>
              {user ? (
                <>
                  <UploadButton variant="outline" size="sm" />
                  {isGitHubConnected ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGitHubDisconnect}
                      disabled={isLoading}
                      className="flex items-center gap-2 justify-start"
                    >
                      <Unlink className="w-4 h-4" />
                      {isLoading ? 'Disconnecting...' : 'GitHub Disconnect'}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGitHubConnect}
                      disabled={isLoading}
                      className="flex items-center gap-2 justify-start"
                    >
                      <Link className="w-4 h-4" />
                      {isLoading ? 'Connecting...' : 'GitHub Connect'}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSignOut}
                    className="flex items-center gap-2 justify-start"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" asChild>
                  <NavLink to="/auth">Sign In</NavLink>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
