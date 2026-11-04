import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { Input } from './Input';
import { Checkbox } from './Checkbox';
import { RotateCcw, Filter } from 'lucide-react';

export interface FilterValues {
  minPrice?: string;
  maxPrice?: string;
  minArea?: string;
  maxArea?: string;
  bedrooms?: number | null;
  finishing?: string;
  verifiedOnly?: boolean;
}

export interface FilterPanelProps {
  initialValues?: FilterValues;
  onApply: (values: FilterValues) => void;
  onReset: () => void;
  className?: string;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  initialValues,
  onApply,
  onReset,
  className,
}) => {
  const [minPrice, setMinPrice] = useState(initialValues?.minPrice || '');
  const [maxPrice, setMaxPrice] = useState(initialValues?.maxPrice || '');
  const [minArea, setMinArea] = useState(initialValues?.minArea || '');
  const [maxArea, setMaxArea] = useState(initialValues?.maxArea || '');
  const [bedrooms, setBedrooms] = useState<number | null>(initialValues?.bedrooms ?? null);
  const [finishing, setFinishing] = useState(initialValues?.finishing || 'all');
  const [verifiedOnly, setVerifiedOnly] = useState(initialValues?.verifiedOnly || false);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    onApply({
      minPrice,
      maxPrice,
      minArea,
      maxArea,
      bedrooms,
      finishing,
      verifiedOnly,
    });
  };

  const handleReset = () => {
    setMinPrice('');
    setMaxPrice('');
    setMinArea('');
    setMaxArea('');
    setBedrooms(null);
    setFinishing('all');
    setVerifiedOnly(false);
    onReset();
  };

  return (
    <div
      className={cn(
        'bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-5 shadow-hard text-right',
        className
      )}
    >
      <div className="flex items-center justify-between pb-4 border-b-2 border-[#e5e7eb] mb-5">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-[var(--dp-color-accent)] stroke-[2.5]" />
          <h3 className="text-lg font-black text-[var(--dp-color-ink)]">تصفية العقارات</h3>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="text-xs font-bold text-[#626d84] hover:text-rose-600 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          إعادة ضبط
        </button>
      </div>

      <form onSubmit={handleApply} className="space-y-5">
        {/* Price range */}
        <div>
          <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-2">
            السعر (جنيه مصري ج.م)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="من"
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <Input
              placeholder="إلى"
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
        </div>

        {/* Area range */}
        <div>
          <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-2">
            المساحة (متر مربع م²)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="من"
              type="number"
              value={minArea}
              onChange={(e) => setMinArea(e.target.value)}
            />
            <Input
              placeholder="إلى"
              type="number"
              value={maxArea}
              onChange={(e) => setMaxArea(e.target.value)}
            />
          </div>
        </div>

        {/* Bedrooms buttons */}
        <div>
          <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-2">
            عدد غرف النوم
          </label>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setBedrooms(bedrooms === num ? null : num)}
                className={cn(
                  'w-10 h-10 rounded-xl border-[2px] border-[var(--dp-color-outline)] text-xs font-black transition-all cursor-pointer',
                  bedrooms === num
                    ? 'bg-[var(--dp-color-accent)] text-white shadow-hard-sm'
                    : 'bg-[var(--dp-color-ground)] text-[var(--dp-color-ink)] hover:bg-[var(--dp-color-selection)]'
                )}
              >
                {num === 5 ? '+5' : num}
              </button>
            ))}
          </div>
        </div>

        {/* Finishing */}
        <div>
          <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-2">
            حالة التشطيب
          </label>
          <select
            value={finishing}
            onChange={(e) => setFinishing(e.target.value)}
            className="w-full bg-[var(--dp-color-ground)] border-[2.5px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] px-3 py-2.5 text-xs font-bold text-[var(--dp-color-ink)]"
          >
            <option value="all">الكل</option>
            <option value="ultra_super_lux">ألترا سوبر لوكس</option>
            <option value="super_lux">سوبر لوكس</option>
            <option value="semi_finished">نصف تشطيب</option>
            <option value="core_shell">بدون تشطيب (على المحارة)</option>
          </select>
        </div>

        {/* Verified only checkbox */}
        <div className="pt-2">
          <Checkbox
            label="العقارات الموثقة فقط"
            description="عرض العقارات التي تم التحقق من مستنداتها الرسمية"
            checked={verifiedOnly}
            onChange={(e) => setVerifiedOnly(e.target.checked)}
          />
        </div>

        {/* Submit */}
        <div className="pt-3">
          <Button type="submit" variant="primary" size="md" className="w-full justify-center">
            تطبيق الفلترة
          </Button>
        </div>
      </form>
    </div>
  );
};

