import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PropertyCard, PropertyItem } from '@/components/ui/PropertyCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { MarketplaceSearchBar, SearchBarValues } from '@/components/marketplace/MarketplaceSearchBar';
import { MarketplaceFilters, FilterState } from '@/components/marketplace/MarketplaceFilters';
import { MarketplaceFilterDrawer } from '@/components/marketplace/MarketplaceFilterDrawer';
import { MarketInsightsCard } from '@/components/marketplace/MarketInsightsCard';
import { ComparisonFloatingDock } from '@/components/marketplace/ComparisonFloatingDock';
import { fetchPublishedProperties } from '@/services/propertyService';
import { useAuth } from '@/context/AuthContext';
import { getBuyerFavorites, toggleBuyerFavorite } from '@/services/buyerService';
import {
  SlidersHorizontal,
  ArrowUpDown,
  RotateCcw,
  X,
  Sparkles,
  MapPin,
  Building,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export const PropertiesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL-driven filter states
  const governorateParam = searchParams.get('governorate') || 'all';
  const cityParam = searchParams.get('city') || 'all';
  const districtParam = searchParams.get('district') || searchParams.get('location') || '';
  const typeParam = searchParams.get('type') || 'all';
  const minPriceParam = searchParams.get('minPrice') || '';
  const maxPriceParam = searchParams.get('maxPrice') || '';
  const minAreaParam = searchParams.get('minArea') || '';
  const maxAreaParam = searchParams.get('maxArea') || '';
  const bedroomsParam = searchParams.get('bedrooms');
  const bathroomsParam = searchParams.get('bathrooms');
  const floorParam = searchParams.get('floor') || 'all';
  const finishingParam = searchParams.get('finishing') || 'all';
  const hasElevatorParam = searchParams.get('hasElevator') === 'true';
  const hasGarageParam = searchParams.get('hasGarage') === 'true';
  const hasBalconyParam = searchParams.get('hasBalcony') === 'true';
  const verifiedOnlyParam = searchParams.get('verifiedOnly') === 'true';
  const sortParam = (searchParams.get('sort') as any) || 'newest';
  const pageParam = Number(searchParams.get('page')) || 1;

  // Local state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    const favs = getBuyerFavorites(user?.id);
    setFavoriteIds(favs.map((f) => f.id));
  }, [user?.id]);

  const handleFavoriteToggle = (id: string, isFav: boolean) => {
    setFavoriteIds((prev) => {
      const updated = isFav ? [...prev, id] : prev.filter((item) => item !== id);
      return updated;
    });
    const prop = properties.find((p) => p.id === id);
    if (prop) {
      toggleBuyerFavorite(prop, user?.id);
    }
  };

  // Fetch properties whenever query parameters change
  const loadProperties = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);

    try {
      const result = await fetchPublishedProperties({
        governorate: governorateParam,
        city: cityParam,
        district: districtParam,
        type: typeParam,
        minPrice: minPriceParam ? Number(minPriceParam) : null,
        maxPrice: maxPriceParam ? Number(maxPriceParam) : null,
        minArea: minAreaParam ? Number(minAreaParam) : null,
        maxArea: maxAreaParam ? Number(maxAreaParam) : null,
        bedrooms: bedroomsParam !== null ? Number(bedroomsParam) : null,
        bathrooms: bathroomsParam !== null ? Number(bathroomsParam) : null,
        floor: floorParam,
        finishing: finishingParam,
        hasElevator: hasElevatorParam,
        hasGarage: hasGarageParam,
        hasBalcony: hasBalconyParam,
        verifiedOnly: verifiedOnlyParam,
        sort: sortParam,
        page: pageParam,
        pageSize: 6,
      });

      setProperties(result.properties);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error('Error fetching properties:', err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [
    governorateParam,
    cityParam,
    districtParam,
    typeParam,
    minPriceParam,
    maxPriceParam,
    minAreaParam,
    maxAreaParam,
    bedroomsParam,
    bathroomsParam,
    floorParam,
    finishingParam,
    hasElevatorParam,
    hasGarageParam,
    hasBalconyParam,
    verifiedOnlyParam,
    sortParam,
    pageParam,
  ]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  // Handle Search Bar Submit
  const handleSearchBarSubmit = (values: SearchBarValues) => {
    const next = new URLSearchParams(searchParams);
    if (values.governorate && values.governorate !== 'all') next.set('governorate', values.governorate);
    else next.delete('governorate');

    if (values.city && values.city !== 'all') next.set('city', values.city);
    else next.delete('city');

    if (values.district.trim()) next.set('district', values.district.trim());
    else {
      next.delete('district');
      next.delete('location');
    }

    if (values.type && values.type !== 'all') next.set('type', values.type);
    else next.delete('type');

    if (values.minPrice) next.set('minPrice', values.minPrice);
    else next.delete('minPrice');

    if (values.maxPrice) next.set('maxPrice', values.maxPrice);
    else next.delete('maxPrice');

    next.set('page', '1');
    setSearchParams(next);
  };

  // Handle Filters Panel Submit
  const handleFiltersApply = (filters: FilterState) => {
    const next = new URLSearchParams(searchParams);

    if (filters.type && filters.type !== 'all') next.set('type', filters.type);
    else next.delete('type');

    if (filters.governorate && filters.governorate !== 'all') next.set('governorate', filters.governorate);
    else next.delete('governorate');

    if (filters.city && filters.city !== 'all') next.set('city', filters.city);
    else next.delete('city');

    if (filters.district.trim()) next.set('district', filters.district.trim());
    else next.delete('district');

    if (filters.minPrice) next.set('minPrice', filters.minPrice);
    else next.delete('minPrice');

    if (filters.maxPrice) next.set('maxPrice', filters.maxPrice);
    else next.delete('maxPrice');

    if (filters.minArea) next.set('minArea', filters.minArea);
    else next.delete('minArea');

    if (filters.maxArea) next.set('maxArea', filters.maxArea);
    else next.delete('maxArea');

    if (filters.bedrooms !== null) next.set('bedrooms', String(filters.bedrooms));
    else next.delete('bedrooms');

    if (filters.bathrooms !== null) next.set('bathrooms', String(filters.bathrooms));
    else next.delete('bathrooms');

    if (filters.floor && filters.floor !== 'all') next.set('floor', filters.floor);
    else next.delete('floor');

    if (filters.finishing && filters.finishing !== 'all') next.set('finishing', filters.finishing);
    else next.delete('finishing');

    if (filters.hasElevator) next.set('hasElevator', 'true');
    else next.delete('hasElevator');

    if (filters.hasGarage) next.set('hasGarage', 'true');
    else next.delete('hasGarage');

    if (filters.hasBalcony) next.set('hasBalcony', 'true');
    else next.delete('hasBalcony');

    if (filters.verifiedOnly) next.set('verifiedOnly', 'true');
    else next.delete('verifiedOnly');

    next.set('page', '1');
    setSearchParams(next);
  };

  // Remove individual filter chip
  const removeFilterParam = (key: string) => {
    const next = new URLSearchParams(searchParams);
    next.delete(key);
    if (key === 'district') next.delete('location');
    next.set('page', '1');
    setSearchParams(next);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchParams({});
  };

  // Sorting change
  const handleSortChange = (newSort: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('sort', newSort);
    next.set('page', '1');
    setSearchParams(next);
  };

  // Pagination change
  const handlePageChange = (newPage: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(newPage));
    setSearchParams(next);
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  // Count active filters for badge
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (governorateParam !== 'all') count++;
    if (cityParam !== 'all') count++;
    if (districtParam) count++;
    if (typeParam !== 'all') count++;
    if (minPriceParam) count++;
    if (maxPriceParam) count++;
    if (minAreaParam) count++;
    if (maxAreaParam) count++;
    if (bedroomsParam !== null) count++;
    if (bathroomsParam !== null) count++;
    if (floorParam !== 'all') count++;
    if (finishingParam !== 'all') count++;
    if (hasElevatorParam) count++;
    if (hasGarageParam) count++;
    if (hasBalconyParam) count++;
    if (verifiedOnlyParam) count++;
    return count;
  }, [
    governorateParam,
    cityParam,
    districtParam,
    typeParam,
    minPriceParam,
    maxPriceParam,
    minAreaParam,
    maxAreaParam,
    bedroomsParam,
    bathroomsParam,
    floorParam,
    finishingParam,
    hasElevatorParam,
    hasGarageParam,
    hasBalconyParam,
    verifiedOnlyParam,
  ]);

  return (
    <div className="min-h-screen bg-[var(--dp-color-ground)] text-[var(--dp-color-ink)] flex flex-col selection:bg-[var(--dp-color-selection)] selection:text-[var(--dp-color-accent)]">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        {/* ----------------------------------------------------
            1. Page Introduction: Compact Geometric Composition
           ---------------------------------------------------- */}
        <section className="relative">
          <div className="bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-6 sm:p-10 shadow-hard text-right relative overflow-hidden">
            {/* Geometric Accent Shapes in corner */}
            <div
              className="absolute -top-6 -left-6 w-24 h-24 rounded-full bg-[var(--dp-color-accent-warm)] border-[2.5px] border-[var(--dp-color-outline)] shadow-hard-sm pointer-events-none hidden sm:block"
              aria-hidden="true"
            />
            <div
              className="absolute -bottom-6 -left-2 w-16 h-16 rounded-2xl bg-[var(--dp-color-accent-secondary)] border-[2.5px] border-[var(--dp-color-outline)] rotate-12 pointer-events-none hidden sm:block"
              aria-hidden="true"
            />

            <div className="max-w-2xl relative z-10 space-y-2.5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[var(--dp-color-accent-fresh)] border-[2px] border-[var(--dp-color-outline)] text-xs font-black shadow-hard-sm">
                <Sparkles className="w-4 h-4 stroke-[2.5]" />
                <span>سوق العقارات الموثقة في مصر</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-[var(--dp-color-ink)] leading-tight">
                المكان المناسب ليك موجود.
              </h1>

              <p className="text-sm sm:text-lg text-[#4a5568] font-medium leading-relaxed">
                استكشف العقارات المتاحة للبيع واختار اللي يناسب ذوقك وميزانيتك.
              </p>
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------
            2. Search Bar: Comprehensive Functional Filters
           ---------------------------------------------------- */}
        <section>
          <MarketplaceSearchBar
            initialValues={{
              governorate: governorateParam,
              city: cityParam,
              district: districtParam,
              type: typeParam,
              minPrice: minPriceParam,
              maxPrice: maxPriceParam,
            }}
            onSearch={handleSearchBarSubmit}
            onClear={clearAllFilters}
          />
        </section>

        {/* ----------------------------------------------------
            Smart Market Insights Card (Real platform metrics)
           ---------------------------------------------------- */}
        <section>
          <MarketInsightsCard city={cityParam} propertyType={typeParam} />
        </section>

        {/* ----------------------------------------------------
            Active Filter Chips Strip & Removal
           ---------------------------------------------------- */}
        {activeFiltersCount > 0 && (
          <section className="bg-[var(--dp-color-panel)] border-[2.5px] border-[var(--dp-color-outline)] rounded-2xl p-4 shadow-hard-sm flex flex-wrap items-center justify-between gap-3 text-right">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-[var(--dp-color-ink)]">
                الفلاتر النشطة ({activeFiltersCount}):
              </span>

              {governorateParam !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--dp-color-selection)] border border-[var(--dp-color-outline)] rounded-full text-xs font-bold text-[var(--dp-color-accent)]">
                  <span>المحافظة: {governorateParam}</span>
                  <button
                    type="button"
                    onClick={() => removeFilterParam('governorate')}
                    className="hover:text-rose-600 cursor-pointer"
                    aria-label="إزالة فلتر المحافظة"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}

              {cityParam !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--dp-color-selection)] border border-[var(--dp-color-outline)] rounded-full text-xs font-bold text-[var(--dp-color-accent)]">
                  <span>المدينة: {cityParam}</span>
                  <button
                    type="button"
                    onClick={() => removeFilterParam('city')}
                    className="hover:text-rose-600 cursor-pointer"
                    aria-label="إزالة فلتر المدينة"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}

              {districtParam && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--dp-color-accent-warm)] border border-[var(--dp-color-outline)] rounded-full text-xs font-black text-[var(--dp-color-ink)]">
                  <span>المنطقة: {districtParam}</span>
                  <button
                    type="button"
                    onClick={() => removeFilterParam('district')}
                    className="hover:text-rose-600 cursor-pointer"
                    aria-label="إزالة فلتر المنطقة"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}

              {typeParam !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--dp-color-accent-fresh)] border border-[var(--dp-color-outline)] rounded-full text-xs font-black text-[var(--dp-color-ink)]">
                  <span>النوع: {typeParam}</span>
                  <button
                    type="button"
                    onClick={() => removeFilterParam('type')}
                    className="hover:text-rose-600 cursor-pointer"
                    aria-label="إزالة فلتر النوع"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}

              {minPriceParam && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[var(--dp-color-outline)] rounded-full text-xs font-bold">
                  <span>السعر من: {Number(minPriceParam).toLocaleString('ar-EG')} ج.م</span>
                  <button
                    type="button"
                    onClick={() => removeFilterParam('minPrice')}
                    className="hover:text-rose-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}

              {maxPriceParam && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[var(--dp-color-outline)] rounded-full text-xs font-bold">
                  <span>السعر إلى: {Number(maxPriceParam).toLocaleString('ar-EG')} ج.م</span>
                  <button
                    type="button"
                    onClick={() => removeFilterParam('maxPrice')}
                    className="hover:text-rose-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}

              {bedroomsParam !== null && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[var(--dp-color-outline)] rounded-full text-xs font-bold">
                  <span>الغرف: {bedroomsParam}</span>
                  <button
                    type="button"
                    onClick={() => removeFilterParam('bedrooms')}
                    className="hover:text-rose-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}

              {hasElevatorParam && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[var(--dp-color-outline)] rounded-full text-xs font-bold">
                  <span>وجود مصعد</span>
                  <button
                    type="button"
                    onClick={() => removeFilterParam('hasElevator')}
                    className="hover:text-rose-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}

              {hasGarageParam && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[var(--dp-color-outline)] rounded-full text-xs font-bold">
                  <span>وجود جراج</span>
                  <button
                    type="button"
                    onClick={() => removeFilterParam('hasGarage')}
                    className="hover:text-rose-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}

              {verifiedOnlyParam && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--dp-color-accent-warm)] border border-[var(--dp-color-outline)] rounded-full text-xs font-black">
                  <span>موثق فقط</span>
                  <button
                    type="button"
                    onClick={() => removeFilterParam('verifiedOnly')}
                    className="hover:text-rose-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs font-black text-rose-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>مسح كل الفلاتر</span>
            </button>
          </section>
        )}

        {/* ----------------------------------------------------
            Main Content Layout (Filters Sidebar + Results Grid)
           ---------------------------------------------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Desktop Filters Sidebar (3 or 4 cols) */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-24">
            <MarketplaceFilters
              initialFilters={{
                type: typeParam,
                governorate: governorateParam,
                city: cityParam,
                district: districtParam,
                minPrice: minPriceParam,
                maxPrice: maxPriceParam,
                minArea: minAreaParam,
                maxArea: maxAreaParam,
                bedrooms: bedroomsParam !== null ? Number(bedroomsParam) : null,
                bathrooms: bathroomsParam !== null ? Number(bathroomsParam) : null,
                floor: floorParam,
                finishing: finishingParam,
                hasElevator: hasElevatorParam,
                hasGarage: hasGarageParam,
                hasBalcony: hasBalconyParam,
                verifiedOnly: verifiedOnlyParam,
              }}
              onApply={handleFiltersApply}
              onReset={clearAllFilters}
            />
          </aside>

          {/* Results Column (8 cols on desktop) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Header bar: Results count, Mobile drawer trigger, Sorting dropdown */}
            <div className="bg-[var(--dp-color-panel)] border-[2.5px] border-[var(--dp-color-outline)] rounded-2xl p-4 shadow-hard-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-right">
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                <span className="text-sm font-black text-[var(--dp-color-ink)]">
                  تم العثور على{' '}
                  <span className="text-[var(--dp-color-accent)] font-display text-base">
                    {totalCount} عقار
                  </span>{' '}
                  متاح للبيع
                </span>

                {/* Mobile Drawer Trigger Button */}
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(true)}
                  className="lg:hidden p-2 rounded-xl border-[2px] border-[var(--dp-color-outline)] bg-[var(--dp-color-ground)] hover:bg-[var(--dp-color-selection)] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-hard-sm"
                  aria-label="تصفية النتائج"
                >
                  <SlidersHorizontal className="w-4 h-4 text-[var(--dp-color-accent)]" />
                  <span>تصفية</span>
                  {activeFiltersCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-[var(--dp-color-accent)] text-white text-[10px] font-black flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Sorting Dropdown */}
              <div className="flex items-center gap-2 text-xs font-bold w-full sm:w-auto justify-end">
                <ArrowUpDown className="w-4 h-4 text-[#626d84]" />
                <span className="text-[#626d84]">ترتيب حسب:</span>
                <select
                  value={sortParam}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="bg-[var(--dp-color-ground)] border-[2px] border-[var(--dp-color-outline)] rounded-xl px-3 py-2 text-xs font-bold text-[var(--dp-color-ink)] cursor-pointer focus:outline-none focus:border-[var(--dp-color-accent)]"
                >
                  <option value="newest">الأحدث</option>
                  <option value="price_asc">الأقل سعراً</option>
                  <option value="price_desc">الأعلى سعراً</option>
                  <option value="area_desc">الأكبر مساحة</option>
                </select>
              </div>
            </div>

            {/* Error State */}
            {hasError && (
              <div className="p-6 bg-rose-50 border-[2.5px] border-rose-500 rounded-[var(--dp-radius-corner)] text-center space-y-3">
                <p className="text-sm font-bold text-rose-700">
                  حدث خطأ أثناء تحميل العقارات من قاعدة البيانات.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={loadProperties}
                  rightIcon={<RefreshCw className="w-4 h-4" />}
                >
                  إعادة المحاولة
                </Button>
              </div>
            )}

            {/* Loading Skeletons */}
            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} variant="card" className="h-[430px]" />
                ))}
              </div>
            )}

            {/* Property Cards Grid */}
            {!isLoading && !hasError && properties.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {properties.map((prop) => (
                  <PropertyCard
                    key={prop.id}
                    property={prop}
                    isFavoriteInitial={favoriteIds.includes(prop.id)}
                    onFavoriteToggle={handleFavoriteToggle}
                  />
                ))}
              </div>
            )}

            {/* Empty State Illustration */}
            {!isLoading && !hasError && properties.length === 0 && (
              <EmptyState
                title="لم نجد أي عقار يطابق اختياراتك"
                description="جرب توسيع نطاق السعر أو تغيير المدينة أو مسح بعض الفلاتر لاستعراض كافة العقارات المعتمدة المتاحة."
                actionLabel="مسح كافة الفلاتر والبحث مجدداً"
                onAction={clearAllFilters}
              />
            )}

            {/* Pagination */}
            {!isLoading && !hasError && totalPages > 1 && (
              <div className="pt-4">
                <Pagination
                  currentPage={pageParam}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Accessible Mobile Filters Drawer */}
      <MarketplaceFilterDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        filters={{
          type: typeParam,
          governorate: governorateParam,
          city: cityParam,
          district: districtParam,
          minPrice: minPriceParam,
          maxPrice: maxPriceParam,
          minArea: minAreaParam,
          maxArea: maxAreaParam,
          bedrooms: bedroomsParam !== null ? Number(bedroomsParam) : null,
          bathrooms: bathroomsParam !== null ? Number(bathroomsParam) : null,
          floor: floorParam,
          finishing: finishingParam,
          hasElevator: hasElevatorParam,
          hasGarage: hasGarageParam,
          hasBalcony: hasBalconyParam,
          verifiedOnly: verifiedOnlyParam,
        }}
        onApply={handleFiltersApply}
        onReset={clearAllFilters}
      />

      {/* Floating Property Comparison Dock */}
      <ComparisonFloatingDock />

      <Footer />
    </div>
  );
};
