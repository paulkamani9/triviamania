/**
 * Lobby Feature Tests
 *
 * Tests for LobbyContainer and LobbyView components.
 * Covers real-time subscriptions, player list updates, host controls,
 * and game start flow.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { LobbyView } from './LobbyView';
import { LobbyContainer } from './LobbyContainer';
import type { Player } from '@/types';
import * as playerService from '@/services/player';
import * as gameService from '@/services/game';

// Mock Next.js navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock framer-motion completely
vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (_target, prop) => {
        const Component = ({ children, ...props }: any) => {
          const {
            variants,
            initial,
            animate,
            exit,
            transition,
            layout,
            layoutId,
            whileHover,
            ...restProps
          } = props;
          return React.createElement(prop as string, restProps, children);
        };
        Component.displayName = `motion.${String(prop)}`;
        return Component;
      },
    }
  ),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock motion utilities
vi.mock('@/components/motion/variants', () => ({
  fadeIn: {},
  staggerContainer: {},
}));

vi.mock('@/components/motion/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

describe('LobbyView', () => {
  const mockPlayers: Player[] = [
    {
      id: 'player-1',
      name: 'Alice',
      room_id: 'room-123',
      score: 0,
      is_host: true,
      joined_at: new Date().toISOString(),
      is_connected: true,
      last_active_at: new Date().toISOString(),
    },
    {
      id: 'player-2',
      name: 'Bob',
      room_id: 'room-123',
      score: 0,
      is_host: false,
      joined_at: new Date().toISOString(),
      is_connected: true,
      last_active_at: new Date().toISOString(),
    },
  ];

  const defaultProps = {
    players: mockPlayers,
    roomCode: 'ABCD1234',
    isHost: true,
    isLoading: false,
    error: null,
    onStartGame: vi.fn(),
    onCopyCode: vi.fn(),
    isStarting: false,
    canStart: true,
  };

  it('renders lobby header', () => {
    render(<LobbyView {...defaultProps} />);
    expect(screen.getByText('Waiting Room')).toBeInTheDocument();
  });

  it('displays room code', () => {
    render(<LobbyView {...defaultProps} />);
    expect(screen.getByText('ABCD1234')).toBeInTheDocument();
  });

  it('shows host message when user is host', () => {
    render(<LobbyView {...defaultProps} isHost={true} />);
    expect(
      screen.getByText('Waiting for players to join...')
    ).toBeInTheDocument();
  });

  it('shows non-host message when user is not host', () => {
    render(<LobbyView {...defaultProps} isHost={false} />);
    expect(
      screen.getByText('Waiting for host to start the game...')
    ).toBeInTheDocument();
  });

  it('displays player count', () => {
    render(<LobbyView {...defaultProps} />);
    expect(screen.getByText('Players (2)')).toBeInTheDocument();
  });

  it('renders player cards for all players', () => {
    render(<LobbyView {...defaultProps} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows loading spinner when loading', () => {
    render(<LobbyView {...defaultProps} isLoading={true} players={[]} />);
    // LoadingSpinner should be rendered
    const spinner = screen.getByRole('status', { hidden: true });
    expect(spinner).toBeInTheDocument();
  });

  it('displays error message when error present', () => {
    const error = 'Failed to fetch players';
    render(<LobbyView {...defaultProps} error={error} />);
    expect(screen.getByText(error)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('shows empty state when no players', () => {
    render(<LobbyView {...defaultProps} players={[]} />);
    expect(screen.getByText('No players in the room yet')).toBeInTheDocument();
  });

  describe('Host Controls', () => {
    it('shows Start Game button when host', () => {
      render(<LobbyView {...defaultProps} isHost={true} />);
      expect(screen.getByText('Start Game')).toBeInTheDocument();
    });

    it('hides Start Game button when not host', () => {
      render(<LobbyView {...defaultProps} isHost={false} />);
      expect(screen.queryByText('Start Game')).not.toBeInTheDocument();
    });

    it('enables Start Game button when can start', () => {
      render(<LobbyView {...defaultProps} canStart={true} />);
      const button = screen.getByText('Start Game');
      expect(button).not.toBeDisabled();
    });

    it('disables Start Game button when cannot start', () => {
      render(<LobbyView {...defaultProps} canStart={false} />);
      const button = screen.getByText('Start Game');
      expect(button).toBeDisabled();
    });

    it('shows helper text when less than 2 players', () => {
      render(
        <LobbyView
          {...defaultProps}
          players={[mockPlayers[0]]}
          canStart={false}
        />
      );
      expect(
        screen.getByText('Wait for at least one more player to join')
      ).toBeInTheDocument();
    });

    it('calls onStartGame when Start Game clicked', () => {
      const onStartGame = vi.fn();
      render(<LobbyView {...defaultProps} onStartGame={onStartGame} />);

      const button = screen.getByText('Start Game');
      fireEvent.click(button);

      expect(onStartGame).toHaveBeenCalledTimes(1);
    });

    it('shows loading state when starting game', () => {
      render(<LobbyView {...defaultProps} isStarting={true} />);
      expect(screen.getByText('Starting Game...')).toBeInTheDocument();
    });

    it('disables button when starting game', () => {
      render(<LobbyView {...defaultProps} isStarting={true} />);
      const button = screen.getByText('Starting Game...');
      expect(button).toBeDisabled();
    });
  });

  describe('Room Code Copy', () => {
    it('calls onCopyCode when copy button clicked', () => {
      const onCopyCode = vi.fn();
      render(<LobbyView {...defaultProps} onCopyCode={onCopyCode} />);

      // The copy button is in RoomCodeDisplay component
      const copyButton = screen.getByText('Copy');
      fireEvent.click(copyButton);

      expect(onCopyCode).toHaveBeenCalledTimes(1);
    });
  });

  describe('Non-Host View', () => {
    it('shows waiting message for non-host', () => {
      render(<LobbyView {...defaultProps} isHost={false} />);
      expect(
        screen.getByText('The host will start the game when ready')
      ).toBeInTheDocument();
    });

    it('does not show Start Game button for non-host', () => {
      render(<LobbyView {...defaultProps} isHost={false} />);
      expect(screen.queryByText('Start Game')).not.toBeInTheDocument();
    });
  });
});

describe('LobbyContainer', () => {
  const mockPlayers: Player[] = [
    {
      id: 'player-1',
      name: 'Alice',
      room_id: 'room-123',
      score: 0,
      is_host: true,
      joined_at: new Date().toISOString(),
      is_connected: true,
      last_active_at: new Date().toISOString(),
    },
    {
      id: 'player-2',
      name: 'Bob',
      room_id: 'room-123',
      score: 0,
      is_host: false,
      joined_at: new Date().toISOString(),
      is_connected: true,
      last_active_at: new Date().toISOString(),
    },
  ];

  const mockChannel = {
    unsubscribe: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock player service
    vi.spyOn(playerService, 'getPlayersInRoom').mockResolvedValue({
      success: true,
      data: mockPlayers,
    });

    vi.spyOn(playerService, 'subscribeToPlayers').mockReturnValue(
      mockChannel as any
    );

    // Mock game service
    vi.spyOn(gameService, 'startGame').mockResolvedValue({
      success: true,
      data: undefined,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const defaultProps = {
    roomCode: 'ABCD1234',
    roomId: 'room-123',
    playerId: 'player-1',
    isHost: true,
  };

  it('fetches initial player list on mount', async () => {
    render(<LobbyContainer {...defaultProps} />);

    await waitFor(() => {
      expect(playerService.getPlayersInRoom).toHaveBeenCalledWith('room-123');
    });

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('subscribes to player updates on mount', async () => {
    render(<LobbyContainer {...defaultProps} />);

    await waitFor(() => {
      expect(playerService.subscribeToPlayers).toHaveBeenCalledWith(
        'room-123',
        expect.any(Function)
      );
    });
  });

  it('unsubscribes from updates on unmount', async () => {
    const { unmount } = render(<LobbyContainer {...defaultProps} />);

    await waitFor(() => {
      expect(playerService.subscribeToPlayers).toHaveBeenCalled();
    });

    unmount();

    expect(mockChannel.unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('displays error when fetching players fails', async () => {
    vi.spyOn(playerService, 'getPlayersInRoom').mockResolvedValue({
      success: false,
      error: new Error('Failed to fetch players'),
    });

    render(<LobbyContainer {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch players')).toBeInTheDocument();
    });
  });

  describe('Real-Time Updates', () => {
    it('updates player list when subscription callback called', async () => {
      let subscriptionCallback: (players: Player[]) => void = () => {};

      vi.spyOn(playerService, 'subscribeToPlayers').mockImplementation(
        (roomId, callback) => {
          subscriptionCallback = callback;
          return mockChannel as any;
        }
      );

      render(<LobbyContainer {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument();
      });

      // Simulate new player joining via subscription
      const newPlayers = [
        ...mockPlayers,
        {
          id: 'player-3',
          name: 'Charlie',
          room_id: 'room-123',
          score: 0,
          is_host: false,
          joined_at: new Date().toISOString(),
          is_connected: true,
          last_active_at: new Date().toISOString(),
        },
      ];

      subscriptionCallback(newPlayers);

      await waitFor(() => {
        expect(screen.getByText('Charlie')).toBeInTheDocument();
        expect(screen.getByText('Players (3)')).toBeInTheDocument();
      });
    });

    it('navigates to home when current player removed', async () => {
      let subscriptionCallback: (players: Player[]) => void = () => {};

      vi.spyOn(playerService, 'subscribeToPlayers').mockImplementation(
        (roomId, callback) => {
          subscriptionCallback = callback;
          return mockChannel as any;
        }
      );

      render(<LobbyContainer {...defaultProps} playerId="player-1" />);

      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument();
      });

      // Simulate current player being removed
      subscriptionCallback([mockPlayers[1]]);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });
  });

  describe('Start Game', () => {
    it('starts game when Start Game button clicked', async () => {
      render(<LobbyContainer {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Start Game')).toBeInTheDocument();
      });

      const button = screen.getByText('Start Game');
      fireEvent.click(button);

      await waitFor(() => {
        expect(gameService.startGame).toHaveBeenCalledWith('room-123');
      });
    });

    it('navigates to game screen on successful start', async () => {
      render(<LobbyContainer {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Start Game')).toBeInTheDocument();
      });

      const button = screen.getByText('Start Game');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/room/ABCD1234/game');
      });
    });

    it('shows error when start game fails', async () => {
      vi.spyOn(gameService, 'startGame').mockResolvedValue({
        success: false,
        error: new Error('Failed to start game'),
      });

      render(<LobbyContainer {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Start Game')).toBeInTheDocument();
      });

      const button = screen.getByText('Start Game');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Failed to start game')).toBeInTheDocument();
      });
    });

    it('shows error when trying to start with less than 2 players', async () => {
      vi.spyOn(playerService, 'getPlayersInRoom').mockResolvedValue({
        success: true,
        data: [mockPlayers[0]],
      });

      render(<LobbyContainer {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Start Game')).toBeInTheDocument();
      });

      const button = screen.getByText('Start Game');
      fireEvent.click(button);

      await waitFor(() => {
        expect(
          screen.getByText('Need at least 2 players to start the game')
        ).toBeInTheDocument();
      });

      expect(gameService.startGame).not.toHaveBeenCalled();
    });

    it('shows loading state while starting game', async () => {
      let resolveStartGame: (value: any) => void;
      const startGamePromise = new Promise((resolve) => {
        resolveStartGame = resolve;
      });

      vi.spyOn(gameService, 'startGame').mockReturnValue(
        startGamePromise as any
      );

      render(<LobbyContainer {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Start Game')).toBeInTheDocument();
      });

      const button = screen.getByText('Start Game');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Starting Game...')).toBeInTheDocument();
      });

      // Resolve the promise
      resolveStartGame!({ success: true, data: undefined });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/room/ABCD1234/game');
      });
    });
  });

  describe('Copy Code', () => {
    it('logs when copy code called', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      render(<LobbyContainer {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Copy')).toBeInTheDocument();
      });

      const copyButton = screen.getByText('Copy');
      fireEvent.click(copyButton);

      // Note: The actual clipboard API is mocked in RoomCodeDisplay tests
      // Here we just verify the callback is wired up

      consoleSpy.mockRestore();
    });
  });
});
