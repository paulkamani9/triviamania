-- Triviamania Database Schema - Initial Migration
-- Creates core tables for game rooms, players, questions, and responses

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- GAMES TABLE
-- Stores trivia game rooms/sessions
-- ============================================================================

CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(8) UNIQUE NOT NULL,
  host_id UUID NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'finished')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_question INTEGER,
  total_questions INTEGER DEFAULT 10,
  
  CONSTRAINT valid_question_progress CHECK (
    current_question IS NULL OR 
    (current_question >= 1 AND current_question <= total_questions)
  )
);

-- Index for fast room code lookups
CREATE INDEX idx_games_code ON games(code);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_created_at ON games(created_at DESC);

-- ============================================================================
-- PLAYERS TABLE
-- Stores player information and scores
-- ============================================================================

CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(20) NOT NULL,
  room_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  is_host BOOLEAN NOT NULL DEFAULT FALSE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_connected BOOLEAN DEFAULT TRUE,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_player_name CHECK (LENGTH(TRIM(name)) > 0),
  CONSTRAINT valid_score CHECK (score >= 0)
);

-- Indexes for player queries
CREATE INDEX idx_players_room_id ON players(room_id);
CREATE INDEX idx_players_score ON players(score DESC);
CREATE INDEX idx_players_is_host ON players(room_id, is_host) WHERE is_host = TRUE;

-- ============================================================================
-- QUESTIONS TABLE
-- Stores the trivia question bank
-- ============================================================================

CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text TEXT NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN (
    'general', 'science', 'history', 'geography', 
    'entertainment', 'sports', 'arts', 'technology'
  )),
  difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  options JSONB NOT NULL,
  correct_answer INTEGER NOT NULL CHECK (correct_answer >= 0 AND correct_answer < 4),
  explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_options CHECK (jsonb_array_length(options) = 4)
);

-- Indexes for question queries
CREATE INDEX idx_questions_category ON questions(category);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_category_difficulty ON questions(category, difficulty);

-- ============================================================================
-- RESPONSES TABLE
-- Stores player answers and scoring
-- ============================================================================

CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  answer INTEGER NOT NULL CHECK (answer >= 0 AND answer < 4),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  time_taken_ms INTEGER NOT NULL CHECK (time_taken_ms >= 0),
  is_correct BOOLEAN NOT NULL,
  points_earned INTEGER NOT NULL CHECK (points_earned >= 0),
  
  -- Prevent duplicate responses
  CONSTRAINT unique_player_question UNIQUE (player_id, question_id, room_id)
);

-- Indexes for response queries
CREATE INDEX idx_responses_player_id ON responses(player_id);
CREATE INDEX idx_responses_room_id ON responses(room_id);
CREATE INDEX idx_responses_question_id ON responses(question_id);
CREATE INDEX idx_responses_timestamp ON responses(timestamp);

-- ============================================================================
-- LEADERBOARD VIEW
-- Aggregated player performance statistics
-- ============================================================================

CREATE OR REPLACE VIEW leaderboard AS
SELECT 
  p.id AS player_id,
  p.name AS player_name,
  p.room_id,
  p.score AS total_score,
  COUNT(CASE WHEN r.is_correct THEN 1 END) AS correct_answers,
  COUNT(CASE WHEN NOT r.is_correct THEN 1 END) AS incorrect_answers,
  COALESCE(AVG(r.time_taken_ms)::INTEGER, 0) AS average_time_ms,
  RANK() OVER (PARTITION BY p.room_id ORDER BY p.score DESC, p.joined_at ASC) AS rank
FROM players p
LEFT JOIN responses r ON p.id = r.player_id
WHERE p.is_connected = TRUE
GROUP BY p.id, p.name, p.room_id, p.score, p.joined_at
ORDER BY p.room_id, rank;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enforce data access rules at the database level
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

-- GAMES policies: Anyone can read active games, only create new ones
CREATE POLICY "Anyone can read games"
  ON games FOR SELECT
  USING (TRUE);

CREATE POLICY "Anyone can create games"
  ON games FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Anyone can update games"
  ON games FOR UPDATE
  USING (TRUE);

-- PLAYERS policies: Anyone can read and create players
CREATE POLICY "Anyone can read players"
  ON players FOR SELECT
  USING (TRUE);

CREATE POLICY "Anyone can create players"
  ON players FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Anyone can update players"
  ON players FOR UPDATE
  USING (TRUE);

-- QUESTIONS policies: Anyone can read (for game play)
CREATE POLICY "Anyone can read questions"
  ON questions FOR SELECT
  USING (TRUE);

-- RESPONSES policies: Anyone can read and create responses
CREATE POLICY "Anyone can read responses"
  ON responses FOR SELECT
  USING (TRUE);

CREATE POLICY "Anyone can create responses"
  ON responses FOR INSERT
  WITH CHECK (TRUE);

-- ============================================================================
-- UPDATED_AT TRIGGER
-- Automatically update the updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to generate unique room codes
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS VARCHAR(8) AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result VARCHAR(8) := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  
  -- Check if code already exists (very unlikely)
  IF EXISTS (SELECT 1 FROM games WHERE code = result) THEN
    RETURN generate_room_code(); -- Recursively generate new code
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to get random questions for a game
CREATE OR REPLACE FUNCTION get_random_questions(
  question_count INTEGER DEFAULT 10,
  category_filter VARCHAR DEFAULT NULL,
  difficulty_filter VARCHAR DEFAULT NULL
)
RETURNS SETOF questions AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM questions
  WHERE 
    (category_filter IS NULL OR category = category_filter)
    AND (difficulty_filter IS NULL OR difficulty = difficulty_filter)
  ORDER BY RANDOM()
  LIMIT question_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- Document table purposes
-- ============================================================================

COMMENT ON TABLE games IS 'Trivia game rooms/sessions';
COMMENT ON TABLE players IS 'Players participating in games';
COMMENT ON TABLE questions IS 'Trivia question bank';
COMMENT ON TABLE responses IS 'Player answers and scoring records';
COMMENT ON VIEW leaderboard IS 'Aggregated player performance statistics';

COMMENT ON FUNCTION generate_room_code() IS 'Generate unique 8-character alphanumeric room code';
COMMENT ON FUNCTION get_random_questions(INTEGER, VARCHAR, VARCHAR) IS 'Get random questions with optional filters';
