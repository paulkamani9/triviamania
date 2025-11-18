/**
 * Shared motion variants for consistent animations across the app
 * These variants follow the 12 principles of animation with proper timing and easing
 */

import { Variants } from 'framer-motion';

/**
 * Fade in/out animation
 * Use for: Modal overlays, tooltips, notifications
 */
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

/**
 * Slide up from bottom with fade
 * Use for: Cards, question containers, modals
 */
export const slideUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

/**
 * Slide down from top with fade
 * Use for: Notifications, alerts
 */
export const slideDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

/**
 * Scale in/out with fade
 * Use for: Buttons, interactive elements
 */
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

/**
 * Bounce in with spring physics
 * Use for: Success states, achievements, confetti
 */
export const bounceIn: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 20,
    },
  },
};

/**
 * Stagger children animation
 * Use for: Lists of items (player cards, answer options)
 */
export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

/**
 * Item variant for staggered lists
 */
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};
