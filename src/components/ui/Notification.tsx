import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';

export interface NotificationProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

export const Notification: React.FC<NotificationProps> = ({
  variant = 'info',
  title,
  message,
  onClose,
  className,
}) => {
  const variantConfig = {
    info: {
      border: 'border-[var(--dp-color-outline)]',
      bg: 'bg-[var(--dp-color-selection)]',
      accentStrip: 'bg-[var(--dp-color-accent)]',
      icon: <Info className="w-5 h-5 text-[var(--dp-color-accent)] stroke-[2.5]" />,
    },
    success: {
      border: 'border-[var(--dp-color-outline)]',
      bg: 'bg-[var(--dp-color-field-soft)]',
      accentStrip: 'bg-[var(--dp-color-accent-fresh)]',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 stroke-[2.5]" />,
    },
    warning: {
      border: 'border-[var(--dp-color-outline)]',
      bg: 'bg-amber-50',
      accentStrip: 'bg-[var(--dp-color-accent-warm)]',
      icon: <AlertCircle className="w-5 h-5 text-amber-600 stroke-[2.5]" />,
    },
    error: {
      border: 'border-[var(--dp-color-outline)]',
      bg: 'bg-rose-50',
      accentStrip: 'bg-rose-500',
      icon: <XCircle className="w-5 h-5 text-rose-600 stroke-[2.5]" />,
    },
  };

  const config = variantConfig[variant];

  return (
    <div
      role="alert"
      className={cn(
        'relative overflow-hidden flex items-start gap-3 p-4 rounded-[var(--dp-radius-corner)] border-[3px] shadow-hard transition-all duration-[180ms]',
        config.border,
        config.bg,
        className
      )}
    >
      {/* Accent strip on the right border (in RTL) */}
      <div className={cn('absolute right-0 top-0 bottom-0 w-2.5', config.accentStrip)} />

      <div className="mr-2 shrink-0 mt-0.5">{config.icon}</div>

      <div className="flex-1 text-right">
        {title && (
          <h4 className="text-sm font-black text-[var(--dp-color-ink)] mb-0.5">{title}</h4>
        )}
        <p className="text-sm text-[var(--dp-color-ink)] leading-relaxed">{message}</p>
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg border border-[var(--dp-color-outline)] bg-white/80 hover:bg-white text-[var(--dp-color-ink)] transition-colors cursor-pointer shrink-0"
          aria-label="إغلاق التنبيه"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>
      )}
    </div>
  );
};

