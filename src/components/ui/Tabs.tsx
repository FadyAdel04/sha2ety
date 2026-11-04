import React from 'react';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className }) => {
  return (
    <div
      className={cn(
        'inline-flex flex-wrap items-center gap-2 p-1.5 bg-[#ffffff] border-[3px] border-[var(--dp-color-outline)] rounded-[calc(var(--dp-radius-corner)+4px)] shadow-hard-sm',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-[var(--dp-radius-corner)] transition-all duration-[180ms] cursor-pointer select-none',
              isActive
                ? 'bg-[var(--dp-color-accent-warm)] text-[var(--dp-color-ink)] border-[2.5px] border-[var(--dp-color-outline)] shadow-hard-sm -translate-y-0.5'
                : 'text-[#505a71] hover:text-[var(--dp-color-ink)] hover:bg-[var(--dp-color-ground)] border-[2.5px] border-transparent'
            )}
          >
            {tab.icon && <span className="inline-flex shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  'px-2 py-0.5 text-xs rounded-full font-bold border border-[var(--dp-color-outline)]',
                  isActive ? 'bg-white text-[var(--dp-color-ink)]' : 'bg-gray-100 text-[#505a71]'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

