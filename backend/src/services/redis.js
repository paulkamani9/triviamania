import Redis from "ioredis";
import { config, GAME_CONFIG } from "../config/index.js";

let redis = null;

// Room cleanup timers (in-memory for this instance)
const roomCleanupTimers = new Map();

/**
 * Initialize Redis connection
 */
export function initRedis() {
  if (redis) return redis;

  if (!config.redis.url) {
    throw new Error(
      "Redis URL missing. Set UPSTASH_REDIS_URL or REDIS_URL (e.g., redis://127.0.0.1:6379)."
    );
  }

  const displayUrl = config.redis.url.replace(/:[^@]+@/, ":****@");
  console.log(`🔌 Connecting to Redis at ${displayUrl}`);

  redis = new Redis(config.redis.url, {
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    lazyConnect: true,
  });

  redis.on("connect", () => {
    console.log("✅ Redis connected");
  });

  redis.on("error", (err) => {
    console.error("❌ Redis error:", err.message);
  });

  return redis;
}

/**
 * Get Redis client instance
 */
export function getRedis() {
  if (!redis) {
    throw new Error("Redis not initialized. Call initRedis() first.");
  }
  return redis;
}

// ─────────────────────────────────────────────────────────────────────────────
// Socket Mapping Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Map socket to user and vice versa
 */
export async function mapSocketToUser(socketId, userId) {
  const r = getRedis();
  const pipeline = r.pipeline();
  pipeline.set(`socket:${socketId}`, userId, "EX", GAME_CONFIG.SOCKET_TTL);
  pipeline.set(`user:${userId}:socket`, socketId, "EX", GAME_CONFIG.SOCKET_TTL);
  await pipeline.exec();
}

/**
 * Get userId from socketId
 */
export async function getUserIdFromSocket(socketId) {
  return getRedis().get(`socket:${socketId}`);
}

/**
 * Get socketId from userId
 */
export async function getSocketIdFromUser(userId) {
  return getRedis().get(`user:${userId}:socket`);
}

/**
 * Remove socket mappings
 */
export async function removeSocketMappings(socketId, userId) {
  const r = getRedis();
  const pipeline = r.pipeline();
  pipeline.del(`socket:${socketId}`);
  if (userId) {
    pipeline.del(`user:${userId}:socket`);
  }
  await pipeline.exec();
}

// ─────────────────────────────────────────────────────────────────────────────
// Room Helpers
// ─────────────────────────────────────────────────────────────────────────────

const ROOM_PREFIX = "room:";

/**
 * Get room key
 */
export function roomKey(roomCode) {
  return `${ROOM_PREFIX}${roomCode}`;
}

/**
 * Get room data
 */
export async function getRoom(roomCode) {
  const data = await getRedis().hgetall(roomKey(roomCode));
  if (!data || Object.keys(data).length === 0) return null;

  // Parse JSON fields
  return {
    ...data,
    players: JSON.parse(data.players || "[]"),
    questions: JSON.parse(data.questions || "[]"),
    answers: JSON.parse(data.answers || "{}"),
    scores: JSON.parse(data.scores || "{}"),
    currentQuestion: parseInt(data.currentQuestion || "0", 10),
  };
}

/**
 * Save room data (full replace)
 */
export async function saveRoom(roomCode, roomData) {
  const r = getRedis();
  const key = roomKey(roomCode);

  const serialized = {
    ...roomData,
    players: JSON.stringify(roomData.players),
    questions: JSON.stringify(roomData.questions),
    answers: JSON.stringify(roomData.answers),
    scores: JSON.stringify(roomData.scores),
    currentQuestion: String(roomData.currentQuestion),
  };

  await r.hset(key, serialized);
  await r.expire(key, GAME_CONFIG.ROOM_TTL);
}

/**
 * Update specific room fields
 */
export async function updateRoom(roomCode, fields) {
  const r = getRedis();
  const key = roomKey(roomCode);

  const serialized = {};
  for (const [k, v] of Object.entries(fields)) {
    if (["players", "questions", "answers", "scores"].includes(k)) {
      serialized[k] = JSON.stringify(v);
    } else if (k === "currentQuestion") {
      serialized[k] = String(v);
    } else {
      serialized[k] = v;
    }
  }

  await r.hset(key, serialized);
  await r.expire(key, GAME_CONFIG.ROOM_TTL);
}

/**
 * Delete room
 */
export async function deleteRoom(roomCode) {
  cancelRoomCleanup(roomCode);
  await getRedis().del(roomKey(roomCode));
}

/**
 * Schedule room cleanup after grace period
 * Called when all players disconnect
 */
export function scheduleRoomCleanup(
  roomCode,
  delaySeconds = GAME_CONFIG.EMPTY_ROOM_CLEANUP
) {
  // Cancel any existing timer
  cancelRoomCleanup(roomCode);

  const timerId = setTimeout(async () => {
    const room = await getRoom(roomCode);
    if (room) {
      const connectedPlayers = room.players?.filter((p) => p.connected) || [];
      if (connectedPlayers.length === 0) {
        console.log(`🧹 Cleaning up empty room: ${roomCode}`);
        await deleteRoom(roomCode);
      }
    }
    roomCleanupTimers.delete(roomCode);
  }, delaySeconds * 1000);

  roomCleanupTimers.set(roomCode, timerId);
  console.log(`⏰ Scheduled cleanup for room ${roomCode} in ${delaySeconds}s`);
}

/**
 * Cancel scheduled room cleanup (e.g., when player rejoins)
 */
export function cancelRoomCleanup(roomCode) {
  const timerId = roomCleanupTimers.get(roomCode);
  if (timerId) {
    clearTimeout(timerId);
    roomCleanupTimers.delete(roomCode);
    console.log(`❌ Cancelled cleanup for room ${roomCode}`);
  }
}

/**
 * Check if room exists
 */
export async function roomExists(roomCode) {
  return (await getRedis().exists(roomKey(roomCode))) === 1;
}

export default {
  initRedis,
  getRedis,
  mapSocketToUser,
  getUserIdFromSocket,
  getSocketIdFromUser,
  removeSocketMappings,
  roomKey,
  getRoom,
  saveRoom,
  updateRoom,
  deleteRoom,
  roomExists,
  scheduleRoomCleanup,
  cancelRoomCleanup,
};
