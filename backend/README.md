# TriviaMania Backend

Real-time multiplayer trivia game backend with Socket.io, Redis, and Supabase.

## Setup

1. Copy environment file:

   ```bash
   cp .env.example .env
   ```

2. Fill in environment variables:

   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_ANON_KEY` - Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side)
   - `UPSTASH_REDIS_URL` - Upstash Redis connection string

3. Install dependencies:

   ```bash
   npm install
   ```

4. Run development server:
   ```bash
   npm run dev
   ```

## API Endpoints

- `GET /health` - Health check
- `GET /health/ready` - Readiness check (includes Redis)
- `GET /api/leaderboard` - Top 100 players
- `GET /api/leaderboard/user/:userId` - User rank and stats

## WebSocket Events

### Client → Server

- `register` - Register socket with userId
- `create-room` - Create a new game room
- `join-room` - Join existing room
- `leave-room` - Leave current room
- `chat-message` - Send chat message
- `start-game` - Start game (leader only)
- `submit-answer` - Submit answer to current question

### Server → Client

- `room-created` - Room created successfully
- `player-joined` - Player joined room
- `player-left` - Player left room
- `chat-message` - Chat message broadcast
- `game-starting` - Game countdown started
- `question` - New question
- `player-answered` - Player submitted answer
- `question-results` - Results after question ends
- `game-over` - Final game results
- `leader-promoted` - New leader assigned
- `error` - Error occurred

## Testing

```bash
npm test
npm run test:watch
```

## Project Structure

```
backend/
├── src/
│   ├── config/        # Configuration and constants
│   ├── routes/        # REST API routes
│   ├── services/      # Business logic (Redis, Supabase, game, trivia)
│   ├── socket/        # WebSocket event handlers
│   ├── utils/         # Utility functions
│   └── index.js       # Entry point
├── tests/             # Test files
└── package.json
```
