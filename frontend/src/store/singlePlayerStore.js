import { create } from "zustand";
import { GAME_CONFIG, CATEGORIES, DIFFICULTIES } from "../constants";

// Single player game store (separate from multiplayer)
export const useSinglePlayerStore = create((set, get) => ({
  // Game state
  questions: [],
  currentIndex: 0,
  score: 0,
  answers: [],
  timeRemaining: GAME_CONFIG.QUESTION_TIME_LIMIT,

  // Config
  category: null,
  difficulty: null,

  // UI state
  loading: false,
  error: null,
  selectedAnswer: null,
  showResult: false,
  gameOver: false,

  // Timer
  timerInterval: null,

  // Initialize game
  startGame: async (category, difficulty) => {
    set({ loading: true, error: null, gameOver: false });

    try {
      // Fetch questions from OpenTriviaDB (client-side for single player)
      const params = new URLSearchParams({
        amount: String(GAME_CONFIG.QUESTIONS_PER_GAME),
      });
      if (category) params.set("category", String(category));
      if (difficulty) params.set("difficulty", difficulty);

      const response = await fetch(`https://opentdb.com/api.php?${params}`);
      const data = await response.json();

      if (data.response_code !== 0 || !data.results?.length) {
        throw new Error("Failed to fetch questions");
      }

      // Decode and shuffle questions
      const questions = data.results.map((q) => ({
        question: decodeHTML(q.question),
        type: q.type,
        difficulty: q.difficulty,
        category: decodeHTML(q.category),
        correctAnswer: decodeHTML(q.correct_answer),
        choices: shuffleArray([
          decodeHTML(q.correct_answer),
          ...q.incorrect_answers.map(decodeHTML),
        ]),
      }));

      set({
        questions,
        currentIndex: 0,
        score: 0,
        answers: [],
        category,
        difficulty,
        loading: false,
        selectedAnswer: null,
        showResult: false,
        timeRemaining: GAME_CONFIG.QUESTION_TIME_LIMIT,
      });

      get().startTimer();
    } catch (error) {
      set({ loading: false, error: error.message });
    }
  },

  // Submit answer
  submitAnswer: (answer) => {
    const { questions, currentIndex, score, answers, selectedAnswer } = get();
    if (selectedAnswer !== null) return; // Already answered

    get().clearTimer();

    const question = questions[currentIndex];
    const correct = answer === question.correctAnswer;
    const points = correct ? 100 : 0;

    set({
      selectedAnswer: answer,
      showResult: true,
      score: score + points,
      answers: [...answers, { answer, correct, points }],
    });

    // Auto-advance after delay
    setTimeout(() => {
      get().nextQuestion();
    }, 2000);
  },

  // Time ran out
  timeUp: () => {
    const { selectedAnswer, answers } = get();
    if (selectedAnswer !== null) return;

    get().clearTimer();

    set({
      selectedAnswer: null,
      showResult: true,
      answers: [...answers, { answer: null, correct: false, points: 0 }],
    });

    setTimeout(() => {
      get().nextQuestion();
    }, 2000);
  },

  // Next question
  nextQuestion: () => {
    const { currentIndex, questions } = get();
    const nextIndex = currentIndex + 1;

    if (nextIndex >= questions.length) {
      set({ gameOver: true, showResult: false });
    } else {
      set({
        currentIndex: nextIndex,
        selectedAnswer: null,
        showResult: false,
        timeRemaining: GAME_CONFIG.QUESTION_TIME_LIMIT,
      });
      get().startTimer();
    }
  },

  // Timer
  startTimer: () => {
    const interval = setInterval(() => {
      const time = get().timeRemaining;
      if (time <= 1) {
        get().timeUp();
      } else {
        set({ timeRemaining: time - 1 });
      }
    }, 1000);
    set({ timerInterval: interval });
  },

  clearTimer: () => {
    const interval = get().timerInterval;
    if (interval) {
      clearInterval(interval);
      set({ timerInterval: null });
    }
  },

  // Reset
  reset: () => {
    get().clearTimer();
    set({
      questions: [],
      currentIndex: 0,
      score: 0,
      answers: [],
      timeRemaining: GAME_CONFIG.QUESTION_TIME_LIMIT,
      loading: false,
      error: null,
      selectedAnswer: null,
      showResult: false,
      gameOver: false,
    });
  },
}));

// Helpers
function decodeHTML(html) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
