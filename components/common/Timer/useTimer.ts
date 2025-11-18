/**
 * useTimer Hook
 *
 * A custom hook for managing countdown timers.
 * Provides start, pause, and reset controls.
 *
 * @example
 * ```tsx
 * const { timeLeft, isRunning, start, pause, reset } = useTimer({
 *   duration: 10,
 *   onComplete: () => console.log('Time up!'),
 *   autoStart: true,
 * });
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseTimerOptions {
  duration: number; // seconds
  onComplete?: () => void;
  autoStart?: boolean;
}

export interface UseTimerReturn {
  timeLeft: number;
  isRunning: boolean;
  percentage: number;
  start: () => void;
  pause: () => void;
  reset: () => void;
}

export function useTimer({
  duration,
  onComplete,
  autoStart = false,
}: UseTimerOptions): UseTimerReturn {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(autoStart);
  const onCompleteRef = useRef(onComplete);

  // Keep onComplete ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 0.1;
        if (newTime <= 0) {
          setIsRunning(false);
          onCompleteRef.current?.();
          return 0;
        }
        return newTime;
      });
    }, 100); // Update every 100ms for smooth countdown

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(() => {
    setTimeLeft(duration);
    setIsRunning(false);
  }, [duration]);

  const percentage = ((duration - timeLeft) / duration) * 100;

  return { timeLeft, isRunning, percentage, start, pause, reset };
}
