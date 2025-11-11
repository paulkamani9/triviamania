import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client singleton
 *
 * This client is used throughout the application to interact with Supabase
 * for database operations and real-time subscriptions.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // We don't need auth sessions for anonymous gameplay
  },
  realtime: {
    params: {
      eventsPerSecond: 10, // Limit events for better performance
    },
  },
});

/**
 * Type helper for Supabase database types
 * Will be replaced with generated types in Phase 1
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any; // TODO: Replace with generated types
