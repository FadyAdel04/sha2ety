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

// Storage key helpers for complete multi-user data isolation
export function getBuyerFavoritesKey(userId?: string): string {
  return userId ? `sha2ety_buyer_favorites_${userId}` : 'sha2ety_buyer_favorites_guest';
}

export function getBuyerFavoriteIdsKey(userId?: string): string {
  return userId ? `sha2ety_fav_ids_${userId}` : 'sha2ety_fav_ids_guest';
}

export function getBuyerAppointmentsKey(userId?: string): string {
  return userId ? `sha2ety_buyer_appointments_${userId}` : 'sha2ety_buyer_appointments_guest';
}

export function getBuyerRecentlyViewedKey(userId?: string): string {
  return userId ? `sha2ety_buyer_recently_viewed_${userId}` : 'sha2ety_buyer_recently_viewed_guest';
}

export function getBuyerNotificationsKey(userId?: string): string {
  return userId ? `sha2ety_buyer_notifications_${userId}` : 'sha2ety_buyer_notifications_guest';
}

// ----------------------------------------------------------------------
// FAVORITES METHODS (User-Scoped & Dynamic)
// ----------------------------------------------------------------------
export function getBuyerFavorites(userId?: string): PropertyItem[] {
  try {
    const key = getBuyerFavoritesKey(userId);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }

    // Cross-reference with simple ID list from marketplace toggle
    const idsKey = getBuyerFavoriteIdsKey(userId);
    const rawIds = localStorage.getItem(idsKey);
    if (rawIds) {
      const ids: string[] = JSON.parse(rawIds);
      if (Array.isArray(ids) && ids.length > 0) {
        const master = getStoredPropertiesMaster();
        return master.filter((p) => ids.includes(p.id));
      }
    }

    // Only allow demo fallback if explicitly logged in as demo-buyer-1
    if (userId === 'demo-buyer-1') {
      const rawLegacy = localStorage.getItem('sha2ety_buyer_favorites');
      if (rawLegacy) {
        const parsed = JSON.parse(rawLegacy);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch {
    // Ignore
  }
  return [];
}

export function isBuyerFavorite(propertyId: string, userId?: string): boolean {
  const favs = getBuyerFavorites(userId);
  return favs.some((p) => p.id === propertyId);
}

export function toggleBuyerFavorite(property: PropertyItem, userId?: string): boolean {
  const favs = getBuyerFavorites(userId);
  const exists = favs.some((p) => p.id === property.id);
  let updated: PropertyItem[];

  if (exists) {
    updated = favs.filter((p) => p.id !== property.id);
  } else {
    updated = [property, ...favs];
  }

  try {
    const key = getBuyerFavoritesKey(userId);
    localStorage.setItem(key, JSON.stringify(updated));
    const ids = updated.map((p) => p.id);
    const idsKey = getBuyerFavoriteIdsKey(userId);
    localStorage.setItem(idsKey, JSON.stringify(ids));

    // Also sync to Supabase favorites table if user is authenticated with a UUID
    if (userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      if (exists) {
        supabase.from('favorites').delete().eq('buyer_id', userId).eq('property_id', property.id).then();
      } else {
        supabase.from('favorites').insert({ buyer_id: userId, property_id: property.id }).then();
      }
    }
  } catch {
    // Ignore
  }

  return !exists;
}

export function removeBuyerFavorite(propertyId: string, userId?: string): PropertyItem[] {
  const favs = getBuyerFavorites(userId);
  const updated = favs.filter((p) => p.id !== propertyId);
  try {
    const key = getBuyerFavoritesKey(userId);
    localStorage.setItem(key, JSON.stringify(updated));
    const ids = updated.map((p) => p.id);
    const idsKey = getBuyerFavoriteIdsKey(userId);
    localStorage.setItem(idsKey, JSON.stringify(ids));

    if (userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      supabase.from('favorites').delete().eq('buyer_id', userId).eq('property_id', propertyId).then();
    }
  } catch {
    // Ignore
  }
  return updated;
}

// ----------------------------------------------------------------------
// APPOINTMENTS METHODS (User-Scoped & Dynamic)
// ----------------------------------------------------------------------
export function getBuyerAppointments(buyerId?: string): BuyerAppointment[] {
  try {
    const storedAppointments = getStoredAppointments();
    if (storedAppointments && storedAppointments.length > 0) {
      let filtered: AppointmentItem[];
      if (!buyerId) {
        filtered = [];
      } else if (buyerId === 'demo-buyer-1') {
        filtered = storedAppointments.filter(
          (app) => app.buyerId === 'demo-buyer-1' || app.buyerId === 'buyer'
        );
      } else {
        // Real user: strictly their own appointments only!
        filtered = storedAppointments.filter((app) => app.buyerId === buyerId);
      }

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

    const key = getBuyerAppointmentsKey(buyerId);
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore
  }
  return [];
}

export function cancelBuyerAppointment(appointmentId: string, buyerId?: string): BuyerAppointment[] {
  const list = getBuyerAppointments(buyerId);
  const updated = list.map((app) =>
    app.id === appointmentId
      ? { ...app, status: 'cancelled' as const, statusLabel: 'تم الإلغاء' }
      : app
  );
  try {
    const key = getBuyerAppointmentsKey(buyerId);
    localStorage.setItem(key, JSON.stringify(updated));
  } catch {
    // Ignore
  }
  return updated;
}

export function bookBuyerAppointment(
  data: Omit<BuyerAppointment, 'id' | 'createdAt' | 'status' | 'statusLabel'>,
  buyerId?: string
): BuyerAppointment {
  const list = getBuyerAppointments(buyerId);
  const newApp: BuyerAppointment = {
    ...data,
    id: `app-buyer-${Date.now()}`,
    status: 'pending',
    statusLabel: 'بانتظار موافقة المالك',
    createdAt: new Date().toISOString(),
  };

  const updated = [newApp, ...list];
  try {
    const key = getBuyerAppointmentsKey(buyerId);
    localStorage.setItem(key, JSON.stringify(updated));
  } catch {
    // Ignore
  }
  return newApp;
}

// ----------------------------------------------------------------------
// RECENTLY VIEWED (User-Scoped, Max 15, no duplicates)
// ----------------------------------------------------------------------
export function getBuyerRecentlyViewed(userId?: string): PropertyItem[] {
  try {
    const key = getBuyerRecentlyViewedKey(userId);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Ignore
  }
  return [];
}

export function recordRecentlyViewedProperty(property: PropertyItem, userId?: string) {
  try {
    const current = getBuyerRecentlyViewed(userId);
    // Remove if already exists to push to front without duplicates
    const filtered = current.filter((p) => p.id !== property.id);
    const updated = [property, ...filtered].slice(0, 15);
    const key = getBuyerRecentlyViewedKey(userId);
    localStorage.setItem(key, JSON.stringify(updated));
  } catch {
    // Ignore
  }
}

export function clearBuyerRecentlyViewed(userId?: string) {
  try {
    const key = getBuyerRecentlyViewedKey(userId);
    localStorage.removeItem(key);
  } catch {
    // Ignore
  }
}

// ----------------------------------------------------------------------
// NOTIFICATIONS METHODS (User-Scoped)
// ----------------------------------------------------------------------
export function getBuyerNotifications(userId?: string): BuyerNotification[] {
  try {
    const key = getBuyerNotificationsKey(userId);
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore
  }
  return [];
}

export function markBuyerNotificationAsRead(id: string, userId?: string): BuyerNotification[] {
  const list = getBuyerNotifications(userId);
  const updated = list.map((n) => (n.id === id ? { ...n, read: true } : n));
  try {
    const key = getBuyerNotificationsKey(userId);
    localStorage.setItem(key, JSON.stringify(updated));
  } catch {
    // Ignore
  }
  return updated;
}

export function markAllBuyerNotificationsAsRead(userId?: string): BuyerNotification[] {
  const list = getBuyerNotifications(userId);
  const updated = list.map((n) => ({ ...n, read: true }));
  try {
    const key = getBuyerNotificationsKey(userId);
    localStorage.setItem(key, JSON.stringify(updated));
  } catch {
    // Ignore
  }
  return updated;
}

// ----------------------------------------------------------------------
// OVERVIEW STATISTICS (Calculated from Real Dynamic Records)
// ----------------------------------------------------------------------
export async function getBuyerStatistics(userId?: string): Promise<BuyerStatistics> {
  const favs = getBuyerFavorites(userId);
  const apps = getBuyerAppointments(userId);
  const viewed = getBuyerRecentlyViewed(userId);

  const confirmed = apps.filter((a) => a.status === 'confirmed').length;

  return {
    favoritesCount: favs.length,
    appointmentsCount: apps.length,
    confirmedAppointmentsCount: confirmed,
    viewedCount: viewed.length,
  };
}

