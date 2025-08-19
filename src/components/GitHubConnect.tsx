import { useState } from "react";
import { Github, Search, Star, GitBranch, Calendar, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface Repository {
  id: number;
  name: string;
  description: string;
  language: string;
  stars: number;
  updatedAt: string;
  private: boolean;
}

const GitHubConnect = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    setIsLoading(true);
    
    // Simulate GitHub OAuth flow
    setTimeout(() => {
      setIsConnected(true);
      setIsLoading(false);
      
      // Mock repositories data
      setRepositories([
        {
          id: 1,
          name: "awesome-project",
          description: "A full-stack web application built with React and Node.js",
          language: "TypeScript",
          stars: 127,
          updatedAt: "2024-01-15",
          private: false
        },
        {
          id: 2,
          name: "ml-algorithms",
          description: "Implementation of various machine learning algorithms",
          language: "Python",
          stars: 89,
          updatedAt: "2024-01-10",
          private: true
        },
        {
          id: 3,
          name: "mobile-app",
          description: "Cross-platform mobile application using React Native",
          language: "JavaScript",
          stars: 45,
          updatedAt: "2024-01-08",
          private: false
        }
      ]);
      
      toast({
        title: "Connected to GitHub",
        description: "Successfully connected your GitHub account",
      });
    }, 2000);
  };

  const handleAnalyzeRepo = (repo: Repository) => {
    toast({
      title: "Analysis started",
      description: `Analyzing repository: ${repo.name}`,
    });
  };

  const filteredRepos = repositories.filter(repo =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isConnected) {
    return (
      <div className="min-h-screen pt-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              Connect GitHub
            </h1>
            <p className="text-muted-foreground text-lg">
              Connect your GitHub account to analyze your repositories
            </p>
          </div>

          <Card className="p-12 bg-card/50 backdrop-blur-sm">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-primary rounded-full flex items-center justify-center">
              <Github className="w-10 h-10 text-white" />
            </div>
            
            <h3 className="text-2xl font-semibold mb-4">
              Authorize GitHub Access
            </h3>
            
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              We'll securely connect to your GitHub account to access your repositories. 
              You can revoke access at any time in your GitHub settings.
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
            
            <div className="mt-6 text-sm text-muted-foreground">
              <p>✓ Secure OAuth authentication</p>
              <p>✓ Read-only access to repositories</p>
              <p>✓ No code is stored on our servers</p>
            </div>
          </Card>
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
              Your Repositories
            </h1>
            <p className="text-muted-foreground">
              Select a repository to analyze its codebase
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center text-sm text-muted-foreground">
              <Github className="w-4 h-4 mr-2" />
              Connected as username
            </div>
            <Button variant="outline" size="sm">
              Disconnect
            </Button>
          </div>
        </div>

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

        {filteredRepos.length === 0 && searchTerm && (
          <Card className="p-12 text-center">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No repositories found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms or check if you have access to the repository
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default GitHubConnect;