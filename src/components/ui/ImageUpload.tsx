import React, { useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { UploadCloud, X, Image as ImageIcon } from 'lucide-react';
import { Button } from './Button';

export interface ImageUploadProps {
  label?: string;
  helperText?: string;
  maxFiles?: number;
  maxSizeMB?: number;
  images?: string[];
  onChange?: (images: string[]) => void;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  label = 'صور العقار أو المستندات',
  helperText = 'ارفع صور واضحة للعقار بصيغ (JPG, PNG, WEBP) بحد أقصى 10 ميجابايت لكل صورة.',
  maxFiles = 6,
  images = [],
  onChange,
  className,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageList, setImageList] = useState<string[]>(images);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newUrls: string[] = [];
    const remainingSlots = maxFiles - imageList.length;

    Array.from(files)
      .slice(0, remainingSlots)
      .forEach((file) => {
        if (file.type.startsWith('image/')) {
          const url = URL.createObjectURL(file);
          newUrls.push(url);
        }
      });

    const updated = [...imageList, ...newUrls];
    setImageList(updated);
    onChange?.(updated);
  };

  const removeImage = (index: number) => {
    const updated = imageList.filter((_, i) => i !== index);
    setImageList(updated);
    onChange?.(updated);
  };

  return (
    <div className={cn('w-full text-right', className)}>
      {label && (
        <label className="block mb-2 text-sm font-bold text-[var(--dp-color-ink)] select-none">
          {label} ({imageList.length}/{maxFiles})
        </label>
      )}

      {/* Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'relative border-[3px] border-dashed rounded-[var(--dp-radius-corner)] p-6 sm:p-8 text-center cursor-pointer transition-all duration-[180ms]',
          isDragging
            ? 'border-[var(--dp-color-accent)] bg-[var(--dp-color-selection)] shadow-hard scale-[1.01]'
            : 'border-[var(--dp-color-outline)] bg-[var(--dp-color-ground)] hover:bg-[#fff9e6] hover:shadow-hard-sm'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-[var(--dp-color-accent-fresh)] border-[2.5px] border-[var(--dp-color-outline)] flex items-center justify-center text-[var(--dp-color-ink)] shadow-hard-sm">
            <UploadCloud className="w-7 h-7 stroke-[2.2]" />
          </div>

          <div>
            <p className="text-base font-black text-[var(--dp-color-ink)]">
              اسحب الصور وأفلتها هنا، أو اضغط للاختيار من جهازك
            </p>
            <p className="mt-1 text-xs text-[#626d84]">{helperText}</p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            اختر ملفات من الجهاز
          </Button>
        </div>
      </div>

      {/* Previews Grid */}
      {imageList.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {imageList.map((url, idx) => (
            <div
              key={idx}
              className="group relative aspect-square rounded-xl border-[2.5px] border-[var(--dp-color-outline)] overflow-hidden shadow-hard-sm bg-white"
            >
              <img src={url} alt={`معاينة الصورة ${idx + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-1.5 left-1.5 w-6 h-6 rounded-md bg-rose-500 text-white border-[1.5px] border-[var(--dp-color-outline)] flex items-center justify-center hover:bg-rose-600 transition-colors shadow-sm cursor-pointer"
                aria-label="حذف الصورة"
              >
                <X className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
              {idx === 0 && (
                <span className="absolute bottom-1.5 right-1.5 bg-[var(--dp-color-accent-warm)] text-[var(--dp-color-ink)] text-[10px] font-bold px-1.5 py-0.5 rounded border border-[var(--dp-color-outline)]">
                  الرئيسية
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

