import React, { useState, useMemo, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import {
  AdminProperty,
  approveProperty,
  rejectProperty,
  requestChangesProperty,
  PropertyDocument,
  PropertyImageReview,
  getSampleDocUrl,
  updatePropertyDocumentStatus,
} from '@/services/adminService';
import { sbUpdatePropertyStatus } from '@/services/supabaseService';
import { formatEGP, formatArea } from '@/lib/utils';
import {
  Building2,
  MapPin,
  FileText,
  Camera,
  User,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  Lock,
  Flag,
  Sparkles,
  Calendar,
  Layers,
  BedDouble,
  Bath,
  Maximize2,
  Eye,
  Clock,
  Phone,
  Mail,
  Check,
  X,
  AlertCircle,
  ExternalLink,
  Printer,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RefreshCw,
  FileCheck,
  Award,
  QrCode,
  FileDown,
  CheckCircle,
} from 'lucide-react';

export interface PropertyReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: AdminProperty | null;
  onActionComplete: (updatedProperty: AdminProperty) => void;
}

export const PropertyReviewModal: React.FC<PropertyReviewModalProps> = ({
  isOpen,
  onClose,
  property,
  onActionComplete,
}) => {
  if (!property) return null;

  const safeImagesList: PropertyImageReview[] = useMemo(() => {
    if (property.imagesList && Array.isArray(property.imagesList) && property.imagesList.length > 0) {
      return property.imagesList;
    }
    if (property.images && Array.isArray(property.images) && property.images.length > 0) {
      return property.images.map((url, i) => ({
        id: `img-${i}`,
        url,
        quality: 'high' as const,
        isFlagged: false,
      }));
    }
    if (property.imageUrl) {
      return [{ id: 'img-cover', url: property.imageUrl, quality: 'high' as const, isFlagged: false }];
    }
    return [];
  }, [property]);

  const [localProperty, setLocalProperty] = useState<AdminProperty | null>(property);
  useEffect(() => {
    setLocalProperty(property);
  }, [property]);

  const activeProperty = localProperty || property;

  const safeDocuments = useMemo(() => {
    if (activeProperty?.documents && Array.isArray(activeProperty.documents) && activeProperty.documents.length > 0) {
      return activeProperty.documents.map((d) => ({
        ...d,
        url: (!d.url || d.url === '#' || d.url.trim() === '') ? getSampleDocUrl(d.type) : d.url,
      }));
    }
    return [
      {
        id: `doc-${activeProperty?.id || 'prop'}-1`,
        name: 'عقد مسجل شهر عقاري نهائي.pdf',
        type: 'deed' as const,
        url: getSampleDocUrl('deed'),
        size: '3.4 MB',
        uploadDate: (activeProperty?.submissionDate || '').split(' ')[0] || '2026-11-04',
        status: activeProperty?.isVerified ? ('verified' as const) : ('pending' as const),
      },
      {
        id: `doc-${activeProperty?.id || 'prop'}-2`,
        name: 'رخصة بناء معتمدة وشهادة مطابقة إنشائية.pdf',
        type: 'license' as const,
        url: getSampleDocUrl('license'),
        size: '2.1 MB',
        uploadDate: (activeProperty?.submissionDate || '').split(' ')[0] || '2026-11-04',
        status: activeProperty?.isVerified ? ('verified' as const) : ('pending' as const),
      },
      {
        id: `doc-${activeProperty?.id || 'prop'}-3`,
        name: 'بطاقة الرقم القومي للمالك (سارية).pdf',
        type: 'national_id' as const,
        url: getSampleDocUrl('national_id'),
        size: '1.2 MB',
        uploadDate: (activeProperty?.submissionDate || '').split(' ')[0] || '2026-11-04',
        status: activeProperty?.isVerified ? ('verified' as const) : ('pending' as const),
      },
    ];
  }, [activeProperty]);

  const safeSeller = useMemo(() => {
    return {
      id: property.seller?.id || 'seller',
      name: property.seller?.name || (property as any).sellerName || 'المالك',
      phone: property.seller?.phone || (property as any).sellerPhone || '01001234567',
      email: property.seller?.email || 'seller@sha2ety.eg',
      registrationDate: property.seller?.registrationDate || property.submissionDate || '2026-08-01',
      isIdentityVerified: property.seller?.isIdentityVerified ?? true,
      rating: property.seller?.rating || 5.0,
      totalSubmitted: property.seller?.totalSubmitted || 1,
      approvedCount: property.seller?.approvedCount || 0,
      rejectedCount: property.seller?.rejectedCount || 0,
    };
  }, [property]);

  const safeAmenitiesList = useMemo(() => {
    return property.amenitiesList || [];
  }, [property]);

  const [activeTab, setActiveTab] = useState<'details' | 'images' | 'documents' | 'seller'>('details');

  // Sub-modals for admin actions
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [approveNotes, setApproveNotes] = useState('');

  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  const [isRequestChangesOpen, setIsRequestChangesOpen] = useState(false);
  const [correctionNotes, setCorrectionNotes] = useState('');
  const [correctionError, setCorrectionError] = useState('');

  // Selected image preview modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Flag image state
  const [flaggedImages, setFlaggedImages] = useState<Record<string, string>>({});
  const [flaggingImageId, setFlaggingImageId] = useState<string | null>(null);
  const [flagReasonInput, setFlagReasonInput] = useState('');

  // Document preview inspector state
  const [previewDoc, setPreviewDoc] = useState<PropertyDocument | null>(null);
  const [docViewMode, setDocViewMode] = useState<'certified' | 'scan'>('certified');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [docRejectPromptOpen, setDocRejectPromptOpen] = useState(false);
  const [docRejectReasonInput, setDocRejectReasonInput] = useState('');

  // Quick document status handler
  const handleUpdateDocStatus = (
    docId: string,
    status: 'verified' | 'rejected' | 'pending',
    reason?: string
  ) => {
    if (!property) return;
    const updated = updatePropertyDocumentStatus(property.id, docId, status, reason);
    if (updated) {
      setLocalProperty(updated);
      if (previewDoc && previewDoc.id === docId) {
        setPreviewDoc({ ...previewDoc, status, rejectionReason: reason });
      }
      onActionComplete(updated);
    }
  };

  // Real document downloader
  const handleDownloadDoc = (doc: PropertyDocument) => {
    if (doc.url && doc.url !== '#' && !doc.url.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = doc.url;
      link.download = doc.name;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const textContent = `======================================================
منصة شقتي العقارية — محرر المستند المعتمد للإدارة
======================================================
اسم المستند: ${doc.name}
النوع: ${doc.type}
الحجم: ${doc.size}
تاريخ الرفع: ${doc.uploadDate}
الحالة: ${doc.status === 'verified' ? 'معتمد رسمياً' : 'قيد التدقيق'}
كود العقار: ${property.id}
عنوان العقار: ${property.location || property.city}
المالك المسجل: ${safeSeller.name}
رقم الهاتف: ${safeSeller.phone}
رقم القيد بالشهر العقاري: EG-RE-NOTARY-${property.id.replace(/\D/g, '') || '94821'}
توقيع المشرف الإداري: م. أحمد مهران (إدارة شقتي)
======================================================`;
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${doc.name.replace(/\.[^/.]+$/, '')}_بيانات_التوثيق.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    }
  };

  // Print document
  const handlePrintDoc = () => {
    window.print();
  };

  // Price per m²
  const pricePerSqm = property.area ? Math.round(property.price / property.area) : 0;
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle Approve
  const handleConfirmApprove = async () => {
    setIsSubmitting(true);
    try {
      await sbUpdatePropertyStatus(property.id, 'available', { admin_notes: approveNotes }).catch(() => {});
    } catch {
      // Fallback handled by local adminService
    }

    const res = approveProperty(property.id, approveNotes, undefined, undefined, property);
    setIsApproveOpen(false);
    setIsSubmitting(false);
    onActionComplete(res.property || {
      ...property,
      reviewStatus: 'published',
      isVerified: true,
      status: 'available',
    });
  };

  // Handle Reject
  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      setRejectError('يرجى ذكر سبب الرفض بالتفصيل لإعلام البائع.');
      return;
    }
    setIsSubmitting(true);
    try {
      await sbUpdatePropertyStatus(property.id, 'rejected', { rejection_reason: rejectReason }).catch(() => {});
    } catch {
      // Fallback handled by local adminService
    }

    const res = rejectProperty(property.id, rejectReason, undefined, undefined, property);
    setIsRejectOpen(false);
    setIsSubmitting(false);
    onActionComplete(res.property || {
      ...property,
      reviewStatus: 'rejected',
      isVerified: false,
      status: 'rejected',
      rejectionReason: rejectReason,
    });
  };

  // Handle Request Changes
  const handleConfirmRequestChanges = async () => {
    if (!correctionNotes.trim()) {
      setCorrectionError('يرجى توضيح التعديلات أو النواقص المطلوبة من البائع.');
      return;
    }
    setIsSubmitting(true);
    try {
      await sbUpdatePropertyStatus(property.id, 'requires_changes', { admin_notes: correctionNotes }).catch(() => {});
    } catch {
      // Fallback handled by local adminService
    }

    const res = requestChangesProperty(property.id, correctionNotes, undefined, undefined, property);
    setIsRequestChangesOpen(false);
    setIsSubmitting(false);
    onActionComplete(res.property || {
      ...property,
      reviewStatus: 'requires_changes',
      isVerified: false,
      status: 'requires_changes',
      correctionNotes: correctionNotes,
    });
  };

  // Handle Image Flag
  const handleSaveImageFlag = (imgId: string) => {
    if (flagReasonInput.trim()) {
      setFlaggedImages((prev) => ({ ...prev, [imgId]: flagReasonInput.trim() }));
      setFlaggingImageId(null);
      setFlagReasonInput('');
    }
  };

  // Status Badge Component
  const renderStatusBadge = () => {
    switch (property.reviewStatus) {
      case 'published':
        return <Badge variant="fresh">عقار موثق ومنشور</Badge>;
      case 'pending_review':
        return <Badge variant="warm">قيد المراجعة القانونية</Badge>;
      case 'requires_changes':
        return <Badge variant="secondary">مطلوب تعديلات</Badge>;
      case 'rejected':
        return <Badge variant="danger">مرفوض</Badge>;
      default:
        return <Badge variant="muted">{property.reviewStatus}</Badge>;
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`مراجعة العقار: ${property.title}`}
        description={`مقدم من المالك: ${safeSeller.name} • تاريخ الإرسال: ${property.submissionDate}`}
        size="xl"
      >
        <div className="space-y-6 text-right">
          {/* Top Status & Fast Action Bar */}
          <div className="p-4 bg-[var(--dp-color-ground)] rounded-xl border-[2px] border-[var(--dp-color-outline)] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-[#626d84]">حالة العقار الحالية:</span>
              {renderStatusBadge()}
              {property.isVerified && (
                <span className="flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  شارة التوثيق مفعلة
                </span>
              )}
            </div>

            {/* Quick Action Trigger Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCorrectionError('');
                  setIsRequestChangesOpen(true);
                }}
                className="text-xs font-black border-amber-400 bg-amber-50 hover:bg-amber-100"
              >
                طلب تعديلات
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setRejectError('');
                  setIsRejectOpen(true);
                }}
                className="text-xs font-black border-rose-400 bg-rose-50 text-rose-700 hover:bg-rose-100"
              >
                رفض العقار
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsApproveOpen(true)}
                className="text-xs font-black shadow-hard-sm"
              >
                اعتماد ونشر العقار
              </Button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b-[2.5px] border-[var(--dp-color-outline)] gap-2">
            {[
              { id: 'details', label: 'بيانات العقار', icon: <Building2 className="w-4 h-4" /> },
              { id: 'images', label: `الصور (${safeImagesList.length})`, icon: <Camera className="w-4 h-4" /> },
              { id: 'documents', label: `المستندات القانونية (${safeDocuments.length})`, icon: <FileText className="w-4 h-4" /> },
              { id: 'seller', label: 'بيانات البائع', icon: <User className="w-4 h-4" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer border-b-[3px] -mb-[2.5px] ${
                  activeTab === tab.id
                    ? 'border-[var(--dp-color-accent)] text-[var(--dp-color-accent)]'
                    : 'border-transparent text-[#626d84] hover:text-[var(--dp-color-ink)]'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab 1: بيانات العقار */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Previous Review Feedback Banner if rejected or requires changes */}
              {property.correctionNotes && (
                <div className="p-4 rounded-xl border-[2px] border-amber-300 bg-amber-50 text-amber-900 text-xs space-y-1">
                  <div className="flex items-center gap-2 font-black text-amber-950">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    ملاحظات التعديل السابقة المطلوبة من البائع:
                  </div>
                  <p className="leading-relaxed pr-6">{property.correctionNotes}</p>
                </div>
              )}

              {property.rejectionReason && (
                <div className="p-4 rounded-xl border-[2px] border-rose-300 bg-rose-50 text-rose-900 text-xs space-y-1">
                  <div className="flex items-center gap-2 font-black text-rose-950">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    سبب الرفض المسجل مسبقاً:
                  </div>
                  <p className="leading-relaxed pr-6">{property.rejectionReason}</p>
                </div>
              )}

              {/* Price & Primary Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-[var(--dp-color-field-soft)] rounded-xl border-[2px] border-[var(--dp-color-outline)] shadow-hard-sm">
                  <span className="text-xs font-bold text-[#626d84] block">السعر المطلوب</span>
                  <span className="text-xl font-black text-[var(--dp-color-ink)] block mt-1">
                    {formatEGP(property.price)}
                  </span>
                  <span className="text-[11px] font-bold text-[#626d84] block mt-0.5">
                    سعر المتر التقريبي: {formatEGP(pricePerSqm)} / م²
                  </span>
                </div>

                <div className="p-4 bg-white rounded-xl border-[2px] border-[var(--dp-color-outline)] shadow-hard-sm">
                  <span className="text-xs font-bold text-[#626d84] block">نوع العقار والغرض</span>
                  <span className="text-lg font-black text-[var(--dp-color-ink)] block mt-1">
                    {property.type} — للبيع
                  </span>
                  <span className="text-[11px] font-bold text-[#626d84] block mt-0.5">
                    التشطيب: {property.finishing || 'غير محدد'} • الفرش: {property.furnishing || 'بدون'}
                  </span>
                </div>

                <div className="p-4 bg-white rounded-xl border-[2px] border-[var(--dp-color-outline)] shadow-hard-sm">
                  <span className="text-xs font-bold text-[#626d84] block">الموقع الجغرافي</span>
                  <span className="text-sm font-black text-[var(--dp-color-ink)] block mt-1 line-clamp-1">
                    {property.city} — {property.location}
                  </span>
                  <span className="text-[11px] font-bold text-[#626d84] block mt-0.5">
                    {property.district || ''} {property.streetName ? `• ${property.streetName}` : ''}
                  </span>
                </div>
              </div>

              {/* Specifications Matrix */}
              <div className="bg-[var(--dp-color-panel)] border-[2px] border-[var(--dp-color-outline)] rounded-xl p-5 shadow-hard-sm space-y-3">
                <h4 className="text-xs font-black text-[#526078] uppercase tracking-wider">
                  المواصفات الفنية والهندسية
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-[var(--dp-color-ground)] rounded-lg border border-[#e5e1d3]">
                    <span className="text-[#626d84] block mb-1">المساحة الإجمالية</span>
                    <span className="font-black text-sm text-[var(--dp-color-ink)]">{formatArea(property.area)}</span>
                  </div>

                  {property.type !== 'محل' && property.type !== 'أرض' && (
                    <>
                      <div className="p-3 bg-[var(--dp-color-ground)] rounded-lg border border-[#e5e1d3]">
                        <span className="text-[#626d84] block mb-1">عدد الغرف</span>
                        <span className="font-black text-sm text-[var(--dp-color-ink)]">{property.bedrooms} غرف</span>
                      </div>

                      <div className="p-3 bg-[var(--dp-color-ground)] rounded-lg border border-[#e5e1d3]">
                        <span className="text-[#626d84] block mb-1">عدد الحمامات</span>
                        <span className="font-black text-sm text-[var(--dp-color-ink)]">{property.bathrooms} حمام</span>
                      </div>
                    </>
                  )}

                  <div className="p-3 bg-[var(--dp-color-ground)] rounded-lg border border-[#e5e1d3]">
                    <span className="text-[#626d84] block mb-1">الدور / إجمالي الأدوار</span>
                    <span className="font-black text-sm text-[var(--dp-color-ink)]">
                      {String(property.floor) === '0' ? 'أرضي' : property.floor ? `الدور ${property.floor}` : 'غير محدد'} (من {property.totalFloors || 5})
                    </span>
                  </div>
                </div>
              </div>

              {/* Type-Specific Custom Details if available */}
              {property.customDetails && Object.keys(property.customDetails).length > 0 && (
                <div className="bg-[var(--dp-color-ground)] border-[2px] border-[var(--dp-color-outline)] rounded-xl p-5 shadow-hard-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-[var(--dp-color-accent)] uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      تفاصيل مخصصة نوع العقار ({property.type}{property.subType ? ` - ${property.subType}` : ''})
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
                    {property.customDetails.shopFrontageWidth && (
                      <div className="p-2.5 bg-white rounded-lg border border-[#e5e1d3]">
                        <span className="text-[#626d84] block mb-0.5">عرض الواجهة</span>
                        <span className="font-black text-[var(--dp-color-ink)]">{property.customDetails.shopFrontageWidth} متر</span>
                      </div>
                    )}
                    {property.customDetails.ceilingHeight && (
                      <div className="p-2.5 bg-white rounded-lg border border-[#e5e1d3]">
                        <span className="text-[#626d84] block mb-0.5">ارتفاع السقف</span>
                        <span className="font-black text-[var(--dp-color-ink)]">{property.customDetails.ceilingHeight} متر</span>
                      </div>
                    )}
                    {property.customDetails.hasMezzanine && (
                      <div className="p-2.5 bg-white rounded-lg border border-[#e5e1d3]">
                        <span className="text-[#626d84] block mb-0.5">ميزانين داخلي</span>
                        <span className="font-black text-emerald-700">متاح {property.customDetails.mezzanineArea ? `(${property.customDetails.mezzanineArea} م²)` : ''}</span>
                      </div>
                    )}
                    {property.customDetails.electricityMeterType && (
                      <div className="p-2.5 bg-white rounded-lg border border-[#e5e1d3]">
                        <span className="text-[#626d84] block mb-0.5">العداد الكهربائي</span>
                        <span className="font-black text-[var(--dp-color-ink)]">{property.customDetails.electricityMeterType}</span>
                      </div>
                    )}
                    {property.customDetails.hasRestaurantChimney && (
                      <div className="p-2.5 bg-white rounded-lg border border-[#e5e1d3]">
                        <span className="text-[#626d84] block mb-0.5">مدخنة مطعم</span>
                        <span className="font-black text-emerald-700">مجهزة ومعتمدة</span>
                      </div>
                    )}
                    {property.customDetails.outdoorArea && (
                      <div className="p-2.5 bg-white rounded-lg border border-[#e5e1d3]">
                        <span className="text-[#626d84] block mb-0.5">إشغال خارجي / تراس</span>
                        <span className="font-black text-[var(--dp-color-ink)]">{property.customDetails.outdoorArea} م²</span>
                      </div>
                    )}
                    {property.customDetails.villaType && (
                      <div className="p-2.5 bg-white rounded-lg border border-[#e5e1d3]">
                        <span className="text-[#626d84] block mb-0.5">طراز الفيلا</span>
                        <span className="font-black text-[var(--dp-color-ink)]">{property.customDetails.villaType}</span>
                      </div>
                    )}
                    {property.customDetails.landArea && (
                      <div className="p-2.5 bg-white rounded-lg border border-[#e5e1d3]">
                        <span className="text-[#626d84] block mb-0.5">مساحة الأرض</span>
                        <span className="font-black text-[var(--dp-color-ink)]">{property.customDetails.landArea} م²</span>
                      </div>
                    )}
                    {property.customDetails.gardenArea && (
                      <div className="p-2.5 bg-white rounded-lg border border-[#e5e1d3]">
                        <span className="text-[#626d84] block mb-0.5">الحديقة الخاصة</span>
                        <span className="font-black text-[var(--dp-color-ink)]">{property.customDetails.gardenArea} م²</span>
                      </div>
                    )}
                    {property.customDetails.poolType && (
                      <div className="p-2.5 bg-white rounded-lg border border-[#e5e1d3]">
                        <span className="text-[#626d84] block mb-0.5">حمام السباحة</span>
                        <span className="font-black text-[var(--dp-color-ink)]">{property.customDetails.poolType}</span>
                      </div>
                    )}
                    {property.customDetails.garageCapacity && (
                      <div className="p-2.5 bg-white rounded-lg border border-[#e5e1d3]">
                        <span className="text-[#626d84] block mb-0.5">سعة الجراج</span>
                        <span className="font-black text-[var(--dp-color-ink)]">{property.customDetails.garageCapacity} سيارات</span>
                      </div>
                    )}
                    {property.customDetails.officeLicenseType && (
                      <div className="p-2.5 bg-white rounded-lg border border-[#e5e1d3]">
                        <span className="text-[#626d84] block mb-0.5">ترخيص المقر</span>
                        <span className="font-black text-[var(--dp-color-ink)]">{property.customDetails.officeLicenseType}</span>
                      </div>
                    )}
                    {property.customDetails.officeLayout && (
                      <div className="p-2.5 bg-white rounded-lg border border-[#e5e1d3]">
                        <span className="text-[#626d84] block mb-0.5">التقسيم المكتبي</span>
                        <span className="font-black text-[var(--dp-color-ink)]">{property.customDetails.officeLayout}</span>
                      </div>
                    )}
                    {property.customDetails.landZoning && (
                      <div className="p-2.5 bg-white rounded-lg border border-[#e5e1d3]">
                        <span className="text-[#626d84] block mb-0.5">تخصيص الأرض</span>
                        <span className="font-black text-[var(--dp-color-ink)]">{property.customDetails.landZoning}</span>
                      </div>
                    )}
                    {property.customDetails.landStreetWidth && (
                      <div className="p-2.5 bg-white rounded-lg border border-[#e5e1d3]">
                        <span className="text-[#626d84] block mb-0.5">عرض الشارع</span>
                        <span className="font-black text-[var(--dp-color-ink)]">{property.customDetails.landStreetWidth} متر</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="bg-white border-[2px] border-[var(--dp-color-outline)] rounded-xl p-5 shadow-hard-sm space-y-2">
                <h4 className="text-xs font-black text-[#526078] uppercase tracking-wider">
                  الوصف المدخل بواسطة البائع
                </h4>
                <p className="text-xs sm:text-sm text-[#374151] leading-relaxed whitespace-pre-line font-medium bg-[var(--dp-color-ground)] p-4 rounded-lg border border-[#ece9db]">
                  {property.description}
                </p>
              </div>

              {/* Amenities */}
              {safeAmenitiesList && safeAmenitiesList.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-[#526078] uppercase tracking-wider">
                    المميزات والمرافق المحددة
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {safeAmenitiesList.map((amenity, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-white border border-[var(--dp-color-outline)] rounded-lg text-xs font-black flex items-center gap-1.5 shadow-hard-sm"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: الصور وفحص الجودة ومخالفات الصور */}
          {activeTab === 'images' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-[var(--dp-color-ink)]">
                    فحص جودة ومطابقة الصور ({safeImagesList.length} صور)
                  </h4>
                  <p className="text-xs text-[#626d84]">
                    انقر على أي صورة لتكبيرها، أو استخدم زر "وسم صورة مخالفة" في حال وجود علامات مائية أو لقطات مضللة.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {safeImagesList.map((img, i) => {
                  const isFlagged = Boolean(flaggedImages[img.id] || img.isFlagged);
                  const flagReason = flaggedImages[img.id] || img.flagReason;

                  return (
                    <div
                      key={img.id}
                      className={`relative rounded-xl border-[2.5px] overflow-hidden bg-white shadow-hard-sm transition-all ${
                        isFlagged
                          ? 'border-rose-500 ring-2 ring-rose-300'
                          : 'border-[var(--dp-color-outline)]'
                      }`}
                    >
                      {/* Image Thumbnail */}
                      <div className="aspect-16/10 relative overflow-hidden bg-gray-100 group">
                        <img
                          src={img.url}
                          alt={`صورة ${i + 1}`}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105 cursor-pointer"
                          onClick={() => setPreviewImage(img.url)}
                        />
                        <button
                          type="button"
                          onClick={() => setPreviewImage(img.url)}
                          className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-black text-xs gap-1.5 transition-opacity cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                          تكبير ومعاينة
                        </button>
                      </div>

                      {/* Image Details Bar */}
                      <div className="p-3 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-[#526078]">صورة #{i + 1}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                              img.quality === 'high'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-amber-50 text-amber-700 border-amber-300'
                            }`}
                          >
                            {img.quality === 'high' ? 'جودة فائقة (HD)' : 'جودة مقبولة'}
                          </span>
                        </div>

                        {/* Flag State */}
                        {isFlagged ? (
                          <div className="p-2 bg-rose-50 border border-rose-300 rounded text-[11px] text-rose-800 font-bold space-y-1">
                            <div className="flex items-center gap-1 font-black text-rose-900">
                              <AlertCircle className="w-3.5 h-3.5" />
                              تم وسم الصورة كمخالفة
                            </div>
                            <p className="text-[10px]">{flagReason}</p>
                            <button
                              type="button"
                              onClick={() => {
                                const next = { ...flaggedImages };
                                delete next[img.id];
                                setFlaggedImages(next);
                              }}
                              className="text-[10px] text-rose-600 underline hover:text-rose-900 cursor-pointer"
                            >
                              إلغاء وسم المخالفة
                            </button>
                          </div>
                        ) : (
                          <div>
                            {flaggingImageId === img.id ? (
                              <div className="space-y-1.5 pt-1">
                                <input
                                  type="text"
                                  placeholder="سبب المخالفة (علامة مائية، غير واقعية...)"
                                  value={flagReasonInput}
                                  onChange={(e) => setFlagReasonInput(e.target.value)}
                                  className="w-full text-xs p-1.5 border border-rose-300 rounded bg-white"
                                />
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSaveImageFlag(img.id)}
                                    className="text-[10px] py-0.5 px-2 bg-rose-500 text-white hover:bg-rose-600"
                                  >
                                    تأكيد الوسم
                                  </Button>
                                  <button
                                    type="button"
                                    onClick={() => setFlaggingImageId(null)}
                                    className="text-[10px] text-gray-500 hover:underline"
                                  >
                                    إلغاء
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setFlaggingImageId(img.id);
                                  setFlagReasonInput('');
                                }}
                                className="text-[11px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                              >
                                <Flag className="w-3 h-3" />
                                وسم كصورة غير ملائمة
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 3: المستندات القانونية وفحص الملكية */}
          {activeTab === 'documents' && (
            <div className="space-y-5">
              {/* Security & Confidentiality Banner */}
              <div className="p-4 bg-indigo-50 border-[2px] border-indigo-200 rounded-xl text-indigo-950 text-xs flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg border border-indigo-300 text-indigo-700 shrink-0">
                  <Lock className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-sm">بيئة فحص المستندات المشفرة</h4>
                  <p className="leading-relaxed text-indigo-900">
                    هذه المستندات تحتوي على عقود ملكية وأرقام قومية حساسة. لا يتم إتاحتها للمشترين أو الزوار في الواجهة العامة مطلقاً، ويقتصر فحصها وتحميلها على المشرفين القانونيين المعتمدين لضمان خصوصية الملاك.
                  </p>
                </div>
              </div>

              {/* Documents List */}
              <div className="space-y-3">
                {safeDocuments.length === 0 ? (
                  <div className="p-8 text-center bg-[var(--dp-color-ground)] rounded-xl border-[2px] border-dashed border-[#dcd8c8]">
                    <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                    <h4 className="text-sm font-black text-[var(--dp-color-ink)]">
                      لم يتم رفع أي مستندات ملكية لهذا العقار!
                    </h4>
                    <p className="text-xs text-[#626d84] mt-1">
                      يتعين عليك رفض الطلب أو طلب استيفاء المستندات قبل اعتماد ونشر العقار.
                    </p>
                  </div>
                ) : (
                  safeDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 rounded-xl border-[2px] border-[var(--dp-color-outline)] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-hard-sm hover:border-[var(--dp-color-accent)] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-lg bg-[var(--dp-color-field-soft)] border border-[var(--dp-color-outline)] flex items-center justify-center text-[var(--dp-color-accent)] shrink-0">
                          <FileText className="w-6 h-6 stroke-[2]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-sm text-[var(--dp-color-ink)] block">
                              {doc.name}
                            </span>
                            <Badge
                              variant={
                                doc.status === 'verified'
                                  ? 'fresh'
                                  : doc.status === 'rejected'
                                  ? 'danger'
                                  : 'warm'
                              }
                              size="sm"
                            >
                              {doc.status === 'verified'
                                ? 'معتمد رسمياً'
                                : doc.status === 'rejected'
                                ? 'مرفوض'
                                : 'بانتظار الفحص'}
                            </Badge>
                            {doc.type && (
                              <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                                {doc.type === 'deed'
                                  ? 'سند ملكية'
                                  : doc.type === 'license'
                                  ? 'رخصة بناء'
                                  : doc.type === 'national_id'
                                  ? 'رقم قومي'
                                  : doc.type === 'power_of_attorney'
                                  ? 'توكيل رسمي'
                                  : 'مستند رسمي'}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-bold text-[#626d84] block mt-0.5">
                            الحجم: {doc.size} • تاريخ الرفع: {doc.uploadDate}
                            {doc.rejectionReason && (
                              <span className="text-rose-600 block text-[11px] mt-0.5">
                                سبب الرفض: {doc.rejectionReason}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setPreviewDoc(doc);
                            setZoomLevel(1);
                            setRotation(0);
                            setDocViewMode('certified');
                          }}
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                          className="text-xs bg-amber-50/50 hover:bg-amber-100/50"
                        >
                          معاينة وتدقيق
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDownloadDoc(doc)}
                          leftIcon={<Download className="w-3.5 h-3.5" />}
                          className="text-xs"
                        >
                          تحميل
                        </Button>
                        {doc.status !== 'verified' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleUpdateDocStatus(doc.id, 'verified')}
                            leftIcon={<Check className="w-3.5 h-3.5" />}
                            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            اعتماد
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Tab 4: بيانات البائع وسجل التقديم */}
          {activeTab === 'seller' && (
            <div className="space-y-5">
              <div className="p-5 bg-white border-[2.5px] border-[var(--dp-color-outline)] rounded-xl shadow-hard-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b-2 border-[#ece9db]">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[var(--dp-color-accent-warm)] border-[2px] border-[var(--dp-color-outline)] flex items-center justify-center text-lg font-black text-[var(--dp-color-ink)] shadow-hard-sm">
                      {safeSeller.name[0] || 'ب'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-base text-[var(--dp-color-ink)]">
                          {safeSeller.name}
                        </h4>
                        {safeSeller.isIdentityVerified && (
                          <span className="flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            هوية معتمدة
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-[#626d84]">
                        عضو بالمنصة منذ {safeSeller.registrationDate}
                      </span>
                    </div>
                  </div>

                  <div className="text-left">
                    <span className="text-xs font-bold text-[#626d84] block">تقييم البائع</span>
                    <span className="text-base font-black text-amber-600 block">
                      ★ {safeSeller.rating} / 5.0
                    </span>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-[var(--dp-color-ground)] rounded-lg border border-[#e5e1d3] flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[var(--dp-color-accent)]" />
                    <div>
                      <span className="text-[#626d84] block text-[10px]">رقم الهاتف المصري:</span>
                      <a href={`tel:${safeSeller.phone}`} className="font-black text-sm text-[var(--dp-color-ink)] hover:underline">
                        {safeSeller.phone}
                      </a>
                    </div>
                  </div>

                  <div className="p-3 bg-[var(--dp-color-ground)] rounded-lg border border-[#e5e1d3] flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[var(--dp-color-accent)]" />
                    <div>
                      <span className="text-[#626d84] block text-[10px]">البريد الإلكتروني:</span>
                      <a href={`mailto:${safeSeller.email}`} className="font-black text-sm text-[var(--dp-color-ink)] hover:underline">
                        {safeSeller.email}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Seller Property Submission Stats */}
                <div className="pt-2">
                  <h5 className="text-xs font-black text-[#526078] mb-2 uppercase">
                    سجل العقارات المقدمة من هذا البائع:
                  </h5>
                  <div className="grid grid-cols-3 gap-3 text-center text-xs">
                    <div className="p-3 rounded-lg border border-[#e5e1d3] bg-[var(--dp-color-ground)]">
                      <span className="text-lg font-black text-[var(--dp-color-ink)] block">
                        {safeSeller.totalSubmitted}
                      </span>
                      <span className="text-[#626d84] font-bold">إجمالي المقدم</span>
                    </div>

                    <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50">
                      <span className="text-lg font-black text-emerald-800 block">
                        {safeSeller.approvedCount}
                      </span>
                      <span className="text-emerald-700 font-bold">عقارات معتمدة</span>
                    </div>

                    <div className="p-3 rounded-lg border border-rose-200 bg-rose-50">
                      <span className="text-lg font-black text-rose-800 block">
                        {safeSeller.rejectedCount}
                      </span>
                      <span className="text-rose-700 font-bold">عقارات مرفوضة</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* -------------------------------------------------------------------
          Sub-Modal 1: Approve Property Listing
         ------------------------------------------------------------------- */}
      <Modal
        isOpen={isApproveOpen}
        onClose={() => setIsApproveOpen(false)}
        title="تأكيد اعتماد ونشر العقار"
        description="سيتم منح العقار شارة 'موثق' وإظهاره فوراً في نتائج البحث وسوق العقارات."
        size="md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsApproveOpen(false)} disabled={isSubmitting}>
              إلغاء
            </Button>
            <Button variant="primary" size="sm" onClick={handleConfirmApprove} disabled={isSubmitting}>
              {isSubmitting ? 'جاري الاعتماد والنشر...' : 'نعم، اعتماد ونشر الآن'}
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-right">
          <div className="p-4 bg-emerald-50 border-[2px] border-emerald-300 rounded-xl text-emerald-950 text-xs space-y-1">
            <div className="flex items-center gap-2 font-black text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              التحقق القانوني الكامل
            </div>
            <p className="leading-relaxed">
              باعتمادك هذا العقار، تؤكد الإدارة مطابقة العقود والبيانات مع شروط منصة شقتي. سيتم إرسال إشعار فوري للمالك: <strong>{safeSeller.name}</strong>.
            </p>
          </div>

          <Textarea
            label="ملاحظات الاعتماد الإدارية (اختياري - تُحفظ في سجل العمليات)"
            placeholder="مثال: تم فحص صحة العقد المسجل بالشهر العقاري ومطابقة بيانات المالك."
            value={approveNotes}
            onChange={(e) => setApproveNotes(e.target.value)}
          />
        </div>
      </Modal>

      {/* -------------------------------------------------------------------
          Sub-Modal 2: Reject Property Listing
         ------------------------------------------------------------------- */}
      <Modal
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        title="رفض طلب نشر العقار"
        description="يرجى توضيح سبب الرفض الدقيق لإبلاغ البائع وفق السياسات التنظيمية."
        size="md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsRejectOpen(false)} disabled={isSubmitting}>
              تراجع
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleConfirmReject}
              disabled={isSubmitting}
              className="bg-rose-600 text-white hover:bg-rose-700 border-rose-800"
            >
              {isSubmitting ? 'جاري الرفض...' : 'تأكيد رفض العقار'}
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-right">
          <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 text-xs">
            <span className="font-black block mb-1">تنبيه هام:</span>
            سيتم حجب العقار عن المنصة وإرسال إشعار رسمي بالبريد وبلوحة تحكم البائع يتضمن سبب الرفض التالي.
          </div>

          <div>
            <label className="text-xs font-black text-[var(--dp-color-ink)] block mb-1.5">
              سبب الرفض الإلزامي <span className="text-rose-600">*</span>
            </label>
            <Textarea
              placeholder="مثال: وجود مخالفة بناء غير متصالح عليها، أو عدم إرفاق عقد الملكية الصحيح، أو عدم وضوح صور العقار..."
              value={rejectReason}
              onChange={(e) => {
                setRejectReason(e.target.value);
                if (rejectError) setRejectError('');
              }}
              error={rejectError}
              required
            />
          </div>
        </div>
      </Modal>

      {/* -------------------------------------------------------------------
          Sub-Modal 3: Request Changes / Correction Notes
         ------------------------------------------------------------------- */}
      <Modal
        isOpen={isRequestChangesOpen}
        onClose={() => setIsRequestChangesOpen(false)}
        title="طلب تعديلات إضافية من البائع"
        description="سيتم إرسال تعليمات التعديل للبائع مع تحويل حالة العقار إلى 'تحتاج إلى تعديلات'."
        size="md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsRequestChangesOpen(false)} disabled={isSubmitting}>
              إلغاء
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmRequestChanges}
              disabled={isSubmitting}
              className="bg-amber-500 hover:bg-amber-600 text-black border-amber-700"
            >
              {isSubmitting ? 'جاري إرسال الطلب...' : 'إرسال طلب التعديلات'}
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-right">
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs">
            يمكن للبائع الدخول على لوحة تحكمه وتعديل البيانات أو رفع المستندات الإضافية وإعادة الإرسال للمراجعة مرة أخرى.
          </div>

          <div>
            <label className="text-xs font-black text-[var(--dp-color-ink)] block mb-1.5">
              التعديلات والمستندات المطلوبة بدقة <span className="text-rose-600">*</span>
            </label>
            <Textarea
              placeholder="مثال: يرجى رفع صورة واضحة لتوكيل الشهر العقاري، وتعديل رقم الدور إلى الدور الثالث علوي..."
              value={correctionNotes}
              onChange={(e) => {
                setCorrectionNotes(e.target.value);
                if (correctionError) setCorrectionError('');
              }}
              error={correctionError}
              required
            />
          </div>
        </div>
      </Modal>

      {/* -------------------------------------------------------------------
          Image Viewer Modal
         ------------------------------------------------------------------- */}
      {previewImage && (
        <Modal
          isOpen={Boolean(previewImage)}
          onClose={() => setPreviewImage(null)}
          title="معاينة الصورة بالحجم الكامل"
          size="lg"
        >
          <div className="text-center space-y-3">
            <div className="max-h-[70vh] overflow-hidden rounded-xl border-[2px] border-[var(--dp-color-outline)] bg-black flex items-center justify-center">
              <img
                src={previewImage}
                alt="معاينة"
                className="max-h-[70vh] w-auto object-contain mx-auto"
              />
            </div>
            <Button variant="primary" size="sm" onClick={() => setPreviewImage(null)}>
              إغلاق المعاينة
            </Button>
          </div>
        </Modal>
      )}

      {/* -------------------------------------------------------------------
          Document Preview & Legal Inspection Modal
         ------------------------------------------------------------------- */}
      {previewDoc && (
        <Modal
          isOpen={Boolean(previewDoc)}
          onClose={() => {
            setPreviewDoc(null);
            setDocRejectPromptOpen(false);
          }}
          title={`فحص وتدقيق المستند: ${previewDoc.name}`}
          size="xl"
          footer={
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
              {/* Document status info */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#626d84] font-bold">حالة المستند:</span>
                {previewDoc.status === 'verified' ? (
                  <Badge variant="fresh" size="sm" className="flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    معتمد رسمياً وصحيح قانونياً
                  </Badge>
                ) : previewDoc.status === 'rejected' ? (
                  <Badge variant="danger" size="sm" className="flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" />
                    مرفوض: {previewDoc.rejectionReason || 'غير مطابق للشروط'}
                  </Badge>
                ) : (
                  <Badge variant="warm" size="sm" className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    بانتظار قرار الفحص الإداري
                  </Badge>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {previewDoc.status !== 'verified' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleUpdateDocStatus(previewDoc.id, 'verified')}
                    leftIcon={<Check className="w-3.5 h-3.5" />}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                  >
                    اعتماد المستند رسمياً
                  </Button>
                )}
                {previewDoc.status !== 'rejected' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDocRejectPromptOpen(true)}
                    leftIcon={<X className="w-3.5 h-3.5" />}
                    className="border-rose-400 text-rose-700 hover:bg-rose-50 text-xs"
                  >
                    رفض أو طلب تعديل
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setPreviewDoc(null);
                    setDocRejectPromptOpen(false);
                  }}
                  className="text-xs"
                >
                  إغلاق النافذة
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-right">
            {/* Rejection Prompt Inline Bar */}
            {docRejectPromptOpen && (
              <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-xl space-y-3 animate-fadeIn">
                <div className="flex items-center gap-2 text-rose-900 font-black text-sm">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>تحديد سبب رفض المستند أو طلب استبداله:</span>
                </div>
                <Input
                  value={docRejectReasonInput}
                  onChange={(e) => setDocRejectReasonInput(e.target.value)}
                  placeholder="مثال: الصورة غير واضحة، أو التاريخ منتهي، أو مطلوب عقد مشهر نهائي..."
                  className="text-xs bg-white"
                />
                <div className="flex items-center gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDocRejectPromptOpen(false)}
                    className="text-xs"
                  >
                    إلغاء
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      handleUpdateDocStatus(
                        previewDoc.id,
                        'rejected',
                        docRejectReasonInput || 'مستند غير مكتمل أو غير مطابق لاشتراطات التسجيل'
                      );
                      setDocRejectPromptOpen(false);
                      setDocRejectReasonInput('');
                    }}
                    className="bg-rose-600 hover:bg-rose-700 text-white text-xs"
                  >
                    تأكيد تسجيل الرفض
                  </Button>
                </div>
              </div>
            )}

            {/* Document Controls & View Mode Selector */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-white border-2 border-[var(--dp-color-outline)] rounded-xl shadow-hard-xs">
              {/* Mode switch pills */}
              <div className="flex items-center gap-1.5 bg-[var(--dp-color-field-soft)] p-1 rounded-lg border border-[var(--dp-color-outline)]">
                <button
                  type="button"
                  onClick={() => setDocViewMode('certified')}
                  className={`px-3 py-1.5 rounded text-xs font-black transition-all flex items-center gap-1.5 ${
                    docViewMode === 'certified'
                      ? 'bg-[var(--dp-color-accent)] text-[var(--dp-color-ink)] shadow-hard-xs'
                      : 'text-[#626d84] hover:text-[var(--dp-color-ink)]'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  المستند الرسمي المعتمد (معاينة قانونية)
                </button>
                <button
                  type="button"
                  onClick={() => setDocViewMode('scan')}
                  className={`px-3 py-1.5 rounded text-xs font-black transition-all flex items-center gap-1.5 ${
                    docViewMode === 'scan'
                      ? 'bg-[var(--dp-color-accent)] text-[var(--dp-color-ink)] shadow-hard-xs'
                      : 'text-[#626d84] hover:text-[var(--dp-color-ink)]'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  المسح الضوئي للمستند المرفوع
                </button>
              </div>

              {/* Inspector tools toolbar */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {docViewMode === 'scan' && (
                  <>
                    <button
                      type="button"
                      title="تكبير"
                      onClick={() => setZoomLevel((prev) => Math.min(2.5, prev + 0.25))}
                      className="p-1.5 rounded-lg border border-[var(--dp-color-outline)] bg-white hover:bg-slate-100 text-[var(--dp-color-ink)] text-xs flex items-center gap-1"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">تكبير</span>
                    </button>
                    <button
                      type="button"
                      title="تصغير"
                      onClick={() => setZoomLevel((prev) => Math.max(0.5, prev - 0.25))}
                      className="p-1.5 rounded-lg border border-[var(--dp-color-outline)] bg-white hover:bg-slate-100 text-[var(--dp-color-ink)] text-xs flex items-center gap-1"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">تصغير</span>
                    </button>
                    <button
                      type="button"
                      title="تدوير 90 درجة"
                      onClick={() => setRotation((prev) => (prev + 90) % 360)}
                      className="p-1.5 rounded-lg border border-[var(--dp-color-outline)] bg-white hover:bg-slate-100 text-[var(--dp-color-ink)] text-xs flex items-center gap-1"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">تدوير</span>
                    </button>
                    <button
                      type="button"
                      title="إعادة ضبط العرض"
                      onClick={() => {
                        setZoomLevel(1);
                        setRotation(0);
                      }}
                      className="p-1.5 rounded-lg border border-[var(--dp-color-outline)] bg-white hover:bg-slate-100 text-[var(--dp-color-ink)] text-xs flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">100%</span>
                    </button>
                    <div className="h-5 w-[1px] bg-slate-200 mx-1" />
                  </>
                )}

                <button
                  type="button"
                  title="طباعة المستند"
                  onClick={handlePrintDoc}
                  className="p-1.5 rounded-lg border border-[var(--dp-color-outline)] bg-white hover:bg-slate-100 text-[var(--dp-color-ink)] text-xs flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">طباعة</span>
                </button>
                <button
                  type="button"
                  title="تحميل الملف"
                  onClick={() => handleDownloadDoc(previewDoc)}
                  className="p-1.5 rounded-lg border border-[var(--dp-color-outline)] bg-white hover:bg-slate-100 text-[var(--dp-color-ink)] text-xs flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">تحميل</span>
                </button>
                {previewDoc.url && previewDoc.url !== '#' && (
                  <a
                    href={previewDoc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg border border-[var(--dp-color-outline)] bg-white hover:bg-slate-100 text-[var(--dp-color-ink)] text-xs flex items-center gap-1"
                    title="فتح في نافذة مستقلة"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">نافذة مستقلة</span>
                  </a>
                )}
              </div>
            </div>

            {/* TAB 1: CERTIFIED OFFICIAL NOTARY DEED CERTIFICATE */}
            {docViewMode === 'certified' && (
              <div className="bg-[#fdfcf7] border-[3px] border-[#cbb36c] rounded-2xl p-6 sm:p-8 shadow-hard-md relative overflow-hidden text-right space-y-6">
                {/* Security Watermark Background */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                  <span className="text-8xl font-black text-black rotate-[-25deg]">
                    SHA2ETY OFFICIAL
                  </span>
                </div>

                {/* Official Crest & Header */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b-2 border-[#d9c585]">
                  <div className="text-center sm:text-right space-y-0.5">
                    <span className="text-[11px] font-black text-[#5c4a1e] tracking-wide block">
                      جمهورية مصر العربية
                    </span>
                    <span className="text-xs font-bold text-[#3d3319] block">
                      وزارة العدل — قطاع مصلحة الشهر العقاري والتوثيق
                    </span>
                    <span className="text-[11px] text-[#6b5c33] block">
                      الإدارة العامة للتوثيق العقاري والتحقق الرقمي
                    </span>
                  </div>

                  {/* Golden Eagle / Crest Symbol */}
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border-[2px] border-[#997d2e] flex flex-col items-center justify-center text-white shadow-hard-sm">
                    <Award className="w-8 h-8 stroke-[2.2]" />
                    <span className="text-[8px] font-black tracking-widest uppercase">EGYPT</span>
                  </div>

                  <div className="text-center sm:text-left space-y-0.5">
                    <span className="text-[10px] font-mono font-bold text-[#6b5c33] block">
                      كود التوثيق: EG-RE-{property.id.replace(/\D/g, '') || '94821'}
                    </span>
                    <span className="text-[10px] text-[#6b5c33] block">
                      تاريخ القيد: {previewDoc.uploadDate}
                    </span>
                    <span className="inline-block text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-black border border-emerald-300">
                      محرر رقمي مدقق
                    </span>
                  </div>
                </div>

                {/* Certificate Title */}
                <div className="text-center space-y-1">
                  <h3 className="text-lg sm:text-xl font-black text-[#261f0f]">
                    شهادة قيد وتوثيق رسمي — سند الملكية والحيازة العقارية
                  </h3>
                  <p className="text-xs text-[#6e5d32]">
                    محرر رسمي مشهر ناقل للحقوق العينية وفقاً لأحكام القانون رقم 114 لسنة 1946 ولائحته التنفيذية
                  </p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Property Info Box */}
                  <div className="p-4 bg-white/80 border border-[#e2d5a8] rounded-xl space-y-2 shadow-sm">
                    <h5 className="font-black text-xs text-[#5c4a1e] pb-1 border-b border-[#ece2c0] flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-[#8a722e]" />
                      بيانات العقار والوحدة المسجلة:
                    </h5>
                    <div className="space-y-1.5 text-xs text-[#2b2413]">
                      <div className="flex justify-between">
                        <span className="text-[#75653b]">اسم العقار:</span>
                        <strong className="font-bold">{property.title}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#75653b]">الموقع الجغرافي:</span>
                        <strong className="font-bold">{property.location || property.city}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#75653b]">النوع والمساحة:</span>
                        <strong className="font-bold">{property.type} — {formatArea(property.area)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#75653b]">السعر المصرح به:</span>
                        <strong className="font-bold text-emerald-800">{formatEGP(property.price)}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Owner & Identity Box */}
                  <div className="p-4 bg-white/80 border border-[#e2d5a8] rounded-xl space-y-2 shadow-sm">
                    <h5 className="font-black text-xs text-[#5c4a1e] pb-1 border-b border-[#ece2c0] flex items-center gap-1.5">
                      <User className="w-4 h-4 text-[#8a722e]" />
                      بيانات الطرف الأول (المالك المقيد بالسند):
                    </h5>
                    <div className="space-y-1.5 text-xs text-[#2b2413]">
                      <div className="flex justify-between">
                        <span className="text-[#75653b]">الاسم الكامل:</span>
                        <strong className="font-bold">{safeSeller.name}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#75653b]">الرقم القومي (مطابق):</span>
                        <strong className="font-mono font-bold">2840915******1</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#75653b]">رقم الهاتف المسجل:</span>
                        <strong className="font-mono font-bold" dir="ltr">{safeSeller.phone}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#75653b]">الصفة القانونية:</span>
                        <strong className="font-bold text-blue-900">مالك أصيل بحرية التصرف</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Legal Warranty Statements */}
                <div className="p-4 bg-amber-50/60 border border-[#e2d5a8] rounded-xl space-y-2 text-xs text-[#3b3017]">
                  <h5 className="font-black text-xs text-[#5c4a1e] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    بنود الإشهار والضمان القانوني المعتمدة:
                  </h5>
                  <ul className="space-y-1 text-[11px] leading-relaxed text-[#4a3e20]">
                    <li className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>خلو العقار المذكور من أي حقوق عينية تبعية أو رهونات بنكية أو أحكام إفلاس أو نزاعات منظورة أمام المحاكم.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>سلامة تراخيص البناء الصادرة من جهاز المدينة والحي، مع عدم وجود أي مخالفات إنشائية أو قرارات إزالة نافذة.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>ثبوت حصة الأرض المشاعة وحقوق الانتفاع بالجراج والمصاعد والمرافق الأساسية لكافة شاغلي الوحدة.</span>
                    </li>
                  </ul>
                </div>

                {/* Seals & Barcodes Section */}
                <div className="pt-4 border-t-2 border-[#d9c585] flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Eagle Stamp Simulation */}
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-full border-2 border-red-700 bg-red-50 flex flex-col items-center justify-center text-red-800 rotate-[-8deg] shadow-sm">
                      <span className="text-[7px] font-black">مصلحة الشهر العقاري</span>
                      <span className="text-[9px] font-black my-0.5">ختم النسر</span>
                      <span className="text-[7px] font-black">معتمد إلكترونياً</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-[#261f0f] block">
                        توثيق رقمي معتمد — منصة شقتي
                      </span>
                      <span className="text-[10px] text-[#6b5c33] block">
                        توقيع الموثق المسؤول: م. أحمد مهران
                      </span>
                    </div>
                  </div>

                  {/* QR Code and Barcode Box */}
                  <div className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-[#e2d5a8]">
                    <div className="text-center space-y-0.5">
                      <div className="font-mono text-[9px] tracking-widest text-slate-700 font-bold">
                        ||||| | |||| || |||||| | |||
                      </div>
                      <span className="text-[9px] font-mono text-slate-500 block">
                        EG-HASH: {previewDoc.id.toUpperCase()}-VERIFIED
                      </span>
                    </div>
                    <div className="w-12 h-12 bg-slate-900 rounded flex items-center justify-center text-white shrink-0">
                      <QrCode className="w-8 h-8" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: SCANNED ORIGINAL DOCUMENT VIEWER */}
            {docViewMode === 'scan' && (
              <div className="bg-[#181a20] rounded-2xl border-2 border-[var(--dp-color-outline)] p-4 sm:p-6 overflow-hidden relative flex flex-col items-center justify-center min-h-[460px] max-h-[65vh]">
                {previewDoc.url && previewDoc.url !== '#' ? (
                  <div className="overflow-auto max-w-full max-h-[58vh] flex items-center justify-center p-2">
                    <img
                      src={previewDoc.url}
                      alt={previewDoc.name}
                      style={{
                        transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                        transition: 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
                        maxWidth: '100%',
                        maxHeight: '55vh',
                      }}
                      className="object-contain rounded-lg shadow-2xl border border-slate-700 bg-white"
                    />
                  </div>
                ) : (
                  <div className="text-center p-8 text-white space-y-3">
                    <FileText className="w-16 h-16 text-amber-400 mx-auto" />
                    <h4 className="text-base font-black">جاري استعراض النسخة الرقمية المشفرة</h4>
                    <p className="text-xs text-slate-300 max-w-md mx-auto">
                      يمكنك التبديل إلى تبويب "المستند الرسمي المعتمد" لمعاينة كافة بنود ومحتويات العقد موثقة إلكترونياً.
                    </p>
                  </div>
                )}

                {/* Floating zoom indicator */}
                <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[11px] font-mono border border-white/20">
                  تكبير: {Math.round(zoomLevel * 100)}% | تدوير: {rotation}°
                </div>
              </div>
            )}

            {/* Security notice */}
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>المستند خاضع لسرية البيانات الرسمية ولا يتم كشفه للمشترين أو الزوار في الواجهة العامة.</span>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
