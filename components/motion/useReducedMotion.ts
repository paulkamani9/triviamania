/**
 * Hook to detect user's motion preferences
 * Respects `prefers-reduced-motion` media query for accessibility
 */

import { useSyncExternalStore } from 'react';

/**
 * Returns true if user prefers reduced motion
 * When true, animations should be disabled or simplified
 *
 * @example
 * ```tsx
 * const prefersReducedMotion = useReducedMotion();
 *
 * <motion.div
 *   animate={prefersReducedMotion ? {} : { scale: 1.2 }}
 * />
 * ```
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (callback) => {
      // Check if running in browser environment
      if (typeof window === 'undefined') return () => {};

      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

      // Subscribe to media query changes
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', callback);
        return () => mediaQuery.removeEventListener('change', callback);
      } else {
        // Legacy browsers
        mediaQuery.addListener(callback);
        return () => mediaQuery.removeListener(callback);
      }
    },
    () => {
      // Client-side snapshot
      if (typeof window === 'undefined') return false;
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },
    () => false // Server-side snapshot
  );
}
