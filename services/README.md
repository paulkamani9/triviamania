# Triviamania Services Layer

The services layer provides a clean, type-safe API for interacting with the Supabase backend. All services follow the **Result pattern** for error handling and are designed to be easily testable and reusable across the application.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    React Components                          │
│                  (UI & User Interactions)                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   Services Layer                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌──────────────┐   │
│  │  Room   │  │ Player  │  │  Game   │  │   Question   │   │
│  │ Service │  │ Service │  │ Service │  │   Service    │   │
│  └─────────┘  └─────────┘  └─────────┘  └──────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            Utility Functions                         │   │
│  │  • Room Code Generator  • Score Calculator           │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                 Supabase Client                              │
│           (Database & Realtime Subscriptions)                │
└─────────────────────────────────────────────────────────────┘
```

## Core Principles

### 1. **Result Pattern for Error Handling**

All service functions return a `Result<T>` type instead of throwing exceptions:

```typescript
type Result<T> = { success: true; data: T } | { success: false; error: Error };
```

This makes error handling explicit and type-safe:

```typescript
const result = await createRoom('host-123');
if (result.success) {
  // TypeScript knows result.data is available
  console.log(`Room code: ${result.data.code}`);
} else {
  // TypeScript knows result.error is available
  console.error(result.error.message);
}
```

### 2. **Single Responsibility**

Each service manages one domain:

- **Room Service**: Room lifecycle (create, join, status updates)
- **Player Service**: Player management (add, remove, score updates)
- **Game Service**: Game flow (start, questions, answers, end)
- **Question Service**: Question retrieval and filtering

### 3. **Realtime-First Design**

Services provide subscription functions for real-time updates:

```typescript
const channel = subscribeToPlayers(roomId, (players) => {
  console.log('Players updated:', players);
});

// Cleanup when component unmounts
channel.unsubscribe();
```

### 4. **Type Safety**

All inputs and outputs use TypeScript interfaces from `/types`:

- No `any` types
- All Supabase responses are properly typed
- Compile-time validation of function arguments

## Services

### Room Service

Manages trivia room lifecycle.

**Functions:**

- `createRoom(hostPlayerId: string)` - Create a new room with unique code
- `joinRoom(code: string, playerId: string)` - Join an existing room
- `getRoomState(roomId: string)` - Get current room data
- `updateRoomStatus(roomId: string, status: GameState)` - Change room status
- `subscribeToRoom(roomId: string, callback)` - Real-time room updates

**Example:**

```typescript
import { createRoom, joinRoom } from '@/services';

// Host creates room
const result = await createRoom('host-uuid');
if (result.success) {
  const roomCode = result.data.code; // e.g., "ABCD1234"

  // Other player joins
  const joinResult = await joinRoom(roomCode, 'player-uuid');
  if (joinResult.success) {
    console.log('Joined room:', joinResult.data);
  }
}
```

### Player Service

Manages player data and scores.

**Functions:**

- `addPlayer(roomId: string, name: string)` - Add player to room
- `getPlayersInRoom(roomId: string)` - Fetch all players in room
- `updatePlayerScore(playerId: string, points: number)` - Add points to player
- `removePlayer(playerId: string)` - Remove player from room
- `subscribeToPlayers(roomId: string, callback)` - Real-time player updates

**Example:**

```typescript
import { addPlayer, subscribeToPlayers } from '@/services';

// Add player to room
const result = await addPlayer(roomId, 'Alice');
if (result.success) {
  const player = result.data;
  console.log(`Player ${player.name} added (host: ${player.is_host})`);
}

// Subscribe to player updates
const channel = subscribeToPlayers(roomId, (players) => {
  setPlayers(players); // Update React state
});
```

### Game Service

Controls game flow and answer submission.

**Functions:**

- `startGame(roomId: string)` - Start the game (requires 2+ players)
- `getCurrentQuestion(roomId: string)` - Get active question
- `getNextQuestion(roomId: string, filters?)` - Fetch next random question
- `submitAnswer(playerId, questionId, roomId, answer, timeTakenMs)` - Submit answer
- `endGame(roomId: string)` - End game and update leaderboard
- `subscribeToGameEvents(roomId: string, callback)` - Real-time game events

**Example:**

```typescript
import { startGame, getNextQuestion, submitAnswer } from '@/services';

