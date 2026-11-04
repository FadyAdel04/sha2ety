import { supabase } from '@/lib/supabase';
import { PropertyItem } from '@/components/ui/PropertyCard';
import { addNotification } from '@/services/communicationService';
import { sbCreateNotification } from '@/services/supabaseService';

export type AppointmentStatus =
  | 'pending' // في انتظار التأكيد
  | 'confirmed' // تم التأكيد
  | 'rescheduled' // اقتراح موعد جديد
  | 'completed' // مكتمل
  | 'cancelled' // ملغي
  | 'rejected'; // مرفوض

export interface AlternativeProposal {
  date: string; // YYYY-MM-DD
  timeSlot: string;
  notes?: string;
  proposedBy: 'seller' | 'buyer';
  proposedAt: string;
}

export interface AppointmentItem {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyImage: string;
  propertyLocation: string;
  propertyPrice: number;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  isSellerVerified: boolean;
  date: string; // YYYY-MM-DD
  dateFormatted: string; // e.g. "السبت، ٧ نوفمبر ٢٠٢٦"
  timeSlot: string; // e.g. "٠٤:٣٠ م - ٠٥:٣٠ م"
  timeSlotId: string; // e.g. "afternoon_2"
  status: AppointmentStatus;
  statusLabel: string;
  notes?: string;
  rejectionReason?: string;
  alternativeProposal?: AlternativeProposal;
  createdAt: string;
  updatedAt: string;
}

export interface TimeSlotConfig {
  id: string;
  label: string;
  start: string;
  end: string;
}

export interface SellerAvailabilitySettings {
  sellerId: string;
  availableDays: number[]; // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  timeSlots: TimeSlotConfig[];
  slotDurationMinutes: number; // 30, 45, 60
  maxDailyAppointments: number;
  unavailableDates: string[]; // YYYY-MM-DD
}

const APPOINTMENTS_STORAGE_KEY = 'sha2ety_appointments_store';
const SELLER_AVAILABILITY_KEY = 'sha2ety_seller_availability_settings';

// Standard Egyptian time slots
export const DEFAULT_TIME_SLOTS: TimeSlotConfig[] = [
  { id: 'morning_1', label: 'صباحاً (١٠:٠٠ ص - ١١:٠٠ ص)', start: '10:00', end: '11:00' },
  { id: 'morning_2', label: 'صباحاً (١١:٣٠ ص - ١٢:٣٠ م)', start: '11:30', end: '12:30' },
  { id: 'afternoon_1', label: 'ظهراً (٠١:٠٠ م - ٠٢:٠٠ م)', start: '13:00', end: '14:00' },
  { id: 'afternoon_2', label: 'عصراً (٠٣:٠٠ م - ٠٤:٠٠ م)', start: '15:00', end: '16:00' },
  { id: 'evening_1', label: 'مساءً (٠٤:٣٠ م - ٠٥:٣٠ م)', start: '16:30', end: '17:30' },
  { id: 'evening_2', label: 'مساءً (٠٦:٠٠ م - ٠٧:٠٠ م)', start: '18:00', end: '19:00' },
];

// Default initial seller availability
export const DEFAULT_AVAILABILITY: SellerAvailabilitySettings = {
  sellerId: 'demo-seller-1',
  availableDays: [0, 1, 2, 3, 4, 6], // All except Friday (5)
  timeSlots: DEFAULT_TIME_SLOTS,
  slotDurationMinutes: 60,
  maxDailyAppointments: 3,
  unavailableDates: [],
};

