/**
 * RoomCodeInput Component
 *
 * Specialized input field for room codes with auto-uppercase,
 * format validation, and character limit.
 */

'use client';

import { Input } from '@/components/common/Input';
import type { RoomCodeInputProps } from './types';

/**
 * Maximum length for room codes
 */
const ROOM_CODE_LENGTH = 8;

/**
 * Regex pattern for valid room codes (alphanumeric only)
 */
const ROOM_CODE_PATTERN = /^[A-Z0-9]*$/;

/**
 * Format a room code by uppercasing and validating characters
 */
export function formatRoomCode(code: string): string {
  const uppercase = code.toUpperCase();
  const alphanumeric = uppercase.replace(/[^A-Z0-9]/g, '');
  return alphanumeric.slice(0, ROOM_CODE_LENGTH);
}

/**
 * Validate room code format
 */
export function isValidRoomCodeFormat(code: string): boolean {
  return code.length === ROOM_CODE_LENGTH && ROOM_CODE_PATTERN.test(code);
}

/**
 * RoomCodeInput - Input field optimized for room code entry
 */
export function RoomCodeInput({
  value,
  onChange,
  disabled = false,
  error = null,
  placeholder = 'Enter room code',
  autoFocus = false,
}: RoomCodeInputProps) {
  /**
   * Handle input change with formatting
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRoomCode(e.target.value);
    onChange(formatted);
  };

  /**
   * Handle paste events
   */
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const formatted = formatRoomCode(pastedText);
    onChange(formatted);
  };

  return (
    <div className="space-y-2">
      <label
        htmlFor="room-code"
        className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        Room Code
      </label>
      <Input
        id="room-code"
        type="text"
        value={value}
        onChange={handleChange}
        onPaste={handlePaste}
        disabled={disabled}
        placeholder={placeholder}
        autoFocus={autoFocus}
        maxLength={ROOM_CODE_LENGTH}
        className="text-center text-2xl font-mono tracking-widest uppercase"
        aria-label="Room code"
        aria-invalid={!!error}
        aria-describedby={error ? 'room-code-error' : undefined}
      />
      {error && (
        <p
          id="room-code-error"
          className="text-sm text-red-600 dark:text-red-400"
          role="alert"
        >
          {error}
        </p>
      )}
      <p className="text-xs text-zinc-500 dark:text-zinc-500 text-center">
        {value.length}/{ROOM_CODE_LENGTH} characters
      </p>
    </div>
  );
}
