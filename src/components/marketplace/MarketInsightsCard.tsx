import React, { useState, useEffect } from 'react';
import { fetchMarketInsights, MarketInsights } from '@/services/marketInsightsService';
import { formatEGP } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  TrendingUp,
  BarChart3,
  Layers,
  Info,
  Building,
  Sparkles,
  ArrowUpDown,
} from 'lucide-react';

interface MarketInsightsCardProps {
  city?: string;
  propertyType?: string;
  className?: string;
}

export const MarketInsightsCard: React.FC<MarketInsightsCardProps> = ({
  city,
  propertyType,
  className = '',
}) => {
  const [insights, setInsights] = useState<MarketInsights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetchMarketInsights(city, propertyType)
      .then((data) => {
        if (isMounted) {
          setInsights(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load market insights:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [city, propertyType]);

  if (loading) {
    return (
      <div className={`bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-2xl p-5 shadow-hard space-y-3 ${className}`}>
        <Skeleton className="w-48 h-6 rounded-lg" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!insights || insights.sampleSize === 0) {
    return null; // Don't display card if 0 listings match the filters
  }

  return (
    <div
      className={`bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-2xl p-5 sm:p-6 shadow-hard text-right space-y-4 ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-[#ece9db]">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[var(--dp-color-accent-fresh)] border-2 border-[var(--dp-color-outline)] flex items-center justify-center text-emerald-950 shadow-hard-sm">
            <TrendingUp className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-base font-black text-[var(--dp-color-ink)] flex items-center gap-2">
              <span>مؤشرات أسعار المنصة</span>
              {city && city !== 'all' && (
                <Badge variant="primary" size="sm">
                  {city}
                </Badge>
              )}
            </h3>
            <span className="text-xs text-[#626d84] font-medium block">
              تحليل فوري من واقع العقارات المتاحة حالياً على شقتي
            </span>
          </div>
        </div>

        {/* Sample size badge */}
        <div className="self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[var(--dp-color-accent-warm)] border-[2px] border-[var(--dp-color-outline)] shadow-hard-sm">
            <span>حجم العينة:</span>
            <span className="text-[var(--dp-color-accent)]">{insights.sampleSize}</span>
            <span>عقار معروض</span>
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Average Price */}
        <div className="bg-white border-2 border-[var(--dp-color-outline)] rounded-xl p-3.5 shadow-hard-sm space-y-1">
          <span className="text-[11px] font-bold text-[#626d84] block">متوسط السعر المطلوب</span>
          <span className="text-base sm:text-lg font-black text-[var(--dp-color-accent)] block">
            {formatEGP(insights.averagePrice)}
          </span>
        </div>

        {/* 2. Price per Sqm */}
        <div className="bg-white border-2 border-[var(--dp-color-outline)] rounded-xl p-3.5 shadow-hard-sm space-y-1">
          <span className="text-[11px] font-bold text-[#626d84] block">متوسط سعر المتر المربع</span>
          <span className="text-base sm:text-lg font-black text-[var(--dp-color-ink)] block">
            {formatEGP(insights.averagePricePerSqm)}
            <span className="text-xs text-[#626d84] font-bold mr-1">/ م²</span>
          </span>
        </div>

        {/* 3. Min Price */}
        <div className="bg-white border-2 border-[var(--dp-color-outline)] rounded-xl p-3.5 shadow-hard-sm space-y-1">
          <span className="text-[11px] font-bold text-[#626d84] block">أقل سعر معروض</span>
          <span className="text-sm sm:text-base font-black text-emerald-700 block">
            {formatEGP(insights.minPrice)}
          </span>
        </div>

        {/* 4. Max Price */}
        <div className="bg-white border-2 border-[var(--dp-color-outline)] rounded-xl p-3.5 shadow-hard-sm space-y-1">
          <span className="text-[11px] font-bold text-[#626d84] block">أعلى سعر معروض</span>
          <span className="text-sm sm:text-base font-black text-[var(--dp-color-ink)] block">
            {formatEGP(insights.maxPrice)}
          </span>
        </div>
      </div>

      {/* Mandatory Disclaimer */}
      <div className="flex items-start gap-2 p-3 bg-[#fbfaf6] border border-[#e2dcc8] rounded-xl text-xs text-[#626d84] font-medium leading-relaxed">
        <Info className="w-4 h-4 text-[var(--dp-color-accent)] shrink-0 mt-0.5" />
        <p className="text-[11px]">{insights.disclaimer}</p>
      </div>
    </div>
  );
};

