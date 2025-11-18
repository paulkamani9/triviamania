/**
 * Input Component
 *
 * A text input field with label, error state, and helper text support.
 * Fully accessible with proper ARIA attributes.
 *
 * @example
 * ```tsx
 * <Input
 *   id="name"
 *   label="Player Name"
 *   placeholder="Enter your name"
 *   error="Name is required"
 * />
 * ```
 */

import { forwardRef, InputHTMLAttributes, useId } from 'react';
import { motion } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';

const inputVariants = cva(
  'w-full rounded-lg border px-3 py-2 text-base transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
        error: 'border-red-500 focus:border-red-500 focus:ring-red-500',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface InputProps
  extends InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ variant, label, error, helperText, className, id, ...props }, ref) => {
    const generatedId = useId();
    const inputVariant = error ? 'error' : variant;
    const inputId = id || generatedId;

    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
            {props.required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={inputVariants({ variant: inputVariant, className })}
          aria-invalid={!!error}
          aria-describedby={
            error
              ? `${inputId}-error`
              : helperText
                ? `${inputId}-helper`
                : undefined
          }
          {...props}
        />
        {error && (
          <motion.p
            id={`${inputId}-error`}
            className="text-sm text-red-600"
            role="alert"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {error}
          </motion.p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
