const ADJECTIVES = [
  "Confused",
  "Sleepy",
  "Happy",
  "Grumpy",
  "Silly",
  "Brave",
  "Clever",
  "Curious",
  "Daring",
  "Eager",
  "Fancy",
  "Gentle",
  "Hasty",
  "Jolly",
  "Kind",
  "Lively",
  "Merry",
  "Noble",
  "Peppy",
  "Quick",
  "Rapid",
  "Swift",
  "Tender",
  "Upbeat",
  "Vivid",
  "Witty",
  "Zesty",
  "Bouncy",
  "Calm",
  "Dizzy",
  "Fluffy",
  "Giddy",
  "Humble",
  "Icy",
  "Jazzy",
  "Keen",
  "Lucky",
  "Mighty",
  "Neat",
  "Odd",
  "Perky",
  "Quirky",
  "Rosy",
  "Snappy",
  "Tricky",
  "Unique",
  "Vibrant",
  "Wacky",
  "Youthful",
  "Zippy",
];

const PLANTS = [
  "Lily",
  "Rose",
  "Daisy",
  "Tulip",
  "Orchid",
  "Maple",
  "Oak",
  "Pine",
  "Fern",
  "Ivy",
  "Cactus",
  "Bamboo",
  "Cedar",
  "Elm",
  "Fig",
  "Ginger",
  "Holly",
  "Iris",
  "Jasmine",
  "Kale",
  "Lavender",
  "Mint",
  "Nettle",
  "Olive",
  "Palm",
  "Quince",
  "Reed",
  "Sage",
  "Thyme",
  "Umber",
  "Violet",
  "Willow",
  "Yarrow",
  "Zinnia",
  "Acacia",
  "Basil",
  "Clover",
  "Dill",
  "Eucalyptus",
  "Foxglove",
  "Gardenia",
  "Hibiscus",
  "Juniper",
  "Kumquat",
  "Lotus",
  "Magnolia",
  "Nutmeg",
  "Orchid",
  "Peony",
  "Rosemary",
];

/**
 * Generate a random anonymous username
 * Format: [Adjective] [Plant] [Number]
 * Example: "Confused Lily 473"
 */
export function generateUsername() {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const plant = PLANTS[Math.floor(Math.random() * PLANTS.length)];
  const number = Math.floor(Math.random() * 1000) + 1;
  return `${adjective} ${plant} ${number}`;
}

/**
 * Validate username (basic sanitization)
 */
export function validateUsername(username) {
  if (!username || typeof username !== "string") {
    return { valid: false, error: "Username is required" };
  }

  // Sanitize first: remove HTML tags
  const sanitized = username.trim().replace(/<[^>]*>/g, "");

  if (sanitized.length < 2) {
    return { valid: false, error: "Username must be at least 2 characters" };
  }

  if (sanitized.length > 30) {
    return { valid: false, error: "Username must be 30 characters or less" };
  }

  return { valid: true, username: sanitized };
}

/**
 * Validate room code format
 */
export function validateRoomCode(roomCode) {
  if (!roomCode || typeof roomCode !== "string") {
    return false;
  }
  // 6 uppercase alphanumeric characters
  return /^[A-Z0-9]{6}$/.test(roomCode.toUpperCase());
}

/**
 * Validate category ID
 */
export function validateCategory(categoryId) {
  if (categoryId === null || categoryId === undefined) {
    return true; // Any category
  }
  const id = parseInt(categoryId, 10);
  return !isNaN(id) && id >= 9 && id <= 32;
}

/**
 * Validate difficulty
 */
export function validateDifficulty(difficulty) {
  if (!difficulty) return true; // Any difficulty
  return ["easy", "medium", "hard"].includes(difficulty.toLowerCase());
}

export default {
  generateUsername,
  validateUsername,
  validateRoomCode,
  validateCategory,
  validateDifficulty,
};
