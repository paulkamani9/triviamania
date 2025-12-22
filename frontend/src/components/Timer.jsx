import { motion, useReducedMotion } from "framer-motion";
import { GAME_CONFIG } from "../constants";

/**
 * Animated countdown timer with color states
 * Supports both 'seconds' and 'timeRemaining' props for compatibility
 */
export default function Timer({
  seconds,
  timeRemaining,
  total = GAME_CONFIG.QUESTION_TIME_LIMIT,
}) {
  const shouldReduceMotion = useReducedMotion();
  const time = seconds ?? timeRemaining ?? 0;
  const percentage = (time / total) * 100;

  // Determine color state
  let colorClass = "timer-safe";
  let bgColor = "bg-accent-400";
  let ariaLabel = "Time remaining";

  if (time <= GAME_CONFIG.TIMER_CRITICAL) {
    colorClass = "timer-critical";
    bgColor = "bg-red-500";
    ariaLabel = "Time running out!";
  } else if (time <= GAME_CONFIG.TIMER_WARNING) {
    colorClass = "timer-warning";
    bgColor = "bg-yellow-400";
    ariaLabel = "Time is low";
  }

  return (
    <div
      className="w-full"
      role="timer"
      aria-live="polite"
      aria-label={ariaLabel}
    >
      {/* Timer bar */}
      <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${bgColor}`}
          initial={{ width: "100%" }}
          animate={{ width: `${percentage}%` }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 0.3, ease: "linear" }
          }
        />
      </div>

      {/* Time display - announce every 5 seconds or when critical */}
      <div
        className={`mt-2 text-center font-display font-bold text-2xl ${colorClass}`}
        aria-atomic="true"
      >
        <span className="sr-only">{ariaLabel}: </span>
        {time}s
      </div>
    </div>
  );
}
