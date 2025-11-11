/**
 * Question & Answer Types
 *
 * Defines trivia questions, answers, and related metadata.
 */

/**
 * Question difficulty levels
 */
export enum QuestionDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

/**
 * Question categories
 */
export enum QuestionCategory {
  GENERAL = 'general',
  SCIENCE = 'science',
  HISTORY = 'history',
  GEOGRAPHY = 'geography',
  ENTERTAINMENT = 'entertainment',
  SPORTS = 'sports',
  ARTS = 'arts',
  TECHNOLOGY = 'technology',
}

/**
 * Represents a trivia question
 */
export interface Question {
  /** Unique identifier for the question (UUID) */
  id: string;

  /** The question text */
  text: string;

  /** Category of the question */
  category: QuestionCategory;

  /** Difficulty level */
  difficulty: QuestionDifficulty;

  /** Array of 4 answer options (including correct answer) */
  options: string[];

  /** Index of the correct answer in the options array (0-3) */
  correct_answer: number;

  /** Optional explanation shown after answering */
  explanation?: string;

  /** ISO 8601 timestamp of question creation */
  created_at?: string;
}

/**
 * Question with shuffled options for client display
 * Prevents answer position memorization
 */
export interface ShuffledQuestion extends Omit<Question, 'correct_answer'> {
  /** Mapping from shuffled position to original position */
  shuffle_map: number[];
}

/**
 * Type guard for QuestionDifficulty
 */
export function isQuestionDifficulty(
  value: string
): value is QuestionDifficulty {
  return Object.values(QuestionDifficulty).includes(
    value as QuestionDifficulty
  );
}

/**
 * Type guard for QuestionCategory
 */
export function isQuestionCategory(value: string): value is QuestionCategory {
  return Object.values(QuestionCategory).includes(value as QuestionCategory);
}

/**
 * Validates question format
 */
export function isValidQuestion(
  question: Partial<Question>
): question is Question {
  return !!(
    question.id &&
    question.text &&
    question.category &&
    question.difficulty &&
    question.options &&
    question.options.length === 4 &&
    typeof question.correct_answer === 'number' &&
    question.correct_answer >= 0 &&
    question.correct_answer < 4
  );
}
