import React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'rect' | 'circle' | 'card';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rect',
  ...props
}) => {
  if (variant === 'circle') {
    return (
      <div
        className={cn(
          'w-12 h-12 rounded-full border-[2.5px] border-[var(--dp-color-outline)] bg-[#f0eee4] animate-pulse shrink-0',
          className
        )}
        {...props}
      />
    );
  }

  if (variant === 'card') {
    return (
      <div
        className={cn(
          'bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-4 shadow-hard flex flex-col gap-4 animate-pulse',
          className
        )}
        {...props}
      >
        <div className="w-full h-48 bg-[#ece8d8] rounded-xl border-[2px] border-[var(--dp-color-outline)]" />
        <div className="h-6 w-3/4 bg-[#ded8c4] rounded-lg" />
        <div className="h-4 w-1/2 bg-[#ded8c4] rounded-lg" />
        <div className="flex gap-2 pt-2">
          <div className="h-8 w-20 bg-[#ece8d8] rounded-lg border border-[var(--dp-color-outline)]" />
          <div className="h-8 w-20 bg-[#ece8d8] rounded-lg border border-[var(--dp-color-outline)]" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-[#ece8d8] rounded-[calc(var(--dp-radius-corner)/2)] border-[2px] border-[#d8d2be] animate-pulse',
        className
      )}
      {...props}
    />
  );
};

