import { supabase } from '@/lib/supabase';
import {
  Question,
  Response,
  GameState,
  QuestionDifficulty,
  type Result,
  ok,
  err,
} from '@/types';
import { calculateScore } from '../utils/scoreCalculator';
import { updatePlayerScore } from '../player';
import { getRandomQuestions } from '../question';

/**
 * Game Service
 *
 * Manages game flow, question progression, answer submission,
 * and game state transitions.
 */

/**
 * Game event types for real-time broadcasting
 */
export type GameEvent =
  | { type: 'game_started'; roomId: string; timestamp: string }
  | { type: 'question_changed'; question: Question; questionNumber: number }
  | {
      type: 'answer_submitted';
      playerId: string;
      playerName: string;
      correct: boolean;
      points: number;
    }
  | { type: 'game_ended'; roomId: string; timestamp: string };

/**
 * Start a trivia game
 *
 * Transitions a room from 'waiting' to 'active' status. Validates that
 * there are at least 2 players before starting. Resets all player scores
 * to 0 for a fresh game.
 *
 * @param roomId - UUID of the room to start
 * @returns Result indicating success or failure
 *
 * @example
 * const result = await startGame('room-123');
 * if (result.success) {
 *   console.log('Game started! Fetch first question.');
 * } else {
 *   showError(result.error.message); // e.g., "Need at least 2 players"
 * }
 */
export async function startGame(roomId: string): Promise<Result<void>> {
  try {
    if (!roomId || roomId.trim() === '') {
      return err('Room ID is required');
    }

    // Check if room exists and is in waiting status
    const { data: room, error: roomError } = await supabase
      .from('games')
      .select('id, status')
      .eq('id', roomId)
      .single();

    if (roomError) {
      if (roomError.code === 'PGRST116') {
        return err('Room not found');
      }
      return err(`Failed to fetch room: ${roomError.message}`);
    }

    if (!room) {
      return err('Room not found');
    }

    if (room.status !== GameState.WAITING) {
      return err('Game has already started or finished');
    }

    // Check minimum player count (2 players)
    const { count, error: countError } = await supabase
      .from('players')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', roomId);

    if (countError) {
      return err(`Failed to check player count: ${countError.message}`);
    }

    const MIN_PLAYERS = 2;
    if (count === null || count < MIN_PLAYERS) {
      return err('Need at least 2 players to start the game');
    }

    // Reset all player scores to 0
    const { error: resetError } = await supabase
      .from('players')
      .update({ score: 0 })
      .eq('room_id', roomId);

    if (resetError) {
      return err(`Failed to reset player scores: ${resetError.message}`);
    }

    // Update room status to active
    const { error: updateError } = await supabase
      .from('games')
      .update({
        status: GameState.ACTIVE,
        current_question: 1,
      })
      .eq('id', roomId);

    if (updateError) {
      return err(`Failed to start game: ${updateError.message}`);
    }

    return ok(undefined);
  } catch (error) {
    return err(
      error instanceof Error ? error : new Error('Unknown error starting game')
    );
  }
}

/**
 * Get the current active question for a room
 *
 * Fetches the question currently being asked in an active game.
 * Returns null if no question is active.
 *
 * @param roomId - UUID of the room
 * @returns Result containing the current Question or null
 *
 * @example
 * const result = await getCurrentQuestion('room-123');
 * if (result.success && result.data) {
 *   displayQuestion(result.data);
 * }
 */
export async function getCurrentQuestion(
  roomId: string
): Promise<Result<Question | null>> {
  try {
    if (!roomId || roomId.trim() === '') {
      return err('Room ID is required');
    }

    // Get room's current question number
    const { data: room, error: roomError } = await supabase
      .from('games')
      .select('current_question')
      .eq('id', roomId)
      .single();

    if (roomError) {
      if (roomError.code === 'PGRST116') {
        return err('Room not found');
      }
      return err(`Failed to fetch room: ${roomError.message}`);
    }

    if (!room || !room.current_question) {
      return ok(null);
    }

    // For now, we'll store the current question ID in room metadata
    // This is a placeholder - in a real implementation, you'd track this differently
    return ok(null);
  } catch (error) {
    return err(
      error instanceof Error
        ? error
        : new Error('Unknown error fetching current question')
    );
  }
}

