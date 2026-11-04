import React, { useState, useMemo } from 'react';
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

  const safeDocuments = useMemo(() => {
    if (property.documents && Array.isArray(property.documents)) {
      return property.documents;
    }
    return [];
  }, [property]);

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

  // Document preview simulation
  const [previewDoc, setPreviewDoc] = useState<PropertyDocument | null>(null);

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

                  <div className="p-3 bg-[var(--dp-color-ground)] rounded-lg border border-[#e5e1d3]">
                    <span className="text-[#626d84] block mb-1">عدد الغرف</span>
                    <span className="font-black text-sm text-[var(--dp-color-ink)]">{property.bedrooms} غرف</span>
                  </div>

                  <div className="p-3 bg-[var(--dp-color-ground)] rounded-lg border border-[#e5e1d3]">
                    <span className="text-[#626d84] block mb-1">عدد الحمامات</span>
                    <span className="font-black text-sm text-[var(--dp-color-ink)]">{property.bathrooms} حمام</span>
                  </div>

                  <div className="p-3 bg-[var(--dp-color-ground)] rounded-lg border border-[#e5e1d3]">
                    <span className="text-[#626d84] block mb-1">الدور / إجمالي الأدوار</span>
                    <span className="font-black text-sm text-[var(--dp-color-ink)]">
                      {String(property.floor) === '0' ? 'أرضي' : property.floor ? `الدور ${property.floor}` : 'غير محدد'} (من {property.totalFloors || 5})
                    </span>
                  </div>
                </div>
              </div>

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
                      className="p-4 rounded-xl border-[2px] border-[var(--dp-color-outline)] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-hard-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-lg bg-[var(--dp-color-field-soft)] border border-[var(--dp-color-outline)] flex items-center justify-center text-[var(--dp-color-accent)] shrink-0">
                          <FileText className="w-6 h-6 stroke-[2]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-[var(--dp-color-ink)] block">
                              {doc.name}
                            </span>
                            <Badge
                              variant={doc.status === 'verified' ? 'fresh' : 'warm'}
                              size="sm"
                            >
                              {doc.status === 'verified' ? 'معتمد رسمياً' : 'بانتظار الفحص'}
                            </Badge>
                          </div>
                          <span className="text-[11px] font-bold text-[#626d84] block mt-0.5">
                            الحجم: {doc.size} • تاريخ الرفع: {doc.uploadDate}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPreviewDoc(doc)}
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                          className="text-xs"
                        >
                          معاينة المستند
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            alert(`جاري تحميل ملف "${doc.name}" المشفر تحت إشراف حساب الإدارة.`);
                          }}
                          leftIcon={<Download className="w-3.5 h-3.5" />}
                          className="text-xs"
                        >
                          تحميل
                        </Button>
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
          Document Preview Modal
         ------------------------------------------------------------------- */}
      {previewDoc && (
        <Modal
          isOpen={Boolean(previewDoc)}
          onClose={() => setPreviewDoc(null)}
          title={`فحص المستند: ${previewDoc.name}`}
          size="md"
          footer={
            <Button variant="primary" size="sm" onClick={() => setPreviewDoc(null)}>
              تم الإطلاع
            </Button>
          }
        >
          <div className="space-y-4 text-right">
            <div className="p-6 bg-[var(--dp-color-ground)] rounded-xl border-[2px] border-[var(--dp-color-outline)] text-center space-y-3">
              <FileText className="w-16 h-16 text-[var(--dp-color-accent)] mx-auto" />
              <h4 className="text-base font-black text-[var(--dp-color-ink)]">
                {previewDoc.name}
              </h4>
              <p className="text-xs text-[#626d84]">
                المستند مشفر ومحمي بحقوق خصوصية المالك • حجم الملف: {previewDoc.size}
              </p>
              <div className="p-3 bg-white border border-[#ece9db] rounded-lg text-xs font-mono text-[#4a5568]">
                SHA-256 Checksum: e4d909c290d0fb1ca068ffaddf22cbd0
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
