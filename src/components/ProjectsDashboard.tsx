import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, Download, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AnalysisReport from "./AnalysisReport";
import { TierBasedSelector } from "./TierBasedSelector";

interface Project {
  id: string;
  name: string;
  file_count: number;
  total_size: number;
  created_at: string;
  upload_path: string;
}

interface Analysis {
  id: string;
  project_id: string;
  analysis_report: string;
  file_count: number;
  created_at: string;
}

const ProjectsDashboard = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(1);

  useEffect(() => {
    fetchProjects();
    fetchAnalyses();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalyses = async () => {
    try {
      const { data, error } = await supabase
        .from('project_analyses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnalyses(data || []);
    } catch (error) {
      console.error('Error fetching analyses:', error);
    }
  };

  const getAnalysisForProject = (projectId: string) => {
    return analyses.find(analysis => analysis.project_id === projectId);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Projects Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your uploaded projects and view AI-powered analysis reports
          </p>
        </div>
        <TierBasedSelector 
          label="Projects to display"
          onSelectionChange={setDisplayCount}
          defaultValue={1}
        />
      </div>

      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="projects">All Projects</TabsTrigger>
          <TabsTrigger value="analyses">Analysis Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          {projects.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Projects Yet</h3>
                <p className="text-muted-foreground">
                  Upload your first project to get started with AI-powered analysis
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.slice(0, displayCount).map((project) => {
                const analysis = getAnalysisForProject(project.id);
                return (
                  <Card key={project.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="truncate">{project.name}</span>
                        {analysis && (
                          <Badge variant="secondary">
                            <Eye className="w-3 h-3 mr-1" />
                            Analyzed
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {project.file_count} files • {formatFileSize(project.total_size)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4 mr-2" />
                          {formatDate(project.created_at)}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedProject(project)}
                            className="flex-1"
                          >
                            {analysis ? 'View Analysis' : 'Analyze'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analyses" className="space-y-4">
          {analyses.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Analysis Reports</h3>
                <p className="text-muted-foreground">
                  Run AI analysis on your projects to see detailed reports here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {analyses.slice(0, displayCount).map((analysis) => {
                const project = projects.find(p => p.id === analysis.project_id);
                return (
                  <Card key={analysis.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Analysis Report - {project?.name}</span>
                        <Badge variant="outline">
                          {analysis.file_count} files analyzed
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Generated on {formatDate(analysis.created_at)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedProject(project!)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Report
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Analysis Modal/View */}
      {selectedProject && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Project Analysis</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedProject(null)}
              >
                ✕
              </Button>
            </div>
            <div className="p-6 overflow-auto max-h-[calc(90vh-120px)]">
              <AnalysisReport
                projectId={selectedProject.id}
                projectName={selectedProject.name}
                onAnalysisComplete={() => fetchAnalyses()}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsDashboard;