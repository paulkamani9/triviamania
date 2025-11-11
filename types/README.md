# Type System Documentation

This directory contains all TypeScript type definitions for Triviamania. All types are strictly typed with no `any` types, following the project's type-safety principles.

## Directory Structure

```
types/
├── index.ts        # Central export point - import from here
├── game.ts         # Game room and state types
├── player.ts       # Player and session types
├── question.ts     # Question, category, and difficulty types
└── response.ts     # Response, scoring, and summary types
```

## Usage

Import types from the central index file throughout the application:

```typescript
import { Room, Player, Question, GameState } from '@/types';
```

## Core Types

### Game Types (`game.ts`)

#### `GameState` enum

Represents the lifecycle of a trivia game:

- `WAITING` - Room is open, waiting for players to join
- `ACTIVE` - Game is in progress
- `FINISHED` - Game has ended, showing results

#### `Room` interface

Represents a trivia game room/session.

```typescript
interface Room {
  id: string; // UUID
  code: string; // 8-char alphanumeric (e.g., "ABCD1234")
  host_id: string; // Player ID of host
  status: GameState; // Current game state
  created_at: string; // ISO 8601 timestamp
  updated_at?: string; // Last update timestamp
  current_question?: number; // Current question (1-indexed)
  total_questions?: number; // Total questions in game (default: 10)
}
```

**Validation Functions:**

- `isGameState(value: string): boolean` - Type guard for GameState
- `isValidRoomCode(code: string): boolean` - Validates 8-char alphanumeric format

---

### Player Types (`player.ts`)

#### `Player` interface

Represents a player in a game.

```typescript
interface Player {
  id: string; // UUID
  name: string; // Display name (max 20 chars)
  room_id: string; // Room UUID
  score: number; // Current score (≥ 0)
  is_host: boolean; // Whether player is room host
  joined_at: string; // ISO 8601 timestamp
  is_connected?: boolean; // Connection status
  last_active_at?: string; // Last activity timestamp
}
```

#### `PlayerSession` interface

Session data stored in localStorage for reconnection.

```typescript
interface PlayerSession {
  player_id: string;
  name: string;
  room_code: string;
  created_at: string;
}
```

**Validation Functions:**

- `isValidPlayerName(name: string): boolean` - Validates 1-20 alphanumeric chars
- `sanitizePlayerName(name: string): string` - Trims and truncates to 20 chars

---

### Question Types (`question.ts`)

#### `QuestionDifficulty` enum

- `EASY`
- `MEDIUM`
- `HARD`

#### `QuestionCategory` enum

- `GENERAL`
- `SCIENCE`
- `HISTORY`
- `GEOGRAPHY`
- `ENTERTAINMENT`
- `SPORTS`
- `ARTS`
- `TECHNOLOGY`

#### `Question` interface

Represents a trivia question.

```typescript
interface Question {
  id: string; // UUID
  text: string; // Question text
  category: QuestionCategory;
  difficulty: QuestionDifficulty;
  options: string[]; // Array of 4 options
  correct_answer: number; // Index (0-3) of correct option
  explanation?: string; // Optional explanation
  created_at?: string; // ISO 8601 timestamp
}
```

#### `ShuffledQuestion` interface

Question with shuffled options for client display to prevent answer position memorization.

```typescript
interface ShuffledQuestion extends Omit<Question, 'correct_answer'> {
  shuffle_map: number[]; // Maps shuffled positions to originals
}
```

**Validation Functions:**

- `isQuestionDifficulty(value: string): boolean`
- `isQuestionCategory(value: string): boolean`
- `isValidQuestion(question: Partial<Question>): boolean`

---

### Response & Scoring Types (`response.ts`)

#### `Response` interface

Represents a player's answer to a question.

```typescript
interface Response {
  id: string; // UUID
  player_id: string; // Player UUID
  question_id: string; // Question UUID
  answer: number; // Selected option index (0-3)
  timestamp: string; // ISO 8601 submission time
  time_taken_ms: number; // Time to answer (milliseconds)
  is_correct: boolean; // Whether answer was correct
  points_earned: number; // Points awarded
  room_id: string; // Room UUID
}
```

#### Scoring Constants

```typescript
const SCORING = {
  BASE_POINTS: 100, // Points for correct answer
  MAX_SPEED_BONUS: 50, // Maximum speed bonus
  TIME_LIMIT_MS: 10000, // 10 seconds
  INCORRECT_POINTS: 0,
} as const;
```

#### Scoring Formula

```
Points = BASE_POINTS + (MAX_SPEED_BONUS × (1 - time_ratio))

where time_ratio = time_taken_ms / TIME_LIMIT_MS
```

**Examples:**

- Instant answer (0ms): 150 points
- Half time (5000ms): 125 points
- Full time (10000ms): 100 points
- Incorrect: 0 points

**Functions:**

- `calculatePoints(isCorrect: boolean, timeTakenMs: number): number`

#### `ScoreSummary` interface

Aggregated player performance statistics.

```typescript
interface ScoreSummary {
  player_id: string;
  player_name: string;
  total_score: number;
  correct_answers: number;
  incorrect_answers: number;
  average_time_ms: number;
  rank?: number; // Position in leaderboard (1-indexed)
}
```

---

## Utility Types

### Common Types

```typescript
type Timestamp = string; // ISO 8601 format
type UUID = string; // UUID format

interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

interface RealtimePayload<T> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: Partial<T>;
  table: string;
}
```

---

## Testing

All types have comprehensive test coverage in `/tests/types/`:

- `game.test.ts` - Game and room types
- `player.test.ts` - Player types and validation
- `question.test.ts` - Question types and enums
- `response.test.ts` - Scoring logic and responses

Run tests with:

```bash
npm test
```

---

## Type Safety Guidelines

1. **No `any` types** - All entities must have explicit interfaces
2. **Strict null checks** - Use optional properties (`?`) appropriately
3. **Type guards** - Use provided type guards (e.g., `isGameState`) for runtime validation
4. **Validation first** - Always validate user input before creating typed objects
5. **Immutable enums** - Use `as const` for constant values

---

## Database Schema Alignment

These TypeScript types are designed to match the Supabase database schema exactly. See `/supabase/migrations/` for SQL definitions.

### Type Generation

To generate types from Supabase (requires Supabase CLI):

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts
```

**Note:** Manual types in this directory should take precedence over auto-generated types for better documentation and validation.

---

## Examples

### Creating a Room

```typescript
import { Room, GameState, isValidRoomCode } from '@/types';

const newRoom: Room = {
  id: crypto.randomUUID(),
  code: generateCode(), // Must pass isValidRoomCode()
  host_id: playerId,
  status: GameState.WAITING,
  created_at: new Date().toISOString(),
  total_questions: 10,
};
```

### Validating a Player Name

```typescript
import { isValidPlayerName, sanitizePlayerName } from '@/types';

const input = '  Player Name  ';
if (isValidPlayerName(input)) {
  const clean = sanitizePlayerName(input); // "Player Name"
  // Create player...
} else {
  // Show error
}
```

### Calculating Score

```typescript
import { calculatePoints } from '@/types';

const isCorrect = selectedAnswer === question.correct_answer;
const timeTaken = 3500; // 3.5 seconds
const points = calculatePoints(isCorrect, timeTaken);
// Returns: 133 points (100 base + 33 speed bonus)
```

---

## Contributing

When adding new types:

1. Add type definition to appropriate file
2. Export from `index.ts`
3. Write validation functions if needed
4. Add comprehensive tests
5. Document in this README
6. Update database schema if applicable

All types must compile without errors and have >90% test coverage.
