-- Qualify pgcrypto functions to avoid search_path issues (Supabase keeps extensions in the "extensions" schema)
CREATE OR REPLACE FUNCTION public.encrypt_github_token(token text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  encryption_key bytea;
  pepper TEXT;
BEGIN
  IF token IS NULL OR token = '' THEN
    RETURN NULL;
  END IF;

  pepper := COALESCE(current_setting('app.github_token_secret', true), '');

  -- Use extensions.digest to ensure resolution regardless of search_path
  encryption_key := extensions.digest(
    convert_to(COALESCE(auth.uid()::text, '') || 'github_token_salt_' || pepper, 'UTF8'),
    'sha256'
  );
  
  -- Use extensions.encrypt for AES encryption
  RETURN encode(
    extensions.encrypt(convert_to(token, 'UTF8'), encryption_key, 'aes'),
    'base64'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_github_token(encrypted_token text)
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
  IF encrypted_token IS NULL OR encrypted_token = '' THEN
    RETURN NULL;
  END IF;
  
  pepper := COALESCE(current_setting('app.github_token_secret', true), '');
  encryption_key := extensions.digest(
    convert_to(COALESCE(auth.uid()::text, '') || 'github_token_salt_' || pepper, 'UTF8'),
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

-- Ensure execute privileges (usually default, but make explicit)
GRANT EXECUTE ON FUNCTION public.encrypt_github_token(text) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.decrypt_github_token(text) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_github_token(uuid, text, jsonb) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_github_token() TO PUBLIC;