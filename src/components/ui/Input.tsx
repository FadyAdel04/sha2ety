import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, helperText, error, leftIcon, rightIcon, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full text-right">
        {label && (
          <label
            htmlFor={inputId}
            className="block mb-1.5 text-sm font-bold text-[var(--dp-color-ink)] select-none"
          >
            {label}
            {props.required && <span className="text-rose-500 mr-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {rightIcon && (
            <div className="absolute right-3.5 flex items-center pointer-events-none text-[var(--dp-color-ink)] opacity-70">
              {rightIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full bg-[var(--dp-color-panel)] text-[var(--dp-color-ink)] placeholder:text-[#8890a4]',
              'border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)]',
              'px-4 py-3 text-sm font-medium transition-all duration-[180ms]',
              'focus:bg-white focus:outline-none focus:shadow-hard focus:border-[var(--dp-color-accent)]',
              'disabled:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed',
              rightIcon && 'pr-11',
              leftIcon && 'pl-11',
              error && 'border-rose-500 focus:border-rose-500',
              className
            )}
            {...props}
          />
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-[var(--dp-color-ink)] opacity-70">
              {leftIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-xs font-semibold text-rose-600 flex items-center gap-1">
            <span>⚠</span> {error}
          </p>
        )}
        {!error && helperText && (
          <p className="mt-1.5 text-xs text-[#626d84]">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

