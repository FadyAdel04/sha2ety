import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Notification } from '@/components/ui/Notification';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { AppointmentCalendar } from '@/components/appointments/AppointmentCalendar';
import { formatEGP } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useBuyerAppointments } from '@/hooks/useSupabaseData';
import {
  getStoredAppointments,
  acceptAlternativeDate,
  declineAlternativeDate,
  cancelAppointment,
  AppointmentItem,
} from '@/services/appointmentService';
import {
  CalendarCheck,
  Clock,
  MapPin,
  Phone,
  User,
  ShieldCheck,
  ExternalLink,
  Check,
  X,
  Compass,
  AlertTriangle,
  Calendar as CalendarIcon,
  List,
  RefreshCw,
  Info,
} from 'lucide-react';

export const BuyerAppointmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { appointments: sbAppointments, loading: sbLoading, cancel: cancelSb } = useBuyerAppointments(user?.id);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'confirmed' | 'pending_rescheduled' | 'past'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedDate, setSelectedDate] = useState<string>('2026-11-07');
  const [cancelModalId, setCancelModalId] = useState<string | null>(null);
  const [detailsModalApp, setDetailsModalApp] = useState<AppointmentItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadAppointments = useCallback(() => {
    if (!sbLoading && sbAppointments.length > 0) {
      const mapped: AppointmentItem[] = sbAppointments.map((a: any) => ({
        id: a.id,
        propertyId: a.property_id,
        propertyTitle: a.property?.title || 'عقار',
        propertyImage: a.property?.cover_image_url || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80',
        propertyLocation: a.property?.city || '',
        propertyPrice: a.property?.price || 0,
        buyerId: a.buyer_id,
        buyerName: user?.fullName || 'مشتري',
        buyerPhone: user?.phone || '',
        sellerId: a.seller_id,
        sellerName: a.seller?.full_name || 'بائع',
        sellerPhone: a.seller?.phone || '',
        isSellerVerified: true,
        date: a.appointment_date,
        dateFormatted: new Date(a.appointment_date).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
        timeSlot: a.appointment_time,
        timeSlotId: '',
        status: a.status,
        statusLabel: ({ pending: 'في انتظار التأكيد', confirmed: 'تم التأكيد', completed: 'مكتمل', cancelled: 'ملغي', rejected: 'مرفوض', rescheduled: 'اقتراح موعد جديد' } as Record<string, string>)[a.status] || a.status,
        notes: a.buyer_message,
        createdAt: a.created_at,
        updatedAt: a.updated_at || a.created_at,
      }));
      setAppointments(mapped);
    } else {
      setAppointments(getStoredAppointments());
    }
  }, [sbLoading, sbAppointments, user]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // 1. Accept Alternative Date
  const handleAcceptAlternative = (id: string) => {
    acceptAlternativeDate(id);
    loadAppointments();
    setToastMessage('تم قبول الموعد البديل وتأكيد المعاينة بنجاح!');
  };

  // 2. Decline Alternative Date
  const handleDeclineAlternative = (id: string) => {
    declineAlternativeDate(id);
    loadAppointments();
    setToastMessage('تم رفض الموعد المقترح وإلغاء الطلب.');
  };

  // 3. Cancel Appointment
  const handleCancelAppointment = (id: string) => {
    cancelAppointment(id, 'buyer', 'إلغاء من قبل المشتري');
    setCancelModalId(null);
    loadAppointments();
    setToastMessage('تم إلغاء موعد المعاينة وفق سياسة المنصة.');
  };

  // Filtered Appointments
  const filteredAppointments = appointments.filter((app) => {
    if (activeTab === 'confirmed') return app.status === 'confirmed';
    if (activeTab === 'pending_rescheduled')
      return app.status === 'pending' || app.status === 'rescheduled';
    if (activeTab === 'past')
      return app.status === 'completed' || app.status === 'cancelled' || app.status === 'rejected';
    return true;
  });

  const getStatusBadge = (status: AppointmentItem['status']) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="fresh">موعد مؤكد</Badge>;
      case 'pending':
        return <Badge variant="warm">في انتظار التأكيد</Badge>;
      case 'rescheduled':
        return <Badge variant="secondary">اقتراح موعد جديد من المالك</Badge>;
      case 'completed':
        return <Badge variant="primary">معاينة مكتملة</Badge>;
      case 'cancelled':
      case 'rejected':
      default:
        return <Badge variant="danger">ملغي / معتذر عنه</Badge>;
    }
  };

  return (
    <DashboardLayout
      role="buyer"
      title="مواعيد المعاينة"
      subtitle="جدول مواعيدك الميدانية لزيارة العقارات، ومتابعة ردود واقتراحات الملاك."
      actions={
        <Link to="/properties">
          <Button
            variant="primary"
            size="sm"
            rightIcon={<Compass className="w-4 h-4 stroke-[2.5]" />}
          >
            حجز معاينة جديدة
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

      {/* Tabs and View Switcher Header */}
      <div className="bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-4 shadow-hard mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 text-right">
        {/* Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'كل المواعيد', count: appointments.length },
            { id: 'confirmed', label: 'المؤكدة', count: appointments.filter((a) => a.status === 'confirmed').length },
            { id: 'pending_rescheduled', label: 'بانتظار الرد / مقترحات', count: appointments.filter((a) => a.status === 'pending' || a.status === 'rescheduled').length },
            { id: 'past', label: 'المكتملة والسابقة', count: appointments.filter((a) => a.status === 'completed' || a.status === 'cancelled' || a.status === 'rejected').length },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border-[2px] whitespace-nowrap flex items-center gap-2 ${
                  isActive
                    ? 'bg-[var(--dp-color-accent)] text-white border-[var(--dp-color-outline)] shadow-hard-xs'
                    : 'bg-[var(--dp-color-ground)] border-transparent text-[#526078] hover:border-[var(--dp-color-outline)]'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? 'bg-white text-[var(--dp-color-accent)]' : 'bg-gray-200'}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* View Switcher: List vs Calendar */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--dp-color-ground)] border border-[var(--dp-color-outline)] self-end md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black cursor-pointer flex items-center gap-1.5 transition-all ${
              viewMode === 'list'
                ? 'bg-white text-[var(--dp-color-accent)] shadow-xs border border-[var(--dp-color-outline)]'
                : 'text-[#526078]'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>عرض القائمة</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black cursor-pointer flex items-center gap-1.5 transition-all ${
              viewMode === 'calendar'
                ? 'bg-white text-[var(--dp-color-accent)] shadow-xs border border-[var(--dp-color-outline)]'
                : 'text-[#526078]'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>التقويم</span>
          </button>
        </div>
      </div>

      {/* Main Appointments Display */}
      {viewMode === 'calendar' ? (
        <AppointmentCalendar
          appointments={appointments}
          selectedDate={selectedDate}
          onSelectDate={(date) => setSelectedDate(date)}
          role="buyer"
        />
      ) : filteredAppointments.length === 0 ? (
        <div className="bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-10 shadow-hard text-right">
          <EmptyState
            icon={<CalendarCheck className="w-8 h-8 text-[var(--dp-color-accent)]" />}
            title="لا توجد مواعيد في هذا القسم"
            description="يمكنك استكشاف العقارات وحجز موعد زيارة ميدانية في أي وقت يناسبك."
            actionLabel="تصفح العقارات المتاحة"
            onAction={() => navigate('/properties')}
          />
        </div>
      ) : (
        <div className="space-y-4 text-right">
          {filteredAppointments.map((app) => (
            <div
              key={app.id}
              className="bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-6 shadow-hard flex flex-col lg:flex-row lg:items-center justify-between gap-6 transition-all hover:shadow-hard-lg"
            >
              {/* Property & Appointment Details */}
              <div className="flex flex-col sm:flex-row items-start gap-4 flex-1">
                <img
                  src={app.propertyImage}
                  alt={app.propertyTitle}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-[2px] border-[var(--dp-color-outline)] object-cover shadow-xs shrink-0"
                />

                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getStatusBadge(app.status)}
                    <span className="text-xs font-black text-[var(--dp-color-accent)]">
                      {formatEGP(app.propertyPrice)}
                    </span>
                    <span className="text-[11px] font-mono text-[#8896ab]">
                      #{app.id}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-[var(--dp-color-ink)] hover:text-[var(--dp-color-accent)]">
                    <Link to={`/properties/${app.propertyId}`}>{app.propertyTitle}</Link>
                  </h3>

                  {/* Date, Time, Location */}
                  <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-[#4a5568]">
                    <span className="flex items-center gap-1.5 bg-[var(--dp-color-ground)] px-2.5 py-1 rounded-lg border border-[var(--dp-color-outline)] font-black text-amber-950">
                      <CalendarIcon className="w-4 h-4 text-amber-600" />
                      {app.dateFormatted}
                    </span>
                    <span className="flex items-center gap-1.5 bg-[var(--dp-color-ground)] px-2.5 py-1 rounded-lg border border-[var(--dp-color-outline)] font-black text-purple-950">
                      <Clock className="w-4 h-4 text-purple-600" />
                      {app.timeSlot}
                    </span>
                    <span className="flex items-center gap-1.5 bg-[var(--dp-color-ground)] px-2.5 py-1 rounded-lg border border-[var(--dp-color-outline)]">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      {app.propertyLocation}
                    </span>
                  </div>

                  {/* Seller Contact */}
                  <div className="flex items-center gap-2 text-xs text-[#526078] pt-1">
                    <User className="w-4 h-4 text-[var(--dp-color-accent)]" />
                    <span>المالك: <strong className="text-[var(--dp-color-ink)]">{app.sellerName}</strong></span>
                    {app.isSellerVerified && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.2 rounded border border-emerald-200">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        موثق
                      </span>
                    )}
                  </div>

                  {/* Alternative proposal banner with Accept / Decline actions */}
                  {app.status === 'rescheduled' && app.alternativeProposal && (
                    <div className="p-4 rounded-xl bg-[#fffbf0] border-[2px] border-amber-300 text-xs space-y-3">
                      <div className="flex items-center gap-2 font-black text-amber-900">
                        <RefreshCw className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>اقترح المالك موعداً بديلاً للمعاينة:</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-amber-950 font-bold">
                        <span>📅 اليوم الجديد: <strong>{app.alternativeProposal.date}</strong></span>
                        <span>⏰ الفترة: <strong>{app.alternativeProposal.timeSlot}</strong></span>
                      </div>

                      {app.alternativeProposal.notes && (
                        <p className="text-[#4b5563] bg-white p-2.5 rounded-lg border border-amber-200">
                          💬 رسالة المالك: "{app.alternativeProposal.notes}"
                        </p>
                      )}

                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleAcceptAlternative(app.id)}
                          rightIcon={<Check className="w-3.5 h-3.5 stroke-[3]" />}
                          className="text-xs"
                        >
                          قبول الموعد البديل
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeclineAlternative(app.id)}
                          rightIcon={<X className="w-3.5 h-3.5 text-rose-600" />}
                          className="text-xs"
                        >
                          رفض الموعد البديل
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Rejection notice */}
                  {app.rejectionReason && (
                    <p className="text-xs text-rose-800 bg-rose-50 p-2.5 rounded-lg border border-rose-200 leading-relaxed font-bold">
                      ⚠️ اعتذر المالك عن الموعد للسبب: "{app.rejectionReason}"
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons for Buyer */}
              <div className="flex flex-wrap lg:flex-col items-center justify-end gap-2 shrink-0 border-t lg:border-t-0 pt-4 lg:pt-0 border-[#ece9db]">
                {/* Details Modal Trigger */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto text-xs"
                  onClick={() => setDetailsModalApp(app)}
                  rightIcon={<Info className="w-3.5 h-3.5" />}
                >
                  مشاهدة التفاصيل
                </Button>

                {/* Call Seller (if confirmed) */}
                {app.status === 'confirmed' && (
                  <a href={`tel:${app.sellerPhone}`} className="w-full sm:w-auto">
                    <Button
                      variant="warm"
                      size="sm"
                      className="w-full text-xs"
                      rightIcon={<Phone className="w-3.5 h-3.5" />}
                    >
                      اتصال بالمالك ({app.sellerPhone})
                    </Button>
                  </a>
                )}

                {/* Cancel Request (according to platform policy) */}
                {(app.status === 'pending' || app.status === 'confirmed') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full sm:w-auto text-xs text-rose-700 hover:bg-rose-50"
                    onClick={() => setCancelModalId(app.id)}
                  >
                    إلغاء الموعد
                  </Button>
                )}

                {/* Link to Property Page */}
                <Link to={`/properties/${app.propertyId}`} className="w-full sm:w-auto">
                  <Button variant="ghost" size="sm" className="w-full text-xs" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                    صفحة الإعلان
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: View Full Details */}
      <Modal
        isOpen={Boolean(detailsModalApp)}
        onClose={() => setDetailsModalApp(null)}
        title="تفاصيل طلب المعاينة"
        description={`طلب رقم #${detailsModalApp?.id}`}
        size="md"
        footer={
          <Button variant="primary" size="sm" onClick={() => setDetailsModalApp(null)}>
            إغلاق
          </Button>
        }
      >
        {detailsModalApp && (
          <div className="space-y-4 text-right">
            <div className="flex items-center gap-3 p-3 bg-[var(--dp-color-ground)] rounded-xl border border-[var(--dp-color-outline)]">
              <img
                src={detailsModalApp.propertyImage}
                alt={detailsModalApp.propertyTitle}
                className="w-16 h-16 rounded-lg object-cover border border-[var(--dp-color-outline)] shrink-0"
              />
              <div className="min-w-0">
                <span className="text-xs font-black text-[var(--dp-color-ink)] block line-clamp-1">
                  {detailsModalApp.propertyTitle}
                </span>
                <span className="text-[11px] text-[#626d84] block mt-0.5">
                  {detailsModalApp.propertyLocation} • {formatEGP(detailsModalApp.propertyPrice)}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-[var(--dp-color-outline)] space-y-2 text-xs font-bold text-[#4a5568]">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#ece9db]">
                <span>الحالة الحالية:</span>
                <div>{getStatusBadge(detailsModalApp.status)}</div>
              </div>
              <div className="flex items-center justify-between pb-1.5 border-b border-[#ece9db]">
                <span>التاريخ والوقت:</span>
                <span className="text-[var(--dp-color-ink)] font-black">
                  {detailsModalApp.dateFormatted} ({detailsModalApp.timeSlot})
                </span>
              </div>
              <div className="flex items-center justify-between pb-1.5 border-b border-[#ece9db]">
                <span>المالك المعتمد:</span>
                <span className="text-[var(--dp-color-ink)] font-black">
                  {detailsModalApp.sellerName} ({detailsModalApp.sellerPhone})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>تاريخ تقديم الطلب:</span>
                <span className="font-mono text-[#626d84]">
                  {detailsModalApp.createdAt.split('T')[0]}
                </span>
              </div>
            </div>

            {detailsModalApp.notes && (
              <div className="p-3 bg-gray-50 rounded-xl border border-[var(--dp-color-outline)] text-xs">
                <span className="font-black text-[var(--dp-color-ink)] block mb-1">
                  ملاحظات الطلب:
                </span>
                <p className="text-[#4b5563] leading-relaxed">
                  {detailsModalApp.notes}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Confirmation Dialog: Cancel Appointment Request */}
      <ConfirmDialog
        isOpen={Boolean(cancelModalId)}
        onClose={() => setCancelModalId(null)}
        onConfirm={() => cancelModalId && handleCancelAppointment(cancelModalId)}
        title="تأكيد إلغاء موعد المعاينة"
        description="وفق سياسة شقتي، يمكنك إلغاء الموعد قبل 4 ساعات على الأقل من الوقت المحدد لتجنب تعليق حجز المعاينات."
        confirmLabel="تأكيد إلغاء الموعد"
        cancelLabel="تراجع"
        variant="danger"
      />
    </DashboardLayout>
  );
};
