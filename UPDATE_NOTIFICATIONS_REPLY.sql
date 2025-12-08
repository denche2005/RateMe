-- Update notifications table constraint to include 'REPLY' type
-- This allows the database to accept REPLY notifications for mentions

ALTER TABLE public.notifications
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
ADD CONSTRAINT notifications_type_check
CHECK (type IN ('RATING', 'DESCRIBED', 'SAVED', 'REPOSTED', 'COMMENT', 'REPLY'));
