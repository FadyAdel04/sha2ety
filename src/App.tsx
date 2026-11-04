import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// Public pages
import { HomePage } from '@/pages/HomePage';
import { PropertiesPage } from '@/pages/PropertiesPage';
import { PropertyDetailPage } from '@/pages/PropertyDetailPage';
import { HowItWorksPage } from '@/pages/HowItWorksPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';

// Seller pages
import { SellerDashboardPage } from '@/pages/seller/SellerDashboardPage';
import { SellerPropertiesPage } from '@/pages/seller/SellerPropertiesPage';
import { SellerNewPropertyPage } from '@/pages/seller/SellerNewPropertyPage';
import { SellerAppointmentsPage } from '@/pages/seller/SellerAppointmentsPage';
import { SellerInquiriesPage } from '@/pages/seller/SellerInquiriesPage';
import { SellerNotificationsPage } from '@/pages/seller/SellerNotificationsPage';
import { SellerProfilePage } from '@/pages/seller/SellerProfilePage';

// Buyer pages
import { BuyerDashboardPage } from '@/pages/buyer/BuyerDashboardPage';
import { BuyerFavoritesPage } from '@/pages/buyer/BuyerFavoritesPage';
import { BuyerAppointmentsPage } from '@/pages/buyer/BuyerAppointmentsPage';
import { BuyerInquiriesPage } from '@/pages/buyer/BuyerInquiriesPage';
import { BuyerRecentlyViewedPage } from '@/pages/buyer/BuyerRecentlyViewedPage';
import { BuyerNotificationsPage } from '@/pages/buyer/BuyerNotificationsPage';
import { BuyerProfilePage } from '@/pages/buyer/BuyerProfilePage';

// Admin pages
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminPropertiesPage } from '@/pages/admin/AdminPropertiesPage';
import { AdminReviewsPage } from '@/pages/admin/AdminReviewsPage';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
import { AdminAppointmentsPage } from '@/pages/admin/AdminAppointmentsPage';
import { AdminInquiriesPage } from '@/pages/admin/AdminInquiriesPage';
import { AdminAuditLogPage } from '@/pages/admin/AdminAuditLogPage';
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage';

// UI
import { EmptyState } from '@/components/ui/EmptyState';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/properties" element={<PropertiesPage />} />
          <Route path="/properties/:id" element={<PropertyDetailPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected Seller Routes (Seller & Admin only) */}
          <Route
            path="/seller/dashboard"
            element={
              <ProtectedRoute allowedRoles={['seller', 'admin']}>
                <SellerDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/properties"
            element={
              <ProtectedRoute allowedRoles={['seller', 'admin']}>
                <SellerPropertiesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/properties/new"
            element={
              <ProtectedRoute allowedRoles={['seller', 'admin']}>
                <SellerNewPropertyPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/appointments"
            element={
              <ProtectedRoute allowedRoles={['seller', 'admin']}>
                <SellerAppointmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/inquiries"
            element={
              <ProtectedRoute allowedRoles={['seller', 'admin']}>
                <SellerInquiriesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/notifications"
            element={
              <ProtectedRoute allowedRoles={['seller', 'admin']}>
                <SellerNotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/profile"
            element={
              <ProtectedRoute allowedRoles={['seller', 'admin']}>
                <SellerProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Protected Buyer Routes (Buyer & Admin only) */}
          <Route
            path="/buyer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['buyer', 'admin']}>
                <BuyerDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer/favorites"
            element={
              <ProtectedRoute allowedRoles={['buyer', 'admin']}>
                <BuyerFavoritesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer/appointments"
            element={
              <ProtectedRoute allowedRoles={['buyer', 'admin']}>
                <BuyerAppointmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer/inquiries"
            element={
              <ProtectedRoute allowedRoles={['buyer', 'admin']}>
                <BuyerInquiriesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer/recently-viewed"
            element={
              <ProtectedRoute allowedRoles={['buyer', 'admin']}>
                <BuyerRecentlyViewedPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer/notifications"
            element={
              <ProtectedRoute allowedRoles={['buyer', 'admin']}>
                <BuyerNotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer/profile"
            element={
              <ProtectedRoute allowedRoles={['buyer', 'admin']}>
                <BuyerProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Protected Admin Routes (Admin ONLY - users can NEVER assign themselves admin) */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/properties"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPropertiesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reviews"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminReviewsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/appointments"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminAppointmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/inquiries"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminInquiriesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audit-log"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminAuditLogPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminSettingsPage />
              </ProtectedRoute>
            }
          />

          {/* 404 Route */}
          <Route
            path="*"
            element={
              <div className="min-h-screen bg-[var(--dp-color-ground)] flex items-center justify-center p-4">
                <EmptyState
                  title="الصفحة المطلوبة غير موجودة (404)"
                  description="عفواً، يبدو أن الرابط الذي حاولت الوصول إليه غير صحيح أو تم نقله."
                  actionLabel="العودة للصفحة الرئيسية"
                  onAction={() => (window.location.href = '/')}
                />
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
