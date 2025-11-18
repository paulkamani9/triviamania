import { describe, it, expect } from 'vitest';
import {
  calculateScore,
  getTimeBonus,
  getScorePercentage,
  SCORE_CONSTANTS,
} from './scoreCalculator';

describe('Score Calculator', () => {
  describe('calculateScore', () => {
    describe('correct answers', () => {
      it('should award 150 points for fast answers (0-3 seconds)', () => {
        expect(calculateScore(true, 0)).toBe(150);
        expect(calculateScore(true, 1.5)).toBe(150);
        expect(calculateScore(true, 2.99)).toBe(150);
        expect(calculateScore(true, 3.0)).toBe(150);
      });

      it('should award 125 points for medium speed answers (3-6 seconds)', () => {
        expect(calculateScore(true, 3.01)).toBe(125);
        expect(calculateScore(true, 4.5)).toBe(125);
        expect(calculateScore(true, 5.99)).toBe(125);
        expect(calculateScore(true, 6.0)).toBe(125);
      });

      it('should award 110 points for slow answers (6-10 seconds)', () => {
        expect(calculateScore(true, 6.01)).toBe(110);
        expect(calculateScore(true, 8.0)).toBe(110);
        expect(calculateScore(true, 9.99)).toBe(110);
        expect(calculateScore(true, 10.0)).toBe(110);
      });

      it('should award 100 points for very slow answers (10+ seconds)', () => {
        expect(calculateScore(true, 10.01)).toBe(100);
        expect(calculateScore(true, 15.0)).toBe(100);
        expect(calculateScore(true, 30.0)).toBe(100);
        expect(calculateScore(true, 100.0)).toBe(100);
      });
    });

    describe('wrong answers', () => {
      it('should award 0 points for wrong answers regardless of time', () => {
        expect(calculateScore(false, 0)).toBe(0);
        expect(calculateScore(false, 1.0)).toBe(0);
        expect(calculateScore(false, 5.0)).toBe(0);
        expect(calculateScore(false, 10.0)).toBe(0);
        expect(calculateScore(false, 100.0)).toBe(0);
      });
    });

    describe('edge cases', () => {
      it('should handle negative time by treating it as 0', () => {
        expect(calculateScore(true, -1)).toBe(150); // Same as 0 seconds
        expect(calculateScore(true, -10)).toBe(150);
        expect(calculateScore(false, -1)).toBe(0);
      });

      it('should handle exact boundary values correctly', () => {
        // Exact at 3 seconds (should still be fast bracket)
        expect(calculateScore(true, 3.0)).toBe(150);

        // Just over 3 seconds (should be medium bracket)
        expect(calculateScore(true, 3.00001)).toBe(125);

        // Exact at 6 seconds (should still be medium bracket)
        expect(calculateScore(true, 6.0)).toBe(125);

        // Just over 6 seconds (should be slow bracket)
        expect(calculateScore(true, 6.00001)).toBe(110);

        // Exact at 10 seconds (should still be slow bracket)
        expect(calculateScore(true, 10.0)).toBe(110);

        // Just over 10 seconds (should be very slow bracket)
        expect(calculateScore(true, 10.00001)).toBe(100);
      });

      it('should handle very large time values', () => {
        expect(calculateScore(true, 999999)).toBe(100);
        expect(calculateScore(true, Number.MAX_SAFE_INTEGER)).toBe(100);
      });

      it('should handle decimal precision correctly', () => {
        expect(calculateScore(true, 2.9999999)).toBe(150);
        expect(calculateScore(true, 3.0000001)).toBe(125);
        expect(calculateScore(true, 5.9999999)).toBe(125);
        expect(calculateScore(true, 6.0000001)).toBe(110);
      });
    });
  });

  describe('getTimeBonus', () => {
    it('should return 50 for fast times (0-3 seconds)', () => {
      expect(getTimeBonus(0)).toBe(50);
      expect(getTimeBonus(1.5)).toBe(50);
      expect(getTimeBonus(3.0)).toBe(50);
    });

    it('should return 25 for medium times (3-6 seconds)', () => {
      expect(getTimeBonus(3.01)).toBe(25);
      expect(getTimeBonus(4.5)).toBe(25);
      expect(getTimeBonus(6.0)).toBe(25);
    });

    it('should return 10 for slow times (6-10 seconds)', () => {
      expect(getTimeBonus(6.01)).toBe(10);
      expect(getTimeBonus(8.0)).toBe(10);
      expect(getTimeBonus(10.0)).toBe(10);
    });

    it('should return 0 for very slow times (10+ seconds)', () => {
      expect(getTimeBonus(10.01)).toBe(0);
      expect(getTimeBonus(15.0)).toBe(0);
      expect(getTimeBonus(100.0)).toBe(0);
    });

    it('should handle negative time by treating it as 0', () => {
      expect(getTimeBonus(-1)).toBe(50);
      expect(getTimeBonus(-10)).toBe(50);
    });
  });

  describe('getScorePercentage', () => {
    it('should return 100% for perfect fast correct answers', () => {
      expect(getScorePercentage(true, 0)).toBe(100);
      expect(getScorePercentage(true, 2.0)).toBe(100);
    });

    it('should return ~83% for medium speed correct answers', () => {
      // 125 out of 150 = 83.33%
      expect(getScorePercentage(true, 4.0)).toBe(83);
    });

    it('should return ~73% for slow correct answers', () => {
      // 110 out of 150 = 73.33%
      expect(getScorePercentage(true, 8.0)).toBe(73);
    });

    it('should return ~67% for very slow correct answers', () => {
      // 100 out of 150 = 66.67%
      expect(getScorePercentage(true, 12.0)).toBe(67);
    });

    it('should return 0% for wrong answers', () => {
      expect(getScorePercentage(false, 0)).toBe(0);
      expect(getScorePercentage(false, 5.0)).toBe(0);
      expect(getScorePercentage(false, 100.0)).toBe(0);
    });
  });

  describe('SCORE_CONSTANTS', () => {
    it('should export correct constant values', () => {
      expect(SCORE_CONSTANTS.BASE_POINTS).toBe(100);
      expect(SCORE_CONSTANTS.MAX_TIME_BONUS).toBe(50);
      expect(SCORE_CONSTANTS.MAX_POSSIBLE_SCORE).toBe(150);
      expect(SCORE_CONSTANTS.TIME_BRACKETS.FAST).toBe(3);
      expect(SCORE_CONSTANTS.TIME_BRACKETS.MEDIUM).toBe(6);
      expect(SCORE_CONSTANTS.TIME_BRACKETS.SLOW).toBe(10);
    });

    it('should be defined as const (TypeScript enforces immutability)', () => {
      // TypeScript's 'as const' provides compile-time immutability
      // At runtime, we just verify the structure exists
      expect(SCORE_CONSTANTS).toBeDefined();
      expect(typeof SCORE_CONSTANTS.BASE_POINTS).toBe('number');
      expect(typeof SCORE_CONSTANTS.TIME_BRACKETS).toBe('object');
    });
  });
});
