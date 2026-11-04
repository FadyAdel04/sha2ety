import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Search, MapPin, Building2, Coins, ArrowLeft } from 'lucide-react';

export const HomeSearchPanel: React.FC = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState('');
  const [propertyType, setPropertyType] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location.trim()) params.set('location', location.trim());
    if (propertyType && propertyType !== 'all') params.set('type', propertyType);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);

    navigate(`/properties?${params.toString()}`);
  };

  return (
    <div className="relative w-full max-w-6xl mx-auto">
      {/* Violet Backing Layer */}
      <div
        className="absolute inset-0 bg-[var(--dp-color-accent)] rounded-[calc(var(--dp-radius-corner)+6px)] translate-x-3 translate-y-3 border-[3px] border-[var(--dp-color-outline)]"
        aria-hidden="true"
      />

      {/* Main White Search Panel */}
      <div className="relative bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-6 sm:p-8 shadow-hard text-right">
        <form onSubmit={handleSearch}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            {/* Field 1: المحافظة أو المنطقة */}
            <div>
              <label
                htmlFor="search-location"
                className="block text-xs font-black text-[var(--dp-color-ink)] mb-2 flex items-center gap-1.5"
              >
                <MapPin className="w-4 h-4 text-[var(--dp-color-accent-secondary)]" />
                <span>المحافظة أو المنطقة</span>
              </label>
              <div className="relative">
                <input
                  id="search-location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="مثال: التجمع، الشيخ زايد، المعادي..."
                  className="w-full bg-[var(--dp-color-ground)] text-[var(--dp-color-ink)] border-[2.5px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] px-4 py-3 text-sm font-bold placeholder:text-[#8b95aa] focus:outline-none focus:border-[var(--dp-color-accent)] transition-all"
                />
              </div>
            </div>

            {/* Field 2: نوع العقار */}
            <div>
              <label
                htmlFor="search-type"
                className="block text-xs font-black text-[var(--dp-color-ink)] mb-2 flex items-center gap-1.5"
              >
                <Building2 className="w-4 h-4 text-[var(--dp-color-accent-warm)]" />
                <span>نوع العقار</span>
              </label>
              <select
                id="search-type"
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full bg-[var(--dp-color-ground)] text-[var(--dp-color-ink)] border-[2.5px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] px-4 py-3 text-sm font-bold cursor-pointer focus:outline-none focus:border-[var(--dp-color-accent)] transition-all"
              >
                <option value="all">كل الأنواع</option>
                <option value="شقة">شقق</option>
                <option value="فيلا">فيلات</option>
                <option value="منزل">منازل</option>
                <option value="تجاري">عقارات تجارية</option>
                <option value="أرض">أراضٍ</option>
              </select>
            </div>

            {/* Field 3: أقل سعر */}
            <div>
              <label
                htmlFor="search-min-price"
                className="block text-xs font-black text-[var(--dp-color-ink)] mb-2 flex items-center gap-1.5"
              >
                <Coins className="w-4 h-4 text-emerald-600" />
                <span>أقل سعر (ج.م)</span>
              </label>
              <input
                id="search-min-price"
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="من: مثلاً 1,500,000"
                step="50000"
                className="w-full bg-[var(--dp-color-ground)] text-[var(--dp-color-ink)] border-[2.5px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] px-4 py-3 text-sm font-bold placeholder:text-[#8b95aa] focus:outline-none focus:border-[var(--dp-color-accent)] transition-all"
              />
            </div>

            {/* Field 4: أعلى سعر */}
            <div>
              <label
                htmlFor="search-max-price"
                className="block text-xs font-black text-[var(--dp-color-ink)] mb-2 flex items-center gap-1.5"
              >
                <Coins className="w-4 h-4 text-emerald-600" />
                <span>أعلى سعر (ج.م)</span>
              </label>
              <input
                id="search-max-price"
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="إلى: مثلاً 8,000,000"
                step="50000"
                className="w-full bg-[var(--dp-color-ground)] text-[var(--dp-color-ink)] border-[2.5px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] px-4 py-3 text-sm font-bold placeholder:text-[#8b95aa] focus:outline-none focus:border-[var(--dp-color-accent)] transition-all"
              />
            </div>
          </div>

          {/* Search Button CTA */}
          <div className="mt-5 flex items-center justify-end">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full sm:w-auto px-8 py-3.5 text-base font-black shadow-hard hover:shadow-hard-lg"
              rightIcon={<Search className="w-5 h-5 stroke-[2.5]" />}
            >
              ابحث عن عقار
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

