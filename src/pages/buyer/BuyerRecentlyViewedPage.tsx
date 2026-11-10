import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Notification } from '@/components/ui/Notification';
import { PropertyCard, PropertyItem } from '@/components/ui/PropertyCard';
import { useAuth } from '@/context/AuthContext';
import { useRecentlyViewed } from '@/hooks/useSupabaseData';
import {
  getBuyerRecentlyViewed,
  clearBuyerRecentlyViewed,
  isBuyerFavorite,
  toggleBuyerFavorite,
} from '@/services/buyerService';
import {
  History,
  Trash2,
  Compass,
  Eye,
} from 'lucide-react';

export const BuyerRecentlyViewedPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { properties: sbViewed, loading: sbLoading } = useRecentlyViewed(user?.id);
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!sbLoading && sbViewed.length > 0) {
      setProperties(sbViewed);
    } else {
      setProperties(getBuyerRecentlyViewed(user?.id));
    }
  }, [sbLoading, sbViewed, user?.id]);

  const handleClearHistory = () => {
    clearBuyerRecentlyViewed(user?.id);
    setProperties([]);
    setConfirmClearOpen(false);
    setToastMessage('تم مسح سجل العقارات التي شاهدتها بنجاح.');
  };

  const handleFavoriteToggle = (propId: string) => {
    const target = properties.find((p) => p.id === propId);
    if (target) {
      toggleBuyerFavorite(target, user?.id);
    }
  };

  return (
    <DashboardLayout
      role="buyer"
      title="شوهدت مؤخراً"
      subtitle="سجل العقارات التي تصفحت تفاصيلها للرجوع إليها سريعاً دون الحاجة للبحث من جديد."
      actions={
        properties.length > 0 ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmClearOpen(true)}
            rightIcon={<Trash2 className="w-4 h-4 text-rose-600 stroke-[2.5]" />}
          >
            مسح السجل
          </Button>
        ) : (
          <Link to="/properties">
            <Button
              variant="primary"
              size="sm"
              rightIcon={<Compass className="w-4 h-4 stroke-[2.5]" />}
            >
              استكشف العقارات
            </Button>
          </Link>
        )
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

      {/* Grid or Empty State */}
      {properties.length === 0 ? (
        <div className="bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-10 shadow-hard text-right">
          <EmptyState
            icon={<History className="w-8 h-8 text-[var(--dp-color-accent)]" />}
            title="سجل المشاهدات فارغ"
            description="عندما تفتح صفحة أي عقار للاطلاع على مواصفاته وصوره، سيتم حفظه تلقائياً هنا لتتمكن من الرجوع إليه بسهولة."
            actionLabel="تصفح العقارات الآن"
            onAction={() => navigate('/properties')}
          />
        </div>
      ) : (
        <div className="space-y-4 text-right">
          <div className="flex items-center justify-between text-xs font-bold text-[#626d84] px-1">
            <span>العقارات في سجلك: <strong className="text-[var(--dp-color-ink)]">{properties.length}</strong> (حد أقصى 15 عقاراً)</span>
            <span>مرتبة من الأحدث إلى الأقدم</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((prop) => (
              <PropertyCard
                key={prop.id}
                property={prop}
                isFavoriteInitial={isBuyerFavorite(prop.id, user?.id)}
                onFavoriteToggle={() => handleFavoriteToggle(prop.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Dialog: Clear History */}
      <ConfirmDialog
        isOpen={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        onConfirm={handleClearHistory}
        title="تأكيد مسح سجل المشاهدات"
        description="هل أنت متأكد من رغبتك في مسح قائمة العقارات التي شاهدتها مؤخراً؟ لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="نعم، مسح السجل"
        cancelLabel="إلغاء"
        variant="danger"
      />
    </DashboardLayout>
  );
};
