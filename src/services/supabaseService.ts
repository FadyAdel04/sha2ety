/**
 * supabaseService.ts
 * ==================
 * Unified Supabase data access layer for شقتي.
 * All dashboard data (Admin, Seller, Buyer) flows through here.
 * Falls back to localStorage when Supabase is unavailable.
 */

import { supabase } from '@/lib/supabase';
import { PropertyItem } from '@/components/ui/PropertyCard';

// ─── Type Definitions ─────────────────────────────────────────────────────────

export interface SupabaseProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role: 'buyer' | 'seller' | 'admin';
  created_at: string;
}

export interface SupabaseProperty {
  id: string;
  seller_id: string;
  title: string;
  description?: string;
  property_type: string;
  purpose?: string;
  price: number;
  currency?: string;
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  floor_number?: number;
  total_floors?: number;
  finishing_type?: string;
  furnishing_status?: string;
  property_age?: string;
  governorate?: string;
  city?: string;
  neighborhood?: string;
  street_address?: string;
  latitude?: number;
  longitude?: number;
  status: string;
  rejection_reason?: string;
  created_at: string;
  updated_at?: string;
  published_at?: string;
  cover_image_url?: string;
  images?: string[];
  is_verified?: boolean;
  profiles?: { full_name: string; phone: string; email: string } | null;
}

export interface SupabaseAppointment {
  id: string;
  property_id: string;
  buyer_id: string;
  seller_id: string;
  appointment_date: string;
  appointment_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected' | 'rescheduled';
  buyer_message?: string;
  seller_response?: string;
  created_at: string;
  updated_at?: string;
  // joined
  property?: { title: string; city: string; price: number; cover_image_url?: string };
  buyer?: { full_name: string; phone: string };
  seller?: { full_name: string; phone: string };
}

export interface SupabaseNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'properties' | 'appointments' | 'inquiries' | 'account';
  related_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface SupabaseFavorite {
  id: string;
  buyer_id: string;
  property_id: string;
  created_at: string;
  property?: SupabaseProperty;
}

export interface SupabaseInquiry {
  id: string;
  property_id: string;
  buyer_id: string;
  seller_id: string;
  message: string;
  reply?: string;
  status: 'new' | 'replied' | 'handled';
  created_at: string;
  property?: { title: string; city: string; price: number; cover_image_url?: string };
  buyer?: { full_name: string; phone: string };
  seller?: { full_name: string; phone: string };
}

export interface SupabaseAuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details?: string;
  created_at: string;
  admin?: { full_name: string };
}

export interface PlatformStats {
  totalUsers: number;
  totalBuyers: number;
  totalSellers: number;
  totalProperties: number;
  pendingReview: number;
  published: number;
  rejected: number;
  totalAppointments: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'في انتظار التأكيد',
    confirmed: 'تم التأكيد',
    completed: 'مكتملة',
    cancelled: 'ملغية',
    rejected: 'مرفوضة',
    rescheduled: 'موعد مقترح',
  };
  return map[status] || status;
}

function mapPropertyRow(row: any): PropertyItem {
  const images: string[] = row.images || [];
  const coverUrl =
    row.cover_image_url ||
    images[0] ||
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';

  return {
    id: row.id,
    title: row.title,
    price: Number(row.price),
    location: row.neighborhood || row.street_address || row.city || '',
    city: row.city || '',
    governorate: row.governorate || row.city || '',
    district: row.neighborhood || '',
    type: row.property_type || row.type || 'شقة',
    bedrooms: row.bedrooms || 0,
    bathrooms: row.bathrooms || 0,
    area: Number(row.area),
    imageUrl: coverUrl,
    images: images.length > 0 ? images : undefined,
    description: row.description,
    isVerified: Boolean(row.is_verified),
    isFeatured: Boolean(row.is_featured),
    status: row.status || 'available',
    finishing: row.finishing_type,
    floor: row.floor_number === 0 ? 'ground' : row.floor_number ? String(row.floor_number) : undefined,
    totalFloors: row.total_floors ? Number(row.total_floors) : undefined,
    createdAt: row.created_at,
    sellerId: row.seller_id,
    sellerName: row.profiles?.full_name || row.seller?.full_name,
    sellerPhone: row.profiles?.phone || row.seller?.phone,
    sellerJoinedDate: row.created_at?.slice(0, 10),
  };
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

export async function sbFetchNotifications(userId: string): Promise<SupabaseNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data || []) as SupabaseNotification[];
}

