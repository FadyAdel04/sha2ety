import React, { useState, useEffect } from 'react';
import { cn, formatEGP, formatArea } from '@/lib/utils';
import { Badge } from './Badge';
import { Button } from './Button';
import { Heart, MapPin, BedDouble, Bath, Maximize2, ShieldCheck, Scale } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  isInComparison,
  addToComparison,
  removeFromComparison,
  COMPARISON_CHANGE_EVENT,
} from '@/services/comparisonService';

export interface PropertyItem {
  id: string;
  title: string;
  description?: string;
  price: number;
  location: string; // الحي أو الكمبوند
  city: string; // المدينة
  governorate?: string; // المحافظة
  district?: string; // المنطقة
  type: string; // شقة, فيلا, منزل, دوبلكس, شاليه, تجاري, أرض
  bedrooms: number;
  bathrooms: number;
  area: number; // in m²
  imageUrl: string;
  images?: string[]; // معرض الصور
  isVerified?: boolean;
  isFeatured?: boolean;
  isNegotiable?: boolean; // قابلية التفاوض
  status?: 'available' | 'pending' | 'pending_review' | 'requires_changes' | 'rejected' | 'reserved' | 'sold' | 'draft';
  viewsCount?: number;
  sellerPhone?: string;
  adminNotes?: string;
  finishing?: 'ultra_super_lux' | 'super_lux' | 'semi_finished' | 'core_shell' | string;
  furnishing?: string; // غير مفروش، مفروش بالكامل
  floor?: 'ground' | 'typical' | 'last_roof' | string;
  floorNumber?: number;
  totalFloors?: number;
  age?: string; // عمر العقار
  hasElevator?: boolean;
  hasGarage?: boolean;
  hasBalcony?: boolean;
  hasGarden?: boolean;
  hasSecurity?: boolean;
  hasAirConditioning?: boolean;
  hasNaturalGas?: boolean;
  sellerId?: string;
  sellerName?: string;
  sellerAvatar?: string;
  sellerJoinedDate?: string;
  lat?: number;
  lng?: number;
  createdAt?: string;
}

