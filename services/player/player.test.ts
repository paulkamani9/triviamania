import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  addPlayer,
  getPlayersInRoom,
  updatePlayerScore,
  subscribeToPlayers,
  removePlayer,
} from './player.service';
import { supabase } from '@/lib/supabase';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    channel: vi.fn(),
  },
}));

describe('Player Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addPlayer', () => {
    it('should add a player successfully', async () => {
      const mockRoom = {
        id: 'room-123',
        status: 'waiting',
      };

      const mockPlayer = {
        id: 'player-123',
        name: 'Alice',
        room_id: 'room-123',
        score: 0,
        is_host: true, // First player
        joined_at: new Date().toISOString(),
        is_connected: true,
      };

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'games') {
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
        } else if (table === 'players') {
          callCount++;
          if (callCount === 1) {
            // First call: count check
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  count: 0,
                  error: null,
                }),
              }),
            } as any;
          } else {
            // Second call: insert
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockPlayer,
                    error: null,
                  }),
                }),
              }),
            } as any;
          }
        }
        return {} as any;
      });

      const result = await addPlayer('room-123', 'Alice');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Alice');
        expect(result.data.is_host).toBe(true);
        expect(result.data.score).toBe(0);
      }
    });

    it('should add a non-host player when room already has players', async () => {
      const mockRoom = {
        id: 'room-123',
        status: 'waiting',
      };

      const mockPlayer = {
        id: 'player-456',
        name: 'Bob',
        room_id: 'room-123',
        score: 0,
        is_host: false, // Not first player
        joined_at: new Date().toISOString(),
      };

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'games') {
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
        } else if (table === 'players') {
          callCount++;
          if (callCount === 1) {
            // First call: count check
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  count: 2, // Already 2 players
                  error: null,
                }),
              }),
            } as any;
          } else {
            // Second call: insert
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockPlayer,
                    error: null,
                  }),
                }),
              }),
            } as any;
          }
        }
        return {} as any;
      });

      const result = await addPlayer('room-123', 'Bob');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.is_host).toBe(false);
      }
    });

    it('should reject empty room ID', async () => {
      const result = await addPlayer('', 'Alice');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Room ID is required');
      }
    });

    it('should reject empty player name', async () => {
      const result = await addPlayer('room-123', '');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Player name is required');
      }
    });

    it('should reject invalid player name', async () => {
      const result = await addPlayer('room-123', 'Invalid@Name!');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Invalid player name');
      }
    });

    it('should reject joining non-existent room', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows' },
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: mockSingle,
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await addPlayer('invalid-room', 'Alice');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Room not found');
      }
    });

    it('should reject joining active or finished rooms', async () => {
      const mockRoom = {
        id: 'room-123',
        status: 'active',
      };

      const mockSingle = vi.fn().mockResolvedValue({
        data: mockRoom,
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: mockSingle,
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await addPlayer('room-123', 'Alice');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('already in progress');
      }
    });

    it('should reject joining full rooms', async () => {
      const mockRoom = {
        id: 'room-123',
        status: 'waiting',
      };

      const mockSingleRoom = vi.fn().mockResolvedValue({
        data: mockRoom,
        error: null,
      });

      const mockSelectRoom = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: mockSingleRoom,
        }),
      });

      const mockSelectCount = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          count: 8, // Max capacity
          error: null,
        }),
      });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'games') {
          return { select: mockSelectRoom } as any;
        } else if (table === 'players') {
          return { select: mockSelectCount } as any;
        }
        return {} as any;
      });

      const result = await addPlayer('room-123', 'Alice');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Room is full (maximum 8 players)');
      }
    });
  });

  describe('getPlayersInRoom', () => {
    it('should fetch all players in a room', async () => {
      const mockPlayers = [
        {
          id: 'player-1',
          name: 'Alice',
          room_id: 'room-123',
          score: 150,
          is_host: true,
          joined_at: '2025-01-01T10:00:00Z',
        },
        {
          id: 'player-2',
          name: 'Bob',
          room_id: 'room-123',
          score: 100,
          is_host: false,
          joined_at: '2025-01-01T10:01:00Z',
        },
      ];

      const mockOrder = vi.fn().mockResolvedValue({
        data: mockPlayers,
        error: null,
      });

      const mockEq = vi.fn().mockReturnValue({
        order: mockOrder,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await getPlayersInRoom('room-123');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0].name).toBe('Alice');
        expect(result.data[0].is_host).toBe(true);
      }
    });

    it('should return empty array when no players', async () => {
      const mockOrder = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      const mockEq = vi.fn().mockReturnValue({
        order: mockOrder,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await getPlayersInRoom('room-123');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });

    it('should reject empty room ID', async () => {
      const result = await getPlayersInRoom('');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Room ID is required');
      }
    });

    it('should handle database errors', async () => {
      const mockOrder = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const mockEq = vi.fn().mockReturnValue({
        order: mockOrder,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await getPlayersInRoom('room-123');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Failed to fetch players');
      }
    });
  });

  describe('updatePlayerScore', () => {
    it('should update player score successfully', async () => {
      const mockCurrentPlayer = {
        score: 100,
      };

      const mockUpdatedPlayer = {
        id: 'player-123',
        name: 'Alice',
        room_id: 'room-123',
        score: 250, // 100 + 150
        is_host: true,
        joined_at: '2025-01-01T10:00:00Z',
      };

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call: fetch current score
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockCurrentPlayer,
                  error: null,
                }),
              }),
            }),
          } as any;
        } else {
          // Second call: update score
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockUpdatedPlayer,
                    error: null,
                  }),
                }),
              }),
            }),
          } as any;
        }
      });

      const result = await updatePlayerScore('player-123', 150);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.score).toBe(250);
      }
    });

    it('should prevent score from going below 0', async () => {
      const mockCurrentPlayer = {
        score: 50,
      };

      const mockUpdatedPlayer = {
        id: 'player-123',
        score: 0, // Should be 0, not -50
      };

      let callCount = 0;
      const mockUpdate = vi.fn();

      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockCurrentPlayer,
                  error: null,
                }),
              }),
            }),
          } as any;
        } else {
          return {
            update: mockUpdate.mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockUpdatedPlayer,
                    error: null,
                  }),
                }),
              }),
            }),
          } as any;
        }
      });

      const result = await updatePlayerScore('player-123', -100);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.score).toBe(0);
      }
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ score: 0 })
      );
    });

    it('should reject empty player ID', async () => {
      const result = await updatePlayerScore('', 100);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Player ID is required');
      }
    });

    it('should reject invalid points', async () => {
      const result = await updatePlayerScore('player-123', NaN);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Points must be a valid number');
      }
    });

    it('should handle non-existent player', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: mockSingle,
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await updatePlayerScore('invalid-player', 100);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Player not found');
      }
    });
  });

  describe('subscribeToPlayers', () => {
    it('should create a realtime subscription', () => {
      const mockCallback = vi.fn();
      const mockSubscribe = vi.fn();
      const mockOn = vi.fn().mockReturnValue({
        subscribe: mockSubscribe,
      });
      const mockChannel = vi.fn().mockReturnValue({
        on: mockOn,
      });

      vi.mocked(supabase.channel).mockImplementation(mockChannel);

      subscribeToPlayers('room-123', mockCallback);

      expect(mockChannel).toHaveBeenCalledWith('players-room-123');
      expect(mockOn).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          event: '*',
          schema: 'public',
          table: 'players',
          filter: 'room_id=eq.room-123',
        }),
        expect.any(Function)
      );
      expect(mockSubscribe).toHaveBeenCalled();
    });
  });

  describe('removePlayer', () => {
    it('should remove a non-host player successfully', async () => {
      const mockPlayer = {
        id: 'player-123',
        room_id: 'room-123',
        is_host: false,
      };

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call: fetch player
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockPlayer,
                  error: null,
                }),
              }),
            }),
          } as any;
        } else {
          // Second call: delete player
          return {
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                error: null,
              }),
            }),
          } as any;
        }
      });

      const result = await removePlayer('player-123');

      expect(result.success).toBe(true);
    });

    it('should transfer host when removing host player', async () => {
      const mockHostPlayer = {
        id: 'player-host',
        room_id: 'room-123',
        is_host: true,
      };

      const mockNextPlayer = [{ id: 'player-next' }];

      // Mock player fetch
      const mockSingleFetch = vi.fn().mockResolvedValue({
        data: mockHostPlayer,
        error: null,
      });

      const mockSelectFetch = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: mockSingleFetch,
        }),
      });

      // Mock player delete
      const mockEqDelete = vi.fn().mockResolvedValue({
        error: null,
      });

      const mockDelete = vi.fn().mockReturnValue({
        eq: mockEqDelete,
      });

      // Mock next player fetch
      const mockLimit = vi.fn().mockResolvedValue({
        data: mockNextPlayer,
        error: null,
      });

      const mockOrder = vi.fn().mockReturnValue({
        limit: mockLimit,
      });

      const mockEqNext = vi.fn().mockReturnValue({
        order: mockOrder,
      });

      const mockSelectNext = vi.fn().mockReturnValue({
        eq: mockEqNext,
      });

      // Mock host update
      const mockEqUpdate = vi.fn().mockResolvedValue({
        error: null,
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEqUpdate,
      });

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { select: mockSelectFetch } as any;
        } else if (callCount === 2) {
          return { delete: mockDelete } as any;
        } else if (callCount === 3) {
          return { select: mockSelectNext } as any;
        } else {
          return { update: mockUpdate } as any;
        }
      });

      const result = await removePlayer('player-host');

      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({ is_host: true });
    });

    it('should reject empty player ID', async () => {
      const result = await removePlayer('');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Player ID is required');
      }
    });

    it('should handle non-existent player', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: mockSingle,
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await removePlayer('invalid-player');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Player not found');
      }
    });
  });
});
