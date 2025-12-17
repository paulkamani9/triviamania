/**
 * Landing Feature Utilities
 *
 * Validation and helper functions for the landing flow.
 */

import { NAME_VALIDATION, type NameValidationResult } from './types';

/**
 * Validate player name against rules
 *
 * Rules:
 * - 2-20 characters
 * - Alphanumeric + spaces only
 * - Not just whitespace
 *
 * @param name - Name to validate
 * @returns Validation result with error message if invalid
 *
 * @example
 * ```ts
 * const result = validatePlayerName('Alice');
 * if (!result.valid) {
 *   console.error(result.error);
 * }
 * ```
 */
export function validatePlayerName(name: string): NameValidationResult {
  const trimmedName = name.trim();

  if (trimmedName.length === 0) {
    return {
      valid: false,
      error: 'Name is required',
    };
  }

  if (trimmedName.length < NAME_VALIDATION.MIN_LENGTH) {
    return {
      valid: false,
      error: `Name must be at least ${NAME_VALIDATION.MIN_LENGTH} characters`,
    };
  }

  if (trimmedName.length > NAME_VALIDATION.MAX_LENGTH) {
    return {
      valid: false,
      error: `Name must be ${NAME_VALIDATION.MAX_LENGTH} characters or less`,
    };
  }

  if (!NAME_VALIDATION.PATTERN.test(trimmedName)) {
    return {
      valid: false,
      error: 'Name can only contain letters, numbers, and spaces',
    };
  }

  return { valid: true };
}

/**
 * Session storage key for player data
 */
const PLAYER_SESSION_KEY = 'triviamania_player_session';

/**
 * Save player session to browser storage
 *
 * @param name - Player name to save
 */
export function savePlayerSession(name: string): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.setItem(
      PLAYER_SESSION_KEY,
      JSON.stringify({
        name: name.trim(),
        timestamp: Date.now(),
      })
    );
  } catch (error) {
    console.warn('Failed to save player session:', error);
  }
}

/**
 * Load player session from browser storage
 *
 * @returns Saved player name or null
 */
export function loadPlayerSession(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const data = sessionStorage.getItem(PLAYER_SESSION_KEY);
    if (!data) return null;

    const session = JSON.parse(data);

    // Session expires after 1 hour
    const ONE_HOUR = 60 * 60 * 1000;
    if (Date.now() - session.timestamp > ONE_HOUR) {
      sessionStorage.removeItem(PLAYER_SESSION_KEY);
      return null;
    }

    return session.name || null;
  } catch (error) {
    console.warn('Failed to load player session:', error);
    return null;
  }
}

/**
 * Clear player session from storage
 */
export function clearPlayerSession(): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.removeItem(PLAYER_SESSION_KEY);
  } catch (error) {
    console.warn('Failed to clear player session:', error);
  }
}
