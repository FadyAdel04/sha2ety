import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PropertyCard, PropertyItem } from '@/components/ui/PropertyCard';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Skeleton } from '@/components/ui/Skeleton';
import { Notification } from '@/components/ui/Notification';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatEGP } from '@/lib/utils';
import {
  useFavorites,
  useBuyerAppointments,
  useBuyerStats,
  useRecentlyViewed,
} from '@/hooks/useSupabaseData';
import {
  // Fall back to local if not authenticated
  getBuyerFavorites,
  getBuyerAppointments,
  getBuyerStatistics,
  getBuyerRecentlyViewed,
  removeBuyerFavorite,
  BuyerStatistics,
  BuyerAppointment,
} from '@/services/buyerService';
import {
  Heart,
  CalendarCheck,
  CheckCircle2,
  History,
  Compass,
  ArrowLeft,
  Clock,
  MapPin,
  User,
  Phone,
  AlertCircle,
  ExternalLink,
  Trash2,
  Sparkles,
} from 'lucide-react';

export const BuyerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Supabase hooks (authenticated)
  const sbFavs = useFavorites(user?.id);
  const sbApps = useBuyerAppointments(user?.id);
  const sbStats = useBuyerStats(user?.id);
  const sbViewed = useRecentlyViewed(user?.id);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<BuyerStatistics | null>(null);
  const [favorites, setFavorites] = useState<PropertyItem[]>([]);
  const [appointments, setAppointments] = useState<BuyerAppointment[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<PropertyItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [removeFavId, setRemoveFavId] = useState<string | null>(null);

  // Merge Supabase data with local fallback
  useEffect(() => {
    const isSupabaseReady = !sbFavs.loading && !sbApps.loading && !sbStats.loading;
    if (!isSupabaseReady) return;

    if (sbFavs.favorites.length > 0) {
      setFavorites(sbFavs.favorites);
    } else {
      setFavorites(getBuyerFavorites());
    }

    if (sbApps.appointments.length > 0) {
      // Map Supabase appointments shape to BuyerAppointment
      const mapped: BuyerAppointment[] = sbApps.appointments.map((a: any) => ({
        id: a.id,
        propertyId: a.property_id,
        propertyTitle: a.property?.title || 'عقار',
        propertyImage: a.property?.cover_image_url || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80',
        propertyLocation: a.property?.city || '',
        propertyPrice: a.property?.price || 0,
        sellerName: a.seller?.full_name || 'البائع',
        sellerPhone: a.seller?.phone || '',
        isSellerVerified: true,
        date: new Date(a.appointment_date).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' }),
        time: a.appointment_time,
        status: a.status,
        statusLabel: ({ pending: 'في انتظار التأكيد', confirmed: 'تم التأكيد', completed: 'مكتملة', cancelled: 'ملغية', rejected: 'مرفوضة' } as Record<string, string>)[a.status] || a.status,
        notes: a.buyer_message,
        createdAt: a.created_at,
      }));
      setAppointments(mapped);
    } else {
      setAppointments(getBuyerAppointments());
    }

    if (sbStats.stats) {
      setStats(sbStats.stats);
    } else {
      getBuyerStatistics().then(setStats);
    }

    if (sbViewed.properties.length > 0) {
      setRecentlyViewed(sbViewed.properties);
    } else {
      setRecentlyViewed(getBuyerRecentlyViewed());
    }

    setLoading(false);
  }, [sbFavs.loading, sbApps.loading, sbStats.loading, sbViewed.loading]);

  // Also handle the case where user is not logged in to Supabase (demo)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        // Fallback to localStorage after timeout
        getBuyerStatistics().then(setStats);
        setFavorites(getBuyerFavorites());
        setAppointments(getBuyerAppointments());
        setRecentlyViewed(getBuyerRecentlyViewed());
        setLoading(false);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [loading]);

  const handleRemoveFavorite = async (propertyId: string) => {
    // Try Supabase removal first
    if (user?.id) {
      await sbFavs.remove(propertyId).catch(() => {});
    }
    const updated = removeBuyerFavorite(propertyId);
    setFavorites(sbFavs.favorites.length > 0
      ? sbFavs.favorites.filter((f) => f.id !== propertyId)
      : updated);
    setRemoveFavId(null);
    setToastMessage('تمت إزالة العقار من مفضلتك بنجاح.');
    if (sbStats.stats) {
      sbStats.reload();
    } else {
      getBuyerStatistics().then(setStats);
    }
  };

  const buyerName = user?.fullName || 'كريم عبد الله';
  const upcomingConfirmed = appointments.find((a) => a.status === 'confirmed');

  return (
    <DashboardLayout
      role="buyer"
      title="الرئيسية"
      subtitle="كل العقارات اللي مهتم بيها ومواعيدك القادمة في مكان واحد."
      actions={
        <Link to="/properties">
          <Button
            variant="primary"
            size="sm"
            rightIcon={<Compass className="w-4 h-4 stroke-[2.5]" />}
          >
            استكشف العقارات
          </Button>
        </Link>
      }
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="mb-6 animate-fadeIn">
          <Notification
            variant="success"
            title="تم بنجاح"
            message={toastMessage}
            onClose={() => setToastMessage(null)}
          />
        </div>
      )}

      {/* 2. Welcome Section */}
      <section className="relative overflow-hidden bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-6 sm:p-8 shadow-hard mb-8 text-right">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--dp-color-selection)] border border-[var(--dp-color-outline)] text-xs font-black text-[var(--dp-color-accent)] mb-1">
              <span className="w-2 h-2 rounded-full bg-[var(--dp-color-accent)] animate-pulse" />
              حساب مشتري موثق
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[var(--dp-color-ink)]">
              أهلاً بيك في شقتي، {buyerName}
            </h2>
            <p className="text-sm sm:text-base text-[#526078] font-bold max-w-xl leading-relaxed">
              كل العقارات اللي مهتم بيها ومواعيدك القادمة في مكان واحد.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link to="/properties">
              <Button
                variant="primary"
                size="md"
                rightIcon={<Compass className="w-5 h-5 stroke-[2.5]" />}
                className="w-full sm:w-auto"
              >
                تصفح العقارات المتاحة
              </Button>
            </Link>
            <Link to="/buyer/appointments">
              <Button variant="outline" size="md" className="w-full sm:w-auto">
                جدول مواعيدي
              </Button>
            </Link>
          </div>
        </div>

        {/* Decorative Geometric Shapes */}
        <div className="absolute left-[-20px] top-[-20px] w-32 h-32 rounded-full bg-[var(--dp-color-accent-warm)]/20 pointer-events-none -z-0" />
        <div className="absolute left-16 bottom-[-30px] w-24 h-24 rotate-12 bg-[var(--dp-color-accent-fresh)]/25 pointer-events-none -z-0" />
      </section>

      {/* 3. Overview Statistics (4 Cards: عدد المفضلة، طلبات المعاينة، المواعيد المؤكدة، العقارات التي شاهدتها) */}
      <section className="mb-8 text-right">
        <h3 className="text-lg font-black text-[var(--dp-color-ink)] mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[var(--dp-color-accent)]" />
          نظرة عامة على نشاطك
        </h3>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="p-5 rounded-[var(--dp-radius-corner)] border-[2.5px] border-[var(--dp-color-outline)] bg-[var(--dp-color-panel)] space-y-3"
              >
                <Skeleton className="w-10 h-10 rounded-xl" />
                <Skeleton className="w-16 h-8" />
                <Skeleton className="w-20 h-4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. عدد المفضلة */}
            <Link to="/buyer/favorites" className="block group">
              <div className="p-5 rounded-[var(--dp-radius-corner)] border-[2.5px] border-[var(--dp-color-outline)] bg-[#fff5f8] shadow-hard-sm relative overflow-hidden transition-all group-hover:-translate-y-1">
                <div className="flex items-center justify-between mb-3">
                  <span className="p-2.5 rounded-xl bg-white border border-[var(--dp-color-outline)] text-rose-500 shadow-xs">
                    <Heart className="w-5 h-5 fill-rose-500" />
                  </span>
                  <span className="text-[11px] font-bold text-rose-800">محفوظة</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-rose-950">
                  {stats?.favoritesCount || 0}
                </div>
                <span className="text-xs font-black text-[#526078] mt-1 block">
                  عدد المفضلة
                </span>
                <div className="absolute -bottom-3 -right-3 w-10 h-10 rounded-full bg-rose-200/40 pointer-events-none" />
              </div>
            </Link>

            {/* 2. طلبات المعاينة */}
            <Link to="/buyer/appointments" className="block group">
              <div className="p-5 rounded-[var(--dp-radius-corner)] border-[2.5px] border-[var(--dp-color-outline)] bg-[#fffbf0] shadow-hard-sm relative overflow-hidden transition-all group-hover:-translate-y-1">
                <div className="flex items-center justify-between mb-3">
                  <span className="p-2.5 rounded-xl bg-[var(--dp-color-accent-warm)] border border-[var(--dp-color-outline)] text-amber-950 shadow-xs">
                    <CalendarCheck className="w-5 h-5 stroke-[2.5]" />
                  </span>
                  <span className="text-[11px] font-bold text-amber-800">ميدانية</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-amber-950">
                  {stats?.appointmentsCount || 0}
                </div>
                <span className="text-xs font-black text-[#526078] mt-1 block">
                  طلبات المعاينة
                </span>
                <div className="absolute -bottom-3 -right-3 w-10 h-10 rounded-full bg-[var(--dp-color-accent-warm)]/30 pointer-events-none" />
              </div>
            </Link>

            {/* 3. المواعيد المؤكدة */}
            <Link to="/buyer/appointments" className="block group">
              <div className="p-5 rounded-[var(--dp-radius-corner)] border-[2.5px] border-[var(--dp-color-outline)] bg-[#f3fcf7] shadow-hard-sm relative overflow-hidden transition-all group-hover:-translate-y-1">
                <div className="flex items-center justify-between mb-3">
                  <span className="p-2.5 rounded-xl bg-[var(--dp-color-accent-fresh)] border border-[var(--dp-color-outline)] text-emerald-950 shadow-xs">
                    <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                  </span>
                  <span className="text-[11px] font-bold text-emerald-800">معتمدة</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-950">
                  {stats?.confirmedAppointmentsCount || 0}
                </div>
                <span className="text-xs font-black text-[#526078] mt-1 block">
                  المواعيد المؤكدة
                </span>
                <div className="absolute -bottom-3 -right-3 w-10 h-10 rounded-full bg-[var(--dp-color-accent-fresh)]/30 pointer-events-none" />
              </div>
            </Link>

            {/* 4. العقارات التي شاهدتها */}
            <Link to="/buyer/recently-viewed" className="block group">
              <div className="p-5 rounded-[var(--dp-radius-corner)] border-[2.5px] border-[var(--dp-color-outline)] bg-[var(--dp-color-selection)] shadow-hard-sm relative overflow-hidden transition-all group-hover:-translate-y-1">
                <div className="flex items-center justify-between mb-3">
                  <span className="p-2.5 rounded-xl bg-white border border-[var(--dp-color-outline)] text-[var(--dp-color-accent)] shadow-xs">
                    <History className="w-5 h-5 stroke-[2.5]" />
                  </span>
                  <span className="text-[11px] font-bold text-[var(--dp-color-accent)]">سجل</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-[var(--dp-color-ink)]">
                  {stats?.viewedCount || 0}
                </div>
                <span className="text-xs font-black text-[#526078] mt-1 block">
                  العقارات التي شاهدتها
                </span>
                <div className="absolute -bottom-3 -right-3 w-10 h-10 rounded-full bg-purple-200/40 pointer-events-none" />
              </div>
            </Link>
          </div>
        )}
      </section>

      {/* 4. Favorites & Next Appointment Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-right mb-10">
        {/* Left Column (8 cols): My Saved Favorites */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-6 shadow-hard space-y-6">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#ece9db]">
              <div>
                <h3 className="text-lg font-black text-[var(--dp-color-ink)] flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                  عقاراتي المفضلة
                </h3>
                <p className="text-xs text-[#626d84] font-bold mt-0.5">
                  العقارات التي قمت بتمييزها بنجمة للمقارنة وحجز المعاينات.
                </p>
              </div>
              <Link
                to="/buyer/favorites"
                className="text-xs font-black text-[var(--dp-color-accent)] hover:underline flex items-center gap-1"
              >
                عرض كل المفضلة ({favorites.length})
                <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Skeleton className="h-64 rounded-2xl" />
                <Skeleton className="h-64 rounded-2xl" />
              </div>
            ) : favorites.length === 0 ? (
              <EmptyState
                icon={<Heart className="w-8 h-8 text-rose-500" />}
                title="مفضلتك فارغة حالياً"
                description="استكشف آلاف العقارات الموثقة واضغط على علامة القلب في أي إعلان لحفظه هنا ومقارنته لاحقاً."
                actionLabel="تصفح العقارات الآن"
                onAction={() => navigate('/properties')}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {favorites.slice(0, 2).map((prop) => (
                  <div key={prop.id} className="relative group">
                    <PropertyCard
                      property={prop}
                      isFavoriteInitial={true}
                      onFavoriteToggle={() => setRemoveFavId(prop.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 6. Recently Viewed Strip */}
          <div className="bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-6 shadow-hard space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#ece9db]">
              <div>
                <h3 className="text-base font-black text-[var(--dp-color-ink)] flex items-center gap-2">
                  <History className="w-4.5 h-4.5 text-[var(--dp-color-accent)]" />
                  شوهدت مؤخراً
                </h3>
                <p className="text-xs text-[#626d84] font-bold mt-0.5">
                  العقارات التي تصفحتها خلال زياراتك الأخيرة.
                </p>
              </div>
              <Link
                to="/buyer/recently-viewed"
                className="text-xs font-black text-[var(--dp-color-accent)] hover:underline flex items-center gap-1"
              >
                السجل بالكامل
                <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
              </Link>
            </div>

            {recentlyViewed.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#8896ab] font-bold">
                لم تشاهد أي عقارات بعد. تصفح المعروضات لتسجيلها في سجلك الشخصي.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {recentlyViewed.slice(0, 3).map((item) => (
                  <Link
                    key={item.id}
                    to={`/properties/${item.id}`}
                    className="p-3 rounded-xl border border-[var(--dp-color-outline)] bg-[var(--dp-color-ground)] hover:bg-[var(--dp-color-selection)] transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-24 object-cover rounded-lg border border-[var(--dp-color-outline)] mb-2 group-hover:scale-102 transition-transform"
                      />
                      <h4 className="font-black text-xs text-[var(--dp-color-ink)] line-clamp-1 mb-1">
                        {item.title}
                      </h4>
                      <span className="text-[11px] text-[#626d84] block mb-1">
                        {item.location}، {item.city}
                      </span>
                    </div>
                    <span className="text-xs font-black text-[var(--dp-color-accent)] block">
                      {formatEGP(item.price)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Upcoming Appointments & Direct Support */}
        <div className="lg:col-span-4 space-y-4">
          {/* Next Confirmed Appointment Banner */}
          <div className="bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-6 shadow-hard space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#ece9db]">
              <h3 className="text-base font-black text-[var(--dp-color-ink)] flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-amber-600 stroke-[2.5]" />
                أقرب موعد معاينة
              </h3>
              <Link to="/buyer/appointments" className="text-xs font-bold text-[var(--dp-color-accent)] hover:underline">
                الجدول
              </Link>
            </div>

            {upcomingConfirmed ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border-[2px] border-[var(--dp-color-outline)] bg-[#fffdf0] space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="fresh" size="sm">
                      {upcomingConfirmed.statusLabel}
                    </Badge>
                    <span className="text-[11px] font-mono text-[#626d84]">
                      {upcomingConfirmed.id}
                    </span>
                  </div>

                  <h4 className="text-sm font-black text-[var(--dp-color-ink)] line-clamp-2">
                    {upcomingConfirmed.propertyTitle}
                  </h4>

                  <div className="space-y-1.5 text-xs font-bold text-[#526078] pt-1 border-t border-amber-200/60">
                    <div className="flex items-center gap-2 text-amber-950 font-black">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span>{upcomingConfirmed.date} • {upcomingConfirmed.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      <span>{upcomingConfirmed.propertyLocation}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-[var(--dp-color-accent)]" />
                      <span>المالك: {upcomingConfirmed.sellerName}</span>
                    </div>
                  </div>

                  {upcomingConfirmed.notes && (
                    <p className="text-[11px] text-[#4b5563] bg-white p-2.5 rounded-lg border border-[var(--dp-color-outline)]">
                      💡 {upcomingConfirmed.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${upcomingConfirmed.sellerPhone}`}
                    className="flex-1"
                  >
                    <Button
                      variant="warm"
                      size="sm"
                      className="w-full text-xs"
                      rightIcon={<Phone className="w-3.5 h-3.5" />}
                    >
                      اتصال بالمالك ({upcomingConfirmed.sellerPhone})
                    </Button>
                  </a>
                  <Link to={`/properties/${upcomingConfirmed.propertyId}`}>
                    <Button variant="outline" size="sm" title="عرض تفاصيل الإعلان">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center space-y-3 bg-[var(--dp-color-ground)] rounded-xl border border-[var(--dp-color-outline)]">
                <CalendarCheck className="w-8 h-8 text-[#8896ab] mx-auto stroke-[1.8]" />
                <p className="text-xs font-bold text-[#626d84] leading-relaxed">
                  ليس لديك مواعيد معاينة مؤكدة حالياً. يمكنك حجز موعد زيارة لأي عقار مباشرة من صفحة تفاصيله.
                </p>
                <Link to="/properties">
                  <Button variant="outline" size="sm" className="text-xs">
                    استكشف العقارات
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Quick Support / Safe Inspection Tip */}
          <div className="bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-5 shadow-hard space-y-2.5">
            <div className="flex items-center gap-2 text-sm font-black text-emerald-950">
              <span className="p-1 rounded-lg bg-[var(--dp-color-accent-fresh)] border border-[var(--dp-color-outline)]">
                🛡️
              </span>
              <span>نصائح المعاينة الآمنة مع شقتي</span>
            </div>
            <ul className="text-xs text-[#4b5563] font-bold space-y-1.5 list-disc list-inside leading-relaxed">
              <li>تأكد من شارة "موثق" لمراجعة مستندات الملكية ورخصة البناء.</li>
              <li>راجع التشطيب والمرافق (الكهرباء والمياه والغاز) على الطبيعة.</li>
              <li>فريق الدعم متاح لمرافقتك واستشارتك القانونية في أي وقت.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog: Remove from favorites */}
      <ConfirmDialog
        isOpen={Boolean(removeFavId)}
        onClose={() => setRemoveFavId(null)}
        onConfirm={() => removeFavId && handleRemoveFavorite(removeFavId)}
        title="تأكيد إزالة العقار من المفضلة"
        description="هل أنت متأكد من رغبتك في إزالة هذا العقار من قائمة مفضلتك؟ يمكنك إضافته مجدداً في أي وقت."
        confirmLabel="إزالة من المفضلة"
        cancelLabel="إلغاء"
        variant="danger"
      />
    </DashboardLayout>
  );
};