// Seeded appointments across the current/next weeks
const INITIAL_APPOINTMENTS: AppointmentItem[] = [
  {
    id: 'app-101',
    propertyId: 'prop-1',
    propertyTitle: 'شقة فاخرة بإطلالة مفتوحة على الحديقة في كمبوند ميفيدا',
    propertyImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    propertyLocation: 'التجمع الخامس، القاهرة الجديدة',
    propertyPrice: 6850000,
    buyerId: 'demo-buyer-1',
    buyerName: 'كريم عبد الله',
    buyerPhone: '01098765432',
    sellerId: 'demo-seller-1',
    sellerName: 'محمد السيد',
    sellerPhone: '01001234567',
    isSellerVerified: true,
    date: '2026-11-07',
    dateFormatted: 'السبت، ٧ نوفمبر ٢٠٢٦',
    timeSlot: 'مساءً (٠٤:٣٠ م - ٠٥:٣٠ م)',
    timeSlotId: 'evening_1',
    status: 'confirmed',
    statusLabel: 'تم التأكيد',
    notes: 'برجاء الحضور في الموعد المحدد أمام بوابة 2 كمبوند ميفيدا.',
    createdAt: '2026-11-02T10:00:00Z',
    updatedAt: '2026-11-03T11:00:00Z',
  },
  {
    id: 'app-102',
    propertyId: 'prop-3',
    propertyTitle: 'دوبلكس بحديقة أرضية خاصة تشطيب سوبر لوكس قرب التسعين',
    propertyImage: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
    propertyLocation: 'حي النرجس، القاهرة الجديدة',
    propertyPrice: 8200000,
    buyerId: 'buyer-user-2',
    buyerName: 'سارة المنشاوي',
    buyerPhone: '01123456789',
    sellerId: 'demo-seller-1',
    sellerName: 'محمد السيد',
    sellerPhone: '01001234567',
    isSellerVerified: true,
    date: '2026-11-09',
    dateFormatted: 'الإثنين، ٩ نوفمبر ٢٠٢٦',
    timeSlot: 'ظهراً (٠١:٠٠ م - ٠٢:٠٠ م)',
    timeSlotId: 'afternoon_1',
    status: 'pending',
    statusLabel: 'في انتظار التأكيد',
    notes: 'أرغب في فحص الحديقة والمدخل الخاص.',
    createdAt: '2026-11-03T14:00:00Z',
    updatedAt: '2026-11-03T14:00:00Z',
  },
  {
    id: 'app-103',
    propertyId: 'prop-1',
    propertyTitle: 'شقة فاخرة بإطلالة مفتوحة على الحديقة في كمبوند ميفيدا',
    propertyImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    propertyLocation: 'التجمع الخامس، القاهرة الجديدة',
    propertyPrice: 6850000,
    buyerId: 'buyer-user-3',
    buyerName: 'م. أحمد مهران',
    buyerPhone: '01222334455',
    sellerId: 'demo-seller-1',
    sellerName: 'محمد السيد',
    sellerPhone: '01001234567',
    isSellerVerified: true,
    date: '2026-11-12',
    dateFormatted: 'الخميس، ١٢ نوفمبر ٢٠٢٦',
    timeSlot: 'عصراً (٠٣:٠٠ م - ٠٤:٠٠ م)',
    timeSlotId: 'afternoon_2',
    status: 'rescheduled',
    statusLabel: 'اقتراح موعد جديد',
    notes: 'الموعد الأصلي كان الأربعاء واقترح المالك موعداً بديلاً يوم الخميس.',
    alternativeProposal: {
      date: '2026-11-12',
      timeSlot: 'عصراً (٠٣:٠٠ م - ٠٤:٠٠ م)',
      notes: 'أعتذر عن يوم الأربعاء لسفري، هل يناسبك يوم الخميس عصراً؟',
      proposedBy: 'seller',
      proposedAt: '2026-11-04T09:00:00Z',
    },
    createdAt: '2026-11-01T15:00:00Z',
    updatedAt: '2026-11-04T09:00:00Z',
  },
  {
    id: 'app-104',
    propertyId: 'prop-2',
    propertyTitle: 'فيلا مستقلة بحمام سباحة خاص وحديقة واسعة في الشيخ زايد',
    propertyImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
    propertyLocation: 'الربوة، الشيخ زايد',
    propertyPrice: 18500000,
    buyerId: 'demo-buyer-1',
    buyerName: 'كريم عبد الله',
    buyerPhone: '01098765432',
    sellerId: 'demo-seller-1',
    sellerName: 'محمد السيد',
    sellerPhone: '01001234567',
    isSellerVerified: true,
    date: '2026-10-28',
    dateFormatted: 'الأربعاء، ٢٨ أكتوبر ٢٠٢٦',
    timeSlot: 'مساءً (٠٦:٠٠ م - ٠٧:٠٠ م)',
    timeSlotId: 'evening_2',
    status: 'completed',
    statusLabel: 'مكتمل',
    notes: 'تمت الزيارة ومعاينة حمام السباحة وتشطيب الفيلا.',
    createdAt: '2026-10-25T11:00:00Z',
    updatedAt: '2026-10-28T19:30:00Z',
  },
];

