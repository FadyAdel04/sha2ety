import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Skeleton } from '@/components/ui/Skeleton';
import { Notification } from '@/components/ui/Notification';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatEGP, formatDate, formatArea } from '@/lib/utils';
import {
  getSellerProperties,
  markPropertyAsSold,
  deletePropertyDraft,
  resubmitProperty,
  updatePropertyDetails,
  SellerProperty,
  SellerPropertyStatus,
} from '@/services/sellerService';
import {
  PlusCircle,
  Building2,
  Search,
  AlertTriangle,
  Edit3,
  Trash2,
  Check,
  RefreshCw,
  ExternalLink,
  Info,
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
} from 'lucide-react';

type TabStatus = 'all' | 'available' | 'pending_review' | 'requires_changes' | 'draft' | 'sold';

export const SellerPropertiesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<SellerProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTab, setCurrentTab] = useState<TabStatus>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [feedbackModalProperty, setFeedbackModalProperty] = useState<SellerProperty | null>(null);
  const [resubmitModalProperty, setResubmitModalProperty] = useState<SellerProperty | null>(null);
  const [resubmitNotes, setResubmitNotes] = useState('');
  const [editModalProperty, setEditModalProperty] = useState<SellerProperty | null>(null);
  const [editForm, setEditForm] = useState({ title: '', price: 0, description: '' });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [soldConfirmId, setSoldConfirmId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadProperties = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSellerProperties(user?.id);
      setProperties(data);
    } catch (err) {
      console.error('Failed to load seller properties:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      all: properties.length,
      available: properties.filter((p) => p.status === 'available').length,
      pending_review: properties.filter((p) => p.status === 'pending_review').length,
      requires_changes: properties.filter((p) => p.status === 'requires_changes').length,
      draft: properties.filter((p) => p.status === 'draft').length,
      sold: properties.filter((p) => p.status === 'sold').length,
    };
  }, [properties]);

  // Filtered properties
  const filteredProperties = useMemo(() => {
    return properties.filter((prop) => {
      const matchesTab = currentTab === 'all' || prop.status === currentTab;
      const matchesSearch =
        prop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prop.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prop.location.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [properties, currentTab, searchQuery]);

  // Status mapping helper
  const getStatusBadge = (status: SellerPropertyStatus) => {
    switch (status) {
      case 'available':
        return <Badge variant="fresh">منشور للبيع</Badge>;
      case 'pending_review':
        return <Badge variant="warm">قيد المراجعة</Badge>;
      case 'requires_changes':
        return <Badge variant="danger">تحتاج إلى تعديلات</Badge>;
      case 'draft':
        return <Badge variant="muted">مسودة</Badge>;
      case 'rejected':
        return <Badge variant="danger">مرفوض</Badge>;
      case 'sold':
        return <Badge variant="primary">تم البيع</Badge>;
      default:
        return <Badge variant="muted">{status}</Badge>;
    }
  };

  // Actions handlers
  const handleMarkAsSold = async () => {
    if (!soldConfirmId) return;
    setActionLoading(true);
    try {
      await markPropertyAsSold(soldConfirmId);
      setSoldConfirmId(null);
      setToastMessage('تم تعيين العقار كـ "تم البيع" بنجاح');
      await loadProperties();
    } catch {
      setToastMessage('حدث خطأ أثناء تحديث حالة العقار');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDraft = async () => {
    if (!deleteConfirmId) return;
    setActionLoading(true);
    try {
      await deletePropertyDraft(deleteConfirmId);
      setDeleteConfirmId(null);
      setToastMessage('تم حذف المسودة بنجاح');
      await loadProperties();
    } catch {
      setToastMessage('حدث خطأ أثناء حذف المسودة');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResubmit = async () => {
    if (!resubmitModalProperty) return;
    setActionLoading(true);
    try {
      await resubmitProperty(resubmitModalProperty.id, resubmitNotes);
      setResubmitModalProperty(null);
      setResubmitNotes('');
      setToastMessage('تم إعادة إرسال العقار لمراجعة المستندات بنجاح');
      await loadProperties();
    } catch {
      setToastMessage('حدث خطأ أثناء إعادة إرسال العقار');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editModalProperty) return;
    setActionLoading(true);
    try {
      await updatePropertyDetails(editModalProperty.id, editForm);
      setEditModalProperty(null);
      setToastMessage('تم حفظ التعديلات بنجاح');
      await loadProperties();
    } catch {
      setToastMessage('حدث خطأ أثناء تعديل بيانات العقار');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <DashboardLayout
      role="seller"
      title="إدارة عقاراتي المعروضة"
      subtitle="قائمة شاملة بجميع إعلاناتك وحالات المراجعة القانونية مع إمكانية التعديل والمتابعة."
      actions={
        <Link to="/seller/properties/new">
          <Button
            variant="primary"
            size="sm"
            rightIcon={<PlusCircle className="w-4.5 h-4.5 stroke-[2.5]" />}
          >
            إضافة عقار جديد
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

      {/* Tabs & Search Header */}
      <div className="bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-4 sm:p-5 shadow-hard mb-6 text-right space-y-4">
        {/* Search Input */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="ابحث بالعنوان، المدينة، أو الحي..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 rounded-xl border-[2px] border-[var(--dp-color-outline)] bg-[var(--dp-color-ground)] text-sm font-bold placeholder:text-[#8896ab] focus:outline-hidden focus:border-[var(--dp-color-accent)]"
            />
            <Search className="w-4 h-4 text-[#8896ab] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="text-xs font-bold text-[#626d84] self-end sm:self-center">
            إجمالي العقارات المطابقة: <span className="font-black text-[var(--dp-color-ink)]">{filteredProperties.length}</span>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-t border-[#ece9db] pt-3">
          {[
            { id: 'all', label: 'الكل', count: tabCounts.all },
            { id: 'available', label: 'المنشورة', count: tabCounts.available },
            { id: 'pending_review', label: 'قيد المراجعة', count: tabCounts.pending_review },
            { id: 'requires_changes', label: 'تحتاج تعديلات', count: tabCounts.requires_changes },
            { id: 'draft', label: 'مسودات', count: tabCounts.draft },
            { id: 'sold', label: 'تم البيع', count: tabCounts.sold },
          ].map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCurrentTab(tab.id as TabStatus)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer border-[2px] ${
                  isActive
                    ? 'bg-[var(--dp-color-accent)] text-white border-[var(--dp-color-outline)] shadow-hard-xs'
                    : 'bg-[var(--dp-color-ground)] text-[#526078] border-transparent hover:border-[var(--dp-color-outline)]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    isActive ? 'bg-white text-[var(--dp-color-accent)]' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Properties Table & Cards */}
      <div className="bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] overflow-hidden shadow-hard text-right">
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-16 h-16 rounded-xl shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="w-1/2 h-5" />
                  <Skeleton className="w-1/3 h-4" />
                </div>
                <Skeleton className="w-24 h-8 rounded-lg" />
              </div>
            ))}
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="p-10">
            <EmptyState
              icon={<Building2 className="w-8 h-8 text-[var(--dp-color-accent)]" />}
              title="لم يتم العثور على عقارات مطابقة"
              description={
                searchQuery
                  ? 'لا توجد نتائج تطابق بحثك الحالي، جرب كلمات بحث أخرى.'
                  : 'لا يوجد أي عقارات في هذا التصنيف حالياً.'
              }
              actionLabel="إضافة عقار جديد"
              onAction={() => navigate('/seller/properties/new')}
            />
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-[var(--dp-color-ground)] border-b-[2px] border-[var(--dp-color-outline)] text-xs font-black text-[#526078]">
                    <th className="p-4">العقار</th>
                    <th className="p-4">السعر</th>
                    <th className="p-4">المساحة</th>
                    <th className="p-4">تاريخ الإضافة</th>
                    <th className="p-4">الحالة والتوثيق</th>
                    <th className="p-4 text-center">المشاهدات</th>
                    <th className="p-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ece9db] text-sm font-bold text-[var(--dp-color-ink)]">
                  {filteredProperties.map((prop) => (
                    <tr key={prop.id} className="hover:bg-gray-50/60 transition-colors">
                      {/* Image & Title */}
                      <td className="p-4 flex items-center gap-3">
                        <img
                          src={prop.imageUrl}
                          alt={prop.title}
                          className="w-14 h-14 rounded-xl border-[2px] border-[var(--dp-color-outline)] object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="font-black text-sm block line-clamp-1">{prop.title}</span>
                          <span className="text-xs text-[#626d84] block mt-0.5">
                            {prop.type} • {prop.city} ({prop.location})
                          </span>
                          {prop.adminFeedback && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 mt-1">
                              <AlertTriangle className="w-3 h-3" />
                              ملاحظة فحص
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Price */}
                      <td className="p-4 text-[var(--dp-color-accent)] font-black whitespace-nowrap">
                        {formatEGP(prop.price)}
                      </td>

                      {/* Area */}
                      <td className="p-4 text-[#4a5568] whitespace-nowrap">
                        {formatArea(prop.area)}
                      </td>

                      {/* Added Date */}
                      <td className="p-4 text-xs text-[#626d84] whitespace-nowrap">
                        {formatDate(prop.createdAt)}
                      </td>

                      {/* Status */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {getStatusBadge(prop.status)}
                          {prop.isVerified && (
                            <div className="text-[10px] text-emerald-700 font-black flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              مستندات معتمدة
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Views */}
                      <td className="p-4 text-center text-xs font-black text-[#526078]">
                        {prop.viewsCount.toLocaleString('ar-EG')}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Details / Preview link */}
                          <Link to={`/properties/${prop.id}`}>
                            <button
                              type="button"
                              className="p-1.5 rounded-lg border border-[var(--dp-color-outline)] bg-[var(--dp-color-ground)] hover:bg-[var(--dp-color-selection)] cursor-pointer text-[var(--dp-color-accent)]"
                              title="عرض الإعلان"
                            >
                              <ExternalLink className="w-4 h-4 stroke-[2.5]" />
                            </button>
                          </Link>

                          {/* Admin feedback note */}
                          {prop.adminFeedback && (
                            <button
                              type="button"
                              onClick={() => setFeedbackModalProperty(prop)}
                              className="p-1.5 rounded-lg border border-[var(--dp-color-outline)] bg-amber-50 hover:bg-amber-100 cursor-pointer text-amber-800"
                              title="عرض الملاحظات"
                            >
                              <Info className="w-4 h-4 stroke-[2.5]" />
                            </button>
                          )}

                          {/* Resubmit button */}
                          {prop.status === 'requires_changes' && (
                            <button
                              type="button"
                              onClick={() => {
                                setResubmitModalProperty(prop);
                                setResubmitNotes('');
                              }}
                              className="p-1.5 rounded-lg border border-[var(--dp-color-outline)] bg-emerald-50 hover:bg-emerald-100 cursor-pointer text-emerald-700"
                              title="إعادة الإرسال"
                            >
                              <RefreshCw className="w-4 h-4 stroke-[2.5]" />
                            </button>
                          )}

                          {/* Edit eligible */}
                          {(prop.status === 'draft' || prop.status === 'requires_changes') && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditModalProperty(prop);
                                setEditForm({
                                  title: prop.title,
                                  price: prop.price,
                                  description: prop.description,
                                });
                              }}
                              className="p-1.5 rounded-lg border border-[var(--dp-color-outline)] bg-[var(--dp-color-ground)] hover:bg-[var(--dp-color-selection)] cursor-pointer text-[var(--dp-color-ink)]"
                              title="تعديل"
                            >
                              <Edit3 className="w-4 h-4 stroke-[2.5]" />
                            </button>
                          )}

                          {/* Mark Sold */}
                          {prop.status === 'available' && (
                            <button
                              type="button"
                              onClick={() => setSoldConfirmId(prop.id)}
                              className="p-1.5 rounded-lg border border-[var(--dp-color-outline)] bg-emerald-50 hover:bg-emerald-100 cursor-pointer text-emerald-800"
                              title="تحديد كـ مباع"
                            >
                              <Check className="w-4 h-4 stroke-[2.5]" />
                            </button>
                          )}

                          {/* Delete draft */}
                          {prop.status === 'draft' && (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(prop.id)}
                              className="p-1.5 rounded-lg border border-[var(--dp-color-outline)] bg-rose-50 hover:bg-rose-100 cursor-pointer text-rose-700"
                              title="حذف المسودة"
                            >
                              <Trash2 className="w-4 h-4 stroke-[2.5]" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-[#ece9db] p-4 space-y-4">
              {filteredProperties.map((prop) => (
                <div
                  key={prop.id}
                  className="pt-4 first:pt-0 space-y-3 bg-[var(--dp-color-panel)] rounded-xl border-[2px] border-[var(--dp-color-outline)] p-4 shadow-xs"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={prop.imageUrl}
                      alt={prop.title}
                      className="w-20 h-20 rounded-xl border-[2px] border-[var(--dp-color-outline)] object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        {getStatusBadge(prop.status)}
                        <span className="text-[11px] text-[#626d84] font-bold">
                          {formatDate(prop.createdAt)}
                        </span>
                      </div>
                      <h4 className="font-black text-sm text-[var(--dp-color-ink)] line-clamp-1">
                        {prop.title}
                      </h4>
                      <span className="text-xs text-[#626d84] block mt-0.5">
                        {prop.city} • {prop.location}
                      </span>
                      <span className="text-xs font-black text-[var(--dp-color-accent)] mt-1 block">
                        {formatEGP(prop.price)}
                      </span>
                    </div>
                  </div>

                  {prop.adminFeedback && (
                    <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-black block">ملاحظة المشرف:</span>
                        <span className="line-clamp-2">{prop.adminFeedback}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-[#ece9db] text-xs font-bold text-[#626d84]">
                    <span>{prop.viewsCount.toLocaleString('ar-EG')} مشاهدة</span>
                    <div className="flex items-center gap-1.5">
                      <Link to={`/properties/${prop.id}`}>
                        <Button variant="outline" size="sm">
                          معاينة
                        </Button>
                      </Link>

                      {prop.status === 'requires_changes' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setResubmitModalProperty(prop);
                            setResubmitNotes('');
                          }}
                        >
                          إعادة إرسال
                        </Button>
                      )}

                      {prop.status === 'available' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setSoldConfirmId(prop.id)}
                        >
                          تم البيع
                        </Button>
                      )}

                      {prop.status === 'draft' && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setDeleteConfirmId(prop.id)}
                        >
                          حذف
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Admin Feedback Modal */}
      <Modal
        isOpen={Boolean(feedbackModalProperty)}
        onClose={() => setFeedbackModalProperty(null)}
        title="ملاحظات المشرف القانوني"
        description={`عقار: ${feedbackModalProperty?.title}`}
        size="md"
        footer={
          <div className="flex justify-between w-full">
            <Button variant="outline" size="sm" onClick={() => setFeedbackModalProperty(null)}>
              إغلاق
            </Button>
            {feedbackModalProperty?.status === 'requires_changes' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const target = feedbackModalProperty;
                  setFeedbackModalProperty(null);
                  setResubmitModalProperty(target);
                  setResubmitNotes('');
                }}
              >
                تعديل وإعادة الإرسال
              </Button>
            )}
          </div>
        }
      >
        <div className="space-y-4 text-right">
          <div className="p-4 rounded-xl bg-rose-50 border-[2px] border-rose-300 text-rose-900 space-y-2">
            <div className="flex items-center gap-2 font-black text-sm">
              <AlertTriangle className="w-4 h-4 text-rose-700" />
              <span>مطلوب استيفاء التعديلات التالية لتأكيد التوثيق:</span>
            </div>
            <p className="text-sm leading-relaxed text-[#374151]">
              {feedbackModalProperty?.adminFeedback || 'لا توجد ملاحظات مسجلة.'}
            </p>
          </div>
        </div>
      </Modal>

      {/* Resubmit Property Modal */}
      <Modal
        isOpen={Boolean(resubmitModalProperty)}
        onClose={() => setResubmitModalProperty(null)}
        title="إعادة إرسال العقار للمراجعة القانونية"
        description={`عقار: ${resubmitModalProperty?.title}`}
        size="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setResubmitModalProperty(null)}
              disabled={actionLoading}
            >
              إلغاء
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleResubmit}
              isLoading={actionLoading}
            >
              تأكيد وإعادة الإرسال
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-right">
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-bold">
            سيتم تحويل حالة العقار إلى "قيد المراجعة" وسيقوم المشرف بفحص المستندات والبيانات المعدلة.
          </div>
          <div>
            <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1">
              ملاحظاتك للمشرف أو توضيح ما تم تعديله:
            </label>
            <Textarea
              rows={4}
              placeholder="مثال: تم إرفاق صورة واضحة من المخالصة المالية وتحديث التوكيل الرسمي..."
              value={resubmitNotes}
              onChange={(e) => setResubmitNotes(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* Quick Edit Property Modal */}
      <Modal
        isOpen={Boolean(editModalProperty)}
        onClose={() => setEditModalProperty(null)}
        title="تعديل بيانات العقار"
        size="lg"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditModalProperty(null)}
              disabled={actionLoading}
            >
              إلغاء
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveEdit}
              isLoading={actionLoading}
            >
              حفظ التعديلات
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-right">
          <div>
            <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1">
              عنوان الإعلان
            </label>
            <Input
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1">
              السعر المطلوب (ج.م)
            </label>
            <Input
              type="number"
              value={editForm.price}
              onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
            />
          </div>

          <div>
            <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1">
              الوصف التفصيلي
            </label>
            <Textarea
              rows={4}
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      {/* Confirm Dialog: Mark as Sold */}
      <ConfirmDialog
        isOpen={Boolean(soldConfirmId)}
        onClose={() => setSoldConfirmId(null)}
        onConfirm={handleMarkAsSold}
        title="تأكيد بيع العقار"
        description="هل أنت متأكد من تعيين هذا العقار كـ 'تم البيع'؟ سيتم أرشفة الإعلان ولن يظهر للمشترين في نتائج البحث."
        confirmLabel="نعم، تم البيع"
        cancelLabel="تراجع"
        variant="primary"
        isLoading={actionLoading}
      />

      {/* Confirm Dialog: Delete Draft */}
      <ConfirmDialog
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDeleteDraft}
        title="تأكيد حذف المسودة"
        description="هل أنت متأكد من رغبتك في حذف مسودة هذا العقار نهائياً؟ لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="حذف المسودة"
        cancelLabel="إلغاء"
        variant="danger"
        isLoading={actionLoading}
      />
    </DashboardLayout>
  );
};
