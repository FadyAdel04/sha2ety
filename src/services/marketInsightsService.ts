import { supabase } from '@/lib/supabase';
import { getStoredPropertiesMaster, PropertyItem } from '@/services/propertyService';

export interface MarketInsights {
  sampleSize: number;
  averagePrice: number;
  averagePricePerSqm: number;
  minPrice: number;
  maxPrice: number;
  city?: string;
  propertyType?: string;
  disclaimer: string;
}

export const MARKET_INSIGHTS_DISCLAIMER =
  'هذه المؤشرات محسوبة حصرياً من واقع إعلانات منصة شقتي المتاحة ولا تمثل السوق العقاري العام.';

export async function fetchMarketInsights(
  city?: string,
  propertyType?: string
): Promise<MarketInsights> {
  try {
    // Try Supabase RPC first if online
    if (!import.meta.env.VITE_SUPABASE_URL?.includes('placeholder.supabase.co')) {
      const { data, error } = await supabase.rpc('get_market_insights', {
        p_city: city && city !== 'all' ? city : null,
        p_property_type: propertyType && propertyType !== 'all' ? propertyType : null,
      });

      if (!error && data && data.length > 0) {
        const row = data[0];
        return {
          sampleSize: Number(row.sample_size) || 0,
          averagePrice: Number(row.average_price) || 0,
          averagePricePerSqm: Number(row.average_price_per_sqm) || 0,
          minPrice: Number(row.min_price) || 0,
          maxPrice: Number(row.max_price) || 0,
          city,
          propertyType,
          disclaimer: MARKET_INSIGHTS_DISCLAIMER,
        };
      }
    }
  } catch (err) {
    console.warn('Supabase market insights RPC fallback to local calculation:', err);
  }

  // Fallback: Compute dynamically from master properties store
  const allProperties = getStoredPropertiesMaster();
  const eligible = allProperties.filter((p) => {
    const isPublished = p.status === 'available' || (p.status as string) === 'published' || p.status === undefined;
    const matchCity = !city || city === 'all' || p.city === city;
    const matchType = !propertyType || propertyType === 'all' || p.type === propertyType;
    return isPublished && matchCity && matchType;
  });

  const sampleSize = eligible.length;
  if (sampleSize === 0) {
    return {
      sampleSize: 0,
      averagePrice: 0,
      averagePricePerSqm: 0,
      minPrice: 0,
      maxPrice: 0,
      city,
      propertyType,
      disclaimer: MARKET_INSIGHTS_DISCLAIMER,
    };
  }

  const prices = eligible.map((p) => p.price);
  const totalPrices = prices.reduce((a, b) => a + b, 0);
  const averagePrice = Math.round(totalPrices / sampleSize);

  const pricePerSqms = eligible
    .filter((p) => p.area && p.area > 0)
    .map((p) => p.price / p.area);

  const averagePricePerSqm =
    pricePerSqms.length > 0
      ? Math.round(pricePerSqms.reduce((a, b) => a + b, 0) / pricePerSqms.length)
      : 0;

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  return {
    sampleSize,
    averagePrice,
    averagePricePerSqm,
    minPrice,
    maxPrice,
    city,
    propertyType,
    disclaimer: MARKET_INSIGHTS_DISCLAIMER,
  };
}
