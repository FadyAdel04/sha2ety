import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Notification } from '@/components/ui/Notification';
import { Skeleton } from '@/components/ui/Skeleton';
import { PropertyItem } from '@/components/ui/PropertyCard';
import { formatEGP, formatArea } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/hooks/useSupabaseData';
import {
  getBuyerFavorites,
  removeBuyerFavorite,
} from '@/services/buyerService';
import {
  Heart,
  Compass,
  MapPin,
  BedDouble,
  Bath,
  Maximize2,
  Trash2,
  Eye,
  ShieldCheck,
  Building2,
  SlidersHorizontal,
} from 'lucide-react';

export const BuyerFavoritesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { favorites: sbFavorites, loading: sbLoading, remove: removeSb } = useFavorites(user?.id);
  const [favorites, setFavorites] = useState<PropertyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!sbLoading) {
      if (sbFavorites.length > 0) {
        setFavorites(sbFavorites);
      } else {
        setFavorites(getBuyerFavorites(user?.id));
      }
      setLoading(false);
    }
  }, [sbLoading, sbFavorites, user?.id]);

  const handleRemove = async (id: string) => {
    if (user?.id) {
      await removeSb(id).catch(() => {});
    }
    const updated = removeBuyerFavorite(id, user?.id);
    setFavorites(sbFavorites.length > 0 ? sbFavorites.filter((f) => f.id !== id) : updated);
    setConfirmDeleteId(null);
    setToastMessage('تمت إزالة العقار من المفضلة بنجاح.');
  };

  const filtered = favorites.filter((prop) => {
    if (filterType === 'all') return true;
    return prop.type === filterType;
  });

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'reserved':
        return <Badge variant="warm">تم الحجز</Badge>;
      case 'sold':
        return <Badge variant="muted">تم البيع</Badge>;
      case 'available':
      default:
        return <Badge variant="fresh">متاح للبيع</Badge>;
    }
  };

  return (
    <DashboardLayout
      role="buyer"
      title="عقاراتي المفضلة"
      subtitle="قائمة بجميع العقارات التي قمت بحفظها ومقارنتها لاختيار العقار المناسب."
      actions={
        <Link to="/properties">
          <Button
            variant="primary"
            size="sm"
            rightIcon={<Compass className="w-4 h-4 stroke-[2.5]" />}
          >
            استكشف عقارات أخرى
          </Button>
        </Link>
      }
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="mb-6 animate-fadeIn text-right">
          <Notification
            variant="success"
            title="تم بنجاح"
            message={toastMessage}
            onClose={() => setToastMessage(null)}
          />
        </div>
      )}

      {/* Filter Tabs Header */}
      {favorites.length > 0 && (
        <div className="bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-4 shadow-hard mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-right">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-black text-[#526078] flex items-center gap-1 shrink-0 ml-2">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              تصفية:
            </span>
            {[
              { id: 'all', label: 'الكل' },
              { id: 'شقة', label: 'شقق سكنية' },
              { id: 'فيلا', label: 'فيلات مستقلة' },
              { id: 'دوبلكس', label: 'دوبلكس' },
              { id: 'شاليه', label: 'شاليهات' },
            ].map((tab) => {
              const isActive = filterType === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterType(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border-[2px] whitespace-nowrap ${
                    isActive
                      ? 'bg-[var(--dp-color-accent)] text-white border-[var(--dp-color-outline)] shadow-hard-xs'
                      : 'bg-[var(--dp-color-ground)] border-transparent text-[#526078] hover:border-[var(--dp-color-outline)]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <span className="text-xs font-bold text-[#626d84] shrink-0">
            العقارات المعروضة: <strong className="text-[var(--dp-color-ink)]">{filtered.length}</strong> من أصل {favorites.length}
          </span>
        </div>
      )}

      {/* Favorites Grid */}
      {filtered.length === 0 ? (
        <div className="bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-10 shadow-hard text-right">
          <EmptyState
            icon={<Heart className="w-8 h-8 text-rose-500" />}
            title={favorites.length === 0 ? 'مفضلتك فارغة حالياً' : 'لا توجد عقارات مطابقة لهذا التصنيف'}
            description={
              favorites.length === 0
                ? 'تصفح قائمة العقارات الموثقة على شقتي واضغط على رمز القلب لحفظ العقار والعودة إليه في أي وقت.'
                : 'جرب اختيار تصنيف آخر لعرض العقارات المحفوظة.'
            }
            actionLabel="تصفح العقارات المتاحة"
            onAction={() => navigate('/properties')}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-right">
          {filtered.map((property) => (
            <article
              key={property.id}
              className="bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] overflow-hidden shadow-hard flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-hard-lg"
            >
              {/* Cover Image & Badges */}
              <div className="relative aspect-16/10 w-full overflow-hidden border-b-[3px] border-[var(--dp-color-outline)] bg-[#f3f1e8]">
                <img
                  src={property.imageUrl}
                  alt={property.title}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />

                <div className="absolute top-3 right-3 flex items-center gap-2">
                  {getStatusBadge(property.status)}
                  {property.isVerified && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-black bg-[var(--dp-color-accent-warm)] text-[var(--dp-color-ink)] border-[2px] border-[var(--dp-color-outline)] rounded-full shadow-hard-xs">
                      <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                      موثق
                    </span>
                  )}
                </div>

                <div className="absolute bottom-3 right-3 bg-[var(--dp-color-panel)] border-[2px] border-[var(--dp-color-outline)] px-2.5 py-0.5 rounded-lg text-xs font-black text-[var(--dp-color-ink)] shadow-hard-xs">
                  {property.type}
                </div>
              </div>

              {/* Property Details */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  {/* Price */}
                  <div>
                    <span className="text-xl sm:text-2xl font-black text-[var(--dp-color-accent)] block">
                      {formatEGP(property.price)}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-black text-[var(--dp-color-ink)] line-clamp-1 hover:text-[var(--dp-color-accent)]">
                    <Link to={`/properties/${property.id}`}>{property.title}</Link>
                  </h3>

                  {/* Location */}
                  <div className="flex items-center gap-1.5 text-xs text-[#626d84] font-bold">
                    <MapPin className="w-4 h-4 text-[var(--dp-color-accent-secondary)] shrink-0" />
                    <span className="truncate">{property.location}، {property.city}</span>
                  </div>

                  {/* Specs Strip (Area, Bedrooms, Bathrooms) */}
                  <div className="grid grid-cols-3 gap-2 py-2.5 border-y-[2px] border-[#ece9db] text-xs font-bold text-[var(--dp-color-ink)]">
                    <div className="flex items-center justify-center gap-1 bg-[var(--dp-color-ground)] py-1 rounded-lg border border-[var(--dp-color-outline)]">
                      <Maximize2 className="w-3.5 h-3.5 text-[var(--dp-color-accent)]" />
                      <span>{formatArea(property.area)}</span>
                    </div>
                    <div className="flex items-center justify-center gap-1 bg-[var(--dp-color-ground)] py-1 rounded-lg border border-[var(--dp-color-outline)]">
                      <BedDouble className="w-3.5 h-3.5 text-[var(--dp-color-accent)]" />
                      <span>{property.bedrooms > 0 ? `${property.bedrooms} غرف` : '-'}</span>
                    </div>
                    <div className="flex items-center justify-center gap-1 bg-[var(--dp-color-ground)] py-1 rounded-lg border border-[var(--dp-color-outline)]">
                      <Bath className="w-3.5 h-3.5 text-[var(--dp-color-accent)]" />
                      <span>{property.bathrooms > 0 ? `${property.bathrooms} حمام` : '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Actions: View Details + Remove from Favorites */}
                <div className="flex items-center gap-2 pt-2">
                  <Link to={`/properties/${property.id}`} className="flex-1">
                    <Button variant="primary" size="sm" className="w-full text-xs font-black justify-center" rightIcon={<Eye className="w-3.5 h-3.5" />}>
                      عرض التفاصيل
                    </Button>
                  </Link>

                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(property.id)}
                    className="p-2 rounded-xl border-[2px] border-[var(--dp-color-outline)] bg-rose-50 text-rose-700 hover:bg-rose-100 cursor-pointer shadow-hard-xs transition-colors shrink-0"
                    title="إزالة من المفضلة"
                    aria-label="إزالة من المفضلة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Confirmation Dialog: Remove from favorites */}
      <ConfirmDialog
        isOpen={Boolean(confirmDeleteId)}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => confirmDeleteId && handleRemove(confirmDeleteId)}
        title="تأكيد حذف العقار من المفضلة"
        description="هل أنت متأكد من رغبتك في إزالة هذا العقار من قائمة مفضلتك؟ يمكنك إضافته مجدداً في أي وقت."
        confirmLabel="نعم، احذف من المفضلة"
        cancelLabel="تراجع"
        variant="danger"
      />
    </DashboardLayout>
  );
};