// Start game
const startResult = await startGame(roomId);
if (startResult.success) {
  // Get first question
  const questionResult = await getNextQuestion(roomId);
  if (questionResult.success) {
    const question = questionResult.data;

    // User selects answer (index 0-3)
    const answerResult = await submitAnswer(
      playerId,
      question.id,
      roomId,
      2, // Selected answer index
      3500 // Time taken in milliseconds
    );

    if (answerResult.success) {
      const response = answerResult.data;
      console.log(`Correct: ${response.is_correct}`);
      console.log(`Points earned: ${response.points_earned}`);
    }
  }
}
```

### Question Service

Retrieves and filters trivia questions.

**Functions:**

- `getQuestionById(id: string)` - Get specific question
- `getRandomQuestions(count: number, filters?)` - Get random questions
- `getQuestionsByCategory(category: string)` - Get questions by category

**Filters:**

```typescript
interface QuestionFilters {
  difficulty?: 'easy' | 'medium' | 'hard';
  category?: string;
  excludeIds?: string[]; // Exclude already-asked questions
}
```

**Example:**

```typescript
import { getRandomQuestions } from '@/services';

// Get 10 random medium difficulty questions
const result = await getRandomQuestions(10, {
  difficulty: 'medium',
  excludeIds: alreadyAskedIds,
});

if (result.success) {
  const questions = result.data;
  questions.forEach((q) => {
    console.log(q.text);
    console.log(q.options); // Shuffled options
  });
}
```

## Utility Functions

### Room Code Generator

Generates unique 8-character room codes.

**Functions:**

- `generateRoomCode()` - Generate unique code (e.g., "ABCD1234")
- `isValidRoomCode(code: string)` - Validate code format

**Example:**

```typescript
import { generateRoomCode, isValidRoomCode } from '@/services';

const code = await generateRoomCode();
console.log(code); // "WXYZ5678"

console.log(isValidRoomCode('ABCD1234')); // true
console.log(isValidRoomCode('abc123')); // false (not uppercase)
console.log(isValidRoomCode('TOOLONG1')); // false (9 chars)
```

### Score Calculator

Calculates points based on correctness and speed.

**Scoring Algorithm:**

- **Wrong answer**: 0 points
- **Correct answer**: 100 base points + time bonus
- **Time bonus**:
  - 0-3 seconds: +50 points (total: 150)
  - 3-6 seconds: +25 points (total: 125)
  - 6-10 seconds: +10 points (total: 110)
  - 10+ seconds: +0 points (total: 100)

**Functions:**

- `calculateScore(isCorrect: boolean, timeElapsedMs: number)` - Calculate points
- `getTimeBonus(timeElapsedMs: number)` - Get bonus points
- `getScorePercentage(score: number, totalPossible: number)` - Calculate percentage

**Example:**

```typescript
import { calculateScore, SCORE_CONSTANTS } from '@/services';

// Fast correct answer (2 seconds)
const score1 = calculateScore(true, 2000);
console.log(score1); // 150 points

// Slow correct answer (9 seconds)
const score2 = calculateScore(true, 9000);
console.log(score2); // 110 points

// Wrong answer
const score3 = calculateScore(false, 1000);
console.log(score3); // 0 points

// Access constants
console.log(SCORE_CONSTANTS.BASE_POINTS); // 100
console.log(SCORE_CONSTANTS.MAX_TIME_MS); // 10000
```

## Common Patterns

### 1. Creating and Joining a Room

```typescript
// Host flow
const roomResult = await createRoom(hostId);
if (!roomResult.success) {
  showError(roomResult.error.message);
  return;
}

