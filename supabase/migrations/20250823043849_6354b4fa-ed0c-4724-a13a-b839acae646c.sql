-- Enable Row Level Security on the profiles_with_decrypted_tokens view
ALTER VIEW public.profiles_with_decrypted_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to only view their own decrypted tokens
CREATE POLICY "Users can only view their own decrypted tokens" 
ON public.profiles_with_decrypted_tokens 
FOR SELECT 
USING (auth.uid() = id);

-- Create policy to prevent any inserts/updates/deletes on the view
CREATE POLICY "No modifications allowed on decrypted tokens view" 
ON public.profiles_with_decrypted_tokens 
FOR ALL 
USING (false) 
WITH CHECK (false);