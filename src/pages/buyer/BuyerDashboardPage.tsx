import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth, UserRole } from '@/context/AuthContext';
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
  getBuyerFavorites,
  getBuyerAppointments,
  getBuyerStatistics,
  getBuyerRecentlyViewed,
  removeBuyerFavorite,
  BuyerStatistics,
  BuyerAppointment,
} from '@/services/buyerService';
import { getUserConversations } from '@/services/communicationService';
import {
  Heart,
  CalendarCheck,
  History,
  Compass,
  MapPin,
  User,
  Phone,
  MessageSquare,
  Search,
  Building,
  ShieldCheck,
  LogOut,
} from 'lucide-react';

export const BuyerDashboardPage: React.FC = () => {
  const { user, switchUserRole, logout } = useAuth();
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
  const [inquiriesCount, setInquiriesCount] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [removeFavId, setRemoveFavId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'favorites' | 'appointments' | 'viewed'>('favorites');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSwitching, setIsSwitching] = useState(false);

  // Load and merge data
  useEffect(() => {
    const isSupabaseReady = !sbFavs.loading && !sbApps.loading && !sbStats.loading;
    if (isSupabaseReady) {
      if (sbFavs.favorites.length > 0) {
        setFavorites(sbFavs.favorites);
      } else {
        setFavorites(getBuyerFavorites(user?.id));
      }

      if (sbApps.appointments.length > 0) {
        const mapped: BuyerAppointment[] = sbApps.appointments.map((a: any) => ({
          id: a.id,
          propertyId: a.property_id,
          propertyTitle: a.property?.title || 'عقار مميز',
          propertyImage: a.property?.cover_image_url || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80',
          propertyLocation: a.property?.city || 'القاهرة',
          propertyPrice: a.property?.price || 0,
          sellerName: a.seller?.full_name || 'المالك',
          sellerPhone: a.seller?.phone || '01001234567',
          isSellerVerified: true,
          date: new Date(a.appointment_date).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' }),
          time: a.appointment_time,
          status: a.status,
          statusLabel: ({ pending: 'قيد الانتظار', confirmed: 'مؤكد', completed: 'مكتمل', cancelled: 'ملغي' } as Record<string, string>)[a.status] || a.status,
          notes: a.buyer_message,
          createdAt: a.created_at,
        }));
        setAppointments(mapped);
      } else {
        setAppointments(getBuyerAppointments(user?.id));
      }

      if (sbStats.stats) {
        setStats(sbStats.stats);
      } else {
        getBuyerStatistics(user?.id).then(setStats);
      }

      if (sbViewed.properties.length > 0) {
        setRecentlyViewed(sbViewed.properties);
      } else {
        setRecentlyViewed(getBuyerRecentlyViewed(user?.id));
      }

      setLoading(false);
    } else {
      // Fallback timer
      const timer = setTimeout(() => {
        setFavorites(getBuyerFavorites(user?.id));
        setAppointments(getBuyerAppointments(user?.id));
        getBuyerStatistics(user?.id).then(setStats);
        setRecentlyViewed(getBuyerRecentlyViewed(user?.id));
        setLoading(false);
      }, 1500);
      return () => clearTimeout(timer);
    }

    try {
      setInquiriesCount(getUserConversations('buyer', user?.id).length);
    } catch {
      setInquiriesCount(0);
    }
  }, [sbFavs.loading, sbApps.loading, sbStats.loading, sbViewed.loading, user?.id]);

  const handleRemoveFavorite = async (propertyId: string) => {
    if (user?.id) {
      await sbFavs.remove(propertyId).catch(() => {});
    }
    const updated = removeBuyerFavorite(propertyId, user?.id);
    setFavorites(sbFavs.favorites.length > 0
      ? sbFavs.favorites.filter((f) => f.id !== propertyId)
      : updated);
    setRemoveFavId(null);
    setToastMessage('تم حذف العقار من مفضلتك.');
    if (sbStats.stats) {
      sbStats.reload();
    } else {
      getBuyerStatistics().then(setStats);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/properties?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/properties');
    }
  };

  const handleRoleSwitch = async (targetRole: UserRole) => {
    setIsSwitching(true);
    try {
      const res = await switchUserRole(targetRole);
      if (!res.error) {
        if (res.role === 'seller') navigate('/seller/dashboard', { replace: true });
        else if (res.role === 'admin') navigate('/admin/dashboard', { replace: true });
        else navigate('/buyer/dashboard', { replace: true });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSwitching(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const buyerName = user?.fullName || 'كريم عبد الله';

  return (
    <DashboardLayout
      role="buyer"
      title="مساحة المشتري"
      subtitle="استعرض عقاراتك المفضلة، تابع مواعيد المعاينات وتواصل مع البائعين بسهولة."
      actions={
        <Link to="/properties">
          <Button
            variant="primary"
            size="sm"
            rightIcon={<Compass className="w-4 h-4 stroke-[2.5]" />}
          >
            تصفح العقارات
          </Button>
        </Link>
      }
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="mb-4 animate-fadeIn">
          <Notification
            variant="success"
            title="تم بنجاح"
            message={toastMessage}
            onClose={() => setToastMessage(null)}
          />
        </div>
      )}

      {/* ----------------------------------------------------
          1. Hero & Fast Property Search Card
         ---------------------------------------------------- */}
      <section className="bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-4 sm:p-7 shadow-hard text-right">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[var(--dp-color-accent-fresh)] border border-[var(--dp-color-outline)] text-xs font-black text-[var(--dp-color-ink)] mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>مرحباً، {buyerName}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[var(--dp-color-ink)]">
              جاهز تلاقي عقارك الجاي؟
            </h2>
            <p className="text-xs sm:text-sm text-[#526078] font-bold mt-1">
              ابحث بين آلاف العقارات المفحوصة والموثقة قانونياً في مصر.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/properties">
              <Button variant="primary" size="sm" rightIcon={<Compass className="w-4 h-4" />}>
                استكشف الآن
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="ابحث بالمنطقة أو المدينة (مثال: التجمع الخامس، زايد، المعادي...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--dp-color-ground)] text-[var(--dp-color-ink)] border-[2.5px] border-[var(--dp-color-outline)] rounded-xl py-2.5 pr-10 pl-4 text-xs sm:text-sm font-bold focus:outline-none focus:border-[var(--dp-color-accent)] transition-all"
            />
          </div>
          <Button type="submit" variant="warm" size="sm" className="shrink-0 text-xs py-2.5">
            بحث
          </Button>
        </form>
      </section>

      {/* ----------------------------------------------------
          2. Compact Activity Stats (4 Cards)
         ---------------------------------------------------- */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-right">
        {/* 1. المفضلة */}
        <button
          type="button"
          onClick={() => setActiveTab('favorites')}
          className={`p-3.5 sm:p-5 rounded-[var(--dp-radius-corner)] border-[2.5px] border-[var(--dp-color-outline)] text-right transition-all cursor-pointer ${
            activeTab === 'favorites'
              ? 'bg-[#fff0f4] shadow-hard -translate-y-0.5'
              : 'bg-[var(--dp-color-panel)] hover:bg-[#fff7f9] shadow-hard-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-white border border-[var(--dp-color-outline)] text-rose-500 shadow-xs">
              <Heart className="w-4 h-4 fill-rose-500" />
            </span>
            <span className="text-[11px] font-bold text-rose-700">محفوظة</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-950">
            {favorites.length}
          </div>
          <span className="text-xs font-black text-[#526078] mt-0.5 block">
            العقارات المفضلة
          </span>
        </button>

        {/* 2. المعاينات */}
        <button
          type="button"
          onClick={() => setActiveTab('appointments')}
          className={`p-3.5 sm:p-5 rounded-[var(--dp-radius-corner)] border-[2.5px] border-[var(--dp-color-outline)] text-right transition-all cursor-pointer ${
            activeTab === 'appointments'
              ? 'bg-[#fffdf0] shadow-hard -translate-y-0.5'
              : 'bg-[var(--dp-color-panel)] hover:bg-[#fffdf5] shadow-hard-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-[var(--dp-color-accent-warm)] border border-[var(--dp-color-outline)] text-amber-950 shadow-xs">
              <CalendarCheck className="w-4 h-4 stroke-[2.5]" />
            </span>
            <span className="text-[11px] font-bold text-amber-800">ميدانية</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-950">
            {appointments.length}
          </div>
          <span className="text-xs font-black text-[#526078] mt-0.5 block">
            مواعيد المعاينة
          </span>
        </button>

        {/* 3. استفساراتي */}
        <Link
          to="/buyer/inquiries"
          className="p-3.5 sm:p-5 rounded-[var(--dp-radius-corner)] border-[2.5px] border-[var(--dp-color-outline)] bg-[var(--dp-color-panel)] hover:bg-[var(--dp-color-selection)] shadow-hard-sm hover:-translate-y-0.5 transition-all block text-right"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-[var(--dp-color-accent-fresh)] border border-[var(--dp-color-outline)] text-emerald-950 shadow-xs">
              <MessageSquare className="w-4 h-4 stroke-[2.5]" />
            </span>
            <span className="text-[11px] font-bold text-emerald-800">رسائل</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-950">
            {inquiriesCount}
          </div>
          <span className="text-xs font-black text-[#526078] mt-0.5 block">
            استفسارات الملاك
          </span>
        </Link>

        {/* 4. شوهدت مؤخراً */}
        <button
          type="button"
          onClick={() => setActiveTab('viewed')}
          className={`p-3.5 sm:p-5 rounded-[var(--dp-radius-corner)] border-[2.5px] border-[var(--dp-color-outline)] text-right transition-all cursor-pointer ${
            activeTab === 'viewed'
              ? 'bg-[#f4f2ff] shadow-hard -translate-y-0.5'
              : 'bg-[var(--dp-color-panel)] hover:bg-[#fbfaff] shadow-hard-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-xl bg-white border border-[var(--dp-color-outline)] text-[var(--dp-color-accent)] shadow-xs">
              <History className="w-4 h-4 stroke-[2.5]" />
            </span>
            <span className="text-[11px] font-bold text-[var(--dp-color-accent)]">تصفح</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[var(--dp-color-ink)]">
            {recentlyViewed.length}
          </div>
          <span className="text-xs font-black text-[#526078] mt-0.5 block">
            شوهدت مؤخراً
          </span>
        </button>
      </section>

      {/* ----------------------------------------------------
          3. Clear, Intuitive Tab Navigation
         ---------------------------------------------------- */}
      <section className="bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-4 sm:p-6 shadow-hard text-right space-y-5">
        {/* Tab Buttons */}
        <div className="flex items-center gap-2 pb-3 border-b-2 border-[#ece9db] overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('favorites')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'favorites'
                ? 'bg-[var(--dp-color-accent-fresh)] text-[var(--dp-color-ink)] border-[2px] border-[var(--dp-color-outline)] shadow-hard-sm'
                : 'text-[#64748b] hover:bg-[var(--dp-color-ground)]'
            }`}
          >
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            <span>عقاراتي المفضلة ({favorites.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('appointments')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'appointments'
                ? 'bg-[var(--dp-color-accent-warm)] text-[var(--dp-color-ink)] border-[2px] border-[var(--dp-color-outline)] shadow-hard-sm'
                : 'text-[#64748b] hover:bg-[var(--dp-color-ground)]'
            }`}
          >
            <CalendarCheck className="w-4 h-4 text-amber-700" />
            <span>مواعيد المعاينة ({appointments.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('viewed')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'viewed'
                ? 'bg-[var(--dp-color-selection)] text-[var(--dp-color-accent)] border-[2px] border-[var(--dp-color-outline)] shadow-hard-sm'
                : 'text-[#64748b] hover:bg-[var(--dp-color-ground)]'
            }`}
          >
            <History className="w-4 h-4 text-[var(--dp-color-accent)]" />
            <span>شوهدت مؤخراً ({recentlyViewed.length})</span>
          </button>
        </div>

        {/* Tab 1 Content: Favorites */}
        {activeTab === 'favorites' && (
          <div>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Skeleton className="h-60 rounded-xl" />
                <Skeleton className="h-60 rounded-xl" />
              </div>
            ) : favorites.length === 0 ? (
              <EmptyState
                icon={<Heart className="w-10 h-10 text-rose-400" />}
                title="لم تحفظ أي عقارات بعد"
                description="استعرض العقارات واضغط على علامة القلب في أي عقار يعجبك لحفظه هنا للمقارنة لاحقاً."
                actionLabel="تصفح العقارات الآن"
                onAction={() => navigate('/properties')}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {favorites.map((prop) => (
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
        )}

        {/* Tab 2 Content: Appointments */}
        {activeTab === 'appointments' && (
          <div>
            {loading ? (
              <Skeleton className="h-40 rounded-xl" />
            ) : appointments.length === 0 ? (
              <EmptyState
                icon={<CalendarCheck className="w-10 h-10 text-amber-500" />}
                title="لا توجد مواعيد معاينة مجدولة"
                description="يمكنك حجز موعد معاينة ميدانية لأي عقار مع البائع مباشرة من صفحة تفاصيل العقار."
                actionLabel="استكشف العقارات واحجز معاينة"
                onAction={() => navigate('/properties')}
              />
            ) : (
              <div className="space-y-3">
                {appointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="p-4 rounded-xl border-[2px] border-[var(--dp-color-outline)] bg-[var(--dp-color-ground)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-right shadow-hard-sm"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={appt.status === 'confirmed' ? 'fresh' : 'warm'} size="sm">
                          {appt.statusLabel}
                        </Badge>
                        <span className="text-xs font-bold text-gray-500">
                          {appt.date} • {appt.time}
                        </span>
                      </div>
                      <h4 className="text-sm sm:text-base font-black text-[var(--dp-color-ink)]">
                        {appt.propertyTitle}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-[#526078] font-bold">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                          {appt.propertyLocation}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-purple-600" />
                          {appt.sellerName}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {appt.sellerPhone && (
                        <a href={`tel:${appt.sellerPhone}`}>
                          <Button variant="warm" size="sm" rightIcon={<Phone className="w-3.5 h-3.5" />}>
                            اتصال ({appt.sellerPhone})
                          </Button>
                        </a>
                      )}
                      <Link to={`/properties/${appt.propertyId}`}>
                        <Button variant="outline" size="sm">
                          تفاصيل العقار
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3 Content: Recently Viewed */}
        {activeTab === 'viewed' && (
          <div>
            {recentlyViewed.length === 0 ? (
              <EmptyState
                icon={<History className="w-10 h-10 text-purple-400" />}
                title="سجل التصفح فارغ"
                description="العقارات التي تفتحها سيتم تسجيلها هنا لتتمكن من الرجوع إليها سريعاً."
                actionLabel="تصفح المعروضات"
                onAction={() => navigate('/properties')}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {recentlyViewed.map((item) => (
                  <Link
                    key={item.id}
                    to={`/properties/${item.id}`}
                    className="p-3 rounded-xl border-2 border-[var(--dp-color-outline)] bg-[var(--dp-color-ground)] hover:bg-[var(--dp-color-selection)] transition-all flex flex-col justify-between group shadow-hard-sm"
                  >
                    <div>
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-32 object-cover rounded-lg border border-[var(--dp-color-outline)] mb-2"
                      />
                      <h4 className="font-black text-xs sm:text-sm text-[var(--dp-color-ink)] line-clamp-1 mb-1">
                        {item.title}
                      </h4>
                      <span className="text-[11px] text-[#626d84] font-bold block mb-1">
                        {item.location}، {item.city}
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm font-black text-[var(--dp-color-accent)] block pt-1">
                      {formatEGP(item.price)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ----------------------------------------------------
          4. Quick Role Switcher & Account Utilities Bar
         ---------------------------------------------------- */}
      <section className="p-4 sm:p-5 rounded-[var(--dp-radius-corner)] border-[2.5px] border-[var(--dp-color-outline)] bg-[var(--dp-color-panel)] shadow-hard text-right space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#ece9db]">
          <span className="text-xs sm:text-sm font-black text-[var(--dp-color-ink)]">
            تبديل الحساب السريع وتسجيل الخروج:
          </span>
          <Badge variant="fresh" size="sm">
            حساب مشتري نشط
          </Badge>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#64748b]">التبديل إلى:</span>
            <button
              type="button"
              disabled={isSwitching}
              onClick={() => handleRoleSwitch('seller')}
              className="px-3 py-1.5 rounded-lg border-2 border-[var(--dp-color-outline)] bg-white hover:bg-[var(--dp-color-accent-warm)] text-xs font-black transition-all cursor-pointer shadow-hard-sm flex items-center gap-1.5"
            >
              <Building className="w-3.5 h-3.5 text-amber-600" />
              <span>حساب البائع (محمد السيد)</span>
            </button>

            <button
              type="button"
              disabled={isSwitching}
              onClick={() => handleRoleSwitch('admin')}
              className="px-3 py-1.5 rounded-lg border-2 border-[var(--dp-color-outline)] bg-white hover:bg-[var(--dp-color-accent-secondary)] hover:text-white text-xs font-black transition-all cursor-pointer shadow-hard-sm flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              <span>مشرف النظام (م. أحمد مهران)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg border-2 border-rose-300 bg-white hover:bg-rose-50 text-rose-600 text-xs font-black transition-all cursor-pointer flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </section>

      {/* Confirmation Dialog: Remove from favorites */}
      <ConfirmDialog
        isOpen={Boolean(removeFavId)}
        onClose={() => setRemoveFavId(null)}
        onConfirm={() => removeFavId && handleRemoveFavorite(removeFavId)}
        title="تأكيد إزالة العقار من المفضلة"
        description="هل تريد إزالة هذا العقار من قائمة مفضلتك؟ يمكنك إضافته مجدداً في أي وقت."
        confirmLabel="إزالة من المفضلة"
        cancelLabel="إلغاء"
        variant="danger"
      />
    </DashboardLayout>
  );
};
