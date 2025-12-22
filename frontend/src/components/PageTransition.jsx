import { motion, useReducedMotion } from "framer-motion";

/**
 * Animated page wrapper with slide transitions
 * Respects prefers-reduced-motion for accessibility
 */
export default function PageTransition({ children, className = "" }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -20 }}
      transition={
        shouldReduceMotion
          ? { duration: 0.1 }
          : { duration: 0.3, ease: "easeOut" }
      }
      className={className}
    >
      {children}
    </motion.div>
  );
}