/**
 * Get the next question for a game
 *
 * Fetches a random question for the game, avoiding recently asked questions.
 * Optionally filters by difficulty and/or category.
 *
 * @param roomId - UUID of the room
 * @param difficulty - Optional difficulty filter
 * @param category - Optional category filter
 * @returns Result containing the next Question or an Error
 *
 * @example
 * const result = await getNextQuestion('room-123');
 * if (result.success) {
 *   broadcastQuestion(result.data);
 *   startTimer(10); // 10 second countdown
 * }
 */
export async function getNextQuestion(
  roomId: string,
  difficulty?: QuestionDifficulty,
  category?: string
): Promise<Result<Question>> {
  try {
    if (!roomId || roomId.trim() === '') {
      return err('Room ID is required');
    }

    // Get recently asked questions in this room (last 5)
    const { data: recentResponses, error: responsesError } = await supabase
      .from('responses')
      .select('question_id')
      .eq('room_id', roomId)
      .order('timestamp', { ascending: false })
      .limit(5);

    if (responsesError) {
      return err(`Failed to fetch recent questions: ${responsesError.message}`);
    }

    // Extract question IDs to exclude
    const excludeIds = recentResponses?.map((r) => r.question_id) || [];

    // Fetch a random question with filters
    const questionsResult = await getRandomQuestions(1, {
      difficulty,
      category,
      excludeIds,
    });

    if (!questionsResult.success) {
      return err(questionsResult.error);
    }

    if (questionsResult.data.length === 0) {
      return err('No questions available matching criteria');
    }

    return ok(questionsResult.data[0]);
  } catch (error) {
    return err(
      error instanceof Error
        ? error
        : new Error('Unknown error fetching next question')
    );
  }
}

/**
 * Submit an answer to a question
 *
 * Records a player's answer, calculates the score based on correctness
 * and response time, and updates the player's total score.
 *
 * @param playerId - UUID of the player answering
 * @param questionId - UUID of the question being answered
 * @param roomId - UUID of the room/game
 * @param answer - Index of the selected answer (0-3)
 * @param timeTakenMs - Time taken to answer in milliseconds
 * @returns Result containing the Response record or an Error
 *
 * @example
 * // Player answered option 2 in 3.5 seconds
 * const result = await submitAnswer(
 *   'player-123',
 *   'question-456',
 *   'room-789',
 *   2,
 *   3500
 * );
 * if (result.success) {
 *   console.log(`Earned ${result.data.points_earned} points!`);
 *   console.log(`Correct: ${result.data.is_correct}`);
 * }
 */
export async function submitAnswer(
  playerId: string,
  questionId: string,
  roomId: string,
  answer: number,
  timeTakenMs: number
): Promise<Result<Response>> {
  try {
    // Validate inputs
    if (!playerId || playerId.trim() === '') {
      return err('Player ID is required');
    }

    if (!questionId || questionId.trim() === '') {
      return err('Question ID is required');
    }

    if (!roomId || roomId.trim() === '') {
      return err('Room ID is required');
    }

    if (typeof answer !== 'number' || answer < 0 || answer > 3) {
      return err('Answer must be between 0 and 3');
    }

    if (typeof timeTakenMs !== 'number' || timeTakenMs < 0) {
      return err('Time taken must be a positive number');
    }

    // Fetch the question to check correct answer
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('correct_answer')
      .eq('id', questionId)
      .single();

    if (questionError) {
      if (questionError.code === 'PGRST116') {
        return err('Question not found');
      }
      return err(`Failed to fetch question: ${questionError.message}`);
    }

    if (!question) {
      return err('Question not found');
    }

    // Determine if answer is correct
    const isCorrect = answer === question.correct_answer;

    // Calculate points (convert ms to seconds)
    const timeInSeconds = timeTakenMs / 1000;
    const pointsEarned = calculateScore(isCorrect, timeInSeconds);

    // Create response record
    const { data: response, error: insertError } = await supabase
      .from('responses')
      .insert({
        player_id: playerId,
        question_id: questionId,
        room_id: roomId,
        answer,
        timestamp: new Date().toISOString(),
        time_taken_ms: timeTakenMs,
        is_correct: isCorrect,
        points_earned: pointsEarned,
      })
      .select()
      .single();

    if (insertError) {
      // Check for duplicate response (player already answered this question)
      if (insertError.code === '23505') {
        return err('Answer already submitted for this question');
      }
      return err(`Failed to submit answer: ${insertError.message}`);
    }

    if (!response) {
      return err('Answer submitted but no data returned');
    }

    // Update player's total score
    if (pointsEarned > 0) {
      const scoreResult = await updatePlayerScore(playerId, pointsEarned);
      if (!scoreResult.success) {
        console.error('Failed to update player score:', scoreResult.error);
        // Don't fail the operation - response is already recorded
      }
    }

    return ok(response as Response);
  } catch (error) {
    return err(
      error instanceof Error
        ? error
        : new Error('Unknown error submitting answer')
    );
  }
}

