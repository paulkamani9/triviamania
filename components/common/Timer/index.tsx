/**
 * Timer Component
 *
 * A visual countdown timer with circular progress indicator.
 * Displays remaining time and progress ring.
 *
 * @example
 * ```tsx
 * <Timer
 *   duration={10}
 *   onComplete={() => submitAnswer()}
 *   autoStart
 *   size="md"
 * />
 * ```
 */

import { motion } from 'framer-motion';
import { useTimer, UseTimerOptions } from './useTimer';

interface TimerProps extends UseTimerOptions {
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
}

export function Timer({
  duration,
  onComplete,
  autoStart,
  size = 'md',
  showProgress = true,
}: TimerProps) {
  const { timeLeft, percentage } = useTimer({
    duration,
    onComplete,
    autoStart,
  });

  const sizeClasses = {
    sm: 'w-16 h-16 text-sm',
    md: 'w-24 h-24 text-2xl',
    lg: 'w-32 h-32 text-4xl',
  };

  const strokeWidth = size === 'sm' ? 3 : size === 'md' ? 4 : 5;
  const radius = size === 'sm' ? 28 : size === 'md' ? 42 : 58;
  const circumference = 2 * Math.PI * radius;

  // Color changes based on time remaining
  const getColor = () => {
    if (timeLeft > duration * 0.5) return 'text-green-600';
    if (timeLeft > duration * 0.25) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`relative ${sizeClasses[size]}`}>
      {showProgress && (
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-gray-200"
          />
          {/* Progress circle */}
          <motion.circle
            cx="60"
            cy="60"
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className={getColor()}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (percentage / 100)}
            strokeLinecap="round"
            transition={{ duration: 0.1 }}
          />
        </svg>
      )}
      <div
        className="absolute inset-0 flex items-center justify-center font-bold"
        role="timer"
        aria-live="polite"
        aria-atomic="true"
      >
        {Math.ceil(timeLeft)}
      </div>
    </div>
  );
}

export { useTimer } from './useTimer';
