-- ==============================================================================
-- Campus Pulse – Feed Upgrade
-- Adds posts, likes, reposts, bookmarks, and poll support
-- Run AFTER the existing supabase-schema.sql
-- ==============================================================================

-- 1. Unified posts table (X-style)
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    post_type TEXT NOT NULL DEFAULT 'text',  -- text, resource, article, question, poll, achievement
    attached_title TEXT,
    attached_desc TEXT,
    attached_id UUID,
    poll_options JSONB,
    parent_post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    repost_of UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    view_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Post likes
CREATE TABLE IF NOT EXISTS public.post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- 3. Post reposts
CREATE TABLE IF NOT EXISTS public.post_reposts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- 4. Post bookmarks
CREATE TABLE IF NOT EXISTS public.post_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- 5. Poll votes
CREATE TABLE IF NOT EXISTS public.poll_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    option_index INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- 6. Follows (for "Following" tab)
CREATE TABLE IF NOT EXISTS public.follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

-- ============ RLS ============
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reposts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Posts: public read, own write
CREATE POLICY "Posts are viewable by everyone" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Auth users can insert posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- Likes / reposts / bookmarks: public read, own write
CREATE POLICY "Post likes viewable" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Auth users can like" ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);
CREATE POLICY "Users remove own likes" ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Post reposts viewable" ON public.post_reposts FOR SELECT USING (true);
CREATE POLICY "Auth users can repost" ON public.post_reposts FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);
CREATE POLICY "Users remove own reposts" ON public.post_reposts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Post bookmarks viewable" ON public.post_bookmarks FOR SELECT USING (true);
CREATE POLICY "Auth users can bookmark" ON public.post_bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);
CREATE POLICY "Users remove own bookmarks" ON public.post_bookmarks FOR DELETE USING (auth.uid() = user_id);

-- Poll votes
CREATE POLICY "Poll votes viewable" ON public.poll_votes FOR SELECT USING (true);
CREATE POLICY "Auth users can vote" ON public.poll_votes FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);
CREATE POLICY "Users remove own votes" ON public.poll_votes FOR DELETE USING (auth.uid() = user_id);

-- Follows
CREATE POLICY "Follows viewable" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Auth users can follow" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id OR auth.uid() IS NOT NULL);
CREATE POLICY "Users remove own follows" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- Index for speed
CREATE INDEX IF NOT EXISTS idx_posts_created ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_parent ON public.posts(parent_post_id);
CREATE INDEX IF NOT EXISTS idx_posts_user ON public.posts(user_id);
-- ==============================================================================
-- Module: Real-time Chat / Messaging System
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own messages" 
ON public.messages FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" 
ON public.messages FOR INSERT 
WITH CHECK (auth.uid() = sender_id OR auth.uid() IS NOT NULL);

CREATE POLICY "Users can update read status" 
ON public.messages FOR UPDATE 
USING (auth.uid() = receiver_id);

-- Realtime enable කිරීම (මේක අනිවාර්යයි Live වැඩ කරන්න)
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;