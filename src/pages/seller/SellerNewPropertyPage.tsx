import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatEGP, formatArea } from '@/lib/utils';
import {
  addSellerProperty,
  PropertyLegalDocument,
  SellerPropertyStatus,
} from '@/services/sellerService';
import {
  Building2,
  Home,
  Store,
  Warehouse,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  UploadCloud,
  Trash2,
  Star,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Compass,
  Check,
  Save,
  Eye,
  Plus,
  RefreshCw,
  Sparkles,
  Lock,
  Layers,
  Calendar,
  Layers3,
  LandPlot,
  X,
  FileCheck,
} from 'lucide-react';

export type PropertyType = 'شقة' | 'فيلا' | 'منزل' | 'تجاري' | 'أرض';

export interface PropertyFormData {
  // Step 1: Basic
  title: string;
  type: PropertyType;
  purpose: 'للبيع';
  description: string;

  // Step 2: Location
  governorate: string;
  city: string;
  location: string;
  streetName: string;
  buildingNumber: string;
  latitude: number;
  longitude: number;

  // Step 3: Specifications
  price: number | '';
  area: number | '';
  bedrooms: number;
  bathrooms: number;
  floor: string;
  totalFloors: string;
  buildingAge: string;
  finishing: string;
  furnished: string;
  amenities: string[];

  // Step 4: Photos
  coverImageIndex: number;
  images: string[];

  // Step 5: Documents
  documents: PropertyLegalDocument[];
}

const INITIAL_FORM_DATA: PropertyFormData = {
  title: '',
  type: 'شقة',
  purpose: 'للبيع',
  description: '',

  governorate: 'القاهرة',
  city: 'القاهرة الجديدة',
  location: 'التجمع الخامس',
  streetName: '',
  buildingNumber: '',
  latitude: 30.0131,
  longitude: 31.4989,

  price: '',
  area: '',
  bedrooms: 3,
  bathrooms: 2,
  floor: 'الثالث',
  totalFloors: '5',
  buildingAge: 'جديد كلياً (استلام فوري)',
  finishing: 'ألترا سوبر لوكس',
  furnished: 'غير مفروش',
  amenities: ['مصعد', 'جراج', 'شرفة', 'غاز طبيعي'],

  coverImageIndex: 0,
  images: [],
  documents: [],
};

const STORAGE_DRAFT_KEY = 'sha2ety_property_wizard_draft';

// Sample photos for 1-click test fill
const SAMPLE_PHOTOS = [
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1200&q=80',
];

// Sample documents for 1-click test fill
const SAMPLE_DOCUMENTS: PropertyLegalDocument[] = [
  {
    id: 'doc-1',
    name: 'عقد_الملكية_المسجل_الشهر_العقاري.pdf',
    type: 'deed',
    typeName: 'عقد ملكية مسجل',
    url: '#',
    size: '2.4 ميجابايت',
    uploadedAt: new Date().toISOString(),
  },
  {
    id: 'doc-2',
    name: 'رخصة_البناء_وشهادة_المطابقة.pdf',
    type: 'ownership_proof',
    typeName: 'رخصة البناء الرسمية',
    url: '#',
    size: '1.8 ميجابايت',
    uploadedAt: new Date().toISOString(),
  },
];

// Location presets for map picker
const LOCATION_PRESETS = [
  { name: 'التجمع الخامس (القاهرة الجديدة)', lat: 30.0131, lng: 31.4989, city: 'القاهرة الجديدة', gov: 'القاهرة' },
  { name: 'الشيخ زايد (الجيزة)', lat: 30.0561, lng: 30.9856, city: 'الشيخ زايد', gov: 'الجيزة' },
  { name: 'المعادي (القاهرة)', lat: 29.9602, lng: 31.2569, city: 'المعادي', gov: 'القاهرة' },
  { name: 'سموحة (الإسكندرية)', lat: 31.2156, lng: 29.9553, city: 'الإسكندرية', gov: 'الإسكندرية' },
  { name: 'سيدي عبد الرحمن (الساحل الشمالي)', lat: 30.9578, lng: 28.7186, city: 'الساحل الشمالي', gov: 'الساحل الشمالي ومطروح' },
  { name: 'الجونة (البحر الأحمر)', lat: 27.3949, lng: 33.6766, city: 'الغردقة', gov: 'البحر الأحمر' },
];