// Helper to get stored appointments
export function getStoredAppointments(): AppointmentItem[] {
  try {
    const raw = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore
  }
  return [];
}

// Helper to save appointments
export function saveStoredAppointments(list: AppointmentItem[]) {
  try {
    localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Ignore
  }
}

// Format Date in Egyptian Arabic
export function formatArabicDate(dateString: string): string {
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}

// ----------------------------------------------------------------------
// SELLER AVAILABILITY MANAGEMENT
// ----------------------------------------------------------------------
export function getSellerAvailabilitySettings(sellerId?: string): SellerAvailabilitySettings {
  try {
    const raw = localStorage.getItem(`${SELLER_AVAILABILITY_KEY}_${sellerId || 'default'}`);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore
  }
  return DEFAULT_AVAILABILITY;
}

export function saveSellerAvailabilitySettings(
  settings: SellerAvailabilitySettings
): boolean {
  try {
    localStorage.setItem(
      `${SELLER_AVAILABILITY_KEY}_${settings.sellerId || 'default'}`,
      JSON.stringify(settings)
    );
    return true;
  } catch {
    return false;
  }
}

// ----------------------------------------------------------------------
// CONFLICT & AVAILABILITY CHECKING (CRITICAL LOGIC)
// ----------------------------------------------------------------------
export interface SlotAvailabilityResult {
  slot: TimeSlotConfig;
  isAvailable: boolean;
  reason?: string;
}

export function checkDateAndSlotAvailability(
  sellerId: string,
  dateStr: string, // YYYY-MM-DD
  timeSlotId?: string
): {
  isDateAvailable: boolean;
  dateReason?: string;
  slots: SlotAvailabilityResult[];
} {
  const settings = getSellerAvailabilitySettings(sellerId);
  const appointments = getStoredAppointments();

  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dayOfWeek = dateObj.getDay(); // 0 to 6

  // 1. Check if day of week is available
  if (!settings.availableDays.includes(dayOfWeek)) {
    return {
      isDateAvailable: false,
      dateReason: 'المالك غير متاح للمعاينة في هذا اليوم من الأسبوع.',
      slots: [],
    };
  }

  // 2. Check if date is in unavailable dates list (vacations, etc.)
  if (settings.unavailableDates.includes(dateStr)) {
    return {
      isDateAvailable: false,
      dateReason: 'هذا اليوم محدد كعطلة خاصة من قبل المالك.',
      slots: [],
    };
  }

  // 3. Count active appointments on that day for this seller
  const activeAppointmentsOnDate = appointments.filter(
    (app) =>
      app.sellerId === sellerId &&
      app.date === dateStr &&
      (app.status === 'confirmed' || app.status === 'pending' || app.status === 'rescheduled')
  );

  if (activeAppointmentsOnDate.length >= settings.maxDailyAppointments) {
    return {
      isDateAvailable: false,
      dateReason: 'اكتمل الحد الأقصى للمواعيد المتاحة في هذا اليوم.',
      slots: [],
    };
  }

  // 4. Check each time slot for conflicts (no overlapping bookings)
  const slotsResult: SlotAvailabilityResult[] = settings.timeSlots.map((slot) => {
    const isConflict = activeAppointmentsOnDate.some(
      (app) => app.timeSlotId === slot.id
    );

    if (isConflict) {
      return {
        slot,
        isAvailable: false,
        reason: 'هذا التوقيت محجوز بالفعل لمشترٍ آخر.',
      };
    }

    return {
      slot,
      isAvailable: true,
    };
  });

  return {
    isDateAvailable: true,
    slots: slotsResult,
  };
}

