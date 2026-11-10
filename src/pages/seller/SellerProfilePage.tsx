import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { useSellerStats } from '@/hooks/useSupabaseData';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Notification } from '@/components/ui/Notification';
import { sbFetchUserById } from '@/services/supabaseService';
import {
  User,
  Phone,
  Mail,
  Camera,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Building2,
  Eye,
  CalendarCheck,
  MapPin,
  Clock,
  Sparkles,
  Save,
  LogOut,
  Home,
  Lock,
} from 'lucide-react';

const EGYPTIAN_GOVERNORATES = [
  { value: 'القاهرة', label: 'القاهرة' },
  { value: 'الجيزة', label: 'الجيزة' },
  { value: 'الإسكندرية', label: 'الإسكندرية' },
  { value: 'القليوبية', label: 'القليوبية' },
  { value: 'الشرقية', label: 'الشرقية' },
  { value: 'الدقهلية', label: 'الدقهلية' },
  { value: 'البحر الأحمر', label: 'البحر الأحمر (الغردقة/الجونة)' },
  { value: 'مطروح', label: 'مطروح (الساحل الشمالي)' },
  { value: 'جنوب سيناء', label: 'جنوب سيناء (شرم الشيخ)' },
  { value: 'أخرى', label: 'محافظة أخرى' },
];

