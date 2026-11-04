import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { PropertyItem } from '@/components/ui/PropertyCard';
import {
  getComparisonList,
  removeFromComparison,
  clearComparison,
  COMPARISON_CHANGE_EVENT,
} from '@/services/comparisonService';
import { PropertyComparisonModal } from './PropertyComparisonModal';
import { Scale, X, Layers, Trash2 } from 'lucide-react';

export const ComparisonFloatingDock: React.FC = () => {
  const [items, setItems] = useState<PropertyItem[]>(() => getComparisonList());
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setItems(getComparisonList());
    };

    window.addEventListener(COMPARISON_CHANGE_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(COMPARISON_CHANGE_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <>
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-2xl animate-in fade-in slide-in-from-bottom-6 duration-300">
        <div className="bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-2xl p-3 sm:p-4 shadow-2xl flex items-center justify-between gap-3 text-right">
          {/* Right: Items Thumbnails & Count */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--dp-color-accent)] text-white flex items-center justify-center shrink-0 border-2 border-[var(--dp-color-outline)] shadow-hard-sm">
              <Scale className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-black text-[var(--dp-color-ink)]">
                  مقارنة العقارات
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[var(--dp-color-accent-warm)] border border-[var(--dp-color-outline)]">
                  {items.length} من 3
                </span>
              </div>
              <span className="text-[11px] text-[#626d84] hidden sm:block">
                قارن الأسعار، سعر المتر، والمواصفات وجهاً لوجه
              </span>
            </div>

            {/* Thumbnails */}
            <div className="hidden md:flex items-center gap-2 mr-2">
              {items.map((item) => (
                <div key={item.id} className="relative group">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-10 h-10 rounded-lg object-cover border-2 border-[var(--dp-color-outline)] shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeFromComparison(item.id)}
                    className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center text-[10px] shadow"
                    title="إزالة"
                    aria-label={`إزالة ${item.title} من المقارنة`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Left: Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearComparison}
              className="text-xs px-2.5 py-1.5"
              title="إفراغ"
              aria-label="إفراغ قائمة مقارنة العقارات"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="shadow-hard-sm text-xs sm:text-sm px-4 py-2 font-black"
            >
              قارن الآن ({items.length})
            </Button>
          </div>
        </div>
      </div>

      <PropertyComparisonModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        properties={items}
        onRemove={(id) => removeFromComparison(id)}
        onClear={() => {
          clearComparison();
          setIsModalOpen(false);
        }}
      />
    </>
  );
};

