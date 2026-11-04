import { supabase } from '@/lib/supabase';
import { PropertyItem } from '@/components/ui/PropertyCard';
export type { PropertyItem };

export interface PropertyFilterParams {
  governorate?: string;
  city?: string;
  district?: string;
  type?: string;
  minPrice?: number | null;
  maxPrice?: number | null;
  minArea?: number | null;
  maxArea?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  floor?: string;
  finishing?: string;
  hasElevator?: boolean;
  hasGarage?: boolean;
  hasBalcony?: boolean;
  verifiedOnly?: boolean;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'area_desc';
  page?: number;
  pageSize?: number;
}

export interface PropertyQueryResult {
  properties: PropertyItem[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

const MASTER_PROPERTIES_KEY = 'sha2ety_properties_master';

// Get master properties from dynamic persistent storage
export function getStoredPropertiesMaster(): PropertyItem[] {
  try {
    const raw = localStorage.getItem(MASTER_PROPERTIES_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading master properties:', err);
  }
  return [];
}

// Save master properties to dynamic persistent storage
export function saveStoredPropertiesMaster(list: PropertyItem[]): void {
  try {
    localStorage.setItem(MASTER_PROPERTIES_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Error saving master properties:', err);
  }
}

// Map database row to client PropertyItem
export function mapDbRowToProperty(item: any): PropertyItem {
  return {
    id: item.id,
    title: item.title,
    price: Number(item.price),
    location: item.location || '',
    city: item.city || '',
    governorate: item.city || '',
    district: item.district || item.location || '',
    type: item.type || 'شقة',
    bedrooms: item.bedrooms || 0,
    bathrooms: item.bathrooms || 0,
    area: Number(item.area),
    imageUrl:
      item.cover_image ||
      (item.images && item.images[0]) ||
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    images: item.images && item.images.length > 0 ? item.images : undefined,
    description: item.description,
    isVerified: Boolean(item.is_verified),
    isFeatured: Boolean(item.is_featured),
    status: item.status || 'available',
    finishing: item.finishing,
    floor: item.floor_number === 0 || item.floor_number === '0' ? 'ground' : 'typical',
    hasElevator: item.features ? item.features.includes('مصعد') : false,
    hasGarage: item.features ? item.features.includes('جراج') : false,
    hasBalcony: item.features ? item.features.includes('شرفة') : false,
    createdAt: item.created_at || new Date().toISOString(),
  };
}

// -----------------------------------------------------------------
// Fetch Published Properties Dynamically (Marketplace & Search)
// -----------------------------------------------------------------
export async function fetchPublishedProperties(
  params: PropertyFilterParams = {}
): Promise<PropertyQueryResult> {
  const {
    governorate,
    city,
    district,
    type,
    minPrice,
    maxPrice,
    minArea,
    maxArea,
    bedrooms,
    bathrooms,
    floor,
    finishing,
    hasElevator,
    hasGarage,
    hasBalcony,
    verifiedOnly,
    sort = 'newest',
    page = 1,
    pageSize = 6,
  } = params;

  let supabaseData: any[] | null = null;
  let supabaseCount: number | null = null;

  // 1. Try querying Supabase real database
  try {
    let query = supabase
      .from('properties')
      .select('*', { count: 'exact' })
      .in('status', ['available', 'published']);

    if (governorate && governorate !== 'all') {
      query = query.ilike('city', `%${governorate}%`);
    }
    if (city && city !== 'all') {
      query = query.ilike('city', `%${city}%`);
    }
    if (district && district.trim()) {
      query = query.or(`location.ilike.%${district}%,title.ilike.%${district}%`);
    }
    if (type && type !== 'all') {
      query = query.eq('type', type);
    }
    if (minPrice) {
      query = query.gte('price', minPrice);
    }
    if (maxPrice) {
      query = query.lte('price', maxPrice);
    }
    if (minArea) {
      query = query.gte('area', minArea);
    }
    if (maxArea) {
      query = query.lte('area', maxArea);
    }
    if (bedrooms !== undefined && bedrooms !== null) {
      if (bedrooms >= 5) {
        query = query.gte('bedrooms', 5);
      } else {
        query = query.eq('bedrooms', bedrooms);
      }
    }
    if (bathrooms !== undefined && bathrooms !== null) {
      if (bathrooms >= 4) {
        query = query.gte('bathrooms', 4);
      } else {
        query = query.eq('bathrooms', bathrooms);
      }
    }
    if (finishing && finishing !== 'all') {
      query = query.eq('finishing', finishing);
    }
    if (verifiedOnly) {
      query = query.eq('is_verified', true);
    }

    // Sorting
    switch (sort) {
      case 'price_asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false });
        break;
      case 'area_desc':
        query = query.order('area', { ascending: false });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (!error && data) {
      supabaseData = data;
      supabaseCount = count;
    }
  } catch (err) {
    console.warn('Supabase properties query error:', err);
  }

  // If real Supabase data was found
  if (supabaseData !== null && supabaseCount !== null) {
    const formatted: PropertyItem[] = supabaseData.map(mapDbRowToProperty);

    // Sync to local master store
    const local = getStoredPropertiesMaster();
    const merged = [...formatted];
    local.forEach((loc) => {
      if (!merged.some((m) => m.id === loc.id)) {
        merged.push(loc);
      }
    });
    saveStoredPropertiesMaster(merged);

    return {
      properties: formatted,
      totalCount: supabaseCount,
      currentPage: page,
      totalPages: Math.ceil(supabaseCount / pageSize) || 1,
    };
  }

  // 2. Fallback to dynamic master store (created/edited properties)
  const master = getStoredPropertiesMaster();
  let filtered = master.filter((p) => p.status === 'available' || (p as any).reviewStatus === 'published');

  if (governorate && governorate !== 'all') {
    filtered = filtered.filter(
      (p) =>
        (p.governorate && p.governorate.includes(governorate)) ||
        p.city.includes(governorate) ||
        p.location.includes(governorate)
    );
  }

  if (city && city !== 'all') {
    filtered = filtered.filter(
      (p) =>
        p.city.includes(city) ||
        (p.district && p.district.includes(city)) ||
        p.location.includes(city)
    );
  }

  if (district && district.trim()) {
    const queryTerm = district.trim().toLowerCase();
    filtered = filtered.filter(
      (p) =>
        (p.district && p.district.toLowerCase().includes(queryTerm)) ||
        p.location.toLowerCase().includes(queryTerm) ||
        p.title.toLowerCase().includes(queryTerm)
    );
  }

  if (type && type !== 'all') {
    filtered = filtered.filter((p) => p.type === type || p.type.includes(type));
  }

  if (minPrice) {
    filtered = filtered.filter((p) => p.price >= minPrice);
  }

  if (maxPrice) {
    filtered = filtered.filter((p) => p.price <= maxPrice);
  }

  if (minArea) {
    filtered = filtered.filter((p) => p.area >= minArea);
  }

  if (maxArea) {
    filtered = filtered.filter((p) => p.area <= maxArea);
  }

  if (bedrooms !== null && bedrooms !== undefined) {
    filtered = filtered.filter((p) => (bedrooms >= 5 ? p.bedrooms >= 5 : p.bedrooms === bedrooms));
  }

  if (bathrooms !== null && bathrooms !== undefined) {
    filtered = filtered.filter((p) =>
      bathrooms >= 4 ? p.bathrooms >= 4 : p.bathrooms === bathrooms
    );
  }

  if (floor && floor !== 'all') {
    filtered = filtered.filter((p) => p.floor === floor);
  }

  if (finishing && finishing !== 'all') {
    filtered = filtered.filter((p) => p.finishing === finishing);
  }

  if (hasElevator) {
    filtered = filtered.filter((p) => p.hasElevator);
  }

  if (hasGarage) {
    filtered = filtered.filter((p) => p.hasGarage);
  }

  if (hasBalcony) {
    filtered = filtered.filter((p) => p.hasBalcony);
  }

  if (verifiedOnly) {
    filtered = filtered.filter((p) => p.isVerified);
  }

  // Sorting
  switch (sort) {
    case 'price_asc':
      filtered.sort((a, b) => a.price - b.price);
      break;
    case 'price_desc':
      filtered.sort((a, b) => b.price - a.price);
      break;
    case 'area_desc':
      filtered.sort((a, b) => b.area - a.area);
      break;
    case 'newest':
    default:
      filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      break;
  }

  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startIndex = (page - 1) * pageSize;
  const paginatedProperties = filtered.slice(startIndex, startIndex + pageSize);

  return {
    properties: paginatedProperties,
    totalCount,
    currentPage: page,
    totalPages,
  };
}

// -----------------------------------------------------------------
// Fetch Single Property Dynamically by ID
// -----------------------------------------------------------------
export async function getPropertyById(id: string): Promise<PropertyItem | null> {
  if (!id) return null;

  // 1. Try Supabase
  try {
    const { data, error } = await supabase.from('properties').select('*').eq('id', id).single();
    if (!error && data) {
      return mapDbRowToProperty(data);
    }
  } catch (err) {
    console.warn('Supabase fetch property by ID error:', err);
  }

  // 2. Check local master store
  const master = getStoredPropertiesMaster();
  const found = master.find((p) => p.id === id);
  if (found) return found;

  return null;
}

// -----------------------------------------------------------------
// Save or Update Dynamic Property
// -----------------------------------------------------------------
export async function saveMasterProperty(property: PropertyItem): Promise<boolean> {
  const master = getStoredPropertiesMaster();
  const index = master.findIndex((p) => p.id === property.id);

  if (index >= 0) {
    master[index] = { ...master[index], ...property };
  } else {
    master.unshift(property);
  }

  saveStoredPropertiesMaster(master);

  // Sync with Supabase
  try {
    await supabase.from('properties').upsert({
      id: property.id,
      title: property.title,
      price: property.price,
      area: property.area,
      type: property.type,
      city: property.city,
      location: property.location,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      cover_image: property.imageUrl,
      is_verified: property.isVerified,
      status: property.status || 'available',
      description: property.description || '',
    });
  } catch {
    // Local store succeeded
  }

  return true;
}

// -----------------------------------------------------------------
// Delete Dynamic Property
// -----------------------------------------------------------------
export async function deleteMasterProperty(id: string): Promise<boolean> {
  const master = getStoredPropertiesMaster();
  const filtered = master.filter((p) => p.id !== id);
  saveStoredPropertiesMaster(filtered);

  try {
    await supabase.from('properties').delete().eq('id', id);
  } catch {
    // Ignore
  }

  return true;
}
