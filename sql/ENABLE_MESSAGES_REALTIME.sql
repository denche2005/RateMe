-- Enable Realtime for Messages
-- Run this in Supabase SQL Editor

-- 1. Enable realtime on messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 2. Enable realtime on conversations table (for last_message updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- Verify realtime is enabled
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
