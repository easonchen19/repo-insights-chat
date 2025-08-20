-- Fix security warnings by setting proper search_path for functions
CREATE OR REPLACE FUNCTION public.set_user_id_for_projects()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_user_id_for_project_analyses()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$;