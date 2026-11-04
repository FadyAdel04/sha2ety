import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Badge } from '@/components/ui/Badge';
import {
  LogIn,
  Eye,
  EyeOff,
  Sparkles,
  ArrowLeft,
  Building,
  KeyRound,
  ShieldCheck,
  Home,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, getRoleRedirectUrl } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const redirectPath = searchParams.get('redirect');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('يرجى إدخال البريد الإلكتروني.');
      return;
    }

    if (!password) {
      setError('يرجى إدخال كلمة المرور.');
      return;
    }

    setIsLoading(true);
    const result = await login(email, password, rememberMe);
    setIsLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (redirectPath) {
      navigate(redirectPath, { replace: true });
    } else {
      navigate(getRoleRedirectUrl(result.role), { replace: true });
    }
  };

  // Quick fill helper for review and testing
  const handleQuickFill = async (roleEmail: string, autoLogin = false) => {
    setEmail(roleEmail);
    setPassword('Sha2ety@2026');
    setError(null);

    if (autoLogin) {
      setIsLoading(true);
      const result = await login(roleEmail, 'Sha2ety@2026', rememberMe);
      setIsLoading(false);

      if (result.error) {
        setError(result.error);
        return;
      }

      if (redirectPath) {
        navigate(redirectPath, { replace: true });
      } else {
        navigate(getRoleRedirectUrl(result.role), { replace: true });
      }
    }
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

        <Link to="/">
          <Button variant="ghost" size="sm" rightIcon={<Home className="w-4 h-4" />}>
            الرئيسية
          </Button>
        </Link>
      </header>

      {/* Main Distinctive Split Layout */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Side 1: Welcome Headline, Description & Static Geometric Assembly */}
          <div className="lg:col-span-6 text-right space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[var(--dp-color-accent-warm)] border-[2px] border-[var(--dp-color-outline)] text-xs font-black shadow-hard-sm">
              <Sparkles className="w-4 h-4 stroke-[2.5]" />
              <span>مرحباً بعودتك</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[var(--dp-color-ink)] leading-tight">
              أهلاً بيك في شقتي
            </h1>

            <p className="text-base sm:text-lg text-[#4a5568] leading-relaxed max-w-lg font-medium">
              سجل دخولك لمتابعة عقاراتك المعروضة، مواعيد المعاينة الميدانية، واستكشاف أحدث الفرص العقارية الموثوقة في مصر.
            </p>

            {/* Static Geometric Illustration with Elegant Property Image */}
            <div className="relative pt-4 max-w-[440px]">
              {/* Violet backing plate */}
              <div
                className="absolute inset-0 bg-[var(--dp-color-accent)] rounded-[calc(var(--dp-radius-corner)+8px)] translate-x-3 translate-y-3 border-[3px] border-[var(--dp-color-outline)]"
                aria-hidden="true"
              />

              {/* Mint accent tab at top left */}
              <div
                className="absolute -top-3 -left-3 bg-[var(--dp-color-accent-fresh)] border-[2px] border-[var(--dp-color-outline)] px-3 py-1 rounded-xl text-xs font-black shadow-hard-sm z-20"
                aria-hidden="true"
              >
                عقارات موثقة
              </div>

              {/* Foreground Image Card */}
              <div className="relative bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] overflow-hidden shadow-hard">
                <div className="aspect-16/10 w-full overflow-hidden bg-[#e5e1d3]">
                  <img
                    src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80"
                    alt="عقار مميز"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4 bg-white flex items-center justify-between text-xs font-black">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>بيانات ومستندات مفحوصة بدقة</span>
                  </div>
                  <Badge variant="fresh" size="sm">القاهرة الجديدة</Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Side 2: White Outlined Form Panel with Violet Offset Backing */}
          <div className="lg:col-span-6 relative">
            {/* Violet Offset Backing Layer */}
            <div
              className="absolute inset-0 bg-[var(--dp-color-accent)] rounded-[calc(var(--dp-radius-corner)+8px)] translate-x-3 translate-y-3 sm:translate-x-4 sm:translate-y-4 border-[3px] border-[var(--dp-color-outline)]"
              aria-hidden="true"
            />

            {/* White Form Panel */}
            <div className="relative bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-7 sm:p-10 shadow-hard text-right">
              <div className="mb-6 border-b-2 border-[#ece9db] pb-4">
                <Badge variant="primary" className="mb-2">
                  دخول آمن
                </Badge>
                <h2 className="text-2xl sm:text-3xl font-black text-[var(--dp-color-ink)]">
                  تسجيل الدخول
                </h2>
                <p className="text-xs sm:text-sm text-[#626d84] mt-1 font-medium">
                  أدخل بريدك الإلكتروني وكلمة المرور لمتابعة حسابك
                </p>
              </div>

              {/* Error banner */}
              {error && (
                <div className="mb-5 p-3.5 bg-rose-50 border-[2px] border-rose-500 rounded-xl text-rose-700 text-xs sm:text-sm font-bold flex items-center gap-2">
                  <span>⚠</span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Field 1: البريد الإلكتروني */}
                <Input
                  label="البريد الإلكتروني"
                  type="email"
                  placeholder="example@mail.com"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                {/* Field 2: كلمة المرور مع إظهار كلمة المرور */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-bold text-[var(--dp-color-ink)] select-none">
                      كلمة المرور
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-xs font-bold text-[var(--dp-color-accent)] hover:underline"
                    >
                      نسيت كلمة المرور؟
                    </Link>
                  </div>

                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[var(--dp-color-panel)] text-[var(--dp-color-ink)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] px-4 py-3 pl-11 text-sm font-medium focus:outline-none focus:shadow-hard focus:border-[var(--dp-color-accent)] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 p-1 text-[var(--dp-color-ink)] hover:text-[var(--dp-color-accent)] transition-colors cursor-pointer"
                      title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                      aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5 stroke-[2]" />
                      ) : (
                        <Eye className="w-5 h-5 stroke-[2]" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Control 1: تذكر تسجيل الدخول */}
                <div className="pt-1">
                  <Checkbox
                    label="تذكر تسجيل الدخول على هذا الجهاز"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                </div>

                {/* Control 2: تسجيل الدخول CTA */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full justify-center shadow-hard text-base"
                    isLoading={isLoading}
                    rightIcon={<LogIn className="w-5 h-5 stroke-[2.5]" />}
                  >
                    تسجيل الدخول
                  </Button>
                </div>
              </form>

              {/* Control 3: إنشاء حساب جديد */}
              <div className="mt-6 pt-5 border-t-2 border-[#ece9db] text-center text-xs sm:text-sm font-bold text-[#626d84]">
                ليس لديك حساب بعد؟{' '}
                <Link
                  to="/register"
                  className="text-[var(--dp-color-accent)] underline hover:text-[var(--dp-color-ink)] mr-1"
                >
                  إنشاء حساب جديد في شقتي
                </Link>
              </div>

              {/* Quick Fill Testing Helper Bar */}
              <div className="mt-6 p-3.5 bg-[var(--dp-color-ground)] rounded-xl border border-[var(--dp-color-outline)] text-right">
                <span className="text-[11px] font-black text-[#526078] block mb-2">
                  تجربة الدخول السريع (بيئات الاختبار):
                </span>
                <div className="flex flex-wrap gap-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => handleQuickFill('seller@sha2ety.eg')}
                    className="px-2.5 py-1 bg-white border border-[var(--dp-color-outline)] rounded-lg hover:bg-[var(--dp-color-accent-warm)] transition-colors cursor-pointer"
                  >
                    حساب بائع
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('buyer@sha2ety.eg')}
                    className="px-2.5 py-1 bg-white border border-[var(--dp-color-outline)] rounded-lg hover:bg-[var(--dp-color-accent-fresh)] transition-colors cursor-pointer"
                  >
                    حساب مشتري
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('admin@sha2ety.eg', true)}
                    className="px-2.5 py-1 bg-white border border-[var(--dp-color-outline)] rounded-lg hover:bg-[var(--dp-color-accent-secondary)] hover:text-white transition-colors cursor-pointer"
                  >
                    حساب مشرف (دخول فوري)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Subtle Bottom Copyright */}
      <footer className="text-center py-4 text-xs font-bold text-[#8b95aa]">
        © {new Date().getFullYear()} منصة شقتي (Sha2ety) • جميع الحقوق محفوظة لجمهورية مصر العربية
      </footer>
    </div>
  );
};
