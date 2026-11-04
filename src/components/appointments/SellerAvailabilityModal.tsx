import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import {
  SellerAvailabilitySettings,
  saveSellerAvailabilitySettings,
  DEFAULT_TIME_SLOTS,
} from '@/services/appointmentService';
import {
  Clock,
  Calendar,
  Save,
  CheckCircle2,
  Plus,
  Trash2,
  Sliders,
  AlertCircle,
} from 'lucide-react';

export interface SellerAvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: SellerAvailabilitySettings;
  onSaveSuccess: (updated: SellerAvailabilitySettings) => void;
}

const WEEKDAY_OPTIONS = [
  { day: 6, label: 'السبت' },
  { day: 0, label: 'الأحد' },
  { day: 1, label: 'الإثنين' },
  { day: 2, label: 'الثلاثاء' },
  { day: 3, label: 'الأربعاء' },
  { day: 4, label: 'الخميس' },
  { day: 5, label: 'الجمعة' },
];

export const SellerAvailabilityModal: React.FC<SellerAvailabilityModalProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onSaveSuccess,
}) => {
  const [availableDays, setAvailableDays] = useState<number[]>(currentSettings.availableDays);
  const [slotDuration, setSlotDuration] = useState<number>(currentSettings.slotDurationMinutes || 60);
  const [maxDaily, setMaxDaily] = useState<number>(currentSettings.maxDailyAppointments || 3);
  const [unavailableDates, setUnavailableDates] = useState<string[]>(currentSettings.unavailableDates || []);
  const [newUnavailableDate, setNewUnavailableDate] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const toggleDay = (dayNum: number) => {
    setAvailableDays((prev) =>
      prev.includes(dayNum) ? prev.filter((d) => d !== dayNum) : [...prev, dayNum]
    );
  };

  const handleAddUnavailableDate = () => {
    if (!newUnavailableDate) return;
    if (unavailableDates.includes(newUnavailableDate)) return;
    setUnavailableDates([...unavailableDates, newUnavailableDate]);
    setNewUnavailableDate('');
  };

  const handleRemoveUnavailableDate = (dateToRemove: string) => {
    setUnavailableDates(unavailableDates.filter((d) => d !== dateToRemove));
  };

  const handleSave = () => {
    setIsSaving(true);
    const updated: SellerAvailabilitySettings = {
      ...currentSettings,
      availableDays,
      slotDurationMinutes: slotDuration,
      maxDailyAppointments: maxDaily,
      unavailableDates,
    };

    saveSellerAvailabilitySettings(updated);
    setTimeout(() => {
      setIsSaving(false);
      onSaveSuccess(updated);
      onClose();
    }, 400);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-right">
          <Sliders className="w-5 h-5 text-[var(--dp-color-accent)] stroke-[2.5]" />
          <span>إعدادات أوقات المعاينة المتاحة</span>
        </div>
      }
      description="حدد الأيام والساعات المناسبة لاستقبال المشترين لمنع التعارض في المواعيد."
      size="lg"
      footer={
        <div className="flex justify-end gap-2.5 w-full">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
            إلغاء
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            isLoading={isSaving}
            rightIcon={<Save className="w-4 h-4 stroke-[2.5]" />}
          >
            حفظ الإعدادات
          </Button>
        </div>
      }
    >
      <div className="space-y-6 text-right">
        {/* 1. Available Weekdays */}
        <div>
          <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-2">
            أيام الأسبوع المتاحة للمعاينة:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {WEEKDAY_OPTIONS.map((item) => {
              const isChecked = availableDays.includes(item.day);
              return (
                <button
                  key={item.day}
                  type="button"
                  onClick={() => toggleDay(item.day)}
                  className={`p-2.5 rounded-xl border-[2px] transition-all font-black text-xs cursor-pointer flex items-center justify-between ${
                    isChecked
                      ? 'bg-[var(--dp-color-selection)] border-[var(--dp-color-accent)] text-[var(--dp-color-accent)] shadow-hard-xs'
                      : 'bg-[var(--dp-color-ground)] border-[var(--dp-color-outline)] text-[#626d84] hover:bg-white'
                  }`}
                >
                  <span>{item.label}</span>
                  <span className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] ${isChecked ? 'bg-[var(--dp-color-accent)] text-white' : 'bg-white'}`}>
                    {isChecked ? '✓' : ''}
                  </span>
                </button>
              );
            })}
          </div>
          <span className="text-[11px] text-[#626d84] font-bold mt-1 block">
            لن يتمكن المشترون من حجز أي موعد في الأيام غير المحددة.
          </span>
        </div>

        {/* 2. Duration and Max Daily Appointments */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="مدة جلسة المعاينة"
            value={String(slotDuration)}
            onChange={(e) => setSlotDuration(Number(e.target.value))}
            options={[
              { value: '30', label: '٣٠ دقيقة' },
              { value: '45', label: '٤٥ دقيقة' },
              { value: '60', label: '٦٠ دقيقة (ساعة كاملة - موصى به)' },
              { value: '90', label: '٩٠ دقيقة (ساعة ونصف)' },
            ]}
          />

          <Select
            label="الحد الأقصى للمعاينات في اليوم الواحد"
            value={String(maxDaily)}
            onChange={(e) => setMaxDaily(Number(e.target.value))}
            options={[
              { value: '2', label: 'معاينتان في اليوم (٢)' },
              { value: '3', label: '٣ معاينات في اليوم (٣ - موصى به)' },
              { value: '4', label: '٤ معاينات في اليوم (٤)' },
              { value: '5', label: '٥ معاينات في اليوم (٥)' },
            ]}
          />
        </div>

        {/* 3. Available Time Slots Preview */}
        <div>
          <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-2">
            الفترات الزمنية المعروضة للمشترين:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold text-[#4a5568]">
            {DEFAULT_TIME_SLOTS.map((slot) => (
              <div
                key={slot.id}
                className="p-2.5 rounded-lg bg-[var(--dp-color-ground)] border border-[var(--dp-color-outline)] flex items-center justify-between"
              >
                <span>{slot.label}</span>
                <Badge variant="fresh" size="sm">
                  مفعل
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Unavailable Dates (Exceptions / Vacations) */}
        <div className="p-4 rounded-xl border-[2px] border-[var(--dp-color-outline)] bg-[var(--dp-color-ground)] space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-[var(--dp-color-ink)]">
              أيام الإجازات والتواريخ غير المتاحة (استثناءات خاصة):
            </label>
            <span className="text-[11px] text-[#626d84] font-bold">
              {unavailableDates.length} تواريخ محددة
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={newUnavailableDate}
              onChange={(e) => setNewUnavailableDate(e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddUnavailableDate}
              disabled={!newUnavailableDate}
              rightIcon={<Plus className="w-4 h-4 stroke-[2.5]" />}
            >
              إضافة عطلة
            </Button>
          </div>

          {unavailableDates.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {unavailableDates.map((dateStr) => (
                <span
                  key={dateStr}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-[var(--dp-color-outline)] text-xs font-black text-rose-800 shadow-xs"
                >
                  <span>{dateStr}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveUnavailableDate(dateStr)}
                    className="hover:text-rose-600 cursor-pointer"
                    title="حذف"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

