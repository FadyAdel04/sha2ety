import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { PropertyCard, PropertyItem } from '@/components/ui/PropertyCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { PropertyGallery } from '@/components/property/PropertyGallery';
import { PropertyLocationMap } from '@/components/property/PropertyLocationMap';
import { BookingModal } from '@/components/appointments/BookingModal';
import { PropertyInquiryModal } from '@/components/inquiries/PropertyInquiryModal';
import { getPropertyById, fetchPublishedProperties } from '@/services/propertyService';
import { recordRecentlyViewedProperty } from '@/services/buyerService';
import {
  isInComparison,
  addToComparison,
  removeFromComparison,
  COMPARISON_CHANGE_EVENT,
} from '@/services/comparisonService';
import { ComparisonFloatingDock } from '@/components/marketplace/ComparisonFloatingDock';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { formatEGP, formatArea } from '@/lib/utils';
import {
  ChevronLeft,
  MapPin,
  BedDouble,
  Bath,
  Maximize2,
  ShieldCheck,
  CalendarCheck,
  Share2,
  Heart,
  MessageCircle,
  Building,
  Layers,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  ShieldAlert,
  Phone,
  Check,
  Home,
  Scale,
} from 'lucide-react';

export const PropertyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [property, setProperty] = useState<PropertyItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [similarProperties, setSimilarProperties] = useState<PropertyItem[]>([]);

  useEffect(() => {
    let isMounted = true;
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    getPropertyById(id)
      .then((prop) => {
        if (!isMounted) return;
        setProperty(prop);
        setLoading(false);

        if (prop) {
          // Record view in recently viewed
          recordRecentlyViewedProperty(prop);

          // Record view in backend analytics
          try {
            supabase.rpc('record_property_view', {
              p_property_id: prop.id,
              p_viewer_id: user?.id || null,
            }).then();
          } catch {
            // Ignore
          }

          // Fetch similar properties dynamically
          fetchPublishedProperties({
            city: prop.city !== 'all' ? prop.city : undefined,
            type: prop.type !== 'all' ? prop.type : undefined,
            pageSize: 4,
          }).then((res) => {
            if (isMounted) {
              setSimilarProperties(res.properties.filter((p) => p.id !== prop.id).slice(0, 3));
            }
          }).catch(() => {});
        }
      })
      .catch((err) => {
        console.error('Failed to load property details:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Gallery images array
  const galleryImages = useMemo(() => {
    if (!property) return [];
    if (property.images && property.images.length > 0) return property.images;
    return [
      property.imageUrl,
      'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
    ];
  }, [property]);

  // Price per square meter
  const pricePerSqm = property ? Math.round(property.price / (property.area || 1)) : 0;

  // States
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (!property?.id) return;
    try {
      const stored = localStorage.getItem('sha2ety_favorites');
      if (stored) {
        const list = JSON.parse(stored);
        setIsFavorite(list.includes(property.id));
      }
    } catch {
      // Ignore
    }
  }, [property?.id]);

  const [copiedShare, setCopiedShare] = useState(false);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [compared, setCompared] = useState(false);

  useEffect(() => {
    if (!property?.id) return;
    setCompared(isInComparison(property.id));
    const handleCompareUpdate = () => {
      setCompared(isInComparison(property.id));
    };
    window.addEventListener(COMPARISON_CHANGE_EVENT, handleCompareUpdate);
    return () => window.removeEventListener(COMPARISON_CHANGE_EVENT, handleCompareUpdate);
  }, [property?.id]);

  const handleToggleCompare = () => {
    if (!property) return;
    if (compared) {
      removeFromComparison(property.id);
    } else {
      addToComparison(property);
    }
  };

  // Toggle Favorite
  const handleToggleFavorite = () => {
    if (!property) return;
    const next = !isFavorite;
    setIsFavorite(next);
    try {
      const stored = localStorage.getItem('sha2ety_favorites');
      let list: string[] = stored ? JSON.parse(stored) : [];
      if (next) {
        if (!list.includes(property.id)) list.push(property.id);
      } else {
        list = list.filter((item) => item !== property.id);
      }
      localStorage.setItem('sha2ety_favorites', JSON.stringify(list));
    } catch {
      // Ignore
    }
  };

  // Share URL with Clipboard
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  // Handle protected buyer action trigger
  const requireAuthAction = (actionCallback: () => void) => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    actionCallback();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--dp-color-ground)] text-[var(--dp-color-ink)] flex flex-col">
        <Header />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
          <Skeleton className="w-64 h-8 rounded-xl" />
          <div className="bg-white border-[3px] border-[var(--dp-color-outline)] rounded-2xl p-6 shadow-hard space-y-4">
            <Skeleton className="w-1/3 h-8" />
            <Skeleton className="w-1/4 h-5" />
          </div>
          <Skeleton className="w-full h-96 rounded-2xl" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-[var(--dp-color-ground)] text-[var(--dp-color-ink)] flex flex-col">
        <Header />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full flex items-center justify-center">
          <div className="max-w-md w-full bg-white border-[3px] border-[var(--dp-color-outline)] rounded-2xl p-8 shadow-hard text-center">
            <div className="w-16 h-16 bg-[var(--dp-color-accent-warm)] rounded-2xl border-[3px] border-[var(--dp-color-outline)] flex items-center justify-center mx-auto mb-4 shadow-hard-sm">
              <Home className="w-8 h-8 text-[var(--dp-color-ink)]" />
            </div>
            <h2 className="text-2xl font-black text-[var(--dp-color-ink)] mb-2">العقار غير موجود</h2>
            <p className="text-sm text-[#626d84] mb-6">
              يبدو أن هذا العقار غير متاح حالياً أو تم حذفه أو نقله. يمكنك تصفح باقي العقارات المعروضة.
            </p>
            <Link to="/properties">
              <Button variant="primary" size="md" className="w-full justify-center">
                تصفح جميع العقارات المتاحة
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Amenities checklist
  const amenitiesList = [
    { label: 'مصعد (أسانسير)', available: property.hasElevator ?? true },
    { label: 'جراج خاص مغطى', available: property.hasGarage ?? true },
    { label: 'شرفة / تراس مفتوح', available: property.hasBalcony ?? true },
    { label: 'حديقة خاصة', available: property.hasGarden ?? (property.type === 'فيلا' || property.floor === 'ground') },
    { label: 'أمن وحراسة 24 ساعة', available: property.hasSecurity ?? true },
    { label: 'تكييف مركزي أو سبليت', available: property.hasAirConditioning ?? true },
    { label: 'توصيل غاز طبيعي رسمي', available: property.hasNaturalGas ?? true },
  ];

  return (
    <div className="min-h-screen bg-[var(--dp-color-ground)] text-[var(--dp-color-ink)] flex flex-col selection:bg-[var(--dp-color-selection)] selection:text-[var(--dp-color-accent)]">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
        {/* ----------------------------------------------------
            1. Breadcrumbs: الرئيسية ← استكشف العقارات ← تفاصيل العقار
           ---------------------------------------------------- */}
        <nav aria-label="مسار التنقل" className="text-right">
          <ol className="inline-flex items-center gap-2 text-xs font-bold text-[#626d84] bg-white border border-[var(--dp-color-outline)] px-3.5 py-1.5 rounded-xl shadow-hard-sm">
            <li>
              <Link to="/" className="hover:text-[var(--dp-color-accent)] transition-colors">
                الرئيسية
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li>
              <Link to="/properties" className="hover:text-[var(--dp-color-accent)] transition-colors">
                استكشف العقارات
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li className="text-[var(--dp-color-ink)] font-black truncate max-w-[200px] sm:max-w-md">
              {property.title}
            </li>
          </ol>
        </nav>

        {/* ----------------------------------------------------
            2. Property Heading: Title, Location, Badges, Dates, Favorite & Share
           ---------------------------------------------------- */}
        <div className="bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-6 sm:p-8 shadow-hard text-right space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Top Badges Strip */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="primary">{property.type}</Badge>
              {property.isVerified && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--dp-color-accent-warm)] text-[var(--dp-color-ink)] font-black text-xs rounded-full border-[2px] border-[var(--dp-color-outline)] shadow-hard-sm">
                  <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                  <span>موثق البيانات</span>
                </span>
              )}
              <span className="text-xs font-bold text-[#718096] flex items-center gap-1 mr-2">
                <Clock className="w-3.5 h-3.5" />
                <span>نُشر في ١ نوفمبر ٢٠٢٦</span>
              </span>
            </div>

            {/* Favorite & Share Buttons */}
            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              {/* Share button */}
              <button
                type="button"
                onClick={handleShare}
                className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl border-[2px] border-[var(--dp-color-outline)] bg-white hover:bg-[var(--dp-color-selection)] text-xs font-black text-[var(--dp-color-ink)] shadow-hard-sm cursor-pointer transition-all"
                title="مشاركة رابط العقار"
              >
                {copiedShare ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                    <span className="text-emerald-700">تم النسخ!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 stroke-[2.5]" />
                    <span>مشاركة</span>
                  </>
                )}
              </button>

              {/* Favorite button */}
              <button
                type="button"
                onClick={handleToggleFavorite}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-[2px] border-[var(--dp-color-outline)] text-xs font-black shadow-hard-sm cursor-pointer transition-all ${
                  isFavorite
                    ? 'bg-rose-500 text-white'
                    : 'bg-white hover:bg-rose-50 text-[var(--dp-color-ink)]'
                }`}
                title={isFavorite ? 'محفوظ في المفضلة' : 'إضافة للمفضلة'}
              >
                <Heart className={`w-4 h-4 stroke-[2.5] ${isFavorite ? 'fill-white' : ''}`} />
                <span>{isFavorite ? 'في المفضلة' : 'حفظ'}</span>
              </button>

              {/* Compare button */}
              <button
                type="button"
                onClick={handleToggleCompare}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-[2px] border-[var(--dp-color-outline)] text-xs font-black shadow-hard-sm cursor-pointer transition-all ${
                  compared
                    ? 'bg-[var(--dp-color-accent)] text-white'
                    : 'bg-white hover:bg-slate-50 text-[var(--dp-color-ink)]'
                }`}
                title={compared ? 'محدد للمقارنة' : 'أضف للمقارنة'}
              >
                <Scale className="w-4 h-4 stroke-[2.5]" />
                <span>{compared ? 'في المقارنة' : 'قارن'}</span>
              </button>
            </div>
          </div>

          {/* Large Title */}
          <h1 className="text-2xl sm:text-4xl font-black text-[var(--dp-color-ink)] leading-snug">
            {property.title}
          </h1>

          {/* Location Bar */}
          <div className="flex items-center gap-2 text-sm text-[#4a5568] font-bold">
            <MapPin className="w-4 h-4 text-[var(--dp-color-accent-secondary)] shrink-0" />
            <span>
              {property.location}، {property.city}، {property.governorate || 'القاهرة'}
            </span>
          </div>
        </div>

        {/* ----------------------------------------------------
            Main Content Grid (8 cols Main + 4 cols Sticky Action Bar)
           ---------------------------------------------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Column (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            {/* 3. Image Gallery */}
            <PropertyGallery images={galleryImages} title={property.title} />

            {/* 5. Specifications: White editorial book panel with violet offset backing */}
            <div className="relative">
              <div
                className="absolute inset-0 bg-[var(--dp-color-accent)] rounded-[calc(var(--dp-radius-corner)+8px)] translate-x-3 translate-y-3 border-[3px] border-[var(--dp-color-outline)]"
                aria-hidden="true"
              />

              <div className="relative bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-6 sm:p-8 shadow-hard text-right space-y-6">
                <div className="border-b-2 border-[#ece9db] pb-3">
                  <Badge variant="warm" className="mb-1">
                    المواصفات الفنية
                  </Badge>
                  <h2 className="text-xl sm:text-2xl font-black text-[var(--dp-color-ink)]">
                    مواصفات وتفاصيل العقار
                  </h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-right">
                  {/* المساحة */}
                  <div className="p-3.5 bg-[var(--dp-color-ground)] rounded-xl border-[2px] border-[var(--dp-color-outline)] shadow-hard-sm">
                    <span className="text-[11px] font-bold text-[#626d84] block">المساحة الإجمالية</span>
                    <span className="text-base sm:text-lg font-black text-[var(--dp-color-ink)] block mt-0.5">
                      {formatArea(property.area)}
                    </span>
                  </div>

                  {/* عدد الغرف */}
                  <div className="p-3.5 bg-[var(--dp-color-ground)] rounded-xl border-[2px] border-[var(--dp-color-outline)] shadow-hard-sm">
                    <span className="text-[11px] font-bold text-[#626d84] block">عدد الغرف</span>
                    <span className="text-base sm:text-lg font-black text-[var(--dp-color-ink)] block mt-0.5">
                      {property.bedrooms > 0 ? `${property.bedrooms} غرف نوم` : 'أرض فضاء'}
                    </span>
                  </div>

                  {/* عدد الحمامات */}
                  <div className="p-3.5 bg-[var(--dp-color-ground)] rounded-xl border-[2px] border-[var(--dp-color-outline)] shadow-hard-sm">
                    <span className="text-[11px] font-bold text-[#626d84] block">عدد الحمامات</span>
                    <span className="text-base sm:text-lg font-black text-[var(--dp-color-ink)] block mt-0.5">
                      {property.bathrooms > 0 ? `${property.bathrooms} حمام` : '-'}
                    </span>
                  </div>

                  {/* رقم الدور */}
                  <div className="p-3.5 bg-[var(--dp-color-ground)] rounded-xl border-[2px] border-[var(--dp-color-outline)] shadow-hard-sm">
                    <span className="text-[11px] font-bold text-[#626d84] block">رقم الدور</span>
                    <span className="text-base sm:text-lg font-black text-[var(--dp-color-ink)] block mt-0.5">
                      {property.floorNumber ? `الدور ${property.floorNumber}` : property.floor === 'ground' ? 'دور أرضي' : 'دور متكرر'}
                    </span>
                  </div>

                  {/* إجمالي الأدوار */}
                  <div className="p-3.5 bg-[var(--dp-color-ground)] rounded-xl border-[2px] border-[var(--dp-color-outline)] shadow-hard-sm">
                    <span className="text-[11px] font-bold text-[#626d84] block">إجمالي أدوار المبنى</span>
                    <span className="text-base sm:text-lg font-black text-[var(--dp-color-ink)] block mt-0.5">
                      {property.totalFloors ? `${property.totalFloors} أدوار` : '٥ أدوار سكنية'}
                    </span>
                  </div>

                  {/* عمر العقار */}
                  <div className="p-3.5 bg-[var(--dp-color-ground)] rounded-xl border-[2px] border-[var(--dp-color-outline)] shadow-hard-sm">
                    <span className="text-[11px] font-bold text-[#626d84] block">عمر العقار</span>
                    <span className="text-base sm:text-lg font-black text-[var(--dp-color-ink)] block mt-0.5">
                      {property.age || 'سنتان (بناء حديث)'}
                    </span>
                  </div>

                  {/* نوع التشطيب */}
                  <div className="p-3.5 bg-[var(--dp-color-ground)] rounded-xl border-[2px] border-[var(--dp-color-outline)] shadow-hard-sm">
                    <span className="text-[11px] font-bold text-[#626d84] block">مستوى التشطيب</span>
                    <span className="text-base sm:text-lg font-black text-[var(--dp-color-ink)] block mt-0.5">
                      {property.finishing === 'ultra_super_lux'
                        ? 'ألترا سوبر لوكس'
                        : property.finishing === 'super_lux'
                        ? 'سوبر لوكس'
                        : property.finishing === 'semi_finished'
                        ? 'نصف تشطيب'
                        : 'على المحارة'}
                    </span>
                  </div>

                  {/* حالة الفرش */}
                  <div className="p-3.5 bg-[var(--dp-color-ground)] rounded-xl border-[2px] border-[var(--dp-color-outline)] shadow-hard-sm">
                    <span className="text-[11px] font-bold text-[#626d84] block">حالة الفرش</span>
                    <span className="text-base sm:text-lg font-black text-[var(--dp-color-ink)] block mt-0.5">
                      {property.furnishing || 'غير مفروش'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 6. Description */}
            <div className="bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-6 sm:p-8 shadow-hard text-right space-y-4">
              <h3 className="text-xl font-black text-[var(--dp-color-ink)] border-b-2 border-[#ece9db] pb-3">
                وصف العقار
              </h3>
              <div className="text-sm sm:text-base text-[#374151] font-medium leading-[1.8] space-y-3">
                <p>
                  {property.description ||
                    `عقار استثنائي يقع في موقع استراتيجي ومميز في ${property.location}، بالقرب من كافة المحاور الحيوية والمراكز التجارية والمدارس الدولية.`}
                </p>
                <p>
                  يتمتع العقار بفيو مفتوح وتقسيم داخلي هندسي مدروس يوفر أقصى درجات الخصوصية واستغلال المساحات، مع واجهات معمارية كلاسيكية حديثة ومداخل رخامية فاخرة.
                </p>
                <p className="text-xs text-[#626d84] font-bold bg-[var(--dp-color-field-soft)] p-3 rounded-xl border border-[var(--dp-color-outline)]">
                  ✓ خضع هذا العقار للفحص المبدئي للبيانات والمستندات عبر فريق شقتي، ومتاح للمعاينة الميدانية بعد التنسيق مع المالك.
                </p>
              </div>
            </div>

            {/* 7. Features: Amenities */}
            <div className="bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-6 sm:p-8 shadow-hard text-right space-y-4">
              <h3 className="text-xl font-black text-[var(--dp-color-ink)] border-b-2 border-[#ece9db] pb-3">
                المميزات والخدمات المتوفرة
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {amenitiesList.map((amenity, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-3 rounded-xl border-[2px] text-xs font-bold ${
                      amenity.available
                        ? 'bg-[var(--dp-color-field-soft)] text-emerald-900 border-[var(--dp-color-outline)] shadow-hard-sm'
                        : 'bg-gray-50 text-gray-400 border-gray-200 opacity-60'
                    }`}
                  >
                    {amenity.available ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 stroke-[2.5] shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-400 stroke-[2] shrink-0" />
                    )}
                    <span>{amenity.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 8. Location: Approved Public Map */}
            <PropertyLocationMap
              location={property.location}
              city={property.city}
              governorate={property.governorate}
              lat={property.lat || 30.0131}
              lng={property.lng || 31.4989}
            />
          </div>

          {/* Sticky Action Column (4 cols) */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            {/* 4. Price Card & Main Buyer Actions */}
            <div className="bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-6 shadow-hard text-right space-y-6">
              {/* Price Details */}
              <div className="border-b-2 border-[#ece9db] pb-4">
                <span className="text-xs font-bold text-[#626d84] block">السعر المطلوب</span>
                <span className="text-3xl sm:text-4xl font-black text-[var(--dp-color-accent)] block mt-1">
                  {formatEGP(property.price)}
                </span>

                {/* Price per sqm */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-dashed border-[#ece9db]">
                  <span className="text-xs font-bold text-[#626d84]">سعر المتر المربع:</span>
                  <span className="text-sm font-black text-[var(--dp-color-ink)]">
                    {formatEGP(pricePerSqm)} / م²
                  </span>
                </div>

                {/* Negotiability badge */}
                <div className="mt-3">
                  <Badge variant={property.isNegotiable !== false ? 'fresh' : 'muted'} size="sm">
                    {property.isNegotiable !== false ? 'قابل للتفاوض البسيط' : 'السعر نهائي'}
                  </Badge>
                </div>
              </div>

              {/* 10. Buyer Actions */}
              <div className="space-y-3">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full justify-center shadow-hard text-base"
                  rightIcon={<CalendarCheck className="w-5 h-5 stroke-[2.5]" />}
                  onClick={() => requireAuthAction(() => setIsBookModalOpen(true))}
                >
                  احجز موعد معاينة ميدانية
                </Button>

                <Button
                  variant="warm"
                  size="md"
                  className="w-full justify-center shadow-hard"
                  rightIcon={<MessageCircle className="w-4 h-4 stroke-[2.5]" />}
                  onClick={() => requireAuthAction(() => setIsInquiryModalOpen(true))}
                >
                  أرسل استفساراً للمالك
                </Button>
              </div>

              {/* Safety banner */}
              <div className="p-4 bg-[var(--dp-color-ground)] rounded-xl border border-[var(--dp-color-outline)] space-y-1.5 text-xs text-[#526078] font-bold">
                <div className="flex items-center gap-1.5 text-emerald-800">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>معاينة آمنة بدون سمسرة عشوائية</span>
                </div>
                <p className="text-[11px] font-normal leading-relaxed text-[#626d84]">
                  لا تدفع أي مبالغ قبل المعاينة الفعلية للعقار على الطبيعة ومطابقة مستندات الملكية الرسمية.
                </p>
              </div>
            </div>

            {/* 9. Seller Information Panel */}
            <div className="bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-6 shadow-hard text-right space-y-4">
              <span className="text-xs font-bold text-[#626d84] block">بيانات المالك</span>

              <div className="flex items-center gap-3 pb-3 border-b-2 border-[#ece9db]">
                <div className="w-14 h-14 rounded-2xl bg-[var(--dp-color-accent-warm)] border-[2.5px] border-[var(--dp-color-outline)] flex items-center justify-center font-display font-black text-xl text-[var(--dp-color-ink)] shadow-hard-sm">
                  {property.sellerName ? property.sellerName[0] : 'م'}
                </div>
                <div>
                  <h4 className="text-base font-black text-[var(--dp-color-ink)]">
                    {property.sellerName || 'المالك المباشر للعقار'}
                  </h4>
                  <span className="text-xs text-[#626d84] block mt-0.5">
                    عضو في شقتي منذ {property.sellerJoinedDate || 'يناير ٢٠٢٥'}
                  </span>
                  <Badge variant="fresh" size="sm" className="mt-1">
                    هوية موثقة
                  </Badge>
                </div>
              </div>

              <p className="text-xs text-[#626d84] leading-relaxed">
                تواصل مباشر ومنظم مع صاحب العقار دون كشف مستندات الهوية الحساسة لغير المعتمدين.
              </p>

              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center"
                rightIcon={<MessageCircle className="w-4 h-4" />}
                onClick={() => requireAuthAction(() => setIsInquiryModalOpen(true))}
              >
                مراسلة المالك عبر المنصة
              </Button>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------
            11. Similar Properties (عقارات مشابهة)
           ---------------------------------------------------- */}
        {similarProperties.length > 0 && (
          <section className="pt-10 border-t-2 border-[#ece9db] text-right space-y-6">
            <div>
              <Badge variant="primary" className="mb-2">
                اقتراحات لك
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-black text-[var(--dp-color-ink)]">
                عقارات مشابهة قد تناسبك
              </h2>
              <p className="text-xs sm:text-sm text-[#626d84]">
                عقارات في نفس المنطقة أو بنفس نطاق السعر والمساحة
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {similarProperties.map((simProp) => (
                <PropertyCard key={simProp.id} property={simProp} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* ----------------------------------------------------
          Mobile Sticky Bottom Bar for Instant Booking CTA
         ---------------------------------------------------- */}
      <div className="lg:hidden sticky bottom-0 z-40 bg-[var(--dp-color-panel)] border-t-[3px] border-[var(--dp-color-outline)] p-4 shadow-2xl flex items-center justify-between gap-4">
        <div>
          <span className="text-xs text-[#626d84] block font-bold">السعر المطلوب:</span>
          <span className="text-lg font-black text-[var(--dp-color-accent)] block">
            {formatEGP(property.price)}
          </span>
        </div>

        <Button
          variant="primary"
          size="md"
          className="shadow-hard text-sm"
          rightIcon={<CalendarCheck className="w-4 h-4" />}
          onClick={() => requireAuthAction(() => setIsBookModalOpen(true))}
        >
          احجز موعد معاينة
        </Button>
      </div>

      {/* Floating Property Comparison Dock */}
      <ComparisonFloatingDock />

      <Footer />

      {/* ----------------------------------------------------
          Modal: Book Inspection Appointment (حجز موعد معاينة)
         ---------------------------------------------------- */}
      <BookingModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        property={property}
      />

      {/* ----------------------------------------------------
          Modal: Send Direct Inquiry (إرسال استفسار للمالك)
         ---------------------------------------------------- */}
      <PropertyInquiryModal
        isOpen={isInquiryModalOpen}
        onClose={() => setIsInquiryModalOpen(false)}
        property={property}
      />
    </div>
  );
};
