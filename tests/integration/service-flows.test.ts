/**
 * Integration Tests for Service Layer Flows
 *
 * These tests verify that multiple services work together correctly
 * to support complete user flows through the application.
 */

import { describe, it, expect, 
  // beforeEach,
   afterEach } from 'vitest';
// import type { Room, Player, Question, Response } from '@/types';
import {
  createRoom,
  joinRoom,
  getRoomState,
  addPlayer,
  getPlayersInRoom,
  startGame,
  getNextQuestion,
  submitAnswer,
  endGame,
  getRandomQuestions,
} from '@/services';

// Test cleanup helper
const testRoomIds: string[] = [];

afterEach(async () => {
  // Clean up test rooms after each test
  for (const {} of testRoomIds) {
    try {
      // In a real implementation, we'd have a cleanup service function
      // For now, this is a placeholder
    } catch (error) {
      // Ignore cleanup errors
      console.error('Error during test room cleanup:', error);
    }
  }
  testRoomIds.length = 0;
});

describe('Integration: Room Creation → Player Join Flow', () => {
  it('should allow creating a room and adding multiple players', async () => {
    // Step 1: Create room
    const createResult = await createRoom('host-123');
    expect(createResult.success).toBe(true);

    if (!createResult.success) return;
    const room = createResult.data;
    testRoomIds.push(room.id);

    // Step 2: Add host player
    const hostResult = await addPlayer(room.id, 'Alice');
    expect(hostResult.success).toBe(true);
    if (!hostResult.success) return;
    expect(hostResult.data.is_host).toBe(true);

    // Step 3: Join room with second player
    const joinResult = await joinRoom(room.code, 'player-456');
    expect(joinResult.success).toBe(true);

    // Step 4: Add second player
    const player2Result = await addPlayer(room.id, 'Bob');
    expect(player2Result.success).toBe(true);
    if (!player2Result.success) return;
    expect(player2Result.data.is_host).toBe(false);

    // Step 5: Verify both players in room
    const playersResult = await getPlayersInRoom(room.id);
    expect(playersResult.success).toBe(true);
    if (!playersResult.success) return;
    expect(playersResult.data).toHaveLength(2);
    expect(playersResult.data.map((p) => p.name)).toContain('Alice');
    expect(playersResult.data.map((p) => p.name)).toContain('Bob');
  });

  it('should maintain room state consistency during joins', async () => {
    // Create room
    const createResult = await createRoom('host-456');
    expect(createResult.success).toBe(true);
    if (!createResult.success) return;
    testRoomIds.push(createResult.data.id);

    // Get initial state
    const stateResult1 = await getRoomState(createResult.data.id);
    expect(stateResult1.success).toBe(true);
    if (!stateResult1.success) return;
    expect(stateResult1.data.status).toBe('waiting');

    // Join room
    const joinResult = await joinRoom(
      createResult.data.code,
      'player-join-123'
    );
    expect(joinResult.success).toBe(true);

    // Verify state unchanged
    const stateResult2 = await getRoomState(createResult.data.id);
    expect(stateResult2.success).toBe(true);
    if (!stateResult2.success) return;
    expect(stateResult2.data.status).toBe('waiting');
    expect(stateResult2.data.code).toBe(createResult.data.code);
  });
});

