/**
 * Trivia Service Tests
 * Tests for question fetching, HTML decoding, and answer shuffling
 */

import { jest } from "@jest/globals";

// Mock fetch
global.fetch = jest.fn();

// Mock config
jest.unstable_mockModule("../src/config/index.js", () => ({
  config: {
    openTrivia: {
      baseUrl: "https://opentdb.com/api.php",
    },
  },
  GAME_CONFIG: {
    QUESTIONS_PER_GAME: 20,
    API_RATE_LIMIT_MS: 100, // Shorter for tests
  },
}));

const { fetchQuestions } = await import("../src/services/trivia.js");

describe("Trivia Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("fetches and decodes questions", async () => {
    global.fetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          response_code: 0,
          results: [
            {
              question: "What&#039;s the capital of France?",
              correct_answer: "Paris",
              incorrect_answers: ["London", "Berlin", "Madrid"],
              type: "multiple",
              difficulty: "easy",
              category: "Geography",
            },
          ],
        }),
    });

    const questions = await fetchQuestions({ amount: 1 });

    expect(questions).toHaveLength(1);
    expect(questions[0].question).toBe("What's the capital of France?"); // Decoded
    expect(questions[0].correctAnswer).toBe("Paris");
    expect(questions[0].choices).toContain("Paris");
    expect(questions[0].choices).toContain("London");
  });

  test("decodes HTML entities in all fields", async () => {
    global.fetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          response_code: 0,
          results: [
            {
              question: "Who said &quot;I think, therefore I am&quot;?",
              correct_answer: "Ren&eacute; Descartes",
              incorrect_answers: ["Aristotle", "Plato", "Friedrich Nietzsche"],
              type: "multiple",
              difficulty: "hard",
              category: "Philosophy &amp; Ethics",
            },
          ],
        }),
    });

    const questions = await fetchQuestions({ amount: 1 });

    expect(questions[0].question).toBe('Who said "I think, therefore I am"?');
    expect(questions[0].correctAnswer).toBe("René Descartes");
    expect(questions[0].category).toBe("Philosophy & Ethics");
  });

  test("shuffles answers", async () => {
    global.fetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          response_code: 0,
          results: [
            {
              question: "Test?",
              correct_answer: "A",
              incorrect_answers: ["B", "C", "D"],
              type: "multiple",
              difficulty: "easy",
              category: "Test",
            },
          ],
        }),
    });

    const questions = await fetchQuestions({ amount: 1 });

    // All answers should be present
    expect(questions[0].choices).toContain("A");
    expect(questions[0].choices).toContain("B");
    expect(questions[0].choices).toContain("C");
    expect(questions[0].choices).toContain("D");
    expect(questions[0].choices).toHaveLength(4);

    // correctIndex should point to correct answer
    expect(questions[0].choices[questions[0].correctIndex]).toBe("A");
  });

  test("handles boolean questions", async () => {
    global.fetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          response_code: 0,
          results: [
            {
              question: "Is the sky blue?",
              correct_answer: "True",
              incorrect_answers: ["False"],
              type: "boolean",
              difficulty: "easy",
              category: "Science",
            },
          ],
        }),
    });

    const questions = await fetchQuestions({ amount: 1 });

    expect(questions[0].type).toBe("boolean");
    expect(questions[0].choices).toHaveLength(2);
    expect(questions[0].choices).toContain("True");
    expect(questions[0].choices).toContain("False");
  });

  test("retries on API failure", async () => {
    // First call fails
    global.fetch.mockRejectedValueOnce(new Error("Network error"));
    // Second call succeeds
    global.fetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          response_code: 0,
          results: [
            {
              question: "Test?",
              correct_answer: "A",
              incorrect_answers: ["B"],
              type: "boolean",
              difficulty: "easy",
              category: "Test",
            },
          ],
        }),
    });

    const questions = await fetchQuestions({ amount: 1 });

    expect(questions).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  test("falls back when no results for category", async () => {
    // First call returns no results
    global.fetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          response_code: 1, // No results
          results: [],
        }),
    });
    // Retry without category succeeds
    global.fetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          response_code: 0,
          results: [
            {
              question: "Fallback?",
              correct_answer: "Yes",
              incorrect_answers: ["No"],
              type: "boolean",
              difficulty: "easy",
              category: "General",
            },
          ],
        }),
    });

    const questions = await fetchQuestions({ amount: 1, category: 999 });

    expect(questions).toHaveLength(1);
    expect(questions[0].question).toBe("Fallback?");
  });

  test("builds URL with parameters", async () => {
    global.fetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          response_code: 0,
          results: [
            {
              question: "Test?",
              correct_answer: "A",
              incorrect_answers: ["B"],
              type: "boolean",
              difficulty: "hard",
              category: "Science",
            },
          ],
        }),
    });

    await fetchQuestions({ amount: 10, category: 17, difficulty: "hard" });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("amount=10")
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("category=17")
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("difficulty=hard")
    );
  });
});

describe("Shuffle Algorithm", () => {
  test("Fisher-Yates shuffle produces uniform distribution", async () => {
    // Mock to return same question multiple times
    const mockResult = {
      response_code: 0,
      results: [
        {
          question: "Test?",
          correct_answer: "A",
          incorrect_answers: ["B", "C", "D"],
          type: "multiple",
          difficulty: "easy",
          category: "Test",
        },
      ],
    };

    // Track position of correct answer
    const positions = { 0: 0, 1: 0, 2: 0, 3: 0 };
    const iterations = 100;

    for (let i = 0; i < iterations; i++) {
      global.fetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResult),
      });

      const questions = await fetchQuestions({ amount: 1 });
      const correctIndex = questions[0].choices.indexOf("A");
      positions[correctIndex]++;
    }

    // Each position should have roughly equal distribution (25% ± margin)
    const margin = iterations * 0.15; // 15% margin
    const expected = iterations / 4;

    Object.values(positions).forEach((count) => {
      expect(count).toBeGreaterThan(expected - margin);
      expect(count).toBeLessThan(expected + margin);
    });
  });
});
