import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { PropertyItem } from '@/components/ui/PropertyCard';
import { formatEGP } from '@/lib/utils';
import {
  checkDateAndSlotAvailability,
  bookAppointment,
  SlotAvailabilityResult,
  AppointmentItem,
  formatArabicDate,
} from '@/services/appointmentService';
import {
  CalendarCheck,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  User,
  ArrowLeft,
  X,
} from 'lucide-react';

export interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: PropertyItem;
  onSuccess?: (appointment: AppointmentItem) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  property,
  onSuccess,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Generate available dates for the next 14 days starting tomorrow
  const availableDates = useMemo(() => {
    const dates: { dateStr: string; dayName: string; dayNum: number; monthName: string }[] = [];
    const today = new Date();

    for (let i = 1; i <= 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const dayName = new Intl.DateTimeFormat('ar-EG', { weekday: 'short' }).format(d);
      const monthName = new Intl.DateTimeFormat('ar-EG', { month: 'short' }).format(d);

      dates.push({
        dateStr,
        dayName,
        dayNum: d.getDate(),
        monthName,
      });
    }
    return dates;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(availableDates[0]?.dateStr || '');
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [phone, setPhone] = useState<string>(user?.phone || '01098765432');
  const [notes, setNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedAppointment, setConfirmedAppointment] = useState<AppointmentItem | null>(null);

  // Check seller availability for selected date
  const sellerId = property.sellerId || 'demo-seller-1';
  const availability = useMemo(() => {
    if (!selectedDate) return { isDateAvailable: false, slots: [] };
    return checkDateAndSlotAvailability(sellerId, selectedDate);
  }, [sellerId, selectedDate]);

  // Set default slot when slots update
  useEffect(() => {
    if (availability.isDateAvailable && availability.slots.length > 0) {
      const firstAvailable = availability.slots.find((s) => s.isAvailable);
      setSelectedSlotId(firstAvailable?.slot.id || '');
    } else {
      setSelectedSlotId('');
    }
  }, [selectedDate, availability]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setConfirmedAppointment(null);
      setErrorMessage(null);
      if (user?.phone) setPhone(user.phone);
    }
  }, [isOpen, user?.phone]);

  const validatePhone = (num: string) => {
    const cleaned = num.replace(/\s+/g, '');
    const regex = /^01[0125][0-9]{8}$/;
    return regex.test(cleaned);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedDate) {
      setErrorMessage('يرجى اختيار تاريخ المعاينة.');
      return;
    }

    if (!selectedSlotId) {
      setErrorMessage('يرجى اختيار الوقت المناسب من الفترات المتاحة.');
      return;
    }

    if (!validatePhone(phone)) {
      setErrorMessage('يرجى إدخال رقم هاتف مصري صحيح (11 رقماً يبدأ بـ 010, 011, 012, 015).');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const result = bookAppointment({
        property,
        buyerId: user?.id || 'demo-buyer-1',
        buyerName: user?.fullName || 'كريم عبد الله',
        buyerPhone: phone.trim(),
        date: selectedDate,
        timeSlotId: selectedSlotId,
        notes: notes.trim(),
      });

      setIsSubmitting(false);

      if (!result.success) {
        setErrorMessage(result.error || 'حدث تعارض في الموعد، يرجى اختيار موعد آخر.');
        return;
      }

      if (result.appointment) {
        setConfirmedAppointment(result.appointment);
        onSuccess?.(result.appointment);
      }
    }, 400);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-right">
          <CalendarCheck className="w-5 h-5 text-[var(--dp-color-accent)] stroke-[2.5]" />
          <span>احجز موعد معاينة ميدانية للعقار</span>
        </div>
      }
      description="اختر اليوم والوقت المناسب وسيتلقى المالك طلبك فوراً للتأكيد والتواصل."
      size="lg"
      footer={
        confirmedAppointment ? (
          <div className="flex justify-between items-center w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              إغلاق
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onClose();
                navigate('/buyer/appointments');
              }}
              rightIcon={<ArrowLeft className="w-4 h-4 stroke-[2.5]" />}
            >
              الانتقال لجدول مواعيدي
            </Button>
          </div>
        ) : (
          <div className="flex justify-end gap-2.5 w-full">
            <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              إلغاء
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              disabled={!selectedSlotId || !availability.isDateAvailable}
              rightIcon={<CheckCircle2 className="w-4 h-4 stroke-[2.5]" />}
            >
              تأكيد إرسال الطلب
            </Button>
          </div>
        )
      }
    >
      {confirmedAppointment ? (
        /* Confirmation Screen */
        <div className="space-y-6 text-right py-2 animate-fadeIn">
          <div className="w-16 h-16 rounded-2xl bg-[var(--dp-color-accent-fresh)] border-[2.5px] border-[var(--dp-color-outline)] flex items-center justify-center text-emerald-900 mx-auto shadow-hard-xs">
            <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
          </div>

          <div className="text-center space-y-1.5">
            <Badge variant="warm" size="sm">
              طلب رقم: {confirmedAppointment.id}
            </Badge>
            <h3 className="text-xl font-black text-[var(--dp-color-ink)]">
              تم إرسال طلب المعاينة بنجاح!
            </h3>
            <p className="text-xs text-[#526078] font-bold max-w-md mx-auto leading-relaxed">
              تلقى المالك إشعاراً فوريًا بحجزك. سيقوم بمراجعة الموعد وتأكيده والتواصل معك هاتفياً.
            </p>
          </div>

          {/* Appointment details summary card */}
          <div className="p-4 rounded-xl border-[2px] border-[var(--dp-color-outline)] bg-[var(--dp-color-ground)] space-y-3">
            <div className="flex items-center gap-3 pb-3 border-b border-[#ece9db]">
              <img
                src={property.imageUrl}
                alt={property.title}
                className="w-14 h-14 rounded-lg object-cover border border-[var(--dp-color-outline)] shrink-0"
              />
              <div className="min-w-0">
                <span className="text-xs font-black text-[var(--dp-color-ink)] block line-clamp-1">
                  {property.title}
                </span>
                <span className="text-[11px] text-[#626d84] block mt-0.5">
                  {property.location}، {property.city}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold text-[#4a5568]">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{confirmedAppointment.dateFormatted}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600 shrink-0" />
                <span>{confirmedAppointment.timeSlot}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[var(--dp-color-accent)] shrink-0" />
                <span>المالك: {confirmedAppointment.sellerName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>هاتفك: {confirmedAppointment.buyerPhone}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Booking Form */
        <form onSubmit={handleSubmit} className="space-y-5 text-right">
          {/* Property Short Summary Strip */}
          <div className="p-3.5 rounded-xl border border-[var(--dp-color-outline)] bg-[var(--dp-color-ground)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={property.imageUrl}
                alt={property.title}
                className="w-12 h-12 rounded-lg object-cover border border-[var(--dp-color-outline)] shrink-0"
              />
              <div className="min-w-0">
                <span className="text-xs font-black text-[var(--dp-color-ink)] block truncate">
                  {property.title}
                </span>
                <span className="text-[11px] text-[#626d84] block mt-0.5">
                  {property.location}، {property.city} • <strong className="text-[var(--dp-color-accent)]">{formatEGP(property.price)}</strong>
                </span>
              </div>
            </div>

            {property.isVerified && (
              <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                مالك موثق
              </span>
            )}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs font-black text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Date Selection Strip (Next 14 Days) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black text-[var(--dp-color-ink)] flex items-center gap-1">
                <Calendar className="w-4 h-4 text-[var(--dp-color-accent)]" />
                اختر تاريخ المعاينة <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] font-bold text-[#626d84]">
                خلال الأسبوعين القادمين
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {availableDates.map((d) => {
                const isSelected = selectedDate === d.dateStr;
                const check = checkDateAndSlotAvailability(sellerId, d.dateStr);
                const isAvailable = check.isDateAvailable;

                return (
                  <button
                    key={d.dateStr}
                    type="button"
                    disabled={!isAvailable}
                    onClick={() => {
                      setSelectedDate(d.dateStr);
                      setErrorMessage(null);
                    }}
                    className={`min-w-16 p-2 rounded-xl border-[2px] text-center transition-all cursor-pointer flex flex-col items-center justify-center shrink-0 ${
                      !isAvailable
                        ? 'opacity-40 bg-gray-100 border-gray-300 cursor-not-allowed text-gray-500'
                        : isSelected
                        ? 'bg-[var(--dp-color-accent)] text-white border-[var(--dp-color-outline)] shadow-hard-xs scale-102 font-black'
                        : 'bg-white border-[var(--dp-color-outline)] text-[#253044] hover:bg-[var(--dp-color-selection)] font-bold'
                    }`}
                  >
                    <span className="text-[11px] block">{d.dayName}</span>
                    <span className="text-base font-black block my-0.5">{d.dayNum}</span>
                    <span className="text-[10px] block opacity-80">{d.monthName}</span>
                  </button>
                );
              })}
            </div>

            {!availability.isDateAvailable && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs font-bold text-amber-900 mt-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-700" />
                <span>{availability.dateReason}</span>
              </div>
            )}
          </div>

          {/* 2. Time Slot Selection */}
          {availability.isDateAvailable && (
            <div>
              <label className="text-xs font-black text-[var(--dp-color-ink)] flex items-center gap-1 mb-2">
                <Clock className="w-4 h-4 text-[var(--dp-color-accent)]" />
                الوقت المناسب <span className="text-rose-500">*</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {availability.slots.map(({ slot, isAvailable, reason }) => {
                  const isSelected = selectedSlotId === slot.id;

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => {
                        setSelectedSlotId(slot.id);
                        setErrorMessage(null);
                      }}
                      className={`p-2.5 rounded-xl border-[2px] text-right transition-all flex items-center justify-between text-xs ${
                        !isAvailable
                          ? 'opacity-40 bg-gray-100 border-gray-300 cursor-not-allowed text-gray-400'
                          : isSelected
                          ? 'bg-[var(--dp-color-field-soft)] border-[var(--dp-color-outline)] text-emerald-950 font-black shadow-hard-xs'
                          : 'bg-white border-[var(--dp-color-outline)] text-[#4a5568] hover:bg-[var(--dp-color-selection)] font-bold cursor-pointer'
                      }`}
                    >
                      <span className="truncate">{slot.label}</span>
                      <span className="shrink-0 text-[10px] font-black">
                        {isAvailable ? (
                          isSelected ? (
                            <span className="text-emerald-700">✓ تم الاختيار</span>
                          ) : (
                            <span className="text-emerald-600">متاح</span>
                          )
                        ) : (
                          <span className="text-rose-600">{reason || 'محجوز'}</span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Buyer Phone Number */}
          <div>
            <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1">
              رقم الهاتف للتواصل وتأكيد الحضور <span className="text-rose-500">*</span>
            </label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01098765432"
              required
            />
            <span className="text-[11px] text-[#626d84] font-bold mt-1 block">
              سيقوم المالك بالاتصال بك على هذا الرقم لتأكيد الموعد وإرسال لوكيشن نقطة الالتقاء.
            </span>
          </div>

          {/* 4. Additional Notes */}
          <div>
            <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1">
              ملاحظات إضافية للمالك (اختياري)
            </label>
            <Textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: سأحضر برفقة مهندس ديكور، يرجى التنسيق لإتاحة فحص الجراج والروف..."
            />
          </div>
        </form>
      )}
    </Modal>
  );
};

