-- ============================================
-- FINAL FIX FOR COMMENTS SYSTEM
-- Execute this ONCE in Supabase SQL Editor
-- ============================================

-- Step 1: Ensure comments_count column exists on posts table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'posts' AND column_name = 'comments_count'
    ) THEN
        ALTER TABLE public.posts ADD COLUMN comments_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added comments_count column to posts table';
    ELSE
        RAISE NOTICE 'comments_count column already exists';
    END IF;
END $$;

-- Step 2: Ensure likes_count column exists on comments table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comments' AND column_name = 'likes_count'
    ) THEN
        ALTER TABLE public.comments ADD COLUMN likes_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added likes_count column to comments table';
    ELSE
        RAISE NOTICE 'likes_count column already exists';
    END IF;
END $$;

-- Step 3: Create/recreate trigger function for post comments count
CREATE OR REPLACE FUNCTION public.update_posts_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.posts 
        SET comments_count = comments_count + 1 
        WHERE id = NEW.post_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.posts 
        SET comments_count = GREATEST(comments_count - 1, 0) 
        WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Drop and recreate trigger on comments table
DROP TRIGGER IF EXISTS on_comment_change ON public.comments;
CREATE TRIGGER on_comment_change
AFTER INSERT OR DELETE ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.update_posts_comments_count();

-- Step 5: Create/recreate trigger function for comment likes count
CREATE OR REPLACE FUNCTION public.update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.comments 
        SET likes_count = likes_count + 1 
        WHERE id = NEW.comment_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.comments 
        SET likes_count = GREATEST(likes_count - 1, 0) 
        WHERE id = OLD.comment_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Drop and recreate trigger on comment_likes table
DROP TRIGGER IF EXISTS on_comment_like_change ON public.comment_likes;
CREATE TRIGGER on_comment_like_change
AFTER INSERT OR DELETE ON public.comment_likes
FOR EACH ROW EXECUTE FUNCTION public.update_comment_likes_count();

-- Step 7: RECALCULATE ALL EXISTING COUNTS (CRITICAL!)
-- This fixes the "0 on refresh" issue
UPDATE public.posts p
SET comments_count = (
    SELECT COUNT(*) 
    FROM public.comments c 
    WHERE c.post_id = p.id
);

UPDATE public.comments c
SET likes_count = (
    SELECT COUNT(*) 
    FROM public.comment_likes cl 
    WHERE cl.comment_id = c.id
);

-- Step 8: Verify the fix
SELECT 
    'Posts with comments' as check_type,
    COUNT(*) as count
FROM public.posts 
WHERE comments_count > 0

UNION ALL

SELECT 
    'Comments with likes' as check_type,
    COUNT(*) as count
FROM public.comments 
WHERE likes_count > 0;

-- Done!
RAISE NOTICE 'Comments system fixed! Counts recalculated.';
