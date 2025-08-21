-- Enable crypto extension for encryption functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a secure function to encrypt GitHub tokens
CREATE OR REPLACE FUNCTION public.encrypt_github_token(token TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  encryption_key TEXT;
BEGIN
  -- Use a combination of the user's ID and a system secret for the encryption key
  -- This ensures each user's tokens are encrypted with a unique key
  encryption_key := encode(digest(auth.uid()::text || 'github_token_salt_' || current_setting('app.github_token_secret', true), 'sha256'), 'hex');
  
  -- Encrypt the token using AES
  RETURN encode(encrypt(token::bytea, encryption_key::bytea, 'aes'), 'base64');
END;
$$;

-- Create a secure function to decrypt GitHub tokens
CREATE OR REPLACE FUNCTION public.decrypt_github_token(encrypted_token TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  encryption_key TEXT;
  decrypted_token TEXT;
BEGIN
  -- Return NULL if no token provided
  IF encrypted_token IS NULL OR encrypted_token = '' THEN
    RETURN NULL;
  END IF;
  
  -- Use the same key derivation as encryption
  encryption_key := encode(digest(auth.uid()::text || 'github_token_salt_' || current_setting('app.github_token_secret', true), 'sha256'), 'hex');
  
  -- Decrypt the token
  decrypted_token := convert_from(decrypt(decode(encrypted_token, 'base64'), encryption_key::bytea, 'aes'), 'UTF8');
  
  RETURN decrypted_token;
EXCEPTION
  WHEN OTHERS THEN
    -- Return NULL on decryption error (corrupted data, wrong key, etc.)
    RETURN NULL;
END;
$$;

-- Create a view that automatically decrypts tokens for authorized users
CREATE OR REPLACE VIEW public.profiles_with_decrypted_tokens AS
SELECT 
  id,
  github_user_id,
  github_username,
  github_connected_at,
  created_at,
  updated_at,
  -- Only decrypt for the token owner
  CASE 
    WHEN auth.uid() = id THEN public.decrypt_github_token(github_access_token)
    ELSE NULL 
  END as github_access_token
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.profiles_with_decrypted_tokens TO authenticated;

-- Create RLS policies for the view
ALTER VIEW public.profiles_with_decrypted_tokens SET (security_barrier = true);

-- Add a helper function to safely update encrypted tokens
CREATE OR REPLACE FUNCTION public.update_github_token(user_id UUID, new_token TEXT, github_user_data JSONB DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
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