-- Messages and Conversations Schema for RateMe App
-- Run this in Supabase SQL Editor

-- 1. Conversations table (stores 1-on-1 conversations)
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure user1_id < user2_id to avoid duplicates
    CONSTRAINT unique_conversation UNIQUE (user1_id, user2_id),
    CONSTRAINT users_different CHECK (user1_id != user2_id)
);

-- 2. Messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Optional: reply functionality
    reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL
);

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_user1 ON public.conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user2 ON public.conversations(user2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON public.conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);

-- 4. RLS Policies

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Conversations: Users can see conversations they're part of
CREATE POLICY "Users can view their own conversations"
    ON public.conversations
    FOR SELECT
    USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Conversations: Users can create conversations
CREATE POLICY "Users can create conversations"
    ON public.conversations
    FOR INSERT
    WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Messages: Users can view messages in their conversations
CREATE POLICY "Users can view messages in their conversations"
    ON public.messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations
            WHERE id = conversation_id
            AND (user1_id = auth.uid() OR user2_id = auth.uid())
        )
    );

-- Messages: Users can send messages in their conversations
CREATE POLICY "Users can send messages"
    ON public.messages
    FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id
        AND EXISTS (
            SELECT 1 FROM public.conversations
            WHERE id = conversation_id
            AND (user1_id = auth.uid() OR user2_id = auth.uid())
        )
    );

-- Messages: Users can update their own messages (mark as read)
CREATE POLICY "Users can update messages"
    ON public.messages
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations
            WHERE id = conversation_id
            AND (user1_id = auth.uid() OR user2_id = auth.uid())
        )
    );

-- 5. Trigger to update last_message_at
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations
    SET last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_message_created
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_timestamp();

-- 6. Function to get or create conversation
CREATE OR REPLACE FUNCTION get_or_create_conversation(
    p_user1_id UUID,
    p_user2_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_conversation_id UUID;
    v_min_user_id UUID;
    v_max_user_id UUID;
BEGIN
    -- Ensure user1_id < user2_id
    IF p_user1_id < p_user2_id THEN
        v_min_user_id := p_user1_id;
        v_max_user_id := p_user2_id;
    ELSE
        v_min_user_id := p_user2_id;
        v_max_user_id := p_user1_id;
    END IF;
    
    -- Try to find existing conversation
    SELECT id INTO v_conversation_id
    FROM public.conversations
    WHERE user1_id = v_min_user_id AND user2_id = v_max_user_id;
    
    -- If not found, create new conversation
    IF v_conversation_id IS NULL THEN
        INSERT INTO public.conversations (user1_id, user2_id)
        VALUES (v_min_user_id, v_max_user_id)
        RETURNING id INTO v_conversation_id;
    END IF;
    
    RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
