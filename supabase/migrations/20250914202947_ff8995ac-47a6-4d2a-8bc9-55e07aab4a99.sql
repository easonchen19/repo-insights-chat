-- Fix the get_user_github_token function to resolve ambiguous column references
CREATE OR REPLACE FUNCTION public.get_user_github_token()
 RETURNS TABLE(id uuid, github_username text, github_user_id text, github_access_token text, github_connected_at timestamp with time zone, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only return the current user's decrypted token from secure table
  RETURN QUERY
  SELECT 
    p.id,
    p.github_username,
    p.github_user_id,
    public.decrypt_github_token(ut.encrypted_token) as github_access_token,
    p.github_connected_at,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  LEFT JOIN public.user_tokens ut ON ut.user_id = p.id AND ut.token_type = 'github_access_token'
  WHERE p.id = auth.uid();
END;
$function$;