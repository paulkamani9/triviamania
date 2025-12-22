import { forwardRef } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Animated button with spring interaction
 * Respects prefers-reduced-motion for accessibility
 */
const Button = forwardRef(function Button(
  {
    children,
    variant = "primary",
    size = "md",
    className = "",
    disabled,
    ...props
  },
  ref
) {
  const shouldReduceMotion = useReducedMotion();

  const variants = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    accent: "btn-accent",
    ghost: "btn-ghost",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <motion.button
      ref={ref}
      whileHover={disabled || shouldReduceMotion ? {} : { scale: 1.02 }}
      whileTap={disabled || shouldReduceMotion ? {} : { scale: 0.98 }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : { type: "spring", stiffness: 400, damping: 25 }
      }
      className={`${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
});

export default Button;
