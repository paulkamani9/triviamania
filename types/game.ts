/**
 * Game State Management Types
 *
 * Defines the core types for game rooms, states, and game flow management.
 */

/**
 * Game state enum representing the lifecycle of a trivia game
 */
export enum GameState {
  /** Waiting for players to join and host to start */
  WAITING = 'waiting',
  /** Game is actively in progress */
  ACTIVE = 'active',
  /** Game has concluded and showing final results */
  FINISHED = 'finished',
}

/**
 * Represents a trivia game room/session
 */
export interface Room {
  /** Unique identifier for the room (UUID) */
  id: string;

  /** 8-character alphanumeric room code for joining (e.g., "ABCD1234") */
  code: string;

  /** Player ID of the room host who can start games */
  host_id: string;

  /** Current state of the game */
  status: GameState;

  /** ISO 8601 timestamp of when the room was created */
  created_at: string;

  /** ISO 8601 timestamp of last update (optional for update tracking) */
  updated_at?: string;

  /** Current question number in the game (1-indexed, null if not started) */
  current_question?: number;

  /** Total number of questions in this game session */
  total_questions?: number;
}

/**
 * Type guard to check if a string is a valid GameState
 */
export function isGameState(value: string): value is GameState {
  return Object.values(GameState).includes(value as GameState);
}

/**
 * Validates room code format (8 alphanumeric characters)
 */
export function isValidRoomCode(code: string): boolean {
  return /^[A-Z0-9]{8}$/.test(code);
}
