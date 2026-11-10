import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth, UserRole } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Notification } from '@/components/ui/Notification';
import {
  User,
  Phone,
  Mail,
  Camera,
  ShieldCheck,
  HeartHandshake,
  Lock,
  Save,
  CheckCircle2,
  AlertTriangle,
  Info,
  LogOut,
  Building,
} from 'lucide-react';

export const BuyerProfilePage: React.FC = () => {
  const { user, switchUserRole, logout } = useAuth();
  const navigate = useNavigate();
  const [isSwitching, setIsSwitching] = useState(false);

  const [fullName, setFullName] = useState(user?.fullName || 'كريم عبد الله');
  const [phone, setPhone] = useState(user?.phone || '01098765432');
  const [avatarUrl, setAvatarUrl] = useState<string>(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
  );

  // Preferences
  const [preferredCity, setPreferredCity] = useState('cairo_new');
  const [budgetRange, setBudgetRange] = useState('6_to_10');
  const [preferredType, setPreferredType] = useState('apartment');

  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Email Change Modal State
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailSentNotice, setEmailSentNotice] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Egyptian Phone validation: 11 digits starting with 010, 011, 012, or 015
  const validateEgyptianPhone = (num: string) => {
    const cleaned = num.replace(/\s+/g, '');
    const regex = /^01[0125][0-9]{8}$/;
    return regex.test(cleaned);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert('حجم الصورة كبير جداً، الحد الأقصى 5 ميجابايت.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setAvatarUrl(uploadEvent.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('يرجى إدخال الاسم بالكامل.');
      return;
    }

    if (!validateEgyptianPhone(phone)) {
      setErrorMessage('يرجى إدخال رقم هاتف مصري صحيح (11 رقماً يبدأ بـ 010, 011, 012, 015).');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      // Update session in localStorage if user is active
      try {
        const storedUser = localStorage.getItem('sha2ety_auth_user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          parsed.fullName = fullName.trim();
          parsed.phone = phone.trim();
          parsed.avatarUrl = avatarUrl;
          localStorage.setItem('sha2ety_auth_user', JSON.stringify(parsed));
        }
      } catch {
        // Ignore
      }

      setIsLoading(false);
      setToastMessage('تم تحديث بيانات حسابك وتفضيلاتك بنجاح.');
    }, 500);
  };

  const handleRequestEmailChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.includes('@') || !newEmail.includes('.')) {
      alert('يرجى إدخال بريد إلكتروني صالح.');
      return;
    }
    setEmailSentNotice(true);
  };

  return (
    <DashboardLayout
      role="buyer"
      title="حسابي"
      subtitle="تعديل بياناتك الشخصية، رقم الهاتف، وإعدادات تفضيلات البحث العقاري."
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="mb-6 animate-fadeIn text-right">
          <Notification
            variant="success"
            title="تم بنجاح"
            message={toastMessage}
            onClose={() => setToastMessage(null)}
          />
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl border-[2.5px] border-rose-500 bg-rose-50 text-right flex items-center gap-3 text-rose-800">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span className="font-bold text-sm">{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-8 text-right">
        {/* Main Grid: Profile Info & Avatar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Right Column: Avatar & Account Status */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-6 shadow-hard text-center space-y-4">
              <div className="relative inline-block mx-auto">
                <img
                  src={avatarUrl}
                  alt={fullName}
                  className="w-28 h-28 rounded-3xl object-cover border-[3px] border-[var(--dp-color-outline)] shadow-hard-sm mx-auto"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-1 right-1 p-2 rounded-xl bg-[var(--dp-color-accent)] text-white border-[2px] border-[var(--dp-color-outline)] hover:scale-105 transition-transform cursor-pointer shadow-hard-xs"
                  title="تغيير صورة الحساب"
                  aria-label="تغيير صورة الحساب"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              <div>
                <h3 className="font-black text-lg text-[var(--dp-color-ink)]">
                  {fullName}
                </h3>
                <span className="text-xs text-[#626d84] font-bold block mt-0.5">
                  {user?.email || 'buyer@sha2ety.eg'}
                </span>
                <div className="mt-2 flex justify-center">
                  <Badge variant="fresh" size="sm">
                    مشتري معتمد
                  </Badge>
                </div>
              </div>

              <div className="pt-3 border-t border-[#ece9db] text-xs text-[#626d84] font-bold space-y-1 text-right">
                <div className="flex items-center justify-between">
                  <span>حالة التحقق:</span>
                  <span className="text-emerald-700 font-black flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    مؤكد برقم الهاتف
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>تاريخ الانضمام:</span>
                  <span className="text-[var(--dp-color-ink)] font-black">أكتوبر ٢٠٢٦</span>
                </div>
              </div>
            </div>

            {/* Smart Alerts Card */}
            <div className="bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-6 shadow-hard space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--dp-color-accent-warm)] border-[2px] border-[var(--dp-color-outline)] flex items-center justify-center text-[var(--dp-color-ink)] shadow-hard-xs">
                <HeartHandshake className="w-5 h-5 stroke-[2.5]" />
              </div>
              <h4 className="font-black text-sm text-[var(--dp-color-ink)]">
                توصيات مخصصة لاهتماماتك
              </h4>
              <p className="text-xs text-[#526078] font-bold leading-relaxed">
                نقوم بمطابقة تفضيلاتك وميزانيتك مع العقارات الجديدة فور توثيقها رسميًا من الفريق القانوني لنوافيك بأفضل الفرص أولاً بأول.
              </p>
            </div>
          </div>

          {/* Left Column: Form Fields */}
          <div className="lg:col-span-8 space-y-6">
            {/* Section 1: Basic Personal Info */}
            <div className="bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-6 sm:p-8 shadow-hard space-y-5">
              <div className="border-b-2 border-[#ece9db] pb-3">
                <h3 className="text-lg font-black text-[var(--dp-color-ink)]">
                  البيانات الشخصية
                </h3>
                <p className="text-xs text-[#626d84] font-bold mt-0.5">
                  الاسم ورقم الهاتف المستخدمين في حجوزات المعاينة مع الملاك.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1">
                    الاسم بالكامل <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="كريم عبد الله"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1">
                    رقم الهاتف للتواصل <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01098765432"
                    required
                  />
                  <span className="text-[11px] text-[#626d84] font-bold mt-1 block">
                    يستخدم للتواصل مع المالك لتأكيد مواعيد المعاينة الميدانية.
                  </span>
                </div>
              </div>

              {/* Email Section (with verification flow) */}
              <div className="pt-2">
                <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1">
                  البريد الإلكتروني
                </label>
                <div className="p-3.5 rounded-xl border-[2px] border-[var(--dp-color-outline)] bg-[var(--dp-color-ground)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[var(--dp-color-accent)] shrink-0" />
                    <div>
                      <span className="text-sm font-black text-[var(--dp-color-ink)] block">
                        {user?.email || 'buyer@sha2ety.eg'}
                      </span>
                      <span className="text-[11px] text-emerald-800 font-bold block">
                        ✓ بريد إلكتروني مؤكد وموثق
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEmailModalOpen(true);
                      setEmailSentNotice(false);
                      setNewEmail('');
                    }}
                    className="text-xs"
                  >
                    تغيير البريد الإلكتروني
                  </Button>
                </div>
              </div>
            </div>

            {/* Section 2: Search Preferences */}
            <div className="bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-6 sm:p-8 shadow-hard space-y-5">
              <div className="border-b-2 border-[#ece9db] pb-3">
                <h3 className="text-lg font-black text-[var(--dp-color-ink)]">
                  تفضيلات البحث والميزانية
                </h3>
                <p className="text-xs text-[#626d84] font-bold mt-0.5">
                  حدد اهتماماتك لنقترح عليك العقارات المطابقة بدقة فور إضافتها.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Select
                  label="المدينة المفضلة"
                  value={preferredCity}
                  onChange={(e) => setPreferredCity(e.target.value)}
                  options={[
                    { value: 'cairo_new', label: 'القاهرة الجديدة والتجمع' },
                    { value: 'sheikh_zayed', label: 'الشيخ زايد و 6 أكتوبر' },
                    { value: 'maadi', label: 'المعادي وحلوان' },
                    { value: 'alex', label: 'الإسكندرية والساحل' },
                    { value: 'red_sea', label: 'البحر الأحمر والغردقة' },
                  ]}
                />

                <Select
                  label="الميزانية المقترحة"
                  value={budgetRange}
                  onChange={(e) => setBudgetRange(e.target.value)}
                  options={[
                    { value: 'less_than_3', label: 'أقل من 3 مليون ج.م' },
                    { value: '3_to_6', label: '3 - 6 مليون ج.م' },
                    { value: '6_to_10', label: '6 - 10 مليون ج.م' },
                    { value: 'above_10', label: 'أكثر من 10 مليون ج.م' },
                  ]}
                />

                <Select
                  label="نوع العقار المستهدف"
                  value={preferredType}
                  onChange={(e) => setPreferredType(e.target.value)}
                  options={[
                    { value: 'apartment', label: 'شقة سكنية' },
                    { value: 'duplex', label: 'دوبلكس بحديقة' },
                    { value: 'villa', label: 'فيلا مستقلة' },
                    { value: 'chalet', label: 'شاليه مصيفي' },
                  ]}
                />
              </div>

              {/* Save Button */}
              <div className="pt-4 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isLoading}
                  rightIcon={<Save className="w-4 h-4 stroke-[2.5]" />}
                  className="font-black text-sm"
                >
                  حفظ التعديلات والتفضيلات
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Account Switching & Session Utilities */}
      <section className="bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-5 sm:p-6 shadow-hard text-right space-y-4">
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#ece9db]">
          <h3 className="text-base font-black text-[var(--dp-color-ink)] flex items-center gap-2">
            <Lock className="w-4 h-4 text-purple-600" />
            إدارة الجلسة وتبديل الحساب
          </h3>
          <Badge variant="fresh" size="sm">
            حساب مشتري
          </Badge>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-black text-[#526078] block">
              التبديل الفوري بين الحسابات التجريبية:
            </span>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                disabled={isSwitching}
                onClick={async () => {
                  setIsSwitching(true);
                  const res = await switchUserRole('seller');
                  setIsSwitching(false);
                  if (!res.error) navigate('/seller/dashboard', { replace: true });
                }}
                className="px-3 py-1.5 rounded-lg border-2 border-[var(--dp-color-outline)] bg-white hover:bg-[var(--dp-color-accent-warm)] text-xs font-black transition-all cursor-pointer shadow-hard-sm flex items-center gap-1.5"
              >
                <Building className="w-3.5 h-3.5 text-amber-600" />
                <span>حساب البائع (محمد السيد)</span>
              </button>

              <button
                type="button"
                disabled={isSwitching}
                onClick={async () => {
                  setIsSwitching(true);
                  const res = await switchUserRole('admin');
                  setIsSwitching(false);
                  if (!res.error) navigate('/admin/dashboard', { replace: true });
                }}
                className="px-3 py-1.5 rounded-lg border-2 border-[var(--dp-color-outline)] bg-white hover:bg-[var(--dp-color-accent-secondary)] hover:text-white text-xs font-black transition-all cursor-pointer shadow-hard-sm flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                <span>مشرف النظام (م. أحمد مهران)</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={async () => {
              await logout();
              navigate('/login', { replace: true });
            }}
            className="px-4 py-2 rounded-xl border-2 border-rose-300 bg-white hover:bg-rose-50 text-rose-600 text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 shadow-sm"
          >
            <LogOut className="w-4 h-4 stroke-[2.5]" />
            <span>تسجيل الخروج من الحساب</span>
          </button>
        </div>
      </section>

      {/* Modal: Change Email Verification Process */}
      <Modal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        title="تغيير البريد الإلكتروني"
        description="إجراءات الأمان وحماية حسابك على منصة شقتي."
        size="md"
      >
        <div className="space-y-4 text-right">
          <div className="p-4 rounded-xl bg-amber-50 border-[2px] border-amber-200 text-xs text-amber-950 font-bold space-y-2">
            <div className="flex items-center gap-2 font-black text-sm text-amber-900">
              <Info className="w-4 h-4 shrink-0" />
              <span>إشعار أمان التحقق:</span>
            </div>
            <p className="leading-relaxed">
              "تغيير البريد الإلكتروني يتطلب إعادة التحقق عبر رابط التأكيد المرسل للبريد الجديد وفق بروتوكول الأمان."
            </p>
          </div>

          {emailSentNotice ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-950 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="font-black text-sm">تم إرسال رابط التحقق بنجاح!</h4>
              <p>
                يرجى فتح بريدك الإلكتروني ({newEmail}) والضغط على رابط التفعيل لتأكيد التغيير.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEmailModalOpen(false)}
                className="mt-2 text-xs"
              >
                إغلاق
              </Button>
            </div>
          ) : (
            <form onSubmit={handleRequestEmailChange} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1">
                  البريد الإلكتروني الجديد
                </label>
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="new-email@example.com"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEmailModalOpen(false)}
                >
                  إلغاء
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  إرسال رابط التأكيد
                </Button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </DashboardLayout>
  );
};
