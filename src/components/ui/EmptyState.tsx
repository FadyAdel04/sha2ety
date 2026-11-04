import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { Sparkles } from 'lucide-react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'relative bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-8 sm:p-12 text-center shadow-hard flex flex-col items-center justify-center max-w-xl mx-auto',
        className
      )}
    >
      {/* Decorative Geometric Icon Bubble with offset */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-[var(--dp-color-accent-warm)] rounded-2xl border-[2.5px] border-[var(--dp-color-outline)] translate-x-1.5 translate-y-1.5" />
        <div className="relative w-20 h-20 bg-[var(--dp-color-field-soft)] rounded-2xl border-[3px] border-[var(--dp-color-outline)] flex items-center justify-center text-[var(--dp-color-accent)]">
          {icon || <Sparkles className="w-10 h-10 stroke-[2.2]" />}
        </div>
      </div>

      <h3 className="text-xl sm:text-2xl font-black text-[var(--dp-color-ink)] mb-2">
        {title}
      </h3>
      <p className="text-sm sm:text-base text-[#626d84] max-w-md mx-auto mb-6 leading-relaxed">
        {description}
      </p>

      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

