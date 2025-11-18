/**
 * Reusable transition configurations
 * All durations are in seconds and follow the < 500ms guideline for micro-interactions
 */

import { Transition } from 'framer-motion';

/**
 * Quick transition for micro-interactions
 * Duration: 150ms
 */
export const quick: Transition = {
  duration: 0.15,
  ease: 'easeOut',
};

/**
 * Standard transition for most UI elements
 * Duration: 200ms
 */
export const standard: Transition = {
  duration: 0.2,
  ease: 'easeOut',
};

/**
 * Smooth transition for larger movements
 * Duration: 300ms
 */
export const smooth: Transition = {
  duration: 0.3,
  ease: 'easeInOut',
};

/**
 * Spring transition for natural, physics-based motion
 */
export const spring: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
};

/**
 * Gentle spring for subtle movements
 */
export const gentleSpring: Transition = {
  type: 'spring',
  stiffness: 200,
  damping: 25,
};

/**
 * Bouncy spring for playful interactions
 */
export const bouncySpring: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 20,
};

/**
 * Ease-out curve - best for entrances
 */
export const easeOut = [0.0, 0.0, 0.2, 1.0];

/**
 * Ease-in curve - best for exits
 */
export const easeIn = [0.4, 0.0, 1.0, 1.0];

/**
 * Ease-in-out curve - best for through movements
 */
export const easeInOut = [0.4, 0.0, 0.2, 1.0];
