import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth, UserRole } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, isLoading, isAuthenticated, getRoleRedirectUrl, login, logout } = useAuth();
  const location = useLocation();

  const handleSwitchToAdmin = async () => {
    await logout();
    await login('admin@sha2ety.eg', 'Sha2ety@2026');
  };

  const handleSwitchAccount = async () => {
    await logout();
    window.location.href = `/login?redirect=${encodeURIComponent(location.pathname)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--dp-color-ground)] flex items-center justify-center p-4">
        <div className="bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-8 shadow-hard text-center max-w-sm w-full space-y-4">
          <div className="w-12 h-12 border-4 border-[var(--dp-color-accent)] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-[var(--dp-color-ink)]">
            جاري التحقق من جلسة تسجيل الدخول...
          </p>
        </div>
      </div>
    );
  }

  // If not logged in, redirect to /login with return path
  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  // If role is restricted and user's role is not allowed
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const userHomeUrl = getRoleRedirectUrl(user.role);

    return (
      <div className="min-h-screen bg-[var(--dp-color-ground)] flex items-center justify-center p-4">
        <div className="relative w-full max-w-lg">
          {/* Violet Backing */}
          <div
            className="absolute inset-0 bg-[var(--dp-color-accent-secondary)] rounded-[calc(var(--dp-radius-corner)+6px)] translate-x-2.5 translate-y-2.5 border-[3px] border-[var(--dp-color-outline)]"
            aria-hidden="true"
          />

          <div className="relative bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-8 shadow-hard text-right space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 border-[2.5px] border-[var(--dp-color-outline)] flex items-center justify-center text-rose-600 shadow-hard-sm">
              <ShieldAlert className="w-7 h-7 stroke-[2.2]" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-[var(--dp-color-ink)]">
                غير مصرح لك بالدخول لهذه المساحة
              </h2>
              <p className="text-sm text-[#4b5563] mt-2 leading-relaxed">
                هذه الصفحة مخصصة لحسابات ({allowedRoles.map((r) => (r === 'admin' ? 'الإشراف' : r === 'seller' ? 'البائعين' : 'المشترين')).join(' أو ')}) فقط، بينما حسابك الحالي مسجل كـ ({user.role === 'admin' ? 'مشرف' : user.role === 'seller' ? 'بائع' : 'مشتري'}).
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              {allowedRoles.includes('admin') && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSwitchToAdmin}
                  className="bg-[var(--dp-color-accent-secondary)] text-white hover:bg-purple-800 shadow-hard-sm"
                >
                  التبديل إلى حساب المشرف الافتراضي (Admin)
                </Button>
              )}
              <Button
                variant="outline"
                size="md"
                onClick={handleSwitchAccount}
              >
                تسجيل الخروج وتبديل الحساب
              </Button>
              <Link to={userHomeUrl}>
                <Button variant="outline" size="md" leftIcon={<ArrowLeft className="w-4 h-4 stroke-[2.5]" />}>
                  لوحة تحكمك الحالية
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

