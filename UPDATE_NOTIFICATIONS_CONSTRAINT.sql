-- Drop existing check constraint if it exists
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add updated check constraint including 'COMMENT'
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('RATING', 'DESCRIBED', 'SAVED', 'REPOSTED', 'COMMENT'));
