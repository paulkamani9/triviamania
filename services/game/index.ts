/**
 * Game Service
 *
 * Public API for game management operations.
 */

export {
  startGame,
  getCurrentQuestion,
  getNextQuestion,
  submitAnswer,
  endGame,
  subscribeToGameEvents,
} from './game.service';

export type { GameEvent } from './game.service';
