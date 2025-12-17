'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/common';
import { fadeIn, slideUp, staggerContainer } from '@/components/motion';
import { NameForm } from './NameForm';
import { ActionButtons } from './ActionButtons';
import type { LandingViewProps } from './types';

/**
 * LandingView Component
 *
 * Presentational component for the landing page.
 * Displays the game title, name input, and action buttons with animations.
 *
 * This is a pure UI component - all logic is handled by LandingContainer.
 *
 * @example
 * ```tsx
 * <LandingView
 *   playerName={name}
 *   onNameChange={setName}
 *   onCreateRoom={handleCreate}
 *   onJoinRoom={handleJoin}
 *   isCreating={loading}
 *   error={error}
 * />
 * ```
 */
export function LandingView({
  playerName,
  onNameChange,
  onCreateRoom,
  onJoinRoom,
  isCreating,
  error,
}: LandingViewProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-violet-50 via-white to-purple-50 p-4 dark:from-zinc-950 dark:via-black dark:to-purple-950">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="w-full max-w-md space-y-8"
      >
        {/* Title Section */}
        <motion.div variants={fadeIn} className="text-center space-y-2">
          <h1 className="text-5xl font-bold bg-linear-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent dark:from-violet-400 dark:to-purple-400">
            Triviamania
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Real-time multiplayer trivia
          </p>
        </motion.div>

        {/* Form Card */}
        <motion.div variants={slideUp}>
          <Card className="p-8 space-y-6 shadow-xl">
            {/* Error Display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm dark:bg-red-950/30 dark:border-red-900 dark:text-red-400"
                role="alert"
              >
                {error}
              </motion.div>
            )}

            {/* Name Input */}
            <NameForm
              value={playerName}
              onChange={onNameChange}
              disabled={isCreating}
            />

            {/* Action Buttons */}
            <ActionButtons
              onCreateRoom={onCreateRoom}
              onJoinRoom={onJoinRoom}
              disabled={playerName.trim().length < 2}
              isCreating={isCreating}
            />
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.p
          variants={fadeIn}
          className="text-center text-sm text-zinc-500 dark:text-zinc-600"
        >
          No signup required • Just enter your name and play
        </motion.p>
      </motion.div>
    </div>
  );
}
