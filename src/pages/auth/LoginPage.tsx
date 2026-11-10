import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, UserRole } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Badge } from '@/components/ui/Badge';
import { GoogleIcon } from '@/components/ui/GoogleIcon';
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
  User,
  Check,
  ShieldAlert,
  LogOut,
} from 'lucide-react';

export type LoginRoleTab = 'buyer' | 'seller' | 'admin';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, login, switchUserRole, getRoleRedirectUrl, logout, signInWithGoogle } = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const redirectPath = searchParams.get('redirect');

  // Determine initial role from redirect or default to 'buyer'
  const getInitialRole = (): LoginRoleTab => {
    if (redirectPath?.startsWith('/seller')) return 'seller';
    if (redirectPath?.startsWith('/admin')) return 'admin';
    return 'buyer';
  };

  const [selectedRole, setSelectedRole] = useState<LoginRoleTab>(getInitialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Set default credentials on mount or role swap
  const roleCredentials: Record<LoginRoleTab, { email: string; label: string; dashboard: string }> = {
    buyer: {
      email: 'buyer@sha2ety.eg',
      label: 'مشتري',
      dashboard: '/buyer/dashboard',
    },
    seller: {
      email: 'seller@sha2ety.eg',
      label: 'بائع معتمد',
      dashboard: '/seller/dashboard',
    },
    admin: {
      email: 'admin@sha2ety.eg',
      label: 'مشرف النظام',
      dashboard: '/admin/dashboard',
    },
  };

  // Helper to validate and calculate safe redirect without 403 loops
  const getSafeRedirectUrl = (role: UserRole, targetRedirect?: string | null): string => {
    if (!targetRedirect || targetRedirect === '/login' || targetRedirect === '/register') {
      return getRoleRedirectUrl(role);
    }

    const isSellerPath = targetRedirect.startsWith('/seller');
    const isBuyerPath = targetRedirect.startsWith('/buyer');
    const isAdminPath = targetRedirect.startsWith('/admin');

    // Admin can access admin, seller, or buyer paths
    if (role === 'admin') {
      return targetRedirect;
    }

    // Seller can only access seller or public paths
    if (role === 'seller') {
      if (isAdminPath || isBuyerPath) {
        return '/seller/dashboard';
      }
      return targetRedirect;
    }

    // Buyer can only access buyer or public paths
    if (role === 'buyer') {
      if (isAdminPath || isSellerPath) {
        return '/buyer/dashboard';
      }
      return targetRedirect;
    }

    return getRoleRedirectUrl(role);
  };

  // Swap to selected role and autofill its demo credentials
  const handleRoleTabSelect = (role: LoginRoleTab) => {
    setSelectedRole(role);
    setEmail(roleCredentials[role].email);
    setPassword('Sha2ety@2026');
    setError(null);
  };

  // Auto-fill upon initial page load
  useEffect(() => {
    const initial = getInitialRole();
    setSelectedRole(initial);
    setEmail(roleCredentials[initial].email);
    setPassword('Sha2ety@2026');
  }, []);

  // Handle redirect if user is already authenticated (or just returned from Google OAuth)
  useEffect(() => {
    if (isAuthenticated && user) {
      const storedRedirect = localStorage.getItem('sha2ety_oauth_redirect');
      if (storedRedirect) {
        localStorage.removeItem('sha2ety_oauth_redirect');
      }
      const destination = getSafeRedirectUrl(user.role, storedRedirect || redirectPath);
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, user, redirectPath, navigate]);

  // Google OAuth Sign-in Handler
  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleLoading(true);
    const roleForGoogle = selectedRole === 'admin' ? 'buyer' : selectedRole;
    const result = await signInWithGoogle(roleForGoogle, redirectPath || undefined);
    if (result.error) {
      setError(result.error);
      setIsGoogleLoading(false);
    }
  };

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

    const targetRole = result.role || selectedRole;
    const destination = getSafeRedirectUrl(targetRole, redirectPath);
    navigate(destination, { replace: true });
  };

  // Instant login handler for swapping between accounts seamlessly
  const handleInstantLogin = async (targetRole: UserRole) => {
    setError(null);
    setSelectedRole(targetRole);
    setEmail(roleCredentials[targetRole].email);
    setPassword('Sha2ety@2026');
    setIsLoading(true);

    const result = await switchUserRole(targetRole);
    setIsLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    const destination = getSafeRedirectUrl(result.role, redirectPath);
    navigate(destination, { replace: true });
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

        <Link to="/" className="hidden sm:inline-block">
          <Button variant="ghost" size="sm" rightIcon={<Home className="w-4 h-4" />}>
            الرئيسية
          </Button>
        </Link>
      </header>

      {/* Main Distinctive Split Layout */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Side 1: Welcome Headline, Description & Static Geometric Assembly */}
          <div className="lg:col-span-5 text-right space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[var(--dp-color-accent-warm)] border-[2px] border-[var(--dp-color-outline)] text-xs font-black shadow-hard-sm">
              <Sparkles className="w-4 h-4 stroke-[2.5]" />
              <span>مرحباً بعودتك</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black text-[var(--dp-color-ink)] leading-tight">
              أهلاً بيك في شقتي
            </h1>

            <p className="text-base text-[#4a5568] leading-relaxed max-w-lg font-medium">
              سجل دخولك أو بدل حسابك التجريبي لمتابعة عقاراتك المعروضة، مواعيد المعاينة، أو إدارة المنصة. يتم توجيه كل مستخدم تلقائياً إلى لوحة التحكم الخاصة برتبته.
            </p>

            {/* Static Geometric Illustration with Property Image */}
            <div className="relative pt-4 max-w-[420px]">
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
          <div className="lg:col-span-7 relative">
            {/* Violet Offset Backing Layer */}
            <div
              className="absolute inset-0 bg-[var(--dp-color-accent)] rounded-[calc(var(--dp-radius-corner)+8px)] translate-x-3 translate-y-3 sm:translate-x-4 sm:translate-y-4 border-[3px] border-[var(--dp-color-outline)]"
              aria-hidden="true"
            />

            {/* White Form Panel */}
            <div className="relative bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-6 sm:p-9 shadow-hard text-right">
              {/* Active Logged-in session notice */}
              {isAuthenticated && user && (
                <div className="mb-5 p-3.5 bg-amber-50 border-[2.5px] border-amber-400 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-between gap-3 text-amber-900">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span>
                      مسجل حالياً كـ: <strong>{user.fullName}</strong> ({user.role === 'admin' ? 'مشرف' : user.role === 'seller' ? 'بائع' : 'مشتري'})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="warm"
                      size="sm"
                      onClick={() => navigate(getRoleRedirectUrl(user.role), { replace: true })}
                      className="text-xs py-1 px-2.5"
                    >
                      لوحة التحكم
                    </Button>
                    <button
                      type="button"
                      onClick={async () => {
                        await logout();
                        handleRoleTabSelect(selectedRole);
                      }}
                      className="p-1.5 rounded-lg border border-amber-400 bg-white hover:bg-amber-100 text-rose-600 cursor-pointer"
                      title="تسجيل الخروج للتبديل"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              <div className="mb-5 border-b-2 border-[#ece9db] pb-4 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <Badge variant="primary" className="mb-1.5">
                    دخول آمن وموثق
                  </Badge>
                  <h2 className="text-2xl sm:text-3xl font-black text-[var(--dp-color-ink)]">
                    تسجيل الدخول
                  </h2>
                </div>
                <span className="text-xs font-bold text-[#626d84]">
                  اختر نوع الحساب للتبديل السريع
                </span>
              </div>

              {/* ----------------------------------------------------
                  1. Role Swap Tabs (مشتري / بائع / مشرف)
                 ---------------------------------------------------- */}
              <div className="mb-5">
                <label className="block text-xs font-black text-[#526078] mb-2">
                  تبديل حساب المستخدم (انقر للتبديل وملء البيانات):
                </label>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {/* Tab 1: مشتري */}
                  <button
                    type="button"
                    onClick={() => handleRoleTabSelect('buyer')}
                    className={`p-3 rounded-xl border-[2.5px] transition-all text-center cursor-pointer select-none flex flex-col items-center justify-center gap-1.5 ${
                      selectedRole === 'buyer'
                        ? 'border-[var(--dp-color-outline)] bg-[var(--dp-color-accent-fresh)] shadow-hard-sm -translate-y-0.5'
                        : 'border-[#d0d7de] bg-[var(--dp-color-ground)] hover:bg-white text-[#4a5568]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Home className="w-4 h-4 stroke-[2.5]" />
                      <span className="text-xs sm:text-sm font-black">حساب مشتري</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#526078] hidden sm:block">
                      لوحة المشتري
                    </span>
                  </button>

                  {/* Tab 2: بائع */}
                  <button
                    type="button"
                    onClick={() => handleRoleTabSelect('seller')}
                    className={`p-3 rounded-xl border-[2.5px] transition-all text-center cursor-pointer select-none flex flex-col items-center justify-center gap-1.5 ${
                      selectedRole === 'seller'
                        ? 'border-[var(--dp-color-outline)] bg-[var(--dp-color-accent-warm)] shadow-hard-sm -translate-y-0.5'
                        : 'border-[#d0d7de] bg-[var(--dp-color-ground)] hover:bg-white text-[#4a5568]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Building className="w-4 h-4 stroke-[2.5]" />
                      <span className="text-xs sm:text-sm font-black">حساب بائع</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#526078] hidden sm:block">
                      لوحة البائع
                    </span>
                  </button>

                  {/* Tab 3: مشرف */}
                  <button
                    type="button"
                    onClick={() => handleRoleTabSelect('admin')}
                    className={`p-3 rounded-xl border-[2.5px] transition-all text-center cursor-pointer select-none flex flex-col items-center justify-center gap-1.5 ${
                      selectedRole === 'admin'
                        ? 'border-[var(--dp-color-outline)] bg-[var(--dp-color-accent-secondary)] text-white shadow-hard-sm -translate-y-0.5'
                        : 'border-[#d0d7de] bg-[var(--dp-color-ground)] hover:bg-white text-[#4a5568]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                      <span className="text-xs sm:text-sm font-black">مشرف النظام</span>
                    </div>
                    <span className="text-[10px] font-bold opacity-80 hidden sm:block">
                      لوحة الإدارة
                    </span>
                  </button>
                </div>

                {/* Role destination prompt */}
                <div className="mt-2.5 px-3 py-1.5 rounded-lg bg-[var(--dp-color-ground)] border border-[#e2e8f0] text-[11px] font-bold text-[#475569] flex items-center justify-between">
                  <span>
                    الوجهة بعد تسجيل الدخول:{' '}
                    <strong className="text-[var(--dp-color-accent)]">
                      {roleCredentials[selectedRole].dashboard}
                    </strong>
                  </span>
                  <Badge variant="fresh" size="sm">
                    {roleCredentials[selectedRole].label}
                  </Badge>
                </div>
              </div>

              {/* Error banner */}
              {error && (
                <div className="mb-4 p-3.5 bg-rose-50 border-[2px] border-rose-500 rounded-xl text-rose-700 text-xs sm:text-sm font-bold flex items-center gap-2">
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
                    isLoading={isLoading && !isGoogleLoading}
                    rightIcon={<LogIn className="w-5 h-5 stroke-[2.5]" />}
                  >
                    تسجيل الدخول كـ ({roleCredentials[selectedRole].label})
                  </Button>
                </div>
              </form>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-[#ece9db]" />
                </div>
                <div className="relative flex justify-center text-xs font-black">
                  <span className="bg-white px-3 text-[#626d84]">أو تسجيل الدخول السحابي الموحد</span>
                </div>
              </div>

              {/* Google Sign In Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading || isGoogleLoading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border-[2.5px] border-[var(--dp-color-outline)] rounded-xl font-black text-sm text-[var(--dp-color-ink)] hover:bg-slate-50 hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-hard-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <GoogleIcon className="w-5 h-5 shrink-0" />
                <span>
                  {isGoogleLoading
                    ? 'جاري الاتصال بحساب Google...'
                    : `المتابعة بحساب Google كـ (${roleCredentials[selectedRole].label})`}
                </span>
              </button>

              {/* ----------------------------------------------------
                  2. One-Click Instant Login Swapping Bar
                 ---------------------------------------------------- */}
              <div className="mt-5 p-3.5 bg-[var(--dp-color-ground)] rounded-xl border-2 border-[var(--dp-color-outline)] text-right">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-[#1e293b] block">
                    الدخول الفوري المباشر (نقرة واحدة للتبديل والتوجه للوحة التحكم):
                  </span>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-bold">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleInstantLogin('buyer')}
                    className="px-3 py-2 bg-white border-2 border-[var(--dp-color-outline)] rounded-lg hover:bg-[var(--dp-color-accent-fresh)] hover:-translate-y-0.5 transition-all cursor-pointer shadow-hard-sm flex items-center justify-center gap-1.5"
                  >
                    <Home className="w-3.5 h-3.5 text-emerald-600" />
                    <span>دخول مشتري</span>
                  </button>

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleInstantLogin('seller')}
                    className="px-3 py-2 bg-white border-2 border-[var(--dp-color-outline)] rounded-lg hover:bg-[var(--dp-color-accent-warm)] hover:-translate-y-0.5 transition-all cursor-pointer shadow-hard-sm flex items-center justify-center gap-1.5"
                  >
                    <Building className="w-3.5 h-3.5 text-amber-600" />
                    <span>دخول بائع</span>
                  </button>

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleInstantLogin('admin')}
                    className="px-3 py-2 bg-white border-2 border-[var(--dp-color-outline)] rounded-lg hover:bg-[var(--dp-color-accent-secondary)] hover:text-white hover:-translate-y-0.5 transition-all cursor-pointer shadow-hard-sm flex items-center justify-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                    <span>دخول مشرف</span>
                  </button>
                </div>
              </div>

              {/* Control 3: إنشاء حساب جديد */}
              <div className="mt-5 pt-4 border-t-2 border-[#ece9db] text-center text-xs sm:text-sm font-bold text-[#626d84]">
                ليس لديك حساب بعد؟{' '}
                <Link
                  to="/register"
                  className="text-[var(--dp-color-accent)] underline hover:text-[var(--dp-color-ink)] mr-1"
                >
                  إنشاء حساب جديد في شقتي
                </Link>
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
