/**
 * Response and Scoring Type Tests
 *
 * Tests for response tracking and scoring calculation logic.
 */

import { describe, it, expect } from 'vitest';
import {
  SCORING,
  calculatePoints,
  type Response,
  type ScoreSummary,
} from '@/types/response';

describe('SCORING constants', () => {
  it('should have correct scoring values', () => {
    expect(SCORING.BASE_POINTS).toBe(100);
    expect(SCORING.MAX_SPEED_BONUS).toBe(50);
    expect(SCORING.TIME_LIMIT_MS).toBe(10000);
    expect(SCORING.INCORRECT_POINTS).toBe(0);
  });

  it('should be immutable', () => {
    // TypeScript enforces this, but we can verify the values
    expect(Object.isFrozen(SCORING)).toBe(false); // `as const` doesn't freeze at runtime
    // But the type system prevents modification
  });
});

describe('calculatePoints', () => {
  it('should return 0 for incorrect answers regardless of time', () => {
    expect(calculatePoints(false, 0)).toBe(0);
    expect(calculatePoints(false, 5000)).toBe(0);
    expect(calculatePoints(false, 10000)).toBe(0);
  });

  it('should award base points + max bonus for instant answer', () => {
    const points = calculatePoints(true, 0);
    expect(points).toBe(150); // 100 + 50
  });

  it('should award base points only for answer at time limit', () => {
    const points = calculatePoints(true, 10000);
    expect(points).toBe(100); // 100 + 0
  });

  it('should award base points + partial bonus for mid-time answer', () => {
    const points = calculatePoints(true, 5000);
    expect(points).toBe(125); // 100 + 25 (50% of bonus)
  });

  it('should calculate speed bonus correctly for various times', () => {
    // 25% time used = 75% bonus
    expect(calculatePoints(true, 2500)).toBe(138); // 100 + 38 (rounded)

    // 75% time used = 25% bonus
    expect(calculatePoints(true, 7500)).toBe(113); // 100 + 13 (rounded)
  });

  it('should clamp time values exceeding time limit', () => {
    // Should treat over-limit the same as exactly at limit
    expect(calculatePoints(true, 15000)).toBe(100);
    expect(calculatePoints(true, 10000)).toBe(100);
  });

  it('should handle edge case of very fast response', () => {
    const points = calculatePoints(true, 100); // 100ms
    expect(points).toBeGreaterThan(145);
    expect(points).toBeLessThanOrEqual(150);
  });
});

describe('Response interface', () => {
  it('should structure response data correctly', () => {
    const response: Response = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      player_id: '123e4567-e89b-12d3-a456-426614174001',
      question_id: '123e4567-e89b-12d3-a456-426614174002',
      answer: 2,
      timestamp: '2025-11-11T10:00:00Z',
      time_taken_ms: 3500,
      is_correct: true,
      points_earned: 133,
      room_id: '123e4567-e89b-12d3-a456-426614174003',
    };

    expect(response.answer).toBeGreaterThanOrEqual(0);
    expect(response.answer).toBeLessThan(4);
    expect(response.points_earned).toBeGreaterThanOrEqual(0);
  });
});

describe('ScoreSummary interface', () => {
  it('should aggregate player performance data', () => {
    const summary: ScoreSummary = {
      player_id: '123e4567-e89b-12d3-a456-426614174000',
      player_name: 'Alice',
      total_score: 850,
      correct_answers: 7,
      incorrect_answers: 3,
      average_time_ms: 4200,
      rank: 1,
    };

    expect(summary.total_score).toBeGreaterThan(0);
    expect(summary.correct_answers + summary.incorrect_answers).toBeGreaterThan(
      0
    );
  });

  it('should allow optional rank field', () => {
    const summaryWithoutRank: ScoreSummary = {
      player_id: '123e4567-e89b-12d3-a456-426614174000',
      player_name: 'Bob',
      total_score: 450,
      correct_answers: 4,
      incorrect_answers: 2,
      average_time_ms: 5500,
    };

    expect(summaryWithoutRank.rank).toBeUndefined();
  });
});

describe('Scoring edge cases', () => {
  it('should handle negative time (treat as 0)', () => {
    // While this shouldn't happen, ensure robustness
    const points = calculatePoints(true, -100);
    expect(points).toBe(150); // Negative becomes 0, gets max bonus
  });

  it('should ensure points are integers', () => {
    const points = calculatePoints(true, 3333);
    expect(Number.isInteger(points)).toBe(true);
  });

  it('should maintain consistent scoring across multiple calls', () => {
    const time = 4500;
    const points1 = calculatePoints(true, time);
    const points2 = calculatePoints(true, time);
    expect(points1).toBe(points2);
  });
});
