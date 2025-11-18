import { supabase } from '@/lib/supabase';
import { Question, QuestionDifficulty, type Result, ok, err } from '@/types';

/**
 * Question Service
 *
 * Manages trivia question retrieval and filtering.
 * Provides access to the question bank with various filtering options.
 */

/**
 * Filter options for fetching questions
 */
export interface QuestionFilters {
  /** Filter by difficulty level */
  difficulty?: QuestionDifficulty;
  /** Filter by category */
  category?: string;
  /** Exclude specific question IDs (already asked) */
  excludeIds?: string[];
}

/**
 * Get a specific question by ID
 *
 * Fetches a single question from the database by its unique identifier.
 *
 * @param id - UUID of the question
 * @returns Result containing the Question or an Error
 *
 * @example
 * const result = await getQuestionById('question-123');
 * if (result.success) {
 *   console.log(result.data.text);
 *   console.log(result.data.options);
 * }
 */
export async function getQuestionById(id: string): Promise<Result<Question>> {
  try {
    if (!id || id.trim() === '') {
      return err('Question ID is required');
    }

    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return err('Question not found');
      }
      return err(`Failed to fetch question: ${error.message}`);
    }

    if (!data) {
      return err('Question not found');
    }

    return ok(data as Question);
  } catch (error) {
    return err(
      error instanceof Error
        ? error
        : new Error('Unknown error fetching question')
    );
  }
}

/**
 * Get random questions with optional filtering
 *
 * Fetches N random questions from the database. Optionally filters by
 * difficulty, category, and excludes specific question IDs.
 * Options are shuffled for each question to prevent answer memorization.
 *
 * @param count - Number of questions to fetch (must be >= 1)
 * @param filters - Optional filters for difficulty, category, and exclusions
 * @returns Result containing array of Questions or an Error
 *
 * @example
 * // Get 10 random questions
 * const result = await getRandomQuestions(10);
 *
 * @example
 * // Get 5 hard science questions, excluding already-asked ones
 * const result = await getRandomQuestions(5, {
 *   difficulty: QuestionDifficulty.HARD,
 *   category: 'science',
 *   excludeIds: ['q1', 'q2', 'q3']
 * });
 */
export async function getRandomQuestions(
  count: number,
  filters?: QuestionFilters
): Promise<Result<Question[]>> {
  try {
    // Validate count
    if (!count || count < 1) {
      return err('Count must be at least 1');
    }

    if (!Number.isInteger(count)) {
      return err('Count must be an integer');
    }

    // Build query
    let query = supabase.from('questions').select('*');

    // Apply filters
    if (filters?.difficulty) {
      query = query.eq('difficulty', filters.difficulty);
    }

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.excludeIds && filters.excludeIds.length > 0) {
      query = query.not('id', 'in', `(${filters.excludeIds.join(',')})`);
    }

    // Fetch questions (we'll randomize on client side)
    const { data, error } = await query;

    if (error) {
      return err(`Failed to fetch questions: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return err('No questions found matching the criteria');
    }

    // Shuffle the questions array using Fisher-Yates algorithm
    const shuffled = [...data];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Take the requested count
    const selected = shuffled.slice(0, Math.min(count, shuffled.length));

    // Shuffle options for each question to prevent answer memorization
    const questionsWithShuffledOptions = selected.map((q) => {
      const question = q as Question;
      const options = [...question.options];

      // Track where the correct answer moves to after shuffling
      const correctOption = options[question.correct_answer];

      // Shuffle options using Fisher-Yates
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }

      // Find the new index of the correct answer
      const newCorrectIndex = options.indexOf(correctOption);

      return {
        ...question,
        options,
        correct_answer: newCorrectIndex,
      };
    });

    return ok(questionsWithShuffledOptions);
  } catch (error) {
    return err(
      error instanceof Error
        ? error
        : new Error('Unknown error fetching questions')
    );
  }
}

/**
 * Get all questions for a specific category
 *
 * Fetches all questions belonging to a particular category.
 * Useful for category-specific game modes.
 *
 * @param category - Category name (e.g., 'science', 'history')
 * @returns Result containing array of Questions or an Error
 *
 * @example
 * const result = await getQuestionsByCategory('science');
 * if (result.success) {
 *   console.log(`Found ${result.data.length} science questions`);
 * }
 */
export async function getQuestionsByCategory(
  category: string
): Promise<Result<Question[]>> {
  try {
    if (!category || category.trim() === '') {
      return err('Category is required');
    }

    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('category', category.toLowerCase().trim());

    if (error) {
      return err(`Failed to fetch questions: ${error.message}`);
    }

    // Return empty array if no questions found (valid state)
    return ok((data || []) as Question[]);
  } catch (error) {
    return err(
      error instanceof Error
        ? error
        : new Error('Unknown error fetching questions by category')
    );
  }
}
