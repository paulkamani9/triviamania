/**
 * Join Feature Tests
 *
 * Comprehensive test suite for the join room flow.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { formatRoomCode, isValidRoomCodeFormat } from './RoomCodeInput';
import { JoinContainer } from './JoinContainer';
import { GameState } from '@/types';
import * as roomService from '@/services/room';
import * as playerService from '@/services/player';

// Mock Next.js navigation
const mockPush = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
}));

// Mock services
vi.mock('@/services/room');
vi.mock('@/services/player');

// Mock session storage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
});

describe('Join Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
    mockSessionStorage.getItem.mockClear();
    mockSessionStorage.setItem.mockClear();
  });

  describe('formatRoomCode', () => {
    it('should convert to uppercase', () => {
      expect(formatRoomCode('abcd1234')).toBe('ABCD1234');
    });

    it('should remove non-alphanumeric characters', () => {
      expect(formatRoomCode('AB-CD 12@34')).toBe('ABCD1234');
    });

    it('should limit to 8 characters', () => {
      expect(formatRoomCode('ABCD123456789')).toBe('ABCD1234');
    });

    it('should handle empty string', () => {
      expect(formatRoomCode('')).toBe('');
    });

    it('should handle special characters only', () => {
      expect(formatRoomCode('!@#$%^&*()')).toBe('');
    });
  });

  describe('isValidRoomCodeFormat', () => {
    it('should return true for valid 8-char alphanumeric code', () => {
      expect(isValidRoomCodeFormat('ABCD1234')).toBe(true);
      expect(isValidRoomCodeFormat('12345678')).toBe(true);
      expect(isValidRoomCodeFormat('AAAAAAAA')).toBe(true);
    });

    it('should return false for too short codes', () => {
      expect(isValidRoomCodeFormat('ABC123')).toBe(false);
      expect(isValidRoomCodeFormat('A')).toBe(false);
      expect(isValidRoomCodeFormat('')).toBe(false);
    });

    it('should return false for too long codes', () => {
      expect(isValidRoomCodeFormat('ABCD12345')).toBe(false);
    });

    it('should return false for codes with special characters', () => {
      expect(isValidRoomCodeFormat('ABCD-123')).toBe(false);
      expect(isValidRoomCodeFormat('ABCD 123')).toBe(false);
    });

    it('should return false for lowercase codes', () => {
      expect(isValidRoomCodeFormat('abcd1234')).toBe(false);
    });
  });

  describe('JoinContainer', () => {
    const mockRoom = {
      id: 'room-123',
      code: 'ABCD1234',
      host_id: 'host-456',
      status: GameState.WAITING,
      created_at: new Date().toISOString(),
      started_at: null,
      ended_at: null,
    };

    const mockPlayer = {
      id: 'player-789',
      name: 'Alice',
      room_id: 'room-123',
      score: 0,
      is_host: false,
      joined_at: new Date().toISOString(),
      left_at: null,
      current_streak: 0,
      best_streak: 0,
    };

    beforeEach(() => {
      // Setup default session with player name
      mockSessionStorage.getItem.mockReturnValue(
        JSON.stringify({ name: 'Alice' })
      );
    });

    it('should render join room form', () => {
      render(<JoinContainer />);

      expect(
        screen.getByRole('heading', { name: /join room/i })
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/room code/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /join room/i })
      ).toBeInTheDocument();
    });

    it('should format room code input to uppercase', async () => {
      const user = userEvent.setup();
      render(<JoinContainer />);

      const input = screen.getByLabelText(/room code/i);
      await user.type(input, 'abcd1234');

      expect(input).toHaveValue('ABCD1234');
    });

    it('should limit room code to 8 characters', async () => {
      const user = userEvent.setup();
      render(<JoinContainer />);

      const input = screen.getByLabelText(/room code/i);
      await user.type(input, 'ABCD123456789');

      expect(input).toHaveValue('ABCD1234');
    });

    it('should disable join button for invalid code', async () => {
      render(<JoinContainer />);

      const button = screen.getByRole('button', { name: /join room/i });
      expect(button).toBeDisabled();
    });

    it('should enable join button for valid code', async () => {
      const user = userEvent.setup();
      render(<JoinContainer />);

      const input = screen.getByLabelText(/room code/i);
      await user.type(input, 'ABCD1234');

      const button = screen.getByRole('button', { name: /join room/i });
      expect(button).toBeEnabled();
    });

    it('should successfully join valid room', async () => {
      const user = userEvent.setup();
      vi.mocked(roomService.joinRoom).mockResolvedValue({
        success: true,
        data: mockRoom,
      });
      vi.mocked(playerService.addPlayer).mockResolvedValue({
        success: true,
        data: mockPlayer,
      });

      render(<JoinContainer />);

      const input = screen.getByLabelText(/room code/i);
      await user.type(input, 'ABCD1234');

      const button = screen.getByRole('button', { name: /join room/i });
      await user.click(button);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/room/ABCD1234');
      });
    });

    it('should show error for room not found', async () => {
      const user = userEvent.setup();
      vi.mocked(roomService.joinRoom).mockResolvedValue({
        success: false,
        error: new Error('Room not found'),
      });

      render(<JoinContainer />);

      const input = screen.getByLabelText(/room code/i);
      await user.type(input, 'INVALID1');

      const button = screen.getByRole('button', { name: /join room/i });
      await user.click(button);

      expect(await screen.findByText(/room not found/i)).toBeInTheDocument();
    });

    it('should show error for game already started', async () => {
      const user = userEvent.setup();
      vi.mocked(roomService.joinRoom).mockResolvedValue({
        success: false,
        error: new Error('Game already started'),
      });

      render(<JoinContainer />);

      const input = screen.getByLabelText(/room code/i);
      await user.type(input, 'STARTED1');

      const button = screen.getByRole('button', { name: /join room/i });
      await user.click(button);

      expect(
        await screen.findByText(/game has already started/i)
      ).toBeInTheDocument();
    });

    it('should show error when no player name in session', async () => {
      const user = userEvent.setup();
      mockSessionStorage.getItem.mockReturnValue(null);

      render(<JoinContainer />);

      const input = screen.getByLabelText(/room code/i);
      await user.type(input, 'ABCD1234');

      const button = screen.getByRole('button', { name: /join room/i });
      await user.click(button);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });

    it('should show loading state during validation', async () => {
      const user = userEvent.setup();
      vi.mocked(roomService.joinRoom).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ success: true, data: mockRoom }), 100)
          )
      );

      render(<JoinContainer />);

      const input = screen.getByLabelText(/room code/i);
      await user.type(input, 'ABCD1234');

      const button = screen.getByRole('button', { name: /join room/i });
      await user.click(button);

      expect(screen.getByText(/validating/i)).toBeInTheDocument();
    });

    it('should show loading state during join', async () => {
      const user = userEvent.setup();
      vi.mocked(roomService.joinRoom).mockResolvedValue({
        success: true,
        data: mockRoom,
      });
      vi.mocked(playerService.addPlayer).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ success: true, data: mockPlayer }), 100)
          )
      );

      render(<JoinContainer />);

      const input = screen.getByLabelText(/room code/i);
      await user.type(input, 'ABCD1234');

      const button = screen.getByRole('button', { name: /join room/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/joining/i)).toBeInTheDocument();
      });
    });

    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();
      vi.mocked(roomService.joinRoom).mockRejectedValue(
        new Error('Network error')
      );

      render(<JoinContainer />);

      const input = screen.getByLabelText(/room code/i);
      await user.type(input, 'ABCD1234');

      const button = screen.getByRole('button', { name: /join room/i });
      await user.click(button);

      expect(await screen.findByText(/connection failed/i)).toBeInTheDocument();
    });

    it('should store player session after successful join', async () => {
      const user = userEvent.setup();
      vi.mocked(roomService.joinRoom).mockResolvedValue({
        success: true,
        data: mockRoom,
      });
      vi.mocked(playerService.addPlayer).mockResolvedValue({
        success: true,
        data: mockPlayer,
      });

      render(<JoinContainer />);

      const input = screen.getByLabelText(/room code/i);
      await user.type(input, 'ABCD1234');

      const button = screen.getByRole('button', { name: /join room/i });
      await user.click(button);

      await waitFor(() => {
        expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
          'playerSession',
          expect.stringContaining('ABCD1234')
        );
      });
    });

    it('should pre-populate code from URL parameter', async () => {
      mockSearchParams.set('code', 'TEST1234');

      render(<JoinContainer />);

      const input = screen.getByLabelText(/room code/i);
      expect(input).toHaveValue('TEST1234');
    });

    it('should handle addPlayer failure', async () => {
      const user = userEvent.setup();
      vi.mocked(roomService.joinRoom).mockResolvedValue({
        success: true,
        data: mockRoom,
      });
      vi.mocked(playerService.addPlayer).mockResolvedValue({
        success: false,
        error: new Error('Failed to add player'),
      });

      render(<JoinContainer />);

      const input = screen.getByLabelText(/room code/i);
      await user.type(input, 'ABCD1234');

      const button = screen.getByRole('button', { name: /join room/i });
      await user.click(button);

      expect(
        await screen.findByText(/failed to add player/i)
      ).toBeInTheDocument();
    });

    it('should clear error when typing new code', async () => {
      const user = userEvent.setup();
      vi.mocked(roomService.joinRoom).mockResolvedValue({
        success: false,
        error: new Error('Room not found'),
      });

      render(<JoinContainer />);

      const input = screen.getByLabelText(/room code/i);
      await user.type(input, 'WRONG123');

      const button = screen.getByRole('button', { name: /join room/i });
      await user.click(button);

      expect(await screen.findByText(/room not found/i)).toBeInTheDocument();

      // Type new code
      await user.clear(input);
      await user.type(input, 'ABCD1234');

      expect(screen.queryByText(/room not found/i)).not.toBeInTheDocument();
    });
  });
});
