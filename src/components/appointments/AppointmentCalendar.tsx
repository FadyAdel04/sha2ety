import React, { useState, useMemo } from 'react';
import { AppointmentItem } from '@/services/appointmentService';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatEGP } from '@/lib/utils';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  ChevronLeft,
  CalendarCheck,
  Clock,
  User,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export interface AppointmentCalendarProps {
  appointments: AppointmentItem[];
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (dateStr: string) => void;
  role?: 'buyer' | 'seller';
}

const WEEKDAYS = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

export const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  appointments,
  selectedDate,
  onSelectDate,
  role = 'seller',
}) => {
  // Calendar current view month and year
  const [currentYear, setCurrentYear] = useState(() => {
    if (selectedDate) return Number(selectedDate.split('-')[0]);
    return 2026;
  });
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (selectedDate) return Number(selectedDate.split('-')[1]) - 1; // 0-indexed
    return 10; // November (0-based 10)
  });

  // Month navigation
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const monthName = new Intl.DateTimeFormat('ar-EG', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(currentYear, currentMonth, 1));

  // Build calendar matrix
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days: {
      dayNum: number;
      dateStr: string;
      isCurrentMonth: boolean;
      appointments: AppointmentItem[];
    }[] = [];

    // Leading days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevM = currentMonth === 0 ? 12 : currentMonth;
      const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        dayNum,
        dateStr,
        isCurrentMonth: false,
        appointments: appointments.filter((a) => a.date === dateStr),
      });
    }

    // Days in current month
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        dayNum: i,
        dateStr,
        isCurrentMonth: true,
        appointments: appointments.filter((a) => a.date === dateStr),
      });
    }

    // Trailing days from next month to fill grid (multiple of 7)
    const totalCells = Math.ceil(days.length / 7) * 7;
    const remaining = totalCells - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nextM = currentMonth === 11 ? 1 : currentMonth + 2;
      const nextY = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        dayNum: i,
        dateStr,
        isCurrentMonth: false,
        appointments: appointments.filter((a) => a.date === dateStr),
      });
    }

    return days;
  }, [currentYear, currentMonth, appointments]);

  // Appointments on selected date
  const selectedDayAppointments = useMemo(() => {
    if (!selectedDate) return [];
    return appointments.filter((a) => a.date === selectedDate);
  }, [selectedDate, appointments]);

  const getStatusColor = (status: AppointmentItem['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-500';
      case 'pending':
      case 'rescheduled':
        return 'bg-amber-500';
      case 'completed':
        return 'bg-[var(--dp-color-accent)]';
      case 'cancelled':
      case 'rejected':
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-5 sm:p-6 shadow-hard text-right space-y-6">
      {/* Calendar Header with Navigation */}
      <div className="flex items-center justify-between pb-4 border-b-2 border-[#ece9db]">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-[var(--dp-color-selection)] border border-[var(--dp-color-outline)] text-[var(--dp-color-accent)]">
            <Calendar className="w-5 h-5 stroke-[2.5]" />
          </span>
          <div>
            <h3 className="text-base sm:text-lg font-black text-[var(--dp-color-ink)]">
              {monthName}
            </h3>
            <span className="text-xs text-[#626d84] font-bold">
              اضغط على أي يوم لعرض تفاصيل المواعيد
            </span>
          </div>
        </div>

        {/* Previous / Next Month Arrows */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={prevMonth}
            className="p-2 rounded-xl border border-[var(--dp-color-outline)] bg-white hover:bg-[var(--dp-color-ground)] cursor-pointer transition-colors shadow-xs"
            title="الشهر السابق"
            aria-label="الشهر السابق"
          >
            <ChevronRight className="w-4 h-4 text-[var(--dp-color-ink)]" />
          </button>

          <button
            type="button"
            onClick={nextMonth}
            className="p-2 rounded-xl border border-[var(--dp-color-outline)] bg-white hover:bg-[var(--dp-color-ground)] cursor-pointer transition-colors shadow-xs"
            title="الشهر القادم"
            aria-label="الشهر القادم"
          >
            <ChevronLeft className="w-4 h-4 text-[var(--dp-color-ink)]" />
          </button>
        </div>
      </div>

      {/* Weekday Row */}
      <div className="grid grid-cols-7 gap-1 text-center font-black text-xs text-[#526078] pb-1">
        {WEEKDAYS.map((w, idx) => (
          <div key={idx} className="py-1">
            {w}
          </div>
        ))}
      </div>

      {/* Month Days Grid */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {calendarDays.map((d, index) => {
          const isSelected = selectedDate === d.dateStr;
          const hasAppointments = d.appointments.length > 0;
          const hasConfirmed = d.appointments.some((a) => a.status === 'confirmed');
          const hasPending = d.appointments.some((a) => a.status === 'pending' || a.status === 'rescheduled');

          return (
            <button
              key={index}
              type="button"
              onClick={() => onSelectDate(d.dateStr)}
              className={`min-h-14 sm:min-h-18 p-1.5 rounded-xl border-[2px] transition-all flex flex-col justify-between items-center cursor-pointer text-xs ${
                !d.isCurrentMonth
                  ? 'opacity-35 bg-gray-50 border-transparent text-gray-500'
                  : isSelected
                  ? 'bg-[var(--dp-color-selection)] border-[var(--dp-color-accent)] shadow-hard-xs scale-102 ring-2 ring-[var(--dp-color-accent)]/20 font-black'
                  : 'bg-[var(--dp-color-ground)] border-[var(--dp-color-outline)] hover:bg-white font-bold'
              }`}
            >
              <span className={`text-xs ${isSelected ? 'text-[var(--dp-color-accent)] font-black' : 'text-[var(--dp-color-ink)]'}`}>
                {d.dayNum}
              </span>

              {/* Status Indicators / Dot strip */}
              {hasAppointments && (
                <div className="flex items-center justify-center gap-1 mt-1">
                  {d.appointments.slice(0, 3).map((app, i) => (
                    <span
                      key={i}
                      className={`w-2 h-2 rounded-full border border-white ${getStatusColor(app.status)}`}
                      title={app.statusLabel}
                    />
                  ))}
                  {d.appointments.length > 3 && (
                    <span className="text-[9px] font-black text-[var(--dp-color-accent)]">
                      +{d.appointments.length - 3}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Calendar Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-3 border-t border-[#ece9db] text-[11px] font-bold text-[#526078]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>موعد مؤكد</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>في انتظار التأكيد / بديل</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--dp-color-accent)]" />
          <span>مكتمل</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
          <span>ملغي أو معتذر عنه</span>
        </div>
      </div>

      {/* Selected Date Details Panel */}
      {selectedDate && (
        <div className="p-4 rounded-xl bg-[var(--dp-color-ground)] border-[2px] border-[var(--dp-color-outline)] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#ece9db]">
            <h4 className="font-black text-sm text-[var(--dp-color-ink)] flex items-center gap-1.5">
              <CalendarCheck className="w-4 h-4 text-amber-600" />
              مواعيد يوم: <strong className="text-[var(--dp-color-accent)]">{selectedDate}</strong>
            </h4>
            <span className="text-xs text-[#626d84] font-bold">
              {selectedDayAppointments.length} مواعيد مسجلة
            </span>
          </div>

          {selectedDayAppointments.length === 0 ? (
            <p className="text-xs text-[#8896ab] font-bold py-2 text-center">
              لا توجد مواعيد مجدولة في هذا اليوم المحدد.
            </p>
          ) : (
            <div className="space-y-2.5">
              {selectedDayAppointments.map((app) => (
                <div
                  key={app.id}
                  className="p-3 bg-white rounded-xl border border-[var(--dp-color-outline)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs text-xs font-bold"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          app.status === 'confirmed'
                            ? 'fresh'
                            : app.status === 'pending'
                            ? 'warm'
                            : app.status === 'completed'
                            ? 'primary'
                            : 'danger'
                        }
                        size="sm"
                      >
                        {app.statusLabel}
                      </Badge>
                      <span className="text-[var(--dp-color-ink)] font-black">
                        {app.propertyTitle}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[#526078] text-[11px]">
                      <span>⏰ {app.timeSlot}</span>
                      <span>
                        👤 {role === 'seller' ? `المشتري: ${app.buyerName}` : `المالك: ${app.sellerName}`}
                      </span>
                    </div>
                  </div>

                  <Link to={`/properties/${app.propertyId}`}>
                    <Button variant="outline" size="sm" className="text-xs shrink-0" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                      العقار
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

