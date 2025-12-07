# 🗂️ SQL Files Reference

## Active Files (Use These)

### `FINAL_FINAL_TRIGGER.sql`
**Purpose:** Main trigger system for rating calculations
- Updates post `average_rating` when ratings are added
- Updates user `average_score` based on post averages
- Combines both operations in sequential order
- Uses `SECURITY DEFINER` to bypass RLS

**When to use:** Only if you need to recreate triggers from scratch

### `CLEAN_FINAL_TEST.sql`
**Purpose:** Clean database for testing
- Deletes all posts
- Deletes all ratings
- Resets profile stats to 0

**When to use:** Before testing or when you want a fresh start

### `supabase_schema.sql`
**Purpose:** Complete database schema
- All table definitions
- RLS policies
- Triggers
- Constraints

**When to use:** Setting up Supabase from scratch

---

## Archived Files

All debug/test SQL files have been moved to `sql_archive/` directory.
These files are no longer needed but kept for reference.

You can safely delete the entire `sql_archive/` folder.
