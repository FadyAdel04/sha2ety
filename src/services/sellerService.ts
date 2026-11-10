import { supabase } from '@/lib/supabase';
import {
  getStoredPropertiesMaster,
  saveMasterProperty,
  deleteMasterProperty,
  PropertyItem,
} from '@/services/propertyService';
import { getStoredAppointments } from '@/services/appointmentService';
import { addNotification } from '@/services/communicationService';
import { sbCreateNotification } from '@/services/supabaseService';
import { uploadPropertyDocument } from '@/services/storageService';

export type SellerPropertyStatus =
  | 'draft'
  | 'pending_review'
  | 'requires_changes'
  | 'available'
  | 'rejected'
  | 'sold';

export interface PropertyLegalDocument {
  id: string;
  name: string;
  type: 'deed' | 'building_permit' | 'national_id' | 'tax_commercial_record' | 'reconciliation_certificate' | 'power_of_attorney' | 'ownership_proof' | 'additional';
  typeName: string;
  url: string;
  size?: string;
  uploadedAt: string;
  status?: 'pending' | 'verified' | 'rejected';
}

export interface SellerProperty {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  price: number;
  area: number;
  type: string;
  subType?: string;
  purpose?: string;
  governorate?: string;
  city: string;
  location: string;
  streetName?: string;
  buildingNumber?: string;
  latitude?: number;
  longitude?: number;
  bedrooms: number;
  bathrooms: number;
  floor?: string | number;
  totalFloors?: string | number;
  buildingAge?: string;
  finishing?: string;
  furnished?: string;
  amenities?: string[];
  customDetails?: Record<string, any>;
  imageUrl: string;
  images?: string[];
  documents?: PropertyLegalDocument[];
  status: SellerPropertyStatus;
  isVerified: boolean;
  viewsCount: number;
  createdAt: string;
  adminFeedback?: string; // ملاحظات المشرف القانوني إن وجدت
}

export interface SellerStatistics {
  totalProperties: number;
  publishedCount: number;
  pendingReviewCount: number;
  requiresChangesCount: number;
  totalViews: number;
  favoritesCount: number;
  inquiriesCount: number;
  appointmentsCount: number;
}

export interface SellerInquiryItem {
  id: string;
  propertyTitle: string;
  buyerName: string;
  buyerPhone: string;
  message: string;
  reply?: string;
  createdAt: string;
}

export interface SellerAppointmentItem {
  id: string;
  propertyTitle: string;
  buyerName: string;
  buyerPhone: string;
  date: string;
  timeSlot: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
}

const SELLER_STORAGE_KEY = 'sha2ety_seller_properties_store';

