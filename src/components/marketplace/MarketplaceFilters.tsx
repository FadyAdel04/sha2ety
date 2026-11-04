import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Filter, RotateCcw, Check, Sparkles } from 'lucide-react';

export interface FilterState {
  type: string;
  governorate: string;
  city: string;
  district: string;
  minPrice: string;
  maxPrice: string;
  minArea: string;
  maxArea: string;
  bedrooms: number | null;
  bathrooms: number | null;
  floor: string;
  finishing: string;
  hasElevator: boolean;
  hasGarage: boolean;
  hasBalcony: boolean;
  verifiedOnly: boolean;
}

export interface MarketplaceFiltersProps {
  initialFilters?: Partial<FilterState>;
  onApply: (filters: FilterState) => void;
  onReset: () => void;
  onCloseDrawer?: () => void;
}

export const MarketplaceFilters: React.FC<MarketplaceFiltersProps> = ({
  initialFilters,
  onApply,
  onReset,
  onCloseDrawer,
}) => {
  const [type, setType] = useState(initialFilters?.type || 'all');
  const [governorate, setGovernorate] = useState(initialFilters?.governorate || 'all');
  const [city, setCity] = useState(initialFilters?.city || 'all');
  const [district, setDistrict] = useState(initialFilters?.district || '');
  const [minPrice, setMinPrice] = useState(initialFilters?.minPrice || '');
  const [maxPrice, setMaxPrice] = useState(initialFilters?.maxPrice || '');
  const [minArea, setMinArea] = useState(initialFilters?.minArea || '');
  const [maxArea, setMaxArea] = useState(initialFilters?.maxArea || '');
  const [bedrooms, setBedrooms] = useState<number | null>(initialFilters?.bedrooms ?? null);
  const [bathrooms, setBathrooms] = useState<number | null>(initialFilters?.bathrooms ?? null);
  const [floor, setFloor] = useState(initialFilters?.floor || 'all');
  const [finishing, setFinishing] = useState(initialFilters?.finishing || 'all');
  const [hasElevator, setHasElevator] = useState(initialFilters?.hasElevator || false);
  const [hasGarage, setHasGarage] = useState(initialFilters?.hasGarage || false);
  const [hasBalcony, setHasBalcony] = useState(initialFilters?.hasBalcony || false);
  const [verifiedOnly, setVerifiedOnly] = useState(initialFilters?.verifiedOnly || false);

  useEffect(() => {
    if (initialFilters) {
      if (initialFilters.type !== undefined) setType(initialFilters.type);
      if (initialFilters.governorate !== undefined) setGovernorate(initialFilters.governorate);
      if (initialFilters.city !== undefined) setCity(initialFilters.city);
      if (initialFilters.district !== undefined) setDistrict(initialFilters.district);
      if (initialFilters.minPrice !== undefined) setMinPrice(initialFilters.minPrice);
      if (initialFilters.maxPrice !== undefined) setMaxPrice(initialFilters.maxPrice);
      if (initialFilters.minArea !== undefined) setMinArea(initialFilters.minArea);
      if (initialFilters.maxArea !== undefined) setMaxArea(initialFilters.maxArea);
      if (initialFilters.bedrooms !== undefined) setBedrooms(initialFilters.bedrooms);
      if (initialFilters.bathrooms !== undefined) setBathrooms(initialFilters.bathrooms);
      if (initialFilters.floor !== undefined) setFloor(initialFilters.floor);
      if (initialFilters.finishing !== undefined) setFinishing(initialFilters.finishing);
      if (initialFilters.hasElevator !== undefined) setHasElevator(initialFilters.hasElevator);
      if (initialFilters.hasGarage !== undefined) setHasGarage(initialFilters.hasGarage);
      if (initialFilters.hasBalcony !== undefined) setHasBalcony(initialFilters.hasBalcony);
      if (initialFilters.verifiedOnly !== undefined) setVerifiedOnly(initialFilters.verifiedOnly);
    }
  }, [initialFilters]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApply({
      type,
      governorate,
      city,
      district,
      minPrice,
      maxPrice,
      minArea,
      maxArea,
      bedrooms,
      bathrooms,
      floor,
      finishing,
      hasElevator,
      hasGarage,
      hasBalcony,
      verifiedOnly,
    });
    onCloseDrawer?.();
  };

  const handleReset = () => {
    setType('all');
    setGovernorate('all');
    setCity('all');
    setDistrict('');
    setMinPrice('');
    setMaxPrice('');
    setMinArea('');
    setMaxArea('');
    setBedrooms(null);
    setBathrooms(null);
    setFloor('all');
    setFinishing('all');
    setHasElevator(false);
    setHasGarage(false);
    setHasBalcony(false);
    setVerifiedOnly(false);
    onReset();
    onCloseDrawer?.();
  };

  return (
    <div className="bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-5 sm:p-6 shadow-hard text-right">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b-2 border-[#ece9db] mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--dp-color-accent-fresh)] border border-[var(--dp-color-outline)] flex items-center justify-center text-[var(--dp-color-ink)]">
            <Filter className="w-4 h-4 stroke-[2.5]" />
          </div>
          <h3 className="text-base font-black text-[var(--dp-color-ink)]">
            تصفية نتائج البحث
          </h3>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="text-xs font-bold text-[#626d84] hover:text-rose-600 inline-flex items-center gap-1 cursor-pointer transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>إعادة ضبط</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 1. نوع العقار */}
        <div>
          <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-2">
            نوع العقار
          </label>
          <div className="grid grid-cols-2 gap-1.5 text-xs font-bold">
            {[
              { id: 'all', label: 'كل الأنواع' },
              { id: 'شقة', label: 'شقق سكنية' },
              { id: 'فيلا', label: 'فيلات مستقلة' },
              { id: 'دوبلكس', label: 'دوبلكس' },
              { id: 'منزل', label: 'منازل' },
              { id: 'شاليه', label: 'شاليهات' },
              { id: 'تجاري', label: 'تجاري وإداري' },
              { id: 'أرض', label: 'أراضٍ' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setType(item.id)}
                className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                  type === item.id
                    ? 'bg-[var(--dp-color-accent)] text-white border-[var(--dp-color-outline)] shadow-hard-sm'
                    : 'bg-[var(--dp-color-ground)] text-[var(--dp-color-ink)] border-[var(--dp-color-outline)] hover:bg-[var(--dp-color-selection)]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. المحافظة والمدينة */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1">
              المحافظة
            </label>
            <select
              value={governorate}
              onChange={(e) => {
                setGovernorate(e.target.value);
                setCity('all');
              }}
              className="w-full bg-[var(--dp-color-ground)] border-[2px] border-[var(--dp-color-outline)] rounded-xl px-2.5 py-2 text-xs font-bold text-[var(--dp-color-ink)]"
            >
              <option value="all">الكل</option>
              <option value="القاهرة">القاهرة</option>
              <option value="الجيزة">الجيزة</option>
              <option value="الإسكندرية">الإسكندرية</option>
              <option value="الساحل الشمالي">الساحل الشمالي</option>
              <option value="البحر الأحمر">البحر الأحمر</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1">
              المدينة
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-[var(--dp-color-ground)] border-[2px] border-[var(--dp-color-outline)] rounded-xl px-2.5 py-2 text-xs font-bold text-[var(--dp-color-ink)]"
            >
              <option value="all">كل المدن</option>
              <option value="القاهرة الجديدة">القاهرة الجديدة</option>
              <option value="الشيخ زايد">الشيخ زايد</option>
              <option value="6 أكتوبر">6 أكتوبر</option>
              <option value="المعادي">المعادي</option>
              <option value="الساحل الشمالي">الساحل الشمالي</option>
              <option value="الجونة">الجونة</option>
              <option value="الإسكندرية">الإسكندرية</option>
            </select>
          </div>
        </div>

        {/* 3. المنطقة / الحي */}
        <div>
          <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1">
            المنطقة أو اسم الكمبوند
          </label>
          <Input
            placeholder="مثال: التجمع، ميفيدا، زايد..."
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
          />
        </div>

        {/* 4. السعر من وإلى */}
        <div>
          <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1.5">
            السعر المطلوب (ج.م)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="من"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <Input
              type="number"
              placeholder="إلى"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
        </div>

        {/* 5. المساحة من وإلى */}
        <div>
          <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1.5">
            المساحة الإجمالية (م²)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="من م²"
              value={minArea}
              onChange={(e) => setMinArea(e.target.value)}
            />
            <Input
              type="number"
              placeholder="إلى م²"
              value={maxArea}
              onChange={(e) => setMaxArea(e.target.value)}
            />
          </div>
        </div>

        {/* 6. عدد الغرف */}
        <div>
          <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-2">
            عدد غرف النوم
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setBedrooms(bedrooms === num ? null : num)}
                className={`w-10 h-9 rounded-xl border-[2px] text-xs font-black transition-all cursor-pointer ${
                  bedrooms === num
                    ? 'bg-[var(--dp-color-accent)] text-white border-[var(--dp-color-outline)] shadow-hard-sm'
                    : 'bg-[var(--dp-color-ground)] text-[var(--dp-color-ink)] border-[var(--dp-color-outline)] hover:bg-[var(--dp-color-selection)]'
                }`}
              >
                {num === 5 ? '+5' : num}
              </button>
            ))}
          </div>
        </div>

        {/* 7. عدد الحمامات */}
        <div>
          <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-2">
            عدد الحمامات
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[1, 2, 3, 4].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setBathrooms(bathrooms === num ? null : num)}
                className={`w-10 h-9 rounded-xl border-[2px] text-xs font-black transition-all cursor-pointer ${
                  bathrooms === num
                    ? 'bg-[var(--dp-color-accent-warm)] text-[var(--dp-color-ink)] border-[var(--dp-color-outline)] shadow-hard-sm'
                    : 'bg-[var(--dp-color-ground)] text-[var(--dp-color-ink)] border-[var(--dp-color-outline)] hover:bg-[var(--dp-color-selection)]'
                }`}
              >
                {num === 4 ? '+4' : num}
              </button>
            ))}
          </div>
        </div>

        {/* 8. الدور */}
        <div>
          <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1">
            الدور
          </label>
          <select
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
            className="w-full bg-[var(--dp-color-ground)] border-[2px] border-[var(--dp-color-outline)] rounded-xl px-2.5 py-2 text-xs font-bold text-[var(--dp-color-ink)]"
          >
            <option value="all">كل الأدوار</option>
            <option value="ground">دور أرضي (مع حديقة أو مدخل خاص)</option>
            <option value="typical">أدوار متكررة</option>
            <option value="last_roof">دور أخير / روف (بنتهاوس)</option>
          </select>
        </div>

        {/* 9. التشطيب */}
        <div>
          <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1">
            مستوى التشطيب
          </label>
          <select
            value={finishing}
            onChange={(e) => setFinishing(e.target.value)}
            className="w-full bg-[var(--dp-color-ground)] border-[2px] border-[var(--dp-color-outline)] rounded-xl px-2.5 py-2 text-xs font-bold text-[var(--dp-color-ink)]"
          >
            <option value="all">كل حالات التشطيب</option>
            <option value="ultra_super_lux">ألترا سوبر لوكس</option>
            <option value="super_lux">سوبر لوكس</option>
            <option value="semi_finished">نصف تشطيب</option>
            <option value="core_shell">بدون تشطيب (على المحارة)</option>
          </select>
        </div>

        {/* 10. المميزات والمواصفات (وجود مصعد، جراج، شرفة، موثق فقط) */}
        <div className="pt-2 border-t border-[#ece9db] space-y-2.5">
          <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1">
            المميزات والخدمات
          </label>

          <Checkbox
            label="وجود مصعد (أسانسير)"
            checked={hasElevator}
            onChange={(e) => setHasElevator(e.target.checked)}
          />

          <Checkbox
            label="وجود جراج خاص للسيارة"
            checked={hasGarage}
            onChange={(e) => setHasGarage(e.target.checked)}
          />

          <Checkbox
            label="وجود شرفة أو تراس مفتوح"
            checked={hasBalcony}
            onChange={(e) => setHasBalcony(e.target.checked)}
          />

          <div className="pt-1">
            <Checkbox
              label="عقارات موثقة المستندات فقط"
              description="عرض الإعلانات المفحوصة والمطابقة للشروط"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
            />
          </div>
        </div>

        {/* Apply CTA */}
        <div className="pt-3">
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full justify-center shadow-hard"
            rightIcon={<Check className="w-4 h-4 stroke-[2.5]" />}
          >
            تطبيق الفلترة
          </Button>
        </div>
      </form>
    </div>
  );
};

