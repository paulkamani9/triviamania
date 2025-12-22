-- TriviaMania Database Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/YOUR_PROJECT/sql)

-- ============================================================================
-- Users Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY,
    google_id TEXT UNIQUE,
    email TEXT,
    username TEXT NOT NULL,
    total_points INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for leaderboard queries (sorted by points)
CREATE INDEX IF NOT EXISTS idx_users_total_points ON public.users(total_points DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read users (for leaderboard)
CREATE POLICY "Users are viewable by everyone" ON public.users
    FOR SELECT USING (true);

-- Policy: Users can update their own record
CREATE POLICY "Users can update own record" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Policy: Service role can do anything (for backend)
CREATE POLICY "Service role has full access" ON public.users
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- Game History Table (Optional - for tracking individual games)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.game_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    game_type TEXT NOT NULL, -- 'singleplayer' or 'multiplayer'
    category TEXT,
    difficulty TEXT,
    score INTEGER NOT NULL,
    total_questions INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user's game history
CREATE INDEX IF NOT EXISTS idx_game_history_user_id ON public.game_history(user_id);

-- Enable RLS
ALTER TABLE public.game_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own history
CREATE POLICY "Users can read own game history" ON public.game_history
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Service role can do anything
CREATE POLICY "Service role has full access to game_history" ON public.game_history
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- RPC Function: Increment User Points (atomic operation)
-- ============================================================================
CREATE OR REPLACE FUNCTION increment_user_points(user_id UUID, points_to_add INTEGER)
RETURNS void AS $$
BEGIN
    UPDATE public.users 
    SET total_points = total_points + points_to_add,
        updated_at = NOW()
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Trigger: Auto-create user on auth signup
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, username, google_id)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'sub'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        username = COALESCE(EXCLUDED.username, public.users.username),
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- Grant permissions
-- ============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.users TO anon, authenticated;
GRANT SELECT ON public.game_history TO authenticated;
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.game_history TO service_role;
