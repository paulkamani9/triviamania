# Lobby Feature

The lobby feature provides a waiting room where players gather before the game starts. It displays all connected players in real-time and provides host controls to start the game.

## Components

### LobbyContainer

Container component that manages:

- Real-time player list subscriptions via Supabase
- Game start logic and validation
- Error handling and loading states
- Session state integration

### LobbyView

Presentational component that displays:

- Room code with copy functionality
- List of connected players
- Host badge indicators
- Start Game button (host only)
- Player count and status messages

## Features

### Real-Time Player Sync

- Subscribes to Supabase `players` table changes
- Updates player list when players join/leave
- Animates player card additions/removals
- Handles disconnections gracefully

### Host Controls

- Only host can see "Start Game" button
- Button enabled when ≥2 players present
- Shows loading state during game start
- Displays error messages on failure

### Room Code Sharing

- Displays room code prominently
- Copy to clipboard functionality
- Visual feedback on copy success
- Optional URL sharing (future)

## Usage

```tsx
import { LobbyContainer } from '@/components/features/lobby';

export default function RoomPage({ params }: { params: { code: string } }) {
  // Get session data
  const session = getSession();

  return (
    <LobbyContainer
      roomCode={params.code}
      roomId={session.roomId}
      playerId={session.playerId}
      isHost={session.isHost}
    />
  );
}
```

## Real-Time Flow

1. **Component Mount**: Subscribe to players in room
2. **Player Joins**: Supabase broadcasts INSERT event → Update UI
3. **Player Leaves**: Supabase broadcasts DELETE event → Update UI
4. **Score Updates**: Subscription picks up player score changes
5. **Host Transfer**: If host leaves, subscription updates badge
6. **Component Unmount**: Clean up subscription

## Animation Patterns

- Player cards fade in on join (staggered)
- Smooth reordering when players leave
- Host badge pulse effect
- Start button loading spinner
- Error message slide-in

## Error Handling

- Network disconnection recovery
- Invalid room state errors
- Start game validation errors
- Subscription failures
- Timeout handling

## Accessibility

- ARIA labels for player list
- Keyboard navigation support
- Screen reader announcements
- Focus management
- Reduced motion support

## Testing

See `lobby.test.tsx` for comprehensive test coverage:

- Player list rendering
- Real-time updates simulation
- Host controls validation
- Start game flow
- Error scenarios
- Subscription cleanup
