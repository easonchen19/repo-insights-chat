-- Drop the existing insecure view
DROP VIEW IF EXISTS public.profiles_with_decrypted_tokens;

-- Create a secure function to get user's own decrypted GitHub token
CREATE OR REPLACE FUNCTION public.get_user_github_token()
RETURNS TABLE(
  id uuid,
  github_username text,
  github_user_id text,
  github_access_token text,
  github_connected_at timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only return the current user's decrypted token
  RETURN QUERY
  SELECT 
    p.id,
    p.github_username,
    p.github_user_id,
    public.decrypt_github_token(p.github_access_token) as github_access_token,
    p.github_connected_at,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.id = auth.uid();
END;
$$;

-- Grant execute permission to authenticated users only
REVOKE ALL ON FUNCTION public.get_user_github_token() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_github_token() TO authenticated;