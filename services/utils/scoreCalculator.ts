/**
 * Score Calculator Utility
 *
 * Calculates points awarded for answering trivia questions based on
 * correctness and response time.
 */

/**
 * Base points awarded for a correct answer
 */
const BASE_POINTS = 100;

/**
 * Maximum time bonus points
 */
const MAX_TIME_BONUS = 50;

/**
 * Time thresholds for bonus calculation (in seconds)
 */
const TIME_BRACKETS = {
  FAST: 3, // 0-3 seconds: +50 bonus
  MEDIUM: 6, // 3-6 seconds: +25 bonus
  SLOW: 10, // 6-10 seconds: +10 bonus
  // 10+ seconds: +0 bonus
} as const;

/**
 * Calculate points for an answer based on correctness and time elapsed
 *
 * Scoring Algorithm:
 * - Wrong answer: 0 points (regardless of time)
 * - Correct answer: 100 base points + time bonus
 *
 * Time Bonus Calculation:
 * - Answer in 0-3 seconds: +50 points (total: 150)
 * - Answer in 3-6 seconds: +25 points (total: 125)
 * - Answer in 6-10 seconds: +10 points (total: 110)
 * - Answer in 10+ seconds: +0 points (total: 100)
 *
 * @param isCorrect - Whether the answer was correct
 * @param timeElapsed - Time taken to answer in seconds (must be >= 0)
 * @returns Total points earned (0 for wrong answers, 100-150 for correct)
 *
 * @example
 * // Fast correct answer
 * calculateScore(true, 2.5);  // Returns 150
 *
 * @example
 * // Medium speed correct answer
 * calculateScore(true, 4.5);  // Returns 125
 *
 * @example
 * // Slow correct answer
 * calculateScore(true, 8.0);  // Returns 110
 *
 * @example
 * // Very slow correct answer
 * calculateScore(true, 12.0); // Returns 100
 *
 * @example
 * // Wrong answer (any time)
 * calculateScore(false, 1.0); // Returns 0
 */
export function calculateScore(
  isCorrect: boolean,
  timeElapsed: number
): number {
  // Wrong answers get 0 points
  if (!isCorrect) {
    return 0;
  }

  // Ensure timeElapsed is not negative
  const validTime = Math.max(0, timeElapsed);

  // Calculate time bonus based on speed
  let timeBonus = 0;

  if (validTime <= TIME_BRACKETS.FAST) {
    // Fast answer: 0-3 seconds
    timeBonus = 50;
  } else if (validTime <= TIME_BRACKETS.MEDIUM) {
    // Medium speed: 3-6 seconds
    timeBonus = 25;
  } else if (validTime <= TIME_BRACKETS.SLOW) {
    // Slow answer: 6-10 seconds
    timeBonus = 10;
  } else {
    // Very slow: 10+ seconds
    timeBonus = 0;
  }

  return BASE_POINTS + timeBonus;
}

/**
 * Get the time bonus for a given time elapsed
 *
 * This is a helper function to calculate just the time bonus portion
 * without the base points.
 *
 * @param timeElapsed - Time taken to answer in seconds
 * @returns Time bonus points (0-50)
 *
 * @example
 * getTimeBonus(2.0);  // Returns 50
 * getTimeBonus(5.0);  // Returns 25
 * getTimeBonus(8.0);  // Returns 10
 * getTimeBonus(12.0); // Returns 0
 */
export function getTimeBonus(timeElapsed: number): number {
  const validTime = Math.max(0, timeElapsed);

  if (validTime <= TIME_BRACKETS.FAST) {
    return 50;
  } else if (validTime <= TIME_BRACKETS.MEDIUM) {
    return 25;
  } else if (validTime <= TIME_BRACKETS.SLOW) {
    return 10;
  } else {
    return 0;
  }
}

/**
 * Calculate the percentage of possible points earned
 *
 * This is useful for displaying performance metrics to players.
 *
 * @param isCorrect - Whether the answer was correct
 * @param timeElapsed - Time taken to answer in seconds
 * @returns Percentage of maximum possible points (0-100)
 *
 * @example
 * getScorePercentage(true, 2.0);  // Returns 100 (150/150)
 * getScorePercentage(true, 12.0); // Returns ~67 (100/150)
 * getScorePercentage(false, 1.0); // Returns 0
 */
export function getScorePercentage(
  isCorrect: boolean,
  timeElapsed: number
): number {
  const score = calculateScore(isCorrect, timeElapsed);
  const maxPossibleScore = BASE_POINTS + MAX_TIME_BONUS;
  return Math.round((score / maxPossibleScore) * 100);
}

/**
 * Export constants for use in other modules
 */
export const SCORE_CONSTANTS = {
  BASE_POINTS,
  MAX_TIME_BONUS,
  MAX_POSSIBLE_SCORE: BASE_POINTS + MAX_TIME_BONUS,
  TIME_BRACKETS,
} as const;
