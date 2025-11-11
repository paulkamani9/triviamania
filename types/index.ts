/**
 * Triviamania Type Definitions
 *
 * Central export point for all type definitions.
 * Import types from this file throughout the application.
 *
 * @example
 * import { Room, Player, Question, GameState } from '@/types';
 */

// Game types
export type { Room } from './game';
export { GameState, isGameState, isValidRoomCode } from './game';

// Player types
export type { Player, PlayerSession } from './player';
export { isValidPlayerName, sanitizePlayerName } from './player';

// Question types
export type { Question, ShuffledQuestion } from './question';
export {
  QuestionDifficulty,
  QuestionCategory,
  isQuestionDifficulty,
  isQuestionCategory,
  isValidQuestion,
} from './question';

// Response and scoring types
export type { Response, ScoreSummary } from './response';
export { SCORING, calculatePoints } from './response';

/**
 * Common utility types
 */

/**
 * Supabase timestamp format (ISO 8601)
 */
export type Timestamp = string;

/**
 * UUID format for IDs
 */
export type UUID = string;

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

/**
 * Realtime event payload structure
 */
export interface RealtimePayload<T> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: Partial<T>;
  table: string;
}