// ----------------------------------------------------------------------
// APPOINTMENT NOTIFICATIONS INTEGRATION
// ----------------------------------------------------------------------
function pushNotification(
  target: 'buyer' | 'seller',
  title: string,
  message: string,
  actionUrl: string
) {
  try {
    // 1. Sync to communicationService
    addNotification({
      userId: target,
      category: 'appointments',
      categoryLabel: 'المعاينات',
      title,
      message,
      actionUrl,
      actionLabel: 'عرض الموعد',
    });

    // 2. Sync to Supabase notifications table
    sbCreateNotification({
      user_id: target,
      title,
      message,
      type: 'appointments',
    }).catch(() => {});

    // 3. Fallback to localStorage
    const key = target === 'buyer' ? 'sha2ety_buyer_notifications' : 'sha2ety_seller_notifications';
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.unshift({
      id: `notif-${Date.now()}`,
      title,
      message,
      time: 'الآن',
      read: false,
      actionUrl,
    });
    localStorage.setItem(key, JSON.stringify(existing));
  } catch {
    // Ignore
  }
}

// ----------------------------------------------------------------------
// WORKFLOW ACTIONS
// ----------------------------------------------------------------------

export interface BookAppointmentInput {
  property: PropertyItem;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  date: string; // YYYY-MM-DD
  timeSlotId: string;
  notes?: string;
}

