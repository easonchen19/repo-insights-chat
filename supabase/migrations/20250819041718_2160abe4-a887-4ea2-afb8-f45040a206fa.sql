-- Create table for storing project analyses
CREATE TABLE public.project_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  analysis_report TEXT NOT NULL,
  file_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.project_analyses ENABLE ROW LEVEL SECURITY;

-- Create policies for project analyses
CREATE POLICY "Anyone can view project analyses" 
ON public.project_analyses 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create project analyses" 
ON public.project_analyses 
FOR INSERT 
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_project_analyses_updated_at
BEFORE UPDATE ON public.project_analyses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_project_analyses_project_id ON public.project_analyses(project_id);
CREATE INDEX idx_project_analyses_created_at ON public.project_analyses(created_at DESC);