export const SellerProfilePage: React.FC = () => {
  const { user, updateUserProfile, switchUserRole, logout } = useAuth();
  const navigate = useNavigate();
  const [isSwitching, setIsSwitching] = useState(false);
  const { stats } = useSellerStats(user?.id);

  // Form State initialized dynamically from logged-in user
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [governorate, setGovernorate] = useState(user?.governorate || 'القاهرة');
  const [nationalId, setNationalId] = useState(user?.nationalId || '');
  const [avatarUrl, setAvatarUrl] = useState<string>(
    user?.avatarUrl ||
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'
  );

  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state if user changes in auth context
  useEffect(() => {
    if (user) {
      if (user.fullName) setFullName(user.fullName);
      if (user.phone) setPhone(user.phone);
      if (user.governorate) setGovernorate(user.governorate);
      if (user.nationalId) setNationalId(user.nationalId);
      if (user.avatarUrl) setAvatarUrl(user.avatarUrl);
    }
  }, [user]);

  // Optionally fetch full profile from DB
  useEffect(() => {
    let active = true;
    async function loadFreshProfile() {
      if (!user?.id) return;
      try {
        const fresh = await sbFetchUserById(user.id);
        if (fresh && active) {
          if (fresh.full_name) setFullName(fresh.full_name);
          if (fresh.phone) setPhone(fresh.phone);
          if (fresh.national_id) setNationalId(fresh.national_id);
          if (fresh.avatar_url) setAvatarUrl(fresh.avatar_url);
        }
      } catch {
        // Fallback to user context
      }
    }
    loadFreshProfile();
    return () => {
      active = false;
    };
  }, [user?.id]);

  // Egyptian Phone validation
  const validateEgyptianPhone = (num: string) => {
    const cleaned = num.replace(/\s+/g, '');
    const regex = /^01[0125][0-9]{8}$/;
    return regex.test(cleaned);
  };

  // National ID validation: 14 digits
  const validateNationalId = (id: string) => {
    if (!id.trim()) return true; // Optional initially
    const cleaned = id.replace(/\s+/g, '');
    return /^[0-9]{14}$/.test(cleaned);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('حجم الصورة كبير جداً، الحد الأقصى 5 ميجابايت.');
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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('يرجى إدخال الاسم بالكامل.');
      return;
    }

    if (phone && !validateEgyptianPhone(phone)) {
      setErrorMessage('يرجى إدخال رقم هاتف مصري صحيح (11 رقماً يبدأ بـ 010 أو 011 أو 012 أو 015).');
      return;
    }

    if (nationalId && !validateNationalId(nationalId)) {
      setErrorMessage('الرقم القومي المصري يجب أن يتكون من 14 رقماً.');
      return;
    }

    try {
      setIsLoading(true);
      const isVerified = Boolean(nationalId.trim().length === 14 || user?.isVerified);

      await updateUserProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        governorate,
        nationalId: nationalId.trim(),
        avatarUrl,
        isVerified,
      });

      setToastMessage('تم حفظ وتحديث بيانات الملف الشخصي بنجاح.');
    } catch {
      setErrorMessage('حدث خطأ أثناء حفظ التعديلات. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  const isAccountVerified = user?.isVerified || (nationalId && nationalId.length === 14);

  return (
    <DashboardLayout
      role="seller"
      title="الملف الشخصي وإثبات الهوية"
      subtitle="إدارة بياناتك الشخصية، رقم الهاتف المسجل، وحالة توثيق الهوية الوطنية للمالك."
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="mb-6 animate-fadeIn text-right">
          <Notification
            variant="success"
            title="تم الحفظ بنجاح"
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Column: Basic Information Form */}
          <div className="lg:col-span-8 bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-6 sm:p-8 shadow-hard space-y-6">
            <div className="flex items-center justify-between border-b-2 border-[#ece9db] pb-4">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-[var(--dp-color-accent)]" />
                <h3 className="text-lg font-black text-[var(--dp-color-ink)]">
                  البيانات الأساسية للبائع
                </h3>
              </div>
              <Badge variant="primary" size="sm">
                حساب مالك / بائع
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1.5">
                  الاسم بالكامل
                </label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثال: محمد السيد أحمد"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1.5">
                  رقم الهاتف للتواصل
                </label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="مثال: 01001234567"
                  dir="ltr"
                  className="text-right"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1.5">
                  البريد الإلكتروني المسجل
                </label>
                <Input
                  value={user?.email || ''}
                  disabled
                  className="bg-gray-100 cursor-not-allowed opacity-80"
                  dir="ltr"
                />
                <span className="text-[11px] text-[#626d84] block mt-1">
                  البريد الإلكتروني مرتبط بحساب الدخول ولا يمكن تعديله مباشرة.
                </span>
              </div>

              <div>
                <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1.5">
                  المحافظة المقيم بها
                </label>
                <Select
                  value={governorate}
                  onChange={(e) => setGovernorate(e.target.value)}
                  options={EGYPTIAN_GOVERNORATES}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1.5">
                  الرقم القومي (14 رقماً)
                </label>
                <div className="relative">
                  <Input
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    placeholder="أدخل الرقم القومي المكون من 14 رقماً لإثبات الهوية"
                    maxLength={14}
                    dir="ltr"
                    className="text-right"
                  />
                  <FileText className="w-4 h-4 text-[#8b95aa] absolute left-3 top-3 pointer-events-none" />
                </div>
                <span className="text-[11px] text-[#626d84] block mt-1">
                  يستخدم الرقم القومي للتحقق من هوية المالك لضمان سلامة التعاملات العقارية مع المشترين.
                </span>
              </div>
            </div>

            <div className="pt-4 border-t-2 border-[#ece9db] flex items-center justify-between">
              <span className="text-xs text-[#626d84]">
                آخر تحديث: {user?.id ? 'نشط الآن' : 'غير متوفر'}
              </span>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                rightIcon={<Save className="w-4 h-4" />}
              >
                حفظ التعديلات
              </Button>
            </div>
          </div>

          {/* Side Column: Identity Verification & Profile Avatar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Avatar Card */}
            <div className="bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-6 shadow-hard text-center space-y-4">
              <div className="relative inline-block mx-auto">
                <img
                  src={avatarUrl}
                  alt={fullName || 'صورة الحساب'}
                  className="w-24 h-24 rounded-full border-[3px] border-[var(--dp-color-outline)] object-cover shadow-hard-sm"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 rounded-full bg-[var(--dp-color-accent)] text-white border-[2px] border-[var(--dp-color-outline)] hover:opacity-90 transition-opacity shadow-xs cursor-pointer"
                  title="تغيير الصورة الشخصية"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <div>
                <h4 className="font-black text-base text-[var(--dp-color-ink)]">
                  {fullName || 'مالك العقار'}
                </h4>
                <p className="text-xs text-[#626d84] mt-0.5" dir="ltr">
                  {user?.email}
                </p>
              </div>

              <div className="pt-2">
                {isAccountVerified ? (
                  <Badge variant="fresh" size="md">
                    <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
                    حساب بائع معتمد وموثق
                  </Badge>
                ) : (
                  <Badge variant="warm" size="md">
                    <Clock className="w-3.5 h-3.5 inline mr-1" />
                    بانتظار توثيق الهوية الوطنية
                  </Badge>
                )}
              </div>
            </div>

            {/* National Identity Verification Status Card */}
            <div className="bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-6 shadow-hard space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl border-[2px] border-[var(--dp-color-outline)] flex items-center justify-center shadow-hard-sm ${
                    isAccountVerified
                      ? 'bg-[var(--dp-color-accent-fresh)] text-emerald-800'
                      : 'bg-[var(--dp-color-accent-warm)] text-amber-900'
                  }`}
                >
                  <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-base font-black text-[var(--dp-color-ink)]">
                    توثيق الهوية الوطنية
                  </h4>
                  <span className="text-xs text-[#626d84] font-medium block">
                    {isAccountVerified ? 'تم التحقق من بطاقة الرقم القومي' : 'يتطلب إدخال الرقم القومي'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-[#526078] leading-relaxed">
                {isAccountVerified
                  ? 'حسابك موثق بهوية رسمية معتمدة. يمنح هذا عقاراتك أولوية الظهور في نتائج البحث ويزيد من ثقة المشترين في التعامل المباشر معك.'
                  : 'توثيق حسابك بالرقم القومي يعزز مصداقية عروضك ويمنح عقاراتك شارة "مالك موثق" لجذب مشترين جادين.'}
              </p>

              {nationalId && (
                <div className="p-3 bg-[var(--dp-color-ground)] rounded-xl border border-[var(--dp-color-outline)] text-xs flex items-center justify-between">
                  <span className="text-[#626d84] font-bold">الرقم القومي المسجل:</span>
                  <span className="font-mono font-black text-[var(--dp-color-ink)]" dir="ltr">
                    {nationalId.slice(0, 3)}••••••••{nationalId.slice(-3)}
                  </span>
                </div>
              )}
            </div>

            {/* Seller Performance Snapshot */}
            <div className="bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-5 shadow-hard space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-[#ece9db]">
                <Sparkles className="w-4 h-4 text-[var(--dp-color-accent)]" />
                <h5 className="text-xs font-black text-[var(--dp-color-ink)]">
                  ملخص نشاط حسابك
                </h5>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-lg bg-[var(--dp-color-ground)] border border-[var(--dp-color-outline)]">
                  <span className="text-lg font-black text-[var(--dp-color-ink)] block">
                    {stats?.totalProperties ?? 0}
                  </span>
                  <span className="text-[10px] text-[#626d84] font-bold block">عقارات</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--dp-color-ground)] border border-[var(--dp-color-outline)]">
                  <span className="text-lg font-black text-[var(--dp-color-accent)] block">
                    {stats?.totalViews ?? 0}
                  </span>
                  <span className="text-[10px] text-[#626d84] font-bold block">مشاهدات</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--dp-color-ground)] border border-[var(--dp-color-outline)]">
                  <span className="text-lg font-black text-purple-700 block">
                    {stats?.appointmentsCount ?? 0}
                  </span>
                  <span className="text-[10px] text-[#626d84] font-bold block">معاينات</span>
                </div>
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
          <Badge variant="warm" size="sm">
            حساب بائع معتمد
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
                  const res = await switchUserRole('buyer');
                  setIsSwitching(false);
                  if (!res.error) navigate('/buyer/dashboard', { replace: true });
                }}
                className="px-3 py-1.5 rounded-lg border-2 border-[var(--dp-color-outline)] bg-white hover:bg-[var(--dp-color-accent-fresh)] text-xs font-black transition-all cursor-pointer shadow-hard-sm flex items-center gap-1.5"
              >
                <Home className="w-3.5 h-3.5 text-emerald-600" />
                <span>حساب المشتري (كريم عبد الله)</span>
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
    </DashboardLayout>
  );
};
