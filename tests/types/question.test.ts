/**
 * Question Type Tests
 *
 * Tests for question-related types, enums, and validation functions.
 */

import { describe, it, expect } from 'vitest';
import {
  QuestionDifficulty,
  QuestionCategory,
  isQuestionDifficulty,
  isQuestionCategory,
  isValidQuestion,
  type Question,
} from '@/types/question';

describe('QuestionDifficulty', () => {
  it('should have correct enum values', () => {
    expect(QuestionDifficulty.EASY).toBe('easy');
    expect(QuestionDifficulty.MEDIUM).toBe('medium');
    expect(QuestionDifficulty.HARD).toBe('hard');
  });

  it('should have exactly 3 difficulty levels', () => {
    const difficulties = Object.values(QuestionDifficulty);
    expect(difficulties).toHaveLength(3);
  });
});

describe('QuestionCategory', () => {
  it('should have all expected categories', () => {
    expect(QuestionCategory.GENERAL).toBe('general');
    expect(QuestionCategory.SCIENCE).toBe('science');
    expect(QuestionCategory.HISTORY).toBe('history');
    expect(QuestionCategory.GEOGRAPHY).toBe('geography');
    expect(QuestionCategory.ENTERTAINMENT).toBe('entertainment');
    expect(QuestionCategory.SPORTS).toBe('sports');
    expect(QuestionCategory.ARTS).toBe('arts');
    expect(QuestionCategory.TECHNOLOGY).toBe('technology');
  });

  it('should have exactly 8 categories', () => {
    const categories = Object.values(QuestionCategory);
    expect(categories).toHaveLength(8);
  });
});

describe('isQuestionDifficulty', () => {
  it('should return true for valid difficulties', () => {
    expect(isQuestionDifficulty('easy')).toBe(true);
    expect(isQuestionDifficulty('medium')).toBe(true);
    expect(isQuestionDifficulty('hard')).toBe(true);
  });

  it('should return false for invalid difficulties', () => {
    expect(isQuestionDifficulty('extreme')).toBe(false);
    expect(isQuestionDifficulty('EASY')).toBe(false);
    expect(isQuestionDifficulty('')).toBe(false);
  });
});

describe('isQuestionCategory', () => {
  it('should return true for valid categories', () => {
    expect(isQuestionCategory('science')).toBe(true);
    expect(isQuestionCategory('history')).toBe(true);
    expect(isQuestionCategory('technology')).toBe(true);
  });

  it('should return false for invalid categories', () => {
    expect(isQuestionCategory('math')).toBe(false);
    expect(isQuestionCategory('SCIENCE')).toBe(false);
    expect(isQuestionCategory('')).toBe(false);
  });
});

describe('isValidQuestion', () => {
  const validQuestion: Question = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    text: 'What is the capital of France?',
    category: QuestionCategory.GEOGRAPHY,
    difficulty: QuestionDifficulty.EASY,
    options: ['London', 'Berlin', 'Paris', 'Madrid'],
    correct_answer: 2,
  };

  it('should return true for valid questions', () => {
    expect(isValidQuestion(validQuestion)).toBe(true);
  });

  it('should return false when required fields are missing', () => {
    expect(isValidQuestion({})).toBe(false);
    expect(isValidQuestion({ id: '123', text: 'Test?' })).toBe(false);
  });

  it('should return false when options array has wrong length', () => {
    const invalidOptions = {
      ...validQuestion,
      options: ['A', 'B', 'C'], // Only 3 options
    };
    expect(isValidQuestion(invalidOptions)).toBe(false);

    const tooManyOptions = {
      ...validQuestion,
      options: ['A', 'B', 'C', 'D', 'E'], // 5 options
    };
    expect(isValidQuestion(tooManyOptions)).toBe(false);
  });

  it('should return false when correct_answer is out of range', () => {
    const invalidAnswer = {
      ...validQuestion,
      correct_answer: 4, // Index out of bounds
    };
    expect(isValidQuestion(invalidAnswer)).toBe(false);

    const negativeAnswer = {
      ...validQuestion,
      correct_answer: -1,
    };
    expect(isValidQuestion(negativeAnswer)).toBe(false);
  });

  it('should allow optional explanation field', () => {
    const questionWithExplanation: Question = {
      ...validQuestion,
      explanation: 'Paris is the capital and largest city of France.',
    };
    expect(isValidQuestion(questionWithExplanation)).toBe(true);
  });
});

describe('Question interface', () => {
  it('should enforce correct answer index range', () => {
    const question: Question = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      text: 'What is 2 + 2?',
      category: QuestionCategory.GENERAL,
      difficulty: QuestionDifficulty.EASY,
      options: ['3', '4', '5', '6'],
      correct_answer: 1, // Index 1 = '4'
    };

    expect(question.options[question.correct_answer]).toBe('4');
  });
});
