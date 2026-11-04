import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/context/AuthContext';
import {
  getAdminUsers,
  suspendUser,
  reactivateUser,
  AdminUser,
} from '@/services/adminService';
import {
  sbFetchAllUsers,
  sbCreateAuditLog,
  SupabaseProfile,
} from '@/services/supabaseService';
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  UserX,
  UserCheck,
  Phone,
  Mail,
  Calendar,
  Building,
  AlertTriangle,
  Lock,
  X,
  Eye,
} from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const sbUsers = await sbFetchAllUsers().catch(() => null);
      if (sbUsers && sbUsers.length >= 0) {
        // Map Supabase profiles to AdminUser
        const mapped: AdminUser[] = sbUsers.map((p: SupabaseProfile) => ({
          id: p.id,
          fullName: p.full_name,
          email: p.email,
          phone: p.phone || '',
          role: p.role as any,
          status: 'active' as const,
          registeredAt: p.created_at?.slice(0, 10) || '',
          isVerified: true,
          propertiesCount: 0,
          appointmentsCount: 0,
        }));
        setUsers(mapped);
      } else {
        setUsers(getAdminUsers());
      }
    } catch {
      setUsers(getAdminUsers());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [selectedUserForSuspend, setSelectedUserForSuspend] = useState<AdminUser | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendError, setSuspendError] = useState('');

  const [selectedUserForDetails, setSelectedUserForDetails] = useState<AdminUser | null>(null);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (statusFilter !== 'all' && u.status !== statusFilter) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = u.fullName.toLowerCase().includes(q);
        const matchEmail = u.email.toLowerCase().includes(q);
        const matchPhone = u.phone.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchPhone) return false;
      }

      return true;
    });
  }, [users, roleFilter, statusFilter, searchTerm]);

  // Actions
  const handleConfirmSuspend = () => {
    if (!selectedUserForSuspend) return;
    if (!suspendReason.trim()) {
      setSuspendError('يرجى ذكر سبب تجميد الحساب.');
      return;
    }

    const res = suspendUser(selectedUserForSuspend.id, suspendReason);
    if (res.success) {
      setUsers(getAdminUsers());
      setSelectedUserForSuspend(null);
      setSuspendReason('');
    }
  };

  const handleConfirmReactivate = (user: AdminUser) => {
    const res = reactivateUser(user.id);
    if (res.success) {
      setUsers(getAdminUsers());
    }
  };

  return (
    <DashboardLayout
      role="admin"
      title="إدارة المستخدمين وحسابات المنصة"
      subtitle="متابعة حسابات المشترين والبائعين، مراجعة الهويات، وتجميد الحسابات المخالفة."
    >
      <div className="space-y-6 text-right">
        {/* Security Boundary Notice (Never allow role escalation) */}
        <div className="p-4 bg-amber-50 border-[2px] border-amber-300 rounded-xl text-amber-950 text-xs flex items-start gap-3">
          <div className="p-2 bg-white rounded-lg border border-amber-400 text-amber-800 shrink-0">
            <Lock className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="space-y-1">
            <h4 className="font-black text-sm">حماية أمنية مشددة للصلاحيات (Role Escalation Protection)</h4>
            <p className="leading-relaxed text-amber-900">
              صلاحيات الإشراف الإداري (Admin) محمية على مستوى الخادم وقواعد البيانات فقط. لا يمكن لأي مستخدم أو واجهة ترقية الحسابات إلى رتبة إشرافية من جانب العميل إطلاقاً لضمان أمان النظام.
            </p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-[var(--dp-color-panel)] border-[2.5px] border-[var(--dp-color-outline)] rounded-xl p-4 shadow-hard-sm space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-6 relative">
              <Input
                placeholder="ابحث بالاسم، البريد الإلكتروني، أو رقم الهاتف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                rightIcon={<Search className="w-4 h-4 text-[#8b95aa]" />}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="md:col-span-3">
              <Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'كافة الأدوار (بائع / مشتري / مشرف)' },
                  { value: 'buyer', label: 'المشترون فقط' },
                  { value: 'seller', label: 'البائعون فقط' },
                  { value: 'admin', label: 'مشرفو النظام فقط' },
                ]}
              />
            </div>

            <div className="md:col-span-3">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'كافة الحالات (نشط / مجمّد)' },
                  { value: 'active', label: 'حسابات نشطة' },
                  { value: 'suspended', label: 'حسابات مجمّدة' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] overflow-hidden shadow-hard text-right">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-[var(--dp-color-ground)] border-b-[2px] border-[var(--dp-color-outline)] text-xs font-black text-[#526078]">
                  <th className="p-4">المستخدم</th>
                  <th className="p-4">الدور الوظيفي</th>
                  <th className="p-4">بيانات الاتصال</th>
                  <th className="p-4">تاريخ التسجيل</th>
                  <th className="p-4">النشاط</th>
                  <th className="p-4">حالة الحساب</th>
                  <th className="p-4">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ece9db] text-xs sm:text-sm font-bold text-[var(--dp-color-ink)]">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-sm text-[#626d84]">
                      لا يوجد مستخدمون مطابقون لمعايير البحث
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--dp-color-ground)] border-[2px] border-[var(--dp-color-outline)] flex items-center justify-center font-black text-[var(--dp-color-accent)] shrink-0">
                          {u.fullName[0] || 'م'}
                        </div>
                        <div>
                          <span className="font-black text-sm block">{u.fullName}</span>
                          <span className="text-[11px] text-[#8b95aa]">{u.email}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        <Badge
                          variant={
                            u.role === 'admin'
                              ? 'secondary'
                              : u.role === 'seller'
                              ? 'warm'
                              : 'fresh'
                          }
                          size="sm"
                        >
                          {u.role === 'admin'
                            ? 'مشرف نظام'
                            : u.role === 'seller'
                            ? 'بائع'
                            : 'مشتري'}
                        </Badge>
                      </td>

                      <td className="p-4 text-xs font-bold text-[#4b5563]">
                        <span className="block">{u.phone}</span>
                      </td>

                      <td className="p-4 text-xs font-bold text-[#626d84]">
                        {u.registeredAt}
                      </td>

                      <td className="p-4 text-xs">
                        <span className="block text-[#4b5563]">
                          {u.role === 'seller' ? `${u.propertiesCount} عقار معروض` : `${u.appointmentsCount} معاينة`}
                        </span>
                      </td>

                      <td className="p-4">
                        {u.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            حساب نشط
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            حساب مجمّد
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedUserForDetails(u)}
                            className="text-xs p-1"
                            title="تفاصيل الحساب"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          {/* Admin accounts cannot be suspended */}
                          {u.role !== 'admin' && (
                            <>
                              {u.status === 'active' ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSuspendError('');
                                    setSuspendReason('');
                                    setSelectedUserForSuspend(u);
                                  }}
                                  className="text-[11px] font-black border-rose-300 text-rose-700 hover:bg-rose-50"
                                >
                                  تجميد الحساب
                                </Button>
                              ) : (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleConfirmReactivate(u)}
                                  className="text-[11px] font-black bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                  إعادة التنشيط
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          Suspend User Modal
         ------------------------------------------------------------- */}
      {selectedUserForSuspend && (
        <Modal
          isOpen={Boolean(selectedUserForSuspend)}
          onClose={() => setSelectedUserForSuspend(null)}
          title={`تجميد حساب: ${selectedUserForSuspend.fullName}`}
          description="سيتم إيقاف قدرة المستخدم على تسجيل الدخول ونشر العقارات أو حجز المعاينات فوراً."
          size="md"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setSelectedUserForSuspend(null)}>
                إلغاء
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleConfirmSuspend}
                className="bg-rose-600 text-white hover:bg-rose-700 border-rose-800"
              >
                تأكيد التجميد
              </Button>
            </>
          }
        >
          <div className="space-y-4 text-right">
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 text-xs">
              <span className="font-black block mb-1">سبب التجميد الإلزامي:</span>
              يُسجل هذا السبب رسمياً في سجل العمليات الأمنية للمنصة (Audit Trail) للرجوع إليه قانونياً.
            </div>

            <div>
              <Textarea
                placeholder="اذكر سبب التجميد (مثال: محاولة احتيال، إدخال مستندات مزورة، مخالفة شروط الاستخدام...)"
                value={suspendReason}
                onChange={(e) => {
                  setSuspendReason(e.target.value);
                  if (suspendError) setSuspendError('');
                }}
                error={suspendError}
                required
              />
            </div>
          </div>
        </Modal>
      )}

      {/* -------------------------------------------------------------
          User Details Modal
         ------------------------------------------------------------- */}
      {selectedUserForDetails && (
        <Modal
          isOpen={Boolean(selectedUserForDetails)}
          onClose={() => setSelectedUserForDetails(null)}
          title={`ملف المستخدم: ${selectedUserForDetails.fullName}`}
          size="md"
          footer={
            <Button variant="primary" size="sm" onClick={() => setSelectedUserForDetails(null)}>
              إغلاق
            </Button>
          }
        >
          <div className="space-y-4 text-right">
            <div className="p-4 bg-[var(--dp-color-ground)] rounded-xl border border-[var(--dp-color-outline)] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#ece9db]">
                <span className="text-xs font-bold text-[#626d84]">المعرف الرقمي (UUID):</span>
                <span className="text-xs font-mono font-bold">{selectedUserForDetails.id}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[#ece9db]">
                <span className="text-xs font-bold text-[#626d84]">البريد الإلكتروني:</span>
                <span className="text-xs font-bold">{selectedUserForDetails.email}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[#ece9db]">
                <span className="text-xs font-bold text-[#626d84]">رقم الهاتف:</span>
                <span className="text-xs font-bold">{selectedUserForDetails.phone}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[#ece9db]">
                <span className="text-xs font-bold text-[#626d84]">الرتبة في النظام:</span>
                <Badge variant="warm" size="sm">{selectedUserForDetails.role}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#626d84]">تاريخ الانضمام:</span>
                <span className="text-xs font-bold">{selectedUserForDetails.registeredAt}</span>
              </div>
            </div>

            {selectedUserForDetails.suspendReason && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs space-y-1">
                <span className="font-black block text-rose-950">سبب التجميد المسجل:</span>
                <p className="text-[11px] leading-relaxed">{selectedUserForDetails.suspendReason}</p>
                <span className="text-[10px] text-rose-700 block mt-1">تاريخ التجميد: {selectedUserForDetails.suspendedAt}</span>
              </div>
            )}
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
};
