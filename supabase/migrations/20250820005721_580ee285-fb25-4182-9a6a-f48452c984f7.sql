-- Add user_id column to projects table to enable user-based access control
ALTER TABLE public.projects 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to project_analyses table 
ALTER TABLE public.project_analyses 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Anyone can view projects" ON public.projects;
DROP POLICY IF EXISTS "Anyone can create projects" ON public.projects;
DROP POLICY IF EXISTS "Anyone can view project analyses" ON public.project_analyses;
DROP POLICY IF EXISTS "Anyone can create project analyses" ON public.project_analyses;

-- Create secure user-based RLS policies for projects
CREATE POLICY "Users can view their own projects" 
ON public.projects 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects" 
ON public.projects 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" 
ON public.projects 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" 
ON public.projects 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Create secure user-based RLS policies for project_analyses
CREATE POLICY "Users can view their own project analyses" 
ON public.project_analyses 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own project analyses" 
ON public.project_analyses 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create trigger to automatically set user_id for projects
CREATE OR REPLACE FUNCTION public.set_user_id_for_projects()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_projects_user_id
  BEFORE INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id_for_projects();

-- Create trigger to automatically set user_id for project_analyses
CREATE OR REPLACE FUNCTION public.set_user_id_for_project_analyses()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_project_analyses_user_id
  BEFORE INSERT ON public.project_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id_for_project_analyses();