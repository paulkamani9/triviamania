/**
 * RoomCodeDisplay Component
 *
 * Displays a room code in a prominent, easy-to-read format with copy functionality.
 * Provides visual feedback when code is copied to clipboard.
 *
 * @example
 * ```tsx
 * <RoomCodeDisplay
 *   code="ABCD1234"
 *   onCopy={() => console.log('Copied!')}
 * />
 * ```
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../Button';

interface RoomCodeDisplayProps {
  code: string;
  onCopy?: () => void;
}

export function RoomCodeDisplay({ code, onCopy }: RoomCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy room code:', error);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">Room Code</p>
      <div className="flex items-center gap-2">
        <motion.div
          className="flex-1 rounded-lg border-2 border-dashed border-blue-500 bg-blue-50 p-4 text-center font-mono text-2xl font-bold tracking-widest text-blue-700"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          {code}
        </motion.div>
        <Button
          variant="ghost"
          size="md"
          onClick={handleCopy}
          aria-label={copied ? 'Room code copied' : 'Copy room code'}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </Button>
      </div>
      {copied && (
        <motion.p
          className="text-sm text-green-600"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          Room code copied to clipboard!
        </motion.p>
      )}
    </div>
  );
}
