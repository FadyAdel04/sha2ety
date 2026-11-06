import { PropertyItem } from '@/components/ui/PropertyCard';
import { supabase } from '@/lib/supabase';
import { getStoredAppointments, AppointmentItem } from '@/services/appointmentService';
import { getStoredPropertiesMaster } from '@/services/propertyService';

export interface BuyerStatistics {
  favoritesCount: number;
  appointmentsCount: number;
  confirmedAppointmentsCount: number;
  viewedCount: number;
}

export interface BuyerAppointment {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyImage: string;
  propertyLocation: string;
  propertyPrice: number;
  sellerName: string;
  sellerPhone: string;
  isSellerVerified: boolean;
  date: string; // e.g. "السبت، ٧ نوفمبر ٢٠٢٦"
  time: string; // e.g. "٠٤:٣٠ م"
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected' | 'rescheduled';
  statusLabel: string;
  notes?: string;
  createdAt: string;
}

export interface BuyerInquiry {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyImage: string;
  question: string;
  answer?: string;
  sellerName: string;
  replied: boolean;
  createdAt: string;
}

export interface BuyerNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'appointment' | 'favorite' | 'inquiry' | 'price_drop';
  actionUrl?: string;
}

// Storage keys
const BUYER_FAVORITES_KEY = 'sha2ety_buyer_favorites';
const BUYER_APPOINTMENTS_KEY = 'sha2ety_buyer_appointments';
const BUYER_RECENTLY_VIEWED_KEY = 'sha2ety_buyer_recently_viewed';
const BUYER_NOTIFICATIONS_KEY = 'sha2ety_buyer_notifications';

// ----------------------------------------------------------------------
// FAVORITES METHODS (100% Dynamic)
// ----------------------------------------------------------------------
export function getBuyerFavorites(): PropertyItem[] {
  try {
    const raw = localStorage.getItem(BUYER_FAVORITES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }

    // Cross-reference with simple ID list from marketplace toggle
    const rawIds = localStorage.getItem('sha2ety_favorites');
    if (rawIds) {
      const ids: string[] = JSON.parse(rawIds);
      if (ids.length > 0) {
        const master = getStoredPropertiesMaster();
        return master.filter((p) => ids.includes(p.id));
      }
    }
  } catch {
    // Ignore
  }
  return [];
}

export function isBuyerFavorite(propertyId: string): boolean {
  const favs = getBuyerFavorites();
  return favs.some((p) => p.id === propertyId);
}

export function toggleBuyerFavorite(property: PropertyItem): boolean {
  const favs = getBuyerFavorites();
  const exists = favs.some((p) => p.id === property.id);
  let updated: PropertyItem[];

  if (exists) {
    updated = favs.filter((p) => p.id !== property.id);
  } else {
    updated = [property, ...favs];
  }

  try {
    localStorage.setItem(BUYER_FAVORITES_KEY, JSON.stringify(updated));
    const ids = updated.map((p) => p.id);
    localStorage.setItem('sha2ety_favorites', JSON.stringify(ids));
  } catch {
    // Ignore
  }

  return !exists;
}

export function removeBuyerFavorite(propertyId: string): PropertyItem[] {
  const favs = getBuyerFavorites();
  const updated = favs.filter((p) => p.id !== propertyId);
  try {
    localStorage.setItem(BUYER_FAVORITES_KEY, JSON.stringify(updated));
    const ids = updated.map((p) => p.id);
    localStorage.setItem('sha2ety_favorites', JSON.stringify(ids));
  } catch {
    // Ignore
  }
  return updated;
}

