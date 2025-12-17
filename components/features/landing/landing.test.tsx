/**
 * Landing Feature Tests
 *
 * Tests for landing page components and room creation flow.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  validatePlayerName,
  savePlayerSession,
  loadPlayerSession,
  clearPlayerSession,
} from './utils';
import { NameForm } from './NameForm';
import { ActionButtons } from './ActionButtons';
import { LandingView } from './LandingView';

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock components from Phase 3
vi.mock('@/components/common', () => ({
  Button: vi.fn(({ children, ...props }) => (
    <button {...props}>{children}</button>
  )),
  Input: vi.fn(({ label, error, ...props }) => (
    <div>
      <label htmlFor={props.id}>{label}</label>
      <input {...props} />
      {error && <span>{error}</span>}
    </div>
  )),
  Card: vi.fn(({ children, ...props }) => <div {...props}>{children}</div>),
}));

// Mock motion variants
vi.mock('@/components/motion', () => ({
  fadeIn: {},
  slideUp: {},
  staggerContainer: {},
  staggerItem: {},
}));

describe('validatePlayerName', () => {
  it('returns valid for correct names', () => {
    expect(validatePlayerName('Alice').valid).toBe(true);
    expect(validatePlayerName('Bob123').valid).toBe(true);
    expect(validatePlayerName('Player One').valid).toBe(true);
  });

  it('returns invalid for empty names', () => {
    const result = validatePlayerName('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Name is required');
  });

  it('returns invalid for whitespace-only names', () => {
    const result = validatePlayerName('   ');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Name is required');
  });

  it('returns invalid for names too short', () => {
    const result = validatePlayerName('A');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('at least 2 characters');
  });

  it('returns invalid for names too long', () => {
    const result = validatePlayerName('A'.repeat(21));
    expect(result.valid).toBe(false);
    expect(result.error).toContain('20 characters or less');
  });

  it('returns invalid for names with special characters', () => {
    const result = validatePlayerName('Alice@123');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('letters, numbers, and spaces');
  });

  it('trims whitespace before validation', () => {
    expect(validatePlayerName('  Alice  ').valid).toBe(true);
  });
});

describe('Session Storage', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('saves player session', () => {
    savePlayerSession('Alice');
    const saved = loadPlayerSession();
    expect(saved).toBe('Alice');
  });

  it('trims name before saving', () => {
    savePlayerSession('  Bob  ');
    const saved = loadPlayerSession();
    expect(saved).toBe('Bob');
  });

  it('returns null when no session exists', () => {
    const saved = loadPlayerSession();
    expect(saved).toBeNull();
  });

  it('clears player session', () => {
    savePlayerSession('Alice');
    clearPlayerSession();
    const saved = loadPlayerSession();
    expect(saved).toBeNull();
  });

  it('expires session after 1 hour', () => {
    // Save session
    savePlayerSession('Alice');

    // Manually modify timestamp to be 2 hours old
    const data = JSON.parse(
      sessionStorage.getItem('triviamania_player_session') || '{}'
    );
    data.timestamp = Date.now() - 2 * 60 * 60 * 1000; // 2 hours ago
    sessionStorage.setItem('triviamania_player_session', JSON.stringify(data));

    // Should return null and clear storage
    const saved = loadPlayerSession();
    expect(saved).toBeNull();
  });
});

describe('NameForm', () => {
  it('renders with label and placeholder', () => {
    render(<NameForm value="" onChange={() => {}} />);

    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your name/i)).toBeInTheDocument();
  });

  it('displays current value', () => {
    render(<NameForm value="Alice" onChange={() => {}} />);

    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument();
  });

  it('calls onChange when typing', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<NameForm value="" onChange={handleChange} />);

    const input = screen.getByLabelText(/your name/i);
    await user.type(input, 'A');

    expect(handleChange).toHaveBeenCalled();
  });

  it('displays error message', () => {
    render(<NameForm value="" onChange={() => {}} error="Name is required" />);

    expect(screen.getByText('Name is required')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(<NameForm value="Alice" onChange={() => {}} disabled />);

    expect(screen.getByLabelText(/your name/i)).toBeDisabled();
  });

  it('has required attribute', () => {
    render(<NameForm value="" onChange={() => {}} />);

    expect(screen.getByLabelText(/your name/i)).toBeRequired();
  });
});

describe('ActionButtons', () => {
  it('renders both buttons', () => {
    render(
      <ActionButtons
        onCreateRoom={() => {}}
        onJoinRoom={() => {}}
        disabled={false}
        isCreating={false}
      />
    );

    expect(
      screen.getByRole('button', { name: /create room/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /join room/i })
    ).toBeInTheDocument();
  });

  it('calls onCreateRoom when create button clicked', async () => {
    const user = userEvent.setup();
    const handleCreate = vi.fn();

    render(
      <ActionButtons
        onCreateRoom={handleCreate}
        onJoinRoom={() => {}}
        disabled={false}
        isCreating={false}
      />
    );

    await user.click(screen.getByRole('button', { name: /create room/i }));
    expect(handleCreate).toHaveBeenCalledOnce();
  });

  it('calls onJoinRoom when join button clicked', async () => {
    const user = userEvent.setup();
    const handleJoin = vi.fn();

    render(
      <ActionButtons
        onCreateRoom={() => {}}
        onJoinRoom={handleJoin}
        disabled={false}
        isCreating={false}
      />
    );

    await user.click(screen.getByRole('button', { name: /join room/i }));
    expect(handleJoin).toHaveBeenCalledOnce();
  });

  it('disables buttons when disabled prop is true', () => {
    render(
      <ActionButtons
        onCreateRoom={() => {}}
        onJoinRoom={() => {}}
        disabled={true}
        isCreating={false}
      />
    );

    expect(screen.getByRole('button', { name: /create room/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /join room/i })).toBeDisabled();
  });

  it('disables join button when creating', () => {
    render(
      <ActionButtons
        onCreateRoom={() => {}}
        onJoinRoom={() => {}}
        disabled={false}
        isCreating={true}
      />
    );

    expect(screen.getByRole('button', { name: /join room/i })).toBeDisabled();
  });
});

describe('LandingView', () => {
  const defaultProps = {
    playerName: '',
    onNameChange: () => {},
    onCreateRoom: () => {},
    onJoinRoom: () => {},
    isCreating: false,
    error: null,
  };

  it('renders title', () => {
    render(<LandingView {...defaultProps} />);
    expect(screen.getByText('Triviamania')).toBeInTheDocument();
  });

  it('renders subtitle', () => {
    render(<LandingView {...defaultProps} />);
    expect(
      screen.getByText(/real-time multiplayer trivia/i)
    ).toBeInTheDocument();
  });

  it('renders name form', () => {
    render(<LandingView {...defaultProps} />);
    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
  });

  it('renders action buttons', () => {
    render(<LandingView {...defaultProps} />);
    expect(
      screen.getByRole('button', { name: /create room/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /join room/i })
    ).toBeInTheDocument();
  });

  it('displays error message when provided', () => {
    render(<LandingView {...defaultProps} error="Something went wrong" />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('disables buttons when name is too short', () => {
    render(<LandingView {...defaultProps} playerName="A" />);

    expect(screen.getByRole('button', { name: /create room/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /join room/i })).toBeDisabled();
  });

  it('enables buttons when name is valid', () => {
    render(<LandingView {...defaultProps} playerName="Alice" />);

    expect(
      screen.getByRole('button', { name: /create room/i })
    ).not.toBeDisabled();
    expect(
      screen.getByRole('button', { name: /join room/i })
    ).not.toBeDisabled();
  });

  it('shows loading state on create button when creating', () => {
    render(
      <LandingView {...defaultProps} playerName="Alice" isCreating={true} />
    );

    // Button should still be present but in loading state
    expect(
      screen.getByRole('button', { name: /create room/i })
    ).toBeInTheDocument();
  });

  it('renders footer text', () => {
    render(<LandingView {...defaultProps} />);
    expect(screen.getByText(/no signup required/i)).toBeInTheDocument();
  });
});