const { code, id } = roomResult.data;
displayRoomCode(code);

// Add host as first player
const playerResult = await addPlayer(id, hostName);
if (playerResult.success) {
  // Host player is automatically marked as is_host: true
  navigateToLobby(code);
}

// Other player joins
const joinResult = await joinRoom(code, playerId);
if (joinResult.success) {
  const addResult = await addPlayer(joinResult.data.id, playerName);
  if (addResult.success) {
    navigateToLobby(code);
  }
}
```

### 2. Game Flow with Realtime Updates

```typescript
function GameComponent({ roomId }: { roomId: string }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [question, setQuestion] = useState<Question | null>(null);

  useEffect(() => {
    // Subscribe to player updates
    const playerChannel = subscribeToPlayers(roomId, setPlayers);

    // Subscribe to game events
    const gameChannel = subscribeToGameEvents(roomId, (event) => {
      if (event.type === 'question_changed') {
        setQuestion(event.question);
      }
    });

    // Cleanup on unmount
    return () => {
      playerChannel.unsubscribe();
      gameChannel.unsubscribe();
    };
  }, [roomId]);

  const handleStartGame = async () => {
    const result = await startGame(roomId);
    if (result.success) {
      const questionResult = await getNextQuestion(roomId);
      if (questionResult.success) {
        setQuestion(questionResult.data);
      }
    }
  };

  return (
    <div>
      <PlayerList players={players} />
      {question && <QuestionCard question={question} />}
      <button onClick={handleStartGame}>Start Game</button>
    </div>
  );
}
```

### 3. Submitting Answers with Score Updates

```typescript
function QuestionComponent({ question, playerId, roomId }: Props) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [startTime] = useState(Date.now());

  const handleSubmit = async (answerIndex: number) => {
    setSelectedAnswer(answerIndex);

    const timeTaken = Date.now() - startTime;
    const result = await submitAnswer(
      playerId,
      question.id,
      roomId,
      answerIndex,
      timeTaken
    );

    if (result.success) {
      const { is_correct, points_earned } = result.data;

      if (is_correct) {
        showSuccessFeedback(points_earned);
      } else {
        showErrorFeedback();
      }

      // Score updates propagate via subscribeToPlayers
    }
  };

  return (
    <div>
      {question.options.map((option, index) => (
        <button
          key={index}
          onClick={() => handleSubmit(index)}
          disabled={selectedAnswer !== null}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
```

## Error Handling Guide

### Handling Service Errors

Always check the `success` property:

```typescript
const result = await someService();
if (!result.success) {
  // Handle error
  console.error(result.error.message);

  // Show user-friendly message
  if (result.error.message.includes('not found')) {
    showToast('Room not found. Please check the code.');
  } else if (result.error.message.includes('full')) {
    showToast('Room is full. Cannot join.');
  } else {
    showToast('Something went wrong. Please try again.');
  }

  return;
}

// Success case
const data = result.data;
// ... use data
```

### Common Error Scenarios

| Error Message                   | Cause                     | Solution                      |
| ------------------------------- | ------------------------- | ----------------------------- |
| `"Room code is required"`       | Empty/null code           | Validate input before calling |
| `"Room not found"`              | Invalid room code         | Show "Room doesn't exist"     |
| `"Room is full"`                | Max 8 players reached     | Show "Room at capacity"       |
| `"Game has already started"`    | Joining active game       | Show "Game in progress"       |
| `"Need at least 2 players"`     | Starting with < 2 players | Disable start button until 2+ |
| `"Player name is required"`     | Empty name                | Validate name input           |
| `"Time taken must be positive"` | Invalid time value        | Ensure timer logic correct    |

### Network Errors

```typescript
const result = await createRoom(hostId);
if (!result.success) {
  if (result.error.message.includes('fetch failed')) {
    // Network connectivity issue
    showToast('Network error. Check your connection.');
    retryWithBackoff(() => createRoom(hostId));
  } else {
    // Other error
    showToast(result.error.message);
  }
}
```

## Realtime Subscriptions

### Subscription Lifecycle

All subscription functions return a Supabase `RealtimeChannel` that must be cleaned up:

```typescript
useEffect(() => {
  const channel = subscribeToPlayers(roomId, (players) => {
    setPlayers(players);
  });

  // IMPORTANT: Cleanup on unmount
  return () => {
    channel.unsubscribe();
  };
}, [roomId]);
```

### Handling Subscription Errors

```typescript
const channel = subscribeToRoom(roomId, (room) => {
  setRoom(room);
});

// Listen for subscription errors
channel.on('system', {}, (payload) => {
  if (payload.status === 'CHANNEL_ERROR') {
    console.error('Subscription error:', payload);
    showToast('Lost connection. Reconnecting...');
  }
});
```

## Performance Considerations

### 1. Debounce Realtime Updates

```typescript
import { debounce } from 'lodash';

const debouncedUpdate = debounce((players: Player[]) => {
  setPlayers(players);
}, 100);

subscribeToPlayers(roomId, debouncedUpdate);
```

### 2. Limit Subscription Scope

```typescript
// Bad: Subscribe to entire table
subscribeToAllPlayers((allPlayers) => {
  const roomPlayers = allPlayers.filter((p) => p.room_id === roomId);
  setPlayers(roomPlayers);
});

// Good: Subscribe only to room's players
subscribeToPlayers(roomId, setPlayers);
```

### 3. Cleanup on Route Changes

```typescript
// In a Next.js component
useEffect(() => {
  const channels = [
    subscribeToRoom(roomId, setRoom),
    subscribeToPlayers(roomId, setPlayers),
    subscribeToGameEvents(roomId, handleGameEvent),
  ];

  return () => {
    channels.forEach((ch) => ch.unsubscribe());
  };
}, [roomId]);
```

## Testing

### Unit Testing Services

```typescript
import { describe, it, expect, vi } from 'vitest';
import { createRoom } from '@/services';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { id: '123', code: 'ABCD1234', status: 'waiting' },
            error: null,
          })),
        })),
      })),
    })),
  },
}));

