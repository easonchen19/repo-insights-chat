import { useState, useEffect } from "react";
import { Github, Search, Star, GitBranch, Calendar, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

interface RepoSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (repo: Repository) => void;
}

const RepoSelectionModal = ({ isOpen, onClose, onSelect }: RepoSelectionModalProps) => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [filteredRepos, setFilteredRepos] = useState<Repository[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && repositories.length === 0) {
      fetchRepositories();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = repositories.filter(repo =>
        repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        repo.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        repo.language?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredRepos(filtered);
    } else {
      setFilteredRepos(repositories);
    }
  }, [searchTerm, repositories]);

  const fetchRepositories = async () => {
    setIsLoading(true);
    try {
      const authToken = (await supabase.auth.getSession()).data.session?.access_token;
      
      const response = await supabase.functions.invoke('github-repos', {
        body: { action: 'fetchRepos' },
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.repositories) {
        setRepositories(response.data.repositories);
        setFilteredRepos(response.data.repositories);
      }
    } catch (error: any) {
      console.error('Error fetching repositories:', error);
      toast({
        title: "Failed to fetch repositories",
        description: error.message || "Could not load your GitHub repositories",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRepo = () => {
    if (selectedRepo) {
      onSelect(selectedRepo);
      onClose();
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="w-5 h-5" />
            Select a Repository
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search repositories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Repository List */}
          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>Loading repositories...</span>
              </div>
            ) : filteredRepos.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {searchTerm ? 'No repositories match your search.' : 'No repositories found.'}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRepos.map((repo) => (
                  <Card
                    key={repo.id}
                    className={`p-4 cursor-pointer transition-all hover:shadow-md border-2 ${
                      selectedRepo?.id === repo.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedRepo(repo)}
                  >
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground truncate">
                              {repo.name}
                            </h3>
                            <Badge variant={repo.private ? "destructive" : "secondary"}>
                              {repo.private ? "Private" : "Public"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {repo.full_name}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(repo.html_url, '_blank');
                          }}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Description */}
                      {repo.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {repo.description}
                        </p>
                      )}

                      {/* Metadata */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {repo.language && (
                          <div className="flex items-center gap-1">
                            <div 
                              className="w-2 h-2 rounded-full bg-primary"
                            />
                            <span>{repo.language}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          <span>{repo.stars}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <GitBranch className="w-3 h-3" />
                          <span>{repo.default_branch}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Updated {formatDate(repo.updatedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSelectRepo} 
              disabled={!selectedRepo}
              className="min-w-[120px]"
            >
              Start Chatting
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RepoSelectionModal;