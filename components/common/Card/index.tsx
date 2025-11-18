/**
 * Card Component
 *
 * A container component for grouping related content.
 * Includes subcomponents for header, title, and content.
 * Animates on mount with fade-in effect.
 *
 * @example
 * ```tsx
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Player Lobby</CardTitle>
 *   </CardHeader>
 *   <CardContent>
 *     {/* Content here *\/}
 *   </CardContent>
 * </Card>
 * ```
 */

import { forwardRef, HTMLAttributes } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { fadeIn } from '@/components/motion/variants';
import { standard } from '@/components/motion/transitions';

export const Card = forwardRef<HTMLDivElement, HTMLMotionProps<'div'>>(
  ({ children, className, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={`rounded-xl border border-gray-200 bg-white p-6 shadow-sm ${className || ''}`}
        variants={fadeIn}
        transition={standard}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = ({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={`mb-4 ${className || ''}`} {...props}>
      {children}
    </div>
  );
};

CardHeader.displayName = 'CardHeader';

export const CardTitle = ({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) => {
  return (
    <h3
      className={`text-lg font-semibold text-gray-900 ${className || ''}`}
      {...props}
    >
      {children}
    </h3>
  );
};

CardTitle.displayName = 'CardTitle';

export const CardContent = ({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
};

CardContent.displayName = 'CardContent';