// 1. Buyer Books Appointment
export function bookAppointment(input: BookAppointmentInput): {
  success: boolean;
  appointment?: AppointmentItem;
  error?: string;
} {
  const sellerId = input.property.sellerId || 'demo-seller-1';

  // Conflict Check
  const availability = checkDateAndSlotAvailability(sellerId, input.date);
  if (!availability.isDateAvailable) {
    return { success: false, error: availability.dateReason || 'التاريخ المختار غير متاح.' };
  }

  const slotResult = availability.slots.find((s) => s.slot.id === input.timeSlotId);
  if (!slotResult || !slotResult.isAvailable) {
    return { success: false, error: slotResult?.reason || 'الوقت المختار محجوز أو غير متاح.' };
  }

  const list = getStoredAppointments();
  const dateFormatted = formatArabicDate(input.date);

  const newApp: AppointmentItem = {
    id: `app-${Date.now()}`,
    propertyId: input.property.id,
    propertyTitle: input.property.title,
    propertyImage: input.property.imageUrl,
    propertyLocation: `${input.property.location}، ${input.property.city}`,
    propertyPrice: input.property.price,
    buyerId: input.buyerId,
    buyerName: input.buyerName,
    buyerPhone: input.buyerPhone,
    sellerId: sellerId,
    sellerName: input.property.sellerName || 'محمد السيد',
    sellerPhone: '01001234567',
    isSellerVerified: Boolean(input.property.isVerified),
    date: input.date,
    dateFormatted,
    timeSlot: slotResult.slot.label,
    timeSlotId: input.timeSlotId,
    status: 'pending',
    statusLabel: 'في انتظار التأكيد',
    notes: input.notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  saveStoredAppointments([newApp, ...list]);

  // Sync to Supabase
  try {
    supabase.from('appointments').insert({
      id: newApp.id,
      property_id: newApp.propertyId,
      buyer_id: newApp.buyerId,
      seller_id: newApp.sellerId,
      appointment_date: newApp.date,
      appointment_time: newApp.timeSlot,
      status: 'pending',
      buyer_message: newApp.notes || null,
    }).then();
  } catch {}

  // Notify Seller
  pushNotification(
    'seller',
    'طلب معاينة جديد للعقار',
    `طلب المشتري ${input.buyerName} موعد معاينة في ${dateFormatted} (${slotResult.slot.label}).`,
    '/seller/appointments'
  );

  return { success: true, appointment: newApp };
}

// 2. Seller Confirms Appointment
export function confirmAppointment(appointmentId: string, notes?: string): boolean {
  const list = getStoredAppointments();
  const target = list.find((a) => a.id === appointmentId);
  if (!target) return false;

  const updated = list.map((a) =>
    a.id === appointmentId
      ? {
          ...a,
          status: 'confirmed' as const,
          statusLabel: 'تم التأكيد',
          notes: notes ? `${a.notes ? a.notes + ' • ' : ''}${notes}` : a.notes,
          updatedAt: new Date().toISOString(),
        }
      : a
  );
  saveStoredAppointments(updated);

  try {
    supabase.from('appointments').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', appointmentId).then();
  } catch {}

  pushNotification(
    'buyer',
    'تم تأكيد موعد المعاينة!',
    `وافق المالك ${target.sellerName} على موعد المعاينة يوم ${target.dateFormatted}. نتمنى لك زيارة موفقة.`,
    '/buyer/appointments'
  );

  return true;
}

// 3. Seller Rejects Appointment with Reason
export function rejectAppointment(appointmentId: string, reason: string): boolean {
  const list = getStoredAppointments();
  const target = list.find((a) => a.id === appointmentId);
  if (!target) return false;

  const updated = list.map((a) =>
    a.id === appointmentId
      ? {
          ...a,
          status: 'rejected' as const,
          statusLabel: 'مرفوض',
          rejectionReason: reason,
          updatedAt: new Date().toISOString(),
        }
      : a
  );
  saveStoredAppointments(updated);

  try {
    supabase.from('appointments').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', appointmentId).then();
  } catch {}

  pushNotification(
    'buyer',
    'اعتذار عن موعد المعاينة',
    `اعتذر المالك عن قبول موعد المعاينة للسبب التالي: "${reason}". يمكنك اختيار موعد آخر يناسبك.`,
    '/buyer/appointments'
  );

  return true;
}

// 4. Seller Proposes Alternative Date & Time
export function proposeAlternativeDate(
  appointmentId: string,
  newDate: string,
  newSlotId: string,
  notes?: string
): boolean {
  const list = getStoredAppointments();
  const target = list.find((a) => a.id === appointmentId);
  if (!target) return false;

  const slotConfig = DEFAULT_TIME_SLOTS.find((s) => s.id === newSlotId) || DEFAULT_TIME_SLOTS[0];
  const newDateFormatted = formatArabicDate(newDate);

  const proposal: AlternativeProposal = {
    date: newDate,
    timeSlot: slotConfig.label,
    notes,
    proposedBy: 'seller',
    proposedAt: new Date().toISOString(),
  };

  const updated = list.map((a) =>
    a.id === appointmentId
      ? {
          ...a,
          status: 'rescheduled' as const,
          statusLabel: 'اقتراح موعد جديد',
          alternativeProposal: proposal,
          updatedAt: new Date().toISOString(),
        }
      : a
  );
  saveStoredAppointments(updated);

  try {
    supabase.from('appointments').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', appointmentId).then();
  } catch {}

  pushNotification(
    'buyer',
    'اقترح المالك موعداً بديلاً للمعاينة',
    `اقترح المالك ${target.sellerName} موعداً بديلاً يوم ${newDateFormatted} (${slotConfig.label}). اضغط لمراجعة الموعد والموافقة عليه.`,
    '/buyer/appointments'
  );

  return true;
}

// 5. Buyer Accepts Alternative Date
export function acceptAlternativeDate(appointmentId: string): boolean {
  const list = getStoredAppointments();
  const target = list.find((a) => a.id === appointmentId);
  if (!target || !target.alternativeProposal) return false;

  const proposal = target.alternativeProposal;
  const newDateFormatted = formatArabicDate(proposal.date);

  const updated = list.map((a) =>
    a.id === appointmentId
      ? {
          ...a,
          date: proposal.date,
          dateFormatted: newDateFormatted,
          timeSlot: proposal.timeSlot,
          status: 'confirmed' as const,
          statusLabel: 'تم التأكيد',
          alternativeProposal: undefined,
          updatedAt: new Date().toISOString(),
        }
      : a
  );
  saveStoredAppointments(updated);

  try {
    supabase.from('appointments').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', appointmentId).then();
  } catch {}

  pushNotification(
    'seller',
    'وافق المشتري على الموعد البديل',
    `وافق المشتري ${target.buyerName} على الموعد المقترح في ${newDateFormatted}. تم تأكيد الموعد في جدولك.`,
    '/seller/appointments'
  );

  return true;
}

// 6. Buyer Declines Alternative Date
export function declineAlternativeDate(appointmentId: string): boolean {
  const list = getStoredAppointments();
  const target = list.find((a) => a.id === appointmentId);
  if (!target) return false;

  const updated = list.map((a) =>
    a.id === appointmentId
      ? {
          ...a,
          status: 'cancelled' as const,
          statusLabel: 'تم الإلغاء',
          alternativeProposal: undefined,
          updatedAt: new Date().toISOString(),
        }
      : a
  );
  saveStoredAppointments(updated);

  try {
    supabase.from('appointments').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', appointmentId).then();
  } catch {}

  pushNotification(
    'seller',
    'رفض المشتري الموعد البديل',
    `لم يناسب الموعد المقترح المشتري ${target.buyerName} وتم إلغاء الطلب.`,
    '/seller/appointments'
  );

  return true;
}

// 7. Cancel Appointment (Buyer or Seller)
export function cancelAppointment(
  appointmentId: string,
  cancelledBy: 'buyer' | 'seller',
  reason?: string
): boolean {
  const list = getStoredAppointments();
  const target = list.find((a) => a.id === appointmentId);
  if (!target) return false;

  const updated = list.map((a) =>
    a.id === appointmentId
      ? {
          ...a,
          status: 'cancelled' as const,
          statusLabel: 'تم الإلغاء',
          notes: reason ? `${a.notes ? a.notes + ' • ' : ''}سبب الإلغاء: ${reason}` : a.notes,
          updatedAt: new Date().toISOString(),
        }
      : a
  );
  saveStoredAppointments(updated);

  if (cancelledBy === 'buyer') {
    pushNotification(
      'seller',
      'تم إلغاء موعد معاينة',
      `قام المشتري ${target.buyerName} بإلغاء موعد المعاينة المقرر في ${target.dateFormatted}.`,
      '/seller/appointments'
    );
  } else {
    pushNotification(
      'buyer',
      'تم إلغاء موعد المعاينة',
      `قام المالك ${target.sellerName} بإلغاء موعد المعاينة المقرر في ${target.dateFormatted}.`,
      '/buyer/appointments'
    );
  }

  return true;
}

// 8. Complete Appointment (Seller marks as completed)
export function completeAppointment(appointmentId: string): boolean {
  const list = getStoredAppointments();
  const target = list.find((a) => a.id === appointmentId);
  if (!target) return false;

  const updated = list.map((a) =>
    a.id === appointmentId
      ? {
          ...a,
          status: 'completed' as const,
          statusLabel: 'مكتمل',
          updatedAt: new Date().toISOString(),
        }
      : a
  );
  saveStoredAppointments(updated);

  try {
    supabase.from('appointments').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', appointmentId).then();
  } catch {}

  pushNotification(
    'buyer',
    'اكتملت المعاينة بنجاح',
    `شكراً لحضورك معاينة ${target.propertyTitle}. نأمل أن يكون العقار قد نال إعجابك!`,
    '/buyer/appointments'
  );

  return true;
}

