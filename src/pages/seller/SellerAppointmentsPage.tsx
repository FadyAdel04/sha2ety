import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Notification } from '@/components/ui/Notification';
import { AppointmentCalendar } from '@/components/appointments/AppointmentCalendar';
import { SellerAvailabilityModal } from '@/components/appointments/SellerAvailabilityModal';
import { formatEGP } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useSellerAppointments } from '@/hooks/useSupabaseData';
import {
  getStoredAppointments,
  getSellerAvailabilitySettings,
  confirmAppointment,
  rejectAppointment,
  proposeAlternativeDate,
  cancelAppointment,
  completeAppointment,
  AppointmentItem,
  SellerAvailabilitySettings,
  DEFAULT_TIME_SLOTS,
} from '@/services/appointmentService';
import {
  CalendarCheck,
  Clock,
  MapPin,
  User,
  Check,
  X,
  Phone,
  Sliders,
  Calendar as CalendarIcon,
  List,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

export const SellerAppointmentsPage: React.FC = () => {
  const { user } = useAuth();
  const { appointments: sbAppointments, loading: sbLoading, updateStatus: updateSbStatus } = useSellerAppointments(user?.id);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('2026-11-07');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Settings Modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [availabilitySettings, setAvailabilitySettings] = useState<SellerAvailabilitySettings>(
    getSellerAvailabilitySettings()
  );

  // Reject Modal State
  const [rejectModalApp, setRejectModalApp] = useState<AppointmentItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Propose Alternative Modal State
  const [proposeModalApp, setProposeModalApp] = useState<AppointmentItem | null>(null);
  const [newAltDate, setNewAltDate] = useState('2026-11-12');
  const [newAltSlotId, setNewAltSlotId] = useState('afternoon_2');
  const [newAltNotes, setNewAltNotes] = useState('');

  // Confirm Complete / Cancel Dialogs
  const [completeConfirmId, setCompleteConfirmId] = useState<string | null>(null);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);

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
        buyerName: a.buyer?.full_name || 'مشتري',
        buyerPhone: a.buyer?.phone || '',
        sellerId: a.seller_id,
        sellerName: user?.fullName || 'بائع',
        sellerPhone: user?.phone || '',
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

  // Filtered Appointments
  const filteredAppointments = appointments.filter((app) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending') return app.status === 'pending';
    if (statusFilter === 'confirmed') return app.status === 'confirmed';
    if (statusFilter === 'rescheduled') return app.status === 'rescheduled';
    if (statusFilter === 'completed') return app.status === 'completed';
    if (statusFilter === 'cancelled_rejected')
      return app.status === 'cancelled' || app.status === 'rejected';
    return true;
  });

  // Action Handlers
  const handleConfirm = (id: string) => {
    confirmAppointment(id);
    loadAppointments();
    setToastMessage('تم تأكيد موعد المعاينة وإشعار المشتري بنجاح.');
  };

  const handleRejectSubmit = () => {
    if (!rejectModalApp || !rejectReason.trim()) return;
    rejectAppointment(rejectModalApp.id, rejectReason.trim());
    setRejectModalApp(null);
    setRejectReason('');
    loadAppointments();
    setToastMessage('تم الاعتذار عن الموعد وإشعار المشتري بالسبب.');
  };

  const handleProposeSubmit = () => {
    if (!proposeModalApp) return;
    proposeAlternativeDate(proposeModalApp.id, newAltDate, newAltSlotId, newAltNotes);
    setProposeModalApp(null);
    setNewAltNotes('');
    loadAppointments();
    setToastMessage('تم إرسال اقتراح الموعد البديل للمشتري بانتظار موافقته.');
  };

  const handleCompleteSubmit = () => {
    if (!completeConfirmId) return;
    completeAppointment(completeConfirmId);
    setCompleteConfirmId(null);
    loadAppointments();
    setToastMessage('تم تسجيل المعاينة كمكتملة بنجاح.');
  };

  const handleCancelSubmit = () => {
    if (!cancelConfirmId) return;
    cancelAppointment(cancelConfirmId, 'seller', 'اعتذار طارئ من المالك');
    setCancelConfirmId(null);
    loadAppointments();
    setToastMessage('تم إلغاء الموعد وإشعار المشتري.');
  };

  const getStatusBadge = (status: AppointmentItem['status']) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="fresh">تم التأكيد</Badge>;
      case 'pending':
        return <Badge variant="warm">في انتظار التأكيد</Badge>;
      case 'rescheduled':
        return <Badge variant="secondary">اقتراح موعد جديد</Badge>;
      case 'completed':
        return <Badge variant="primary">مكتمل</Badge>;
      case 'rejected':
      case 'cancelled':
        return <Badge variant="danger">ملغي / معتذر عنه</Badge>;
    }
  };

  return (
    <DashboardLayout
      role="seller"
      title="مواعيد المعاينة الميدانية"
      subtitle="إدارة طلبات المعاينات، تأكيد المواعيد، واقتراح مواعيد بديلة لمنع التضارب."
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsSettingsOpen(true)}
          rightIcon={<Sliders className="w-4 h-4 text-[var(--dp-color-accent)] stroke-[2.5]" />}
        >
          إعدادات الأوقات المتاحة
        </Button>
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

      {/* Top Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 text-right">
        {[
          { label: 'إجمالي المواعيد', value: appointments.length, icon: <CalendarCheck className="w-5 h-5 text-[var(--dp-color-accent)]" />, bg: 'bg-[var(--dp-color-panel)]' },
          { label: 'في انتظار التأكيد', value: appointments.filter((a) => a.status === 'pending').length, icon: <Clock className="w-5 h-5 text-amber-600" />, bg: 'bg-[#fffbf0]' },
          { label: 'المواعيد المؤكدة', value: appointments.filter((a) => a.status === 'confirmed').length, icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />, bg: 'bg-[#f3fcf7]' },
          { label: 'المعاينات المكتملة', value: appointments.filter((a) => a.status === 'completed').length, icon: <Sparkles className="w-5 h-5 text-purple-600" />, bg: 'bg-[var(--dp-color-selection)]' },
        ].map((item, i) => (
          <div
            key={i}
            className={`p-4 sm:p-5 rounded-[var(--dp-radius-corner)] border-[2.5px] border-[var(--dp-color-outline)] shadow-hard-xs ${item.bg}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-xl bg-white border border-[var(--dp-color-outline)]">
                {item.icon}
              </span>
              <span className="text-2xl font-black text-[var(--dp-color-ink)]">
                {item.value}
              </span>
            </div>
            <span className="text-xs font-black text-[#526078] block">{item.label}</span>
          </div>
        ))}
      </div>

      {/* View Mode & Filter Controls Header */}
      <div className="bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-4 shadow-hard mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 text-right">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'pending', label: 'في انتظار التأكيد' },
            { id: 'confirmed', label: 'المؤكدة' },
            { id: 'rescheduled', label: 'اقتراح بديل' },
            { id: 'completed', label: 'المكتملة' },
            { id: 'cancelled_rejected', label: 'ملغي / معتذر' },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
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
            <span>التقويم الشهري</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'calendar' ? (
        /* Visual Calendar View */
        <AppointmentCalendar
          appointments={appointments}
          selectedDate={selectedDate}
          onSelectDate={(date) => setSelectedDate(date)}
          role="seller"
        />
      ) : (
        /* Detailed List View */
        <div className="space-y-4 text-right">
          {filteredAppointments.length === 0 ? (
            <div className="bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-10 shadow-hard text-right">
              <EmptyState
                icon={<CalendarCheck className="w-8 h-8 text-[var(--dp-color-accent)]" />}
                title="لا توجد مواعيد في هذا التصنيف"
                description="لم يتم العثور على أي طلبات معاينة تطابق الفلتر المحدد حالياً."
              />
            </div>
          ) : (
            filteredAppointments.map((app) => (
              <div
                key={app.id}
                className="bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-6 shadow-hard flex flex-col lg:flex-row lg:items-center justify-between gap-6 transition-all hover:shadow-hard-lg"
              >
                {/* Appointment Info */}
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

                    {/* Date and Location Strip */}
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

                    {/* Buyer Contact */}
                    <div className="flex items-center gap-2 text-xs text-[#526078] pt-1">
                      <User className="w-4 h-4 text-[var(--dp-color-accent)]" />
                      <span>المشتري: <strong className="text-[var(--dp-color-ink)]">{app.buyerName}</strong></span>
                      <span className="text-[#8896ab]">({app.buyerPhone})</span>
                    </div>

                    {/* Notes & Alternative Proposal Details */}
                    {app.notes && (
                      <p className="text-xs text-[#374151] bg-[#fffdf0] p-2.5 rounded-lg border border-amber-200 leading-relaxed font-medium">
                        💬 رسالة المشتري: {app.notes}
                      </p>
                    )}

                    {app.alternativeProposal && (
                      <div className="p-3 rounded-lg bg-[var(--dp-color-selection)] border border-[var(--dp-color-outline)] text-xs text-[var(--dp-color-ink)] space-y-1">
                        <span className="font-black block text-[var(--dp-color-accent)]">
                          🔄 موعد بديل مقترح قيد انتظار رد المشتري:
                        </span>
                        <span>اليوم: {app.alternativeProposal.date} • الوقت: {app.alternativeProposal.timeSlot}</span>
                        {app.alternativeProposal.notes && (
                          <p className="text-[#526078] font-bold">"{app.alternativeProposal.notes}"</p>
                        )}
                      </div>
                    )}

                    {app.rejectionReason && (
                      <p className="text-xs text-rose-800 bg-rose-50 p-2.5 rounded-lg border border-rose-200 leading-relaxed font-bold">
                        ⚠️ سبب الاعتذار: {app.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Seller Action Buttons */}
                <div className="flex flex-wrap lg:flex-col items-center justify-end gap-2 shrink-0 border-t lg:border-t-0 pt-4 lg:pt-0 border-[#ece9db]">
                  {/* Status = Pending: Confirm, Propose Alternative, Reject */}
                  {app.status === 'pending' && (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full sm:w-auto text-xs"
                        rightIcon={<Check className="w-4 h-4 stroke-[3]" />}
                        onClick={() => handleConfirm(app.id)}
                      >
                        تأكيد الموعد
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto text-xs"
                        rightIcon={<RefreshCw className="w-3.5 h-3.5" />}
                        onClick={() => {
                          setProposeModalApp(app);
                          setNewAltDate(app.date);
                          setNewAltSlotId(app.timeSlotId);
                          setNewAltNotes('');
                        }}
                      >
                        اقتراح موعد بديل
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full sm:w-auto text-xs text-rose-700 hover:bg-rose-50"
                        rightIcon={<X className="w-3.5 h-3.5" />}
                        onClick={() => {
                          setRejectModalApp(app);
                          setRejectReason('');
                        }}
                      >
                        اعتذار مع ذكر السبب
                      </Button>
                    </>
                  )}

                  {/* Status = Confirmed: Complete, Cancel, Call Buyer */}
                  {app.status === 'confirmed' && (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full sm:w-auto text-xs"
                        rightIcon={<CheckCircle2 className="w-4 h-4 stroke-[2.5]" />}
                        onClick={() => setCompleteConfirmId(app.id)}
                      >
                        تحديد كمعاينة مكتملة
                      </Button>

                      <a href={`tel:${app.buyerPhone}`} className="w-full sm:w-auto">
                        <Button
                          variant="warm"
                          size="sm"
                          className="w-full text-xs"
                          rightIcon={<Phone className="w-3.5 h-3.5" />}
                        >
                          اتصال بالمشتري
                        </Button>
                      </a>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full sm:w-auto text-xs text-rose-700 hover:bg-rose-50"
                        onClick={() => setCancelConfirmId(app.id)}
                      >
                        إلغاء الموعد
                      </Button>
                    </>
                  )}

                  {/* Property Link */}
                  <Link to={`/properties/${app.propertyId}`} className="w-full sm:w-auto">
                    <Button variant="outline" size="sm" className="w-full text-xs" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                      عرض العقار
                    </Button>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL 1: Reject Appointment with Reason */}
      <Modal
        isOpen={Boolean(rejectModalApp)}
        onClose={() => setRejectModalApp(null)}
        title="الاعتذار عن موعد المعاينة"
        description={`المشتري: ${rejectModalApp?.buyerName} • ${rejectModalApp?.propertyTitle}`}
        size="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setRejectModalApp(null)}>
              تراجع
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleRejectSubmit}
              disabled={!rejectReason.trim()}
            >
              تأكيد الاعتذار
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-right">
          <p className="text-xs text-[#526078] font-bold">
            يرجى توضيح سبب الاعتذار للمشتري ليتمكن من اختيار موعد أو عقار آخر يناسبه:
          </p>
          <Textarea
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="مثال: أعتذر عن عدم إمكانية المعاينة في هذا اليوم لارتباطي بموعد سفر خارجي، يسعدني التنسيق في الأسبوع القادم..."
            required
          />
        </div>
      </Modal>

      {/* MODAL 2: Propose Alternative Date & Time */}
      <Modal
        isOpen={Boolean(proposeModalApp)}
        onClose={() => setProposeModalApp(null)}
        title="اقتراح موعد بديل للمعاينة"
        description={`إرسال مقترح موعد جديد إلى ${proposeModalApp?.buyerName}`}
        size="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setProposeModalApp(null)}>
              إلغاء
            </Button>
            <Button variant="primary" size="sm" onClick={handleProposeSubmit}>
              إرسال المقترح للمشتري
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-right">
          <Input
            label="اليوم البديل المقترح *"
            type="date"
            value={newAltDate}
            onChange={(e) => setNewAltDate(e.target.value)}
            required
          />

          <Select
            label="الفترة الزمنية المقترحة *"
            value={newAltSlotId}
            onChange={(e) => setNewAltSlotId(e.target.value)}
            options={DEFAULT_TIME_SLOTS.map((s) => ({ value: s.id, label: s.label }))}
          />

          <Textarea
            label="رسالة توضيحية للمشتري (اختياري)"
            rows={3}
            value={newAltNotes}
            onChange={(e) => setNewAltNotes(e.target.value)}
            placeholder="أعتذر عن تعارض الموعد السابق، هل يناسبك هذا التوقيت البديل؟"
          />
        </div>
      </Modal>

      {/* MODAL 3: Seller Availability Configuration */}
      <SellerAvailabilityModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentSettings={availabilitySettings}
        onSaveSuccess={(updated) => {
          setAvailabilitySettings(updated);
          setToastMessage('تم تحديث أوقات المعاينة المتاحة بنجاح.');
        }}
      />

      {/* Confirm Dialog: Complete */}
      <ConfirmDialog
        isOpen={Boolean(completeConfirmId)}
        onClose={() => setCompleteConfirmId(null)}
        onConfirm={handleCompleteSubmit}
        title="تأكيد اكتمال المعاينة"
        description="هل تمت المعاينة الميدانية للعقار بنجاح مع المشتري؟ سيتم نقل حالة الموعد إلى 'مكتمل'."
        confirmLabel="نعم، اكتملت المعاينة"
        cancelLabel="تراجع"
        variant="primary"
      />

      {/* Confirm Dialog: Cancel Confirmed Appointment */}
      <ConfirmDialog
        isOpen={Boolean(cancelConfirmId)}
        onClose={() => setCancelConfirmId(null)}
        onConfirm={handleCancelSubmit}
        title="تأكيد إلغاء موعد المعاينة"
        description="هل أنت متأكد من رغبتك في إلغاء هذا الموعد المؤكد؟ سيتم إشعار المشتري بإلغاء الزيارة."
        confirmLabel="تأكيد الإلغاء"
        cancelLabel="تراجع"
        variant="danger"
      />
    </DashboardLayout>
  );
};
