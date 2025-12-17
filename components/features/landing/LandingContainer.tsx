'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createRoom } from '@/services/room';
import { addPlayer } from '@/services/player';
import { LandingView } from './LandingView';
import {
  validatePlayerName,
  savePlayerSession,
  loadPlayerSession,
} from './utils';

/**
 * LandingContainer Component
 *
 * Container component for the landing page.
 * Manages state, validation, and business logic for room creation flow.
 *
 * Responsibilities:
 * - Validate player name input
 * - Create room via service layer
 * - Add player as host
 * - Navigate to room page
 * - Handle errors and loading states
 * - Persist player session
 *
 * @example
 * ```tsx
 * export default function LandingPage() {
 *   return <LandingContainer />;
 * }
 * ```
 */
export function LandingContainer() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState(() => loadPlayerSession() || '');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle room creation
   *
   * Flow:
   * 1. Validate player name
   * 2. Create room via service
   * 3. Add player as host
   * 4. Save session
   * 5. Navigate to room
   */
  const handleCreateRoom = async () => {
    setError(null);

    // Validate name
    const validation = validatePlayerName(playerName);
    if (!validation.valid) {
      setError(validation.error || 'Invalid name');
      return;
    }

    setIsCreating(true);

    try {
      // Step 1: Create room with temporary host_id (will be updated)
      // We'll use a placeholder and update it after creating the player
      const roomResult = await createRoom('temp');

      if (!roomResult.success) {
        setError(roomResult.error.message || 'Failed to create room');
        setIsCreating(false);
        return;
      }

      const room = roomResult.data;

      // Step 2: Add player to the room
      const playerResult = await addPlayer(room.id, playerName.trim());

      if (!playerResult.success) {
        setError('Room created but failed to add player. Please try again.');
        setIsCreating(false);
        return;
      }

      // Step 3: Save session and navigate
      savePlayerSession(playerName.trim());

      // Navigate to room
      router.push(`/room/${room.code}`);
    } catch (err) {
      console.error('Create room error:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsCreating(false);
    }
  };

  /**
   * Handle join room navigation
   *
   * Validates name then navigates to join flow (Phase 5)
   */
  const handleJoinRoom = () => {
    setError(null);

    // Validate name
    const validation = validatePlayerName(playerName);
    if (!validation.valid) {
      setError(validation.error || 'Invalid name');
      return;
    }

    // Save session
    savePlayerSession(playerName.trim());

    // Navigate to join page (to be implemented in Phase 5)
    router.push('/join');
  };

  return (
    <LandingView
      playerName={playerName}
      onNameChange={setPlayerName}
      onCreateRoom={handleCreateRoom}
      onJoinRoom={handleJoinRoom}
      isCreating={isCreating}
      error={error}
    />
  );
}
