/**
 * Timer Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { Timer, useTimer } from './index';

describe('useTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with correct duration', () => {
    const { result } = renderHook(() => useTimer({ duration: 10 }));
    expect(result.current.timeLeft).toBe(10);
  });

  it('starts paused by default', () => {
    const { result } = renderHook(() => useTimer({ duration: 10 }));
    expect(result.current.isRunning).toBe(false);
  });

  it('auto-starts when autoStart is true', () => {
    const { result } = renderHook(() =>
      useTimer({ duration: 10, autoStart: true })
    );
    expect(result.current.isRunning).toBe(true);
  });

  it('counts down when running', () => {
    const { result } = renderHook(() =>
      useTimer({ duration: 10, autoStart: true })
    );

    act(() => {
      vi.advanceTimersByTime(1000); // Advance 1 second
    });

    expect(result.current.timeLeft).toBeLessThan(10);
    expect(result.current.timeLeft).toBeGreaterThan(8.5);
  });

  it('calls onComplete when timer reaches 0', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() =>
      useTimer({ duration: 1, autoStart: true, onComplete })
    );

    act(() => {
      vi.advanceTimersByTime(1100); // Advance past completion
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(result.current.isRunning).toBe(false);
  });

  it('stops at 0', () => {
    const { result } = renderHook(() =>
      useTimer({ duration: 1, autoStart: true })
    );

    act(() => {
      vi.advanceTimersByTime(2000); // Advance well past completion
    });

    expect(result.current.timeLeft).toBe(0);
  });

  it('can be started manually', () => {
    const { result } = renderHook(() => useTimer({ duration: 10 }));

    expect(result.current.isRunning).toBe(false);

    act(() => {
      result.current.start();
    });

    expect(result.current.isRunning).toBe(true);
  });

  it('can be paused', () => {
    const { result } = renderHook(() =>
      useTimer({ duration: 10, autoStart: true })
    );

    act(() => {
      result.current.pause();
    });

    expect(result.current.isRunning).toBe(false);
  });

  it('can be reset', () => {
    const { result } = renderHook(() =>
      useTimer({ duration: 10, autoStart: true })
    );

    act(() => {
      vi.advanceTimersByTime(3000); // Count down
    });

    expect(result.current.timeLeft).toBeLessThan(10);

    act(() => {
      result.current.reset();
    });

    expect(result.current.timeLeft).toBe(10);
    expect(result.current.isRunning).toBe(false);
  });

  it('calculates percentage correctly', () => {
    const { result } = renderHook(() =>
      useTimer({ duration: 10, autoStart: true })
    );

    expect(result.current.percentage).toBe(0);

    act(() => {
      vi.advanceTimersByTime(5000); // Half way
    });

    expect(result.current.percentage).toBeGreaterThan(40);
    expect(result.current.percentage).toBeLessThan(60);
  });
});

describe('Timer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders timer display', () => {
      render(<Timer duration={10} />);
      expect(screen.getByRole('timer')).toBeInTheDocument();
    });

    it('displays initial time', () => {
      render(<Timer duration={10} />);
      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('renders small size', () => {
      const { container } = render(<Timer duration={10} size="sm" />);
      const timer = container.querySelector('.w-16.h-16');
      expect(timer).toBeInTheDocument();
    });

    it('renders medium size by default', () => {
      const { container } = render(<Timer duration={10} />);
      const timer = container.querySelector('.w-24.h-24');
      expect(timer).toBeInTheDocument();
    });

    it('renders large size', () => {
      const { container } = render(<Timer duration={10} size="lg" />);
      const timer = container.querySelector('.w-32.h-32');
      expect(timer).toBeInTheDocument();
    });

    it('shows progress circle when showProgress is true', () => {
      const { container } = render(<Timer duration={10} showProgress />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('hides progress circle when showProgress is false', () => {
      const { container } = render(
        <Timer duration={10} showProgress={false} />
      );
      const svg = container.querySelector('svg');
      expect(svg).not.toBeInTheDocument();
    });
  });

  describe('Countdown Behavior', () => {
    it('counts down when autoStart is true', () => {
      render(<Timer duration={10} autoStart />);

      expect(screen.getByText('10')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.getByText('9')).toBeInTheDocument();
    });

    it('calls onComplete when timer finishes', () => {
      const onComplete = vi.fn();
      render(<Timer duration={1} autoStart onComplete={onComplete} />);

      act(() => {
        vi.advanceTimersByTime(1100);
      });

      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('displays 0 when timer completes', () => {
      render(<Timer duration={1} autoStart />);

      act(() => {
        vi.advanceTimersByTime(1100);
      });

      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has timer role', () => {
      render(<Timer duration={10} />);
      expect(screen.getByRole('timer')).toBeInTheDocument();
    });

    it('has aria-live attribute', () => {
      render(<Timer duration={10} />);
      const timer = screen.getByRole('timer');
      expect(timer).toHaveAttribute('aria-live', 'polite');
    });

    it('has aria-atomic attribute', () => {
      render(<Timer duration={10} />);
      const timer = screen.getByRole('timer');
      expect(timer).toHaveAttribute('aria-atomic', 'true');
    });
  });
});
