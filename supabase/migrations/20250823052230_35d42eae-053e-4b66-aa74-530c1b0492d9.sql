-- Fix permission issue and make get_user_github_token function accessible to service role
-- Set proper search_path to fix security warnings

-- Update the function with proper permissions and search_path
CREATE OR REPLACE FUNCTION public.get_user_github_token()
RETURNS TABLE(id uuid, github_username text, github_user_id text, github_access_token text, github_connected_at timestamp with time zone, created_at timestamp with time zone, updated_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- Update other functions to have proper search_path
CREATE OR REPLACE FUNCTION public.encrypt_github_token(token text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  encryption_key TEXT;
  pepper TEXT;
BEGIN
  -- Return NULL if no token provided
  IF token IS NULL OR token = '' THEN
    RETURN NULL;
  END IF;

  -- Derive pepper from DB setting if present; fallback to empty string
  pepper := COALESCE(current_setting('app.github_token_secret', true), '');

  -- Derive encryption key deterministically per-user with optional pepper
  encryption_key := encode(digest(COALESCE(auth.uid()::text, '') || 'github_token_salt_' || pepper, 'sha256'), 'hex');
  
  -- Encrypt the token using AES and return base64
  RETURN encode(encrypt(token::bytea, encryption_key::bytea, 'aes'), 'base64');
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_github_token(encrypted_token text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  encryption_key TEXT;
  pepper TEXT;
  decrypted_token TEXT;
BEGIN
  -- Return NULL if no token provided
  IF encrypted_token IS NULL OR encrypted_token = '' THEN
    RETURN NULL;
  END IF;
  
  -- Match key derivation with encryption; tolerate missing setting
  pepper := COALESCE(current_setting('app.github_token_secret', true), '');
  encryption_key := encode(digest(COALESCE(auth.uid()::text, '') || 'github_token_salt_' || pepper, 'sha256'), 'hex');
  
  -- Decrypt and return
  decrypted_token := convert_from(decrypt(decode(encrypted_token, 'base64'), encryption_key::bytea, 'aes'), 'UTF8');
  RETURN decrypted_token;
EXCEPTION
  WHEN OTHERS THEN
    -- Return NULL on decryption error (corrupted data, wrong key, etc.)
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_github_token(user_id uuid, new_token text, github_user_data jsonb DEFAULT NULL::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow users to update their own tokens
  IF auth.uid() != user_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot update another user''s token';
  END IF;
  
  -- Update with encrypted token
  UPDATE public.profiles 
  SET 
    github_access_token = public.encrypt_github_token(new_token),
    github_username = COALESCE(github_user_data->>'login', github_username),
    github_user_id = COALESCE(github_user_data->>'id', github_user_id),
    github_connected_at = now(),
    updated_at = now()
  WHERE id = user_id;
  
  -- Create profile if it doesn't exist
  IF NOT FOUND THEN
    INSERT INTO public.profiles (
      id, 
      github_access_token, 
      github_username, 
      github_user_id, 
      github_connected_at
    ) VALUES (
      user_id,
      public.encrypt_github_token(new_token),
      github_user_data->>'login',
      github_user_data->>'id',
      now()
    );
  END IF;
END;
$$;