-- Fix the GitHub token decryption issue by modifying the get_user_github_token function
-- to properly handle user context from edge functions

CREATE OR REPLACE FUNCTION public.get_user_github_token()
 RETURNS TABLE(id uuid, github_username text, github_user_id text, github_access_token text, github_connected_at timestamp with time zone, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get the current user ID - this should work in edge function context
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Only return the current user's decrypted token from secure table
  RETURN QUERY
  SELECT 
    p.id,
    p.github_username,
    p.github_user_id,
    public.decrypt_github_token_for_user(ut.encrypted_token, current_user_id) as github_access_token,
    p.github_connected_at,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  LEFT JOIN public.user_tokens ut ON ut.user_id = p.id AND ut.token_type = 'github_access_token'
  WHERE p.id = current_user_id;
END;
$$;

-- Create a new decrypt function that accepts user_id as parameter
CREATE OR REPLACE FUNCTION public.decrypt_github_token_for_user(encrypted_token text, user_id_param uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  encryption_key bytea;
  pepper TEXT;
  decrypted_token TEXT;
BEGIN
  IF encrypted_token IS NULL OR encrypted_token = '' OR user_id_param IS NULL THEN
    RETURN NULL;
  END IF;
  
  pepper := COALESCE(current_setting('app.github_token_secret', true), '');
  encryption_key := extensions.digest(
    convert_to(user_id_param::text || 'github_token_salt_' || pepper, 'UTF8'),
    'sha256'
  );
  
  decrypted_token := convert_from(
    extensions.decrypt(
      decode(encrypted_token, 'base64'),
      encryption_key,
      'aes'
    ),
    'UTF8'
  );
  RETURN decrypted_token;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;