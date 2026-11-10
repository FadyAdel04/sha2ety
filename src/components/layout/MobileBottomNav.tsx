import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth, UserRole } from '@/context/AuthContext';
import { getUnreadNotificationsCount } from '@/services/communicationService';
import { getReviewQueue } from '@/services/adminService';
import { getBuyerFavorites, getBuyerAppointments } from '@/services/buyerService';
import {
  LayoutDashboard,
  Heart,
  CalendarCheck,
  MessageSquare,
  User,
  Building2,
  PlusCircle,
  FileCheck,
  Users,
  Settings,
  Home,
  Compass,
  HelpCircle,
  LogIn,
  LogOut,
  RefreshCw,
  X,
  ShieldCheck,
  Building,
} from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, switchUserRole, getRoleRedirectUrl } = useAuth();
  const [accountSheetOpen, setAccountSheetOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const pathname = location.pathname;

  // Hide on auth pages (login, register, forgot/reset password)
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password')
  ) {
    return null;
  }

  const isBuyerPortal = pathname.startsWith('/buyer');
  const isSellerPortal = pathname.startsWith('/seller');
  const isAdminPortal = pathname.startsWith('/admin');

  // Badge counts
  const buyerFavsCount = isBuyerPortal ? getBuyerFavorites().length : 0;
  const buyerApptsCount = isBuyerPortal
    ? getBuyerAppointments().filter((a) => a.status === 'confirmed' || a.status === 'pending').length
    : 0;
  const adminReviewsCount = isAdminPortal ? getReviewQueue().length : 0;
  const sellerApptsCount = isSellerPortal ? getUnreadNotificationsCount('seller') : 0;

  const handleQuickSwitch = async (targetRole: UserRole) => {
    setIsSwitching(true);
    try {
      const res = await switchUserRole(targetRole);
      setAccountSheetOpen(false);
      if (!res.error) {
        navigate(getRoleRedirectUrl(res.role), { replace: true });
      }
    } catch (err) {
      console.error('Account switch error:', err);
    } finally {
      setIsSwitching(false);
    }
  };

  const handleLogout = async () => {
    setAccountSheetOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  // Nav Items definitions
  interface NavItem {
    label: string;
    path: string;
    icon: React.ReactNode;
    badge?: number | string;
    isCenter?: boolean;
    onClick?: () => void;
  }

  let navItems: NavItem[] = [];

  if (isBuyerPortal) {
    navItems = [
      {
        label: 'الرئيسية',
        path: '/buyer/dashboard',
        icon: <LayoutDashboard className="w-5 h-5 stroke-[2.2]" />,
      },
      {
        label: 'المفضلة',
        path: '/buyer/favorites',
        icon: <Heart className="w-5 h-5 stroke-[2.2]" />,
        badge: buyerFavsCount > 0 ? buyerFavsCount : undefined,
      },
      {
        label: 'المعاينات',
        path: '/buyer/appointments',
        icon: <CalendarCheck className="w-5 h-5 stroke-[2.2]" />,
        badge: buyerApptsCount > 0 ? buyerApptsCount : undefined,
      },
      {
        label: 'استفساراتي',
        path: '/buyer/inquiries',
        icon: <MessageSquare className="w-5 h-5 stroke-[2.2]" />,
      },
      {
        label: 'حسابي',
        path: '/buyer/profile',
        icon: <User className="w-5 h-5 stroke-[2.2]" />,
      },
    ];
  } else if (isSellerPortal) {
    navItems = [
      {
        label: 'الرئيسية',
        path: '/seller/dashboard',
        icon: <LayoutDashboard className="w-5 h-5 stroke-[2.2]" />,
      },
      {
        label: 'عقاراتي',
        path: '/seller/properties',
        icon: <Building2 className="w-5 h-5 stroke-[2.2]" />,
      },
      {
        label: 'إضافة عقار',
        path: '/seller/properties/new',
        icon: <PlusCircle className="w-6 h-6 stroke-[2.5]" />,
        isCenter: true,
      },
      {
        label: 'المواعيد',
        path: '/seller/appointments',
        icon: <CalendarCheck className="w-5 h-5 stroke-[2.2]" />,
        badge: sellerApptsCount > 0 ? sellerApptsCount : undefined,
      },
      {
        label: 'حسابي',
        path: '/seller/profile',
        icon: <User className="w-5 h-5 stroke-[2.2]" />,
      },
    ];
  } else if (isAdminPortal) {
    navItems = [
      {
        label: 'الرئيسية',
        path: '/admin/dashboard',
        icon: <LayoutDashboard className="w-5 h-5 stroke-[2.2]" />,
      },
      {
        label: 'المراجعات',
        path: '/admin/reviews',
        icon: <FileCheck className="w-5 h-5 stroke-[2.2]" />,
        badge: adminReviewsCount > 0 ? adminReviewsCount : undefined,
      },
      {
        label: 'العقارات',
        path: '/admin/properties',
        icon: <Building2 className="w-5 h-5 stroke-[2.2]" />,
      },
      {
        label: 'المستخدمون',
        path: '/admin/users',
        icon: <Users className="w-5 h-5 stroke-[2.2]" />,
      },
      {
        label: 'الإعدادات',
        path: '/admin/settings',
        icon: <Settings className="w-5 h-5 stroke-[2.2]" />,
      },
    ];
  } else {
    // Public pages navigation
    navItems = [
      {
        label: 'الرئيسية',
        path: '/',
        icon: <Home className="w-5 h-5 stroke-[2.2]" />,
      },
      {
        label: 'استكشف',
        path: '/properties',
        icon: <Compass className="w-5 h-5 stroke-[2.2]" />,
      },
      {
        label: 'اعرض عقارك',
        path: '/seller/properties/new',
        icon: <PlusCircle className="w-6 h-6 stroke-[2.5]" />,
        isCenter: true,
      },
      {
        label: 'كيف نعمل',
        path: '/how-it-works',
        icon: <HelpCircle className="w-5 h-5 stroke-[2.2]" />,
      },
      {
        label: isAuthenticated ? 'لوحتي' : 'دخول',
        path: isAuthenticated && user ? getRoleRedirectUrl(user.role) : '/login',
        icon: isAuthenticated ? <User className="w-5 h-5 stroke-[2.2]" /> : <LogIn className="w-5 h-5 stroke-[2.2]" />,
      },
    ];
  }

  const isCurrentActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname === path || (path !== '/' && pathname.startsWith(path));
  };

  return (
    <>
      {/* -----------------------------------------------------------------
          1. Bottom Navigation Bar for Mobile Screens
         ----------------------------------------------------------------- */}
      <nav
        aria-label="شريط التنقل السفلي للهواتف"
        className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-[var(--dp-color-panel)] border-t-[3px] border-[var(--dp-color-outline)] shadow-[0_-4px_16px_rgba(0,0,0,0.08)] select-none pb-[calc(env(safe-area-inset-bottom,0px)+6px)] pt-1.5"
      >
        <div className="max-w-md mx-auto px-2 flex items-center justify-around gap-1">
          {navItems.map((item) => {
            const active = isCurrentActive(item.path);

            if (item.isCenter) {
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex flex-col items-center justify-center -mt-5 group"
                >
                  <div className="w-12 h-12 rounded-full bg-[var(--dp-color-accent)] text-white border-[2.5px] border-[var(--dp-color-outline)] shadow-hard-sm flex items-center justify-center group-active:scale-95 transition-transform">
                    {item.icon}
                  </div>
                  <span className="text-[10px] font-black text-[var(--dp-color-ink)] mt-1">
                    {item.label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all relative',
                  active
                    ? 'text-[var(--dp-color-accent)] font-black bg-[var(--dp-color-selection)] border-[1.5px] border-[var(--dp-color-outline)]'
                    : 'text-[#64748b] hover:text-[var(--dp-color-ink)]'
                )}
              >
                <div className="relative">
                  {item.icon}
                  {item.badge !== undefined && (
                    <span className="absolute -top-1.5 -right-2 px-1.5 min-w-[16px] h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center border border-[var(--dp-color-outline)]">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-bold mt-1 line-clamp-1">
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* Quick Floating Switch Trigger Button */}
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => setAccountSheetOpen(true)}
              className="p-1 rounded-lg text-[#64748b] hover:text-[var(--dp-color-accent)] transition-colors cursor-pointer"
              title="تبديل الحساب أو تسجيل الخروج"
              aria-label="تبديل الحساب أو تسجيل الخروج"
            >
              <RefreshCw className="w-4 h-4 stroke-[2.2]" />
            </button>
          )}
        </div>
      </nav>

      {/* -----------------------------------------------------------------
          2. Account Switcher & Logout Bottom Sheet Modal
         ----------------------------------------------------------------- */}
      {accountSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-xs animate-fadeIn lg:hidden">
          <div
            className="w-full max-w-md bg-[var(--dp-color-panel)] border-t-[3px] border-x-[3px] border-[var(--dp-color-outline)] rounded-t-[calc(var(--dp-radius-corner)+8px)] p-5 shadow-hard-lg space-y-4 pb-[calc(env(safe-area-inset-bottom,0px)+24px)] text-right animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle & Close */}
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#ece9db]">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-[var(--dp-color-accent-warm)] border-[2px] border-[var(--dp-color-outline)] flex items-center justify-center text-[var(--dp-color-ink)] font-black text-sm">
                  {user?.fullName?.[0] || 'ش'}
                </span>
                <div>
                  <h3 className="text-sm font-black text-[var(--dp-color-ink)]">
                    {user?.fullName || 'مستخدم شقتي'}
                  </h3>
                  <span className="text-[11px] font-bold text-[#626d84]">
                    الحساب الحالي:{' '}
                    <strong className="text-[var(--dp-color-accent)]">
                      {user?.role === 'admin' ? 'مشرف' : user?.role === 'seller' ? 'بائع' : 'مشتري'}
                    </strong>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAccountSheetOpen(false)}
                className="p-1.5 rounded-lg border border-[#cbd5e1] bg-white text-gray-500 hover:text-black cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Quick Account Switcher Options */}
            <div>
              <span className="text-xs font-black text-[#526078] block mb-2">
                تبديل سريع للحساب التجريبي:
              </span>
              <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                <button
                  type="button"
                  disabled={isSwitching}
                  onClick={() => handleQuickSwitch('buyer')}
                  className={cn(
                    'p-2.5 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer',
                    user?.role === 'buyer'
                      ? 'border-[var(--dp-color-outline)] bg-[var(--dp-color-accent-fresh)] shadow-hard-sm'
                      : 'border-[#cbd5e1] bg-[var(--dp-color-ground)] hover:bg-white'
                  )}
                >
                  <Home className="w-4 h-4" />
                  <span>مشتري</span>
                </button>

                <button
                  type="button"
                  disabled={isSwitching}
                  onClick={() => handleQuickSwitch('seller')}
                  className={cn(
                    'p-2.5 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer',
                    user?.role === 'seller'
                      ? 'border-[var(--dp-color-outline)] bg-[var(--dp-color-accent-warm)] shadow-hard-sm'
                      : 'border-[#cbd5e1] bg-[var(--dp-color-ground)] hover:bg-white'
                  )}
                >
                  <Building className="w-4 h-4" />
                  <span>بائع</span>
                </button>

                <button
                  type="button"
                  disabled={isSwitching}
                  onClick={() => handleQuickSwitch('admin')}
                  className={cn(
                    'p-2.5 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer',
                    user?.role === 'admin'
                      ? 'border-[var(--dp-color-outline)] bg-[var(--dp-color-accent-secondary)] text-white shadow-hard-sm'
                      : 'border-[#cbd5e1] bg-[var(--dp-color-ground)] hover:bg-white'
                  )}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>مشرف</span>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col gap-2">
              <Link
                to={getRoleRedirectUrl(user?.role)}
                onClick={() => setAccountSheetOpen(false)}
                className="w-full py-2.5 text-center text-xs font-black rounded-xl bg-[var(--dp-color-accent)] text-white border-2 border-[var(--dp-color-outline)] shadow-hard-sm"
              >
                الذهاب للوحة التحكم الرئيسية
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2.5 text-center text-xs font-black rounded-xl bg-white text-rose-600 border-2 border-rose-300 hover:bg-rose-50 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-4 h-4 stroke-[2.5]" />
                <span>تسجيل الخروج من الحساب</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

