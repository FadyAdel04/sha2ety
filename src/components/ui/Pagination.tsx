import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight, ChevronLeft } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className,
}) => {
  if (totalPages <= 1) return null;

  const pages: (number | string)[] = [];
  const delta = 1;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <nav
      role="navigation"
      aria-label="التنقل بين الصفحات"
      className={cn('flex items-center justify-center gap-2 select-none py-4', className)}
    >
      {/* Previous button (RTL: ChevronRight points to earlier/next depending on direction, in Arabic RTL chevron right goes to previous page) */}
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="w-10 h-10 rounded-xl border-[2.5px] border-[var(--dp-color-outline)] bg-[var(--dp-color-panel)] flex items-center justify-center text-[var(--dp-color-ink)] shadow-hard-sm hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-x-0 transition-all cursor-pointer"
        aria-label="الصفحة السابقة"
      >
        <ChevronRight className="w-5 h-5 stroke-[2.5]" />
      </button>

      {/* Page Numbers */}
      {pages.map((p, idx) => {
        if (p === '...') {
          return (
            <span key={`dots-${idx}`} className="px-2 text-sm font-bold text-[#8890a4]">
              ...
            </span>
          );
        }

        const pageNum = p as number;
        const isActive = pageNum === currentPage;

        return (
          <button
            key={pageNum}
            type="button"
            onClick={() => onPageChange(pageNum)}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'w-10 h-10 rounded-xl border-[2.5px] border-[var(--dp-color-outline)] text-sm font-black transition-all cursor-pointer flex items-center justify-center',
              isActive
                ? 'bg-[var(--dp-color-accent)] text-white shadow-hard-sm -translate-y-0.5'
                : 'bg-[var(--dp-color-panel)] text-[var(--dp-color-ink)] hover:bg-[var(--dp-color-selection)] shadow-hard-sm'
            )}
          >
            {pageNum}
          </button>
        );
      })}

      {/* Next button */}
      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="w-10 h-10 rounded-xl border-[2.5px] border-[var(--dp-color-outline)] bg-[var(--dp-color-panel)] flex items-center justify-center text-[var(--dp-color-ink)] shadow-hard-sm hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-x-0 transition-all cursor-pointer"
        aria-label="الصفحة التالية"
      >
        <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
      </button>
    </nav>
  );
};

