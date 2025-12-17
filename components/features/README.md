# Features Directory

This directory contains feature-specific components organized by user-facing functionality. Each feature is self-contained with its own components, types, utilities, and tests.

---

## Structure

```
features/
├── landing/          # Landing page & room creation (Phase 4)
└── [future features] # lobby/, game/, scoreboard/ (upcoming phases)
```

---

## Current Features

### Landing (Phase 4) ✅

Entry point for Triviamania where users create or join rooms.

**Components**:

- `LandingContainer` - Business logic and state management
- `LandingView` - Presentational UI component
- `NameForm` - Player name input with validation
- `ActionButtons` - Create/Join room buttons

**Key Features**:

- Player name validation (2-20 chars, alphanumeric + spaces)
- Session persistence (sessionStorage, 1hr expiration)
- Room creation flow (integrates with Phase 2 services)
- Smooth animations (Framer Motion)
- Error handling and loading states

**Files**:

- `types.ts` - TypeScript interfaces
- `utils.ts` - Validation and session helpers
- `landing.test.tsx` - 32 comprehensive tests
- `index.ts` - Clean exports

**Usage**:

```tsx
import { LandingContainer } from '@/components/features/landing';

export default function HomePage() {
  return <LandingContainer />;
}
```

---

## Future Features

### Lobby (Phase 6) - Coming Soon

Real-time waiting room where players see each other before game starts.

**Planned Components**:

- `LobbyContainer` - Supabase Realtime subscriptions
- `LobbyView` - Player list display
- `PlayerList` - Connected players with animations
- `HostControls` - Start game button (host only)

**Key Features**:

- Real-time player sync
- Room code display with copy button
- Host badge indicator
- Share room link
- Player count display

### Game (Phase 7) - Coming Soon

Active gameplay screen with questions, timer, and answer submission.

**Planned Components**:

- `GameContainer` - Game state and question flow
- `QuestionDisplay` - Question text and options
- `AnswerButtons` - 4 answer choices
- `GameTimer` - Countdown with visual progress

**Key Features**:

- Question display with animations
- 10-second countdown timer
- Answer submission with feedback
- Point calculation (base + speed bonus)
- Correct/incorrect reveal

### Scoreboard (Phase 8) - Coming Soon

Final results screen showing player rankings and statistics.

**Planned Components**:

- `ScoreboardContainer` - Fetch and sort scores
- `ScoreboardView` - Rankings display
- `PlayerScoreCard` - Individual score details
- `PlayAgainButton` - Restart game flow

**Key Features**:

- Ranked player list
- Total scores and correct answers
- Winner celebration animation
- Play again / Exit options
- Score statistics

---

## Feature Development Guidelines

### File Structure

Each feature should follow this structure:

```
feature-name/
├── index.ts                  # Exports
├── types.ts                  # TypeScript interfaces
├── utils.ts                  # Helper functions
├── FeatureContainer.tsx     # Container component
├── FeatureView.tsx          # Presentational component
├── [SubComponents].tsx      # Feature-specific components
├── feature.test.tsx         # Test suite
└── README.md                # Feature documentation
```

### Component Patterns

**Container/Presentational Split**:

- **Container**: State, effects, business logic, service calls
- **Presentational**: Pure UI, receives all data via props

**Example**:

```tsx
// Container (manages state and logic)
export function LobbyContainer() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to realtime updates
    const subscription = subscribeToPlayers(roomId, setPlayers);
    return () => subscription.unsubscribe();
  }, [roomId]);

  return <LobbyView players={players} loading={loading} />;
}

// Presentational (pure UI)
export function LobbyView({ players, loading }: LobbyViewProps) {
  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {players.map((player) => (
        <PlayerCard key={player.id} player={player} />
      ))}
    </div>
  );
}
```

### Testing Requirements

- **Unit Tests**: All utilities and validation functions
- **Component Tests**: Rendering, interactions, states
- **Integration Tests**: Service calls and state updates
- **Accessibility Tests**: ARIA, keyboard nav, screen readers

Aim for **>90% coverage** per feature.

### Naming Conventions

- **Components**: PascalCase (`LobbyContainer`, `PlayerCard`)
- **Files**: Match component name (`LobbyContainer.tsx`)
- **Utilities**: camelCase (`validatePlayerName`)
- **Types**: PascalCase for interfaces (`LobbyViewProps`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_PLAYERS`)

### Import Patterns

**Internal imports** (within feature):

```tsx
import { validatePlayerName } from './utils';
import { LobbyView } from './LobbyView';
```

**External imports** (from other features/common):

```tsx
import { Button, Card } from '@/components/common';
import { createRoom } from '@/services/room';
import { Player } from '@/types';
```

**Export from index.ts**:

```tsx
export { LobbyContainer } from './LobbyContainer';
export { LobbyView } from './LobbyView';
export * from './types';
```

---

## Integration with Other Layers

### Services (Phase 2)

Features consume services for data operations:

```tsx
import { createRoom, getRoomByCode } from '@/services/room';
import { addPlayer, getPlayersByRoom } from '@/services/player';
```

### Common Components (Phase 3)

Features use shared UI components:

```tsx
import { Button, Input, Card, Timer } from '@/components/common';
import { fadeIn, slideUp } from '@/components/motion';
```

### Types (Phase 1)

Features import shared types:

```tsx
import { Room, Player, Question, Response } from '@/types';
import type { Result } from '@/types';
```

---

## Performance Considerations

### Code Splitting

Features are lazy-loaded to reduce initial bundle size:

```tsx
const LobbyContainer = lazy(() => import('@/components/features/lobby'));
```

### Memoization

Use React.memo for expensive presentational components:

```tsx
export const PlayerList = memo(({ players }: PlayerListProps) => {
  return <>{players.map(renderPlayer)}</>;
});
```

### Subscriptions

Always clean up Supabase subscriptions:

```tsx
useEffect(() => {
  const subscription = subscribeToPlayers(roomId, callback);
  return () => subscription.unsubscribe();
}, [roomId]);
```

---

## Accessibility Standards

All features must meet **WCAG 2.1 Level AA**:

- ✅ Proper ARIA labels and roles
- ✅ Keyboard navigation support
- ✅ Focus management
- ✅ Screen reader announcements
- ✅ Color contrast (4.5:1 minimum)
- ✅ Reduced motion support
- ✅ Semantic HTML

---

## Documentation

Each feature should have:

1. **README.md** - Overview, usage, architecture
2. **JSDoc comments** - On all exported functions
3. **Type documentation** - Interface descriptions
4. **Examples** - Code samples for common use cases

---

## Questions?

See:

- [Project Overview](/docs/overview.md)
- [Development Principles](/docs/development-principles.md)
- [Component Library](/components/README.md)
- [Service Layer](/services/README.md)
