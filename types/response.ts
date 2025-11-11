/**
 * Response & Scoring Types
 *
 * Defines player responses, answer tracking, and scoring logic.
 */

/**
 * Represents a player's answer to a question
 */
export interface Response {
  /** Unique identifier for the response (UUID) */
  id: string;

  /** ID of the player who submitted the answer */
  player_id: string;

  /** ID of the question being answered */
  question_id: string;

  /** Index of the selected answer (0-3) */
  answer: number;

  /** ISO 8601 timestamp of when the answer was submitted */
  timestamp: string;

  /** Time taken to answer in milliseconds */
  time_taken_ms: number;

  /** Whether the answer was correct */
  is_correct: boolean;

  /** Points awarded for this answer (base + speed bonus) */
  points_earned: number;

  /** ID of the room/game this response belongs to */
  room_id: string;
}

/**
 * Scoring configuration constants
 */
export const SCORING = {
  /** Base points for a correct answer */
  BASE_POINTS: 100,

  /** Maximum speed bonus points */
  MAX_SPEED_BONUS: 50,

  /** Question time limit in milliseconds */
  TIME_LIMIT_MS: 10000,

  /** Points for incorrect answer */
  INCORRECT_POINTS: 0,
} as const;

/**
 * Calculate points earned for a response
 * Formula: BASE_POINTS + (MAX_SPEED_BONUS * (1 - time_ratio))
 *
 * @param isCorrect - Whether the answer was correct
 * @param timeTakenMs - Time taken to answer in milliseconds
 * @returns Points earned (0 if incorrect)
 */
export function calculatePoints(
  isCorrect: boolean,
  timeTakenMs: number
): number {
  if (!isCorrect) return SCORING.INCORRECT_POINTS;

  // Clamp time to valid range (0 to time limit)
  const clampedTime = Math.min(Math.max(0, timeTakenMs), SCORING.TIME_LIMIT_MS);

  // Calculate time ratio (0 = instant, 1 = full time used)
  const timeRatio = clampedTime / SCORING.TIME_LIMIT_MS;

  // Calculate speed bonus (faster = more bonus)
  const speedBonus = Math.round(SCORING.MAX_SPEED_BONUS * (1 - timeRatio));

  return SCORING.BASE_POINTS + speedBonus;
}

/**
 * Player score summary
 */
export interface ScoreSummary {
  /** Player ID */
  player_id: string;

  /** Player name */
  player_name: string;

  /** Total score */
  total_score: number;

  /** Number of correct answers */
  correct_answers: number;

  /** Number of incorrect answers */
  incorrect_answers: number;

  /** Average time taken per question in milliseconds */
  average_time_ms: number;

  /** Current rank in the game (1-indexed) */
  rank?: number;
}
