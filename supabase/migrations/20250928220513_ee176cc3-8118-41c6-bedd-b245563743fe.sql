-- Fix the migrate_user_data function to work with the new token storage system
CREATE OR REPLACE FUNCTION public.migrate_user_data(from_user_id uuid, to_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow the current user to migrate their own data
  IF auth.uid() != from_user_id AND auth.uid() != to_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot migrate another user''s data';
  END IF;
  
  -- Migrate projects
  UPDATE public.projects 
  SET user_id = to_user_id, updated_at = now()
  WHERE user_id = from_user_id;
  
  -- Migrate project analyses
  UPDATE public.project_analyses 
  SET user_id = to_user_id, updated_at = now()
  WHERE user_id = from_user_id;
  
  -- Migrate user tokens (GitHub access tokens)
  UPDATE public.user_tokens
  SET user_id = to_user_id, updated_at = now()
  WHERE user_id = from_user_id;
  
  -- Copy profile data from old user to new user
  INSERT INTO public.profiles (
    id, 
    github_username, 
    github_user_id, 
    github_connected_at,
    created_at,
    updated_at
  )
  SELECT 
    to_user_id,
    COALESCE(new_profile.github_username, old_profile.github_username),
    COALESCE(new_profile.github_user_id, old_profile.github_user_id),
    COALESCE(new_profile.github_connected_at, old_profile.github_connected_at),
    COALESCE(new_profile.created_at, old_profile.created_at, now()),
    now()
  FROM public.profiles old_profile
  LEFT JOIN public.profiles new_profile ON new_profile.id = to_user_id
  WHERE old_profile.id = from_user_id
  ON CONFLICT (id) DO UPDATE SET
    github_username = COALESCE(EXCLUDED.github_username, profiles.github_username),
    github_user_id = COALESCE(EXCLUDED.github_user_id, profiles.github_user_id),
    github_connected_at = COALESCE(EXCLUDED.github_connected_at, profiles.github_connected_at),
    updated_at = now();
    
  -- Delete the old profile
  DELETE FROM public.profiles WHERE id = from_user_id;
END;
$$;