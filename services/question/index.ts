/**
 * Question Service
 *
 * Public API for question management operations.
 */

export {
  getQuestionById,
  getRandomQuestions,
  getQuestionsByCategory,
} from './question.service';

export type { QuestionFilters } from './question.service';
