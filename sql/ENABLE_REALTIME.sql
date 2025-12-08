-- Enable Realtime for notifications and profiles tables
-- Run this in Supabase SQL Editor

-- Enable Realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Enable Realtime for profiles table (for badge averages real-time updates)
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- Verify it worked
SELECT 
    schemaname,
    tablename
FROM 
    pg_publication_tables
WHERE 
    pubname = 'supabase_realtime';
