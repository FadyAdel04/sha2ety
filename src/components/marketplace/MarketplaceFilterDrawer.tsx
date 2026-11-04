import React, { useEffect } from 'react';
import { MarketplaceFilters, FilterState } from './MarketplaceFilters';
import { X, Filter } from 'lucide-react';

export interface MarketplaceFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: Partial<FilterState>;
  onApply: (filters: FilterState) => void;
  onReset: () => void;
}

export const MarketplaceFilterDrawer: React.FC<MarketplaceFilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onApply,
  onReset,
}) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKey);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 lg:hidden overflow-hidden flex"
      role="dialog"
      aria-modal="true"
      aria-label="لوحة تصفية نتائج العقارات"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#253044]/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Panel from Right (in RTL) */}
      <div className="relative mr-auto w-full max-w-md bg-[var(--dp-color-panel)] h-full shadow-2xl flex flex-col z-10 border-l-[3px] border-[var(--dp-color-outline)] overflow-y-auto">
        {/* Drawer Header */}
        <div className="sticky top-0 bg-[var(--dp-color-panel)] z-20 px-5 py-4 border-b-[2px] border-[var(--dp-color-outline)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--dp-color-accent)] text-white flex items-center justify-center font-bold">
              <Filter className="w-4 h-4 stroke-[2.5]" />
            </div>
            <h2 className="text-base font-black text-[var(--dp-color-ink)]">
              تصفية العقارات
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl border border-[var(--dp-color-outline)] bg-[var(--dp-color-ground)] hover:bg-gray-100 text-[var(--dp-color-ink)] cursor-pointer"
            aria-label="إغلاق لوحة التصفية"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-4 flex-1">
          <MarketplaceFilters
            initialFilters={filters}
            onApply={onApply}
            onReset={onReset}
            onCloseDrawer={onClose}
          />
        </div>
      </div>
    </div>
  );
};

