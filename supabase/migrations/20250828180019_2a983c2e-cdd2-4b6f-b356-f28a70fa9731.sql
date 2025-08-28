-- Enable Row Level Security on profiles_secure table
ALTER TABLE public.profiles_secure ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles_secure table to restrict access to user's own data
CREATE POLICY "Users can view their own secure profile data" 
ON public.profiles_secure 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own secure profile data" 
ON public.profiles_secure 
FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own secure profile data" 
ON public.profiles_secure 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can delete their own secure profile data" 
ON public.profiles_secure 
FOR DELETE 
USING (auth.uid() = id);