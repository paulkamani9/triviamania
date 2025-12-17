/**
 * LoadingSpinner Component
 *
 * A simple loading spinner with multiple sizes.
 * Respects user's motion preferences - shows static spinner if reduced motion is preferred.
 *
 * @example
 * ```tsx
 * <LoadingSpinner size="md" />
 * <LoadingSpinner size="sm" className="text-blue-600" />
 * ```
 */

'use client';

import { motion } from 'framer-motion';
import { useReducedMotion } from '@/components/motion/useReducedMotion';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({
  size = 'md',
  className = '',
}: LoadingSpinnerProps) {
  const prefersReducedMotion = useReducedMotion();

  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  const spinnerClasses = `${sizeClasses[size]} rounded-full border-gray-300 border-t-blue-600 ${className}`;

  if (prefersReducedMotion) {
    // Static spinner for reduced motion preference
    return (
      <div className={spinnerClasses} role="status" aria-label="Loading">
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  return (
    <motion.div
      className={spinnerClasses}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      }}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </motion.div>
  );
}
