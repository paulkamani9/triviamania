'use client';

import { Input } from '@/components/common';
import type { NameFormProps } from './types';

/**
 * NameForm Component
 *
 * Input form for player name with validation display.
 * Uses the shared Input component from Phase 3.
 *
 * @example
 * ```tsx
 * <NameForm
 *   value={playerName}
 *   onChange={setPlayerName}
 *   error={nameError}
 *   disabled={isLoading}
 * />
 * ```
 */
export function NameForm({
  value,
  onChange,
  error,
  disabled = false,
}: NameFormProps) {
  return (
    <Input
      id="player-name"
      label="Your Name"
      placeholder="Enter your name"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      error={error}
      disabled={disabled}
      required
      autoFocus
      autoComplete="off"
      maxLength={20}
    />
  );
}
