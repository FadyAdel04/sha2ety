import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { getAuditLog, AuditLogEntry } from '@/services/adminService';
import { sbFetchAuditLogs, SupabaseAuditLog } from '@/services/supabaseService';
import {
  ClipboardList,
  Search,
  Filter,
  ShieldCheck,
  FileCheck,
  UserX,
  UserCheck,
  AlertTriangle,
  Sparkles,
  Calendar,
  X,
  FileText,
  Download,
  RefreshCw,
} from 'lucide-react';

const ACTION_LABELS: Record<string, string> = {
  approve_property: 'اعتماد عقار',
  reject_property: 'رفض عقار',
  request_changes: 'طلب تعديلات',
  suspend_user: 'تعليق مستخدم',
  reactivate_user: 'إعادة تفعيل مستخدم',
  delete_property: 'حذف عقار',
};

export const AdminAuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const sbData = await sbFetchAuditLogs().catch(() => null);
      if (sbData && sbData.length >= 0) {
        const mapped = sbData.map((log: SupabaseAuditLog) => ({
          id: log.id,
          adminId: log.admin_id,
          adminName: (log as any).admin?.full_name || 'مشرف النظام',
          actionType: log.action,
          actionTitle: ACTION_LABELS[log.action] || log.action,
          targetType: log.target_type,
          targetTitle: log.target_id,
          targetId: log.target_id,
          reasonOrNotes: log.details || '',
          timestamp: new Date(log.created_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          createdAt: log.created_at,
        }));
        setLogs(mapped);
      } else {
        setLogs(getAuditLog());
      }
    } catch {
      setLogs(getAuditLog());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (actionFilter !== 'all' && log.actionType !== actionFilter) {
        return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchTitle = log.actionTitle.toLowerCase().includes(q);
        const matchTarget = log.targetTitle.toLowerCase().includes(q);
        const matchAdmin = log.adminName.toLowerCase().includes(q);
        const matchReason = (log.reasonOrNotes || '').toLowerCase().includes(q);
        if (!matchTitle && !matchTarget && !matchAdmin && !matchReason) return false;
      }

      return true;
    });
  }, [logs, actionFilter, searchTerm]);

  const renderActionBadge = (actionType: string) => {
    switch (actionType) {
      case 'approve_property':
        return <Badge variant="fresh" size="sm">اعتماد ونشر عقار</Badge>;
      case 'reject_property':
        return <Badge variant="danger" size="sm">رفض عقار</Badge>;
      case 'request_changes':
        return <Badge variant="warm" size="sm">طلب تعديلات</Badge>;
      case 'suspend_user':
        return <Badge variant="danger" size="sm">تجميد حساب</Badge>;
      case 'reactivate_user':
        return <Badge variant="fresh" size="sm">تنشيط حساب</Badge>;
      case 'update_settings':
        return <Badge variant="secondary" size="sm">تحديث إعدادات</Badge>;
      default:
        return <Badge variant="muted" size="sm">{actionType}</Badge>;
    }
  };

  const handleExportLogs = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `sha2ety_audit_log_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <DashboardLayout
      role="admin"
      title="سجل العمليات الإدارية والرقابية (Audit Log)"
      subtitle="سجل تدقيق غير قابل للتعديل يوثق كافة إجراءات المشرفين مع الأسباب والتواريخ الرسمية."
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportLogs}
          leftIcon={<Download className="w-4 h-4" />}
          className="text-xs font-black shadow-hard-sm"
        >
          تصدير السجل (JSON)
        </Button>
      }
    >
      <div className="space-y-6 text-right">
        {/* Search & Filter Bar */}
        <div className="bg-[var(--dp-color-panel)] border-[2.5px] border-[var(--dp-color-outline)] rounded-xl p-4 shadow-hard-sm space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-8 relative">
              <Input
                placeholder="ابحث باسم المشرف، الهدف، الإجراء، أو سبب القرار..."
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
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'كافة أنواع العمليات' },
                  { value: 'approve_property', label: 'اعتماد ونشر العقارات' },
                  { value: 'reject_property', label: 'رفض العقارات' },
                  { value: 'request_changes', label: 'طلب تعديل أوراق ومواصفات' },
                  { value: 'suspend_user', label: 'تجميد حسابات المستخدمين' },
                  { value: 'reactivate_user', label: 'إلغاء تجميد الحسابات' },
                  { value: 'update_settings', label: 'تحديث إعدادات وسياسات المنصة' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="bg-white border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] overflow-hidden shadow-hard text-right">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-[var(--dp-color-ground)] border-b-[2px] border-[var(--dp-color-outline)] text-xs font-black text-[#526078]">
                  <th className="p-4">نوع الإجراء الإداري</th>
                  <th className="p-4">المشرف المسؤول</th>
                  <th className="p-4">الهدف / الكيان</th>
                  <th className="p-4">تحول الحالة</th>
                  <th className="p-4">السبب / الملاحظات الرسمية</th>
                  <th className="p-4">التاريخ والوقت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ece9db] text-xs sm:text-sm font-bold text-[var(--dp-color-ink)]">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-sm text-[#626d84]">
                      لا توجد عمليات مسجلة مطابقة لبحثك
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="space-y-1">
                          {renderActionBadge(item.actionType)}
                          <span className="block text-[11px] font-black text-[#526078]">
                            {item.actionTitle}
                          </span>
                        </div>
                      </td>

                      <td className="p-4 text-xs font-bold">
                        <span className="font-black text-[var(--dp-color-ink)] block">{item.adminName}</span>
                        <span className="text-[10px] text-[#8b95aa]">{item.adminEmail}</span>
                      </td>

                      <td className="p-4 text-xs">
                        <span className="font-black text-[var(--dp-color-ink)] block max-w-xs line-clamp-1">
                          {item.targetTitle}
                        </span>
                        <span className="text-[10px] font-mono text-[#8b95aa]">{item.targetId}</span>
                      </td>

                      <td className="p-4 text-xs">
                        {item.prevStatus && item.newStatus ? (
                          <div className="flex items-center gap-1.5 font-mono text-[11px]">
                            <span className="text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                              {item.prevStatus}
                            </span>
                            <span>←</span>
                            <span className="text-indigo-800 bg-indigo-50 px-1.5 py-0.5 rounded font-black">
                              {item.newStatus}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-[#8b95aa]">—</span>
                        )}
                      </td>

                      <td className="p-4 text-xs max-w-md font-medium text-[#4b5563]">
                        {item.reasonOrNotes || '—'}
                      </td>

                      <td className="p-4 text-xs text-[#626d84] font-bold whitespace-nowrap">
                        {item.timestamp}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