/**
 * End a trivia game
 *
 * Transitions a room from 'active' to 'finished' status.
 * Finalizes scores and prepares for leaderboard display.
 *
 * @param roomId - UUID of the room to end
 * @returns Result indicating success or failure
 *
 * @example
 * const result = await endGame('room-123');
 * if (result.success) {
 *   showLeaderboard();
 * }
 */
export async function endGame(roomId: string): Promise<Result<void>> {
  try {
    if (!roomId || roomId.trim() === '') {
      return err('Room ID is required');
    }

    // Verify room exists and is active
    const { data: room, error: roomError } = await supabase
      .from('games')
      .select('id, status')
      .eq('id', roomId)
      .single();

    if (roomError) {
      if (roomError.code === 'PGRST116') {
        return err('Room not found');
      }
      return err(`Failed to fetch room: ${roomError.message}`);
    }

    if (!room) {
      return err('Room not found');
    }

    if (room.status !== GameState.ACTIVE) {
      return err('Game is not active');
    }

    // Update room status to finished
    const { error: updateError } = await supabase
      .from('games')
      .update({ status: GameState.FINISHED })
      .eq('id', roomId);

    if (updateError) {
      return err(`Failed to end game: ${updateError.message}`);
    }

    // Note: Leaderboard view is automatically updated via the database view
    // No need to manually update leaderboard table

    return ok(undefined);
  } catch (error) {
    return err(
      error instanceof Error ? error : new Error('Unknown error ending game')
    );
  }
}

/**
 * Subscribe to real-time game events
 *
 * Sets up a Supabase Realtime subscription to listen for game state changes.
 * Useful for broadcasting game events to all connected clients.
 *
 * **Important**: The caller is responsible for unsubscribing when done.
 *
 * @param roomId - UUID of the room to subscribe to
 * @param callback - Function called when game events occur
 * @returns Realtime channel for cleanup (call channel.unsubscribe())
 *
 * @example
 * const channel = subscribeToGameEvents('room-123', (event) => {
 *   if (event.type === 'game_started') {
 *     console.log('Game started!');
 *   } else if (event.type === 'question_changed') {
 *     displayQuestion(event.question);
 *   }
 * });
 *
 * // Clean up on unmount
 * return () => {
 *   channel.unsubscribe();
 * };
 */
export function subscribeToGameEvents(
  roomId: string,
  callback: (event: GameEvent) => void
): ReturnType<typeof supabase.channel> {
  const channel = supabase
    .channel(`game-events-${roomId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'games',
        filter: `id=eq.${roomId}`,
      },
      (payload) => {
        const newData = payload.new as Record<string, unknown>;
        const oldData = payload.old as Record<string, unknown>;

        // Detect game state changes
        if (oldData.status === 'waiting' && newData.status === 'active') {
          callback({
            type: 'game_started',
            roomId,
            timestamp: new Date().toISOString(),
          });
        } else if (
          oldData.status === 'active' &&
          newData.status === 'finished'
        ) {
          callback({
            type: 'game_ended',
            roomId,
            timestamp: new Date().toISOString(),
          });
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'responses',
        filter: `room_id=eq.${roomId}`,
      },
      async (payload) => {
        const response = payload.new as Record<string, unknown>;

        // Fetch player name for the event
        const { data: player } = await supabase
          .from('players')
          .select('name')
          .eq('id', response.player_id as string)
          .single();

        callback({
          type: 'answer_submitted',
          playerId: response.player_id as string,
          playerName: player?.name || 'Unknown',
          correct: response.is_correct as boolean,
          points: response.points_earned as number,
        });
      }
    )
    .subscribe();

  return channel;
}
