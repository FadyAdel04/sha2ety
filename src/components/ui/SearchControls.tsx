import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Search, MapPin, Building, SlidersHorizontal } from 'lucide-react';
import { Button } from './Button';

export interface SearchFilters {
  keyword: string;
  city: string;
  type: string;
}

export interface SearchControlsProps {
  onSearch?: (filters: SearchFilters) => void;
  onToggleFilters?: () => void;
  className?: string;
  defaultValues?: Partial<SearchFilters>;
}

export const SearchControls: React.FC<SearchControlsProps> = ({
  onSearch,
  onToggleFilters,
  className,
  defaultValues,
}) => {
  const [keyword, setKeyword] = useState(defaultValues?.keyword || '');
  const [city, setCity] = useState(defaultValues?.city || 'all');
  const [type, setType] = useState(defaultValues?.type || 'all');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.({ keyword, city, type });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'relative bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[calc(var(--dp-radius-corner)+4px)] p-3 sm:p-4 shadow-hard-lg',
        className
      )}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Keyword / Neighborhood input */}
        <div className="md:col-span-5 relative flex items-center">
          <div className="absolute right-3.5 text-[var(--dp-color-accent)] pointer-events-none">
            <Search className="w-5 h-5 stroke-[2.5]" />
          </div>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="ابحث بالحي، الكمبوند، أو اسم المنطقة..."
            className="w-full bg-[var(--dp-color-ground)] border-[2.5px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] pr-11 pl-4 py-3 text-sm font-bold text-[var(--dp-color-ink)] placeholder:text-[#8b95aa] focus:outline-none focus:border-[var(--dp-color-accent)]"
          />
        </div>

        {/* City Select */}
        <div className="md:col-span-3 relative flex items-center">
          <div className="absolute right-3.5 text-[var(--dp-color-accent-secondary)] pointer-events-none">
            <MapPin className="w-5 h-5 stroke-[2.5]" />
          </div>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full bg-[var(--dp-color-ground)] border-[2.5px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] pr-11 pl-4 py-3 text-sm font-bold text-[var(--dp-color-ink)] cursor-pointer focus:outline-none focus:border-[var(--dp-color-accent)] appearance-none"
          >
            <option value="all">كل المحافظات</option>
            <option value="القاهرة">القاهرة (التجمع، المعادي، الشيخ زايد)</option>
            <option value="الجيزة">الجيزة (6 أكتوبر، الهرم، الدقي)</option>
            <option value="الإسكندرية">الإسكندرية (سموحة، كفر عبده)</option>
            <option value="الساحل الشمالي">الساحل الشمالي ومطروح</option>
            <option value="البحر الأحمر">البحر الأحمر (الجونة، الغردقة)</option>
          </select>
        </div>

        {/* Property Type */}
        <div className="md:col-span-2 relative flex items-center">
          <div className="absolute right-3.5 text-[var(--dp-color-accent-warm)] pointer-events-none">
            <Building className="w-5 h-5 stroke-[2.5]" />
          </div>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full bg-[var(--dp-color-ground)] border-[2.5px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] pr-11 pl-4 py-3 text-sm font-bold text-[var(--dp-color-ink)] cursor-pointer focus:outline-none focus:border-[var(--dp-color-accent)] appearance-none"
          >
            <option value="all">كل الأنواع</option>
            <option value="شقة">شقة سكنية</option>
            <option value="فيلا">فيلا مستقلة</option>
            <option value="تاون هاوس">تاون هاوس</option>
            <option value="دوبلكس">دوبلكس</option>
            <option value="شاليه">شاليه مصيفي</option>
          </select>
        </div>

        {/* Actions: Search Button + Filter Toggle Button */}
        <div className="md:col-span-2 flex items-center gap-2">
          {onToggleFilters && (
            <button
              type="button"
              onClick={onToggleFilters}
              className="p-3 bg-[var(--dp-color-ground)] border-[2.5px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] text-[var(--dp-color-ink)] hover:bg-[var(--dp-color-selection)] shadow-hard-sm cursor-pointer transition-all"
              aria-label="تصفية متقدمة"
              title="تصفية متقدمة"
            >
              <SlidersHorizontal className="w-5 h-5 stroke-[2.5]" />
            </button>
          )}
          <Button type="submit" variant="primary" size="md" className="flex-1 justify-center">
            بحث
          </Button>
        </div>
      </div>
    </form>
  );
};

