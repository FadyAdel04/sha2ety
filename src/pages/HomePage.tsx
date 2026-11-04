import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PropertyCard, PropertyItem } from '@/components/ui/PropertyCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { HomeSearchPanel } from '@/components/home/HomeSearchPanel';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { ComparisonFloatingDock } from '@/components/marketplace/ComparisonFloatingDock';
import { fetchPublishedProperties } from '@/services/propertyService';
import {
  ArrowLeft,
  CheckCircle2,
  CalendarCheck,
  FileCheck2,
  MessageCircle,
  Eye,
  ShieldAlert,
  Sparkles,
  Layers,
  Search,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('sha2ety_favorites');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [featuredProperties, setFeaturedProperties] = useState<PropertyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetchPublishedProperties({ pageSize: 6, sort: 'newest' })
      .then((res) => {
        if (isMounted) {
          setFeaturedProperties(res.properties);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load featured properties:', err);
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleFavoriteToggle = (id: string, isFav: boolean) => {
    setFavoriteIds((prev) => {
      const updated = isFav ? [...prev, id] : prev.filter((item) => item !== id);
      try {
        localStorage.setItem('sha2ety_favorites', JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-[var(--dp-color-ground)] text-[var(--dp-color-ink)] flex flex-col selection:bg-[var(--dp-color-selection)] selection:text-[var(--dp-color-accent)]">
      {/* 1. Header */}
      <Header />

      <main className="flex-1">
        {/* ----------------------------------------------------
            2. Hero Section: Editorial Split Composition
           ---------------------------------------------------- */}
        <section className="relative pt-10 sm:pt-16 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Right Side: Editorial Headline, Description, Actions */}
            <div className="lg:col-span-7 text-right space-y-6 sm:space-y-7 z-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--dp-color-accent-warm)] border-[2.5px] border-[var(--dp-color-outline)] shadow-hard-sm">
                <Sparkles className="w-4 h-4 stroke-[2.5] text-[var(--dp-color-ink)]" />
                <span className="text-xs font-black tracking-wide text-[var(--dp-color-ink)]">
                  منصة العقارات المصرية الأولى بالمعاينة المباشرة
                </span>
              </div>

              <h1 className="text-4xl sm:text-6xl lg:text-[68px] font-black text-[var(--dp-color-ink)] leading-[1.15] tracking-tight">
                مش مجرد عقار..{' '}
                <span className="relative inline-block text-[var(--dp-color-accent)]">
                  دي بداية حكاية جديدة.
                  {/* Underline highlighter */}
                  <span className="absolute bottom-2 right-0 w-full h-3.5 bg-[var(--dp-color-accent-fresh)] -z-10 rounded-sm" />
                </span>
              </h1>

              <p className="text-base sm:text-xl text-[#4a5568] leading-relaxed max-w-2xl font-medium">
                اكتشف عقارات تناسب احتياجاتك، أو اعرض عقارك للبيع ووصل للمشتري المناسب.
              </p>

              {/* Actions */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Link to="/properties">
                  <Button
                    variant="primary"
                    size="lg"
                    leftIcon={<ArrowLeft className="w-5 h-5 stroke-[2.5]" />}
                    className="shadow-hard text-base px-7 py-4"
                  >
                    استكشف العقارات
                  </Button>
                </Link>

                <Link to="/seller/properties/new">
                  <Button
                    variant="warm"
                    size="lg"
                    className="shadow-hard text-base px-7 py-4"
                  >
                    اعرض عقارك
                  </Button>
                </Link>
              </div>

              {/* Micro Trust Fact Strip */}
              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs font-bold text-[#626d84]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-[var(--dp-color-outline)]" />
                  <span>عقارات مفحوصة البيانات</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--dp-color-accent-warm)] border border-[var(--dp-color-outline)]" />
                  <span>أسعار حقيقية بالجنيه المصري (ج.م)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--dp-color-accent-secondary)] border border-[var(--dp-color-outline)]" />
                  <span>حجز مواعيد معاينة ميسرة</span>
                </div>
              </div>
            </div>

            {/* Left Side: Static Playful Geometric Assembly */}
            <div className="lg:col-span-5 relative flex items-center justify-center pt-6 lg:pt-0">
              {/* Assembly Container */}
              <div className="relative w-full max-w-[420px] aspect-4/5 flex items-center justify-center">
                {/* 1. Mint Geometric Base (Layer behind bottom) */}
                <div
                  className="absolute bottom-0 inset-x-2 h-36 bg-[var(--dp-color-accent-fresh)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] shadow-hard-lg"
                  aria-hidden="true"
                />

                {/* 2. Violet Outlined Geometric Backing Shape (offset angled plate) */}
                <div
                  className="absolute -top-3 -right-3 w-4/5 h-5/6 bg-[var(--dp-color-accent)] border-[3px] border-[var(--dp-color-outline)] rounded-t-[140px] rounded-b-[24px] shadow-hard rotate-2"
                  aria-hidden="true"
                />

                {/* 3. Pink Circle (static outlined accent shape) */}
                <div
                  className="absolute -top-5 -left-4 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[var(--dp-color-accent-secondary)] border-[3px] border-[var(--dp-color-outline)] shadow-hard z-20 flex items-center justify-center"
                  aria-hidden="true"
                >
                  <span className="text-white font-black text-xl">★</span>
                </div>

                {/* 4. The Arched Frame: Premium Natural-Color Apartment Photo */}
                <div className="relative z-10 w-full h-full p-3 flex flex-col justify-end">
                  <div className="relative w-full h-[380px] sm:h-[440px] rounded-t-[150px] rounded-b-[24px] overflow-hidden border-[3px] border-[var(--dp-color-outline)] shadow-hard bg-[#efebe0]">
                    <img
                      src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80"
                      alt="عقار مميز في مصر"
                      className="w-full h-full object-cover"
                    />

                    {/* Subtle Location tag at bottom of photo (not overlaying interior details) */}
                    <div className="absolute bottom-3 right-3 bg-[var(--dp-color-panel)]/95 border-[2px] border-[var(--dp-color-outline)] px-3 py-1.5 rounded-xl text-xs font-black shadow-hard-sm">
                      التجمع الخامس • القاهرة
                    </div>
                  </div>
                </div>

                {/* 5. Amber Block (Static accent card at the bottom-left edge) */}
                <div
                  className="absolute -bottom-4 -left-4 z-20 bg-[var(--dp-color-accent-warm)] border-[3px] border-[var(--dp-color-outline)] rounded-2xl p-3 sm:p-4 shadow-hard text-right"
                  aria-hidden="true"
                >
                  <span className="text-[11px] font-black text-[#526078] block">المعاينة الميدانية</span>
                  <span className="text-base sm:text-lg font-black text-[var(--dp-color-ink)] block">
                    مباشرة مع المالك
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------
            3. Property Search: Prominent White Search Panel with Violet Backing
           ---------------------------------------------------- */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-10 mb-20 relative z-30">
          <HomeSearchPanel />
        </section>

        {/* ----------------------------------------------------
            4. Property Categories: Title "دور على اللي يناسبك"
           ---------------------------------------------------- */}
        <CategoryGrid />

        {/* ----------------------------------------------------
            5. Featured Properties: Title "عقارات مختارة ليك"
           ---------------------------------------------------- */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 text-right">
            <div>
              <Badge variant="primary" className="mb-2">
                فرص حصرية معروضة
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-black text-[var(--dp-color-ink)]">
                عقارات مختارة ليك
              </h2>
              <p className="text-sm text-[#626d84] mt-1 font-medium">
                عقارات تمت مراجعة بياناتها ونشرها للمهتمين بالشراء الفوري
              </p>
            </div>

            <Link
              to="/properties"
              className="text-sm font-black text-[var(--dp-color-accent)] hover:underline inline-flex items-center gap-1.5 self-start sm:self-auto"
            >
              <span>مشاهدة جميع العقارات المتاحة</span>
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            </Link>
          </div>

          {/* Property Cards Grid (3 columns desktop, 2 tablet, 1 mobile) */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <div
                  key={idx}
                  className="bg-[var(--dp-color-surface)] border-[3px] border-[var(--dp-color-outline)] rounded-2xl p-4 shadow-hard flex flex-col gap-4 animate-pulse"
                >
                  <Skeleton className="w-full h-52 rounded-xl" />
                  <Skeleton className="w-3/4 h-6" />
                  <Skeleton className="w-1/2 h-4" />
                  <div className="flex gap-3 pt-2">
                    <Skeleton className="w-1/3 h-4" />
                    <Skeleton className="w-1/3 h-4" />
                    <Skeleton className="w-1/3 h-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProperties.map((prop) => (
                <PropertyCard
                  key={prop.id}
                  property={prop}
                  isFavoriteInitial={favoriteIds.includes(prop.id)}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-[var(--dp-color-surface)] border-[3px] border-[var(--dp-color-outline)] rounded-2xl shadow-hard">
              <Sparkles className="w-10 h-10 mx-auto text-[var(--dp-color-accent)] mb-3" />
              <h3 className="text-xl font-black text-[var(--dp-color-ink)] mb-2">
                لا توجد عقارات معروضة حالياً
              </h3>
              <p className="text-sm text-[#626d84] mb-5">
                كن أول من يعرض عقاره للبيع بضمان وفحص أوراق الملكية
              </p>
              <Link to="/seller/properties/new">
                <Button variant="primary" size="md">
                  أضف عقارك للبيع الآن
                </Button>
              </Link>
            </div>
          )}

          <div className="mt-12 text-center">
            <Link to="/properties">
              <Button variant="outline" size="lg" className="px-8 py-3.5 shadow-hard">
                استكشف المزيد من العقارات المعروضة
              </Button>
            </Link>
          </div>
        </section>

        {/* ----------------------------------------------------
            6. How It Works: Title "مع شقتي.. كل خطوة أوضح"
               Numbered horizontal process strip connected by a visible line
           ---------------------------------------------------- */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-right">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="warm" className="mb-3">
              دليلك البسيط
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-black text-[var(--dp-color-ink)]">
              مع شقتي.. كل خطوة أوضح
            </h2>
            <p className="text-sm sm:text-base text-[#626d84] mt-2 font-medium">
              رحلة واضحة ومباشرة من أول لحظة لغاية ما تقابل المالك في المعاينة
            </p>
          </div>

          {/* Numbered Process Strip with Visible Connecting Line */}
          <div className="relative">
            {/* Visible Connecting Line behind the steps (desktop) */}
            <div
              className="hidden lg:block absolute top-1/2 left-10 right-10 h-1 bg-[var(--dp-color-outline)] -translate-y-10 z-0"
              aria-hidden="true"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
              {/* Step 1: Shape = Rounded Square with Amber */}
              <div className="bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-6 shadow-hard flex flex-col justify-between text-right space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--dp-color-accent-warm)] border-[2.5px] border-[var(--dp-color-outline)] flex items-center justify-center font-display font-black text-2xl text-[var(--dp-color-ink)] shadow-hard-sm">
                    ١
                  </div>
                  <Badge variant="outline" size="sm">الخطوة الأولى</Badge>
                </div>
                <div>
                  <h3 className="text-lg font-black text-[var(--dp-color-ink)] mb-1.5">
                    اعرض عقارك
                  </h3>
                  <p className="text-xs sm:text-sm text-[#4a5568] leading-relaxed">
                    سجل بيانات شقتك أو فيلتك وارفع صور واضحة توضح المعالم والتفاصيل الأساسية.
                  </p>
                </div>
              </div>

              {/* Step 2: Shape = Circle with Mint */}
              <div className="bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-6 shadow-hard flex flex-col justify-between text-right space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-full bg-[var(--dp-color-accent-fresh)] border-[2.5px] border-[var(--dp-color-outline)] flex items-center justify-center font-display font-black text-2xl text-[var(--dp-color-ink)] shadow-hard-sm">
                    ٢
                  </div>
                  <Badge variant="outline" size="sm">الخطوة الثانية</Badge>
                </div>
                <div>
                  <h3 className="text-lg font-black text-[var(--dp-color-ink)] mb-1.5">
                    راجع بياناتك ومستنداتك
                  </h3>
                  <p className="text-xs sm:text-sm text-[#4a5568] leading-relaxed">
                    فريق المراجعة يتأكد من دقة واكتمال المعلومات والمستندات قبل إتاحة الإعلان للجمهور.
                  </p>
                </div>
              </div>

              {/* Step 3: Shape = Rotated Rhombus with Pink */}
              <div className="bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-6 shadow-hard flex flex-col justify-between text-right space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--dp-color-accent-secondary)] border-[2.5px] border-[var(--dp-color-outline)] flex items-center justify-center font-display font-black text-2xl text-white shadow-hard-sm rotate-3">
                    ٣
                  </div>
                  <Badge variant="outline" size="sm">الخطوة الثالثة</Badge>
                </div>
                <div>
                  <h3 className="text-lg font-black text-[var(--dp-color-ink)] mb-1.5">
                    استقبل المهتمين
                  </h3>
                  <p className="text-xs sm:text-sm text-[#4a5568] leading-relaxed">
                    يستكشف المشترون إعلانك المنظم، ويتواصل المهتمون عبر استفسارات واضحة ومباشرة.
                  </p>
                </div>
              </div>

              {/* Step 4: Shape = Broad Rounded Badge with Violet */}
              <div className="bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-6 shadow-hard flex flex-col justify-between text-right space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--dp-color-accent)] border-[2.5px] border-[var(--dp-color-outline)] flex items-center justify-center font-display font-black text-2xl text-white shadow-hard-sm">
                    ٤
                  </div>
                  <Badge variant="outline" size="sm">الخطوة الرابعة</Badge>
                </div>
                <div>
                  <h3 className="text-lg font-black text-[var(--dp-color-ink)] mb-1.5">
                    حدد موعد المعاينة
                  </h3>
                  <p className="text-xs sm:text-sm text-[#4a5568] leading-relaxed">
                    اختر الميعاد المناسب لك للمعاينة على الطبيعة ومقابلة المشتري بكل سهولة وأمان.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------
            7. Trust Section: White book-like panel with violet offset backing
               Headline: "الوضوح بيبدأ من التفاصيل."
               Features:
               - مراجعة العقارات قبل النشر
               - معلومات منظمة وواضحة
               - مستندات خاصة وآمنة
               - حجز المعاينات بسهولة
               Never claim legal certification or guaranteed ownership.
           ---------------------------------------------------- */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="relative">
            {/* Violet Offset Backing Layer */}
            <div
              className="absolute inset-0 bg-[var(--dp-color-accent)] rounded-[calc(var(--dp-radius-corner)+8px)] translate-x-3 translate-y-3 sm:translate-x-4 sm:translate-y-4 border-[3px] border-[var(--dp-color-outline)]"
              aria-hidden="true"
            />

            {/* Shared White Book-like Panel */}
            <div className="relative bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-8 sm:p-14 shadow-hard text-right space-y-10">
              <div className="max-w-3xl">
                <Badge variant="secondary" className="mb-3">
                  مبدأ الشفافية في شقتي
                </Badge>
                <h2 className="text-3xl sm:text-5xl font-black text-[var(--dp-color-ink)] leading-tight">
                  الوضوح بيبدأ من التفاصيل.
                </h2>
                <p className="text-base sm:text-lg text-[#4a5568] mt-3 leading-relaxed font-medium">
                  هدفنا جعل تجربة البحث عن عقار أو بيعه في مصر تجربة مريحة وقائمة على معلومات دقيقة، بدون مبالغات أو عمولات خفية مجهولة المصدر.
                </p>
              </div>

              {/* The 4 Distinct Trust Features */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t-2 border-[#ece9db]">
                {/* Feature 1 */}
                <div className="p-5 rounded-2xl border-[2.5px] border-[var(--dp-color-outline)] bg-[var(--dp-color-ground)] shadow-hard-sm flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[var(--dp-color-accent-fresh)] border-[2px] border-[var(--dp-color-outline)] flex items-center justify-center text-[var(--dp-color-ink)] shrink-0 shadow-hard-sm">
                    <FileCheck2 className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-[var(--dp-color-ink)] mb-1">
                      مراجعة العقارات قبل النشر
                    </h3>
                    <p className="text-xs sm:text-sm text-[#4b5563] leading-relaxed">
                      يتم الاطلاع على بيانات العقار وصوره والتأكد من استيفاء المتطلبات الأساسية لضمان جدية الإعلان قبل ظهوره للباحثين.
                    </p>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="p-5 rounded-2xl border-[2.5px] border-[var(--dp-color-outline)] bg-[var(--dp-color-ground)] shadow-hard-sm flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[var(--dp-color-accent-warm)] border-[2px] border-[var(--dp-color-outline)] flex items-center justify-center text-[var(--dp-color-ink)] shrink-0 shadow-hard-sm">
                    <Layers className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-[var(--dp-color-ink)] mb-1">
                      معلومات منظمة وواضحة
                    </h3>
                    <p className="text-xs sm:text-sm text-[#4b5563] leading-relaxed">
                      الأسعار بالجنيه المصري (ج.م) والمساحات بالمتر المربع (م²)، مع توضيح صريح لعدد الغرف وحالة التشطيب والموقع.
                    </p>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="p-5 rounded-2xl border-[2.5px] border-[var(--dp-color-outline)] bg-[var(--dp-color-ground)] shadow-hard-sm flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[var(--dp-color-accent-secondary)] border-[2px] border-[var(--dp-color-outline)] flex items-center justify-center text-white shrink-0 shadow-hard-sm">
                    <ShieldAlert className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-[var(--dp-color-ink)] mb-1">
                      مستندات خاصة وآمنة
                    </h3>
                    <p className="text-xs sm:text-sm text-[#4b5563] leading-relaxed">
                      خصوصية أصحاب العقارات محفوظة بالكامل؛ أوراقك لا تُعرض للعامة وتُحفظ في بيئة مشفرة ومحمية.
                    </p>
                  </div>
                </div>

                {/* Feature 4 */}
                <div className="p-5 rounded-2xl border-[2.5px] border-[var(--dp-color-outline)] bg-[var(--dp-color-ground)] shadow-hard-sm flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[var(--dp-color-accent)] border-[2px] border-[var(--dp-color-outline)] flex items-center justify-center text-white shrink-0 shadow-hard-sm">
                    <CalendarCheck className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-[var(--dp-color-ink)] mb-1">
                      حجز المعاينات بسهولة
                    </h3>
                    <p className="text-xs sm:text-sm text-[#4b5563] leading-relaxed">
                      نظام إلكتروني مبسط لتحديد يوم وساعة المعاينة وتأكيد الحضور بين الطرفين بدون اتصالات عشوائية متكررة.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Floating Property Comparison Dock */}
      <ComparisonFloatingDock />

      {/* 8 & 9. Pale mint closing section with confetti + Dark slate curved footer */}
      <Footer />
    </div>
  );
};