export async function sbMarkNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);
  if (error) throw error;
}

export async function sbMarkAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  if (error) throw error;
}

export async function sbCreateNotification(data: {
  user_id: string;
  title: string;
  message: string;
  type: SupabaseNotification['type'];
  related_id?: string;
}): Promise<void> {
  const { error } = await supabase.from('notifications').insert([{ ...data, is_read: false }]);
  if (error) throw error;
}

export async function sbCountUnreadNotifications(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  if (error) return 0;
  return count || 0;
}

// ─── PROPERTIES ───────────────────────────────────────────────────────────────

export async function sbFetchSellerProperties(sellerId: string): Promise<SupabaseProperty[]> {
  const { data, error } = await supabase
    .from('properties')
    .select('*, profiles!seller_id(full_name, phone, email)')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as SupabaseProperty[];
}

export async function sbFetchAllProperties(): Promise<SupabaseProperty[]> {
  const { data, error } = await supabase
    .from('properties')
    .select('*, profiles!seller_id(full_name, phone, email)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as SupabaseProperty[];
}

export async function sbFetchReviewQueue(): Promise<SupabaseProperty[]> {
  const { data, error } = await supabase
    .from('properties')
    .select('*, profiles!seller_id(full_name, phone, email)')
    .in('status', ['pending_review', 'requires_changes'])
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as SupabaseProperty[];
}

export async function sbUpdatePropertyStatus(
  propertyId: string,
  status: string,
  extras: { rejection_reason?: string; admin_notes?: string } = {}
): Promise<void> {
  const updatePayload: any = { status, updated_at: new Date().toISOString() };
  if (status === 'available' || status === 'published') {
    updatePayload.published_at = new Date().toISOString();
    updatePayload.is_verified = true;
  }
  if (extras.rejection_reason) {
    updatePayload.rejection_reason = extras.rejection_reason;
  }

  const { error } = await supabase
    .from('properties')
    .update(updatePayload)
    .eq('id', propertyId);

  if (error) throw error;
}

export async function sbFetchPropertyById(id: string): Promise<SupabaseProperty | null> {
  const { data, error } = await supabase
    .from('properties')
    .select('*, profiles!seller_id(full_name, phone, email)')
    .eq('id', id)
    .single();

  if (error) return null;
  return data as SupabaseProperty;
}

export async function sbFetchPropertyImages(propertyId: string): Promise<string[]> {
  const { data } = await supabase
    .from('property_images')
    .select('storage_path, is_cover, display_order')
    .eq('property_id', propertyId)
    .order('display_order');

  if (!data) return [];
  return data.map((img: any) => {
    if (img.storage_path?.startsWith('http')) return img.storage_path;
    const { data: urlData } = supabase.storage
      .from('property-images')
      .getPublicUrl(img.storage_path);
    return urlData.publicUrl;
  });
}

// ─── APPOINTMENTS ─────────────────────────────────────────────────────────────

export async function sbFetchBuyerAppointments(buyerId: string): Promise<SupabaseAppointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      property:properties(title, city, price, cover_image_url),
      seller:profiles!seller_id(full_name, phone)
    `)
    .eq('buyer_id', buyerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as SupabaseAppointment[];
}

export async function sbFetchSellerAppointments(sellerId: string): Promise<SupabaseAppointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      property:properties(title, city, price, cover_image_url),
      buyer:profiles!buyer_id(full_name, phone)
    `)
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as SupabaseAppointment[];
}

