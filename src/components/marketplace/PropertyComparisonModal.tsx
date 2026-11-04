import React from 'react';
import { PropertyItem } from '@/components/ui/PropertyCard';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatEGP, formatArea } from '@/lib/utils';
import {
  X,
  CheckCircle2,
  XCircle,
  Building2,
  BedDouble,
  Bath,
  Maximize2,
  MapPin,
  ShieldCheck,
  Trash2,
  ExternalLink,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface PropertyComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: PropertyItem[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

export const PropertyComparisonModal: React.FC<PropertyComparisonModalProps> = ({
  isOpen,
  onClose,
  properties,
  onRemove,
  onClear,
}) => {
  if (!isOpen) return null;

  // Find lowest price and lowest price/sqm for highlighting
  const minPrice = Math.min(...properties.map((p) => p.price));
  const minPricePerSqm = Math.min(
    ...properties.map((p) => Math.round(p.price / (p.area || 1)))
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" title="مقارنة العقارات المباشرة">
      <div className="text-right space-y-6">
        {/* Header Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-[#ece9db]">
          <div>
            <span className="text-xs font-bold text-[#626d84] block">
              مقارنة تفصيلية للمواصفات والأسعار
            </span>
            <span className="text-sm font-black text-[var(--dp-color-ink)]">
              تم تحديد ({properties.length} من أصل 3 عقارات)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClear}
              leftIcon={<Trash2 className="w-4 h-4 text-rose-600" />}
            >
              إفراغ المقارنة
            </Button>
          </div>
        </div>

        {properties.length === 0 ? (
          <div className="p-8 text-center bg-[#fbfaf6] border-2 border-dashed border-[#d1cbb8] rounded-2xl">
            <Building2 className="w-12 h-12 text-[#9aa4b2] mx-auto mb-3" />
            <h4 className="text-base font-black text-[var(--dp-color-ink)]">
              لا توجد عقارات في قائمة المقارنة
            </h4>
            <p className="text-xs text-[#626d84] mt-1">
              اختر ما يصل إلى 3 عقارات من بطاقات العقارات لمقارنتها جنباً إلى جنب.
            </p>
          </div>
        ) : (
          /* Comparison Table */
          <div className="overflow-x-auto pb-4">
            <table className="w-full text-right border-collapse min-w-[650px]">
              <thead>
                <tr className="border-b-2 border-[var(--dp-color-outline)]">
                  <th className="p-3 bg-[var(--dp-color-ground)] font-black text-sm text-[var(--dp-color-ink)] w-36">
                    الخاصية
                  </th>
                  {properties.map((prop) => (
                    <th key={prop.id} className="p-3 bg-white w-64 align-top">
                      <div className="relative group space-y-2">
                        <button
                          type="button"
                          onClick={() => onRemove(prop.id)}
                          className="absolute -top-1 -left-1 p-1 rounded-full bg-rose-500 text-white hover:bg-rose-600 transition-colors shadow-hard-sm"
                          title="إزالة من المقارنة"
                          aria-label={`إزالة ${prop.title} من المقارنة`}
                        >
                          <X className="w-3.5 h-3.5 stroke-[3]" />
                        </button>

                        <img
                          src={prop.imageUrl}
                          alt={prop.title}
                          className="w-full h-32 object-cover rounded-xl border-2 border-[var(--dp-color-outline)]"
                        />

                        <h4 className="text-xs font-black text-[var(--dp-color-ink)] line-clamp-2 leading-snug">
                          {prop.title}
                        </h4>

                        <Link to={`/properties/${prop.id}`} target="_blank">
                          <Button variant="outline" size="sm" className="w-full text-[11px] py-1">
                            فتح التفاصيل
                            <ExternalLink className="w-3 h-3 mr-1" />
                          </Button>
                        </Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-[#ece9db] text-xs font-bold text-[#4a5568]">
                {/* 1. Price */}
                <tr className="hover:bg-[#fbfaf6]">
                  <td className="p-3 font-black text-[var(--dp-color-ink)] bg-[var(--dp-color-ground)]">
                    السعر المطلوب
                  </td>
                  {properties.map((prop) => {
                    const isBest = prop.price === minPrice && properties.length > 1;
                    return (
                      <td key={prop.id} className="p-3">
                        <span className="text-base font-black text-[var(--dp-color-accent)] block">
                          {formatEGP(prop.price)}
                        </span>
                        {isBest && (
                          <Badge variant="fresh" size="sm" className="mt-1">
                            الأقل سعراً
                          </Badge>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* 2. Price per square meter */}
                <tr className="hover:bg-[#fbfaf6]">
                  <td className="p-3 font-black text-[var(--dp-color-ink)] bg-[var(--dp-color-ground)]">
                    سعر المتر المربع
                  </td>
                  {properties.map((prop) => {
                    const pPerSqm = Math.round(prop.price / (prop.area || 1));
                    const isBest = pPerSqm === minPricePerSqm && properties.length > 1;
                    return (
                      <td key={prop.id} className="p-3">
                        <span className="text-sm font-black text-[var(--dp-color-ink)] block">
                          {formatEGP(pPerSqm)} / م²
                        </span>
                        {isBest && (
                          <span className="text-[10px] text-emerald-700 font-black block mt-0.5">
                            ★ أفضل قيمة للمتر
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* 3. Area */}
                <tr className="hover:bg-[#fbfaf6]">
                  <td className="p-3 font-black text-[var(--dp-color-ink)] bg-[var(--dp-color-ground)]">
                    المساحة الإجمالية
                  </td>
                  {properties.map((prop) => (
                    <td key={prop.id} className="p-3 text-sm font-black">
                      {formatArea(prop.area)}
                    </td>
                  ))}
                </tr>

                {/* 4. Rooms and Baths */}
                <tr className="hover:bg-[#fbfaf6]">
                  <td className="p-3 font-black text-[var(--dp-color-ink)] bg-[var(--dp-color-ground)]">
                    الغرف والحمامات
                  </td>
                  {properties.map((prop) => (
                    <td key={prop.id} className="p-3">
                      <span>{prop.bedrooms} غرف نوم</span> • <span>{prop.bathrooms} حمامات</span>
                    </td>
                  ))}
                </tr>

                {/* 5. Property Type */}
                <tr className="hover:bg-[#fbfaf6]">
                  <td className="p-3 font-black text-[var(--dp-color-ink)] bg-[var(--dp-color-ground)]">
                    نوع العقار
                  </td>
                  {properties.map((prop) => (
                    <td key={prop.id} className="p-3">
                      <Badge variant="primary" size="sm">
                        {prop.type}
                      </Badge>
                    </td>
                  ))}
                </tr>

                {/* 6. City & Location */}
                <tr className="hover:bg-[#fbfaf6]">
                  <td className="p-3 font-black text-[var(--dp-color-ink)] bg-[var(--dp-color-ground)]">
                    الموقع والمدينة
                  </td>
                  {properties.map((prop) => (
                    <td key={prop.id} className="p-3">
                      <span className="block font-black text-[var(--dp-color-ink)]">{prop.city}</span>
                      <span className="text-[11px] text-[#718096] block">{prop.location}</span>
                    </td>
                  ))}
                </tr>

                {/* 7. Finishing */}
                <tr className="hover:bg-[#fbfaf6]">
                  <td className="p-3 font-black text-[var(--dp-color-ink)] bg-[var(--dp-color-ground)]">
                    حالة التشطيب
                  </td>
                  {properties.map((prop) => (
                    <td key={prop.id} className="p-3">
                      {prop.finishing || 'تشطيب الترا سوبر لوكس'}
                    </td>
                  ))}
                </tr>

                {/* 8. Floor */}
                <tr className="hover:bg-[#fbfaf6]">
                  <td className="p-3 font-black text-[var(--dp-color-ink)] bg-[var(--dp-color-ground)]">
                    الدور
                  </td>
                  {properties.map((prop) => (
                    <td key={prop.id} className="p-3">
                      {prop.floor || 'الدور الثالث'}
                    </td>
                  ))}
                </tr>

                {/* 9. Ownership Verification */}
                <tr className="hover:bg-[#fbfaf6]">
                  <td className="p-3 font-black text-[var(--dp-color-ink)] bg-[var(--dp-color-ground)]">
                    شارة التوثيق
                  </td>
                  {properties.map((prop) => (
                    <td key={prop.id} className="p-3">
                      {prop.isVerified ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-black">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                          <span>موثق ومفحوص</span>
                        </span>
                      ) : (
                        <span className="text-[#a0aec0]">قيد الفحص</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* 10. Key Amenities Checklist */}
                <tr className="hover:bg-[#fbfaf6]">
                  <td className="p-3 font-black text-[var(--dp-color-ink)] bg-[var(--dp-color-ground)]">
                    المصعد والجراج
                  </td>
                  {properties.map((prop) => (
                    <td key={prop.id} className="p-3 space-y-1 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        {prop.hasElevator ?? true ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-rose-500" />
                        )}
                        <span>مصعد (أسانسير)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {prop.hasGarage ?? true ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-rose-500" />
                        )}
                        <span>جراج خاص مغطى</span>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <Button variant="primary" size="md" onClick={onClose}>
            إغلاق نافذة المقارنة
          </Button>
        </div>
      </div>
    </Modal>
  );
};

