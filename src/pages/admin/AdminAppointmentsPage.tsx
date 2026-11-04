import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { getStoredAppointments, AppointmentItem } from '@/services/appointmentService';
import { sbFetchAllAppointments, SupabaseAppointment } from '@/services/supabaseService';
import {
  CalendarCheck,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  Phone,
  Building,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X,
  RefreshCw,
} from 'lucide-react';

export const AdminAppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const sbData = await sbFetchAllAppointments().catch(() => null);
      if (sbData && sbData.length >= 0) {
        const mapped = sbData.map((a: SupabaseAppointment) => ({
          id: a.id,
          propertyId: a.property_id,
          propertyTitle: (a as any).property?.title || 'عقار غير محدد',
          propertyLocation: (a as any).property?.city || '',
          propertyPrice: (a as any).property?.price || 0,
          propertyImage: (a as any).property?.cover_image_url || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80',
          buyerId: a.buyer_id,
          buyerName: (a as any).buyer?.full_name || 'مشتري',
          buyerPhone: (a as any).buyer?.phone || '',
          sellerId: a.seller_id,
          sellerName: (a as any).seller?.full_name || 'بائع',
          sellerPhone: (a as any).seller?.phone || '',
          isSellerVerified: true,
          date: a.appointment_date,
          dateFormatted: new Date(a.appointment_date).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
          timeSlot: a.appointment_time,
          timeSlotId: '',
          status: a.status,
          statusLabel: { pending: 'في انتظار التأكيد', confirmed: 'تم التأكيد', completed: 'مكتملة', cancelled: 'ملغية', rejected: 'مرفوضة', rescheduled: 'موعد مقترح' }[a.status] || a.status,
          notes: a.buyer_message,
          createdAt: a.created_at,
          updatedAt: a.updated_at || a.created_at,
        }));
        setAppointments(mapped);
      } else {
        setAppointments(getStoredAppointments());
      }
    } catch {
      setAppointments(getStoredAppointments());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((app) => {
      if (statusFilter !== 'all' && app.status !== statusFilter) {
        return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchProp = app.propertyTitle.toLowerCase().includes(q);
        const matchBuyer = app.buyerName.toLowerCase().includes(q);
        const matchSeller = app.sellerName.toLowerCase().includes(q);
        const matchId = app.id.toLowerCase().includes(q);
        if (!matchProp && !matchBuyer && !matchSeller && !matchId) return false;
      }

      return true;
    });
  }, [appointments, statusFilter, searchTerm]);

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="fresh" size="sm">معاينة مؤكدة</Badge>;
      case 'pending':
        return <Badge variant="warm" size="sm">في انتظار التأكيد</Badge>;
      case 'rescheduled':
        return <Badge variant="secondary" size="sm">اقتراح موعد بديل</Badge>;
      case 'completed':
        return <Badge variant="fresh" size="sm">مكتملة بنجاح</Badge>;
      case 'cancelled':
        return <Badge variant="muted" size="sm">ملغية</Badge>;
      case 'rejected':
        return <Badge variant="danger" size="sm">مرفوضة</Badge>;
      default:
        return <Badge variant="muted" size="sm">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout
      role="admin"
      title="جدول المعاينات الميدانية العام"
      subtitle="متابعة كافة طلبات ومواعيد المعاينات المحجوزة عبر المنصة ومراقبة نسبة الالتزام."
    >
      <div className="space-y-6 text-right">
        {/* Search & Filter */}
        <div className="bg-[var(--dp-color-panel)] border-[2.5px] border-[var(--dp-color-outline)] rounded-xl p-4 shadow-hard-sm space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-8 relative">
              <Input
                placeholder="ابحث بالعقار، اسم المشتري، اسم البائع، أو كود الحجز..."
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

            <div className="md:col-span-4">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'كافة الحالات' },
                  { value: 'confirmed', label: 'معاينات مؤكدة' },
                  { value: 'pending', label: 'في انتظار التأكيد' },
                  { value: 'rescheduled', label: 'اقتراح موعد بديل' },
                  { value: 'completed', label: 'معاينات تمت بنجاح' },
                  { value: 'cancelled', label: 'معاينات ملغية' },
                  { value: 'rejected', label: 'معاينات مرفوضة' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Counter */}
        <div className="flex items-center justify-between text-xs text-[#626d84] font-bold px-1">
          <span>إجمالي المعاينات المعروضة: {filteredAppointments.length} موعد</span>
        </div>

        {/* Appointments List */}
        {filteredAppointments.length === 0 ? (
          <div className="p-12 bg-white border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] text-center shadow-hard space-y-3">
            <CalendarCheck className="w-16 h-16 text-indigo-400 mx-auto" />
            <h3 className="text-lg font-black text-[var(--dp-color-ink)]">
              لا توجد مواعيد معاينة مطابقة لبحثك
            </h3>
          </div>
        ) : (
          <div className="bg-white border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] overflow-hidden shadow-hard text-right">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-[var(--dp-color-ground)] border-b-[2px] border-[var(--dp-color-outline)] text-xs font-black text-[#526078]">
                    <th className="p-4">كود الحجز والعقار</th>
                    <th className="p-4">المشتري</th>
                    <th className="p-4">البائع</th>
                    <th className="p-4">تاريخ ووقت المعاينة</th>
                    <th className="p-4">الحالة</th>
                    <th className="p-4">ملاحظات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ece9db] text-xs sm:text-sm font-bold text-[var(--dp-color-ink)]">
                  {filteredAppointments.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <span className="font-mono text-xs font-black text-[var(--dp-color-accent)] block">
                          #{app.id.toUpperCase()}
                        </span>
                        <span className="font-black text-sm text-[var(--dp-color-ink)] block line-clamp-1 max-w-xs">
                          {app.propertyTitle}
                        </span>
                      </td>

                      <td className="p-4 text-xs font-bold text-[#4b5563]">
                        <span className="block font-black text-[var(--dp-color-ink)]">{app.buyerName}</span>
                        <span className="text-[11px] text-[#8b95aa]">{app.buyerPhone}</span>
                      </td>

                      <td className="p-4 text-xs font-bold text-[#4b5563]">
                        <span className="block font-black text-[var(--dp-color-ink)]">{app.sellerName}</span>
                        <span className="text-[11px] text-[#8b95aa]">{app.sellerPhone}</span>
                      </td>

                      <td className="p-4 text-xs">
                        <span className="font-black text-[var(--dp-color-ink)] block">
                          {app.dateFormatted || app.date}
                        </span>
                        <span className="text-[11px] text-[#626d84] block mt-0.5">
                          الفترة: {app.timeSlot}
                        </span>
                      </td>

                      <td className="p-4">
                        {renderStatusBadge(app.status)}
                      </td>

                      <td className="p-4 text-xs max-w-xs text-[#626d84]">
                        {app.rejectionReason ? (
                          <span className="text-rose-700 font-bold block">
                            رفض: {app.rejectionReason}
                          </span>
                        ) : app.notes ? (
                          <span className="line-clamp-1">{app.notes}</span>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
