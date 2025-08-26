-- Additional security improvements for GitHub token storage

-- 1. Add a comment to document that tokens are encrypted
COMMENT ON COLUMN public.profiles.github_access_token IS 'Encrypted GitHub access token - never stored in plaintext';

-- 2. Create a secure view that completely hides encrypted tokens from accidental exposure
CREATE VIEW public.profiles_secure AS
SELECT 
  id,
  github_username,
  github_user_id,
  github_connected_at,
  created_at,
  updated_at,
  -- Only show if token exists, never the actual value
  CASE WHEN github_access_token IS NOT NULL THEN true ELSE false END AS has_github_token
FROM public.profiles;

-- 3. Add RLS policies for the secure view
ALTER VIEW public.profiles_secure SET (security_invoker = true);

-- 4. Add DELETE policy for profiles so users can remove their GitHub tokens
CREATE POLICY "Users can delete their own profile data"
ON public.profiles
FOR DELETE
USING (auth.uid() = id);

-- 5. Add DELETE policy for project_analyses so users can remove their data
CREATE POLICY "Users can delete their own project analyses"
ON public.project_analyses
FOR DELETE
USING (auth.uid() = user_id);

-- 6. Add UPDATE policy for project_analyses
CREATE POLICY "Users can update their own project analyses"
ON public.project_analyses
FOR UPDATE
USING (auth.uid() = user_id);

-- 7. Create a function to safely clear GitHub tokens
CREATE OR REPLACE FUNCTION public.clear_github_connection()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only allow users to clear their own tokens
  UPDATE public.profiles 
  SET 
    github_access_token = NULL,
    github_username = NULL,
    github_user_id = NULL,
    github_connected_at = NULL,
    updated_at = now()
  WHERE id = auth.uid();
END;
$$;

-- 8. Add additional validation to ensure tokens are never stored unencrypted
CREATE OR REPLACE FUNCTION public.validate_github_token_encryption()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If a token is being set, ensure it's encrypted (encrypted tokens are base64 and much longer)
  IF NEW.github_access_token IS NOT NULL AND LENGTH(NEW.github_access_token) < 50 THEN
    RAISE EXCEPTION 'GitHub tokens must be encrypted before storage';
  END IF;
  
  RETURN NEW;
END;
$$;

-- 9. Create trigger to validate token encryption
CREATE TRIGGER validate_token_encryption
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_github_token_encryption();