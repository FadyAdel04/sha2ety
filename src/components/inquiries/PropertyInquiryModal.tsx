import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { PropertyItem } from '@/components/ui/PropertyCard';
import { formatEGP } from '@/lib/utils';
import { createPropertyInquiry, ConversationThread } from '@/services/communicationService';
import {
  MessageSquare,
  Send,
  CheckCircle2,
  AlertTriangle,
  Phone,
  User,
  ShieldCheck,
  Building,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';

export interface PropertyInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: PropertyItem;
  onSuccess?: (conversation: ConversationThread) => void;
}

export const PropertyInquiryModal: React.FC<PropertyInquiryModalProps> = ({
  isOpen,
  onClose,
  property,
  onSuccess,
}) => {
  const { user, isAuthenticated } = useAuth();

  const [buyerName, setBuyerName] = useState(user?.fullName || '');
  const [buyerPhone, setBuyerPhone] = useState(user?.phone || '');
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdConv, setCreatedConv] = useState<ConversationThread | null>(null);

  // Sync user details if loaded/changed
  useEffect(() => {
    if (user) {
      if (!buyerName) setBuyerName(user.fullName || '');
      if (!buyerPhone) setBuyerPhone(user.phone || '');
    }
  }, [user]);

  // Reset states on open
  useEffect(() => {
    if (isOpen) {
      setCreatedConv(null);
      setErrorMsg('');
      if (!message) {
        setMessage('السلام عليكم، هل السعر المعروض قابل للتفاوض البسيط في حالة السداد كاش؟ وهل العقار متاح للمعاينة الميدانية هذا الأسبوع؟');
      }
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    const res = createPropertyInquiry({
      property,
      buyerName,
      buyerPhone,
      message,
      buyerId: user?.id || 'demo-buyer-1',
    });

    setIsSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.error || 'حدث خطأ أثناء إرسال الاستفسار، يرجى المحاولة لاحقاً.');
      return;
    }

    if (res.conversation) {
      setCreatedConv(res.conversation);
      if (onSuccess) onSuccess(res.conversation);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={createdConv ? 'تم إرسال استفسارك بنجاح' : 'إرسال استفسار مباشر لمالك العقار'}
      description={
        createdConv
          ? 'تم فتح قناة محادثة خاصة ومباشرة بينك وبين مالك العقار.'
          : `اطرح أسئلتك بخصوص الأسعار، تسهيلات السداد، أو مواعيد التسليم لعقار "${property.title}".`
      }
      size="md"
      footer={
        createdConv ? (
          <div className="flex items-center justify-between w-full">
            <Button variant="outline" size="sm" onClick={onClose}>
              إغلاق النافذة
            </Button>
            <Link to="/buyer/inquiries" onClick={onClose}>
              <Button variant="primary" size="sm" rightIcon={<ArrowLeft className="w-4 h-4" />}>
                الانتقال للمحادثة
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <Button variant="outline" size="sm" onClick={onClose}>
              إلغاء
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              rightIcon={<Send className="w-4 h-4" />}
            >
              إرسال الاستفسار
            </Button>
          </>
        )
      }
    >
      <div className="space-y-4 text-right">
        {createdConv ? (
          /* Success Screen */
          <div className="p-6 bg-[var(--dp-color-field-soft)] border-[2.5px] border-[var(--dp-color-outline)] rounded-2xl text-center space-y-4 shadow-hard-sm">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500 border-[2px] border-[var(--dp-color-outline)] flex items-center justify-center text-white mx-auto shadow-hard-sm">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div>
              <h3 className="text-lg font-black text-[var(--dp-color-ink)]">
                وصل استفسارك إلى مالك العقار بنجاح!
              </h3>
              <p className="text-xs text-[#526078] mt-1.5 leading-relaxed max-w-sm mx-auto">
                تلقى المالك إشعاراً فورياً. ستصلك رسالة الرد في صندوق الاستفسارات بلوحة تحكمك، وسيتم تنبيهك فور الرد.
              </p>
            </div>

            <div className="p-3 bg-white border border-[var(--dp-color-outline)] rounded-xl text-xs text-right space-y-1">
              <span className="text-[#8b95aa] block font-bold text-[11px]">نص الاستفسار المرسل:</span>
              <p className="font-bold text-[var(--dp-color-ink)] italic">"{createdConv.lastMessage}"</p>
            </div>
          </div>
        ) : (
          /* Form Screen */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Property Summary Pill */}
            <div className="p-3 bg-[var(--dp-color-ground)] border-[2px] border-[var(--dp-color-outline)] rounded-xl flex items-center gap-3 shadow-hard-sm">
              <img
                src={property.imageUrl}
                alt={property.title}
                className="w-14 h-14 rounded-lg object-cover border border-[var(--dp-color-outline)] shrink-0"
              />
              <div className="space-y-0.5">
                <span className="font-black text-xs text-[var(--dp-color-ink)] line-clamp-1 block">
                  {property.title}
                </span>
                <span className="text-[11px] font-bold text-[#626d84] block">
                  {property.location}
                </span>
                <span className="text-xs font-black text-[var(--dp-color-accent)] block">
                  {formatEGP(property.price)}
                </span>
              </div>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="p-3 bg-rose-50 border-[2px] border-rose-300 rounded-xl text-rose-900 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-bold">{errorMsg}</span>
              </div>
            )}

            {/* Buyer Name */}
            <Input
              label="الاسم بالكامل"
              required
              placeholder="مثال: كريم عبد الله"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              rightIcon={<User className="w-4 h-4 text-[#8b95aa]" />}
            />

            {/* Egyptian Phone */}
            <Input
              label="رقم الهاتف للتواصل (مصر)"
              type="tel"
              required
              placeholder="01xxxxxxxxx"
              value={buyerPhone}
              onChange={(e) => setBuyerPhone(e.target.value)}
              helperText="يبدأ بـ 01 ويتكون من 11 رقماً للتواصل المباشر مع البائع"
              rightIcon={<Phone className="w-4 h-4 text-[#8b95aa]" />}
            />

            {/* Message with Character counter */}
            <div>
              <Textarea
                label="نص الاستفسار"
                required
                rows={4}
                placeholder="اكتب كل أسئلتك للمالك بخصوص السعر، التراخيص، إمكانية التقسيط، إلخ..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={1000}
              />
              <div className="flex items-center justify-between text-[11px] text-[#8b95aa] mt-1 font-bold">
                <span>يرجى عدم مشاركة أرقام بطاقات بنكية أو معلومات سرية</span>
                <span>{message.length} / 1000 حرف</span>
              </div>
            </div>

            {/* Anti-spam & Privacy Notice */}
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 text-[11px] leading-relaxed flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-700 shrink-0" />
              <span>محادثة مشفرة ومحمية بسياسة مكافحة الرسائل الاحتيالية لمنصة شقتي.</span>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};