export interface PropertyCardProps {
  property: PropertyItem;
  className?: string;
  onFavoriteToggle?: (id: string, isFav: boolean) => void;
  isFavoriteInitial?: boolean;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  className,
  onFavoriteToggle,
  isFavoriteInitial = false,
}) => {
  const [isFavorite, setIsFavorite] = useState(isFavoriteInitial);
  const [compared, setCompared] = useState(() => isInComparison(property.id));

  useEffect(() => {
    const handleCompareUpdate = () => {
      setCompared(isInComparison(property.id));
    };
    window.addEventListener(COMPARISON_CHANGE_EVENT, handleCompareUpdate);
    return () => window.removeEventListener(COMPARISON_CHANGE_EVENT, handleCompareUpdate);
  }, [property.id]);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !isFavorite;
    setIsFavorite(next);
    onFavoriteToggle?.(property.id, next);
  };

  const handleCompareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (compared) {
      removeFromComparison(property.id);
    } else {
      addToComparison(property);
    }
  };

  const pricePerSqm =
    property.area && property.area > 0 ? Math.round(property.price / property.area) : null;

  const getStatusBadge = () => {
    switch (property.status) {
      case 'pending':
        return <Badge variant="warm">قيد المراجعة</Badge>;
      case 'reserved':
        return <Badge variant="secondary">تم الحجز</Badge>;
      case 'sold':
        return <Badge variant="muted">تم البيع</Badge>;
      case 'available':
      default:
        return <Badge variant="fresh">متاح للبيع</Badge>;
    }
  };

  return (
    <article
      className={cn(
        'group relative bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] overflow-hidden shadow-hard flex flex-col transition-all duration-[180ms] hover:-translate-x-0.5 hover:-translate-y-1 hover:shadow-hard-lg',
        className
      )}
    >
      {/* Property Image Container */}
      <div className="relative aspect-4/3 w-full overflow-hidden border-b-[3px] border-[var(--dp-color-outline)] bg-[#f3f1e8]">
        <img
          src={property.imageUrl}
          alt={property.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Top Badges */}
        <div className="absolute top-3 right-3 flex items-center gap-2 flex-wrap">
          {getStatusBadge()}
          {property.isVerified && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-black bg-[var(--dp-color-accent-warm)] text-[var(--dp-color-ink)] border-[2px] border-[var(--dp-color-outline)] rounded-full shadow-hard-sm">
              <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
              موثق
            </span>
          )}
        </div>

        {/* Top Left Buttons: Favorite & Compare */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          {/* Favorite Button */}
          <button
            type="button"
            onClick={handleFavoriteClick}
            className={cn(
              'w-9 h-9 rounded-xl border-[2px] border-[var(--dp-color-outline)] flex items-center justify-center transition-all cursor-pointer shadow-hard-sm',
              isFavorite
                ? 'bg-rose-500 text-white'
                : 'bg-white/90 hover:bg-white text-[var(--dp-color-ink)]'
            )}
            aria-label={isFavorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
            title={isFavorite ? 'في مفضلتك' : 'إضافة للمفضلة'}
          >
            <Heart className={cn('w-4 h-4 stroke-[2.5]', isFavorite && 'fill-white')} />
          </button>

          {/* Compare Button */}
          <button
            type="button"
            onClick={handleCompareClick}
            className={cn(
              'w-9 h-9 rounded-xl border-[2px] border-[var(--dp-color-outline)] flex items-center justify-center transition-all cursor-pointer shadow-hard-sm',
              compared
                ? 'bg-[var(--dp-color-accent)] text-white'
                : 'bg-white/90 hover:bg-white text-[var(--dp-color-ink)]'
            )}
            aria-label={compared ? 'إزالة من المقارنة' : 'إضافة للمقارنة'}
            title={compared ? 'محدد للمقارنة' : 'أضف للمقارنة (حتى 3 عقارات)'}
          >
            <Scale className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Property Type Ribbon */}
        <div className="absolute bottom-3 right-3 bg-[var(--dp-color-panel)] border-[2px] border-[var(--dp-color-outline)] px-2.5 py-0.5 rounded-lg text-xs font-black text-[var(--dp-color-ink)] shadow-hard-sm">
          {property.type}
        </div>
      </div>

      {/* Property Content */}
      <div className="p-5 flex-1 flex flex-col justify-between text-right">
        <div>
          {/* Price & Price Per Sqm */}
          <div className="mb-2 flex items-baseline justify-between gap-2 flex-wrap">
            <span className="text-xl sm:text-2xl font-black text-[var(--dp-color-accent)] block">
              {formatEGP(property.price)}
            </span>
            {pricePerSqm && (
              <span className="text-xs font-bold text-[#626d84] bg-[var(--dp-color-ground)] px-2 py-0.5 rounded-md border border-[#e2dcc8]">
                {formatEGP(pricePerSqm)} / م²
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-base sm:text-lg font-bold text-[var(--dp-color-ink)] line-clamp-1 mb-2 hover:text-[var(--dp-color-accent)] transition-colors">
            <Link to={`/properties/${property.id}`}>{property.title}</Link>
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-xs text-[#626d84] mb-4">
            <MapPin className="w-4 h-4 shrink-0 text-[var(--dp-color-accent-secondary)]" />
            <span className="truncate">{property.location}، {property.city}</span>
          </div>

          {/* Key Specs Pill Strip */}
          <div className="grid grid-cols-3 gap-2 py-3 border-y-[2px] border-[#ece9db] mb-4 text-xs font-bold text-[var(--dp-color-ink)]">
            <div className="flex items-center justify-center gap-1.5 bg-[var(--dp-color-ground)] py-1.5 px-2 rounded-lg border border-[var(--dp-color-outline)]">
              <BedDouble className="w-4 h-4 text-[var(--dp-color-accent)] shrink-0" />
              <span>{property.bedrooms > 0 ? `${property.bedrooms} غرف` : 'أرض فضاء'}</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 bg-[var(--dp-color-ground)] py-1.5 px-2 rounded-lg border border-[var(--dp-color-outline)]">
              <Bath className="w-4 h-4 text-[var(--dp-color-accent)] shrink-0" />
              <span>{property.bathrooms > 0 ? `${property.bathrooms} حمام` : '-'}</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 bg-[var(--dp-color-ground)] py-1.5 px-2 rounded-lg border border-[var(--dp-color-outline)]">
              <Maximize2 className="w-4 h-4 text-[var(--dp-color-accent)] shrink-0" />
              <span>{formatArea(property.area)}</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-1">
          <Link to={`/properties/${property.id}`} className="block w-full">
            <Button variant="outline" size="sm" className="w-full justify-center">
              عرض التفاصيل وحجز معاينة
            </Button>
          </Link>
        </div>
      </div>
    </article>
  );
};
