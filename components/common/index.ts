/**
 * Common Components Export
 *
 * Central export file for all shared UI components.
 * Import components from this file for consistency.
 *
 * @example
 * ```tsx
 * import { Button, Input, Card } from '@/components/common';
 * ```
 */

// Core UI Components
export { Button } from './Button';
export type { ButtonProps } from './Button';

export { Input } from './Input';
export type { InputProps } from './Input';

export { Card, CardHeader, CardTitle, CardContent } from './Card';

export { LoadingSpinner } from './LoadingSpinner';

// Game-specific Components
export { Timer, useTimer } from './Timer';
export type { UseTimerOptions, UseTimerReturn } from './Timer/useTimer';

export { RoomCodeDisplay } from './RoomCodeDisplay';

export { PlayerCard } from './PlayerCard';
