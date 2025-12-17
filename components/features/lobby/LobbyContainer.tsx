/**
 * LobbyContainer Component
 *
 * Container component that manages lobby state and real-time subscriptions.
 * Handles player list updates, game start logic, and error handling.
 *
 * @example
 * ```tsx
 * <LobbyContainer
 *   roomCode="ABCD1234"
 *   roomId="uuid-123"
 *   playerId="uuid-456"
 *   isHost={true}
 * />
 * ```
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Player } from '@/types';
import { getPlayersInRoom, subscribeToPlayers } from '@/services/player';
import { startGame } from '@/services/game';
import { LobbyView } from './LobbyView';
import type { LobbyProps, LobbyState } from './types';

export function LobbyContainer({
  roomCode,
  roomId,
  playerId,
  isHost,
}: LobbyProps) {
  const router = useRouter();

  const [state, setState] = useState<LobbyState>({
    players: [],
    isLoading: true,
    error: null,
    isStarting: false,
  });

  // Fetch initial player list
  useEffect(() => {
    async function fetchPlayers() {
      const result = await getPlayersInRoom(roomId);

      if (result.success) {
        setState((prev) => ({
          ...prev,
          players: result.data,
          isLoading: false,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          error: result.error.message,
          isLoading: false,
        }));
      }
    }

    fetchPlayers();
  }, [roomId]);

  // Subscribe to real-time player updates
  useEffect(() => {
    const channel = subscribeToPlayers(roomId, (players: Player[]) => {
      setState((prev) => ({
        ...prev,
        players,
        error: null,
      }));

      // Check if current player is still in the room
      const currentPlayer = players.find((p) => p.id === playerId);
      if (!currentPlayer) {
        // Player was removed (kicked or host left)
        router.push('/');
      }
    });

    // Cleanup subscription on unmount
    return () => {
      channel.unsubscribe();
    };
  }, [roomId, playerId, router]);

  // Handle game start
  const handleStartGame = useCallback(async () => {
    if (state.players.length < 2) {
      setState((prev) => ({
        ...prev,
        error: 'Need at least 2 players to start the game',
      }));
      return;
    }

    setState((prev) => ({ ...prev, isStarting: true, error: null }));

    const result = await startGame(roomId);

    if (result.success) {
      // Navigate to game screen
      router.push(`/room/${roomCode}/game`);
    } else {
      setState((prev) => ({
        ...prev,
        error: result.error.message,
        isStarting: false,
      }));
    }
  }, [roomId, roomCode, state.players.length, router]);

  // Handle room code copy
  const handleCopyCode = useCallback(() => {
    // Optional: Show toast notification
    console.log('Room code copied to clipboard');
  }, []);

  const canStart = state.players.length >= 2;

  return (
    <LobbyView
      players={state.players}
      roomCode={roomCode}
      isHost={isHost}
      isLoading={state.isLoading}
      error={state.error}
      onStartGame={handleStartGame}
      onCopyCode={handleCopyCode}
      isStarting={state.isStarting}
      canStart={canStart}
    />
  );
}
