import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'warm' | 'fresh' | 'muted' | 'outline' | 'danger';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'primary',
  size = 'md',
  dot = false,
  children,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center font-bold border-[2px] border-[var(--dp-color-outline)] rounded-full select-none';

  const variantStyles = {
    primary: 'bg-[var(--dp-color-selection)] text-[var(--dp-color-accent)]',
    secondary: 'bg-[var(--dp-color-accent-secondary)]/20 text-[#be185d]',
    warm: 'bg-[var(--dp-color-accent-warm)] text-[var(--dp-color-ink)]',
    fresh: 'bg-[var(--dp-color-accent-fresh)] text-[var(--dp-color-ink)]',
    muted: 'bg-[#f3f4f6] text-[var(--dp-color-ink)]',
    outline: 'bg-[var(--dp-color-panel)] text-[var(--dp-color-ink)]',
    danger: 'bg-rose-100 text-rose-700',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-3 py-1 gap-1.5',
  };

  const dotColors = {
    primary: 'bg-[var(--dp-color-accent)]',
    secondary: 'bg-[var(--dp-color-accent-secondary)]',
    warm: 'bg-amber-600',
    fresh: 'bg-emerald-600',
    muted: 'bg-gray-500',
    outline: 'bg-[var(--dp-color-ink)]',
    danger: 'bg-rose-600',
  };

  return (
    <span className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)} {...props}>
      {dot && <span className={cn('w-2 h-2 rounded-full border border-[var(--dp-color-outline)]', dotColors[variant])} />}
      <span>{children}</span>
    </span>
  );
};

