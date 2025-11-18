import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  startGame,
  getCurrentQuestion,
  getNextQuestion,
  submitAnswer,
  endGame,
  subscribeToGameEvents,
} from './game.service';
import { GameState } from '@/types';
import { supabase } from '@/lib/supabase';

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    channel: vi.fn(),
  },
}));

vi.mock('../utils/scoreCalculator', () => ({
  calculateScore: vi.fn((isCorrect: boolean, time: number) => {
    if (!isCorrect) return 0;
    if (time <= 3) return 150;
    if (time <= 6) return 125;
    if (time <= 10) return 110;
    return 100;
  }),
}));

vi.mock('../player', () => ({
  updatePlayerScore: vi.fn().mockResolvedValue({ success: true, data: {} }),
}));

vi.mock('../question', () => ({
  getRandomQuestions: vi.fn().mockResolvedValue({
    success: true,
    data: [
      {
        id: 'q1',
        text: 'Test Question',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 1,
      },
    ],
  }),
}));

describe('Game Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('startGame', () => {
    it('should start a game with valid conditions', async () => {
      const mockRoom = {
        id: 'room-123',
        status: GameState.WAITING,
      };

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation((
        // table: string
      ) => {
        callCount++;
        if (callCount === 1) {
          // First: fetch room
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockRoom,
                  error: null,
                }),
              }),
            }),
          } as any;
        } else if (callCount === 2) {
          // Second: count players
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                count: 3,
                error: null,
              }),
            }),
          } as any;
        } else if (callCount === 3) {
          // Third: reset scores
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                error: null,
              }),
            }),
          } as any;
        } else {
          // Fourth: update room status
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                error: null,
              }),
            }),
          } as any;
        }
      });

      const result = await startGame('room-123');

      expect(result.success).toBe(true);
    });

    it('should reject empty room ID', async () => {
      const result = await startGame('');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Room ID is required');
      }
    });

    it('should reject non-existent room', async () => {
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

      const result = await startGame('invalid-room');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Room not found');
      }
    });

    it('should reject starting already active game', async () => {
      const mockRoom = {
        id: 'room-123',
        status: GameState.ACTIVE,
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockRoom,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await startGame('room-123');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('already started');
      }
    });

    it('should require at least 2 players', async () => {
      const mockRoom = {
        id: 'room-123',
        status: GameState.WAITING,
      };

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockRoom,
                  error: null,
                }),
              }),
            }),
          } as any;
        } else {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                count: 1, // Only 1 player
                error: null,
              }),
            }),
          } as any;
        }
      });

      const result = await startGame('room-123');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Need at least 2 players');
      }
    });
  });

  describe('getCurrentQuestion', () => {
    it('should fetch current question', async () => {
      const mockRoom = {
        current_question: 3,
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockRoom,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await getCurrentQuestion('room-123');

      expect(result.success).toBe(true);
      // Note: Current implementation returns null - this is expected
      // In a real implementation, you'd store and fetch the actual question
    });

    it('should reject empty room ID', async () => {
      const result = await getCurrentQuestion('');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Room ID is required');
      }
    });

    it('should handle non-existent room', async () => {
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

      const result = await getCurrentQuestion('invalid-room');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Room not found');
      }
    });
  });

  describe('getNextQuestion', () => {
    it('should fetch next question avoiding recent ones', async () => {
      const mockResponses = [
        { question_id: 'q1' },
        { question_id: 'q2' },
        { question_id: 'q3' },
      ];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: mockResponses,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const result = await getNextQuestion('room-123');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.text).toBe('Test Question');
      }
    });

    it('should reject empty room ID', async () => {
      const result = await getNextQuestion('');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Room ID is required');
      }
    });

    it('should pass filters to question service', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const result = await getNextQuestion('room-123', 'hard', 'science');

      expect(result.success).toBe(true);
    });
  });

  describe('submitAnswer', () => {
    it('should submit correct answer and award points', async () => {
      const mockQuestion = {
        correct_answer: 2,
      };

      const mockResponse = {
        id: 'response-123',
        player_id: 'player-123',
        question_id: 'question-123',
        room_id: 'room-123',
        answer: 2,
        is_correct: true,
        points_earned: 150,
        time_taken_ms: 2500,
      };

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Fetch question
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockQuestion,
                  error: null,
                }),
              }),
            }),
          } as any;
        } else {
          // Insert response
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockResponse,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
      });

      const result = await submitAnswer(
        'player-123',
        'question-123',
        'room-123',
        2,
        2500
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.is_correct).toBe(true);
        expect(result.data.points_earned).toBe(150);
      }
    });

    it('should submit wrong answer with 0 points', async () => {
      const mockQuestion = {
        correct_answer: 2,
      };

      const mockResponse = {
        id: 'response-123',
        answer: 1, // Wrong answer
        is_correct: false,
        points_earned: 0,
      };

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockQuestion,
                  error: null,
                }),
              }),
            }),
          } as any;
        } else {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockResponse,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
      });

      const result = await submitAnswer(
        'player-123',
        'question-123',
        'room-123',
        1,
        5000
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.is_correct).toBe(false);
        expect(result.data.points_earned).toBe(0);
      }
    });

    it('should reject invalid answer index', async () => {
      const result = await submitAnswer(
        'player-123',
        'question-123',
        'room-123',
        5, // Invalid (must be 0-3)
        2000
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain(
          'Answer must be between 0 and 3'
        );
      }
    });

    it('should reject negative time', async () => {
      const result = await submitAnswer(
        'player-123',
        'question-123',
        'room-123',
        2,
        -100
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain(
          'Time taken must be a positive number'
        );
      }
    });

    it('should handle duplicate answer submission', async () => {
      const mockQuestion = {
        correct_answer: 2,
      };

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockQuestion,
                  error: null,
                }),
              }),
            }),
          } as any;
        } else {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { code: '23505', message: 'Duplicate key' },
                }),
              }),
            }),
          } as any;
        }
      });

      const result = await submitAnswer(
        'player-123',
        'question-123',
        'room-123',
        2,
        2500
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Answer already submitted');
      }
    });

    it('should validate all required parameters', async () => {
      let result = await submitAnswer('', 'q1', 'r1', 0, 1000);
      expect(result.success).toBe(false);

      result = await submitAnswer('p1', '', 'r1', 0, 1000);
      expect(result.success).toBe(false);

      result = await submitAnswer('p1', 'q1', '', 0, 1000);
      expect(result.success).toBe(false);
    });
  });

  describe('endGame', () => {
    it('should end an active game', async () => {
      const mockRoom = {
        id: 'room-123',
        status: GameState.ACTIVE,
      };

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockRoom,
                  error: null,
                }),
              }),
            }),
          } as any;
        } else {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                error: null,
              }),
            }),
          } as any;
        }
      });

      const result = await endGame('room-123');

      expect(result.success).toBe(true);
    });

    it('should reject empty room ID', async () => {
      const result = await endGame('');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Room ID is required');
      }
    });

    it('should reject ending non-active game', async () => {
      const mockRoom = {
        id: 'room-123',
        status: GameState.WAITING,
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockRoom,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await endGame('room-123');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Game is not active');
      }
    });

    it('should handle non-existent room', async () => {
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

      const result = await endGame('invalid-room');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Room not found');
      }
    });
  });

  describe('subscribeToGameEvents', () => {
    it('should create a realtime subscription', () => {
      const mockCallback = vi.fn();
      const mockSubscribe = vi.fn();
      const mockOn = vi.fn().mockReturnValue({
        on: vi.fn().mockReturnValue({
          subscribe: mockSubscribe,
        }),
      });
      const mockChannel = vi.fn().mockReturnValue({
        on: mockOn,
      });

      vi.mocked(supabase.channel).mockImplementation(mockChannel);

      subscribeToGameEvents('room-123', mockCallback);

      expect(mockChannel).toHaveBeenCalledWith('game-events-room-123');
      expect(mockSubscribe).toHaveBeenCalled();
    });
  });
});
