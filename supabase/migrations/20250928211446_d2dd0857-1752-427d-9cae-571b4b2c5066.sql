-- First drop the problematic function
DROP FUNCTION IF EXISTS public.update_github_token(uuid,text,jsonb);

-- Recreate with fixed parameter naming
CREATE OR REPLACE FUNCTION public.update_github_token(user_id_param uuid, new_token text, github_user_data jsonb DEFAULT NULL::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only allow users to update their own tokens
  IF auth.uid() != user_id_param THEN
    RAISE EXCEPTION 'Unauthorized: Cannot update another user''s token';
  END IF;
  
  -- Update profile metadata (non-sensitive data)
  UPDATE public.profiles 
  SET 
    github_username = COALESCE(github_user_data->>'login', github_username),
    github_user_id = COALESCE(github_user_data->>'id', github_user_id),
    github_connected_at = now(),
    updated_at = now()
  WHERE id = user_id_param;
  
  -- Create profile if it doesn't exist
  IF NOT FOUND THEN
    INSERT INTO public.profiles (
      id, 
      github_username, 
      github_user_id, 
      github_connected_at
    ) VALUES (
      user_id_param,
      github_user_data->>'login',
      github_user_data->>'id',
      now()
    );
  END IF;
  
  -- Store encrypted token in secure table
  INSERT INTO public.user_tokens (user_id, token_type, encrypted_token)
  VALUES (user_id_param, 'github_access_token', public.encrypt_github_token(new_token))
  ON CONFLICT (user_id, token_type) 
  DO UPDATE SET 
    encrypted_token = public.encrypt_github_token(new_token),
    updated_at = now(),
    last_used_at = now();
END;
$function$