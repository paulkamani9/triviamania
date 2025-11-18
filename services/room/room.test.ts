import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createRoom,
  joinRoom,
  getRoomState,
  updateRoomStatus,
  subscribeToRoom,
} from './room.service';
import { GameState } from '@/types';
import { supabase } from '@/lib/supabase';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    channel: vi.fn(),
  },
}));

// Mock room code generator
vi.mock('../utils/roomCodeGenerator', () => ({
  generateRoomCode: vi.fn().mockResolvedValue('ABCD1234'),
}));

describe('Room Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createRoom', () => {
    it('should create a room successfully', async () => {
      const mockRoom = {
        id: 'room-123',
        code: 'ABCD1234',
        host_id: 'player-123',
        status: GameState.WAITING,
        created_at: new Date().toISOString(),
      };

      const mockSingle = vi.fn().mockResolvedValue({
        data: mockRoom,
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const result = await createRoom('player-123');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.code).toBe('ABCD1234');
        expect(result.data.status).toBe(GameState.WAITING);
        expect(result.data.host_id).toBe('player-123');
      }
    });

    it('should reject empty host player ID', async () => {
      const result = await createRoom('');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Host player ID is required');
      }
    });

    it('should handle database errors', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const mockSelect = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const result = await createRoom('player-123');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Failed to create room');
      }
    });
  });

  describe('joinRoom', () => {
    it('should join a valid waiting room', async () => {
      const mockRoom = {
        id: 'room-123',
        code: 'ABCD1234',
        host_id: 'player-123',
        status: GameState.WAITING,
        created_at: new Date().toISOString(),
      };

      // Mock room fetch
      const mockSingleRoom = vi.fn().mockResolvedValue({
        data: mockRoom,
        error: null,
      });

      const mockSelectRoom = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: mockSingleRoom,
        }),
      });

      // Mock player count fetch
      const mockSelectPlayers = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          count: 3,
          error: null,
        }),
      });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'games') {
          return { select: mockSelectRoom } as any;
        } else if (table === 'players') {
          return { select: mockSelectPlayers } as any;
        }
        return {} as any;
      });

      const result = await joinRoom('ABCD1234', 'player-456');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.code).toBe('ABCD1234');
      }
    });

    it('should reject empty room code', async () => {
      const result = await joinRoom('', 'player-456');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Room code is required');
      }
    });

    it('should reject empty player ID', async () => {
      const result = await joinRoom('ABCD1234', '');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Player ID is required');
      }
    });

    it('should handle non-existent room', async () => {
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

      const result = await joinRoom('INVALID1', 'player-456');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Room not found');
      }
    });

    it('should reject joining active or finished rooms', async () => {
      const mockRoom = {
        id: 'room-123',
        code: 'ABCD1234',
        host_id: 'player-123',
        status: GameState.ACTIVE,
        created_at: new Date().toISOString(),
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

      const result = await joinRoom('ABCD1234', 'player-456');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('already in progress');
      }
    });

    it('should reject joining full rooms', async () => {
      const mockRoom = {
        id: 'room-123',
        code: 'ABCD1234',
        host_id: 'player-123',
        status: GameState.WAITING,
        created_at: new Date().toISOString(),
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

      const mockSelectPlayers = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          count: 8, // Max capacity
          error: null,
        }),
      });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'games') {
          return { select: mockSelectRoom } as any;
        } else if (table === 'players') {
          return { select: mockSelectPlayers } as any;
        }
        return {} as any;
      });

      const result = await joinRoom('ABCD1234', 'player-456');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Room is full');
      }
    });
  });

  describe('getRoomState', () => {
    it('should fetch room state successfully', async () => {
      const mockRoom = {
        id: 'room-123',
        code: 'ABCD1234',
        host_id: 'player-123',
        status: GameState.ACTIVE,
        created_at: new Date().toISOString(),
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

      const result = await getRoomState('room-123');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('room-123');
        expect(result.data.status).toBe(GameState.ACTIVE);
      }
    });

    it('should reject empty room ID', async () => {
      const result = await getRoomState('');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Room ID is required');
      }
    });

    it('should handle non-existent room', async () => {
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

      const result = await getRoomState('invalid-room');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Room not found');
      }
    });
  });

  describe('updateRoomStatus', () => {
    it('should update room status successfully', async () => {
      const mockEq = vi.fn().mockResolvedValue({
        error: null,
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as any);

      const result = await updateRoomStatus('room-123', GameState.ACTIVE);

      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({ status: GameState.ACTIVE });
    });

    it('should reject empty room ID', async () => {
      const result = await updateRoomStatus('', GameState.ACTIVE);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Room ID is required');
      }
    });

    it('should reject invalid status', async () => {
      const result = await updateRoomStatus('room-123', 'invalid' as any);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Invalid game status');
      }
    });

    it('should handle database errors', async () => {
      const mockEq = vi.fn().mockResolvedValue({
        error: { message: 'Update failed' },
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as any);

      const result = await updateRoomStatus('room-123', GameState.ACTIVE);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Failed to update room status');
      }
    });
  });

  describe('subscribeToRoom', () => {
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

      subscribeToRoom('room-123', mockCallback);

      expect(mockChannel).toHaveBeenCalledWith('room-room-123');
      expect(mockOn).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          event: '*',
          schema: 'public',
          table: 'games',
          filter: 'id=eq.room-123',
        }),
        expect.any(Function)
      );
      expect(mockSubscribe).toHaveBeenCalled();
    });
  });
});
