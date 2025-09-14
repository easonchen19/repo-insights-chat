-- Drop the obsolete trigger function that references non-existent github_access_token column
DROP FUNCTION IF EXISTS public.validate_github_token_encryption() CASCADE;

-- Remove any triggers that might be calling this function
DROP TRIGGER IF EXISTS validate_github_token_encryption ON public.profiles;