describe('Room Service', () => {
  it('should create room successfully', async () => {
    const result = await createRoom('host-123');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.code).toMatch(/^[A-Z0-9]{8}$/);
    }
  });
});
```

### Integration Testing

See `/tests/integration/service-flows.test.ts` for examples of testing service interactions.

## API Reference

### Import Paths

```typescript
// Import specific services
import { createRoom, joinRoom } from '@/services/room';
import { addPlayer, getPlayersInRoom } from '@/services/player';

// Or import from index
import { createRoom, addPlayer, startGame } from '@/services';
```

### Type Imports

```typescript
import type { Room, Player, Question, Response } from '@/types';
import type { GameEvent, QuestionFilters } from '@/services';
```

## Migration Guide

### From Direct Supabase Calls

**Before:**

```typescript
const { data, error } = await supabase
  .from('games')
  .insert({ code: 'ABCD1234', host_id: 'host-123' })
  .select()
  .single();

if (error) {
  console.error(error);
  return;
}
```

**After:**

```typescript
const result = await createRoom('host-123');
if (!result.success) {
  console.error(result.error);
  return;
}

const room = result.data;
```

### Benefits

- ✅ Consistent error handling
- ✅ Type-safe throughout
- ✅ Easier to test (mock services, not Supabase)
- ✅ Business logic centralized
- ✅ Reusable across components

## Contributing

When adding new service functions:

1. **Follow the Result pattern** for return types
2. **Add comprehensive JSDoc** documentation
3. **Write tests first** (TDD)
4. **Handle all error cases** explicitly
5. **Export from `/services/index.ts`**
6. **Update this README** with examples

---

**Last Updated**: November 18, 2025  
**Total Services**: 4 (Room, Player, Game, Question)  
**Total Functions**: 19  
**Test Coverage**: >90%
