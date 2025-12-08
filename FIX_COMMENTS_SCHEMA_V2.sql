-- 1. Force cleanup of potential bad state
DROP TABLE IF EXISTS public.comment_likes;
-- We don't drop comments table to preserve data if it exists, 
-- but if it was created with wrong FK, it might be an issue.
-- However, if 'public.users' didn't exist, the table creation likely failed.
-- So we try to create it again.

-- 2. Ensure comments_count exists on posts
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

-- 3. Create comments table (if not exists) - CORRECTED REFERENCE
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- Changed from users to profiles
    text TEXT NOT NULL CHECK (char_length(text) > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    likes_count INTEGER DEFAULT 0
);

-- Enable RLS on comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Policies for comments
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
CREATE POLICY "Comments are viewable by everyone" ON public.comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own comments" ON public.comments;
CREATE POLICY "Users can insert their own comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;
CREATE POLICY "Users can delete their own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);


-- 4. Create comment_likes table (Again) - CORRECTED REFERENCE
CREATE TABLE IF NOT EXISTS public.comment_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- Changed from users to profiles
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(comment_id, user_id)
);

-- 5. Enable RLS on comment_likes
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comment likes are viewable by everyone" ON public.comment_likes;
CREATE POLICY "Comment likes are viewable by everyone" ON public.comment_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own comment likes" ON public.comment_likes;
CREATE POLICY "Users can insert their own comment likes" ON public.comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comment likes" ON public.comment_likes;
CREATE POLICY "Users can delete their own comment likes" ON public.comment_likes FOR DELETE USING (auth.uid() = user_id);

-- 6. Trigger for likes_count on comments
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

DROP TRIGGER IF EXISTS on_comment_like_change ON public.comment_likes;
CREATE TRIGGER on_comment_like_change
AFTER INSERT OR DELETE ON public.comment_likes
FOR EACH ROW EXECUTE FUNCTION public.update_comment_likes_count();

-- 7. Trigger for comments_count on posts
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

DROP TRIGGER IF EXISTS on_comment_change ON public.comments;
CREATE TRIGGER on_comment_change
AFTER INSERT OR DELETE ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.update_posts_comments_count();

-- 8. RECALCULATE COUNTS (Fixes the "0 comments" bug)
UPDATE public.posts p
SET comments_count = (
    SELECT count(*) 
    FROM public.comments c 
    WHERE c.post_id = p.id
);

-- Grant permissions
GRANT ALL ON public.comments TO postgres;
GRANT ALL ON public.comments TO anon;
GRANT ALL ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;

GRANT ALL ON public.comment_likes TO postgres;
GRANT ALL ON public.comment_likes TO anon;
GRANT ALL ON public.comment_likes TO authenticated;
GRANT ALL ON public.comment_likes TO service_role;

-- Force schema cache reload
NOTIFY pgrst, 'reload config';
