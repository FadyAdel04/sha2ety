import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Maximize2, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export interface PropertyGalleryProps {
  images: string[];
  title: string;
}

export const PropertyGallery: React.FC<PropertyGalleryProps> = ({ images, title }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const safeImages = images.length > 0 ? images : [
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
  ];

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % safeImages.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + safeImages.length) % safeImages.length);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        // In RTL, ArrowRight points backwards/previous in flow or next depending on viewpoint
        handlePrev();
      } else if (e.key === 'ArrowLeft') {
        handleNext();
      } else if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, safeImages.length]);

  return (
    <div className="space-y-3 select-none">
      {/* Main Image Viewport with Violet Backing Plate */}
      <div className="relative">
        <div
          className="absolute inset-0 bg-[var(--dp-color-accent)] rounded-[calc(var(--dp-radius-corner)+6px)] translate-x-2.5 translate-y-2.5 border-[3px] border-[var(--dp-color-outline)]"
          aria-hidden="true"
        />

        <div className="relative aspect-16/10 w-full overflow-hidden bg-[#e8e4d5] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] shadow-hard group">
          <img
            src={safeImages[activeIndex]}
            alt={`${title} - صورة ${activeIndex + 1}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />

          {/* Image Index Counter Badge */}
          <div className="absolute top-4 right-4 bg-[var(--dp-color-panel)]/95 border-[2px] border-[var(--dp-color-outline)] px-3 py-1 rounded-xl text-xs font-black shadow-hard-sm text-[var(--dp-color-ink)]">
            {activeIndex + 1} / {safeImages.length}
          </div>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={() => setIsFullscreen(true)}
            className="absolute top-4 left-4 p-2 rounded-xl bg-[var(--dp-color-panel)]/95 border-[2px] border-[var(--dp-color-outline)] text-[var(--dp-color-ink)] hover:bg-[var(--dp-color-accent-warm)] transition-colors shadow-hard-sm cursor-pointer"
            aria-label="عرض بملء الشاشة"
            title="عرض بملء الشاشة"
          >
            <Maximize2 className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* Next & Previous Buttons (Clickable controls) */}
          {safeImages.length > 1 && (
            <>
              {/* Previous Button (Right arrow in RTL) */}
              <button
                type="button"
                onClick={handlePrev}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-white/95 border-[2px] border-[var(--dp-color-outline)] text-[var(--dp-color-ink)] hover:bg-[var(--dp-color-accent-fresh)] transition-all flex items-center justify-center shadow-hard-sm cursor-pointer"
                aria-label="الصورة السابقة"
              >
                <ChevronRight className="w-5 h-5 stroke-[2.5]" />
              </button>

              {/* Next Button (Left arrow in RTL) */}
              <button
                type="button"
                onClick={handleNext}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-white/95 border-[2px] border-[var(--dp-color-outline)] text-[var(--dp-color-ink)] hover:bg-[var(--dp-color-accent-fresh)] transition-all flex items-center justify-center shadow-hard-sm cursor-pointer"
                aria-label="الصورة التالية"
              >
                <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Thumbnail Strip */}
      {safeImages.length > 1 && (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 pt-1">
          {safeImages.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`relative shrink-0 w-20 sm:w-24 aspect-4/3 rounded-xl border-[2.5px] overflow-hidden transition-all cursor-pointer ${
                activeIndex === idx
                  ? 'border-[var(--dp-color-accent)] ring-2 ring-[var(--dp-color-accent)] -translate-y-0.5 shadow-hard-sm'
                  : 'border-[var(--dp-color-outline)] opacity-70 hover:opacity-100'
              }`}
            >
              <img
                src={img}
                alt={`صورة مصغرة ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-[#253044]/95 backdrop-blur-md flex flex-col items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          {/* Top Bar with close & counter */}
          <div className="w-full max-w-5xl flex items-center justify-between mb-4 text-white">
            <span className="text-sm font-black bg-white/20 px-3 py-1 rounded-lg border border-white/30">
              {activeIndex + 1} من {safeImages.length}
            </span>

            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="p-2 rounded-xl bg-white text-[var(--dp-color-ink)] hover:bg-rose-500 hover:text-white transition-colors cursor-pointer border-[2px] border-[var(--dp-color-outline)]"
              aria-label="إغلاق العرض"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* Fullscreen image container */}
          <div className="relative w-full max-w-5xl max-h-[75vh] flex items-center justify-center">
            <img
              src={safeImages[activeIndex]}
              alt={title}
              className="max-w-full max-h-[75vh] object-contain rounded-2xl border-[3px] border-[var(--dp-color-outline)] shadow-hard-lg"
            />

            {/* Prev / Next controls in fullscreen */}
            {safeImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute right-2 sm:-right-5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-white text-[var(--dp-color-ink)] border-[2px] border-[var(--dp-color-outline)] shadow-hard flex items-center justify-center hover:bg-[var(--dp-color-accent-warm)] transition-colors cursor-pointer"
                  aria-label="السابق"
                >
                  <ChevronRight className="w-6 h-6 stroke-[2.5]" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute left-2 sm:-left-5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-white text-[var(--dp-color-ink)] border-[2px] border-[var(--dp-color-outline)] shadow-hard flex items-center justify-center hover:bg-[var(--dp-color-accent-warm)] transition-colors cursor-pointer"
                  aria-label="التالي"
                >
                  <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

