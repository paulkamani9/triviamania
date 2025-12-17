/**
 * LobbyView Component
 *
 * Presentational component for the lobby/waiting room.
 * Displays connected players, room code, and host controls.
 *
 * @example
 * ```tsx
 * <LobbyView
 *   players={players}
 *   roomCode="ABCD1234"
 *   isHost={true}
 *   isLoading={false}
 *   error={null}
 *   onStartGame={handleStartGame}
 *   onCopyCode={handleCopyCode}
 *   isStarting={false}
 *   canStart={players.length >= 2}
 * />
 * ```
 */

'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/common/Button';
import { PlayerCard } from '@/components/common/PlayerCard';
import { RoomCodeDisplay } from '@/components/common/RoomCodeDisplay';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { staggerContainer, fadeIn } from '@/components/motion/variants';
import type { LobbyViewProps } from './types';

export function LobbyView({
  players,
  roomCode,
  isHost,
  isLoading,
  error,
  onStartGame,
  onCopyCode,
  isStarting,
  canStart,
}: LobbyViewProps) {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="mb-2 text-4xl font-bold text-gray-900">
            Waiting Room
          </h1>
          <p className="text-lg text-gray-600">
            {isHost
              ? 'Waiting for players to join...'
              : 'Waiting for host to start the game...'}
          </p>
        </motion.div>

        {/* Room Code */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <RoomCodeDisplay code={roomCode} onCopy={onCopyCode} />
        </motion.div>

        {/* Player Count */}
        <motion.div
          className="rounded-lg bg-white p-4 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Players ({players.length})
            </h2>
            {players.length < 2 && isHost && (
              <span className="text-sm text-gray-500">
                Need at least 2 players to start
              </span>
            )}
          </div>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            role="alert"
          >
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </motion.div>
        )}

        {/* Player List */}
        {!isLoading && (
          <motion.div
            className="space-y-3"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {players.length === 0 ? (
              <motion.div
                className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-8 text-center"
                variants={fadeIn}
              >
                <p className="text-gray-500">No players in the room yet</p>
              </motion.div>
            ) : (
              players.map((player, index) => (
                <motion.div key={player.id} variants={fadeIn} layout>
                  <PlayerCard player={player} showScore={false} />
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {/* Host Controls */}
        {isHost && (
          <motion.div
            className="pt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Button
              variant="primary"
              size="lg"
              onClick={onStartGame}
              disabled={!canStart || isStarting}
              className="w-full"
              aria-label={
                isStarting
                  ? 'Starting game...'
                  : canStart
                    ? 'Start game'
                    : 'Need at least 2 players to start'
              }
            >
              {isStarting ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  Starting Game...
                </span>
              ) : (
                'Start Game'
              )}
            </Button>
            {!canStart && (
              <p className="mt-2 text-center text-sm text-gray-500">
                Wait for at least one more player to join
              </p>
            )}
          </motion.div>
        )}

        {/* Non-Host Message */}
        {!isHost && (
          <motion.div
            className="text-center text-sm text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            The host will start the game when ready
          </motion.div>
        )}
      </div>
    </div>
  );
}
