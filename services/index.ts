/**
 * Triviamania Services
 *
 * Central export point for all service layer functions.
 * Import services from this file throughout the application.
 *
 * @example
 * import { createRoom, addPlayer, startGame, getNextQuestion } from '@/services';
 *
 * const roomResult = await createRoom(hostId);
 * if (roomResult.success) {
 *   const playerResult = await addPlayer(roomResult.data.id, 'Alice');
 *   await startGame(roomResult.data.id);
 *   const questionResult = await getNextQuestion(roomResult.data.id);
 * }
 */

// Room Service
export {
  createRoom,
  joinRoom,
  getRoomState,
  updateRoomStatus,
  subscribeToRoom,
} from './room';

// Player Service
export {
  addPlayer,
  getPlayersInRoom,
  updatePlayerScore,
  subscribeToPlayers,
  removePlayer,
} from './player';

// Game Service
export {
  startGame,
  getCurrentQuestion,
  getNextQuestion,
  submitAnswer,
  endGame,
  subscribeToGameEvents,
} from './game';
export type { GameEvent } from './game';

// Question Service
export {
  getQuestionById,
  getRandomQuestions,
  getQuestionsByCategory,
} from './question';
export type { QuestionFilters } from './question';

// Utility functions
export { generateRoomCode, isValidRoomCode } from './utils/roomCodeGenerator';
export {
  calculateScore,
  getTimeBonus,
  getScorePercentage,
  SCORE_CONSTANTS,
} from './utils/scoreCalculator';
