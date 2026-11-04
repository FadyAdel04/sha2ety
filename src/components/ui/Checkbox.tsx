import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: React.ReactNode;
  description?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, id, checked, ...props }, ref) => {
    const generatedId = React.useId();
    const checkboxId = id || generatedId;

    return (
      <label
        htmlFor={checkboxId}
        className={cn(
          'flex items-start gap-3 cursor-pointer select-none group',
          props.disabled && 'opacity-60 cursor-not-allowed',
          className
        )}
      >
        <div className="relative flex items-center justify-center mt-0.5">
          <input
            ref={ref}
            id={checkboxId}
            type="checkbox"
            checked={checked}
            className="peer sr-only"
            {...props}
          />
          <div
            className={cn(
              'w-5 h-5 rounded-md border-[2.5px] border-[var(--dp-color-outline)] bg-[var(--dp-color-panel)]',
              'transition-all duration-[180ms] flex items-center justify-center',
              'peer-checked:bg-[var(--dp-color-accent)] peer-checked:text-white peer-checked:border-[var(--dp-color-outline)]',
              'group-hover:shadow-hard-sm peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--dp-color-accent)]'
            )}
          >
            <Check className="w-3.5 h-3.5 stroke-[3] opacity-0 peer-checked:opacity-100 transition-opacity" />
          </div>
        </div>
        <div className="text-right">
          <span className="text-sm font-bold text-[var(--dp-color-ink)] block leading-snug">
            {label}
          </span>
          {description && (
            <span className="text-xs text-[#626d84] block mt-0.5">{description}</span>
          )}
        </div>
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';

