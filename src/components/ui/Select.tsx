import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options?: Option[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, helperText, error, options = [], placeholder, id, children, ...props }, ref) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;

    return (
      <div className="w-full text-right">
        {label && (
          <label
            htmlFor={selectId}
            className="block mb-1.5 text-sm font-bold text-[var(--dp-color-ink)] select-none"
          >
            {label}
            {props.required && <span className="text-rose-500 mr-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'w-full bg-[var(--dp-color-panel)] text-[var(--dp-color-ink)] appearance-none cursor-pointer',
              'border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)]',
              'pr-4 pl-10 py-3 text-sm font-medium transition-all duration-[180ms]',
              'focus:bg-white focus:outline-none focus:shadow-hard focus:border-[var(--dp-color-accent)]',
              'disabled:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed',
              error && 'border-rose-500 focus:border-rose-500',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
            {children}
          </select>
          <div className="absolute left-3.5 flex items-center pointer-events-none text-[var(--dp-color-ink)]">
            <ChevronDown className="w-4 h-4" />
          </div>
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

Select.displayName = 'Select';

