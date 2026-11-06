import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { Notification } from '@/components/ui/Notification';
import { useAuth } from '@/context/AuthContext';
import {
  getAdminProperties,
  AdminProperty,
} from '@/services/adminService';
import {
  sbFetchReviewQueue,
  sbUpdatePropertyStatus,
  sbCreateAuditLog,
  SupabaseProperty,
} from '@/services/supabaseService';
import { PropertyReviewModal } from '@/components/admin/PropertyReviewModal';
import { formatEGP } from '@/lib/utils';
import {
  FileCheck,
  Search,
  Filter,
  ArrowUpDown,
  Building2,
  Calendar,
  User,
  ShieldCheck,
  X,
  FileText,
  AlertCircle,
  Eye,
} from 'lucide-react';

export const AdminReviewsPage: React.FC = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<AdminProperty | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ title: string; message: string; variant: 'success' | 'warning' | 'error' } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Try Supabase first, fall back to local service
      const sbData = await sbFetchReviewQueue().catch(() => null);
      const localAdmin = getAdminProperties();
      const localMap = new Map(localAdmin.map((a) => [a.id, a]));

      if (sbData && sbData.length > 0) {
        // Map Supabase rows to AdminProperty shape for modal compatibility
        const mapped: AdminProperty[] = sbData.map((p: SupabaseProperty) => {
          const matched = localMap.get(p.id);
          const cover = p.cover_image_url || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';
          const imgs = (p.images && p.images.length > 0) ? p.images : [cover];
          return {
            id: p.id,
            title: p.title,
            price: p.price,
            area: p.area,
            bedrooms: p.bedrooms || 0,
            bathrooms: p.bathrooms || 0,
            city: p.city || '',
            location: p.neighborhood || p.city || '',
            type: p.property_type || 'شقة',
            imageUrl: cover,
            images: imgs,
            imagesList: imgs.map((url, i) => ({
              id: `img-${p.id}-${i}`,
              url,
              quality: 'high' as const,
            })),
            isVerified: p.is_verified || false,
            status: p.status as any,
            reviewStatus: (p.status === 'pending_review' ? 'pending_review' : p.status === 'requires_changes' ? 'requires_changes' : 'published') as any,
            submissionDate: p.created_at?.slice(0, 10) || '',
            subType: matched?.subType,
            customDetails: matched?.customDetails,
            seller: {
              id: p.seller_id,
              name: (p as any).profiles?.full_name || matched?.seller?.name || 'بائع',
              phone: (p as any).profiles?.phone || matched?.seller?.phone || '',
              email: (p as any).profiles?.email || matched?.seller?.email || '',
              registrationDate: p.created_at?.slice(0, 10) || '',
              isIdentityVerified: true,
              rating: 5,
              totalSubmitted: 1,
              approvedCount: 0,
              rejectedCount: 0,
            },
            documents: (matched?.documents && matched.documents.length > 0) ? matched.documents : [
              {
                id: `doc-${p.id}-1`,
                name: 'عقد الملكية الموثق أو سند الملكية.pdf',
                type: 'deed',
                url: '#',
                size: '2.5 MB',
                uploadDate: (p.created_at || '').slice(0, 10) || '2026-11-04',
                status: 'pending',
              },
            ],
            description: p.description || matched?.description || '',
            createdAt: p.created_at,
          };
        });

        // Also append any local properties awaiting review that aren't in Supabase response
        localAdmin.forEach((la) => {
          if (!mapped.some((m) => m.id === la.id) && (la.reviewStatus === 'pending_review' || la.reviewStatus === 'requires_changes')) {
            mapped.push(la);
          }
        });

        setProperties(mapped);
      } else {
        setProperties(localAdmin);
      }
    } catch {
      setProperties(getAdminProperties());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatusTab, setSelectedStatusTab] = useState<'pending' | 'requires_changes' | 'all'>('pending');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price_high' | 'price_low'>('newest');

  // Filter & Sort Logic
  const filteredProperties = useMemo(() => {
    return properties
      .filter((prop) => {
        // Tab filter
        if (selectedStatusTab === 'pending' && prop.reviewStatus !== 'pending_review') {
          return false;
        }
        if (selectedStatusTab === 'requires_changes' && prop.reviewStatus !== 'requires_changes') {
          return false;
        }

        // Search filter (title, seller, city, district)
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchTitle = prop.title.toLowerCase().includes(q);
          const matchSeller = prop.seller.name.toLowerCase().includes(q);
          const matchCity = prop.city.toLowerCase().includes(q);
          const matchLocation = prop.location.toLowerCase().includes(q);
          if (!matchTitle && !matchSeller && !matchCity && !matchLocation) return false;
        }

        // Type filter
        if (selectedType !== 'all' && prop.type !== selectedType) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.submissionDate).getTime() - new Date(b.submissionDate).getTime();
        }
        if (sortBy === 'price_high') {
          return b.price - a.price;
        }
        if (sortBy === 'price_low') {
          return a.price - b.price;
        }
        return 0;
      });
  }, [properties, selectedStatusTab, searchTerm, selectedType, sortBy]);

  // Pending count
  const pendingCount = properties.filter((p) => p.reviewStatus === 'pending_review').length;
  const changesCount = properties.filter((p) => p.reviewStatus === 'requires_changes').length;

  const refreshList = () => {
    loadData();
  };

  return (
    <DashboardLayout
      role="admin"
      title="طابور مراجعة العقارات واعتماد المستندات"
      subtitle="فحص مستندات الملكية الرسمية والتراخيص قبل منح شارة التوثيق ونشر العقار بالسوق."
    >
      <div className="space-y-6 text-right">
        {toastMessage && (
          <Notification
            variant={toastMessage.variant}
            title={toastMessage.title}
            message={toastMessage.message}
            onClose={() => setToastMessage(null)}
          />
        )}

        {/* Status Category Tabs */}
        <div className="flex border-b-[2.5px] border-[var(--dp-color-outline)] gap-2">
          <button
            onClick={() => setSelectedStatusTab('pending')}
            className={`pb-3 px-4 text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer border-b-[3px] -mb-[2.5px] ${
              selectedStatusTab === 'pending'
                ? 'border-[var(--dp-color-accent)] text-[var(--dp-color-accent)]'
                : 'border-transparent text-[#626d84] hover:text-[var(--dp-color-ink)]'
            }`}
          >
            <span>بانتظار المراجعة</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-900 border border-amber-300">
              {pendingCount}
            </span>
          </button>

          <button
            onClick={() => setSelectedStatusTab('requires_changes')}
            className={`pb-3 px-4 text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer border-b-[3px] -mb-[2.5px] ${
              selectedStatusTab === 'requires_changes'
                ? 'border-[var(--dp-color-accent)] text-[var(--dp-color-accent)]'
                : 'border-transparent text-[#626d84] hover:text-[var(--dp-color-ink)]'
            }`}
          >
            <span>مطلوب تعديلات واستيفاء أوراق</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-900 border border-purple-300">
              {changesCount}
            </span>
          </button>

          <button
            onClick={() => setSelectedStatusTab('all')}
            className={`pb-3 px-4 text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer border-b-[3px] -mb-[2.5px] ${
              selectedStatusTab === 'all'
                ? 'border-[var(--dp-color-accent)] text-[var(--dp-color-accent)]'
                : 'border-transparent text-[#626d84] hover:text-[var(--dp-color-ink)]'
            }`}
          >
            <span>كافة طلبات المراجعة</span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-[var(--dp-color-panel)] border-[2.5px] border-[var(--dp-color-outline)] rounded-xl p-4 shadow-hard-sm space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="md:col-span-5 relative">
              <Input
                placeholder="ابحث بالعنوان، اسم البائع، أو المدينة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                rightIcon={<Search className="w-4 h-4 text-[#8b95aa]" />}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Property Type Filter */}
            <div className="md:col-span-3">
              <Select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                options={[
                  { value: 'all', label: 'جميع أنواع العقارات' },
                  { value: 'شقة', label: 'شقق سكنية' },
                  { value: 'فيلا', label: 'فيلات مستقلة' },
                  { value: 'شاليه', label: 'شاليهات ومصايف' },
                  { value: 'دوبلكس', label: 'دوبلكس وبنتهاوس' },
                  { value: 'تجاري', label: 'مقرات إدارية وتجارية' },
                ]}
              />
            </div>

            {/* Sorting */}
            <div className="md:col-span-4">
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                options={[
                  { value: 'newest', label: 'ترتيب حسب: الأحدث تقديماً' },
                  { value: 'oldest', label: 'ترتيب حسب: الأقدم تقديماً' },
                  { value: 'price_high', label: 'ترتيب حسب: الأعلى سعراً' },
                  { value: 'price_low', label: 'ترتيب حسب: الأقل سعراً' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Queue Items List */}
        {filteredProperties.length === 0 ? (
          <div className="p-12 bg-white border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] text-center shadow-hard space-y-3">
            <ShieldCheck className="w-16 h-16 text-emerald-600 mx-auto" />
            <h3 className="text-lg font-black text-[var(--dp-color-ink)]">
              لا توجد عقارات مطابقة في هذا التصنيف
            </h3>
            <p className="text-xs text-[#626d84] max-w-md mx-auto">
              إما أنه تم اعتماد كافة العقارات المعلقة، أو أن معايير البحث والفلترة لا تطابق أية نتائج.
            </p>
            {searchTerm && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedType('all');
                }}
              >
                مسح الفلاتر
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-[#626d84] font-bold px-1">
              <span>عرض {filteredProperties.length} عقار يتطلب الإجراء الإداري</span>
            </div>

            {filteredProperties.map((prop) => (
              <div
                key={prop.id}
                className="bg-white border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-5 shadow-hard flex flex-col lg:flex-row lg:items-center justify-between gap-5 hover:shadow-hard-lg transition-all"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {/* Property Image */}
                  <div className="relative w-full sm:w-36 h-28 rounded-xl overflow-hidden border-[2px] border-[var(--dp-color-outline)] bg-gray-100 shrink-0">
                    <img
                      src={prop.imageUrl}
                      alt={prop.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm border border-[var(--dp-color-outline)] px-2 py-0.5 rounded text-[10px] font-black">
                      {prop.type}
                    </div>
                  </div>

                  {/* Property Info */}
                  <div className="space-y-1.5 text-right">
                    <div className="flex flex-wrap items-center gap-2">
                      {prop.reviewStatus === 'pending_review' && (
                        <Badge variant="warm" size="sm">
                          قيد المراجعة
                        </Badge>
                      )}
                      {prop.reviewStatus === 'requires_changes' && (
                        <Badge variant="secondary" size="sm">
                          مطلوب تعديلات
                        </Badge>
                      )}
                      {prop.reviewStatus === 'published' && (
                        <Badge variant="fresh" size="sm">
                          منشور
                        </Badge>
                      )}
                      {prop.reviewStatus === 'rejected' && (
                        <Badge variant="danger" size="sm">
                          مرفوض
                        </Badge>
                      )}

                      <span className="text-xs font-bold text-[#626d84] flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        تاريخ الإرسال: {prop.submissionDate}
                      </span>
                    </div>

                    <h4 className="text-base font-black text-[var(--dp-color-ink)] line-clamp-1">
                      {prop.title}
                    </h4>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs font-bold text-[#4b5563]">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-[#8b95aa]" />
                        المالك: <strong className="text-[var(--dp-color-ink)]">{prop.seller.name}</strong>
                      </span>
                      <span>•</span>
                      <span>المدينة: <strong>{prop.city}</strong></span>
                      <span>•</span>
                      <span>المساحة: <strong>{prop.area} م²</strong></span>
                      <span>•</span>
                      <span className="text-[var(--dp-color-accent)] font-black text-sm">
                        {formatEGP(prop.price)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1 text-xs">
                      <span className="p-1 rounded bg-[var(--dp-color-field-soft)] border border-[var(--dp-color-outline)] text-[10px] font-black text-indigo-900 flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {prop.documents.length} مستندات ملكية مرفقة
                      </span>

                      {prop.correctionNotes && (
                        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
                          بانتظار رد البائع على التعديلات المطلوبة
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Review CTA Button */}
                <div className="flex items-center gap-2 lg:self-center shrink-0 border-t-2 sm:border-t-0 pt-3 sm:pt-0 border-[#ece9db]">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setSelectedProperty(prop)}
                    className="w-full sm:w-auto shadow-hard-sm text-xs font-black"
                  >
                    مراجعة العقار والمستندات
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Property Review Modal */}
      <PropertyReviewModal
        isOpen={Boolean(selectedProperty)}
        onClose={() => setSelectedProperty(null)}
        property={selectedProperty}
        onActionComplete={(updated) => {
          setSelectedProperty(null);
          refreshList();
          if (updated.reviewStatus === 'published') {
            setToastMessage({
              title: 'تم اعتماد العقار ونشره بنجاح!',
              message: `تم توثيق العقار "${updated.title}" ونشره بالسوق فوراً ومنحه شارة التوثيق مع إشعار البائع.`,
              variant: 'success',
            });
          } else if (updated.reviewStatus === 'requires_changes') {
            setToastMessage({
              title: 'تم إرسال طلب التعديلات للبائع',
              message: `تم تحويل حالة العقار وإشعار البائع بالنواقص المطلوبة بنجاح.`,
              variant: 'warning',
            });
          } else if (updated.reviewStatus === 'rejected') {
            setToastMessage({
              title: 'تم رفض طلب نشر العقار',
              message: `تم حجب العقار وإرسال سبب الرفض للبائع.`,
              variant: 'error',
            });
          }
        }}
      />
    </DashboardLayout>
  );
};
