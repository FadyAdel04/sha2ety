import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  showCloseButton = true,
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#253044]/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Container with Violet Offset Backing */}
      <div className={cn('relative w-full z-10 my-8 transition-all', sizeClasses[size])}>
        {/* Decorative Violet Backing Layer */}
        <div
          className="absolute inset-0 bg-[var(--dp-color-accent)] rounded-[calc(var(--dp-radius-corner)+4px)] translate-x-2 translate-y-2 border-[3px] border-[var(--dp-color-outline)]"
          aria-hidden="true"
        />

        {/* Main Book-like Panel */}
        <div className="relative bg-[var(--dp-color-panel)] rounded-[var(--dp-radius-corner)] border-[3px] border-[var(--dp-color-outline)] p-6 sm:p-8 overflow-hidden">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b-2 border-[#e5e7eb] mb-5">
            <div>
              {title && (
                <h3 className="text-xl sm:text-2xl font-black text-[var(--dp-color-ink)]">
                  {title}
                </h3>
              )}
              {description && (
                <p className="mt-1 text-sm text-[#626d84] leading-relaxed">
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl border-[2px] border-[var(--dp-color-outline)] bg-[var(--dp-color-ground)] hover:bg-[var(--dp-color-accent-secondary)] transition-colors cursor-pointer text-[var(--dp-color-ink)] shrink-0"
                aria-label="إغلاق"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            )}
          </div>

          {/* Body */}
          <div className="text-[var(--dp-color-ink)] text-sm sm:text-base leading-relaxed">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="mt-6 pt-4 border-t-2 border-[#e5e7eb] flex items-center justify-end gap-3 flex-wrap">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

