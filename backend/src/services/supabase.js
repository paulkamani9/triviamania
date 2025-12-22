import { createClient } from "@supabase/supabase-js";
import { config } from "../config/index.js";

let supabase = null;
let supabaseAdmin = null;

/**
 * Initialize Supabase clients
 */
export function initSupabase() {
  if (!config.supabase.url || !config.supabase.anonKey) {
    console.warn("⚠️ Supabase not configured. Leaderboard features disabled.");
    return null;
  }

  // Public client (for general queries)
  supabase = createClient(config.supabase.url, config.supabase.anonKey);

  // Admin client (for server-side operations with service role)
  if (config.supabase.serviceRoleKey) {
    supabaseAdmin = createClient(
      config.supabase.url,
      config.supabase.serviceRoleKey,
      {
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );
  }

  console.log("✅ Supabase initialized");
  return supabase;
}

/**
 * Get Supabase public client
 */
export function getSupabase() {
  return supabase;
}

/**
 * Get Supabase admin client
 */
export function getSupabaseAdmin() {
  return supabaseAdmin;
}

// ─────────────────────────────────────────────────────────────────────────────
// User Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get user by ID
 */
export async function getUserById(userId) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching user:", error.message);
    return null;
  }
  return data;
}

/**
 * Create or update user
 */
export async function upsertUser({ id, googleId, email, username }) {
  if (!supabaseAdmin) return null;

  const { data, error } = await supabaseAdmin
    .from("users")
    .upsert(
      {
        id,
        google_id: googleId,
        email,
        username,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
    .select()
    .single();

  if (error) {
    console.error("Error upserting user:", error.message);
    return null;
  }
  return data;
}

/**
 * Add points to user
 */
export async function addUserPoints(userId, points) {
  if (!supabaseAdmin || !userId) return null;

  const { data, error } = await supabaseAdmin.rpc("increment_user_points", {
    user_id: userId,
    points_to_add: points,
  });

  if (error) {
    // Fallback: fetch and update manually if RPC doesn't exist
    const user = await getUserById(userId);
    if (user) {
      const { data: updated, error: updateError } = await supabaseAdmin
        .from("users")
        .update({
          total_points: (user.total_points || 0) + points,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single();

      if (updateError) {
        console.error("Error adding points:", updateError.message);
        return null;
      }
      return updated;
    }
    return null;
  }
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Leaderboard Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get top N players by total points
 */
export async function getLeaderboard(limit = 100) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("users")
    .select("id, username, total_points")
    .order("total_points", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching leaderboard:", error.message);
    return [];
  }
  return data || [];
}

/**
 * Get user's rank
 */
export async function getUserRank(userId) {
  if (!supabase || !userId) return null;

  const user = await getUserById(userId);
  if (!user) return null;

  const { count, error } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .gt("total_points", user.total_points || 0);

  if (error) {
    console.error("Error fetching rank:", error.message);
    return null;
  }

  return (count || 0) + 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// Game History (optional)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Record game history
 */
export async function recordGameHistory({
  userId,
  gameType,
  category,
  difficulty,
  score,
  totalQuestions,
}) {
  if (!supabaseAdmin || !userId) return null;

  const { data, error } = await supabaseAdmin
    .from("game_history")
    .insert({
      user_id: userId,
      game_type: gameType,
      category,
      difficulty,
      score,
      total_questions: totalQuestions,
    })
    .select()
    .single();

  if (error) {
    console.error("Error recording game history:", error.message);
    return null;
  }
  return data;
}

export default {
  initSupabase,
  getSupabase,
  getSupabaseAdmin,
  getUserById,
  upsertUser,
  addUserPoints,
  getLeaderboard,
  getUserRank,
  recordGameHistory,
};
