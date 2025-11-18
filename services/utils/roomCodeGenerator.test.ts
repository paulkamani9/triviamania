import { describe, it, expect, vi, beforeEach, 
  // afterEach 
} from 'vitest';
import {
  generateRoomCode,
  isValidRoomCode,
  generateRoomCodeSync,
} from './roomCodeGenerator';
import { supabase } from '@/lib/supabase';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('Room Code Generator', () => {
  describe('generateRoomCodeSync', () => {
    it('should generate an 8-character code', () => {
      const code = generateRoomCodeSync();
      expect(code).toHaveLength(8);
    });

    it('should only contain allowed characters', () => {
      const code = generateRoomCodeSync();
      const allowedChars = '234567889ABCDEFGHJKMNPQRSTUVWXYZ';

      for (const char of code) {
        expect(allowedChars).toContain(char);
      }
    });

    it('should not contain ambiguous characters (0, O, 1, I, L)', () => {
      // Generate multiple codes to increase confidence
      const codes = Array.from({ length: 100 }, () => generateRoomCodeSync());
      const ambiguousChars = ['0', 'O', '1', 'I', 'L'];

      for (const code of codes) {
        for (const ambiguousChar of ambiguousChars) {
          expect(code).not.toContain(ambiguousChar);
        }
      }
    });

    it('should generate different codes on multiple calls', () => {
      const codes = new Set();
      const attempts = 100;

      for (let i = 0; i < attempts; i++) {
        codes.add(generateRoomCodeSync());
      }

      // With random generation, we should have high uniqueness
      // Allow for some collisions but expect > 90% unique
      expect(codes.size).toBeGreaterThan(attempts * 0.9);
    });
  });

  describe('isValidRoomCode', () => {
    it('should accept valid 8-character codes', () => {
      expect(isValidRoomCode('ABCD2345')).toBe(true);
      expect(isValidRoomCode('23456789')).toBe(true);
      expect(isValidRoomCode('ZYXWVUTS')).toBe(true);
    });

    it('should reject codes that are too short', () => {
      expect(isValidRoomCode('ABC123')).toBe(false);
      expect(isValidRoomCode('A')).toBe(false);
      expect(isValidRoomCode('')).toBe(false);
    });

    it('should reject codes that are too long', () => {
      expect(isValidRoomCode('ABCD12345')).toBe(false);
      expect(isValidRoomCode('ABCD1234EXTRA')).toBe(false);
    });

    it('should reject codes with lowercase letters', () => {
      expect(isValidRoomCode('abcd1234')).toBe(false);
      expect(isValidRoomCode('Abcd1234')).toBe(false);
      expect(isValidRoomCode('ABCD123a')).toBe(false);
    });

    it('should reject codes with ambiguous characters', () => {
      expect(isValidRoomCode('ABCD123O')).toBe(false); // Contains O
      expect(isValidRoomCode('ABCD1230')).toBe(false); // Contains 0
      expect(isValidRoomCode('1BCD2345')).toBe(false); // Contains 1
      expect(isValidRoomCode('IBCD2345')).toBe(false); // Contains I
      expect(isValidRoomCode('LBCD2345')).toBe(false); // Contains L
    });

    it('should reject codes with special characters', () => {
      expect(isValidRoomCode('ABCD-234')).toBe(false);
      expect(isValidRoomCode('ABCD_234')).toBe(false);
      expect(isValidRoomCode('ABCD 234')).toBe(false);
      expect(isValidRoomCode('ABCD@234')).toBe(false);
    });
  });

  describe('generateRoomCode', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should generate a unique room code', async () => {
      // Mock Supabase to return no existing room (code is unique)
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const code = await generateRoomCode();

      expect(code).toHaveLength(8);
      expect(isValidRoomCode(code)).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('games');
    });

    it('should retry if the first code already exists', async () => {
      let callCount = 0;

      // Mock Supabase to return existing room on first call, then unique on second
      const mockMaybeSingle = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First attempt - code exists
          return Promise.resolve({
            data: { code: 'EXISTING1' },
            error: null,
          });
        } else {
          // Second attempt - code is unique
          return Promise.resolve({ data: null, error: null });
        }
      });

      const mockEq = vi.fn().mockReturnValue({
        maybeSingle: mockMaybeSingle,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const code = await generateRoomCode();

      expect(code).toHaveLength(8);
      expect(isValidRoomCode(code)).toBe(true);
      expect(mockMaybeSingle).toHaveBeenCalledTimes(2);
    });

    it('should throw error if database query fails', async () => {
      // Mock Supabase to return an error
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi
            .fn()
            .mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      await expect(generateRoomCode()).rejects.toThrow(
        'Database error while checking room code'
      );
    });

    it('should throw error after max attempts if all codes exist', async () => {
      // Mock Supabase to always return existing room
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { code: 'EXISTING1' },
            error: null,
          }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      await expect(generateRoomCode()).rejects.toThrow(
        'Failed to generate unique room code after 10 attempts'
      );
    });
  });
});
