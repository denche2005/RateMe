-- ============================================
-- RATEME APP - SUPABASE DATABASE SCHEMA
-- ============================================
-- Execute this in your Supabase SQL Editor
-- Order: Run sections 1-4 in sequence

-- ============================================
-- 1. TABLES
-- ============================================

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT DEFAULT 'New to RateMe!',
  age INTEGER,
  nation TEXT,
  
  -- Stats
  coins INTEGER DEFAULT 0,
  average_score DECIMAL(4,2) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  
  -- Social
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  
  -- Badges (stored as JSONB)
  badge_averages JSONB DEFAULT '{"Intelligence": 0, "Charisma": 0, "Affectionate": 0, "Humor": 0, "Active": 0, "Extroverted": 0}'::jsonb,
  
  -- Rating history for charts
  rating_history JSONB DEFAULT '[]'::jsonb,
  
  -- Privacy & verification
  is_verified BOOLEAN DEFAULT false,
  is_private BOOLEAN DEFAULT false,
  streak_days INTEGER DEFAULT 0,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rater_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  target_id UUID NOT NULL, -- Can be user or post
  target_type TEXT NOT NULL CHECK (target_type IN ('user', 'post')),
  
  value INTEGER NOT NULL CHECK (value >= 1 AND value <= 10),
  badges JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate ratings
  UNIQUE(rater_id, target_id, target_type)
);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  caption TEXT,
  
  average_rating DECIMAL(4,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0,
  repost_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('RATING', 'DESCRIBED')),
  
  rater_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rater_name TEXT NOT NULL,
  score DECIMAL(4,2),
  emoji TEXT,
  
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  post_media_url TEXT,
  badge_scores JSONB,
  
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Follows table
CREATE TABLE IF NOT EXISTS follows (
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- ============================================
-- 2. INDEXES for better performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_ratings_target ON ratings(target_id, target_type);
CREATE INDEX IF NOT EXISTS idx_ratings_rater ON ratings(rater_id);
CREATE INDEX IF NOT EXISTS idx_ratings_created_at ON ratings(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_creator ON posts(creator_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);

CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

-- ============================================
-- 3. FUNCTIONS FOR AUTO-CALCULATIONS
-- ============================================

-- Function to recalculate user stats after a rating
CREATE OR REPLACE FUNCTION recalculate_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Only recalculate if target is a user
  IF NEW.target_type = 'user' THEN
    UPDATE profiles
    SET 
      average_score = (
        SELECT COALESCE(AVG(value), 0)::DECIMAL(4,2)
        FROM ratings
        WHERE target_id = NEW.target_id AND target_type = 'user'
      ),
      total_ratings = (
        SELECT COUNT(*)
        FROM ratings
        WHERE target_id = NEW.target_id AND target_type = 'user'
      ),
      badge_averages = (
        SELECT COALESCE(
          jsonb_build_object(
            'Intelligence', ROUND(AVG((badges->>'Intelligence')::numeric), 2),
            'Charisma', ROUND(AVG((badges->>'Charisma')::numeric), 2),
            'Affectionate', ROUND(AVG((badges->>'Affectionate')::numeric), 2),
            'Humor', ROUND(AVG((badges->>'Humor')::numeric), 2),
            'Active', ROUND(AVG((badges->>'Active')::numeric), 2),
            'Extroverted', ROUND(AVG((badges->>'Extroverted')::numeric), 2)
          ),
          '{"Intelligence": 0, "Charisma": 0, "Affectionate": 0, "Humor": 0, "Active": 0, "Extroverted": 0}'::jsonb
        )
        FROM ratings
        WHERE target_id = NEW.target_id AND target_type = 'user' AND badges IS NOT NULL
      ),
      updated_at = NOW()
    WHERE id = NEW.target_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-recalculate stats
DROP TRIGGER IF EXISTS after_rating_insert ON ratings;
CREATE TRIGGER after_rating_insert
  AFTER INSERT ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_user_stats();

-- Helper functions for incrementing/decrementing counts
CREATE OR REPLACE FUNCTION increment_followers_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles SET followers_count = followers_count + 1 WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_followers_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles SET followers_count = GREATEST(followers_count - 1, 0) WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_following_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles SET following_count = following_count + 1 WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_following_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles SET following_count = GREATEST(following_count - 1, 0) WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_posts_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles SET posts_count = posts_count + 1 WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_posts_count(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles SET posts_count = GREATEST(posts_count - 1, 0) WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Profiles: Everyone can read, users can update their own
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Ratings: Everyone can read, authenticated users can create
CREATE POLICY "Ratings are viewable by everyone" ON ratings
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create ratings" ON ratings
  FOR INSERT WITH CHECK (auth.uid() = rater_id);

-- Posts: Everyone can read, users can manage their own
CREATE POLICY "Posts are viewable by everyone" ON posts
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update own posts" ON posts
  FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete own posts" ON posts
  FOR DELETE USING (auth.uid() = creator_id);

-- Notifications: Users can only see their own
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Comments: Everyone can read, authenticated users can create
CREATE POLICY "Comments are viewable by everyone" ON comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- Follows: Everyone can read, users can manage their own follows
CREATE POLICY "Follows are viewable by everyone" ON follows
  FOR SELECT USING (true);

CREATE POLICY "Users can create own follows" ON follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete own follows" ON follows
  FOR DELETE USING (auth.uid() = follower_id);

-- ============================================
-- 5. STORAGE BUCKET for posts
-- ============================================

-- Create storage bucket for post images/videos
-- Run this in the Supabase Storage section or via SQL:
INSERT INTO storage.buckets (id, name, public)
VALUES ('posts', 'posts', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Anyone can view, authenticated users can upload
CREATE POLICY "Anyone can view posts" ON storage.objects
  FOR SELECT USING (bucket_id = 'posts');

CREATE POLICY "Authenticated users can upload posts" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'posts' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete own uploads" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'posts' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================
-- DONE! Schema is ready
-- ============================================
-- Next steps:
-- 1. Run this entire script in your Supabase SQL Editor
-- 2. Check that all tables are created
-- 3. Verify RLS policies are enabled
-- 4. Create the 'posts' storage bucket if not auto-created
