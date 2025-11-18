/**
 * Result Type Pattern
 *
 * A discriminated union type for handling operations that can succeed or fail.
 * This provides type-safe error handling without throwing exceptions.
 */

/**
 * Success result containing data
 */
export interface Success<T> {
  success: true;
  data: T;
}

/**
 * Failure result containing error
 */
export interface Failure<E = Error> {
  success: false;
  error: E;
}

/**
 * Result type - either Success or Failure
 *
 * @example
 * async function fetchUser(id: string): Promise<Result<User>> {
 *   try {
 *     const user = await db.users.findById(id);
 *     if (!user) {
 *       return { success: false, error: new Error('User not found') };
 *     }
 *     return { success: true, data: user };
 *   } catch (error) {
 *     return { success: false, error: error as Error };
 *   }
 * }
 *
 * // Usage
 * const result = await fetchUser('123');
 * if (result.success) {
 *   console.log(result.data.name);
 * } else {
 *   console.error(result.error.message);
 * }
 */
export type Result<T, E = Error> = Success<T> | Failure<E>;

/**
 * Helper function to create a success result
 *
 * @param data - The success data
 * @returns Success result
 */
export function ok<T>(data: T): Success<T> {
  return { success: true, data };
}

/**
 * Helper function to create a failure result
 *
 * @param error - The error (string or Error object)
 * @returns Failure result with Error object
 */
export function err(error: Error | string): Failure<Error> {
  const errorObj = typeof error === 'string' ? new Error(error) : error;
  return { success: false, error: errorObj };
}
