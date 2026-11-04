/**
 * useSupabaseData.ts
 * ==================
 * Custom React hooks that fetch live data from Supabase for all dashboards.
 * Falls back gracefully to empty state on error.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
  sbFetchNotifications,
  sbMarkNotificationRead,
  sbMarkAllNotificationsRead,
  sbFetchSellerProperties,
  sbFetchAllProperties,
  sbFetchReviewQueue,
  sbUpdatePropertyStatus,
  sbFetchBuyerAppointments,
  sbFetchSellerAppointments,
  sbFetchAllAppointments,
  sbUpdateAppointmentStatus,
  sbFetchFavorites,
  sbAddFavorite,
  sbRemoveFavorite,
  sbFetchBuyerInquiries,
  sbFetchSellerInquiries,
  sbFetchAllInquiries,
  sbReplyToInquiry,
  sbMarkInquiryHandled,
  sbFetchAllUsers,
  sbFetchPlatformStats,
  sbFetchAuditLogs,
  sbCreateAuditLog,
  sbFetchRecentlyViewed,
  sbFetchSellerStats,
  sbFetchBuyerStats,
  subscribeToNotifications,
  subscribeToAppointments,
  subscribeToInquiries,
  SupabaseNotification,
  SupabaseProperty,
  SupabaseAppointment,
  SupabaseInquiry,
  SupabaseProfile,
  SupabaseAuditLog,
  PlatformStats,
} from '@/services/supabaseService';
import { PropertyItem } from '@/components/ui/PropertyCard';

// ─── useNotifications ─────────────────────────────────────────────────────────

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<SupabaseNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    try {
      setLoading(true);
      const data = await sbFetchNotifications(userId);
      setNotifications(data);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
    if (!userId) return;
    const unsub = subscribeToNotifications(userId, (n) => {
      setNotifications((prev) => [n, ...prev]);
    });
    return unsub;
  }, [userId, load]);

  const markRead = async (id: string) => {
    await sbMarkNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const markAllRead = async () => {
    if (!userId) return;
    await sbMarkAllNotificationsRead(userId);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return { notifications, loading, error, markRead, markAllRead, unreadCount, reload: load };
}

// ─── useSellerProperties ──────────────────────────────────────────────────────

export function useSellerProperties(sellerId: string | undefined) {
  const [properties, setProperties] = useState<SupabaseProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!sellerId) { setLoading(false); return; }
    try {
      setLoading(true);
      const data = await sbFetchSellerProperties(sellerId);
      setProperties(data);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (propertyId: string, status: string, extras = {}) => {
    await sbUpdatePropertyStatus(propertyId, status, extras);
    await load();
  };

  return { properties, loading, error, reload: load, updateStatus };
}

// ─── useAllAdminProperties ────────────────────────────────────────────────────

export function useAllAdminProperties() {
  const [properties, setProperties] = useState<SupabaseProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await sbFetchAllProperties();
      setProperties(data);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { properties, loading, error, reload: load };
}

// ─── useReviewQueue ───────────────────────────────────────────────────────────

export function useReviewQueue() {
  const [queue, setQueue] = useState<SupabaseProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await sbFetchReviewQueue();
      setQueue(data);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { queue, loading, error, reload: load };
}

// ─── useBuyerAppointments ─────────────────────────────────────────────────────

export function useBuyerAppointments(buyerId: string | undefined) {
  const [appointments, setAppointments] = useState<SupabaseAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!buyerId) { setLoading(false); return; }
    try {
      setLoading(true);
      const data = await sbFetchBuyerAppointments(buyerId);
      setAppointments(data);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [buyerId]);

  useEffect(() => {
    load();
    if (!buyerId) return;
    const unsub = subscribeToAppointments(buyerId, 'buyer', load);
    return unsub;
  }, [buyerId, load]);

  const cancel = async (id: string) => {
    await sbUpdateAppointmentStatus(id, 'cancelled');
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'cancelled' as const } : a))
    );
  };

  return { appointments, loading, error, reload: load, cancel };
}

// ─── useSellerAppointments ────────────────────────────────────────────────────

export function useSellerAppointments(sellerId: string | undefined) {
  const [appointments, setAppointments] = useState<SupabaseAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!sellerId) { setLoading(false); return; }
    try {
      setLoading(true);
      const data = await sbFetchSellerAppointments(sellerId);
      setAppointments(data);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  useEffect(() => {
    load();
    if (!sellerId) return;
    const unsub = subscribeToAppointments(sellerId, 'seller', load);
    return unsub;
  }, [sellerId, load]);

  const updateStatus = async (id: string, status: SupabaseAppointment['status'], response?: string) => {
    await sbUpdateAppointmentStatus(id, status, response);
    await load();
  };

  return { appointments, loading, error, reload: load, updateStatus };
}

// ─── useAllAppointments ───────────────────────────────────────────────────────

export function useAllAppointments() {
  const [appointments, setAppointments] = useState<SupabaseAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await sbFetchAllAppointments();
      setAppointments(data);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { appointments, loading, error, reload: load };
}

// ─── useFavorites ─────────────────────────────────────────────────────────────

export function useFavorites(buyerId: string | undefined) {
  const [favorites, setFavorites] = useState<PropertyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!buyerId) { setLoading(false); return; }
    try {
      setLoading(true);
      const data = await sbFetchFavorites(buyerId);
      setFavorites(data);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [buyerId]);

  useEffect(() => { load(); }, [load]);

  const remove = async (propertyId: string) => {
    if (!buyerId) return;
    await sbRemoveFavorite(buyerId, propertyId);
    setFavorites((prev) => prev.filter((p) => p.id !== propertyId));
  };

  const add = async (propertyId: string) => {
    if (!buyerId) return;
    await sbAddFavorite(buyerId, propertyId);
    await load();
  };

  return { favorites, loading, error, reload: load, remove, add };
}

// ─── useBuyerInquiries ────────────────────────────────────────────────────────

export function useBuyerInquiries(buyerId: string | undefined) {
  const [inquiries, setInquiries] = useState<SupabaseInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!buyerId) { setLoading(false); return; }
    try {
      setLoading(true);
      const data = await sbFetchBuyerInquiries(buyerId);
      setInquiries(data);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [buyerId]);

  useEffect(() => {
    load();
    if (!buyerId) return;
    const unsub = subscribeToInquiries(buyerId, 'buyer', load);
    return unsub;
  }, [buyerId, load]);

  return { inquiries, loading, error, reload: load };
}

// ─── useSellerInquiries ───────────────────────────────────────────────────────

export function useSellerInquiries(sellerId: string | undefined) {
  const [inquiries, setInquiries] = useState<SupabaseInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!sellerId) { setLoading(false); return; }
    try {
      setLoading(true);
      const data = await sbFetchSellerInquiries(sellerId);
      setInquiries(data);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  useEffect(() => {
    load();
    if (!sellerId) return;
    const unsub = subscribeToInquiries(sellerId, 'seller', load);
    return unsub;
  }, [sellerId, load]);

  const reply = async (id: string, text: string) => {
    await sbReplyToInquiry(id, text);
    setInquiries((prev) =>
      prev.map((inq) => (inq.id === id ? { ...inq, reply: text, status: 'replied' as const } : inq))
    );
  };

  const markHandled = async (id: string) => {
    await sbMarkInquiryHandled(id);
    setInquiries((prev) =>
      prev.map((inq) => (inq.id === id ? { ...inq, status: 'handled' as const } : inq))
    );
  };

  return { inquiries, loading, error, reload: load, reply, markHandled };
}

// ─── useAllInquiries ──────────────────────────────────────────────────────────

export function useAllInquiries() {
  const [inquiries, setInquiries] = useState<SupabaseInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await sbFetchAllInquiries();
      setInquiries(data);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { inquiries, loading, error, reload: load };
}

// ─── useAdminUsers ────────────────────────────────────────────────────────────

export function useAdminUsers() {
  const [users, setUsers] = useState<SupabaseProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await sbFetchAllUsers();
      setUsers(data);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { users, loading, error, reload: load };
}

// ─── usePlatformStats ─────────────────────────────────────────────────────────

export function usePlatformStats() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await sbFetchPlatformStats();
      setStats(data);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { stats, loading, error, reload: load };
}

// ─── useAuditLogs ─────────────────────────────────────────────────────────────

export function useAuditLogs() {
  const [logs, setLogs] = useState<SupabaseAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await sbFetchAuditLogs();
      setLogs(data);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { logs, loading, error, reload: load };
}

// ─── useRecentlyViewed ────────────────────────────────────────────────────────

export function useRecentlyViewed(viewerId: string | undefined) {
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!viewerId) { setLoading(false); return; }
    try {
      setLoading(true);
      const data = await sbFetchRecentlyViewed(viewerId);
      setProperties(data);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [viewerId]);

  useEffect(() => { load(); }, [load]);

  return { properties, loading, error, reload: load };
}

// ─── useSellerStats ───────────────────────────────────────────────────────────

export function useSellerStats(sellerId: string | undefined) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!sellerId) { setLoading(false); return; }
    try {
      setLoading(true);
      const data = await sbFetchSellerStats(sellerId);
      setStats(data);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  useEffect(() => { load(); }, [load]);

  return { stats, loading, error, reload: load };
}

// ─── useBuyerStats ────────────────────────────────────────────────────────────

export function useBuyerStats(buyerId: string | undefined) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!buyerId) { setLoading(false); return; }
    try {
      setLoading(true);
      const data = await sbFetchBuyerStats(buyerId);
      setStats(data);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [buyerId]);

  useEffect(() => { load(); }, [load]);

  return { stats, loading, error, reload: load };
}

