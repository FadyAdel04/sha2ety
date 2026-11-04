import React from 'react';
import { MapPin, Navigation, Compass, ShieldCheck } from 'lucide-react';

export interface PropertyLocationMapProps {
  location: string;
  city: string;
  governorate?: string;
  lat?: number;
  lng?: number;
}

export const PropertyLocationMap: React.FC<PropertyLocationMapProps> = ({
  location,
  city,
  governorate = 'القاهرة',
  lat = 30.0131,
  lng = 31.4989,
}) => {
  // Construct OpenStreetMap embed URL with zoom around neighborhood
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.03}%2C${lat - 0.02}%2C${lng + 0.03}%2C${lat + 0.02}&layer=mapnik&marker=${lat}%2C${lng}`;

  return (
    <div className="bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-6 shadow-hard text-right space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b-2 border-[#ece9db]">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[var(--dp-color-accent-secondary)] stroke-[2.5]" />
            <h3 className="text-lg font-black text-[var(--dp-color-ink)]">
              الموقع الجغرافي المعتمد
            </h3>
          </div>
          <p className="text-xs text-[#626d84] mt-0.5">
            {location}، {city}، {governorate}
          </p>
        </div>

        <span className="inline-flex items-center gap-1 px-3 py-1 bg-[var(--dp-color-field-soft)] text-emerald-800 text-xs font-black rounded-full border border-[var(--dp-color-outline)]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          موقع حي معتمد
        </span>
      </div>

      {/* Interactive Map Iframe Container */}
      <div className="relative aspect-16/9 sm:aspect-21/9 w-full rounded-2xl overflow-hidden border-[2.5px] border-[var(--dp-color-outline)] bg-[#e9e6d8] shadow-hard-sm">
        <iframe
          title="خريطة موقع العقار"
          src={osmUrl}
          className="w-full h-full border-0"
          loading="lazy"
        />

        {/* Floating neighborhood banner on map */}
        <div className="absolute bottom-3 right-3 bg-[var(--dp-color-panel)]/95 border-[2px] border-[var(--dp-color-outline)] px-3 py-1.5 rounded-xl text-xs font-bold shadow-hard-sm flex items-center gap-2 pointer-events-none">
          <Compass className="w-4 h-4 text-[var(--dp-color-accent)]" />
          <span>منطقة {location}</span>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="p-3 bg-[var(--dp-color-ground)] rounded-xl border border-[var(--dp-color-outline)] text-xs text-[#526078] flex items-center justify-between">
        <span>
          📌 يتم عرض موقع الحي أو المجمع السكني العام فقط حفاظاً على خصوصية وأمن المالك، وتُحدد نقطة الالتقاء الدقيقة عند تأكيد موعد المعاينة.
        </span>
      </div>
    </div>
  );
};

