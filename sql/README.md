# SQL Scripts

This folder contains all SQL scripts for setting up and maintaining the Supabase database.

## Setup Scripts (Run in order)

1. **supabase_schema.sql** - Main database schema (tables, RLS policies, indexes)
2. **BADGE_AVERAGES_TRIGGER.sql** - Trigger to calculate badge averages
3. **FIX_TRIGGERS_FINAL.sql** - Comment count triggers (run if counters are broken)
4. **FEED_FEATURES_SETUP.sql** - Feed features (saved posts, reposts)
5. **ENABLE_REALTIME.sql** - Enable real-time subscriptions
6. **UPDATE_NOTIFICATIONS_REPLY.sql** - Add REPLY type to notifications constraint

## When to Run

- **Initial Setup**: Run scripts 1-5 in order
- **After Comments Bug**: Run `FIX_TRIGGERS_FINAL.sql`
- **After Adding REPLY Type**: Run `UPDATE_NOTIFICATIONS_REPLY.sql`

## Important Notes

- Always backup your database before running scripts
- Run scripts in Supabase SQL Editor
- Check for errors after each script