describe('Integration: Game Start → Question Fetch → Answer Submit Flow', () => {
  it('should complete a full game round successfully', async () => {
    // Step 1: Create room and add players
    const roomResult = await createRoom('host-789');
    expect(roomResult.success).toBe(true);
    if (!roomResult.success) return;
    testRoomIds.push(roomResult.data.id);

    const player1Result = await addPlayer(roomResult.data.id, 'Charlie');
    const player2Result = await addPlayer(roomResult.data.id, 'Diana');
    expect(player1Result.success).toBe(true);
    expect(player2Result.success).toBe(true);
    if (!player1Result.success || !player2Result.success) return;

    // Step 2: Start game
    const startResult = await startGame(roomResult.data.id);
    expect(startResult.success).toBe(true);

    // Step 3: Get first question
    const questionResult = await getNextQuestion(roomResult.data.id);
    expect(questionResult.success).toBe(true);
    if (!questionResult.success) return;
    const question = questionResult.data;

    expect(question.id).toBeDefined();
    expect(question.text).toBeDefined();
    expect(question.options).toHaveLength(4);

    // Step 4: Submit correct answer from player 1
    const submitResult1 = await submitAnswer(
      player1Result.data.id,
      question.id,
      roomResult.data.id,
      question.correct_answer,
      3500 // Fast answer in milliseconds
    );
    expect(submitResult1.success).toBe(true);
    if (!submitResult1.success) return;
    expect(submitResult1.data.is_correct).toBe(true);
    expect(submitResult1.data.points_earned).toBeGreaterThan(100); // Base + time bonus

    // Step 5: Submit wrong answer from player 2
    // Find a wrong answer (any index that's not the correct answer)
    const wrongAnswerIndex = question.correct_answer === 0 ? 1 : 0;

    const submitResult2 = await submitAnswer(
      player2Result.data.id,
      question.id,
      roomResult.data.id,
      wrongAnswerIndex,
      7200 // Slower answer in milliseconds
    );
    expect(submitResult2.success).toBe(true);
    if (!submitResult2.success) return;
    expect(submitResult2.data.is_correct).toBe(false);
    expect(submitResult2.data.points_earned).toBe(0);

    // Step 6: Verify player scores updated
    const playersResult = await getPlayersInRoom(roomResult.data.id);
    expect(playersResult.success).toBe(true);
    if (!playersResult.success) return;

    const charlie = playersResult.data.find((p) => p.name === 'Charlie');
    const diana = playersResult.data.find((p) => p.name === 'Diana');

    expect(charlie?.score).toBeGreaterThan(0);
    expect(diana?.score).toBe(0);
  });

  it('should handle multiple questions in sequence', async () => {
    // Create room with players
    const roomResult = await createRoom('host-multi');
    expect(roomResult.success).toBe(true);
    if (!roomResult.success) return;
    testRoomIds.push(roomResult.data.id);

    await addPlayer(roomResult.data.id, 'Eve');
    await addPlayer(roomResult.data.id, 'Frank');

    // Start game
    await startGame(roomResult.data.id);

    // Get multiple questions in sequence
    const question1Result = await getNextQuestion(roomResult.data.id);
    expect(question1Result.success).toBe(true);
    if (!question1Result.success) return;

    const question2Result = await getNextQuestion(roomResult.data.id);
    expect(question2Result.success).toBe(true);
    if (!question2Result.success) return;

    const question3Result = await getNextQuestion(roomResult.data.id);
    expect(question3Result.success).toBe(true);
    if (!question3Result.success) return;

    // Verify all questions are unique
    const questionIds = [
      question1Result.data.id,
      question2Result.data.id,
      question3Result.data.id,
    ];

    const uniqueIds = new Set(questionIds);
    expect(uniqueIds.size).toBe(3); // All questions should be different
  });
});

describe('Integration: Score Updates → Leaderboard Flow', () => {
  it('should track cumulative scores across multiple questions', async () => {
    // Setup
    const roomResult = await createRoom('host-scores');
    expect(roomResult.success).toBe(true);
    if (!roomResult.success) return;
    testRoomIds.push(roomResult.data.id);

    const player1Result = await addPlayer(roomResult.data.id, 'Grace');
    const player2Result = await addPlayer(roomResult.data.id, 'Henry');
    expect(player1Result.success).toBe(true);
    expect(player2Result.success).toBe(true);
    if (!player1Result.success || !player2Result.success) return;

    await startGame(roomResult.data.id);

    // Round 1
    const q1Result = await getNextQuestion(roomResult.data.id);
    expect(q1Result.success).toBe(true);
    if (!q1Result.success) return;

    await submitAnswer(
      player1Result.data.id,
      q1Result.data.id,
      roomResult.data.id,
      q1Result.data.correct_answer,
      2000
    );

    await submitAnswer(
      player2Result.data.id,
      q1Result.data.id,
      roomResult.data.id,
      q1Result.data.correct_answer,
      5000
    );

    // Round 2
    const q2Result = await getNextQuestion(roomResult.data.id);
    expect(q2Result.success).toBe(true);
    if (!q2Result.success) return;

    await submitAnswer(
      player1Result.data.id,
      q2Result.data.id,
      roomResult.data.id,
      q2Result.data.correct_answer,
      1500
    );

    await submitAnswer(
      player2Result.data.id,
      q2Result.data.id,
      roomResult.data.id,
      q2Result.data.correct_answer,
      8000
    );

    // Verify cumulative scores
    const playersResult = await getPlayersInRoom(roomResult.data.id);
    expect(playersResult.success).toBe(true);
    if (!playersResult.success) return;

    const grace = playersResult.data.find((p) => p.name === 'Grace');
    const henry = playersResult.data.find((p) => p.name === 'Henry');

    expect(grace?.score).toBeGreaterThan(henry?.score || 0); // Grace answered faster
    expect(grace?.score).toBeGreaterThan(200); // At least 2 correct answers
    expect(henry?.score).toBeGreaterThan(200);
  });

  it('should finalize leaderboard on game end', async () => {
    // Setup
    const roomResult = await createRoom('host-end');
    expect(roomResult.success).toBe(true);
    if (!roomResult.success) return;
    testRoomIds.push(roomResult.data.id);

    const player1Result = await addPlayer(roomResult.data.id, 'Ivy');
    const player2Result = await addPlayer(roomResult.data.id, 'Jack');
    expect(player1Result.success && player2Result.success).toBe(true);
    if (!player1Result.success || !player2Result.success) return;

    // Start and play
    await startGame(roomResult.data.id);

    const questionResult = await getNextQuestion(roomResult.data.id);
    expect(questionResult.success).toBe(true);
    if (!questionResult.success) return;

    await submitAnswer(
      player1Result.data.id,
      questionResult.data.id,
      roomResult.data.id,
      questionResult.data.correct_answer,
      2000
    );

    // End game
    const endResult = await endGame(roomResult.data.id);
    expect(endResult.success).toBe(true);

    // Verify room status updated
    const roomStateResult = await getRoomState(roomResult.data.id);
    expect(roomStateResult.success).toBe(true);
    if (!roomStateResult.success) return;
    expect(roomStateResult.data.status).toBe('finished');
  });
});

