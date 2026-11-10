import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getUnreadNotificationsCount } from '@/services/communicationService';
import { getReviewQueue } from '@/services/adminService';
import {
  LayoutDashboard,
  Building2,
  PlusCircle,
  CalendarCheck,
  MessageSquare,
  User,
  Bell,
  Heart,
  History,
  Users,
  Settings,
  Menu,
  X,
  LogOut,
  Home,
  CheckCircle,
  ClipboardList,
  FileCheck,
} from 'lucide-react';

export type Role = 'seller' | 'buyer' | 'admin';

export interface DashboardLayoutProps {
  role: Role;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  role,
  title,
  subtitle,
  actions,
  children,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, switchUserRole } = useAuth();
  const [isSwitching, setIsSwitching] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleRoleSwitch = async (targetRole: Role) => {
    if (role === targetRole) {
      navigate(`/${targetRole}/dashboard`);
      return;
    }
    setIsSwitching(true);
    try {
      const res = await switchUserRole(targetRole);
      if (!res.error) {
        navigate(`/${res.role}/dashboard`, { replace: true });
      }
    } catch (err) {
      console.error('Role switch failed:', err);
    } finally {
      setIsSwitching(false);
    }
  };

  const unreadNotifs = getUnreadNotificationsCount(role);
  const pendingReviewsCount = role === 'admin' ? getReviewQueue().length : 0;

  // Section 1 Sidebar for Seller
  const sellerNav = [
    { label: 'الرئيسية', path: '/seller/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'عقاراتي', path: '/seller/properties', icon: <Building2 className="w-5 h-5" /> },
    { label: 'إضافة عقار', path: '/seller/properties/new', icon: <PlusCircle className="w-5 h-5" /> },
    { label: 'طلبات المعاينة', path: '/seller/appointments', icon: <CalendarCheck className="w-5 h-5" /> },
    { label: 'استفسارات المشترين', path: '/seller/inquiries', icon: <MessageSquare className="w-5 h-5" /> },
    { label: 'الإشعارات', path: '/seller/notifications', icon: <Bell className="w-5 h-5" />, badge: unreadNotifs > 0 ? String(unreadNotifs) : undefined },
    { label: 'الملف الشخصي', path: '/seller/profile', icon: <User className="w-5 h-5" /> },
  ];

  const buyerNav = [
    { label: 'الرئيسية', path: '/buyer/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'عقاراتي المفضلة', path: '/buyer/favorites', icon: <Heart className="w-5 h-5" /> },
    { label: 'مواعيد المعاينة', path: '/buyer/appointments', icon: <CalendarCheck className="w-5 h-5" /> },
    { label: 'استفساراتي', path: '/buyer/inquiries', icon: <MessageSquare className="w-5 h-5" /> },
    { label: 'شوهدت مؤخراً', path: '/buyer/recently-viewed', icon: <History className="w-5 h-5" /> },
    { label: 'الإشعارات', path: '/buyer/notifications', icon: <Bell className="w-5 h-5" />, badge: unreadNotifs > 0 ? String(unreadNotifs) : undefined },
    { label: 'حسابي', path: '/buyer/profile', icon: <User className="w-5 h-5" /> },
  ];

  const adminNav = [
    { label: 'الرئيسية', path: '/admin/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'مراجعة العقارات', path: '/admin/reviews', icon: <FileCheck className="w-5 h-5" />, badge: pendingReviewsCount > 0 ? String(pendingReviewsCount) : undefined },
    { label: 'جميع العقارات', path: '/admin/properties', icon: <Building2 className="w-5 h-5" /> },
    { label: 'المستخدمون', path: '/admin/users', icon: <Users className="w-5 h-5" /> },
    { label: 'طلبات المعاينة', path: '/admin/appointments', icon: <CalendarCheck className="w-5 h-5" /> },
    { label: 'الاستفسارات', path: '/admin/inquiries', icon: <MessageSquare className="w-5 h-5" /> },
    { label: 'سجل العمليات', path: '/admin/audit-log', icon: <ClipboardList className="w-5 h-5" /> },
    { label: 'إعدادات المنصة', path: '/admin/settings', icon: <Settings className="w-5 h-5" /> },
  ];

  const navItems = role === 'seller' ? sellerNav : role === 'buyer' ? buyerNav : adminNav;

  const roleInfo = {
    seller: { label: 'حساب بائع', color: 'bg-[var(--dp-color-accent-warm)]', badge: 'بائع معتمد' },
    buyer: { label: 'حساب مشتري', color: 'bg-[var(--dp-color-accent-fresh)]', badge: 'مشتري' },
    admin: { label: 'إدارة المنصة', color: 'bg-[var(--dp-color-accent-secondary)]', badge: 'مشرف نظام' },
  }[role];

  const displayName = user?.fullName || (role === 'seller' ? 'محمد السيد' : role === 'admin' ? 'م. المشرف' : 'كريم عبد الله');
  const userInitial = displayName.trim()[0] || 'ش';

  return (
    <div className="min-h-screen bg-[var(--dp-color-ground)] text-[var(--dp-color-ink)] flex flex-col selection:bg-[var(--dp-color-selection)] selection:text-[var(--dp-color-accent)]">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-[var(--dp-color-panel)] border-b-[3px] border-[var(--dp-color-outline)] h-16 sm:h-20 flex items-center justify-between px-4 sm:px-6 shadow-sm">
        {/* Logo and Brand - Always visible */}
        <div className="flex items-center justify-between w-full lg:w-auto gap-3 sm:gap-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[var(--dp-color-accent)] border-[2.5px] border-[var(--dp-color-outline)] flex items-center justify-center text-white font-black text-xl shadow-hard-sm">
              ش
            </div>
            <div className="text-right">
              <span className="font-display font-black text-xl text-[var(--dp-color-ink)] block leading-none">
                شقتي
              </span>
              <span className="text-[10px] font-bold text-[#626d84] block mt-0.5">
                عقارك.. خطوتك الجاية
              </span>
            </div>
          </Link>

          <span className="text-gray-300 hidden lg:inline">|</span>

          {/* Role badge */}
          <Badge variant={role === 'seller' ? 'warm' : role === 'admin' ? 'secondary' : 'fresh'} size="sm">
            {roleInfo.badge}
          </Badge>
        </div>

        {/* Desktop Controls (hidden on mobile, handled by bottom nav) */}
        <div className="hidden lg:flex items-center gap-2 sm:gap-3">
          <Link to="/">
            <Button variant="ghost" size="sm" rightIcon={<Home className="w-4 h-4" />}>
              <span>الموقع الرئيسي</span>
            </Button>
          </Link>

          {/* Notifications Icon with Unread Pill (All Roles) */}
          <Link
            to={role === 'seller' ? '/seller/notifications' : role === 'buyer' ? '/buyer/notifications' : '/admin/dashboard'}
            className="relative p-2 rounded-xl border-[2px] border-[var(--dp-color-outline)] bg-[var(--dp-color-ground)] hover:bg-[var(--dp-color-selection)] transition-colors cursor-pointer shadow-hard-sm"
            title="الإشعارات"
            aria-label="الإشعارات"
          >
            <Bell className="w-5 h-5 text-[var(--dp-color-ink)]" />
            {unreadNotifs > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center border border-[var(--dp-color-outline)] animate-pulse">
                {unreadNotifs}
              </span>
            )}
          </Link>

          <div className="h-6 w-[2px] bg-[#ece9db]" />

          {/* User Profile Pill Menu */}
          <Link
            to={role === 'seller' ? '/seller/profile' : role === 'buyer' ? '/buyer/profile' : '/admin/settings'}
            className="flex items-center gap-2 bg-[var(--dp-color-ground)] hover:bg-[var(--dp-color-selection)] border-[2px] border-[var(--dp-color-outline)] py-1.5 px-3 rounded-xl transition-all cursor-pointer shadow-hard-sm"
          >
            <div className="w-7 h-7 rounded-lg bg-[var(--dp-color-accent)] text-white text-xs font-black flex items-center justify-center">
              {userInitial}
            </div>
            <span className="text-xs font-black text-[var(--dp-color-ink)]">
              {displayName}
            </span>
          </Link>

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="p-2 rounded-xl border-[2px] border-[var(--dp-color-outline)] bg-white text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shadow-hard-sm"
            title="تسجيل الخروج"
            aria-label="تسجيل الخروج"
          >
            <LogOut className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </header>

      {/* Main Layout Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar (Hidden on mobile, uses bottom nav) */}
        <aside className="hidden lg:block w-72 bg-[var(--dp-color-panel)] border-l-[3px] border-[var(--dp-color-outline)] shrink-0 overflow-y-auto">
          <div className="p-5 flex flex-col justify-between h-full">
            <div>
              {/* Role Header Banner */}
              <div className="p-4 rounded-xl border-[2.5px] border-[var(--dp-color-outline)] bg-[var(--dp-color-field-soft)] mb-6 shadow-hard-sm text-right">
                <span className="text-xs font-black text-[#526078] block">المساحة المخصصة</span>
                <h2 className="text-base font-black text-[var(--dp-color-ink)] mt-0.5">
                  {roleInfo.label}
                </h2>
              </div>

              {/* Navigation links */}
              <nav className="space-y-1.5 text-right" aria-label="تنقل لوحة التحكم">
                {navItems.map((item: any) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        'flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-bold transition-all duration-[180ms]',
                        isActive
                          ? 'bg-[var(--dp-color-accent-warm)] text-[var(--dp-color-ink)] border-[2px] border-[var(--dp-color-outline)] shadow-hard-sm -translate-x-1'
                          : 'text-[#485368] hover:text-[var(--dp-color-ink)] hover:bg-[var(--dp-color-ground)]'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="shrink-0">{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-rose-500 text-white border border-[var(--dp-color-outline)]">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}

                {/* Sidebar Logout Item */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors text-right cursor-pointer"
                >
                  <LogOut className="w-5 h-5 shrink-0" />
                  <span>تسجيل الخروج</span>
                </button>
              </nav>
            </div>

            {/* Quick Role switcher shortcuts */}
            <div className="mt-8 pt-6 border-t-2 border-[#ece9db] text-right">
              <span className="text-xs font-black text-[#718096] block mb-2 px-1">
                تبديل الحساب التجريبي:
              </span>
              <div className="flex flex-col gap-1.5 text-xs font-bold">
                <button
                  type="button"
                  disabled={isSwitching}
                  onClick={() => handleRoleSwitch('seller')}
                  className={cn(
                    'p-2 rounded-lg border border-[var(--dp-color-outline)] transition-all cursor-pointer text-right flex items-center justify-between',
                    role === 'seller' ? 'bg-[var(--dp-color-accent)] text-white shadow-sm' : 'bg-white hover:bg-gray-50 text-[var(--dp-color-ink)]'
                  )}
                >
                  <span>لوحة البائع</span>
                  {role === 'seller' && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">الحالي</span>}
                </button>
                <button
                  type="button"
                  disabled={isSwitching}
                  onClick={() => handleRoleSwitch('buyer')}
                  className={cn(
                    'p-2 rounded-lg border border-[var(--dp-color-outline)] transition-all cursor-pointer text-right flex items-center justify-between',
                    role === 'buyer' ? 'bg-[var(--dp-color-accent)] text-white shadow-sm' : 'bg-white hover:bg-gray-50 text-[var(--dp-color-ink)]'
                  )}
                >
                  <span>لوحة المشتري</span>
                  {role === 'buyer' && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">الحالي</span>}
                </button>
                <button
                  type="button"
                  disabled={isSwitching}
                  onClick={() => handleRoleSwitch('admin')}
                  className={cn(
                    'p-2 rounded-lg border border-[var(--dp-color-outline)] transition-all cursor-pointer text-right flex items-center justify-between',
                    role === 'admin' ? 'bg-[var(--dp-color-accent)] text-white shadow-sm' : 'bg-white hover:bg-gray-50 text-[var(--dp-color-ink)]'
                  )}
                >
                  <span>لوحة الإدارة</span>
                  {role === 'admin' && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">الحالي</span>}
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 pb-28 lg:pb-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-[#ece9db] text-right">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-[var(--dp-color-ink)]">
                  {title}
                </h1>
                {subtitle && (
                  <p className="mt-1 text-sm text-[#626d84] font-medium leading-relaxed">
                    {subtitle}
                  </p>
                )}
              </div>
              {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
            </div>

            {/* Injected Content */}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
