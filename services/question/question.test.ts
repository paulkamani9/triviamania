import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getQuestionById,
  getRandomQuestions,
  getQuestionsByCategory,
} from './question.service';
import { QuestionDifficulty } from '@/types';
import { supabase } from '@/lib/supabase';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('Question Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getQuestionById', () => {
    it('should fetch a question by ID', async () => {
      const mockQuestion = {
        id: 'question-123',
        text: 'What is 2+2?',
        category: 'general',
        difficulty: 'easy',
        options: ['3', '4', '5', '6'],
        correct_answer: 1,
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockQuestion,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await getQuestionById('question-123');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.text).toBe('What is 2+2?');
        expect(result.data.correct_answer).toBe(1);
      }
    });

    it('should reject empty question ID', async () => {
      const result = await getQuestionById('');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Question ID is required');
      }
    });

    it('should handle non-existent question', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      } as any);

      const result = await getQuestionById('invalid-id');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Question not found');
      }
    });

    it('should handle database errors', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      } as any);

      const result = await getQuestionById('question-123');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Failed to fetch question');
      }
    });
  });

  describe('getRandomQuestions', () => {
    it('should fetch random questions', async () => {
      const mockQuestions = [
        {
          id: 'q1',
          text: 'Question 1',
          options: ['A', 'B', 'C', 'D'],
          correct_answer: 0,
        },
        {
          id: 'q2',
          text: 'Question 2',
          options: ['A', 'B', 'C', 'D'],
          correct_answer: 1,
        },
        {
          id: 'q3',
          text: 'Question 3',
          options: ['A', 'B', 'C', 'D'],
          correct_answer: 2,
        },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: mockQuestions,
          error: null,
        }),
      } as any);

      const result = await getRandomQuestions(2);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBeLessThanOrEqual(2);
        // Verify options were shuffled by checking structure
        result.data.forEach((q) => {
          expect(q.options).toHaveLength(4);
          expect(q.correct_answer).toBeGreaterThanOrEqual(0);
          expect(q.correct_answer).toBeLessThan(4);
        });
      }
    });

    it('should filter by difficulty', async () => {
      const mockQuestions = [
        {
          id: 'q1',
          text: 'Hard Question',
          difficulty: 'hard',
          options: ['A', 'B', 'C', 'D'],
          correct_answer: 0,
        },
      ];

      const mockEq = vi.fn().mockResolvedValue({
        data: mockQuestions,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: mockEq,
        }),
      } as any);

      const result = await getRandomQuestions(1, {
        difficulty: QuestionDifficulty.HARD,
      });

      expect(result.success).toBe(true);
      expect(mockEq).toHaveBeenCalledWith(
        'difficulty',
        QuestionDifficulty.HARD
      );
    });

    it('should filter by category', async () => {
      const mockQuestions = [
        {
          id: 'q1',
          text: 'Science Question',
          category: 'science',
          options: ['A', 'B', 'C', 'D'],
          correct_answer: 0,
        },
      ];

      const mockEq = vi.fn().mockResolvedValue({
        data: mockQuestions,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: mockEq,
        }),
      } as any);

      const result = await getRandomQuestions(1, {
        category: 'science',
      });

      expect(result.success).toBe(true);
      expect(mockEq).toHaveBeenCalledWith('category', 'science');
    });

    it('should exclude specific question IDs', async () => {
      const mockQuestions = [
        {
          id: 'q4',
          text: 'New Question',
          options: ['A', 'B', 'C', 'D'],
          correct_answer: 0,
        },
      ];

      const mockNot = vi.fn().mockResolvedValue({
        data: mockQuestions,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          not: mockNot,
        }),
      } as any);

      const result = await getRandomQuestions(1, {
        excludeIds: ['q1', 'q2', 'q3'],
      });

      expect(result.success).toBe(true);
      expect(mockNot).toHaveBeenCalledWith('id', 'in', '(q1,q2,q3)');
    });

    it('should reject count less than 1', async () => {
      const result = await getRandomQuestions(0);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Count must be at least 1');
      }
    });

    it('should reject non-integer count', async () => {
      const result = await getRandomQuestions(2.5);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Count must be an integer');
      }
    });

    it('should return error when no questions match criteria', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      } as any);

      const result = await getRandomQuestions(5);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain(
          'No questions found matching the criteria'
        );
      }
    });

    it('should shuffle options for each question', async () => {
      const mockQuestions = [
        {
          id: 'q1',
          text: 'Question 1',
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correct_answer: 0, // First option is correct
        },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: mockQuestions,
          error: null,
        }),
      } as any);

      const result = await getRandomQuestions(1);

      expect(result.success).toBe(true);
      if (result.success) {
        const question = result.data[0];
        expect(question.options).toHaveLength(4);
        // The correct answer index should still point to 'Option A'
        expect(question.options[question.correct_answer]).toBe('Option A');
      }
    });
  });

  describe('getQuestionsByCategory', () => {
    it('should fetch questions by category', async () => {
      const mockQuestions = [
        {
          id: 'q1',
          text: 'History Question 1',
          category: 'history',
        },
        {
          id: 'q2',
          text: 'History Question 2',
          category: 'history',
        },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockQuestions,
            error: null,
          }),
        }),
      } as any);

      const result = await getQuestionsByCategory('history');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
      }
    });

    it('should normalize category to lowercase', async () => {
      const mockEq = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: mockEq,
        }),
      } as any);

      await getQuestionsByCategory('SCIENCE');

      expect(mockEq).toHaveBeenCalledWith('category', 'science');
    });

    it('should return empty array when no questions found', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      } as any);

      const result = await getQuestionsByCategory('unknown');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });

    it('should reject empty category', async () => {
      const result = await getQuestionsByCategory('');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Category is required');
      }
    });

    it('should handle database errors', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      } as any);

      const result = await getQuestionsByCategory('science');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Failed to fetch questions');
      }
    });
  });
});