function getStoredSellerProperties(): SellerProperty[] {
  try {
    const raw = localStorage.getItem(SELLER_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore
  }
  return [];
}

function saveStoredSellerProperties(list: SellerProperty[]) {
  try {
    localStorage.setItem(SELLER_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Ignore
  }
}

// Map a Master PropertyItem to a SellerProperty
function mapMasterToSellerProperty(p: PropertyItem, defaultSellerId: string = 'demo-seller-1'): SellerProperty {
  let mappedStatus: SellerPropertyStatus = 'available';
  if (p.status === 'pending_review' || p.status === 'requires_changes' || p.status === 'draft' || p.status === 'sold' || p.status === 'rejected') {
    mappedStatus = p.status as SellerPropertyStatus;
  }

  return {
    id: p.id,
    sellerId: p.sellerId || defaultSellerId,
    title: p.title,
    description: p.description || '',
    price: p.price,
    area: p.area,
    type: p.type,
    city: p.city,
    location: p.location,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    floor: p.floor,
    buildingAge: p.age,
    finishing: p.finishing,
    imageUrl: p.imageUrl,
    images: p.images,
    status: mappedStatus,
    isVerified: Boolean(p.isVerified),
    viewsCount: p.viewsCount || 0,
    createdAt: p.createdAt || new Date().toISOString(),
    adminFeedback: p.adminNotes,
  };
}

// Fetch all properties belonging to seller
export async function getSellerProperties(sellerId?: string): Promise<SellerProperty[]> {
  try {
    if (sellerId && !import.meta.env.VITE_SUPABASE_URL?.includes('placeholder.supabase.co')) {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        // Fetch real uploaded documents from property_documents table in Supabase
        const propIds = data.map((d) => d.id);
        const { data: docsData } = await supabase
          .from('property_documents')
          .select('*')
          .in('property_id', propIds);

        const docsMap = new Map<string, PropertyLegalDocument[]>();
        if (docsData) {
          docsData.forEach((row: any) => {
            const list = docsMap.get(row.property_id) || [];
            list.push({
              id: row.id,
              name: row.document_name || `مستند ${row.document_type || 'رسمي'}.pdf`,
              type: row.document_type || 'deed',
              typeName:
                row.document_type === 'deed'
                  ? 'عقد ملكية مسجل'
                  : row.document_type === 'building_permit'
                  ? 'رخصة بناء ومطابقة'
                  : row.document_type === 'national_id'
                  ? 'بطاقة الرقم القومي'
                  : row.document_type === 'power_of_attorney'
                  ? 'توكيل رسمي بالشهر العقاري'
                  : 'مستند إثبات ملكية',
              url: row.document_url,
              uploadedAt: row.created_at || new Date().toISOString(),
              status: row.status || 'pending',
            });
            docsMap.set(row.property_id, list);
          });
        }

        return data.map((item) => ({
          id: item.id,
          sellerId: item.seller_id,
          title: item.title,
          description: item.description,
          price: Number(item.price),
          area: Number(item.area),
          type: item.type,
          city: item.city,
          location: item.location,
          bedrooms: item.bedrooms,
          bathrooms: item.bathrooms,
          imageUrl: item.cover_image || item.images?.[0] || '',
          status: (item.status as SellerPropertyStatus) || 'pending_review',
          isVerified: Boolean(item.is_verified),
          viewsCount: item.views_count || 0,
          createdAt: item.created_at,
          adminFeedback: item.admin_notes,
          documents: docsMap.get(item.id) || [],
        }));
      }
    }
  } catch (err) {
    console.warn('Supabase getSellerProperties fallback to local store:', err);
  }

  // Fallback to dynamic master store and local seller store
  const storedSellerProps = getStoredSellerProperties();
  const masterProps = getStoredPropertiesMaster();

  // Combine unique properties by id
  const map = new Map<string, SellerProperty>();
  
  // First add all master properties relevant to seller
  masterProps.forEach((p) => {
    if (!sellerId || !p.sellerId || p.sellerId === sellerId || p.sellerId === 'demo-seller-1') {
      map.set(p.id, mapMasterToSellerProperty(p, sellerId));
    }
  });

  // Then add/overwrite with explicit seller properties
  storedSellerProps.forEach((p) => {
    if (!sellerId || !p.sellerId || p.sellerId === sellerId) {
      map.set(p.id, p);
    }
  });

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// Fetch calculated statistics (Smart Seller Analytics)
export async function getSellerStatistics(sellerId?: string): Promise<SellerStatistics> {
  const props = await getSellerProperties(sellerId);
  const sellerPropIds = new Set(props.map((p) => p.id));

  const totalProperties = props.length;
  const publishedCount = props.filter((p) => p.status === 'available').length;
  const pendingReviewCount = props.filter((p) => p.status === 'pending_review').length;
  const requiresChangesCount = props.filter((p) => p.status === 'requires_changes').length;
  const totalViews = props.reduce((acc, curr) => acc + (curr.viewsCount || 0), 0);
  
  // Real count of seller appointments
  const allAppointments = getStoredAppointments();
  const appointmentsCount = allAppointments.filter(
    (a) => !sellerId || a.sellerId === sellerId || a.sellerId === 'demo-seller-1'
  ).length;

  // Real count of favorites for seller's properties
  let favoritesCount = 0;
  try {
    const rawFavs = localStorage.getItem('sha2ety_favorites');
    if (rawFavs) {
      const favIds: string[] = JSON.parse(rawFavs);
      favoritesCount = favIds.filter((id) => sellerPropIds.has(id)).length;
    }
  } catch {
    // Ignore
  }

  // Real count of inquiries/conversations for seller
  let inquiriesCount = 0;
  try {
    const rawConvs = localStorage.getItem('sha2ety_conversations_v2');
    if (rawConvs) {
      const convs = JSON.parse(rawConvs);
      inquiriesCount = convs.filter(
        (c: any) => !sellerId || c.sellerId === sellerId || c.sellerId === 'demo-seller-1'
      ).length;
    }
  } catch {
    // Ignore
  }

  return {
    totalProperties,
    publishedCount,
    pendingReviewCount,
    requiresChangesCount,
    totalViews,
    favoritesCount,
    inquiriesCount,
    appointmentsCount,
  };
}

// Seller action: Mark property as sold
export async function markPropertyAsSold(id: string): Promise<boolean> {
  const list = getStoredSellerProperties();
  const updated = list.map((p) => (p.id === id ? { ...p, status: 'sold' as SellerPropertyStatus } : p));
  saveStoredSellerProperties(updated);

  // Update in master catalog
  const master = getStoredPropertiesMaster();
  const target = master.find((p) => p.id === id);
  if (target) {
    saveMasterProperty({ ...target, status: 'sold' });
  }

  try {
    await supabase.from('properties').update({ status: 'sold' }).eq('id', id);
  } catch {
    // Ignore
  }
  return true;
}

// Seller action: Delete draft
export async function deletePropertyDraft(id: string): Promise<boolean> {
  const list = getStoredSellerProperties();
  const updated = list.filter((p) => p.id !== id);
  saveStoredSellerProperties(updated);

  deleteMasterProperty(id);

  try {
    await supabase.from('properties').delete().eq('id', id);
  } catch {
    // Ignore
  }
  return true;
}

// Seller action: Upload new document for an existing property to confirm ownership
export async function uploadPropertyDocumentForSeller(
  propertyId: string,
  sellerId: string,
  file: File,
  docType: PropertyLegalDocument['type'],
  typeName: string
): Promise<PropertyLegalDocument> {
  const uploadRes = await uploadPropertyDocument(file, sellerId, propertyId);

  const newDoc: PropertyLegalDocument = {
    id: `doc-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    name: file.name,
    type: docType,
    typeName,
    url: uploadRes.url,
    size: `${(file.size / (1024 * 1024)).toFixed(1)} ميجابايت`,
    status: 'pending',
    uploadedAt: new Date().toISOString(),
  };

  // 1. Insert into Supabase property_documents table
  try {
    const isUUID = (str?: string) =>
      Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

    if (isUUID(propertyId) && isUUID(sellerId)) {
      const { data, error } = await supabase
        .from('property_documents')
        .insert({
          property_id: propertyId,
          seller_id: sellerId,
          document_type: docType,
          document_url: uploadRes.url,
          status: 'pending',
        })
        .select()
        .single();

      if (!error && data?.id) {
        newDoc.id = data.id;
      }
    }
  } catch (err) {
    console.warn('Failed to insert into Supabase property_documents table:', err);
  }

  // 2. Update local seller store
  const stored = getStoredSellerProperties();
  const propIndex = stored.findIndex((p) => p.id === propertyId);
  if (propIndex !== -1) {
    const prop = stored[propIndex];
    prop.documents = [...(prop.documents || []), newDoc];
    prop.status = 'pending_review';
    stored[propIndex] = prop;
    saveStoredSellerProperties(stored);
  }

  // 3. Update master catalog & notify
  try {
    const master = getStoredPropertiesMaster();
    const mIndex = master.findIndex((p) => p.id === propertyId);
    if (mIndex !== -1) {
      master[mIndex].status = 'pending_review';
      saveMasterProperty(master[mIndex]);
    }
  } catch {}

  // 4. Notify admin of document submission for confirmation
  try {
    const adminNotifsKey = 'sha2ety_admin_notifications';
    const notifs = JSON.parse(localStorage.getItem(adminNotifsKey) || '[]');
    notifs.unshift({
      id: `notif-${Date.now()}`,
      title: 'مستند ملكية جديد لتأكيد العقار',
      message: `قام البائع برفع مستند "${newDoc.name}" (${newDoc.typeName}) لتأكيد ملكية العقار.`,
      propertyId,
      createdAt: new Date().toISOString(),
      read: false,
    });
    localStorage.setItem(adminNotifsKey, JSON.stringify(notifs));
  } catch {}

  return newDoc;
}

// Seller action: Resubmit corrected property with optional new documents
export async function resubmitProperty(
  id: string,
  correctedNotes?: string,
  newDocuments?: PropertyLegalDocument[]
): Promise<boolean> {
  const list = getStoredSellerProperties();
  const updated = list.map((p) =>
    p.id === id
      ? {
          ...p,
          status: 'pending_review' as SellerPropertyStatus,
          adminFeedback: undefined,
          documents:
            newDocuments && newDocuments.length > 0
              ? [...(p.documents || []), ...newDocuments]
              : p.documents,
          description: correctedNotes ? `${p.description}\n\n[تم التعديل]: ${correctedNotes}` : p.description,
        }
      : p
  );
  saveStoredSellerProperties(updated);

  // Update in master store
  const master = getStoredPropertiesMaster();
  const target = master.find((p) => p.id === id);
  if (target) {
    saveMasterProperty({
      ...target,
      status: 'pending_review',
      adminNotes: undefined,
      description: correctedNotes ? `${target.description}\n\n[تم التعديل]: ${correctedNotes}` : target.description,
    });
  }

  try {
    await supabase.from('properties').update({ status: 'pending_review' }).eq('id', id);

    // Notify seller and admin
    addNotification({
      userId: 'seller',
      category: 'properties',
      categoryLabel: 'العقارات',
      title: 'تمت إعادة تقديم العقار للمراجعة',
      message: `تم إرسال التعديلات والمستندات المطلوبة للعقار "${target?.title || id}" بنجاح وجاري فحصها من قبل الإدارة.`,
      actionUrl: '/seller/properties',
      actionLabel: 'متابعة الحالة',
    });

    addNotification({
      userId: 'admin',
      category: 'properties',
      categoryLabel: 'العقارات',
      title: 'إعادة تقديم عقار بعد استيفاء التعديلات',
      message: `قام البائع بإعادة تقديم العقار "${target?.title || id}" بعد استيفاء الأوراق والملاحظات المطلوبة.`,
      actionUrl: '/admin/reviews',
      actionLabel: 'مراجعة الأوراق',
    });

    sbCreateNotification({
      user_id: 'seller',
      title: 'تمت إعادة تقديم العقار للمراجعة',
      message: `تم إرسال التعديلات والمستندات المطلوبة للعقار بنجاح وجاري فحصها من قبل الإدارة.`,
      type: 'properties',
      related_id: id,
    }).catch(() => {});
  } catch {
    // Ignore
  }
  return true;
}

// Seller action: Quick edit property details
export async function updatePropertyDetails(
  id: string,
  updates: Partial<Pick<SellerProperty, 'title' | 'price' | 'description'>>
): Promise<boolean> {
  const list = getStoredSellerProperties();
  const updated = list.map((p) => (p.id === id ? { ...p, ...updates } : p));
  saveStoredSellerProperties(updated);

  // Update in master store
  const master = getStoredPropertiesMaster();
  const target = master.find((p) => p.id === id);
  if (target) {
    saveMasterProperty({
      ...target,
      ...updates,
    });
  }

  try {
    await supabase.from('properties').update(updates).eq('id', id);
  } catch {
    // Ignore
  }
  return true;
}

// Add new property by seller (supports draft and pending_review)
export async function addSellerProperty(
  propertyData: Omit<SellerProperty, 'id' | 'createdAt' | 'viewsCount' | 'isVerified'>
): Promise<SellerProperty> {
  const isUUID = (str?: string): boolean =>
    Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

  const generatedId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `prop-${Date.now()}`;

  const newProp: SellerProperty = {
    ...propertyData,
    id: generatedId,
    status: propertyData.status || 'pending_review',
    isVerified: false,
    viewsCount: 0,
    createdAt: new Date().toISOString(),
  };

  const list = getStoredSellerProperties();
  saveStoredSellerProperties([newProp, ...list]);

  // Synchronize to master store so admin review queue and public marketplace see it
  saveMasterProperty({
    id: newProp.id,
    title: newProp.title,
    description: newProp.description,
    price: newProp.price,
    area: newProp.area,
    type: newProp.type,
    city: newProp.city,
    location: newProp.location,
    bedrooms: newProp.bedrooms,
    bathrooms: newProp.bathrooms,
    floor: newProp.floor ? String(newProp.floor) : undefined,
    age: newProp.buildingAge,
    finishing: newProp.finishing,
    imageUrl: newProp.imageUrl,
    images: newProp.images,
    status: newProp.status,
    isVerified: false,
    viewsCount: 0,
    createdAt: newProp.createdAt,
    sellerId: newProp.sellerId,
  });

  // Record admin and seller notifications if submitted for review
  if (newProp.status === 'pending_review') {
    try {
      addNotification({
        userId: newProp.sellerId || 'seller',
        category: 'properties',
        categoryLabel: 'العقارات',
        title: 'تم استلام عقارك بنجاح',
        message: `تم إدراج عقارك الجديد "${newProp.title}" في طابور المراجعة القانونية وجاري تدقيق مستندات الملكية.`,
        actionUrl: '/seller/properties',
        actionLabel: 'متابعة حالة العقار',
      });

      addNotification({
        userId: 'admin',
        category: 'properties',
        categoryLabel: 'العقارات',
        title: 'عقار جديد بحاجة للمراجعة القانونية',
        message: `تم إضافة عقار جديد "${newProp.title}" في ${newProp.city} ومرفق به مستندات الملكية بانتظار الفحص.`,
        actionUrl: '/admin/reviews',
        actionLabel: 'فحص العقار والمستندات',
      });

      if (isUUID(newProp.sellerId)) {
        sbCreateNotification({
          user_id: newProp.sellerId,
          title: 'تم استلام عقارك بنجاح',
          message: `تم إدراج عقارك الجديد "${newProp.title}" في طابور المراجعة القانونية وجاري تدقيق مستندات الملكية.`,
          type: 'properties',
          related_id: newProp.id,
        }).catch(() => {});
      }

      const adminNotifsKey = 'sha2ety_admin_notifications';
      const existingNotifs = JSON.parse(localStorage.getItem(adminNotifsKey) || '[]');
      existingNotifs.unshift({
        id: `notif-${Date.now()}`,
        title: 'عقار جديد بحاجة للمراجعة القانونية',
        message: `تم إضافة عقار جديد "${newProp.title}" في ${newProp.city} ومرفق به مستندات الملكية بانتظار الفحص.`,
        propertyId: newProp.id,
        createdAt: new Date().toISOString(),
        read: false,
      });
      localStorage.setItem(adminNotifsKey, JSON.stringify(existingNotifs));
    } catch {
      // Ignore
    }
  }

  try {
    if (isUUID(newProp.sellerId)) {
      const propPayload: Record<string, any> = {
        id: newProp.id,
        seller_id: newProp.sellerId,
        title: newProp.title,
        description: newProp.description || '',
        price: Number(newProp.price),
        area: Number(newProp.area),
        type: newProp.type,
        city: newProp.city,
        location: newProp.location,
        address: newProp.streetName || newProp.location,
        bedrooms: Number(newProp.bedrooms) || 0,
        bathrooms: Number(newProp.bathrooms) || 0,
        floor_number: newProp.floor ? parseInt(String(newProp.floor), 10) || null : null,
        total_floors: newProp.totalFloors ? parseInt(String(newProp.totalFloors), 10) || null : null,
        finishing: newProp.finishing || null,
        status: newProp.status || 'pending_review',
        is_verified: false,
        cover_image: newProp.imageUrl,
        images: newProp.images || [newProp.imageUrl],
        features: newProp.amenities || [],
      };

      const { error: insertPropErr } = await supabase.from('properties').insert(propPayload);
      if (insertPropErr) {
        console.warn('Supabase property insert error:', insertPropErr);
      }
    }

    // Insert property documents into property_documents table if present
    if (newProp.documents && newProp.documents.length > 0 && isUUID(newProp.sellerId)) {
      const docRows = newProp.documents.map((d) => ({
        property_id: newProp.id,
        seller_id: newProp.sellerId,
        document_type: d.type,
        document_url: d.url,
        status: 'pending',
      }));
      const { error: docErr } = await supabase.from('property_documents').insert(docRows);
      if (docErr) {
        console.warn('Supabase property_documents insert error:', docErr);
      }
    }
  } catch (dbErr) {
    console.warn('Supabase property insert error, preserved locally:', dbErr);
  }

  return newProp;
}
