import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { getAdminInquiries, AdminInquiry } from '@/services/adminService';
import { sbFetchAllInquiries, SupabaseInquiry } from '@/services/supabaseService';
import {
  MessageSquare,
  Search,
  Filter,
  User,
  Phone,
  Calendar,
  Building,
  CheckCircle2,
  Clock,
  X,
  Eye,
  RefreshCw,
} from 'lucide-react';

export const AdminInquiriesPage: React.FC = () => {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInquiry, setSelectedInquiry] = useState<any | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const sbData = await sbFetchAllInquiries().catch(() => null);
      if (sbData && sbData.length >= 0) {
        const mapped = sbData.map((inq: SupabaseInquiry) => ({
          id: inq.id,
          propertyId: inq.property_id,
          propertyTitle: (inq as any).property?.title || 'عقار',
          propertyPrice: (inq as any).property?.price || 0,
          buyerId: inq.buyer_id,
          buyerName: (inq as any).buyer?.full_name || 'مشتري',
          buyerPhone: (inq as any).buyer?.phone || '',
          sellerId: inq.seller_id,
          sellerName: (inq as any).seller?.full_name || 'بائع',
          sellerPhone: (inq as any).seller?.phone || '',
          message: inq.message,
          reply: inq.reply,
          status: inq.status,
          statusLabel: { new: 'جديد', replied: 'تم الرد', handled: 'تمت المعالجة' }[inq.status] || inq.status,
          createdAt: inq.created_at,
        }));
        setInquiries(mapped);
      } else {
        setInquiries(getAdminInquiries());
      }
    } catch {
      setInquiries(getAdminInquiries());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inq) => {
      if (statusFilter !== 'all' && inq.status !== statusFilter) {
        return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchProp = inq.propertyTitle.toLowerCase().includes(q);
        const matchBuyer = inq.buyerName.toLowerCase().includes(q);
        const matchSeller = inq.sellerName.toLowerCase().includes(q);
        const matchMsg = inq.message.toLowerCase().includes(q);
        if (!matchProp && !matchBuyer && !matchSeller && !matchMsg) return false;
      }

      return true;
    });
  }, [inquiries, statusFilter, searchTerm]);

  return (
    <DashboardLayout
      role="admin"
      title="مراقبة استفسارات المشترين والبائعين"
      subtitle="متابعة تواصل المستخدمين حول العقارات وضمان سرعة الرد ومكافحة الرسائل الاحتيالية."
    >
      <div className="space-y-6 text-right">
        {/* Search & Filter */}
        <div className="bg-[var(--dp-color-panel)] border-[2.5px] border-[var(--dp-color-outline)] rounded-xl p-4 shadow-hard-sm space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-8 relative">
              <Input
                placeholder="ابحث بالعقار، اسم المشتري، اسم البائع، أو نص الرسالة..."
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
                  { value: 'all', label: 'كافة الاستفسارات' },
                  { value: 'waiting_response', label: 'بانتظار رد البائع' },
                  { value: 'responded', label: 'تم الرد من البائع' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Inquiries Cards */}
        {filteredInquiries.length === 0 ? (
          <div className="p-12 bg-white border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] text-center shadow-hard space-y-3">
            <MessageSquare className="w-16 h-16 text-indigo-400 mx-auto" />
            <h3 className="text-lg font-black text-[var(--dp-color-ink)]">
              لا توجد استفسارات مطابقة لبحثك
            </h3>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInquiries.map((inq) => (
              <div
                key={inq.id}
                className="bg-white border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-5 shadow-hard space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b-2 border-[#ece9db]">
                  <div className="flex items-center gap-2">
                    <Badge variant={inq.status === 'responded' ? 'fresh' : 'warm'} size="sm">
                      {inq.status === 'responded' ? 'تم الرد' : 'بانتظار رد البائع'}
                    </Badge>
                    <h4 className="font-black text-sm text-[var(--dp-color-ink)]">
                      {inq.propertyTitle}
                    </h4>
                  </div>
                  <span className="text-xs font-bold text-[#8b95aa]">{inq.date}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-[var(--dp-color-ground)] rounded-xl border border-[#ece9db] space-y-1">
                    <span className="text-[#626d84] block font-bold">بيانات المشتري (المرسِل):</span>
                    <span className="font-black text-sm block text-[var(--dp-color-ink)]">{inq.buyerName}</span>
                    <span className="text-[11px] text-[#4b5563] block">{inq.buyerPhone}</span>
                  </div>

                  <div className="p-3 bg-[var(--dp-color-ground)] rounded-xl border border-[#ece9db] space-y-1">
                    <span className="text-[#626d84] block font-bold">بيانات البائع (المستقبِل):</span>
                    <span className="font-black text-sm block text-[var(--dp-color-ink)]">{inq.sellerName}</span>
                    <span className="text-[11px] text-[#4b5563] block">{inq.sellerPhone}</span>
                  </div>
                </div>

                {/* Message */}
                <div className="p-3.5 bg-gray-50 rounded-xl border border-[#e5e7eb] text-xs space-y-1">
                  <span className="font-black text-[#374151] block">نص استفسار المشتري:</span>
                  <p className="text-[#4b5563] leading-relaxed">"{inq.message}"</p>
                </div>

                {/* Seller Response if available */}
                {inq.response && (
                  <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-1">
                    <span className="font-black text-emerald-950 block">رد البائع:</span>
                    <p className="text-emerald-900 leading-relaxed">{inq.response}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

