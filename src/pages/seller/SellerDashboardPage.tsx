import React, { useState, useEffect, useCallback } from 'react';
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
import { formatEGP, formatDate } from '@/lib/utils';
import {
  getSellerProperties,
  getSellerStatistics,
  markPropertyAsSold,
  deletePropertyDraft,
  resubmitProperty,
  updatePropertyDetails,
  SellerProperty,
  SellerStatistics,
  SellerPropertyStatus,
} from '@/services/sellerService';
import {
  useSellerStats,
  useSellerProperties as useSellerPropertiesSb,
  useSellerInquiries,
} from '@/hooks/useSupabaseData';
import {
  Building2,
  CalendarCheck,
  MessageSquare,
  PlusCircle,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowLeft,
  XCircle,
  Send,
  Edit3,
  Trash2,
  Check,
  RefreshCw,
  ExternalLink,
  Info,
  Heart,
  BarChart3,
} from 'lucide-react';

export const SellerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<SellerProperty[]>([]);
  const [stats, setStats] = useState<SellerStatistics | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Supabase hooks for real-time stats and inquiries
  const sbStats = useSellerStats(user?.id);
  const sbInquiries = useSellerInquiries(user?.id);

  // Modals state
  const [feedbackModalProperty, setFeedbackModalProperty] = useState<SellerProperty | null>(null);
  const [resubmitModalProperty, setResubmitModalProperty] = useState<SellerProperty | null>(null);
  const [resubmitNotes, setResubmitNotes] = useState('');
  const [editModalProperty, setEditModalProperty] = useState<SellerProperty | null>(null);
  const [editForm, setEditForm] = useState({ title: '', price: 0, description: '' });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [soldConfirmId, setSoldConfirmId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Inquiries reply modal state
  const [replyInquiryModal, setReplyInquiryModal] = useState<{ id: string; sender: string; msg: string; prop: string } | null>(null);
  const [replyText, setReplyText] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [propsData, statsData] = await Promise.all([
        getSellerProperties(user?.id),
        getSellerStatistics(user?.id),
      ]);
      setProperties(propsData);
      // Merge with Supabase stats if available
      if (sbStats.stats) {
        setStats(sbStats.stats as SellerStatistics);
      } else {
        setStats(statsData);
      }
    } catch (err) {
      console.error('Failed to load seller dashboard data:', err);
      setError('تعذر تحميل بيانات لوحة التحكم، يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, sbStats.stats]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      setToastMessage('تم تحديث حالة العقار بنجاح إلى: تم البيع');
      await loadData();
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
      await loadData();
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
      setToastMessage('تم إعادة إرسال العقار لمراجعة المستندات من قبل الإدارة');
      await loadData();
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
      setToastMessage('تم تحديث بيانات العقار بنجاح');
      await loadData();
    } catch {
      setToastMessage('حدث خطأ أثناء حفظ التعديلات');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendReply = () => {
    if (!replyInquiryModal) return;
    setToastMessage(`تم إرسال ردك إلى ${replyInquiryModal.sender} بنجاح`);
    setReplyInquiryModal(null);
    setReplyText('');
  };

  const sellerName = user?.fullName || 'محمد السيد';

  return (
    <DashboardLayout
      role="seller"
      title="لوحة تحكم البائع"
      subtitle="إدارة عقاراتك، متابعة طلبات المعاينة، واستفسارات المشترين المهتمين."
      actions={
        <Link to="/seller/properties/new">
          <Button
            variant="primary"
            size="sm"
            rightIcon={<PlusCircle className="w-4.5 h-4.5 stroke-[2.5]" />}
          >
            أضف عقاراً جديداً
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

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 rounded-xl border-[2.5px] border-rose-500 bg-rose-50 text-right flex items-center justify-between">
          <div className="flex items-center gap-3 text-rose-800">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span className="font-bold text-sm">{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={loadData} rightIcon={<RefreshCw className="w-4 h-4" />}>
            إعادة المحاولة
          </Button>
        </div>
      )}

      {/* 2. Welcome Section */}
      <section className="relative overflow-hidden bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-6 sm:p-8 shadow-hard mb-8 text-right">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--dp-color-selection)] border border-[var(--dp-color-outline)] text-xs font-black text-[var(--dp-color-accent)] mb-1">
              <span className="w-2 h-2 rounded-full bg-[var(--dp-color-accent)] animate-pulse" />
              حساب بائع معتمد
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[var(--dp-color-ink)]">
              أهلاً بيك، {sellerName}
            </h2>
            <p className="text-sm sm:text-base text-[#526078] font-bold max-w-xl">
              تابع عقاراتك واعرف آخر التحديثات من مكان واحد.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link to="/seller/properties/new">
              <Button
                variant="primary"
                size="md"
                rightIcon={<PlusCircle className="w-5 h-5 stroke-[2.5]" />}
                className="w-full sm:w-auto text-base"
              >
                أضف عقاراً جديداً
              </Button>
            </Link>
            <Link to="/seller/properties">
              <Button variant="outline" size="md" className="w-full sm:w-auto">
                إدارة عقاراتي
              </Button>
            </Link>
          </div>
        </div>

        {/* Decorative Geometric Shapes */}
        <div className="absolute left-[-20px] top-[-20px] w-32 h-32 rounded-full bg-[var(--dp-color-accent-fresh)]/20 pointer-events-none -z-0" />
        <div className="absolute left-16 bottom-[-30px] w-24 h-24 rotate-12 bg-[var(--dp-color-accent-warm)]/20 pointer-events-none -z-0" />
      </section>

      {/* 3. Statistics Cards (6 outlined cards with distinct geometric accents) */}
      <section className="mb-8 text-right">
        <h3 className="text-lg font-black text-[var(--dp-color-ink)] mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[var(--dp-color-accent)]" />
          إحصائيات وأداء العقارات
        </h3>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="p-4 rounded-[var(--dp-radius-corner)] border-[2.5px] border-[var(--dp-color-outline)] bg-[var(--dp-color-panel)] space-y-3"
              >
                <Skeleton className="w-10 h-10 rounded-xl" />
                <Skeleton className="w-16 h-8" />
                <Skeleton className="w-20 h-4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* 1. إجمالي العقارات */}
            <div className="p-4 sm:p-5 rounded-[var(--dp-radius-corner)] border-[2.5px] border-[var(--dp-color-outline)] bg-[var(--dp-color-panel)] shadow-hard-sm relative overflow-hidden transition-transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-3">
                <span className="p-2.5 rounded-xl bg-[var(--dp-color-field-soft)] border-[2px] border-[var(--dp-color-outline)] text-[var(--dp-color-accent)]">
                  <Building2 className="w-5 h-5 stroke-[2.5]" />
                </span>
                <span className="text-[11px] font-bold text-[#626d84]">الكل</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[var(--dp-color-ink)]">
                {stats?.totalProperties || 0}
              </div>
              <span className="text-xs font-black text-[#526078] mt-1 block">إجمالي العقارات</span>
              <div className="absolute -bottom-3 -right-3 w-10 h-10 rounded-full bg-[var(--dp-color-selection)]/40 pointer-events-none" />
            </div>

            {/* 2. العقارات المنشورة */}
            <div className="p-4 sm:p-5 rounded-[var(--dp-radius-corner)] border-[2.5px] border-[var(--dp-color-outline)] bg-[#f3fcf7] shadow-hard-sm relative overflow-hidden transition-transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-3">
                <span className="p-2.5 rounded-xl bg-[var(--dp-color-accent-fresh)] border-[2px] border-[var(--dp-color-outline)] text-emerald-900">
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                </span>
                <span className="text-[11px] font-bold text-emerald-800">متاحة</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-900">
                {stats?.publishedCount || 0}
              </div>
              <span className="text-xs font-black text-emerald-800 mt-1 block">العقارات المنشورة</span>
              <div className="absolute -bottom-3 -right-3 w-10 h-10 rounded-full bg-[var(--dp-color-accent-fresh)]/40 pointer-events-none" />
            </div>

            {/* 3. قيد المراجعة */}
            <div className="p-4 sm:p-5 rounded-[var(--dp-radius-corner)] border-[2.5px] border-[var(--dp-color-outline)] bg-[#fffbf0] shadow-hard-sm relative overflow-hidden transition-transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-3">
                <span className="p-2.5 rounded-xl bg-[var(--dp-color-accent-warm)] border-[2px] border-[var(--dp-color-outline)] text-amber-900">
                  <Clock className="w-5 h-5 stroke-[2.5]" />
                </span>
                <span className="text-[11px] font-bold text-amber-800">قانونياً</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-900">
                {stats?.pendingReviewCount || 0}
              </div>
              <span className="text-xs font-black text-amber-800 mt-1 block">قيد المراجعة</span>
              <div className="absolute -bottom-3 -right-3 w-10 h-10 rounded-full bg-[var(--dp-color-accent-warm)]/40 pointer-events-none" />
            </div>

            {/* 4. تحتاج إلى تعديلات */}
            <div className="p-4 sm:p-5 rounded-[var(--dp-radius-corner)] border-[2.5px] border-[var(--dp-color-outline)] bg-[#fff5f5] shadow-hard-sm relative overflow-hidden transition-transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-3">
                <span className="p-2.5 rounded-xl bg-[var(--dp-color-accent-secondary)] border-[2px] border-[var(--dp-color-outline)] text-rose-900">
                  <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
                </span>
                <span className="text-[11px] font-bold text-rose-800">ملاحظات</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-rose-900">
                {stats?.requiresChangesCount || 0}
              </div>
              <span className="text-xs font-black text-rose-800 mt-1 block">تحتاج إلى تعديلات</span>
              <div className="absolute -bottom-3 -right-3 w-10 h-10 rounded-full bg-[var(--dp-color-accent-secondary)]/40 pointer-events-none" />
            </div>

            {/* 5. إجمالي المشاهدات */}
            <div className="p-4 sm:p-5 rounded-[var(--dp-radius-corner)] border-[2.5px] border-[var(--dp-color-outline)] bg-[var(--dp-color-panel)] shadow-hard-sm relative overflow-hidden transition-transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-3">
                <span className="p-2.5 rounded-xl bg-[var(--dp-color-selection)] border-[2px] border-[var(--dp-color-outline)] text-[var(--dp-color-accent)]">
                  <Eye className="w-5 h-5 stroke-[2.5]" />
                </span>
                <span className="text-[11px] font-bold text-[#626d84]">تفاعل</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[var(--dp-color-ink)]">
                {stats?.totalViews.toLocaleString('ar-EG') || 0}
              </div>
              <span className="text-xs font-black text-[#526078] mt-1 block">إجمالي المشاهدات</span>
              <div className="absolute -bottom-3 -right-3 w-10 h-10 rounded-full bg-[var(--dp-color-selection)]/40 pointer-events-none" />
            </div>

            {/* 6. طلبات المعاينة */}
            <div className="p-4 sm:p-5 rounded-[var(--dp-radius-corner)] border-[2.5px] border-[var(--dp-color-outline)] bg-[var(--dp-color-panel)] shadow-hard-sm relative overflow-hidden transition-transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-3">
                <span className="p-2.5 rounded-xl bg-purple-100 border-[2px] border-[var(--dp-color-outline)] text-purple-700">
                  <CalendarCheck className="w-5 h-5 stroke-[2.5]" />
                </span>
                <span className="text-[11px] font-bold text-purple-700">ميدانية</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[var(--dp-color-ink)]">
                {stats?.appointmentsCount || 0}
              </div>
              <span className="text-xs font-black text-[#526078] mt-1 block">طلبات المعاينة</span>
              <div className="absolute -bottom-3 -right-3 w-10 h-10 rounded-full bg-purple-100/50 pointer-events-none" />
            </div>
          </div>
        )}
      </section>

      {/* 3.5. Smart Seller Analytics: Views, Favorites, Inquiries, and Appointment Requests */}
      <section className="mb-8 text-right">
        <div className="bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-5 sm:p-6 shadow-hard space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-[#ece9db]">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[var(--dp-color-accent-warm)] border-2 border-[var(--dp-color-outline)] flex items-center justify-center text-[var(--dp-color-ink)] shadow-hard-sm">
                <BarChart3 className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base font-black text-[var(--dp-color-ink)]">
                  تحليلات تفاعل المشترين مع عقاراتك
                </h3>
                <span className="text-xs text-[#626d84] font-medium block">
                  مؤشرات حية لتفاعل المهتمين بالشراء الفعلي والمشاهدات
                </span>
              </div>
            </div>

            <Badge variant="primary" size="md">
              تحليلات حية
            </Badge>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Views */}
            <div className="p-4 rounded-xl border-2 border-[var(--dp-color-outline)] bg-white shadow-hard-sm">
              <div className="flex items-center justify-between text-[#626d84] mb-2">
                <span className="text-xs font-bold">المشاهدات الكلية</span>
                <Eye className="w-4 h-4 text-[var(--dp-color-accent)]" />
              </div>
              <div className="text-2xl font-black text-[var(--dp-color-ink)]">
                {(stats?.totalViews || 0).toLocaleString('ar-EG')}
              </div>
              <span className="text-[11px] text-[#626d84] block mt-1">زيارات لصفحات العقار</span>
            </div>

            {/* 2. Favorites */}
            <div className="p-4 rounded-xl border-2 border-[var(--dp-color-outline)] bg-white shadow-hard-sm">
              <div className="flex items-center justify-between text-[#626d84] mb-2">
                <span className="text-xs font-bold">المحفوظات بالمفضلة</span>
                <Heart className="w-4 h-4 text-rose-500 fill-rose-100" />
              </div>
              <div className="text-2xl font-black text-rose-600">
                {(stats?.favoritesCount || 0).toLocaleString('ar-EG')}
              </div>
              <span className="text-[11px] text-[#626d84] block mt-1">مشترين أضافوا عقارك</span>
            </div>

            {/* 3. Inquiries */}
            <div className="p-4 rounded-xl border-2 border-[var(--dp-color-outline)] bg-white shadow-hard-sm">
              <div className="flex items-center justify-between text-[#626d84] mb-2">
                <span className="text-xs font-bold">الاستفسارات والمحادثات</span>
                <MessageSquare className="w-4 h-4 text-[var(--dp-color-accent)]" />
              </div>
              <div className="text-2xl font-black text-[var(--dp-color-ink)]">
                {(stats?.inquiriesCount || 0).toLocaleString('ar-EG')}
              </div>
              <span className="text-[11px] text-[#626d84] block mt-1">رسائل مباشرة من مشترين</span>
            </div>

            {/* 4. Appointments */}
            <div className="p-4 rounded-xl border-2 border-[var(--dp-color-outline)] bg-white shadow-hard-sm">
              <div className="flex items-center justify-between text-[#626d84] mb-2">
                <span className="text-xs font-bold">طلبات المعاينة الميدانية</span>
                <CalendarCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-700">
                {(stats?.appointmentsCount || 0).toLocaleString('ar-EG')}
              </div>
              <span className="text-[11px] text-[#626d84] block mt-1">مواعيد مسجلة للمعاينة</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Property Management Table / Card List */}
      <section className="mb-10 text-right">
        <div className="bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] shadow-hard overflow-hidden">
          {/* Table Header / Title Bar */}
          <div className="p-5 border-b-[2.5px] border-[var(--dp-color-outline)] bg-[var(--dp-color-ground)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-[var(--dp-color-ink)]">
                إدارة العقارات المعروضة
              </h3>
              <p className="text-xs font-bold text-[#626d84] mt-0.5">
                متابعة الحالات القانونية، عدد المشاهدات، والإجراءات المتاحة لكل عقار.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/seller/properties">
                <Button variant="outline" size="sm" rightIcon={<ArrowLeft className="w-4 h-4" />}>
                  عرض الكل بالتفصيل ({properties.length})
                </Button>
              </Link>
            </div>
          </div>

          {/* Properties Content */}
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
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
          ) : properties.length === 0 ? (
            /* Empty State */
            <div className="p-10">
              <EmptyState
                icon={<Building2 className="w-8 h-8 text-[var(--dp-color-accent)]" />}
                title="ليس لديك عقارات معروضة بعد"
                description="ابدأ بإضافة عقارك الأول الآن لنقوم بمراجعة مستنداته وتوثيقه وعرضه أمام آلاف المشترين المهتمين."
                actionLabel="أضف عقارك الأول الآن"
                onAction={() => navigate('/seller/properties/new')}
              />
            </div>
          ) : (
            <>
              {/* Desktop Table (md+) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-[var(--dp-color-ground)]/50 border-b-[2px] border-[var(--dp-color-outline)] text-xs font-black text-[#526078]">
                      <th className="p-4">صورة العقار</th>
                      <th className="p-4">العنوان والموقع</th>
                      <th className="p-4">السعر</th>
                      <th className="p-4">تاريخ الإضافة</th>
                      <th className="p-4">الحالة</th>
                      <th className="p-4 text-center">المشاهدات</th>
                      <th className="p-4 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ece9db] text-sm font-bold text-[var(--dp-color-ink)]">
                    {properties.map((prop) => (
                      <tr key={prop.id} className="hover:bg-[var(--dp-color-ground)]/40 transition-colors">
                        {/* Cover Image */}
                        <td className="p-4">
                          <img
                            src={prop.imageUrl}
                            alt={prop.title}
                            className="w-16 h-16 rounded-xl border-[2px] border-[var(--dp-color-outline)] object-cover shadow-xs"
                          />
                        </td>

                        {/* Title & Location */}
                        <td className="p-4 max-w-xs">
                          <span className="font-black text-sm block line-clamp-1">{prop.title}</span>
                          <span className="text-xs text-[#626d84] block mt-0.5">{prop.city} • {prop.location}</span>
                          {prop.adminFeedback && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 mt-1">
                              <AlertTriangle className="w-3 h-3" />
                              يوجد ملاحظات إدارية
                            </span>
                          )}
                        </td>

                        {/* Price */}
                        <td className="p-4 text-[var(--dp-color-accent)] font-black text-sm whitespace-nowrap">
                          {formatEGP(prop.price)}
                        </td>

                        {/* Created At */}
                        <td className="p-4 text-xs text-[#626d84] whitespace-nowrap">
                          {formatDate(prop.createdAt)}
                        </td>

                        {/* Status */}
                        <td className="p-4 whitespace-nowrap">
                          {getStatusBadge(prop.status)}
                        </td>

                        {/* Views */}
                        <td className="p-4 text-center font-black text-xs text-[#526078]">
                          {prop.viewsCount.toLocaleString('ar-EG')}
                        </td>

                        {/* Actions (Sellers can view, edit eligible, delete drafts, resubmit, mark sold, view admin notes - but NEVER self-approve) */}
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* View Details */}
                            <Link to={`/properties/${prop.id}`}>
                              <button
                                type="button"
                                className="p-2 rounded-lg border border-[var(--dp-color-outline)] bg-[var(--dp-color-ground)] hover:bg-[var(--dp-color-selection)] cursor-pointer text-[var(--dp-color-accent)] transition-colors"
                                title="معاينة الإعلان"
                              >
                                <ExternalLink className="w-4 h-4 stroke-[2.5]" />
                              </button>
                            </Link>

                            {/* View Admin Feedback (if requires_changes or rejected) */}
                            {prop.adminFeedback && (
                              <button
                                type="button"
                                onClick={() => setFeedbackModalProperty(prop)}
                                className="p-2 rounded-lg border border-[var(--dp-color-outline)] bg-amber-50 hover:bg-amber-100 cursor-pointer text-amber-800 transition-colors"
                                title="عرض ملاحظات المشرف"
                              >
                                <Info className="w-4 h-4 stroke-[2.5]" />
                              </button>
                            )}

                            {/* Resubmit corrected property (when requires_changes) */}
                            {prop.status === 'requires_changes' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setResubmitModalProperty(prop);
                                  setResubmitNotes('');
                                }}
                                className="p-2 rounded-lg border border-[var(--dp-color-outline)] bg-emerald-50 hover:bg-emerald-100 cursor-pointer text-emerald-700 transition-colors"
                                title="إعادة الإرسال للمراجعة"
                              >
                                <RefreshCw className="w-4 h-4 stroke-[2.5]" />
                              </button>
                            )}

                            {/* Edit eligible property (drafts, requires_changes) */}
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
                                className="p-2 rounded-lg border border-[var(--dp-color-outline)] bg-[var(--dp-color-ground)] hover:bg-[var(--dp-color-selection)] cursor-pointer text-[var(--dp-color-ink)] transition-colors"
                                title="تعديل البيانات"
                              >
                                <Edit3 className="w-4 h-4 stroke-[2.5]" />
                              </button>
                            )}

                            {/* Mark as Sold (only when available) */}
                            {prop.status === 'available' && (
                              <button
                                type="button"
                                onClick={() => setSoldConfirmId(prop.id)}
                                className="p-2 rounded-lg border border-[var(--dp-color-outline)] bg-emerald-50 hover:bg-emerald-100 cursor-pointer text-emerald-800 transition-colors"
                                title="تحديد كـ مباع"
                              >
                                <Check className="w-4 h-4 stroke-[2.5]" />
                              </button>
                            )}

                            {/* Delete draft (only drafts can be deleted by seller) */}
                            {prop.status === 'draft' && (
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(prop.id)}
                                className="p-2 rounded-lg border border-[var(--dp-color-outline)] bg-rose-50 hover:bg-rose-100 cursor-pointer text-rose-700 transition-colors"
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

              {/* Mobile Card List (< md) */}
              <div className="md:hidden divide-y divide-[#ece9db] p-4 space-y-4">
                {properties.map((prop) => (
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
      </section>

      {/* 6. Activity Section (3 columns: Latest Inquiries, Recent Appointments, Latest Updates) */}
      <section className="mb-8 text-right">
        <h3 className="text-lg font-black text-[var(--dp-color-ink)] mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-[var(--dp-color-accent)]" />
          النشاط الأخير والتفاعلات
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1: Latest Inquiries */}
          <div className="bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-5 shadow-hard flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b-2 border-[#ece9db]">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[var(--dp-color-field-soft)] border border-[var(--dp-color-outline)] text-[var(--dp-color-accent)]">
                    <MessageSquare className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <h4 className="font-black text-sm text-[var(--dp-color-ink)]">
                    آخر استفسارات المشترين
                  </h4>
                </div>
                <Link to="/seller/inquiries" className="text-xs font-bold text-[var(--dp-color-accent)] hover:underline">
                  الكل
                </Link>
              </div>

              <div className="space-y-3">
                {[
                  {
                    id: 'inq-1',
                    sender: 'محمود فهمي',
                    time: 'منذ ساعتين',
                    prop: 'شقة ميفيدا - التجمع',
                    msg: 'مساء الخير، هل يوجد إمكانية لتسهيلات في السداد على سنة أم السعر كاش فقط؟',
                  },
                  {
                    id: 'inq-2',
                    sender: 'إنجي حسن',
                    time: 'أمس',
                    prop: 'دوبلكس النرجس',
                    msg: 'هل السعر شامل وديعة الصيانة وحصة الجراج في العقار؟',
                  },
                ].map((inq) => (
                  <div
                    key={inq.id}
                    className="p-3.5 rounded-xl border border-[var(--dp-color-outline)] bg-[var(--dp-color-ground)] space-y-2 text-right"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-black text-[var(--dp-color-ink)]">{inq.sender}</span>
                      <span className="text-[#626d84]">{inq.time}</span>
                    </div>
                    <p className="text-xs text-[#374151] line-clamp-2 leading-relaxed">
                      "{inq.msg}"
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] font-bold text-[var(--dp-color-accent)]">
                        {inq.prop}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setReplyInquiryModal({
                            id: inq.id,
                            sender: inq.sender,
                            msg: inq.msg,
                            prop: inq.prop,
                          })
                        }
                        className="py-1 px-2.5 text-xs h-auto"
                      >
                        رد سريع
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-[#ece9db]">
              <Link to="/seller/inquiries">
                <Button variant="ghost" size="sm" className="w-full text-xs font-black text-[var(--dp-color-accent)]">
                  عرض كل المحادثات
                </Button>
              </Link>
            </div>
          </div>

          {/* Column 2: Recent Appointments */}
          <div className="bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-5 shadow-hard flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b-2 border-[#ece9db]">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-100 border border-[var(--dp-color-outline)] text-purple-700">
                    <CalendarCheck className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <h4 className="font-black text-sm text-[var(--dp-color-ink)]">
                    أحدث طلبات المعاينة
                  </h4>
                </div>
                <Link to="/seller/appointments" className="text-xs font-bold text-[var(--dp-color-accent)] hover:underline">
                  الجدول
                </Link>
              </div>

              <div className="space-y-3">
                {[
                  {
                    id: 'app-1',
                    buyer: 'كريم عبد الله',
                    phone: '01098765432',
                    prop: 'شقة ميفيدا، التجمع الخامس',
                    date: 'الخميس، ٥ نوفمبر',
                    time: '٠٢:٠٠ م - ٠٣:٠٠ م',
                    status: 'confirmed',
                    statusText: 'مؤكد',
                  },
                  {
                    id: 'app-2',
                    buyer: 'سارة المنشاوي',
                    phone: '01123456789',
                    prop: 'دوبلكس النرجس',
                    date: 'السبت، ٧ نوفمبر',
                    time: '٠٤:٣٠ م - ٠٥:٣٠ م',
                    status: 'pending',
                    statusText: 'بانتظار موافقتك',
                  },
                ].map((app) => (
                  <div
                    key={app.id}
                    className="p-3.5 rounded-xl border border-[var(--dp-color-outline)] bg-[var(--dp-color-ground)] space-y-2 text-right"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-[var(--dp-color-ink)]">{app.buyer}</span>
                      <Badge variant={app.status === 'confirmed' ? 'fresh' : 'warm'} size="sm">
                        {app.statusText}
                      </Badge>
                    </div>
                    <div className="text-xs text-[#526078] font-bold">
                      {app.date} • {app.time}
                    </div>
                    <div className="text-[11px] font-bold text-[var(--dp-color-accent)] line-clamp-1">
                      {app.prop}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-[#ece9db]">
              <Link to="/seller/appointments">
                <Button variant="ghost" size="sm" className="w-full text-xs font-black text-[var(--dp-color-accent)]">
                  فتح جدول المعاينات
                </Button>
              </Link>
            </div>
          </div>

          {/* Column 3: Latest Property Updates */}
          <div className="bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-5 shadow-hard flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b-2 border-[#ece9db]">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[var(--dp-color-accent-fresh)] border border-[var(--dp-color-outline)] text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <h4 className="font-black text-sm text-[var(--dp-color-ink)]">
                    آخر تحديثات حالة العقارات
                  </h4>
                </div>
                <Link to="/seller/notifications" className="text-xs font-bold text-[var(--dp-color-accent)] hover:underline">
                  الإشعارات
                </Link>
              </div>

              <div className="space-y-3">
                {[
                  {
                    title: 'اعتماد شارة "موثق" لشقة ميفيدا',
                    desc: 'اكتملت مراجعة مستندات الملكية ورخصة البناء بنجاح.',
                    time: 'اليوم، ١٠:٣٠ ص',
                    icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
                  },
                  {
                    title: 'ملاحظة قانونية على شاليه الساحل',
                    desc: 'مطلوب استيفاء صورة المخالصة المالية الصادرة من القرية.',
                    time: 'أمس، ٠٤:١٥ م',
                    icon: <AlertTriangle className="w-4 h-4 text-rose-600" />,
                  },
                  {
                    title: 'استلام دوبلكس النرجس للمراجعة',
                    desc: 'الملف قيد تدقيق الإدارة القانونية حالياً.',
                    time: 'منذ يومين',
                    icon: <Clock className="w-4 h-4 text-amber-600" />,
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl border border-[var(--dp-color-outline)] bg-[var(--dp-color-ground)] flex items-start gap-2.5 text-right"
                  >
                    <span className="p-1 rounded-lg bg-white border border-[var(--dp-color-outline)] mt-0.5 shrink-0">
                      {item.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="font-black text-xs text-[var(--dp-color-ink)] block">
                        {item.title}
                      </span>
                      <span className="text-[11px] text-[#626d84] block mt-0.5 line-clamp-2">
                        {item.desc}
                      </span>
                      <span className="text-[10px] text-[#9ca3af] block mt-1">
                        {item.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-[#ece9db]">
              <Link to="/seller/notifications">
                <Button variant="ghost" size="sm" className="w-full text-xs font-black text-[var(--dp-color-accent)]">
                  عرض كل الإشعارات الإدارية
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* MODALS */}

      {/* 1. Admin Feedback Modal */}
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
          <p className="text-xs text-[#626d84]">
            * بعد استيفاء البيانات أو تعديل المستندات المطلوبة، اضغط على زر "تعديل وإعادة الإرسال" لإعادة فحص الملف من قبل الإدارة القانونية.
          </p>
        </div>
      </Modal>

      {/* 2. Resubmit Property Modal */}
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

      {/* 3. Quick Edit Property Modal */}
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

      {/* 4. Confirm Dialog: Mark as Sold */}
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

      {/* 5. Confirm Dialog: Delete Draft */}
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

      {/* 6. Modal: Reply to Inquiry */}
      <Modal
        isOpen={Boolean(replyInquiryModal)}
        onClose={() => setReplyInquiryModal(null)}
        title={`الرد على استفسار: ${replyInquiryModal?.sender}`}
        description={`بخصوص: ${replyInquiryModal?.prop}`}
        size="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setReplyInquiryModal(null)}>
              إلغاء
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSendReply}
              rightIcon={<Send className="w-3.5 h-3.5" />}
              disabled={!replyText.trim()}
            >
              إرسال الرد
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-right">
          <div className="p-3 rounded-xl bg-gray-50 border border-[var(--dp-color-outline)] text-xs text-[#374151]">
            <span className="font-bold block mb-1">رسالة المشتري:</span>
            "{replyInquiryModal?.msg}"
          </div>

          <div>
            <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1">
              رسالتك:
            </label>
            <Textarea
              rows={4}
              placeholder="اكتب ردك الوافي على استفسار المشتري هنا..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};
