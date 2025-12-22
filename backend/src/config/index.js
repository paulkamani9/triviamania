import "dotenv/config";

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",

  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },

  redis: {
    // Prefer Upstash, fall back to local dev instance
    url:
      process.env.UPSTASH_REDIS_URL ||
      "redis://127.0.0.1:6379",
  },

  openTrivia: {
    baseUrl: process.env.OPEN_TRIVIA_API_BASE || "https://opentdb.com/api.php",
  },
};

// Game constants
export const GAME_CONFIG = {
  QUESTION_TIME_LIMIT: 25,
  QUESTION_RESULTS_PAUSE: 3,
  QUESTIONS_PER_GAME: 20,
  MAX_PLAYERS: 8,
  AUTO_ADVANCE_ON_ALL_ANSWERED: true,
  TIMER_WARNING: 5,
  TIMER_CRITICAL: 3,
  RECONNECT_GRACE: 60,
  ROOM_TTL: 21600, // 6 hours in seconds
  SOCKET_TTL: 7200, // 2 hours in seconds
  EMPTY_ROOM_CLEANUP: 300, // 5 minutes in seconds
  API_RATE_LIMIT_MS: 5000, // 5 seconds between API calls
};

// OpenTriviaDB categories
export const CATEGORIES = [
  { id: null, name: "Any Category" },
  { id: 9, name: "General Knowledge" },
  { id: 10, name: "Entertainment: Books" },
  { id: 11, name: "Entertainment: Film" },
  { id: 12, name: "Entertainment: Music" },
  { id: 13, name: "Entertainment: Musicals & Theatres" },
  { id: 14, name: "Entertainment: Television" },
  { id: 15, name: "Entertainment: Video Games" },
  { id: 16, name: "Entertainment: Board Games" },
  { id: 17, name: "Science & Nature" },
  { id: 18, name: "Science: Computers" },
  { id: 19, name: "Science: Mathematics" },
  { id: 20, name: "Mythology" },
  { id: 21, name: "Sports" },
  { id: 22, name: "Geography" },
  { id: 23, name: "History" },
  { id: 24, name: "Politics" },
  { id: 25, name: "Art" },
  { id: 26, name: "Celebrities" },
  { id: 27, name: "Animals" },
  { id: 28, name: "Vehicles" },
  { id: 29, name: "Entertainment: Comics" },
  { id: 30, name: "Science: Gadgets" },
  { id: 31, name: "Entertainment: Japanese Anime & Manga" },
  { id: 32, name: "Entertainment: Cartoon & Animations" },
];