export async function sbFetchAllAppointments(): Promise<SupabaseAppointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      property:properties(title, city, price, cover_image_url),
      buyer:profiles!buyer_id(full_name, phone),
      seller:profiles!seller_id(full_name, phone)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as SupabaseAppointment[];
}

export async function sbCreateAppointment(data: {
  property_id: string;
  buyer_id: string;
  seller_id: string;
  appointment_date: string;
  appointment_time: string;
  buyer_message?: string;
}): Promise<SupabaseAppointment> {
  const { data: result, error } = await supabase
    .from('appointments')
    .insert([{ ...data, status: 'pending' }])
    .select()
    .single();

  if (error) throw error;
  return result as SupabaseAppointment;
}

export async function sbUpdateAppointmentStatus(
  id: string,
  status: SupabaseAppointment['status'],
  sellerResponse?: string
): Promise<void> {
  const payload: any = { status, updated_at: new Date().toISOString() };
  if (sellerResponse) payload.seller_response = sellerResponse;

  const { error } = await supabase.from('appointments').update(payload).eq('id', id);
  if (error) throw error;
}

// ─── FAVORITES ────────────────────────────────────────────────────────────────

export async function sbFetchFavorites(buyerId: string): Promise<PropertyItem[]> {
  const { data, error } = await supabase
    .from('favorites')
    .select(`
      *,
      property:properties(*, profiles!seller_id(full_name, phone))
    `)
    .eq('buyer_id', buyerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return ((data || []) as any[])
    .map((f: any) => f.property)
    .filter(Boolean)
    .map(mapPropertyRow);
}

export async function sbIsFavorite(buyerId: string, propertyId: string): Promise<boolean> {
  const { data } = await supabase
    .from('favorites')
    .select('id')
    .eq('buyer_id', buyerId)
    .eq('property_id', propertyId)
    .maybeSingle();
  return Boolean(data);
}

export async function sbAddFavorite(buyerId: string, propertyId: string): Promise<void> {
  const { error } = await supabase
    .from('favorites')
    .insert([{ buyer_id: buyerId, property_id: propertyId }]);
  if (error && !error.message.includes('duplicate')) throw error;
}

export async function sbRemoveFavorite(buyerId: string, propertyId: string): Promise<void> {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('buyer_id', buyerId)
    .eq('property_id', propertyId);
  if (error) throw error;
}

export async function sbGetFavoriteIds(buyerId: string): Promise<string[]> {
  const { data } = await supabase
    .from('favorites')
    .select('property_id')
    .eq('buyer_id', buyerId);
  return (data || []).map((f: any) => f.property_id);
}

// ─── INQUIRIES ────────────────────────────────────────────────────────────────

export async function sbFetchBuyerInquiries(buyerId: string): Promise<SupabaseInquiry[]> {
  const { data, error } = await supabase
    .from('inquiries')
    .select(`
      *,
      property:properties(title, city, price, cover_image_url),
      seller:profiles!seller_id(full_name, phone)
    `)
    .eq('buyer_id', buyerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as SupabaseInquiry[];
}

export async function sbFetchSellerInquiries(sellerId: string): Promise<SupabaseInquiry[]> {
  const { data, error } = await supabase
    .from('inquiries')
    .select(`
      *,
      property:properties(title, city, price, cover_image_url),
      buyer:profiles!buyer_id(full_name, phone)
    `)
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as SupabaseInquiry[];
}

export async function sbFetchAllInquiries(): Promise<SupabaseInquiry[]> {
  const { data, error } = await supabase
    .from('inquiries')
    .select(`
      *,
      property:properties(title, city, price, cover_image_url),
      buyer:profiles!buyer_id(full_name, phone),
      seller:profiles!seller_id(full_name, phone)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as SupabaseInquiry[];
}

export async function sbSendInquiry(data: {
  property_id: string;
  buyer_id: string;
  seller_id: string;
  message: string;
}): Promise<SupabaseInquiry> {
  const { data: result, error } = await supabase
    .from('inquiries')
    .insert([{ ...data, status: 'new' }])
    .select()
    .single();

  if (error) throw error;
  return result as SupabaseInquiry;
}

export async function sbReplyToInquiry(id: string, reply: string): Promise<void> {
  const { error } = await supabase
    .from('inquiries')
    .update({ reply, status: 'replied' })
    .eq('id', id);
  if (error) throw error;
}

export async function sbMarkInquiryHandled(id: string): Promise<void> {
  const { error } = await supabase
    .from('inquiries')
    .update({ status: 'handled' })
    .eq('id', id);
  if (error) throw error;
}

// ─── ADMIN: USERS ─────────────────────────────────────────────────────────────

export async function sbFetchAllUsers(): Promise<SupabaseProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as SupabaseProfile[];
}

export async function sbFetchUserById(id: string): Promise<SupabaseProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data as SupabaseProfile;
}

export async function sbUpdateUserRole(id: string, role: string): Promise<void> {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
  if (error) throw error;
}

// ─── ADMIN: PLATFORM STATS ────────────────────────────────────────────────────

export async function sbFetchPlatformStats(): Promise<PlatformStats> {
  const [
    { count: totalUsers },
    { count: totalBuyers },
    { count: totalSellers },
    { count: totalProperties },
    { count: pendingReview },
    { count: published },
    { count: rejected },
    { count: totalAppointments },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'buyer'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'seller'),
    supabase.from('properties').select('*', { count: 'exact', head: true }),
    supabase.from('properties').select('*', { count: 'exact', head: true }).eq('status', 'pending_review'),
    supabase.from('properties').select('*', { count: 'exact', head: true }).in('status', ['available', 'published']),
    supabase.from('properties').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
    supabase.from('appointments').select('*', { count: 'exact', head: true }),
  ]);

  return {
    totalUsers: totalUsers || 0,
    totalBuyers: totalBuyers || 0,
    totalSellers: totalSellers || 0,
    totalProperties: totalProperties || 0,
    pendingReview: pendingReview || 0,
    published: published || 0,
    rejected: rejected || 0,
    totalAppointments: totalAppointments || 0,
  };
}

// ─── ADMIN: AUDIT LOG ─────────────────────────────────────────────────────────

export async function sbFetchAuditLogs(): Promise<SupabaseAuditLog[]> {
  const { data, error } = await supabase
    .from('admin_audit_logs')
    .select('*, admin:profiles!admin_id(full_name)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return (data || []) as SupabaseAuditLog[];
}

export async function sbCreateAuditLog(data: {
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details?: string;
}): Promise<void> {
  const { error } = await supabase.from('admin_audit_logs').insert([data]);
  if (error) {
    console.warn('Audit log insert failed (non-critical):', error.message);
  }
}

// ─── REALTIME SUBSCRIPTIONS ───────────────────────────────────────────────────

export function subscribeToNotifications(
  userId: string,
  onNew: (notification: SupabaseNotification) => void
) {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onNew(payload.new as SupabaseNotification);
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export function subscribeToAppointments(
  userId: string,
  role: 'buyer' | 'seller',
  onChange: () => void
) {
  const filter = role === 'buyer' ? `buyer_id=eq.${userId}` : `seller_id=eq.${userId}`;

  const channel = supabase
    .channel(`appointments:${role}:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'appointments',
        filter,
      },
      () => onChange()
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export function subscribeToInquiries(
  userId: string,
  role: 'buyer' | 'seller',
  onChange: () => void
) {
  const filter = role === 'buyer' ? `buyer_id=eq.${userId}` : `seller_id=eq.${userId}`;

  const channel = supabase
    .channel(`inquiries:${role}:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'inquiries',
        filter,
      },
      () => onChange()
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

// ─── RECENTLY VIEWED (Supabase property_views) ────────────────────────────────

export async function sbRecordPropertyView(propertyId: string, viewerId?: string): Promise<void> {
  try {
    await supabase.rpc('record_property_view', {
      p_property_id: propertyId,
      p_viewer_id: viewerId || null,
    });
  } catch {
    // Non-critical
  }
}

export async function sbFetchRecentlyViewed(viewerId: string): Promise<PropertyItem[]> {
  const { data, error } = await supabase
    .from('property_views')
    .select(`
      property_id,
      viewed_at,
      property:properties(*, profiles!seller_id(full_name, phone))
    `)
    .eq('viewer_id', viewerId)
    .order('viewed_at', { ascending: false })
    .limit(15);

  if (error) throw error;

  const seen = new Set<string>();
  const result: PropertyItem[] = [];
  for (const row of (data || []) as any[]) {
    if (row.property && !seen.has(row.property_id)) {
      seen.add(row.property_id);
      result.push(mapPropertyRow(row.property));
    }
  }
  return result;
}

// ─── SELLER STATISTICS ────────────────────────────────────────────────────────

export async function sbFetchSellerStats(sellerId: string) {
  const [
    { count: totalProperties },
    { count: published },
    { count: pendingReview },
    { count: requiresChanges },
    { count: totalViews },
    { count: totalFavorites },
    { count: totalInquiries },
    { count: totalAppointments },
  ] = await Promise.all([
    supabase.from('properties').select('*', { count: 'exact', head: true }).eq('seller_id', sellerId),
    supabase.from('properties').select('*', { count: 'exact', head: true }).eq('seller_id', sellerId).in('status', ['available', 'published']),
    supabase.from('properties').select('*', { count: 'exact', head: true }).eq('seller_id', sellerId).eq('status', 'pending_review'),
    supabase.from('properties').select('*', { count: 'exact', head: true }).eq('seller_id', sellerId).eq('status', 'requires_changes'),
    supabase.from('property_views').select('*', { count: 'exact', head: true }).in('property_id',
      (await supabase.from('properties').select('id').eq('seller_id', sellerId)).data?.map((p: any) => p.id) || []
    ),
    supabase.from('favorites').select('*', { count: 'exact', head: true }).in('property_id',
      (await supabase.from('properties').select('id').eq('seller_id', sellerId)).data?.map((p: any) => p.id) || []
    ),
    supabase.from('inquiries').select('*', { count: 'exact', head: true }).eq('seller_id', sellerId),
    supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('seller_id', sellerId),
  ]);

  return {
    totalProperties: totalProperties || 0,
    publishedCount: published || 0,
    pendingReviewCount: pendingReview || 0,
    requiresChangesCount: requiresChanges || 0,
    totalViews: totalViews || 0,
    favoritesCount: totalFavorites || 0,
    inquiriesCount: totalInquiries || 0,
    appointmentsCount: totalAppointments || 0,
  };
}

// ─── BUYER STATISTICS ─────────────────────────────────────────────────────────

export async function sbFetchBuyerStats(buyerId: string) {
  const [
    { count: favoritesCount },
    { count: appointmentsCount },
    { count: confirmedAppointmentsCount },
    { count: viewedCount },
  ] = await Promise.all([
    supabase.from('favorites').select('*', { count: 'exact', head: true }).eq('buyer_id', buyerId),
    supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('buyer_id', buyerId),
    supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('buyer_id', buyerId).eq('status', 'confirmed'),
    supabase.from('property_views').select('*', { count: 'exact', head: true }).eq('viewer_id', buyerId),
  ]);

  return {
    favoritesCount: favoritesCount || 0,
    appointmentsCount: appointmentsCount || 0,
    confirmedAppointmentsCount: confirmedAppointmentsCount || 0,
    viewedCount: viewedCount || 0,
  };
}

// ─── EXPORT HELPERS ───────────────────────────────────────────────────────────

export { mapPropertyRow, statusLabel };

