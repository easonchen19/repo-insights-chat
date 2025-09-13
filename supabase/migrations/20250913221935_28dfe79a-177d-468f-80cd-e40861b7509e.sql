-- Test and fix the clear_github_connection function
-- First let's see what constraint might be causing the issue
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  CASE 
    WHEN contype = 'u' THEN 'UNIQUE'
    WHEN contype = 'p' THEN 'PRIMARY KEY'
    WHEN contype = 'f' THEN 'FOREIGN KEY'
    WHEN contype = 'c' THEN 'CHECK'
    ELSE 'OTHER'
  END as constraint_description
FROM pg_constraint 
WHERE conrelid = 'user_tokens'::regclass;

-- Add a unique constraint if missing to prevent duplicate tokens per user
ALTER TABLE user_tokens DROP CONSTRAINT IF EXISTS user_tokens_user_id_token_type_key;
ALTER TABLE user_tokens ADD CONSTRAINT user_tokens_user_id_token_type_key UNIQUE (user_id, token_type);