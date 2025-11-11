/**
 * Player Types
 *
 * Defines player entities and related types for game participation.
 */

/**
 * Represents a player in a trivia game
 */
export interface Player {
  /** Unique identifier for the player (UUID) */
  id: string;

  /** Display name entered by the player */
  name: string;

  /** ID of the room this player is in */
  room_id: string;

  /** Current score in the game (starts at 0) */
  score: number;

  /** Whether this player is the host of the room */
  is_host: boolean;

  /** ISO 8601 timestamp of when the player joined */
  joined_at: string;

  /** Whether the player is currently connected (for handling disconnections) */
  is_connected?: boolean;

  /** Last activity timestamp for timeout detection */
  last_active_at?: string;
}

/**
 * Player session data stored in localStorage for reconnection
 */
export interface PlayerSession {
  /** Player ID */
  player_id: string;

  /** Player name */
  name: string;

  /** Current room code */
  room_code: string;

  /** Session creation timestamp */
  created_at: string;
}

/**
 * Validates player name (non-empty, max 20 characters, no special chars)
 */
export function isValidPlayerName(name: string): boolean {
  return /^[a-zA-Z0-9\s]{1,20}$/.test(name.trim());
}

/**
 * Sanitizes player name for display
 */
export function sanitizePlayerName(name: string): string {
  return name.trim().slice(0, 20);
}
