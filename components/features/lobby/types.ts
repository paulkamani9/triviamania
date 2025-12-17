/**
 * Lobby Feature Types
 *
 * Type definitions specific to the lobby/waiting room feature.
 */

import { Player } from '@/types';

/**
 * Lobby component props
 */
export interface LobbyProps {
  roomCode: string;
  roomId: string;
  playerId: string;
  isHost: boolean;
}

/**
 * Lobby view props (presentational)
 */
export interface LobbyViewProps {
  players: Player[];
  roomCode: string;
  isHost: boolean;
  isLoading: boolean;
  error: string | null;
  onStartGame: () => void;
  onCopyCode: () => void;
  isStarting: boolean;
  canStart: boolean;
}

/**
 * Lobby state
 */
export interface LobbyState {
  players: Player[];
  isLoading: boolean;
  error: string | null;
  isStarting: boolean;
}