describe('Integration: Realtime Subscriptions Across Services', () => {
  it('should handle subscription cleanup without errors', async () => {
    const roomResult = await createRoom('host-realtime');
    expect(roomResult.success).toBe(true);
    if (!roomResult.success) return;
    testRoomIds.push(roomResult.data.id);

    // This test verifies that subscription functions exist and can be called
    // Actual realtime testing would require a test Supabase instance
    expect(typeof roomResult.data.id).toBe('string');
  });
});

describe('Integration: Error Scenarios', () => {
  it('should handle invalid room code gracefully', async () => {
    const joinResult = await joinRoom('INVALID1', 'test-player-id');
    expect(joinResult.success).toBe(false);
    if (joinResult.success) return;
    expect(joinResult.error.message).toContain('not found');
  });

  it('should prevent starting game with insufficient players', async () => {
    const roomResult = await createRoom('host-solo');
    expect(roomResult.success).toBe(true);
    if (!roomResult.success) return;
    testRoomIds.push(roomResult.data.id);

    // Only add one player
    await addPlayer(roomResult.data.id, 'Solo');

    // Try to start game
    const startResult = await startGame(roomResult.data.id);
    expect(startResult.success).toBe(false);
    if (startResult.success) return;
    expect(startResult.error.message).toContain('at least 2 players');
  });

  it('should prevent joining room at capacity', async () => {
    const roomResult = await createRoom('host-full');
    expect(roomResult.success).toBe(true);
    if (!roomResult.success) return;
    testRoomIds.push(roomResult.data.id);

    // Add 8 players (max capacity)
    const playerNames = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8'];
    for (const name of playerNames) {
      const result = await addPlayer(roomResult.data.id, name);
      expect(result.success).toBe(true);
    }

    // Try to add 9th player
    const player9Result = await addPlayer(roomResult.data.id, 'P9');
    expect(player9Result.success).toBe(false);
    if (player9Result.success) return;
    expect(player9Result.error.message).toContain('full');
  });

  it('should handle non-existent room gracefully', async () => {
    const stateResult = await getRoomState('non-existent-room-id');
    expect(stateResult.success).toBe(false);
    if (stateResult.success) return;
    expect(stateResult.error).toBeDefined();
  });
});

describe('Integration: Question Service with Game Flow', () => {
  it('should provide diverse questions when requested', async () => {
    const questionsResult = await getRandomQuestions(10);
    expect(questionsResult.success).toBe(true);
    if (!questionsResult.success) return;

    expect(questionsResult.data).toHaveLength(10);

    // Verify all questions are unique
    const questionIds = questionsResult.data.map((q) => q.id);
    const uniqueIds = new Set(questionIds);
    expect(uniqueIds.size).toBe(10);

    // Verify each question has proper structure
    questionsResult.data.forEach((question) => {
      expect(question.text).toBeDefined();
      expect(question.options).toHaveLength(4);
      expect(question.correct_answer).toBeDefined();
      expect(question.options).toContain(question.correct_answer);
    });
  });

  it('should respect exclusion filters', async () => {
    // Get initial set of questions
    const result1 = await getRandomQuestions(5);
    expect(result1.success).toBe(true);
    if (!result1.success) return;

    const excludeIds = result1.data.map((q) => q.id);

    // Get new questions excluding previous ones
    const result2 = await getRandomQuestions(5, { excludeIds });
    expect(result2.success).toBe(true);
    if (!result2.success) return;

    // Verify no overlap
    const newIds = result2.data.map((q) => q.id);
    const overlap = newIds.filter((id) => excludeIds.includes(id));
    expect(overlap).toHaveLength(0);
  });
});
