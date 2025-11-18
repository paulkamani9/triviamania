/**
 * Button Component
 *
 * A versatile button component with multiple variants and sizes.
 * Supports loading states, animations, and accessibility features.
 * Respects user's motion preferences via prefers-reduced-motion.
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Click me
 * </Button>
 *
 * <Button variant="secondary" isLoading>
 *   Loading...
 * </Button>
 * ```
 */

import { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { useReducedMotion } from '@/components/motion/useReducedMotion';
import { buttonVariants, ButtonVariants } from './variants';
import { LoadingSpinner } from '../LoadingSpinner';

export interface ButtonProps
  extends Omit<HTMLMotionProps<'button'>, 'children'>,
    ButtonVariants {
  children: React.ReactNode;
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant, size, isLoading, children, className, disabled, ...props },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();

    return (
      <motion.button
        ref={ref}
        className={buttonVariants({ variant, size, className })}
        whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
        whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
        transition={{ duration: 0.1 }}
        disabled={isLoading || disabled}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <LoadingSpinner size="sm" />
            <span>Loading...</span>
          </span>
        ) : (
          children
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
