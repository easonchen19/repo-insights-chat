-- Enable RLS on the profiles_secure view
ALTER VIEW public.profiles_secure SET (security_barrier = true);

-- Since views don't support RLS policies directly, we need to recreate profiles_secure 
-- as a security definer function that enforces proper access control
DROP VIEW IF EXISTS public.profiles_secure;

-- Create a secure function that only returns the current user's profile data
CREATE OR REPLACE FUNCTION public.get_current_user_profile_secure()
RETURNS TABLE (
  id uuid,
  github_username text,
  github_user_id text,
  github_connected_at timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  has_github_token boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only return the current authenticated user's profile data
  RETURN QUERY
  SELECT 
    p.id,
    p.github_username,
    p.github_user_id,
    p.github_connected_at,
    p.created_at,
    p.updated_at,
    CASE WHEN ut.encrypted_token IS NOT NULL THEN true ELSE false END as has_github_token
  FROM public.profiles p
  LEFT JOIN public.user_tokens ut ON ut.user_id = p.id AND ut.token_type = 'github_access_token'
  WHERE p.id = auth.uid();
END;
$$;

-- Create a secure table-based approach instead of a view for better RLS control
CREATE TABLE public.profiles_secure_data (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  github_username text,
  github_user_id text,
  github_connected_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  has_github_token boolean NOT NULL DEFAULT false
);

-- Enable RLS on the new secure table
ALTER TABLE public.profiles_secure_data ENABLE ROW LEVEL SECURITY;

-- Create strict RLS policies for profiles_secure_data
CREATE POLICY "Users can only view their own secure profile data"
ON public.profiles_secure_data
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can only insert their own secure profile data"
ON public.profiles_secure_data
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can only update their own secure profile data"
ON public.profiles_secure_data
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can only delete their own secure profile data"
ON public.profiles_secure_data
FOR DELETE
USING (auth.uid() = id);

-- Create a function to sync profiles_secure_data with profiles and token status
CREATE OR REPLACE FUNCTION public.sync_profiles_secure_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Insert or update profiles_secure_data when profiles table changes
  INSERT INTO public.profiles_secure_data (
    id,
    github_username,
    github_user_id,
    github_connected_at,
    created_at,
    updated_at,
    has_github_token
  )
  SELECT 
    NEW.id,
    NEW.github_username,
    NEW.github_user_id,
    NEW.github_connected_at,
    NEW.created_at,
    NEW.updated_at,
    CASE WHEN ut.encrypted_token IS NOT NULL THEN true ELSE false END
  FROM public.user_tokens ut
  WHERE ut.user_id = NEW.id AND ut.token_type = 'github_access_token'
  
  UNION ALL
  
  SELECT 
    NEW.id,
    NEW.github_username,
    NEW.github_user_id,
    NEW.github_connected_at,
    NEW.created_at,
    NEW.updated_at,
    false
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_tokens ut 
    WHERE ut.user_id = NEW.id AND ut.token_type = 'github_access_token'
  )
  LIMIT 1
  
  ON CONFLICT (id) DO UPDATE SET
    github_username = EXCLUDED.github_username,
    github_user_id = EXCLUDED.github_user_id,
    github_connected_at = EXCLUDED.github_connected_at,
    updated_at = EXCLUDED.updated_at,
    has_github_token = EXCLUDED.has_github_token;
    
  RETURN NEW;
END;
$$;

-- Create trigger to automatically sync profiles_secure_data
CREATE TRIGGER sync_profiles_secure_data_trigger
AFTER INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profiles_secure_data();

-- Create a function to sync token status when user_tokens change
CREATE OR REPLACE FUNCTION public.sync_token_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Update has_github_token status in profiles_secure_data
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.profiles_secure_data 
    SET 
      has_github_token = true,
      updated_at = now()
    WHERE id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles_secure_data 
    SET 
      has_github_token = false,
      updated_at = now()
    WHERE id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger to sync token status
CREATE TRIGGER sync_token_status_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.user_tokens
FOR EACH ROW
EXECUTE FUNCTION public.sync_token_status();

-- Populate the profiles_secure_data table with existing data
INSERT INTO public.profiles_secure_data (
  id,
  github_username,
  github_user_id,
  github_connected_at,
  created_at,
  updated_at,
  has_github_token
)
SELECT 
  p.id,
  p.github_username,
  p.github_user_id,
  p.github_connected_at,
  p.created_at,
  p.updated_at,
  CASE WHEN ut.encrypted_token IS NOT NULL THEN true ELSE false END as has_github_token
FROM public.profiles p
LEFT JOIN public.user_tokens ut ON ut.user_id = p.id AND ut.token_type = 'github_access_token'
ON CONFLICT (id) DO NOTHING;

-- Create a secure view that references the RLS-protected table
CREATE VIEW public.profiles_secure AS
SELECT 
  id,
  github_username,
  github_user_id,
  github_connected_at,
  created_at,
  updated_at,
  has_github_token
FROM public.profiles_secure_data;

-- Add trigger for automatic timestamp updates on profiles_secure_data
CREATE TRIGGER update_profiles_secure_data_updated_at
BEFORE UPDATE ON public.profiles_secure_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();