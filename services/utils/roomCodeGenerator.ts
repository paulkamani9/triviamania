import { supabase } from '@/lib/supabase';

/**
 * Characters allowed in room codes
 * Excludes ambiguous characters: 0, O, 1, I, L
 */
const ALLOWED_CHARS = '234567889ABCDEFGHJKMNPQRSTUVWXYZ';

/**
 * Length of room codes
 */
const CODE_LENGTH = 8;

/**
 * Maximum attempts to generate a unique room code
 */
const MAX_ATTEMPTS = 10;

/**
 * Generate a unique 8-character room code
 *
 * The code consists of uppercase letters and numbers, excluding
 * ambiguous characters (0, O, 1, I, L) to prevent confusion.
 *
 * @returns Promise resolving to a unique room code (e.g., "ABCD1234")
 * @throws Error if unable to generate a unique code after MAX_ATTEMPTS
 *
 * @example
 * const code = await generateRoomCode();
 * console.log(code); // "A2B3C4D5"
 */
export async function generateRoomCode(): Promise<string> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    // Generate random code
    let code = '';
    for (let i = 0; i < CODE_LENGTH; i++) {
      const randomIndex = Math.floor(Math.random() * ALLOWED_CHARS.length);
      code += ALLOWED_CHARS[randomIndex];
    }

    // Check if code already exists in database
    const { data, error } = await supabase
      .from('games')
      .select('code')
      .eq('code', code)
      .maybeSingle();

    if (error) {
      throw new Error(
        `Database error while checking room code: ${error.message}`
      );
    }

    // If code doesn't exist, we have a unique code
    if (!data) {
      return code;
    }

    // If code exists, loop will try again
  }

  throw new Error(
    `Failed to generate unique room code after ${MAX_ATTEMPTS} attempts`
  );
}

/**
 * Validate a room code format
 *
 * Checks if the provided string matches the expected room code format:
 * - Exactly 8 characters long
 * - Only contains allowed characters (uppercase letters and numbers, excluding 0, O, 1, I, L)
 *
 * Note: This only validates the format, not whether the room exists.
 *
 * @param code - The room code to validate
 * @returns true if the code format is valid, false otherwise
 *
 * @example
 * isValidRoomCode("ABCD1234"); // true
 * isValidRoomCode("abcd1234"); // false (lowercase)
 * isValidRoomCode("ABC123");   // false (too short)
 * isValidRoomCode("ABCD123O"); // false (contains 'O')
 */
export function isValidRoomCode(code: string): boolean {
  // Check length
  if (code.length !== CODE_LENGTH) {
    return false;
  }

  // Check if all characters are allowed
  for (const char of code) {
    if (!ALLOWED_CHARS.includes(char)) {
      return false;
    }
  }

  return true;
}

/**
 * Generate a room code synchronously (for testing purposes)
 *
 * Note: This does not check for uniqueness in the database.
 * Use `generateRoomCode()` in production code.
 *
 * @returns A random 8-character room code
 * @internal
 */
export function generateRoomCodeSync(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    const randomIndex = Math.floor(Math.random() * ALLOWED_CHARS.length);
    code += ALLOWED_CHARS[randomIndex];
  }
  return code;
}