// ----------------------------------------------------------------------
// APPOINTMENTS METHODS (100% Dynamic)
// ----------------------------------------------------------------------
export function getBuyerAppointments(buyerId?: string): BuyerAppointment[] {
  try {
    const storedAppointments = getStoredAppointments();
    if (storedAppointments && storedAppointments.length > 0) {
      const filtered = buyerId
        ? storedAppointments.filter(
            (app) =>
              app.buyerId === buyerId ||
              (!buyerId && app.buyerId === 'demo-buyer-1') ||
              (buyerId === 'demo-buyer-1' && app.buyerId === 'demo-buyer-1') ||
              app.buyerId === 'buyer'
          )
        : storedAppointments;

      return filtered.map((app) => ({
        id: app.id,
        propertyId: app.propertyId,
        propertyTitle: app.propertyTitle,
        propertyImage: app.propertyImage,
        propertyLocation: app.propertyLocation,
        propertyPrice: app.propertyPrice,
        sellerName: app.sellerName,
        sellerPhone: app.sellerPhone,
        isSellerVerified: app.isSellerVerified,
        date: app.dateFormatted || app.date,
        time: app.timeSlot,
        status: app.status,
        statusLabel: app.statusLabel,
        notes: app.notes,
        createdAt: app.createdAt,
      }));
    }

    const raw = localStorage.getItem(BUYER_APPOINTMENTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore
  }
  return [];
}

export function cancelBuyerAppointment(appointmentId: string): BuyerAppointment[] {
  const list = getBuyerAppointments();
  const updated = list.map((app) =>
    app.id === appointmentId
      ? { ...app, status: 'cancelled' as const, statusLabel: 'تم الإلغاء' }
      : app
  );
  try {
    localStorage.setItem(BUYER_APPOINTMENTS_KEY, JSON.stringify(updated));
  } catch {
    // Ignore
  }
  return updated;
}

export function bookBuyerAppointment(
  data: Omit<BuyerAppointment, 'id' | 'createdAt' | 'status' | 'statusLabel'>
): BuyerAppointment {
  const list = getBuyerAppointments();
  const newApp: BuyerAppointment = {
    ...data,
    id: `app-buyer-${Date.now()}`,
    status: 'pending',
    statusLabel: 'بانتظار موافقة المالك',
    createdAt: new Date().toISOString(),
  };

  const updated = [newApp, ...list];
  try {
    localStorage.setItem(BUYER_APPOINTMENTS_KEY, JSON.stringify(updated));
  } catch {
    // Ignore
  }
  return newApp;
}

// ----------------------------------------------------------------------
// RECENTLY VIEWED (Max 15, no duplicates, fully dynamic)
// ----------------------------------------------------------------------
export function getBuyerRecentlyViewed(): PropertyItem[] {
  try {
    const raw = localStorage.getItem(BUYER_RECENTLY_VIEWED_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore
  }
  return [];
}

export function recordRecentlyViewedProperty(property: PropertyItem) {
  try {
    const current = getBuyerRecentlyViewed();
    // Remove if already exists to push to front without duplicates
    const filtered = current.filter((p) => p.id !== property.id);
    const updated = [property, ...filtered].slice(0, 15); // limit to 15 items
    localStorage.setItem(BUYER_RECENTLY_VIEWED_KEY, JSON.stringify(updated));
  } catch {
    // Ignore
  }
}

export function clearBuyerRecentlyViewed() {
  try {
    localStorage.removeItem(BUYER_RECENTLY_VIEWED_KEY);
  } catch {
    // Ignore
  }
}

// ----------------------------------------------------------------------
// NOTIFICATIONS METHODS
// ----------------------------------------------------------------------
export function getBuyerNotifications(): BuyerNotification[] {
  try {
    const raw = localStorage.getItem(BUYER_NOTIFICATIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore
  }
  return [];
}

export function markBuyerNotificationAsRead(id: string): BuyerNotification[] {
  const list = getBuyerNotifications();
  const updated = list.map((n) => (n.id === id ? { ...n, read: true } : n));
  try {
    localStorage.setItem(BUYER_NOTIFICATIONS_KEY, JSON.stringify(updated));
  } catch {
    // Ignore
  }
  return updated;
}

export function markAllBuyerNotificationsAsRead(): BuyerNotification[] {
  const list = getBuyerNotifications();
  const updated = list.map((n) => ({ ...n, read: true }));
  try {
    localStorage.setItem(BUYER_NOTIFICATIONS_KEY, JSON.stringify(updated));
  } catch {
    // Ignore
  }
  return updated;
}

// ----------------------------------------------------------------------
// OVERVIEW STATISTICS (Calculated from Real Dynamic Records)
// ----------------------------------------------------------------------
export async function getBuyerStatistics(): Promise<BuyerStatistics> {
  const favs = getBuyerFavorites();
  const apps = getBuyerAppointments();
  const viewed = getBuyerRecentlyViewed();

  const confirmed = apps.filter((a) => a.status === 'confirmed').length;

  return {
    favoritesCount: favs.length,
    appointmentsCount: apps.length,
    confirmedAppointmentsCount: confirmed,
    viewedCount: viewed.length,
  };
}

