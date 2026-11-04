import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Search, MapPin, Building2, Coins, RotateCcw } from 'lucide-react';

export interface SearchBarValues {
  governorate: string;
  city: string;
  district: string;
  type: string;
  minPrice: string;
  maxPrice: string;
}

export interface MarketplaceSearchBarProps {
  initialValues?: Partial<SearchBarValues>;
  onSearch: (values: SearchBarValues) => void;
  onClear: () => void;
}

export const MarketplaceSearchBar: React.FC<MarketplaceSearchBarProps> = ({
  initialValues,
  onSearch,
  onClear,
}) => {
  const [governorate, setGovernorate] = useState(initialValues?.governorate || 'all');
  const [city, setCity] = useState(initialValues?.city || 'all');
  const [district, setDistrict] = useState(initialValues?.district || '');
  const [type, setType] = useState(initialValues?.type || 'all');
  const [minPrice, setMinPrice] = useState(initialValues?.minPrice || '');
  const [maxPrice, setMaxPrice] = useState(initialValues?.maxPrice || '');

  // Keep synced if URL params change externally
  useEffect(() => {
    if (initialValues) {
      setGovernorate(initialValues.governorate || 'all');
      setCity(initialValues.city || 'all');
      setDistrict(initialValues.district || '');
      setType(initialValues.type || 'all');
      setMinPrice(initialValues.minPrice || '');
      setMaxPrice(initialValues.maxPrice || '');
    }
  }, [initialValues]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      governorate,
      city,
      district,
      type,
      minPrice,
      maxPrice,
    });
  };

  const handleClear = () => {
    setGovernorate('all');
    setCity('all');
    setDistrict('');
    setType('all');
    setMinPrice('');
    setMaxPrice('');
    onClear();
  };

  // Cities mapped according to selected governorate
  const getCityOptions = () => {
    switch (governorate) {
      case 'القاهرة':
        return [
          { value: 'all', label: 'كل مناطق القاهرة' },
          { value: 'القاهرة الجديدة', label: 'القاهرة الجديدة والتجمع' },
          { value: 'المعادي', label: 'المعادي ودجلة' },
          { value: 'مدينة نصر', label: 'مدينة نصر ومصر الجديدة' },
          { value: 'الشروق', label: 'الشروق ومدينتي' },
        ];
      case 'الجيزة':
        return [
          { value: 'all', label: 'كل مناطق الجيزة' },
          { value: 'الشيخ زايد', label: 'الشيخ زايد' },
          { value: '6 أكتوبر', label: 'مدينة 6 أكتوبر' },
          { value: 'الدقي والمهندسين', label: 'الدقي والمهندسين' },
          { value: 'الهرم وفيصل', label: 'الهرم وفيصل' },
        ];
      case 'الإسكندرية':
        return [
          { value: 'all', label: 'كل الإسكندرية' },
          { value: 'سموحة', label: 'سموحة' },
          { value: 'كفر عبده', label: 'كفر عبده ورشدي' },
          { value: 'ميامي والمنتزه', label: 'ميامي والمنتزه' },
          { value: 'العجمي', label: 'العجمي والبيطاش' },
        ];
      case 'الساحل الشمالي':
        return [
          { value: 'all', label: 'كل الساحل ومطروح' },
          { value: 'سيدي عبد الرحمن', label: 'سيدي عبد الرحمن' },
          { value: 'رأس الحكمة', label: 'رأس الحكمة' },
          { value: 'العلمين الجديدة', label: 'العلمين الجديدة' },
        ];
      case 'البحر الأحمر':
        return [
          { value: 'all', label: 'كل البحر الأحمر' },
          { value: 'الجونة', label: 'الجونة' },
          { value: 'الغردقة', label: 'الغردقة' },
          { value: 'سهل حشيش', label: 'سهل حشيش' },
        ];
      default:
        return [
          { value: 'all', label: 'كل المدن' },
          { value: 'القاهرة الجديدة', label: 'القاهرة الجديدة' },
          { value: 'الشيخ زايد', label: 'الشيخ زايد' },
          { value: '6 أكتوبر', label: '6 أكتوبر' },
          { value: 'المعادي', label: 'المعادي' },
          { value: 'الساحل الشمالي', label: 'الساحل الشمالي' },
          { value: 'الجونة', label: 'الجونة' },
          { value: 'الإسكندرية', label: 'الإسكندرية' },
        ];
    }
  };

  return (
    <div className="relative w-full">
      {/* Violet Backing Plate */}
      <div
        className="absolute inset-0 bg-[var(--dp-color-accent)] rounded-[calc(var(--dp-radius-corner)+6px)] translate-x-2.5 translate-y-2.5 border-[3px] border-[var(--dp-color-outline)]"
        aria-hidden="true"
      />

      {/* Main White Outlined Panel */}
      <div className="relative bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-5 sm:p-7 shadow-hard text-right">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {/* 1. المحافظة */}
            <div>
              <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[var(--dp-color-accent)]" />
                <span>المحافظة</span>
              </label>
              <select
                value={governorate}
                onChange={(e) => {
                  setGovernorate(e.target.value);
                  setCity('all');
                }}
                className="w-full bg-[var(--dp-color-ground)] border-[2.5px] border-[var(--dp-color-outline)] rounded-xl px-3 py-2.5 text-xs font-bold text-[var(--dp-color-ink)] focus:outline-none focus:border-[var(--dp-color-accent)]"
              >
                <option value="all">كل المحافظات</option>
                <option value="القاهرة">القاهرة</option>
                <option value="الجيزة">الجيزة</option>
                <option value="الإسكندرية">الإسكندرية</option>
                <option value="الساحل الشمالي">الساحل الشمالي</option>
                <option value="البحر الأحمر">البحر الأحمر</option>
              </select>
            </div>

            {/* 2. المدينة */}
            <div>
              <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1.5 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-[var(--dp-color-accent-secondary)]" />
                <span>المدينة</span>
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-[var(--dp-color-ground)] border-[2.5px] border-[var(--dp-color-outline)] rounded-xl px-3 py-2.5 text-xs font-bold text-[var(--dp-color-ink)] focus:outline-none focus:border-[var(--dp-color-accent)]"
              >
                {getCityOptions().map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. المنطقة */}
            <div>
              <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1.5">
                المنطقة / الحي
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="مثال: التجمع، ميفيدا..."
                className="w-full bg-[var(--dp-color-ground)] border-[2.5px] border-[var(--dp-color-outline)] rounded-xl px-3 py-2.5 text-xs font-bold placeholder:text-[#8b95aa] focus:outline-none focus:border-[var(--dp-color-accent)]"
              />
            </div>

            {/* 4. نوع العقار */}
            <div>
              <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1.5">
                نوع العقار
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-[var(--dp-color-ground)] border-[2.5px] border-[var(--dp-color-outline)] rounded-xl px-3 py-2.5 text-xs font-bold text-[var(--dp-color-ink)] focus:outline-none focus:border-[var(--dp-color-accent)]"
              >
                <option value="all">كل الأنواع</option>
                <option value="شقة">شقة سكنية</option>
                <option value="فيلا">فيلا مستقلة</option>
                <option value="دوبلكس">دوبلكس</option>
                <option value="منزل">منزل عائلي</option>
                <option value="شاليه">شاليه مصيفي</option>
                <option value="تجاري">مكتب / تجاري</option>
                <option value="أرض">أرض فضاء</option>
              </select>
            </div>

            {/* 5. أقل سعر */}
            <div>
              <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1.5 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-emerald-600" />
                <span>أقل سعر (ج.م)</span>
              </label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="من: 2,000,000"
                step="50000"
                className="w-full bg-[var(--dp-color-ground)] border-[2.5px] border-[var(--dp-color-outline)] rounded-xl px-3 py-2.5 text-xs font-bold placeholder:text-[#8b95aa] focus:outline-none focus:border-[var(--dp-color-accent)]"
              />
            </div>

            {/* 6. أعلى سعر */}
            <div>
              <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1.5 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-emerald-600" />
                <span>أعلى سعر (ج.م)</span>
              </label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="إلى: 10,000,000"
                step="50000"
                className="w-full bg-[var(--dp-color-ground)] border-[2.5px] border-[var(--dp-color-outline)] rounded-xl px-3 py-2.5 text-xs font-bold placeholder:text-[#8b95aa] focus:outline-none focus:border-[var(--dp-color-accent)]"
              />
            </div>
          </div>

          {/* Action Buttons: Search + Clear */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
              rightIcon={<RotateCcw className="w-4 h-4 stroke-[2.5]" />}
            >
              مسح البحث
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="px-7 shadow-hard"
              rightIcon={<Search className="w-4 h-4 stroke-[2.5]" />}
            >
              بحث في العقارات
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

