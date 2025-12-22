import he from "he";
import { config, GAME_CONFIG } from "../config/index.js";

let lastFetchTime = 0;

/**
 * Fetch questions from OpenTriviaDB
 * @param {Object} options
 * @param {number} options.amount - Number of questions (1-50)
 * @param {number|null} options.category - Category ID or null for any
 * @param {string|null} options.difficulty - 'easy', 'medium', 'hard', or null
 * @returns {Promise<Array>} Decoded and shuffled questions
 */
export async function fetchQuestions({
  amount = GAME_CONFIG.QUESTIONS_PER_GAME,
  category = null,
  difficulty = null,
} = {}) {
  // Rate limiting: wait if needed
  const now = Date.now();
  const timeSinceLastFetch = now - lastFetchTime;
  if (timeSinceLastFetch < GAME_CONFIG.API_RATE_LIMIT_MS) {
    await sleep(GAME_CONFIG.API_RATE_LIMIT_MS - timeSinceLastFetch);
  }

  const url = buildApiUrl({ amount, category, difficulty });
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      lastFetchTime = Date.now();
      const response = await fetch(url);
      const data = await response.json();

      if (data.response_code === 0 && data.results?.length > 0) {
        return data.results.map(decodeAndShuffleQuestion);
      }

      // Handle API response codes
      if (data.response_code === 1) {
        console.warn(
          "OpenTriviaDB: No results for query, trying with fewer constraints"
        );
        // Retry without category/difficulty
        if (category || difficulty) {
          return fetchQuestions({ amount, category: null, difficulty: null });
        }
        throw new Error("No trivia questions available");
      }

      if (data.response_code === 2) {
        throw new Error("Invalid OpenTriviaDB parameters");
      }

      // Rate limited or other error - wait and retry
      await sleep(GAME_CONFIG.API_RATE_LIMIT_MS);
    } catch (error) {
      console.error(
        `OpenTriviaDB fetch attempt ${attempts} failed:`,
        error.message
      );
      if (attempts >= maxAttempts) {
        throw new Error("Failed to fetch trivia questions after retries");
      }
      await sleep(GAME_CONFIG.API_RATE_LIMIT_MS);
    }
  }

  throw new Error("Failed to fetch trivia questions");
}

/**
 * Build API URL with query parameters
 */
function buildApiUrl({ amount, category, difficulty }) {
  const params = new URLSearchParams({ amount: String(amount) });

  if (category) {
    params.set("category", String(category));
  }
  if (difficulty) {
    params.set("difficulty", difficulty);
  }

  return `${config.openTrivia.baseUrl}?${params.toString()}`;
}

/**
 * Decode HTML entities and shuffle answers
 * @param {Object} rawQuestion - Raw question from API
 * @returns {Object} Processed question
 */
function decodeAndShuffleQuestion(rawQuestion) {
  const question = he.decode(rawQuestion.question);
  const correctAnswer = he.decode(rawQuestion.correct_answer);
  const incorrectAnswers = rawQuestion.incorrect_answers.map((a) =>
    he.decode(a)
  );

  // Combine and shuffle answers
  const allAnswers = [correctAnswer, ...incorrectAnswers];
  const shuffledAnswers = shuffleArray(allAnswers);

  return {
    question,
    type: rawQuestion.type, // 'multiple' or 'boolean'
    difficulty: rawQuestion.difficulty,
    category: he.decode(rawQuestion.category),
    correctAnswer,
    choices: shuffledAnswers,
    // Store correct answer index for server-side validation
    correctIndex: shuffledAnswers.indexOf(correctAnswer),
  };
}

/**
 * Fisher-Yates shuffle
 */
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default { fetchQuestions };
