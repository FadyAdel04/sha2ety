import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { GoogleIcon } from '@/components/ui/GoogleIcon';
import {
  UserPlus,
  Home,
  Building,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  MailCheck,
  ArrowLeft,
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, getRoleRedirectUrl, signInWithGoogle } = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Role selection: buyer or seller ONLY (Admin can never be self-assigned)
  const [accountType, setAccountType] = useState<'buyer' | 'seller'>('buyer');

  // Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UX controls
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);

  // Egyptian Phone validation: 11 digits starting with 010, 011, 012, or 015
  const validateEgyptianPhone = (num: string) => {
    const cleaned = num.replace(/\s+/g, '');
    const regex = /^01[0125][0-9]{8}$/;
    return regex.test(cleaned);
  };

  const isPasswordLongEnough = password.length >= 8;
  const doesPasswordHaveNumber = /\d/.test(password);
  const doPasswordsMatch = password && confirmPassword && password === confirmPassword;

  const handleGoogleSignUp = async () => {
    setError(null);
    setIsGoogleLoading(true);
    const result = await signInWithGoogle(accountType);
    if (result.error) {
      setError(result.error);
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!fullName.trim()) {
      setError('يرجى إدخال الاسم بالكامل.');
      return;
    }

    if (!email.trim()) {
      setError('يرجى إدخال البريد الإلكتروني.');
      return;
    }

    if (!validateEgyptianPhone(phone)) {
      setError('يرجى إدخال رقم هاتف مصري صحيح يبدأ بـ (010, 011, 012, 015) ومكون من 11 رقماً.');
      return;
    }

    if (!isPasswordLongEnough) {
      setError('يجب ألا تقل كلمة المرور عن 8 خانات.');
      return;
    }

    if (!doesPasswordHaveNumber) {
      setError('يجب أن تحتوي كلمة المرور على رقم واحد على الأقل.');
      return;
    }

    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين.');
      return;
    }

    setIsLoading(true);
    const result = await register({
      email,
      password,
      fullName,
      phone,
      role: accountType,
    });
    setIsLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.needsEmailVerification) {
      setVerificationModalOpen(true);
      return;
    }

    // Direct redirect to the appropriate dashboard
    navigate(getRoleRedirectUrl(result.role), { replace: true });
  };

  return (
    <div className="min-h-screen bg-[var(--dp-color-ground)] text-[var(--dp-color-ink)] flex flex-col justify-between">
      {/* Top Bar with Brand Link */}
      <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-2xl bg-[var(--dp-color-accent)] border-[2.5px] border-[var(--dp-color-outline)] flex items-center justify-center text-white shadow-hard-sm group-hover:-translate-y-0.5 transition-all">
            <span className="font-display font-black text-2xl">ش</span>
          </div>
          <div className="text-right">
            <span className="font-display font-black text-2xl text-[var(--dp-color-ink)] block leading-none">
              شقتي
            </span>
            <span className="text-[11px] font-bold text-[#626d84] block mt-1">
              عقارك.. خطوتك الجاية
            </span>
          </div>
        </Link>

        <Link to="/login" className="hidden sm:inline-block">
          <Button variant="outline" size="sm">
            لديك حساب؟ تسجيل الدخول
          </Button>
        </Link>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="relative">
          {/* Violet Backing Layer */}
          <div
            className="absolute inset-0 bg-[var(--dp-color-accent)] rounded-[calc(var(--dp-radius-corner)+8px)] translate-x-3 translate-y-3 sm:translate-x-4 sm:translate-y-4 border-[3px] border-[var(--dp-color-outline)]"
            aria-hidden="true"
          />

          {/* White Form Panel */}
          <div className="relative bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-7 sm:p-12 shadow-hard text-right">
            {/* Header */}
            <div className="text-center max-w-lg mx-auto mb-8">
              <Badge variant="warm" className="mb-2">
                انضم إلى المنصة
              </Badge>
              <h1 className="text-3xl sm:text-4xl font-black text-[var(--dp-color-ink)]">
                ابدأ رحلتك مع شقتي
              </h1>
              <p className="text-sm text-[#626d84] mt-1.5 font-medium">
                اختر نوع حسابك وأدخل بياناتك لتبدأ في استكشاف أو عرض العقارات
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mb-6 p-4 bg-rose-50 border-[2px] border-rose-500 rounded-xl text-rose-700 text-xs sm:text-sm font-bold flex items-center gap-2">
                <span>⚠</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* ----------------------------------------------------
                  2. Two Large Outlined Choice Cards (مشتري / بائع)
                 ---------------------------------------------------- */}
              <div>
                <label className="block text-sm font-black text-[var(--dp-color-ink)] mb-3">
                  حدد نوع حسابك:
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Card 1: مشتري */}
                  <button
                    type="button"
                    onClick={() => setAccountType('buyer')}
                    className={`relative p-5 rounded-[var(--dp-radius-corner)] border-[3px] transition-all text-right cursor-pointer select-none ${
                      accountType === 'buyer'
                        ? 'border-[var(--dp-color-outline)] bg-[var(--dp-color-field-soft)] shadow-hard -translate-y-1'
                        : 'border-[var(--dp-color-outline)] bg-[var(--dp-color-ground)] hover:bg-white'
                    }`}
                  >
                    {accountType === 'buyer' && (
                      <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-[var(--dp-color-accent)] text-white flex items-center justify-center border border-[var(--dp-color-outline)]">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    )}
                    <div className="w-12 h-12 rounded-xl bg-[var(--dp-color-accent-fresh)] border-[2px] border-[var(--dp-color-outline)] flex items-center justify-center text-[var(--dp-color-ink)] mb-3 shadow-hard-sm">
                      <Home className="w-6 h-6 stroke-[2.2]" />
                    </div>
                    <h3 className="text-lg font-black text-[var(--dp-color-ink)]">
                      مشتري
                    </h3>
                    <p className="text-xs text-[#526078] mt-1 font-bold">
                      "بدور على عقار مناسب."
                    </p>
                  </button>

                  {/* Card 2: بائع */}
                  <button
                    type="button"
                    onClick={() => setAccountType('seller')}
                    className={`relative p-5 rounded-[var(--dp-radius-corner)] border-[3px] transition-all text-right cursor-pointer select-none ${
                      accountType === 'seller'
                        ? 'border-[var(--dp-color-outline)] bg-[#fff8e7] shadow-hard -translate-y-1'
                        : 'border-[var(--dp-color-outline)] bg-[var(--dp-color-ground)] hover:bg-white'
                    }`}
                  >
                    {accountType === 'seller' && (
                      <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-[var(--dp-color-accent)] text-white flex items-center justify-center border border-[var(--dp-color-outline)]">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    )}
                    <div className="w-12 h-12 rounded-xl bg-[var(--dp-color-accent-warm)] border-[2px] border-[var(--dp-color-outline)] flex items-center justify-center text-[var(--dp-color-ink)] mb-3 shadow-hard-sm">
                      <Building className="w-6 h-6 stroke-[2.2]" />
                    </div>
                    <h3 className="text-lg font-black text-[var(--dp-color-ink)]">
                      بائع
                    </h3>
                    <p className="text-xs text-[#526078] mt-1 font-bold">
                      "عندي عقار وعايز أعرضه للبيع."
                    </p>
                  </button>
                </div>
              </div>

              {/* ----------------------------------------------------
                  Registration Fields
                 ---------------------------------------------------- */}
              <div className="space-y-4 pt-2">
                {/* 1. الاسم بالكامل */}
                <Input
                  label="الاسم بالكامل"
                  placeholder="مثال: أحمد محمود إبراهيم"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  helperText="يرجى كتابة الاسم الثلاثي كما هو بالرقم القومي لتوثيق الحساب"
                />

                {/* 2. البريد الإلكتروني */}
                <Input
                  label="البريد الإلكتروني"
                  type="email"
                  placeholder="name@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                {/* 3. رقم الهاتف المصري */}
                <Input
                  label="رقم الهاتف المحمول (مصر)"
                  placeholder="01012345678"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  helperText="رقم مصري نشط مخصص لتأكيد وتنسيق مواعيد المعاينة"
                />

                {/* 4. كلمة المرور وتأكيدها */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1.5 text-sm font-bold text-[var(--dp-color-ink)] select-none">
                      كلمة المرور <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[var(--dp-color-panel)] text-[var(--dp-color-ink)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] px-4 py-3 pl-11 text-sm font-medium focus:outline-none focus:shadow-hard focus:border-[var(--dp-color-accent)] transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 p-1 text-[var(--dp-color-ink)] hover:text-[var(--dp-color-accent)] transition-colors cursor-pointer"
                        title={showPassword ? 'إخفاء' : 'إظهار'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1.5 text-sm font-bold text-[var(--dp-color-ink)] select-none">
                      تأكيد كلمة المرور <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full bg-[var(--dp-color-panel)] text-[var(--dp-color-ink)] border-[3px] rounded-[var(--dp-radius-corner)] px-4 py-3 text-sm font-medium focus:outline-none focus:shadow-hard transition-all ${
                        confirmPassword && !doPasswordsMatch
                          ? 'border-rose-500 focus:border-rose-500'
                          : 'border-[var(--dp-color-outline)] focus:border-[var(--dp-color-accent)]'
                      }`}
                    />
                  </div>
                </div>

                {/* Password validation requirements checklist */}
                <div className="p-3 bg-[var(--dp-color-ground)] rounded-xl border border-[var(--dp-color-outline)] text-xs font-bold space-y-1">
                  <span className="text-[#626d84] block mb-1">شروط كلمة المرور:</span>
                  <div className="flex items-center gap-2">
                    <span className={isPasswordLongEnough ? 'text-emerald-600' : 'text-[#8b95aa]'}>
                      {isPasswordLongEnough ? '✓' : '○'} 8 أحرف على الأقل
                    </span>
                    <span>•</span>
                    <span className={doesPasswordHaveNumber ? 'text-emerald-600' : 'text-[#8b95aa]'}>
                      {doesPasswordHaveNumber ? '✓' : '○'} تحتوي على رقم واحد على الأقل
                    </span>
                    {confirmPassword && (
                      <>
                        <span>•</span>
                        <span className={doPasswordsMatch ? 'text-emerald-600' : 'text-rose-600'}>
                          {doPasswordsMatch ? '✓ متطابقتان' : '✗ غير متطابقتين'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full justify-center shadow-hard text-base"
                  isLoading={isLoading && !isGoogleLoading}
                  rightIcon={<UserPlus className="w-5 h-5 stroke-[2.5]" />}
                >
                  إنشاء الحساب والمتابعة
                </Button>
              </div>
            </form>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-[#ece9db]" />
              </div>
              <div className="relative flex justify-center text-xs font-black">
                <span className="bg-white px-3 text-[#626d84]">أو التسجيل السريع بضغطة واحدة</span>
              </div>
            </div>

            {/* Google Quick Sign-up Button */}
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={isLoading || isGoogleLoading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border-[2.5px] border-[var(--dp-color-outline)] rounded-xl font-black text-sm text-[var(--dp-color-ink)] hover:bg-slate-50 hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-hard-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <GoogleIcon className="w-5 h-5 shrink-0" />
              <span>
                {isGoogleLoading
                  ? 'جاري الاتصال بحساب Google...'
                  : `التسجيل الفوري كـ (${accountType === 'seller' ? 'بائع معتمد' : 'مشتري'}) عبر Google`}
              </span>
            </button>

            {/* Bottom link to login */}
            <div className="mt-8 pt-6 border-t-2 border-[#ece9db] text-center text-xs sm:text-sm font-bold text-[#626d84]">
              لديك حساب بالفعل في شقتي؟{' '}
              <Link
                to="/login"
                className="text-[var(--dp-color-accent)] underline hover:text-[var(--dp-color-ink)] mr-1"
              >
                تسجيل الدخول إلى حسابك
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Verification Modal for Supabase email confirmation */}
      <Modal
        isOpen={verificationModalOpen}
        onClose={() => {
          setVerificationModalOpen(false);
          navigate('/login');
        }}
        title="تأكيد البريد الإلكتروني"
        description="خطوة واحدة تفصلك عن تفعيل حسابك في شقتي."
        footer={
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setVerificationModalOpen(false);
              navigate('/login');
            }}
          >
            الانتقال لتسجيل الدخول
          </Button>
        }
      >
        <div className="text-center py-4 space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-[var(--dp-color-accent-fresh)] border-[2px] border-[var(--dp-color-outline)] flex items-center justify-center text-emerald-800 mx-auto shadow-hard-sm">
            <MailCheck className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h3 className="text-lg font-black text-[var(--dp-color-ink)]">
            تم إرسال رابط التفعيل إلى بريدك
          </h3>
          <p className="text-xs sm:text-sm text-[#4b5563] leading-relaxed">
            أرسلنا رسالة تأكيد إلى <span className="font-bold text-[var(--dp-color-ink)]">{email}</span>. يرجى الضغط على الرابط في الرسالة لتفعيل حسابك ومتابعة الدخول.
          </p>
        </div>
      </Modal>

      {/* Subtle Bottom Copyright */}
      <footer className="text-center py-4 text-xs font-bold text-[#8b95aa]">
        © {new Date().getFullYear()} منصة شقتي (Sha2ety) • جميع الحقوق محفوظة لجمهورية مصر العربية
      </footer>
    </div>
  );
};
