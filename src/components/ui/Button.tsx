import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'warm' | 'pink' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-bold transition-all duration-[180ms] cursor-pointer select-none rounded-[var(--dp-radius-corner)] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';

    const variantStyles = {
      primary:
        'bg-[var(--dp-color-accent)] text-white border-[3px] border-[var(--dp-color-outline)] shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg active:translate-x-0.5 active:translate-y-0.5 active:shadow-hard-sm',
      secondary:
        'bg-[var(--dp-color-accent-fresh)] text-[var(--dp-color-ink)] border-[3px] border-[var(--dp-color-outline)] shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg active:translate-x-0.5 active:translate-y-0.5 active:shadow-hard-sm',
      warm:
        'bg-[var(--dp-color-accent-warm)] text-[var(--dp-color-ink)] border-[3px] border-[var(--dp-color-outline)] shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg active:translate-x-0.5 active:translate-y-0.5 active:shadow-hard-sm',
      pink:
        'bg-[var(--dp-color-accent-secondary)] text-[var(--dp-color-ink)] border-[3px] border-[var(--dp-color-outline)] shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg active:translate-x-0.5 active:translate-y-0.5 active:shadow-hard-sm',
      outline:
        'bg-[var(--dp-color-panel)] text-[var(--dp-color-ink)] border-[3px] border-[var(--dp-color-outline)] shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg active:translate-x-0.5 active:translate-y-0.5 active:shadow-hard-sm',
      ghost:
        'bg-transparent text-[var(--dp-color-ink)] border-[3px] border-transparent hover:bg-[var(--dp-color-selection)] hover:border-[var(--dp-color-outline)]',
      danger:
        'bg-rose-500 text-white border-[3px] border-[var(--dp-color-outline)] shadow-hard hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg active:translate-x-0.5 active:translate-y-0.5 active:shadow-hard-sm',
    };

    const sizeStyles = {
      sm: 'text-xs px-3 py-1.5 gap-1.5 min-h-[36px]',
      md: 'text-sm px-5 py-2.5 gap-2 min-h-[46px]',
      lg: 'text-base px-6 py-3.5 gap-2.5 min-h-[54px]',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading && (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block ml-2" />
        )}
        {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
        <span>{children}</span>
        {!isLoading && leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

