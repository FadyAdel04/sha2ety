import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import {
  Menu,
  X,
  PlusCircle,
  Home,
  Compass,
  HelpCircle,
  LogIn,
  UserPlus,
  LayoutDashboard,
  LogOut,
} from 'lucide-react';

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, getRoleRedirectUrl } = useAuth();

  const navLinks = [
    { label: 'الرئيسية', path: '/', icon: <Home className="w-4 h-4" /> },
    { label: 'استكشف العقارات', path: '/properties', icon: <Compass className="w-4 h-4" /> },
    { label: 'كيف تعمل المنصة؟', path: '/how-it-works', icon: <HelpCircle className="w-4 h-4" /> },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-[var(--dp-color-ground)]/95 backdrop-blur-md border-b-[3px] border-[var(--dp-color-outline)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group shrink-0" aria-label="الصفحة الرئيسية لشقتي">
          <div className="w-12 h-12 rounded-2xl bg-[var(--dp-color-accent)] border-[3px] border-[var(--dp-color-outline)] flex items-center justify-center text-white shadow-hard-sm group-hover:-translate-y-0.5 transition-all">
            <span className="font-display font-black text-2xl tracking-tighter">ش</span>
          </div>
          <div className="text-right">
            <span className="font-display font-black text-2xl tracking-tight text-[var(--dp-color-ink)] block leading-none">
              شقتي
            </span>
            <span className="text-[11px] font-bold text-[#626d84] tracking-tight block mt-1">
              عقارك.. خطوتك الجاية
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1.5" aria-label="التنقل الرئيسي">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all duration-[180ms] select-none',
                isActive(link.path)
                  ? 'bg-[var(--dp-color-panel)] text-[var(--dp-color-accent)] border-[2.5px] border-[var(--dp-color-outline)] shadow-hard-sm'
                  : 'text-[var(--dp-color-ink)] hover:bg-[var(--dp-color-selection)] border-[2.5px] border-transparent'
              )}
            >
              {link.icon}
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>

        {/* Action Controls & Auth Links */}
        <div className="hidden sm:flex items-center gap-2.5">
          {/* Prominent Violet Outlined CTA */}
          <Link to="/seller/properties/new">
            <Button
              variant="primary"
              size="sm"
              rightIcon={<PlusCircle className="w-4 h-4 stroke-[2.5]" />}
              className="shadow-hard"
            >
              اعرض عقارك
            </Button>
          </Link>

          <div className="h-6 w-[2px] bg-[var(--dp-color-rule-muted)] mx-1" />

          {/* Conditional Auth State */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <Link to={getRoleRedirectUrl(user.role)}>
                <Button variant="warm" size="sm" rightIcon={<LayoutDashboard className="w-4 h-4" />}>
                  <span>لوحة التحكم ({user.role === 'admin' ? 'مشرف' : user.role === 'seller' ? 'بائع' : 'مشتري'})</span>
                </Button>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="p-2 rounded-xl border-[2px] border-[var(--dp-color-outline)] bg-white text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="تسجيل الخروج"
                aria-label="تسجيل الخروج"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              {/* Login */}
              <Link to="/login">
                <Button variant="outline" size="sm" rightIcon={<LogIn className="w-4 h-4" />}>
                  تسجيل الدخول
                </Button>
              </Link>

              {/* Register */}
              <Link to="/register">
                <Button variant="warm" size="sm" rightIcon={<UserPlus className="w-4 h-4" />}>
                  إنشاء حساب
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-xl border-[2.5px] border-[var(--dp-color-outline)] bg-[var(--dp-color-panel)] text-[var(--dp-color-ink)] shadow-hard-sm cursor-pointer"
          aria-label={mobileMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="w-6 h-6 stroke-[2.5]" /> : <Menu className="w-6 h-6 stroke-[2.5]" />}
        </button>
      </div>

      {/* Accessible Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t-[3px] border-[var(--dp-color-outline)] bg-[var(--dp-color-panel)] p-5 space-y-4 shadow-hard-lg">
          <nav className="flex flex-col gap-2" aria-label="قائمة الهاتف">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl text-base font-bold transition-colors',
                  isActive(link.path)
                    ? 'bg-[var(--dp-color-accent-warm)] text-[var(--dp-color-ink)] border-[2px] border-[var(--dp-color-outline)]'
                    : 'text-[var(--dp-color-ink)] hover:bg-[var(--dp-color-ground)]'
                )}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            ))}

            <Link
              to="/seller/properties/new"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 p-3 rounded-xl text-base font-bold bg-[var(--dp-color-selection)] text-[var(--dp-color-accent)] border-[2px] border-[var(--dp-color-outline)]"
            >
              <PlusCircle className="w-5 h-5" />
              <span>اعرض عقارك للبيع</span>
            </Link>

            {isAuthenticated && user && (
              <Link
                to={getRoleRedirectUrl(user.role)}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 p-3 rounded-xl text-base font-bold bg-[var(--dp-color-accent-warm)] text-[var(--dp-color-ink)] border-[2px] border-[var(--dp-color-outline)]"
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>لوحة التحكم الخاصة بك</span>
              </Link>
            )}
          </nav>

          <div className="pt-3 border-t-2 border-[#e5e7eb] flex flex-col gap-2.5">
            <Link to="/seller/properties/new" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="primary" size="md" className="w-full justify-center">
                اعرض عقارك الآن
              </Button>
            </Link>

            {isAuthenticated ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center text-rose-600"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
              >
                تسجيل الخروج
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full justify-center">
                    تسجيل الدخول
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="warm" size="sm" className="w-full justify-center">
                    إنشاء حساب
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
