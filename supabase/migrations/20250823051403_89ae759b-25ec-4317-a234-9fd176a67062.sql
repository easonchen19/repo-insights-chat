-- Fix encryption functions to work without requiring app.github_token_secret being set
-- Use COALESCE on current_setting to avoid NULL-derived keys that produced NULL ciphertexts

CREATE OR REPLACE FUNCTION public.encrypt_github_token(token text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
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
