/**
 * JoinContainer Component
 *
 * Container component managing the join room flow logic.
 * Handles validation, room joining, and navigation.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { joinRoom } from '@/services/room';
import { addPlayer } from '@/services/player';
import { JoinView } from './JoinView';
import { isValidRoomCodeFormat } from './RoomCodeInput';

/**
 * Get player session from storage
 */
function getPlayerSession() {
  if (typeof window === 'undefined') return null;

  const session = sessionStorage.getItem('playerSession');
  if (!session) return null;

  try {
    return JSON.parse(session);
  } catch {
    return null;
  }
}

/**
 * Store player session
 */
function storePlayerSession(data: {
  name: string;
  playerId?: string;
  roomCode?: string;
}) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem('playerSession', JSON.stringify(data));
}

/**
 * Error messages for different scenarios
 */
const ERROR_MESSAGES = {
  EMPTY: 'Please enter a room code',
  INVALID_FORMAT: 'Room code must be 8 characters (letters and numbers only)',
  NOT_FOUND: 'Room not found. Check the code and try again.',
  ALREADY_STARTED:
    'This game has already started. Ask the host to create a new room.',
  NETWORK_ERROR: 'Connection failed. Please check your internet and try again.',
  NO_NAME: 'Please enter your name first',
  UNKNOWN: 'Something went wrong. Please try again.',
} as const;

/**
 * JoinContainer - Manages join room state and logic
 */
export function JoinContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [roomCode, setRoomCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Check for room code in URL on mount
   */
  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) {
      const formatted = codeFromUrl.toUpperCase().slice(0, 8);
      setRoomCode(formatted);
    }
  }, [searchParams]);

  /**
   * Handle room code input changes
   */
  const handleRoomCodeChange = (code: string) => {
    setRoomCode(code);
    setError(null);
  };

  /**
   * Validate and join room
   */
  const handleJoinRoom = async () => {
    // Clear previous errors
    setError(null);

    // Validate format
    if (!roomCode) {
      setError(ERROR_MESSAGES.EMPTY);
      return;
    }

    if (!isValidRoomCodeFormat(roomCode)) {
      setError(ERROR_MESSAGES.INVALID_FORMAT);
      return;
    }

    // Get player session
    const session = getPlayerSession();
    if (!session?.name) {
      setError(ERROR_MESSAGES.NO_NAME);
      // Redirect to landing page
      router.push('/');
      return;
    }

    try {
      // Validate room exists and is joinable
      setIsValidating(true);

      // Create a temporary player ID for validation
      // This will be replaced with actual player ID after addPlayer
      const tempPlayerId = 'temp-' + Date.now();
      const roomResult = await joinRoom(roomCode, tempPlayerId);

      if (!roomResult.success) {
        // Determine error message based on error content
        const errorMsg = roomResult.error.message;
        if (errorMsg.includes('not found')) {
          setError(ERROR_MESSAGES.NOT_FOUND);
        } else if (
          errorMsg.includes('already started') ||
          errorMsg.includes('in progress')
        ) {
          setError(ERROR_MESSAGES.ALREADY_STARTED);
        } else {
          setError(errorMsg);
        }
        setIsValidating(false);
        return;
      }

      // Add player to room
      setIsValidating(false);
      setIsJoining(true);

      const playerResult = await addPlayer(roomResult.data.id, session.name);

      if (!playerResult.success) {
        setError(playerResult.error.message || ERROR_MESSAGES.UNKNOWN);
        setIsJoining(false);
        return;
      }

      // Store updated session
      storePlayerSession({
        name: session.name,
        playerId: playerResult.data.id,
        roomCode: roomResult.data.code,
      });

      // Navigate to room
      router.push(`/room/${roomResult.data.code}`);
    } catch (err) {
      console.error('Error joining room:', err);
      setError(ERROR_MESSAGES.NETWORK_ERROR);
      setIsValidating(false);
      setIsJoining(false);
    }
  };

  return (
    <JoinView
      roomCode={roomCode}
      onRoomCodeChange={handleRoomCodeChange}
      onJoinRoom={handleJoinRoom}
      isValidating={isValidating}
      isJoining={isJoining}
      error={error}
    />
  );
}
