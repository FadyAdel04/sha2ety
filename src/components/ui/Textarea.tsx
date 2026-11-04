import React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, helperText, error, id, rows = 4, ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = id || generatedId;

    return (
      <div className="w-full text-right">
        {label && (
          <label
            htmlFor={textareaId}
            className="block mb-1.5 text-sm font-bold text-[var(--dp-color-ink)] select-none"
          >
            {label}
            {props.required && <span className="text-rose-500 mr-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={cn(
            'w-full bg-[var(--dp-color-panel)] text-[var(--dp-color-ink)] placeholder:text-[#8890a4]',
            'border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)]',
            'p-4 text-sm font-medium transition-all duration-[180ms]',
            'focus:bg-white focus:outline-none focus:shadow-hard focus:border-[var(--dp-color-accent)]',
            'disabled:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed',
            error && 'border-rose-500 focus:border-rose-500',
            className
          )}
          {...props}
        />
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

Textarea.displayName = 'Textarea';

