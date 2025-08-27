-- Fix the encrypt_github_token function with proper type casting
CREATE OR REPLACE FUNCTION public.encrypt_github_token(token text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  encryption_key bytea;
  pepper TEXT;
BEGIN
  -- Return NULL if no token provided
  IF token IS NULL OR token = '' THEN
    RETURN NULL;
  END IF;

  -- Derive pepper from DB setting if present; fallback to empty string
  pepper := COALESCE(current_setting('app.github_token_secret', true), '');

  -- Derive raw 32-byte key using pgcrypto digest with proper type casting
  encryption_key := digest(convert_to(COALESCE(auth.uid()::text, '') || 'github_token_salt_' || pepper, 'UTF8'), 'sha256');
  
  -- Encrypt the token using AES and return base64
  RETURN encode(encrypt(convert_to(token, 'UTF8'), encryption_key, 'aes'), 'base64');
END;
$function$;

-- Fix the decrypt_github_token function with proper type casting
CREATE OR REPLACE FUNCTION public.decrypt_github_token(encrypted_token text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  encryption_key bytea;
  pepper TEXT;
  decrypted_token TEXT;
BEGIN
  -- Return NULL if no token provided
  IF encrypted_token IS NULL OR encrypted_token = '' THEN
    RETURN NULL;
  END IF;
  
  -- Match key derivation with encryption; tolerate missing setting
  pepper := COALESCE(current_setting('app.github_token_secret', true), '');
  encryption_key := digest(convert_to(COALESCE(auth.uid()::text, '') || 'github_token_salt_' || pepper, 'UTF8'), 'sha256');
  
  -- Decrypt and return
  decrypted_token := convert_from(
    decrypt(
      decode(encrypted_token, 'base64'),
      encryption_key,
      'aes'
    ),
    'UTF8'
  );
  RETURN decrypted_token;
EXCEPTION
  WHEN OTHERS THEN
    -- Return NULL on decryption error (corrupted data, wrong key, etc.)
    RETURN NULL;
END;
$function$;