-- Daily Polls and Notes Schema
-- Run this in Supabase SQL Editor

-- 1. Daily Polls table (50 rotating questions)
CREATE TABLE IF NOT EXISTS public.daily_polls (
    id INTEGER PRIMARY KEY,
    question TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    emoji_a TEXT DEFAULT '🅰️',
    emoji_b TEXT DEFAULT '🅱️',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Poll Responses table
CREATE TABLE IF NOT EXISTS public.poll_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    poll_id INTEGER NOT NULL REFERENCES public.daily_polls(id) ON DELETE CASCADE,
    response_type TEXT NOT NULL CHECK (response_type IN ('VOTE_A', 'VOTE_B', 'NOTE')),
    vote_choice TEXT CHECK (vote_choice IN ('A', 'B')),
    note_text TEXT CHECK (char_length(note_text) <= 150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- User can only have one response per poll
    CONSTRAINT unique_user_poll UNIQUE (user_id, poll_id)
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_poll_responses_user ON public.poll_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_poll_responses_poll ON public.poll_responses(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_responses_updated ON public.poll_responses(updated_at DESC);

-- 4. RLS Policies
ALTER TABLE public.daily_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_responses ENABLE ROW LEVEL SECURITY;

-- Everyone can read polls
CREATE POLICY "Anyone can view polls"
    ON public.daily_polls
    FOR SELECT
    USING (true);

-- Users can view their own responses and friends' responses
-- Note: For now, allowing all authenticated users to view responses
-- Filtering by friends will be done in the application layer
CREATE POLICY "Users can view responses"
    ON public.poll_responses
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Users can insert their own responses
CREATE POLICY "Users can create responses"
    ON public.poll_responses
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own responses
CREATE POLICY "Users can update own responses"
    ON public.poll_responses
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own responses
CREATE POLICY "Users can delete own responses"
    ON public.poll_responses
    FOR DELETE
    USING (auth.uid() = user_id);

-- 5. Function to get today's poll
CREATE OR REPLACE FUNCTION get_todays_poll()
RETURNS INTEGER AS $$
DECLARE
    days_since_epoch INTEGER;
    poll_index INTEGER;
BEGIN
    -- Calculate days since epoch (Jan 1, 1970)
    days_since_epoch := EXTRACT(EPOCH FROM CURRENT_DATE)::INTEGER / 86400;
    
    -- Rotate through 50 polls
    poll_index := (days_since_epoch % 50) + 1;
    
    RETURN poll_index;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_poll_response_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER poll_response_updated
    BEFORE UPDATE ON public.poll_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_poll_response_timestamp();

-- 7. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_responses;

-- 8. Seed 50 Daily Polls
INSERT INTO public.daily_polls (id, question, option_a, option_b, emoji_a, emoji_b) VALUES
(1, 'Messi or Cristiano? ⚽️', 'Messi 🇦🇷', 'Cristiano 🇵🇹', '🐐', '⚡'),
(2, 'Coffee or Tea? ☕', 'Coffee', 'Tea', '☕', '🍵'),
(3, 'Beach or Mountains? 🏖️', 'Beach', 'Mountains', '🏖️', '⛰️'),
(4, 'Dogs or Cats? 🐕', 'Dogs', 'Cats', '🐕', '🐈'),
(5, 'Netflix or Cinema? 🎬', 'Netflix', 'Cinema', '📺', '🎥'),
(6, 'Summer or Winter? ☀️', 'Summer', 'Winter', '☀️', '❄️'),
(7, 'Pizza or Burger? 🍕', 'Pizza', 'Burger', '🍕', '🍔'),
(8, 'Morning or Night? 🌅', 'Morning', 'Night', '🌅', '🌙'),
(9, 'iOS or Android? 📱', 'iOS', 'Android', '🍎', '🤖'),
(10, 'Book or Movie? 📚', 'Book', 'Movie', '📚', '🎬'),
(11, 'City or Countryside? 🏙️', 'City', 'Countryside', '🏙️', '🌾'),
(12, 'Sweet or Salty? 🍬', 'Sweet', 'Salty', '🍬', '🧂'),
(13, 'Car or Bike? 🚗', 'Car', 'Bike', '🚗', '🚴'),
(14, 'Shower or Bath? 🚿', 'Shower', 'Bath', '🚿', '🛁'),
(15, 'Call or Text? 📞', 'Call', 'Text', '📞', '💬'),
(16, 'Instagram or TikTok? 📸', 'Instagram', 'TikTok', '📸', '🎵'),
(17, 'Spotify or Apple Music? 🎵', 'Spotify', 'Apple Music', '🎵', '🎶'),
(18, 'Gym or Home Workout? 💪', 'Gym', 'Home', '🏋️', '🏠'),
(19, 'Early Bird or Night Owl? 🦉', 'Early Bird', 'Night Owl', '🌅', '🦉'),
(20, 'Chocolate or Vanilla? 🍫', 'Chocolate', 'Vanilla', '🍫', '🍦'),
(21, 'Marvel or DC? 🦸', 'Marvel', 'DC', '🦸', '🦇'),
(22, 'PlayStation or Xbox? 🎮', 'PlayStation', 'Xbox', '🎮', '🎯'),
(23, 'Coke or Pepsi? 🥤', 'Coke', 'Pepsi', '🥤', '🥤'),
(24, 'Sunrise or Sunset? 🌅', 'Sunrise', 'Sunset', '🌅', '🌇'),
(25, 'Sneakers or Boots? 👟', 'Sneakers', 'Boots', '👟', '🥾'),
(26, 'Pasta or Rice? 🍝', 'Pasta', 'Rice', '🍝', '🍚'),
(27, 'Hot or Cold? 🌡️', 'Hot', 'Cold', '🔥', '🧊'),
(28, 'Gold or Silver? 💍', 'Gold', 'Silver', '🥇', '🥈'),
(29, 'Plane or Train? ✈️', 'Plane', 'Train', '✈️', '🚂'),
(30, 'Breakfast or Dinner? 🍳', 'Breakfast', 'Dinner', '🍳', '🍽️'),
(31, 'Laptop or Desktop? 💻', 'Laptop', 'Desktop', '💻', '🖥️'),
(32, 'Headphones or Speakers? 🎧', 'Headphones', 'Speakers', '🎧', '🔊'),
(33, 'Comedy or Drama? 🎭', 'Comedy', 'Drama', '😂', '😢'),
(34, 'Online or In-Store? 🛒', 'Online', 'In-Store', '📦', '🏬'),
(35, 'Camping or Hotel? ⛺', 'Camping', 'Hotel', '⛺', '🏨'),
(36, 'Pen or Pencil? ✏️', 'Pen', 'Pencil', '🖊️', '✏️'),
(37, 'Glasses or Contacts? 👓', 'Glasses', 'Contacts', '👓', '👁️'),
(38, 'Uber or Taxi? 🚕', 'Uber', 'Taxi', '📱', '🚕'),
(39, 'Sushi or Tacos? 🍣', 'Sushi', 'Tacos', '🍣', '🌮'),
(40, 'Rock or Pop? 🎸', 'Rock', 'Pop', '🎸', '🎤'),
(41, 'Sunrise Jog or Evening Walk? 🏃', 'Sunrise Jog', 'Evening Walk', '🌅', '🌙'),
(42, 'Save or Spend? 💰', 'Save', 'Spend', '💰', '💸'),
(43, 'Cooking or Ordering? 👨‍🍳', 'Cooking', 'Ordering', '👨‍🍳', '🛵'),
(44, 'Silence or Music? 🎵', 'Silence', 'Music', '🤫', '🎵'),
(45, 'Cardio or Weights? 🏋️', 'Cardio', 'Weights', '🏃', '🏋️'),
(46, 'Fiction or Non-Fiction? 📖', 'Fiction', 'Non-Fiction', '🐉', '📰'),
(47, 'Minimalist or Maximalist? 🎨', 'Minimalist', 'Maximalist', '⚪', '🌈'),
(48, 'Planner or Spontaneous? 📅', 'Planner', 'Spontaneous', '📅', '🎲'),
(49, 'Introvert or Extrovert? 🧑‍🤝‍🧑', 'Introvert', 'Extrovert', '🏠', '🎉'),
(50, 'Quality or Quantity? ⭐', 'Quality', 'Quantity', '⭐', '📊')
ON CONFLICT (id) DO NOTHING;
