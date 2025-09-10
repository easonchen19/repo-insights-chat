-- Create a separate secure table for storing encrypted tokens
CREATE TABLE public.user_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_type TEXT NOT NULL CHECK (token_type IN ('github_access_token')),
  encrypted_token TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  -- Ensure one token per type per user
  UNIQUE(user_id, token_type)
);

-- Enable RLS on the new tokens table
ALTER TABLE public.user_tokens ENABLE ROW LEVEL SECURITY;

-- Create strict RLS policies for the tokens table
CREATE POLICY "Users can only access their own tokens"
ON public.user_tokens
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_user_tokens_updated_at
BEFORE UPDATE ON public.user_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing GitHub tokens to the new secure table
INSERT INTO public.user_tokens (user_id, token_type, encrypted_token, created_at, updated_at)
SELECT 
  id as user_id,
  'github_access_token' as token_type,
  github_access_token as encrypted_token,
  github_connected_at as created_at,
  updated_at
FROM public.profiles 
WHERE github_access_token IS NOT NULL;

-- Update the get_user_github_token function to use the new table
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
SET search_path = 'public'
AS $$
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
$$;

-- Update the update_github_token function to use the new secure table
CREATE OR REPLACE FUNCTION public.update_github_token(user_id uuid, new_token text, github_user_data jsonb DEFAULT NULL::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only allow users to update their own tokens
  IF auth.uid() != user_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot update another user''s token';
  END IF;
  
  -- Update profile metadata (non-sensitive data)
  UPDATE public.profiles 
  SET 
    github_username = COALESCE(github_user_data->>'login', github_username),
    github_user_id = COALESCE(github_user_data->>'id', github_user_id),
    github_connected_at = now(),
    updated_at = now()
  WHERE id = user_id;
  
  -- Create profile if it doesn't exist
  IF NOT FOUND THEN
    INSERT INTO public.profiles (
      id, 
      github_username, 
      github_user_id, 
      github_connected_at
    ) VALUES (
      user_id,
      github_user_data->>'login',
      github_user_data->>'id',
      now()
    );
  END IF;
  
  -- Store encrypted token in secure table
  INSERT INTO public.user_tokens (user_id, token_type, encrypted_token)
  VALUES (user_id, 'github_access_token', public.encrypt_github_token(new_token))
  ON CONFLICT (user_id, token_type) 
  DO UPDATE SET 
    encrypted_token = public.encrypt_github_token(new_token),
    updated_at = now(),
    last_used_at = now();
END;
$$;

-- Update the clear_github_connection function to use the new secure table
CREATE OR REPLACE FUNCTION public.clear_github_connection()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Remove sensitive token from secure table
  DELETE FROM public.user_tokens 
  WHERE user_id = auth.uid() AND token_type = 'github_access_token';
  
  -- Clear GitHub metadata from profiles
  UPDATE public.profiles 
  SET 
    github_username = NULL,
    github_user_id = NULL,
    github_connected_at = NULL,
    updated_at = now()
  WHERE id = auth.uid();
END;
$$;

-- Add function to track token usage for security auditing
CREATE OR REPLACE FUNCTION public.track_token_usage(token_type_param text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.user_tokens 
  SET last_used_at = now()
  WHERE user_id = auth.uid() AND token_type = token_type_param;
END;
$$;

-- Remove the github_access_token column from profiles table (keeping other GitHub metadata)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS github_access_token;

-- Update the validation trigger to work with the new table
DROP TRIGGER IF EXISTS validate_github_token_encryption_trigger ON public.profiles;

CREATE OR REPLACE FUNCTION public.validate_token_encryption()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Ensure tokens are encrypted (encrypted tokens are base64 and much longer)
  IF NEW.encrypted_token IS NOT NULL AND LENGTH(NEW.encrypted_token) < 50 THEN
    RAISE EXCEPTION 'Tokens must be encrypted before storage';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_token_encryption_trigger
BEFORE INSERT OR UPDATE ON public.user_tokens
FOR EACH ROW
EXECUTE FUNCTION public.validate_token_encryption();