export const SellerNewPropertyPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<PropertyFormData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_DRAFT_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return INITIAL_FORM_DATA;
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionReference, setSubmissionReference] = useState<string | null>(null);
  const [draftSavedToast, setDraftSavedToast] = useState(false);
  const [deleteConfirmImgIndex, setDeleteConfirmImgIndex] = useState<number | null>(null);
  const [isDraggingImages, setIsDraggingImages] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Auto-save form data to localStorage draft
  useEffect(() => {
    if (!submissionReference) {
      try {
        localStorage.setItem(STORAGE_DRAFT_KEY, JSON.stringify(formData));
      } catch {
        // Ignore quota
      }
    }
  }, [formData, submissionReference]);

  // Update single field in form data
  const updateField = <K extends keyof PropertyFormData>(key: K, value: PropertyFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (validationErrors[key as string]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[key as string];
        return next;
      });
    }
  };

  // Amenities toggle helper
  const toggleAmenity = (amenity: string) => {
    setFormData((prev) => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((a) => a !== amenity)
          : [...prev.amenities, amenity],
      };
    });
  };

  // Step Validation Logic
  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.title.trim()) {
        errors.title = 'يرجى إدخال عنوان واضح للإعلان.';
      } else if (formData.title.trim().length < 10) {
        errors.title = 'عنوان الإعلان يجب ألا يقل عن 10 أحرف لتوضيح العقار.';
      }

      if (!formData.description.trim()) {
        errors.description = 'يرجى إدخال وصف تفصيلي للعقار.';
      } else if (formData.description.trim().length < 30) {
        errors.description = 'الوصف قصير جداً، يرجى كتابة 30 حرفاً على الأقل يوضح مزايا العقار.';
      }
    }

    if (step === 2) {
      if (!formData.governorate.trim()) {
        errors.governorate = 'يرجى اختيار المحافظة.';
      }
      if (!formData.city.trim()) {
        errors.city = 'يرجى تحديد المدينة.';
      }
      if (!formData.location.trim()) {
        errors.location = 'يرجى تحديد الحي أو المنطقة السكنية.';
      }
    }

    if (step === 3) {
      if (!formData.price || Number(formData.price) <= 0) {
        errors.price = 'يرجى إدخال سعر بيع صحيح بالجنيه المصري.';
      }
      if (!formData.area || Number(formData.area) <= 0) {
        errors.area = 'يرجى إدخال المساحة بالمتر المربع.';
      }
    }

    if (step === 4) {
      if (formData.images.length === 0) {
        errors.images = 'يجب رفع صورة واحدة على الأقل للعقار (يُفضل 3 صور فأكثر).';
      }
    }

    if (step === 5) {
      if (formData.documents.length === 0) {
        errors.documents = 'يرجى إرفاق عقد الملكية أو مستند إثبات الملكية لبدء الفحص والتوثيق.';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Navigation handlers
  const handleNext = () => {
    if (validateStep(currentStep)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setCurrentStep((prev) => Math.min(prev + 1, 6));
    }
  };

  const handlePrev = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Save as Draft
  const handleSaveAsDraft = async () => {
    setIsSubmitting(true);
    try {
      const cover = formData.images[formData.coverImageIndex] || formData.images[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';
      await addSellerProperty({
        sellerId: user?.id || 'demo-seller-1',
        title: formData.title.trim() || 'مسودة عقار جديد للبيع',
        description: formData.description.trim() || 'مسودة غير مكتملة بعد.',
        price: Number(formData.price) || 0,
        area: Number(formData.area) || 0,
        type: formData.type,
        purpose: 'للبيع',
        governorate: formData.governorate,
        city: formData.city,
        location: formData.location,
        streetName: formData.streetName,
        buildingNumber: formData.buildingNumber,
        latitude: formData.latitude,
        longitude: formData.longitude,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        floor: formData.floor,
        totalFloors: formData.totalFloors,
        buildingAge: formData.buildingAge,
        finishing: formData.finishing,
        furnished: formData.furnished,
        amenities: formData.amenities,
        imageUrl: cover,
        images: formData.images,
        documents: formData.documents,
        status: 'draft' as SellerPropertyStatus,
      });

      localStorage.removeItem(STORAGE_DRAFT_KEY);
      setDraftSavedToast(true);
      setTimeout(() => {
        navigate('/seller/properties');
      }, 1000);
    } catch (err) {
      console.error('Failed to save draft:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Final Submit for Review
  const handleSubmitForReview = async () => {
    // Validate all steps 1-5 before final submit
    for (let s = 1; s <= 5; s++) {
      if (!validateStep(s)) {
        setCurrentStep(s);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const cover = formData.images[formData.coverImageIndex] || formData.images[0];
      const ref = `SHA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      await addSellerProperty({
        sellerId: user?.id || 'demo-seller-1',
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        area: Number(formData.area),
        type: formData.type,
        purpose: 'للبيع',
        governorate: formData.governorate,
        city: formData.city,
        location: formData.location,
        streetName: formData.streetName,
        buildingNumber: formData.buildingNumber,
        latitude: formData.latitude,
        longitude: formData.longitude,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        floor: formData.floor,
        totalFloors: formData.totalFloors,
        buildingAge: formData.buildingAge,
        finishing: formData.finishing,
        furnished: formData.furnished,
        amenities: formData.amenities,
        imageUrl: cover,
        images: formData.images,
        documents: formData.documents,
        status: 'pending_review' as SellerPropertyStatus,
      });

      localStorage.removeItem(STORAGE_DRAFT_KEY);
      setSubmissionReference(ref);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Failed to submit property for review:', err);
      alert('حدث خطأ أثناء إرسال البيانات، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Image upload handling
  const handleImageFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const validFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) {
        alert(`حجم الصورة "${file.name}" أكبر من 10 ميجابايت.`);
        continue;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        alert(`صيغة الملف "${file.name}" غير مدعومة، يرجى رفع ملفات JPG, PNG, أو WEBP.`);
        continue;
      }
      validFiles.push(file);
    }

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          setFormData((prev) => ({
            ...prev,
            images: [...prev.images, result],
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (indexToRemove: number) => {
    setFormData((prev) => {
      const newImages = prev.images.filter((_, idx) => idx !== indexToRemove);
      let newCover = prev.coverImageIndex;
      if (newCover === indexToRemove) newCover = 0;
      else if (newCover > indexToRemove) newCover -= 1;
      return { ...prev, images: newImages, coverImageIndex: newCover };
    });
    setDeleteConfirmImgIndex(null);
  };

  const moveImage = (index: number, direction: 'left' | 'right') => {
    setFormData((prev) => {
      const targetIndex = direction === 'left' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.images.length) return prev;

      const newImages = [...prev.images];
      const temp = newImages[index];
      newImages[index] = newImages[targetIndex];
      newImages[targetIndex] = temp;

      let newCover = prev.coverImageIndex;
      if (prev.coverImageIndex === index) newCover = targetIndex;
      else if (prev.coverImageIndex === targetIndex) newCover = index;

      return { ...prev, images: newImages, coverImageIndex: newCover };
    });
  };

  // Document upload handling
  const handleDocumentFiles = (files: FileList | null, docType: 'deed' | 'ownership_proof' | 'additional') => {
    if (!files || files.length === 0) return;
    const typeNames = {
      deed: 'عقد ملكية مسجل',
      ownership_proof: 'إثبات ملكية ورخصة',
      additional: 'مستندات إضافية',
    };

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const newDoc: PropertyLegalDocument = {
        id: `doc-${Date.now()}-${i}`,
        name: file.name,
        type: docType,
        typeName: typeNames[docType],
        url: URL.createObjectURL(file),
        size: `${(file.size / (1024 * 1024)).toFixed(1)} ميجابايت`,
        uploadedAt: new Date().toISOString(),
      };

      setFormData((prev) => ({
        ...prev,
        documents: [...prev.documents, newDoc],
      }));
    }
  };

  const removeDocument = (docId: string) => {
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.filter((d) => d.id !== docId),
    }));
  };

  // Calculated price per sqm
  const pricePerSqm =
    formData.price && formData.area && Number(formData.area) > 0
      ? Math.round(Number(formData.price) / Number(formData.area))
      : null;

  // Step descriptors
  const stepsConfig = [
    { num: 1, title: 'البيانات الأساسية', color: 'bg-[var(--dp-color-accent)]', text: 'text-white' },
    { num: 2, title: 'الموقع الجغرافي', color: 'bg-[var(--dp-color-accent-fresh)]', text: 'text-emerald-950' },
    { num: 3, title: 'المواصفات', color: 'bg-[var(--dp-color-accent-warm)]', text: 'text-amber-950' },
    { num: 4, title: 'صور العقار', color: 'bg-[var(--dp-color-accent-secondary)]', text: 'text-rose-950' },
    { num: 5, title: 'مستندات الملكية', color: 'bg-emerald-500', text: 'text-white' },
    { num: 6, title: 'المراجعة والإرسال', color: 'bg-purple-600', text: 'text-white' },
  ];

  // ----------------------------------------------------------------------
  // SUBMISSION CONFIRMATION SCREEN
  // ----------------------------------------------------------------------
  if (submissionReference) {
    return (
      <DashboardLayout
        role="seller"
        title="تم إرسال العقار للمراجعة"
        subtitle="تم حفظ بيانات عقارك بنجاح ورفع مستندات الملكية للفحص القانوني."
      >
        <div className="max-w-2xl mx-auto text-right">
          <div className="relative">
            {/* Violet offset backing */}
            <div className="absolute inset-0 bg-[var(--dp-color-accent)] rounded-[var(--dp-radius-corner)] translate-x-2 translate-y-2 -z-10" />

            <div className="bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-8 sm:p-12 shadow-hard space-y-6">
              {/* Geometric Badge */}
              <div className="w-20 h-20 rounded-2xl bg-[var(--dp-color-accent-fresh)] border-[3px] border-[var(--dp-color-outline)] flex items-center justify-center text-emerald-900 mx-auto shadow-hard-sm">
                <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
              </div>

              <div className="text-center space-y-2">
                <span className="inline-block px-3 py-1 rounded-full bg-[var(--dp-color-selection)] border border-[var(--dp-color-outline)] text-xs font-black text-[var(--dp-color-accent)]">
                  رقم مرجعي: {submissionReference}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-[var(--dp-color-ink)]">
                  تم استلام عقارك للمراجعة والتوثيق!
                </h2>
                <p className="text-sm text-[#526078] font-bold max-w-md mx-auto leading-relaxed">
                  شكراً لك! العقار الآن في حالة <strong className="text-amber-800">قيد المراجعة</strong> لدى الفريق القانوني لتوثيق مستندات الملكية.
                </p>
              </div>

              {/* What happens next timeline */}
              <div className="p-5 rounded-2xl bg-[var(--dp-color-ground)] border-[2px] border-[var(--dp-color-outline)] space-y-3">
                <h4 className="font-black text-sm text-[var(--dp-color-ink)] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  ماذا يحدث بعد ذلك؟
                </h4>

                <div className="space-y-2 text-xs font-bold text-[#4a5568]">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[var(--dp-color-accent)] text-white text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">
                      ١
                    </span>
                    <span>فحص عقود الملكية والتوكيلات الرسمية بواسطة الفريق القانوني المختص خلال 24 إلى 48 ساعة.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[var(--dp-color-accent)] text-white text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">
                      ٢
                    </span>
                    <span>إرسال إشعار لحظي لحسابك بمجرد اعتماد الأوراق ومنح العقار شارة "موثق رسمياً".</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[var(--dp-color-accent)] text-white text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">
                      ٣
                    </span>
                    <span>ظهور الإعلان مباشرة في صفحة "استكشف العقارات" لآلاف المشترين الجادين في مصر.</span>
                  </div>
                </div>
              </div>

              {/* Summary of submitted property */}
              <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[var(--dp-color-outline)]">
                <img
                  src={formData.images[formData.coverImageIndex] || formData.images[0]}
                  alt={formData.title}
                  className="w-16 h-16 rounded-lg object-cover border border-[var(--dp-color-outline)] shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <span className="font-black text-sm text-[var(--dp-color-ink)] block line-clamp-1">
                    {formData.title}
                  </span>
                  <span className="text-xs text-[#626d84] block mt-0.5">
                    {formData.city} • {formData.location} • {formatEGP(Number(formData.price))}
                  </span>
                </div>
                <Badge variant="warm" size="sm">
                  قيد المراجعة
                </Badge>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => navigate('/seller/properties')}
                  className="w-full sm:w-auto"
                >
                  الانتقال لقائمة عقاراتي
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => navigate('/seller/dashboard')}
                  className="w-full sm:w-auto"
                >
                  لوحة تحكم البائع
                </Button>
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => {
                    setSubmissionReference(null);
                    setCurrentStep(1);
                    setFormData(INITIAL_FORM_DATA);
                  }}
                  className="w-full sm:w-auto text-xs"
                >
                  إضافة عقار آخر
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ----------------------------------------------------------------------
  // MAIN WIZARD LAYOUT
  // ----------------------------------------------------------------------
  return (
    <DashboardLayout
      role="seller"
      title="إضافة عقار جديد للبيع"
      subtitle="معالج التقديم الذكي المكون من 6 خطوات لإدراج عقارك وتوثيقه قانونياً."
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveAsDraft}
            isLoading={isSubmitting}
            rightIcon={<Save className="w-4 h-4 stroke-[2.5]" />}
          >
            حفظ كمسودة
          </Button>
          <Link to="/seller/properties">
            <Button variant="ghost" size="sm">
              إلغاء
            </Button>
          </Link>
        </div>
      }
    >
      {/* Toast Notification when draft is saved */}
      {draftSavedToast && (
        <div className="fixed bottom-6 left-6 z-50 bg-[var(--dp-color-panel)] border-[2.5px] border-[var(--dp-color-outline)] shadow-hard p-4 rounded-xl flex items-center gap-3 animate-fadeIn text-right">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span className="font-black text-sm text-[var(--dp-color-ink)]">
            تم حفظ العقار كمسودة بنجاح! جاري تحويلك...
          </span>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* STEP INDICATORS PROGRESS BAR (Playful Geometric) */}
      {/* ----------------------------------------------------------------- */}
      <section className="mb-8 text-right">
        {/* Desktop Step Strip */}
        <div className="hidden lg:block bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-4 shadow-hard">
          <div className="flex items-center justify-between relative">
            {/* Horizontal Connecting Progress Line */}
            <div className="absolute top-1/2 left-8 right-8 -translate-y-1/2 h-1 bg-[#e4e1d3] -z-0" />
            <div
              className="absolute top-1/2 right-8 -translate-y-1/2 h-1 bg-[var(--dp-color-accent)] -z-0 transition-all duration-300"
              style={{
                width: `${((currentStep - 1) / (stepsConfig.length - 1)) * 92}%`,
              }}
            />

            {stepsConfig.map((step) => {
              const isCompleted = currentStep > step.num;
              const isCurrent = currentStep === step.num;

              return (
                <button
                  key={step.num}
                  type="button"
                  onClick={() => {
                    // Allow navigating to any previously validated step
                    if (step.num < currentStep || validateStep(currentStep)) {
                      setCurrentStep(step.num);
                    }
                  }}
                  className="relative z-10 flex flex-col items-center gap-1.5 focus:outline-hidden cursor-pointer group"
                >
                  <div
                    className={`w-11 h-11 rounded-xl border-[2.5px] border-[var(--dp-color-outline)] flex items-center justify-center font-black text-sm transition-all shadow-hard-xs ${
                      isCompleted
                        ? 'bg-[var(--dp-color-accent-fresh)] text-emerald-950 scale-105'
                        : isCurrent
                        ? `${step.color} ${step.text} scale-110 shadow-hard-sm ring-4 ring-[var(--dp-color-accent)]/20`
                        : 'bg-white text-[#8896ab] hover:border-[var(--dp-color-accent)]'
                    }`}
                  >
                    {isCompleted ? <Check className="w-5 h-5 stroke-[3]" /> : step.num}
                  </div>
                  <span
                    className={`text-xs font-black transition-colors ${
                      isCurrent
                        ? 'text-[var(--dp-color-accent)]'
                        : isCompleted
                        ? 'text-[var(--dp-color-ink)]'
                        : 'text-[#8896ab]'
                    }`}
                  >
                    {step.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile Step Strip (< lg) */}
        <div className="lg:hidden bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-4 shadow-hard space-y-2">
          <div className="flex items-center justify-between text-xs font-black">
            <span className="text-[var(--dp-color-accent)]">
              الخطوة {currentStep} من 6:
            </span>
            <span className="text-[var(--dp-color-ink)]">
              {stepsConfig[currentStep - 1].title}
            </span>
          </div>
          {/* Progress bar line */}
          <div className="w-full h-2.5 bg-[#e4e1d3] rounded-full border border-[var(--dp-color-outline)] overflow-hidden">
            <div
              className="h-full bg-[var(--dp-color-accent)] transition-all duration-300"
              style={{ width: `${(currentStep / 6) * 100}%` }}
            />
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* MAIN WHITE BOOK PANEL WITH VIOLET OFFSET BACKING */}
      {/* ----------------------------------------------------------------- */}
      <div className="relative text-right max-w-4xl mx-auto mb-12">
        {/* Layered Violet Offset Backing */}
        <div className="absolute inset-0 bg-[var(--dp-color-accent)] rounded-[var(--dp-radius-corner)] translate-x-2 translate-y-2 -z-10" />

        <div className="bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-6 sm:p-10 shadow-hard space-y-8">
          {/* ============================================================= */}
          {/* STEP 1: البيانات الأساسية */}
          {/* ============================================================= */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b-2 border-[#ece9db] pb-4">
                <Badge variant="primary" className="mb-1.5">
                  الخطوة الأولى
                </Badge>
                <h3 className="text-xl sm:text-2xl font-black text-[var(--dp-color-ink)]">
                  البيانات الأساسية للعقار
                </h3>
                <p className="text-xs sm:text-sm text-[#526078] font-bold mt-1">
                  اختر نوع العقار واكتب عنواناً جذاباً ووصفاً وافياً يوضح المزايا الحصرية.
                </p>
              </div>

              {/* Title Field */}
              <div>
                <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1">
                  عنوان الإعلان <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="مثال: شقة للبيع بفيو مفتوح 175 م² في ميفيدا التجمع الخامس"
                  error={validationErrors.title}
                />
                <span className="text-[11px] text-[#626d84] font-bold mt-1 block">
                  اجعل العنوان واضحاً يوضح المساحة والحي وأبرز ميزة (10 أحرف كحد أدنى).
                </span>
              </div>

              {/* Property Type Selection Cards */}
              <div>
                <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-2">
                  نوع العقار <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { type: 'شقة' as PropertyType, icon: <Building2 className="w-5 h-5" />, desc: 'سكنية / دوبلكس' },
                    { type: 'فيلا' as PropertyType, icon: <Home className="w-5 h-5" />, desc: 'مستقلة / توين' },
                    { type: 'منزل' as PropertyType, icon: <Layers3 className="w-5 h-5" />, desc: 'بيت عائلي / عمارة' },
                    { type: 'تجاري' as PropertyType, icon: <Store className="w-5 h-5" />, desc: 'محل / مكتب / عيادة' },
                    { type: 'أرض' as PropertyType, icon: <LandPlot className="w-5 h-5" />, desc: 'سكنية / استثمارية' },
                  ].map((item) => {
                    const isSelected = formData.type === item.type;
                    return (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => updateField('type', item.type)}
                        className={`p-3.5 rounded-xl border-[2.5px] text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-[var(--dp-color-selection)] border-[var(--dp-color-accent)] text-[var(--dp-color-accent)] shadow-hard-xs scale-102 font-black'
                            : 'bg-[var(--dp-color-ground)] border-[var(--dp-color-outline)] text-[#4a5568] hover:bg-white font-bold'
                        }`}
                      >
                        <span className={`p-2 rounded-lg ${isSelected ? 'bg-white text-[var(--dp-color-accent)] shadow-xs' : 'bg-gray-100'}`}>
                          {item.icon}
                        </span>
                        <span className="text-sm block">{item.type}</span>
                        <span className="text-[10px] text-[#8896ab] block">{item.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Purpose Field (Locked to "للبيع") */}
              <div>
                <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1">
                  الغرض من الإعلان
                </label>
                <div className="p-3.5 rounded-xl border-[2px] border-[var(--dp-color-outline)] bg-[var(--dp-color-ground)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-[var(--dp-color-accent-warm)] border border-[var(--dp-color-outline)] text-amber-900">
                      <Sparkles className="w-4 h-4 stroke-[2.5]" />
                    </span>
                    <div>
                      <span className="text-sm font-black text-[var(--dp-color-ink)] block">
                        عقار معروض للبيع النهائي
                      </span>
                      <span className="text-xs text-[#626d84] font-bold block">
                        منصة شقتي مخصصة لمعاملات البيع والشراء الموثقة رسمياً.
                      </span>
                    </div>
                  </div>
                  <Badge variant="warm" size="sm">
                    للبيع
                  </Badge>
                </div>
              </div>

              {/* Description Field */}
              <div>
                <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1">
                  الوصف التفصيلي للعقار <span className="text-rose-500">*</span>
                </label>
                <Textarea
                  rows={5}
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="اكتب وصفاً مفصلاً يوضح: تقسيم الغرف، فيو التراس، حالة التشطيب، حصة الجراج، ومدى القرب من المحاور والخدمات..."
                  error={validationErrors.description}
                />
                <span className="text-[11px] text-[#626d84] font-bold mt-1 block">
                  الوصف الوافي يقلل من الاستفسارات المكررة ويزيد من سرعة حجز مواعيد المعاينة.
                </span>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* STEP 2: الموقع الجغرافي */}
          {/* ============================================================= */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b-2 border-[#ece9db] pb-4">
                <Badge variant="fresh" className="mb-1.5">
                  الخطوة الثانية
                </Badge>
                <h3 className="text-xl sm:text-2xl font-black text-[var(--dp-color-ink)]">
                  موقع العقار والخريطة
                </h3>
                <p className="text-xs sm:text-sm text-[#526078] font-bold mt-1">
                  حدد المحافظة والمدينة والشارع، ونقطة التواجد على الخريطة التفاعلية.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Governorate */}
                <Select
                  label="المحافظة *"
                  value={formData.governorate}
                  onChange={(e) => updateField('governorate', e.target.value)}
                  error={validationErrors.governorate}
                  options={[
                    { value: 'القاهرة', label: 'القاهرة' },
                    { value: 'الجيزة', label: 'الجيزة' },
                    { value: 'الإسكندرية', label: 'الإسكندرية' },
                    { value: 'الساحل الشمالي ومطروح', label: 'الساحل الشمالي ومطروح' },
                    { value: 'البحر الأحمر', label: 'البحر الأحمر (الغردقة والجونة)' },
                    { value: 'القليوبية', label: 'القليوبية' },
                    { value: 'الشرقية', label: 'الشرقية (العاشر من رمضان)' },
                    { value: 'الدقهلية', label: 'الدقهلية (المنصورة والمنصورة الجديدة)' },
                  ]}
                />

                {/* City */}
                <Input
                  label="المدينة أو التجمع *"
                  value={formData.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  placeholder="مثال: القاهرة الجديدة، الشيخ زايد، 6 أكتوبر"
                  error={validationErrors.city}
                />

                {/* Neighborhood / District */}
                <Input
                  label="المنطقة أو اسم الحي / الكمبوند *"
                  value={formData.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  placeholder="مثال: التجمع الخامس، حي النرجس، كمبوند ميفيدا"
                  error={validationErrors.location}
                />

                {/* Street Name */}
                <Input
                  label="اسم الشارع أو المحور القريب"
                  value={formData.streetName}
                  onChange={(e) => updateField('streetName', e.target.value)}
                  placeholder="مثال: شارع التسعين الجنوبي، محور محمد بن زايد"
                />

                {/* Building / Unit Number */}
                <div className="sm:col-span-2">
                  <Input
                    label="رقم العقار أو العمارة / رقم الفيلا (سري)"
                    value={formData.buildingNumber}
                    onChange={(e) => updateField('buildingNumber', e.target.value)}
                    placeholder="مثال: عمارة رقم 42 أو قطعة 18"
                  />
                  <span className="text-[11px] text-[#626d84] font-bold mt-1 block">
                    🔒 رقم العقار الدقيق محمي ومخفي ولن يظهر للعامة؛ بل يشارك فقط مع المشتري عند تأكيد موعد المعاينة.
                  </span>
                </div>
              </div>

              {/* Interactive Map Section */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-black text-[var(--dp-color-ink)] flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[var(--dp-color-accent)]" />
                    الموقع على الخريطة التفاعلية
                  </label>
                  <span className="text-xs text-[#626d84] font-bold">
                    اختر منطقة سريعة أو اضبط الإحداثيات أدناه
                  </span>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {LOCATION_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        updateField('latitude', preset.lat);
                        updateField('longitude', preset.lng);
                        updateField('city', preset.city);
                        updateField('governorate', preset.gov);
                      }}
                      className="px-3 py-1 rounded-lg border border-[var(--dp-color-outline)] bg-[var(--dp-color-ground)] text-[11px] font-bold text-[#4a5568] hover:bg-[var(--dp-color-selection)] hover:text-[var(--dp-color-accent)] whitespace-nowrap cursor-pointer transition-colors"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>

                {/* Embedded Map Container */}
                <div className="relative aspect-16/9 sm:aspect-21/9 w-full rounded-2xl overflow-hidden border-[2.5px] border-[var(--dp-color-outline)] bg-[#e9e6d8] shadow-hard-sm">
                  <iframe
                    title="موقع العقار على الخريطة"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${formData.longitude - 0.02}%2C${formData.latitude - 0.015}%2C${formData.longitude + 0.02}%2C${formData.latitude + 0.015}&layer=mapnik&marker=${formData.latitude}%2C${formData.longitude}`}
                    className="w-full h-full border-0"
                    loading="lazy"
                  />
                  <div className="absolute top-3 right-3 bg-[var(--dp-color-panel)]/95 border-[2px] border-[var(--dp-color-outline)] px-3 py-1.5 rounded-xl text-xs font-black shadow-hard-xs flex items-center gap-2 pointer-events-none">
                    <Compass className="w-4 h-4 text-[var(--dp-color-accent)]" />
                    <span>
                      {formData.location || formData.city || 'نقطة الخريطة المحددة'}
                    </span>
                  </div>
                </div>

                {/* Coordinates Feedback */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-[var(--dp-color-ground)] border border-[var(--dp-color-outline)]">
                    <span className="text-[#626d84] font-bold block">خط العرض (Latitude):</span>
                    <span className="font-mono font-bold text-[var(--dp-color-ink)]">{formData.latitude}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[var(--dp-color-ground)] border border-[var(--dp-color-outline)]">
                    <span className="text-[#626d84] font-bold block">خط الطول (Longitude):</span>
                    <span className="font-mono font-bold text-[var(--dp-color-ink)]">{formData.longitude}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* STEP 3: مواصفات العقار */}
          {/* ============================================================= */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b-2 border-[#ece9db] pb-4">
                <Badge variant="warm" className="mb-1.5">
                  الخطوة الثالثة
                </Badge>
                <h3 className="text-xl sm:text-2xl font-black text-[var(--dp-color-ink)]">
                  مواصفات العقار والمميزات
                </h3>
                <p className="text-xs sm:text-sm text-[#526078] font-bold mt-1">
                  أدخل السعر المطلوب والمساحة بدقة، وحدد وسائل الراحة والخدمات المتاحة.
                </p>
              </div>

              {/* Price & Area Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1">
                    السعر الإجمالي المطلوب (ج.م) <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => updateField('price', e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="6850000"
                    error={validationErrors.price}
                  />
                  {formData.price && Number(formData.price) > 0 && (
                    <span className="text-xs font-black text-[var(--dp-color-accent)] mt-1 block">
                      المبلغ المكتوب: {formatEGP(Number(formData.price))}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1">
                    المساحة الإجمالية (م² متر مربع) <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="number"
                    value={formData.area}
                    onChange={(e) => updateField('area', e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="175"
                    error={validationErrors.area}
                  />
                  {pricePerSqm && (
                    <span className="text-xs font-black text-emerald-800 mt-1 block">
                      سعر المتر المربع: {formatEGP(pricePerSqm)} / م²
                    </span>
                  )}
                </div>
              </div>

              {/* Rooms & Baths Counters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-2">
                    عدد الغرف
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => updateField('bedrooms', num)}
                        className={`py-2 rounded-xl border-[2px] font-black text-sm cursor-pointer transition-all ${
                          formData.bedrooms === num
                            ? 'bg-[var(--dp-color-accent)] text-white border-[var(--dp-color-outline)] shadow-hard-xs'
                            : 'bg-[var(--dp-color-ground)] border-[var(--dp-color-outline)] text-[#4a5568] hover:bg-white'
                        }`}
                      >
                        {num === 6 ? '+6' : num}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-2">
                    عدد الحمامات
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => updateField('bathrooms', num)}
                        className={`py-2 rounded-xl border-[2px] font-black text-sm cursor-pointer transition-all ${
                          formData.bathrooms === num
                            ? 'bg-[var(--dp-color-accent)] text-white border-[var(--dp-color-outline)] shadow-hard-xs'
                            : 'bg-[var(--dp-color-ground)] border-[var(--dp-color-outline)] text-[#4a5568] hover:bg-white'
                        }`}
                      >
                        {num === 5 ? '+5' : num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floor & Total Floors & Age */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Select
                  label="رقم الدور"
                  value={formData.floor}
                  onChange={(e) => updateField('floor', e.target.value)}
                  options={[
                    { value: 'أرضي مرتفع', label: 'أرضي مرتفع' },
                    { value: 'أرضي بحديقة', label: 'أرضي بحديقة' },
                    { value: 'الأول', label: 'الدور الأول' },
                    { value: 'الثاني', label: 'الدور الثاني' },
                    { value: 'الثالث', label: 'الدور الثالث' },
                    { value: 'الرابع', label: 'الدور الرابع' },
                    { value: 'الخامس فأعلى', label: 'الدور الخامس فأعلى' },
                    { value: 'الدور الأخير', label: 'الدور الأخير' },
                    { value: 'روف مع تراس', label: 'روف مع تراس' },
                  ]}
                />

                <Select
                  label="إجمالي أدوار المبنى"
                  value={formData.totalFloors}
                  onChange={(e) => updateField('totalFloors', e.target.value)}
                  options={[
                    { value: '3', label: '3 أدوار (فيلا / عمارة)' },
                    { value: '4', label: '4 أدوار' },
                    { value: '5', label: '5 أدوار' },
                    { value: '6', label: '6 أدوار' },
                    { value: '10+', label: 'برج سكني (أكثر من 10 أدوار)' },
                  ]}
                />

                <Select
                  label="عمر العقار"
                  value={formData.buildingAge}
                  onChange={(e) => updateField('buildingAge', e.target.value)}
                  options={[
                    { value: 'جديد كلياً (استلام فوري)', label: 'جديد كلياً (استلام فوري)' },
                    { value: 'تحت الإنشاء', label: 'تحت الإنشاء' },
                    { value: 'سنة إلى 3 سنوات', label: 'سنة إلى 3 سنوات' },
                    { value: '4 إلى 7 سنوات', label: '4 إلى 7 سنوات' },
                    { value: 'أكثر من 8 سنوات', label: 'أكثر من 8 سنوات' },
                  ]}
                />
              </div>

              {/* Finishing & Furnished */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="نوع التشطيب"
                  value={formData.finishing}
                  onChange={(e) => updateField('finishing', e.target.value)}
                  options={[
                    { value: 'ألترا سوبر لوكس', label: 'ألترا سوبر لوكس' },
                    { value: 'سوبر لوكس', label: 'سوبر لوكس' },
                    { value: 'لوكس', label: 'لوكس' },
                    { value: 'نصف تشطيب (محارة وحلوق)', label: 'نصف تشطيب (محارة وحلوق)' },
                    { value: 'بدون تشطيب (ع الطوب الأحمر)', label: 'بدون تشطيب (ع الطوب الأحمر)' },
                  ]}
                />

                <Select
                  label="حالة الفرش"
                  value={formData.furnished}
                  onChange={(e) => updateField('furnished', e.target.value)}
                  options={[
                    { value: 'غير مفروش', label: 'غير مفروش' },
                    { value: 'مفروش بالكامل', label: 'مفروش بالكامل' },
                    { value: 'مفروش جزئياً (مطبخ وتكييفات)', label: 'مفروش جزئياً (مطبخ وتكييفات)' },
                  ]}
                />
              </div>

              {/* Amenities (7 required: elevator, garage, balcony, garden, security, AC, gas) */}
              <div>
                <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-2">
                  المميزات ووسائل الراحة المتوفرة
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { name: 'مصعد', label: 'مصعد (أسانسير)' },
                    { name: 'جراج', label: 'جراج / موقف سيارات' },
                    { name: 'شرفة', label: 'شرفة / بلكونة' },
                    { name: 'حديقة', label: 'حديقة خاصة' },
                    { name: 'أمن وحراسة', label: 'أمن وحراسة 24/7' },
                    { name: 'تكييف', label: 'تكييف مركزي / سبليت' },
                    { name: 'غاز طبيعي', label: 'غاز طبيعي مركب' },
                  ].map((amenity) => {
                    const isChecked = formData.amenities.includes(amenity.name);
                    return (
                      <button
                        key={amenity.name}
                        type="button"
                        onClick={() => toggleAmenity(amenity.name)}
                        className={`p-3 rounded-xl border-[2px] text-right transition-all cursor-pointer flex items-center justify-between ${
                          isChecked
                            ? 'bg-[var(--dp-color-field-soft)] border-[var(--dp-color-outline)] text-emerald-950 font-black shadow-hard-xs'
                            : 'bg-[var(--dp-color-ground)] border-[var(--dp-color-outline)] text-[#4a5568] hover:bg-white font-bold'
                        }`}
                      >
                        <span className="text-xs">{amenity.label}</span>
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                            isChecked
                              ? 'bg-emerald-600 border-emerald-700 text-white'
                              : 'bg-white border-gray-300'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* STEP 4: صور العقار */}
          {/* ============================================================= */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b-2 border-[#ece9db] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <Badge variant="secondary" className="mb-1.5">
                    الخطوة الرابعة
                  </Badge>
                  <h3 className="text-xl sm:text-2xl font-black text-[var(--dp-color-ink)]">
                    صور العقار (المعرض)
                  </h3>
                  <p className="text-xs sm:text-sm text-[#526078] font-bold mt-1">
                    ارفع صوراً حقيقية عالية الجودة تبرز الصالة والغرف والمطبخ والفيو الخارجي.
                  </p>
                </div>

                {/* Quick Sample Photos Button for demo/testing */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      images: Array.from(new Set([...prev.images, ...SAMPLE_PHOTOS])),
                    }));
                  }}
                  rightIcon={<Sparkles className="w-4 h-4 text-amber-600 stroke-[2.5]" />}
                  className="self-start sm:self-auto text-xs"
                >
                  استخدام صور نموذجية
                </Button>
              </div>

              {validationErrors.images && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs font-black text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{validationErrors.images}</span>
                </div>
              )}

              {/* Drag and drop upload zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingImages(true);
                }}
                onDragLeave={() => setIsDraggingImages(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingImages(false);
                  handleImageFiles(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`p-8 sm:p-12 border-[3px] border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                  isDraggingImages
                    ? 'border-[var(--dp-color-accent)] bg-[var(--dp-color-selection)] scale-101'
                    : 'border-[var(--dp-color-outline)] bg-[var(--dp-color-ground)] hover:bg-white'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleImageFiles(e.target.files)}
                />

                <div className="w-16 h-16 rounded-2xl bg-white border-[2px] border-[var(--dp-color-outline)] flex items-center justify-center text-[var(--dp-color-accent)] mx-auto mb-3 shadow-hard-xs">
                  <UploadCloud className="w-8 h-8 stroke-[2.2]" />
                </div>

                <h4 className="text-base font-black text-[var(--dp-color-ink)] mb-1">
                  اسحب الصور وأفلتها هنا أو اضغط للاختيار من جهازك
                </h4>
                <p className="text-xs text-[#626d84] font-bold">
                  يدعم صيغ JPG, PNG, WEBP حتى 10 ميجابايت لكل صورة. يمكنك رفع عدة صور في آن واحد.
                </p>
              </div>

              {/* Photos Grid & Management */}
              {formData.images.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-black text-[#526078]">
                    <span>تم رفع {formData.images.length} صور</span>
                    <span>الصورة التي تحمل شارة "الغلاف" هي التي تظهر أولاً في نتائج البحث</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {formData.images.map((img, idx) => {
                      const isCover = formData.coverImageIndex === idx;
                      return (
                        <div
                          key={idx}
                          className={`relative rounded-xl overflow-hidden border-[2.5px] bg-white group transition-all shadow-hard-xs ${
                            isCover ? 'border-[var(--dp-color-accent)] ring-3 ring-[var(--dp-color-accent)]/20' : 'border-[var(--dp-color-outline)]'
                          }`}
                        >
                          <img
                            src={img}
                            alt={`صورة عقار ${idx + 1}`}
                            className="w-full h-32 object-cover"
                          />

                          {/* Cover badge */}
                          {isCover && (
                            <div className="absolute top-2 right-2 bg-[var(--dp-color-accent)] text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                              <Star className="w-3 h-3 fill-white" />
                              الغلاف الرئيسي
                            </div>
                          )}

                          {/* Image controls toolbar */}
                          <div className="p-2 bg-[var(--dp-color-ground)] border-t border-[var(--dp-color-outline)] flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => moveImage(idx, 'left')}
                                className="p-1 rounded bg-white border border-[var(--dp-color-outline)] disabled:opacity-30 cursor-pointer"
                                title="تحريك لليمين"
                              >
                                <ArrowRight className="w-3 h-3 text-[#374151]" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === formData.images.length - 1}
                                onClick={() => moveImage(idx, 'right')}
                                className="p-1 rounded bg-white border border-[var(--dp-color-outline)] disabled:opacity-30 cursor-pointer"
                                title="تحريك لليسار"
                              >
                                <ArrowLeft className="w-3 h-3 text-[#374151]" />
                              </button>
                            </div>

                            <div className="flex items-center gap-1">
                              {!isCover && (
                                <button
                                  type="button"
                                  onClick={() => updateField('coverImageIndex', idx)}
                                  className="text-[10px] font-bold text-[var(--dp-color-accent)] hover:underline cursor-pointer px-1"
                                >
                                  تعيين كغلاف
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmImgIndex(idx)}
                                className="p-1 rounded bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 cursor-pointer"
                                title="حذف الصورة"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================= */}
          {/* STEP 5: مستندات الملكية */}
          {/* ============================================================= */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b-2 border-[#ece9db] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <Badge variant="fresh" className="mb-1.5">
                    الخطوة الخامسة
                  </Badge>
                  <h3 className="text-xl sm:text-2xl font-black text-[var(--dp-color-ink)]">
                    مستندات الملكية الرسمية
                  </h3>
                  <p className="text-xs sm:text-sm text-[#526078] font-bold mt-1">
                    ارفع أوراق إثبات الملكية ليتولى الفريق القانوني فحصها ومنحك شارة "موثق".
                  </p>
                </div>

                {/* Quick sample documents for testing */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      documents: SAMPLE_DOCUMENTS,
                    }));
                  }}
                  rightIcon={<Sparkles className="w-4 h-4 text-amber-600 stroke-[2.5]" />}
                  className="self-start sm:self-auto text-xs"
                >
                  استخدام مستندات تجريبية
                </Button>
              </div>

              {/* MANDATORY PRIVACY NOTICE */}
              <div className="p-5 rounded-2xl bg-[var(--dp-color-field-soft)] border-[2.5px] border-[var(--dp-color-outline)] shadow-hard-xs space-y-2">
                <div className="flex items-center gap-2 font-black text-sm text-emerald-950">
                  <ShieldCheck className="w-5 h-5 text-emerald-700 stroke-[2.5]" />
                  <span>إشعار الخصوصية والأمان القانوني:</span>
                </div>
                <p className="text-xs sm:text-sm text-[#253044] font-bold leading-relaxed">
                  "مستنداتك خاصة، ولن يتم عرضها للمشترين. يطلع عليها فقط فريق المراجعة المختص."
                </p>
                <div className="text-[11px] text-[#526078] pt-1 border-t border-emerald-200/60">
                  🔒 يتم تشفير كافة الملفات والمستندات وحفظها في بيئة تخزين خاصة ومعزولة تماماً.
                </div>
              </div>

              {validationErrors.documents && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs font-black text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{validationErrors.documents}</span>
                </div>
              )}

              {/* Document upload boxes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. عقد الملكية */}
                <div className="p-5 rounded-xl border-[2px] border-[var(--dp-color-outline)] bg-[var(--dp-color-ground)] space-y-3">
                  <div className="flex items-center gap-2 text-sm font-black text-[var(--dp-color-ink)]">
                    <FileCheck className="w-5 h-5 text-[var(--dp-color-accent)]" />
                    <span>عقد الملكية (مسجل / نهائي / ابتدائي) *</span>
                  </div>
                  <p className="text-xs text-[#626d84] font-bold leading-relaxed">
                    صورة واضحة من العقد المسجل بالشهر العقاري أو عقد الشراء المعتمد.
                  </p>
                  <label className="block">
                    <input
                      type="file"
                      accept=".pdf,image/jpeg,image/png"
                      className="hidden"
                      onChange={(e) => handleDocumentFiles(e.target.files, 'deed')}
                    />
                    <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[var(--dp-color-outline)] text-xs font-black text-[var(--dp-color-accent)] hover:bg-[var(--dp-color-selection)] cursor-pointer shadow-xs">
                      <UploadCloud className="w-4 h-4" />
                      رفع عقد الملكية
                    </span>
                  </label>
                </div>

                {/* 2. مستند إثبات الملكية والرخصة */}
                <div className="p-5 rounded-xl border-[2px] border-[var(--dp-color-outline)] bg-[var(--dp-color-ground)] space-y-3">
                  <div className="flex items-center gap-2 text-sm font-black text-[var(--dp-color-ink)]">
                    <FileText className="w-5 h-5 text-emerald-700" />
                    <span>إثبات الملكية ورخصة البناء *</span>
                  </div>
                  <p className="text-xs text-[#626d84] font-bold leading-relaxed">
                    توكيل رسمي، إخطار تخصيص، أو رخصة بناء العقار الرسمية.
                  </p>
                  <label className="block">
                    <input
                      type="file"
                      accept=".pdf,image/jpeg,image/png"
                      className="hidden"
                      onChange={(e) => handleDocumentFiles(e.target.files, 'ownership_proof')}
                    />
                    <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[var(--dp-color-outline)] text-xs font-black text-emerald-800 hover:bg-emerald-50 cursor-pointer shadow-xs">
                      <UploadCloud className="w-4 h-4" />
                      رفع مستند الإثبات
                    </span>
                  </label>
                </div>
              </div>

              {/* Uploaded Documents List */}
              {formData.documents.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-black text-[var(--dp-color-ink)]">
                    المستندات المرفقة جاهزة للفحص ({formData.documents.length}):
                  </h4>

                  <div className="space-y-2">
                    {formData.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3.5 rounded-xl border-[2px] border-[var(--dp-color-outline)] bg-white flex items-center justify-between gap-3 shadow-hard-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="p-2 rounded-lg bg-[var(--dp-color-field-soft)] border border-[var(--dp-color-outline)] text-[var(--dp-color-accent)] shrink-0">
                            <FileText className="w-5 h-5" />
                          </span>
                          <div className="min-w-0">
                            <span className="font-black text-xs text-[var(--dp-color-ink)] block truncate">
                              {doc.name}
                            </span>
                            <div className="flex items-center gap-2 text-[11px] text-[#626d84] mt-0.5">
                              <Badge variant="fresh" size="sm">
                                {doc.typeName}
                              </Badge>
                              <span>{doc.size}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeDocument(doc.id)}
                          className="p-1.5 rounded-lg border border-[var(--dp-color-outline)] bg-rose-50 hover:bg-rose-100 text-rose-700 cursor-pointer shrink-0"
                          title="حذف المستند"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================= */}
          {/* STEP 6: المراجعة والإرسال */}
          {/* ============================================================= */}
          {currentStep === 6 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b-2 border-[#ece9db] pb-4">
                <Badge variant="primary" className="mb-1.5">
                  الخطوة السادسة والأخيرة
                </Badge>
                <h3 className="text-xl sm:text-2xl font-black text-[var(--dp-color-ink)]">
                  معاينة الإعلان قبل الإرسال
                </h3>
                <p className="text-xs sm:text-sm text-[#526078] font-bold mt-1">
                  راجع كافة التفاصيل والصور ومستندات الفحص وتأكد من دقتها قبل تأكيد الإرسال.
                </p>
              </div>

              {/* Complete Property Preview Card */}
              <div className="p-5 rounded-2xl border-[3px] border-[var(--dp-color-outline)] bg-[var(--dp-color-ground)] space-y-6">
                {/* Photo Header & Gallery strip */}
                <div className="space-y-2">
                  <div className="relative aspect-16/9 w-full rounded-xl overflow-hidden border-[2px] border-[var(--dp-color-outline)]">
                    <img
                      src={formData.images[formData.coverImageIndex] || formData.images[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'}
                      alt={formData.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 bg-[var(--dp-color-accent-fresh)] text-emerald-950 font-black text-xs px-3 py-1 rounded-full border border-[var(--dp-color-outline)] shadow-xs">
                      جاهز للمراجعة القانونية
                    </div>
                  </div>

                  {formData.images.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                      {formData.images.map((img, i) => (
                        <img
                          key={i}
                          src={img}
                          alt="مصغرة"
                          className="w-16 h-14 rounded-lg object-cover border border-[var(--dp-color-outline)] shrink-0"
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Title & Price Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[#ece9db]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="primary" size="sm">
                        {formData.type}
                      </Badge>
                      <span className="text-xs text-[#626d84] font-bold">
                        {formData.governorate} • {formData.city} ({formData.location})
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-[var(--dp-color-ink)]">
                      {formData.title || 'عنوان العقار'}
                    </h3>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <span className="text-xl sm:text-2xl font-black text-[var(--dp-color-accent)] block">
                      {formData.price ? formatEGP(Number(formData.price)) : '0 ج.م'}
                    </span>
                    {pricePerSqm && (
                      <span className="text-xs font-bold text-[#626d84] block">
                        {formatEGP(pricePerSqm)} / م²
                      </span>
                    )}
                  </div>
                </div>

                {/* Specifications Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white border border-[var(--dp-color-outline)]">
                    <span className="text-[#626d84] block mb-0.5">المساحة</span>
                    <span className="font-black text-sm text-[var(--dp-color-ink)]">
                      {formData.area ? formatArea(Number(formData.area)) : '0 م²'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-[var(--dp-color-outline)]">
                    <span className="text-[#626d84] block mb-0.5">الغرف والحمامات</span>
                    <span className="font-black text-sm text-[var(--dp-color-ink)]">
                      {formData.bedrooms} غرف • {formData.bathrooms} حمام
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-[var(--dp-color-outline)]">
                    <span className="text-[#626d84] block mb-0.5">الدور</span>
                    <span className="font-black text-sm text-[var(--dp-color-ink)]">
                      {formData.floor} (من {formData.totalFloors} أدوار)
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-[var(--dp-color-outline)]">
                    <span className="text-[#626d84] block mb-0.5">التشطيب والفرش</span>
                    <span className="font-black text-sm text-[var(--dp-color-ink)]">
                      {formData.finishing}
                    </span>
                  </div>
                </div>

                {/* Amenities List */}
                <div className="space-y-1.5">
                  <span className="text-xs font-black text-[#526078] block">المميزات المتوفرة:</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {formData.amenities.map((am) => (
                      <span
                        key={am}
                        className="px-2.5 py-1 rounded-lg bg-white border border-[var(--dp-color-outline)] text-xs font-bold text-[#253044] flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                        {am}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Legal Documents Summary */}
                <div className="p-4 rounded-xl bg-white border-[2px] border-[var(--dp-color-outline)] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-[var(--dp-color-accent-fresh)] border border-[var(--dp-color-outline)] text-emerald-950">
                      <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-[var(--dp-color-ink)] block">
                        مستندات الملكية المرفوعة ({formData.documents.length} مستندات)
                      </span>
                      <span className="text-[11px] text-[#626d84] font-bold block">
                        محفوظة في بيئة آمنة ومشفرة للمراجعة القانونية فقط.
                      </span>
                    </div>
                  </div>
                  <Badge variant="fresh" size="sm">
                    مستوفى للفحص
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* STEPPER ACTION BUTTONS (Previous, Next, Save Draft, Submit) */}
          {/* ============================================================= */}
          <div className="pt-6 border-t-2 border-[#ece9db] flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Previous Button */}
            <div>
              {currentStep > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrev}
                  rightIcon={<ArrowRight className="w-4 h-4 stroke-[2.5]" />}
                >
                  السابق
                </Button>
              ) : (
                <Link to="/seller/properties">
                  <Button type="button" variant="ghost" size="sm">
                    إلغاء والعودة
                  </Button>
                </Link>
              )}
            </div>

            {/* Next / Submit / Draft Actions */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="warm"
                onClick={handleSaveAsDraft}
                isLoading={isSubmitting}
                rightIcon={<Save className="w-4 h-4 stroke-[2.5]" />}
                className="text-xs"
              >
                حفظ كمسودة
              </Button>

              {currentStep < 6 ? (
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={handleNext}
                  leftIcon={<ArrowLeft className="w-4 h-4 stroke-[2.5]" />}
                >
                  التالي
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  onClick={handleSubmitForReview}
                  isLoading={isSubmitting}
                  rightIcon={<CheckCircle2 className="w-5 h-5 stroke-[2.5]" />}
                  className="font-black text-base shadow-hard"
                >
                  إرسال للمراجعة والتوثيق
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Dialog for deleting image */}
      <ConfirmDialog
        isOpen={deleteConfirmImgIndex !== null}
        onClose={() => setDeleteConfirmImgIndex(null)}
        onConfirm={() => {
          if (deleteConfirmImgIndex !== null) removeImage(deleteConfirmImgIndex);
        }}
        title="تأكيد حذف الصورة"
        description="هل أنت متأكد من رغبتك في حذف هذه الصورة من معرض الإعلان؟"
        confirmLabel="حذف"
        cancelLabel="إلغاء"
        variant="danger"
      />
    </DashboardLayout>
  );
};
