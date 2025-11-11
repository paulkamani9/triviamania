/**
 * Player Type Tests
 *
 * Tests for player-related types and validation functions.
 */

import { describe, it, expect } from 'vitest';
import {
  isValidPlayerName,
  sanitizePlayerName,
  type Player,
  type PlayerSession,
} from '@/types/player';

describe('isValidPlayerName', () => {
  it('should accept valid player names', () => {
    expect(isValidPlayerName('Alice')).toBe(true);
    expect(isValidPlayerName('Bob123')).toBe(true);
    expect(isValidPlayerName('Player 1')).toBe(true);
    expect(isValidPlayerName('a')).toBe(true);
    expect(isValidPlayerName('12345678901234567890')).toBe(true); // Max 20 chars
  });

  it('should reject empty or whitespace-only names', () => {
    expect(isValidPlayerName('')).toBe(false);
    expect(isValidPlayerName('   ')).toBe(false);
  });

  it('should reject names longer than 20 characters', () => {
    expect(isValidPlayerName('123456789012345678901')).toBe(false);
    expect(isValidPlayerName('VeryLongPlayerNameThatExceedsLimit')).toBe(false);
  });

  it('should reject names with special characters', () => {
    expect(isValidPlayerName('Player@123')).toBe(false);
    expect(isValidPlayerName('Player#1')).toBe(false);
    expect(isValidPlayerName('Player!!')).toBe(false);
    expect(isValidPlayerName('Player_One')).toBe(false);
  });
});

describe('sanitizePlayerName', () => {
  it('should trim whitespace', () => {
    expect(sanitizePlayerName('  Alice  ')).toBe('Alice');
    expect(sanitizePlayerName('Bob   ')).toBe('Bob');
    expect(sanitizePlayerName('   Charlie')).toBe('Charlie');
  });

  it('should truncate to 20 characters', () => {
    const longName = 'VeryLongPlayerNameThatExceedsMaximumLimit';
    expect(sanitizePlayerName(longName)).toHaveLength(20);
    expect(sanitizePlayerName(longName)).toBe('VeryLongPlayerNameTh');
  });

  it('should handle names that are already valid', () => {
    expect(sanitizePlayerName('Alice')).toBe('Alice');
    expect(sanitizePlayerName('Player 1')).toBe('Player 1');
  });
});

describe('Player interface', () => {
  it('should allow valid player objects', () => {
    const validPlayer: Player = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Alice',
      room_id: '123e4567-e89b-12d3-a456-426614174001',
      score: 0,
      is_host: true,
      joined_at: '2025-11-11T10:00:00Z',
    };

    expect(validPlayer.name).toBe('Alice');
    expect(validPlayer.score).toBe(0);
    expect(validPlayer.is_host).toBe(true);
  });

  it('should allow optional connection fields', () => {
    const playerWithConnection: Player = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Bob',
      room_id: '123e4567-e89b-12d3-a456-426614174001',
      score: 250,
      is_host: false,
      joined_at: '2025-11-11T10:00:00Z',
      is_connected: true,
      last_active_at: '2025-11-11T10:05:00Z',
    };

    expect(playerWithConnection.is_connected).toBe(true);
    expect(playerWithConnection.last_active_at).toBeDefined();
  });
});

describe('PlayerSession interface', () => {
  it('should structure session data correctly', () => {
    const session: PlayerSession = {
      player_id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Alice',
      room_code: 'ABCD1234',
      created_at: '2025-11-11T10:00:00Z',
    };

    expect(session.player_id).toBeDefined();
    expect(session.room_code).toHaveLength(8);
  });
});
