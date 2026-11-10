import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import {
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
    <header className="sticky top-0 z-30 bg-[var(--dp-color-ground)]/95 backdrop-blur-md border-b-[3px] border-[var(--dp-color-outline)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
        {/* Brand Logo - Shown on mobile & desktop */}
        <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0" aria-label="الصفحة الرئيسية لشقتي">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[var(--dp-color-accent)] border-[2.5px] sm:border-[3px] border-[var(--dp-color-outline)] flex items-center justify-center text-white shadow-hard-sm group-hover:-translate-y-0.5 transition-all">
            <span className="font-display font-black text-xl sm:text-2xl tracking-tighter">ش</span>
          </div>
          <div className="text-right">
            <span className="font-display font-black text-xl sm:text-2xl tracking-tight text-[var(--dp-color-ink)] block leading-none">
              شقتي
            </span>
            <span className="text-[10px] sm:text-[11px] font-bold text-[#626d84] tracking-tight block mt-0.5 sm:mt-1">
              عقارك.. خطوتك الجاية
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links (hidden on mobile, uses bottom nav) */}
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

        {/* Desktop Action Controls & Auth Links (hidden on mobile, uses bottom nav) */}
        <div className="hidden lg:flex items-center gap-2.5">
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
              <Link to="/login">
                <Button variant="outline" size="sm" rightIcon={<LogIn className="w-4 h-4" />}>
                  تسجيل الدخول
                </Button>
              </Link>

              <Link to="/register">
                <Button variant="warm" size="sm" rightIcon={<UserPlus className="w-4 h-4" />}>
                  إنشاء حساب
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
