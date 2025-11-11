/**
 * Type Validation Tests
 *
 * Tests for game-related types, validation functions, and type guards.
 */

import { describe, it, expect } from 'vitest';
import {
  GameState,
  isGameState,
  isValidRoomCode,
  type Room,
} from '@/types/game';

describe('GameState', () => {
  it('should have correct enum values', () => {
    expect(GameState.WAITING).toBe('waiting');
    expect(GameState.ACTIVE).toBe('active');
    expect(GameState.FINISHED).toBe('finished');
  });

  it('should have exactly 3 states', () => {
    const states = Object.values(GameState);
    expect(states).toHaveLength(3);
  });
});

describe('isGameState', () => {
  it('should return true for valid game states', () => {
    expect(isGameState('waiting')).toBe(true);
    expect(isGameState('active')).toBe(true);
    expect(isGameState('finished')).toBe(true);
  });

  it('should return false for invalid game states', () => {
    expect(isGameState('invalid')).toBe(false);
    expect(isGameState('pending')).toBe(false);
    expect(isGameState('')).toBe(false);
    expect(isGameState('WAITING')).toBe(false); // Case sensitive
  });
});

describe('isValidRoomCode', () => {
  it('should accept valid 8-character alphanumeric codes', () => {
    expect(isValidRoomCode('ABCD1234')).toBe(true);
    expect(isValidRoomCode('12345678')).toBe(true);
    expect(isValidRoomCode('AAAAAAAA')).toBe(true);
    expect(isValidRoomCode('Z9Z9Z9Z9')).toBe(true);
  });

  it('should reject codes with incorrect length', () => {
    expect(isValidRoomCode('ABC123')).toBe(false);
    expect(isValidRoomCode('ABCD12345')).toBe(false);
    expect(isValidRoomCode('')).toBe(false);
  });

  it('should reject codes with lowercase letters', () => {
    expect(isValidRoomCode('abcd1234')).toBe(false);
    expect(isValidRoomCode('Abcd1234')).toBe(false);
  });

  it('should reject codes with special characters', () => {
    expect(isValidRoomCode('ABCD-234')).toBe(false);
    expect(isValidRoomCode('ABCD_234')).toBe(false);
    expect(isValidRoomCode('ABCD 234')).toBe(false);
  });
});

describe('Room interface', () => {
  it('should allow valid room objects', () => {
    const validRoom: Room = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      code: 'ABCD1234',
      host_id: '123e4567-e89b-12d3-a456-426614174001',
      status: GameState.WAITING,
      created_at: '2025-11-11T10:00:00Z',
    };

    expect(validRoom.code).toBe('ABCD1234');
    expect(validRoom.status).toBe(GameState.WAITING);
  });

  it('should allow optional fields', () => {
    const roomWithOptionals: Room = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      code: 'ABCD1234',
      host_id: '123e4567-e89b-12d3-a456-426614174001',
      status: GameState.ACTIVE,
      created_at: '2025-11-11T10:00:00Z',
      updated_at: '2025-11-11T10:05:00Z',
      current_question: 5,
      total_questions: 10,
    };

    expect(roomWithOptionals.current_question).toBe(5);
    expect(roomWithOptionals.total_questions).toBe(10);
  });
});
