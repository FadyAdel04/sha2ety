import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/context/AuthContext';
import { usePlatformStats, useReviewQueue, useAuditLogs } from '@/hooks/useSupabaseData';
import { sbFetchPropertyImages } from '@/services/supabaseService';
import { formatEGP } from '@/lib/utils';
import {
  Users,
  Building2,
  FileCheck,
  CheckCircle2,
  XCircle,
  CalendarCheck,
  AlertTriangle,
  ArrowLeft,
  ShieldCheck,
  ClipboardList,
  MessageSquare,
  Sparkles,
  Layers,
  RefreshCw,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { stats, loading: statsLoading, reload: reloadStats } = usePlatformStats();
  const { queue: pendingQueue, loading: queueLoading, reload: reloadQueue } = useReviewQueue();
  const { logs: auditLogs, loading: logsLoading, reload: reloadLogs } = useAuditLogs();
  const [propertyImages, setPropertyImages] = useState<Record<string, string>>({});

  // Fetch cover images for queue items
  useEffect(() => {
    if (!pendingQueue.length) return;
    pendingQueue.slice(0, 3).forEach(async (prop) => {
      if (!prop.cover_image_url) {
        const imgs = await sbFetchPropertyImages(prop.id).catch(() => []);
        if (imgs[0]) {
          setPropertyImages((prev) => ({ ...prev, [prop.id]: imgs[0] }));
        }
      }
    });
  }, [pendingQueue]);

  const refreshAll = useCallback(() => {
    reloadStats();
    reloadQueue();
    reloadLogs();
  }, [reloadStats, reloadQueue, reloadLogs]);

  const getImageUrl = (prop: any) =>
    propertyImages[prop.id] ||
    prop.cover_image_url ||
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';

  const formatAuditTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso;
    }
  };

  const getActionLabel = (action: string) => {
    const map: Record<string, string> = {
      approve_property: 'اعتماد عقار ونشره في السوق',
      reject_property: 'رفض عقار',
      request_changes: 'طلب تعديلات على عقار',
      suspend_user: 'تعليق حساب مستخدم',
      reactivate_user: 'إعادة تفعيل حساب مستخدم',
      delete_property: 'حذف عقار',
    };
    return map[action] || action;
  };

  const isLoading = statsLoading || queueLoading || logsLoading;

  return (
    <DashboardLayout
      role="admin"
      title="لوحة الإدارة والرقابة المركزية"
      subtitle="نظرة شاملة على مؤشرات السوق العقاري، طابور المراجعة القانونية، وسجل عمليات المنصة."
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={refreshAll}
          leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
        >
          تحديث البيانات
        </Button>
      }
    >
      <div className="space-y-8 text-right">

        {/* Urgent Attention Alert if pending reviews exist */}
        {!queueLoading && pendingQueue.length > 0 && (
          <div className="relative">
            <div
              className="absolute inset-0 bg-[var(--dp-color-accent)] rounded-[calc(var(--dp-radius-corner)+4px)] translate-x-2 translate-y-2 border-[2.5px] border-[var(--dp-color-outline)]"
              aria-hidden="true"
            />
            <div className="relative p-5 bg-[#fff8e7] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] shadow-hard flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-400 border-[2px] border-[var(--dp-color-outline)] flex items-center justify-center text-[var(--dp-color-ink)] shadow-hard-sm shrink-0">
                  <AlertTriangle className="w-6 h-6 stroke-[2.3]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[var(--dp-color-ink)]">
                    يوجد {pendingQueue.length} عقارات جديدة بانتظار المراجعة القانونية والاعتماد
                  </h3>
                  <p className="text-xs text-[#526078] mt-0.5">
                    التحقق السريع من مستندات الملكية يمنح البائعين تجربة سلسة ويزيد موثوقية المنصة للمشترين.
                  </p>
                </div>
              </div>

              <Link to="/admin/reviews">
                <Button variant="primary" size="sm" className="whitespace-nowrap shadow-hard-sm">
                  مراجعة الطابور الآن ({pendingQueue.length})
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Overview Statistics */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black text-[#526078] uppercase tracking-wider">
              المؤشرات الرقمية الحية للمنصة
            </h3>
            <span className="text-xs font-bold text-[#8b95aa]">
              {statsLoading ? 'جاري التحديث...' : 'محدثة لحظياً من Supabase'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'إجمالي المستخدمين', value: stats?.totalUsers, sub: 'حسابات مسجلة وموثقة', icon: <Users className="w-5 h-5" />, bg: 'bg-white', iconBg: 'bg-[var(--dp-color-ground)] text-[var(--dp-color-accent)]' },
              { label: 'عدد المشترين', value: stats?.totalBuyers, sub: 'يبحثون عن عقارات', icon: <Users className="w-5 h-5" />, bg: 'bg-[var(--dp-color-selection)]', iconBg: 'bg-white text-purple-700' },
              { label: 'عدد البائعين', value: stats?.totalSellers, sub: 'ملاك ومطورون عقاريون', icon: <Building2 className="w-5 h-5" />, bg: 'bg-[var(--dp-color-accent-warm)]', iconBg: 'bg-white text-amber-800' },
              { label: 'إجمالي العقارات', value: stats?.totalProperties, sub: 'في السوق والمسودات', icon: <Layers className="w-5 h-5" />, bg: 'bg-white', iconBg: 'bg-[var(--dp-color-ground)] text-[var(--dp-color-ink)]' },
              { label: 'قيد المراجعة', value: stats?.pendingReview, sub: 'تتطلب فحص المستندات', icon: <FileCheck className="w-5 h-5" />, bg: 'bg-[#fff8e7]', iconBg: 'bg-white text-amber-600' },
              { label: 'عقارات منشورة وموثقة', value: stats?.published, sub: 'ظاهرة للمشترين بالسوق', icon: <CheckCircle2 className="w-5 h-5" />, bg: 'bg-[var(--dp-color-field-soft)]', iconBg: 'bg-white text-emerald-600' },
              { label: 'عقارات مرفوضة', value: stats?.rejected, sub: 'بسبب مخالفات أو نقص', icon: <XCircle className="w-5 h-5" />, bg: 'bg-rose-50', iconBg: 'bg-white text-rose-600' },
              { label: 'إجمالي المعاينات', value: stats?.totalAppointments, sub: 'مواعيد مسجلة بالمنصة', icon: <CalendarCheck className="w-5 h-5" />, bg: 'bg-sky-50', iconBg: 'bg-white text-sky-600' },
            ].map((card, i) => (
              <div key={i} className={`p-5 rounded-[var(--dp-radius-corner)] border-[2.5px] border-[var(--dp-color-outline)] ${card.bg} shadow-hard-sm space-y-2`}>
                <div className="flex items-center justify-between">
                  <span className={`p-2 rounded-xl border border-[var(--dp-color-outline)] ${card.iconBg}`}>
                    {card.icon}
                  </span>
                  <span className="text-[11px] font-bold text-right text-[#626d84]">{card.label}</span>
                </div>
                {statsLoading ? (
                  <Skeleton className="h-9 w-16 rounded" />
                ) : (
                  <span className="text-2xl sm:text-3xl font-black text-[var(--dp-color-ink)] block">
                    {card.value ?? 0}
                  </span>
                )}
                <span className="text-[11px] font-bold text-[#626d84] block">{card.sub}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Review Queue Preview */}
        <div className="bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-6 shadow-hard space-y-4">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#ece9db]">
            <div>
              <h3 className="text-base sm:text-lg font-black text-[var(--dp-color-ink)]">
                طابور فحص العقارات الجديدة (Review Queue)
              </h3>
              <p className="text-xs text-[#626d84] mt-0.5">
                العقارات المقدمة من الملاك والمرفق بها مستندات ملكية بانتظار المراجعة والاعتماد
              </p>
            </div>
            <Link
              to="/admin/reviews"
              className="text-xs font-black text-[var(--dp-color-accent)] hover:underline flex items-center gap-1"
            >
              عرض الطابور كاملاً
              <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
            </Link>
          </div>

          {queueLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="p-4 rounded-xl border-[2px] border-[var(--dp-color-outline)] bg-white flex gap-4">
                  <Skeleton className="w-16 h-16 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24 rounded" />
                    <Skeleton className="h-5 w-3/4 rounded" />
                    <Skeleton className="h-3 w-1/2 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : pendingQueue.length === 0 ? (
            <div className="p-8 text-center bg-[var(--dp-color-ground)] rounded-xl border-[2px] border-dashed border-[#ece9db] space-y-2">
              <ShieldCheck className="w-12 h-12 text-emerald-600 mx-auto" />
              <h4 className="text-base font-black text-[var(--dp-color-ink)]">
                طابور المراجعة خالٍ تماماً!
              </h4>
              <p className="text-xs text-[#626d84]">
                تم فحص واعتماد كافة طلبات نشر العقارات المقدمة حتى الآن.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingQueue.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border-[2px] border-[var(--dp-color-outline)] bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-hard-sm hover:shadow-hard transition-all"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={getImageUrl(item)}
                      alt={item.title}
                      className="w-16 h-16 rounded-xl border border-[var(--dp-color-outline)] object-cover shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=200&q=80';
                      }}
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={item.status === 'requires_changes' ? 'secondary' : 'warm'} size="sm">
                          {item.status === 'requires_changes' ? 'يتطلب تعديلات' : 'قيد المراجعة القانونية'}
                        </Badge>
                        <span className="text-[11px] font-bold text-[#626d84]">
                          {new Date(item.created_at).toLocaleDateString('ar-EG')}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-[var(--dp-color-ink)] line-clamp-1">
                        {item.title}
                      </h4>
                      <p className="text-xs text-[#4b5563] mt-0.5">
                        المالك: <span className="font-black">{(item as any).profiles?.full_name || 'غير محدد'}</span>
                        {' • '}السعر: <span className="font-black text-[var(--dp-color-accent)]">{formatEGP(item.price)}</span>
                        {' • '}{item.city || item.governorate || ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link to="/admin/reviews">
                      <Button variant="primary" size="sm" className="text-xs font-black">
                        مراجعة العقار والمستندات
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audit Trail + Quick Nav */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Audit Log */}
          <div className="lg:col-span-2 bg-white border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-6 shadow-hard space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#ece9db]">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-[var(--dp-color-accent)]" />
                <h3 className="text-base font-black text-[var(--dp-color-ink)]">
                  سجل العمليات الإدارية الأخير (Audit Trail)
                </h3>
              </div>
              <Link
                to="/admin/audit-log"
                className="text-xs font-black text-[var(--dp-color-accent)] hover:underline flex items-center gap-1"
              >
                عرض السجل الكامل
                <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
              </Link>
            </div>

            <div className="space-y-3">
              {logsLoading ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="p-3.5 rounded-xl border border-[var(--dp-color-outline)] bg-[var(--dp-color-ground)] space-y-2">
                    <Skeleton className="h-4 w-48 rounded" />
                    <Skeleton className="h-3 w-32 rounded" />
                  </div>
                ))
              ) : auditLogs.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#626d84]">
                  لا توجد عمليات إدارية مسجلة حتى الآن.
                </div>
              ) : (
                auditLogs.slice(0, 5).map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl border border-[var(--dp-color-outline)] bg-[var(--dp-color-ground)] text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-[var(--dp-color-ink)]">
                          {getActionLabel(log.action)}
                        </span>
                        <span className="text-[10px] text-[#8b95aa]">
                          بواسطة {(log as any).admin?.full_name || 'مشرف النظام'}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-[#626d84]">
                        {formatAuditTime(log.created_at)}
                      </span>
                    </div>
                    {log.details && (
                      <p className="text-[11px] text-[#626d84] leading-relaxed border-t border-[#ece9db] pt-1">
                        {log.details}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Management Shortcuts */}
          <div className="bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-6 shadow-hard space-y-4">
            <h3 className="text-base font-black text-[var(--dp-color-ink)] pb-3 border-b-2 border-[#ece9db]">
              روابط الإدارة السريعة
            </h3>

            <div className="space-y-2.5">
              <Link
                to="/admin/reviews"
                className="p-3 rounded-xl border border-[var(--dp-color-outline)] bg-white hover:bg-[var(--dp-color-ground)] transition-colors flex items-center justify-between font-black text-xs text-[var(--dp-color-ink)] block"
              >
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-amber-600" />
                  <span>طابور المراجعة القانونية</span>
                </div>
                {!statsLoading && <Badge variant="warm" size="sm">{stats?.pendingReview ?? 0}</Badge>}
              </Link>

              <Link
                to="/admin/properties"
                className="p-3 rounded-xl border border-[var(--dp-color-outline)] bg-white hover:bg-[var(--dp-color-ground)] transition-colors flex items-center justify-between font-black text-xs text-[var(--dp-color-ink)] block"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[var(--dp-color-accent)]" />
                  <span>إدارة جميع العقارات</span>
                </div>
                <span className="text-xs font-bold text-[#626d84]">{stats?.totalProperties ?? 0}</span>
              </Link>

              <Link
                to="/admin/users"
                className="p-3 rounded-xl border border-[var(--dp-color-outline)] bg-white hover:bg-[var(--dp-color-ground)] transition-colors flex items-center justify-between font-black text-xs text-[var(--dp-color-ink)] block"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span>إدارة المستخدمين والحسابات</span>
                </div>
                <span className="text-xs font-bold text-[#626d84]">{stats?.totalUsers ?? 0}</span>
              </Link>

              <Link
                to="/admin/appointments"
                className="p-3 rounded-xl border border-[var(--dp-color-outline)] bg-white hover:bg-[var(--dp-color-ground)] transition-colors flex items-center justify-between font-black text-xs text-[var(--dp-color-ink)] block"
              >
                <div className="flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-sky-600" />
                  <span>مواعيد المعاينات</span>
                </div>
                <span className="text-xs font-bold text-[#626d84]">{stats?.totalAppointments ?? 0}</span>
              </Link>

              <Link
                to="/admin/inquiries"
                className="p-3 rounded-xl border border-[var(--dp-color-outline)] bg-white hover:bg-[var(--dp-color-ground)] transition-colors flex items-center justify-between font-black text-xs text-[var(--dp-color-ink)] block"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <span>استفسارات المشترين والبائعين</span>
                </div>
                <ArrowLeft className="w-3.5 h-3.5" />
              </Link>

              <Link
                to="/admin/settings"
                className="p-3 rounded-xl border border-[var(--dp-color-outline)] bg-white hover:bg-[var(--dp-color-ground)] transition-colors flex items-center justify-between font-black text-xs text-[var(--dp-color-ink)] block"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-rose-600" />
                  <span>إعدادات وسياسات المنصة</span>
                </div>
                <ArrowLeft className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
