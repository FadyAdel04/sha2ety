import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/hooks/useSupabaseData';
import {
  SupabaseNotification,
} from '@/services/supabaseService';
import {
  Bell,
  Building2,
  CalendarCheck,
  MessageSquare,
  User,
  Check,
  Trash2,
  Clock,
  ArrowLeft,
} from 'lucide-react';

export interface NotificationCenterProps {
  role: 'seller' | 'buyer' | 'admin';
  title?: string;
  subtitle?: string;
}

type CategoryFilter = SupabaseNotification['type'] | 'all';

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  role,
  title = 'مركز الإشعارات والتنبيهات',
  subtitle = 'تابع أحدث مستجدات عقاراتك، مواعيد المعاينة، ورسائل الاستفسار من مكان واحد.',
}) => {
  const { user } = useAuth();
  const { notifications, loading, markRead, markAllRead, unreadCount } = useNotifications(user?.id);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  const visibleNotifications = useMemo(() => {
    return notifications.filter((n) => !deletedIds.has(n.id));
  }, [notifications, deletedIds]);

  const filteredNotifications = useMemo(() => {
    if (selectedCategory === 'all') return visibleNotifications;
    return visibleNotifications.filter((n) => n.type === selectedCategory);
  }, [visibleNotifications, selectedCategory]);

  const handleMarkOne = async (id: string) => {
    await markRead(id);
  };

  const handleMarkAll = async () => {
    await markAllRead();
  };

  const handleDelete = (id: string) => {
    setDeletedIds((prev) => new Set([...prev, id]));
  };

  const getCategoryIcon = (type: SupabaseNotification['type']) => {
    switch (type) {
      case 'properties':
        return <Building2 className="w-5 h-5 text-[var(--dp-color-accent)]" />;
      case 'appointments':
        return <CalendarCheck className="w-5 h-5 text-amber-600" />;
      case 'inquiries':
        return <MessageSquare className="w-5 h-5 text-emerald-600" />;
      case 'account':
        return <User className="w-5 h-5 text-purple-600" />;
    }
  };

  const getCategoryLabel = (type: SupabaseNotification['type']) => {
    const map: Record<string, string> = {
      properties: 'العقارات',
      appointments: 'المعاينات',
      inquiries: 'الاستفسارات',
      account: 'الحساب',
    };
    return map[type] || type;
  };

  const getCategoryBadgeVariant = (type: SupabaseNotification['type']) => {
    switch (type) {
      case 'properties': return 'primary';
      case 'appointments': return 'warm';
      case 'inquiries': return 'fresh';
      case 'account': return 'secondary';
      default: return 'muted';
    }
  };

  const getActionUrl = (n: SupabaseNotification) => {
    switch (n.type) {
      case 'appointments':
        return role === 'seller' ? '/seller/appointments' : '/buyer/appointments';
      case 'inquiries':
        return role === 'seller' ? '/seller/inquiries' : '/buyer/inquiries';
      case 'properties':
        return role === 'seller' ? '/seller/properties' : n.related_id ? `/properties/${n.related_id}` : '/properties';
      case 'account':
        return role === 'seller' ? '/seller/profile' : '/buyer/profile';
      default:
        return '#';
    }
  };

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays === 1) return 'أمس';
    if (diffDays < 7) return `منذ ${diffDays} أيام`;
    return date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border-[2.5px] border-[var(--dp-color-outline)] rounded-2xl p-5 space-y-3">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-6 w-3/4 rounded" />
            <Skeleton className="h-12 w-full rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 text-right">
      {/* Top Header Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--dp-color-panel)] border-[2.5px] border-[var(--dp-color-outline)] p-4 rounded-xl shadow-hard-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#626d84]">الإشعارات غير المقروءة:</span>
          {unreadCount > 0 ? (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500 text-white shadow-hard-sm">
              {unreadCount} إشعارات جديدة
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
              جميع الإشعارات مقروءة
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAll}
            leftIcon={<Check className="w-4 h-4" />}
            className="text-xs font-black bg-white hover:bg-gray-50"
          >
            تحديد الكل كمقروء
          </Button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex border-b-[2.5px] border-[var(--dp-color-outline)] gap-2 overflow-x-auto pb-0.5">
        {[
          { id: 'all', label: 'كافة الإشعارات', count: visibleNotifications.length },
          { id: 'properties', label: 'العقارات', count: visibleNotifications.filter((n) => n.type === 'properties').length },
          { id: 'appointments', label: 'المعاينات', count: visibleNotifications.filter((n) => n.type === 'appointments').length },
          { id: 'inquiries', label: 'الاستفسارات', count: visibleNotifications.filter((n) => n.type === 'inquiries').length },
          { id: 'account', label: 'الحساب', count: visibleNotifications.filter((n) => n.type === 'account').length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id as CategoryFilter)}
            className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer border-b-[3px] -mb-[2.5px] whitespace-nowrap ${
              selectedCategory === tab.id
                ? 'border-[var(--dp-color-accent)] text-[var(--dp-color-accent)]'
                : 'border-transparent text-[#626d84] hover:text-[var(--dp-color-ink)]'
            }`}
          >
            <span>{tab.label}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[11px] bg-gray-100 border border-gray-300 text-gray-700">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="p-12 bg-white border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] text-center shadow-hard space-y-3">
          <Bell className="w-14 h-14 text-indigo-400 mx-auto" />
          <h3 className="text-lg font-black text-[var(--dp-color-ink)]">
            صندوق الإشعارات فارغ في هذا التصنيف
          </h3>
          <p className="text-xs text-[#626d84]">
            ستظهر هنا كافة التنبيهات الخاصة بحالة عقاراتك، مواعيد المعاينة، واستفسارات المشترين.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => {
            const actionUrl = getActionUrl(notif);
            return (
              <div
                key={notif.id}
                className={`relative bg-white border-[2.5px] rounded-2xl p-4 sm:p-5 transition-all shadow-hard-sm hover:shadow-hard ${
                  !notif.is_read
                    ? 'border-[var(--dp-color-accent)] bg-amber-50/20'
                    : 'border-[var(--dp-color-outline)]'
                }`}
              >
                {/* Unread Accent Pill */}
                {!notif.is_read && (
                  <span className="absolute top-4 left-4 w-2.5 h-2.5 rounded-full bg-rose-500 ring-4 ring-rose-100" />
                )}

                <div className="flex items-start gap-3 sm:gap-4">
                  {/* Category Icon Badge */}
                  <div className="w-11 h-11 rounded-xl bg-[var(--dp-color-ground)] border-[2px] border-[var(--dp-color-outline)] flex items-center justify-center shrink-0 shadow-hard-sm">
                    {getCategoryIcon(notif.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-1.5 text-right pl-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={getCategoryBadgeVariant(notif.type) as any} size="sm">
                        {getCategoryLabel(notif.type)}
                      </Badge>
                      <span className="text-[11px] font-bold text-[#8b95aa] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(notif.created_at)}
                      </span>
                    </div>

                    <h4 className="text-sm sm:text-base font-black text-[var(--dp-color-ink)]">
                      {notif.title}
                    </h4>

                    {/* Speech-like outlined panel for description */}
                    <div className="relative mt-2 p-3 bg-[var(--dp-color-ground)] rounded-xl border border-[var(--dp-color-outline)] text-xs text-[#374151] font-medium leading-relaxed">
                      <p>{notif.message}</p>
                    </div>

                    {/* Actions Bar */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Link to={actionUrl} onClick={() => handleMarkOne(notif.id)}>
                          <Button
                            variant="primary"
                            size="sm"
                            className="text-xs font-black shadow-hard-sm"
                            rightIcon={<ArrowLeft className="w-3.5 h-3.5" />}
                          >
                            عرض التفاصيل
                          </Button>
                        </Link>

                        {!notif.is_read && (
                          <button
                            type="button"
                            onClick={() => handleMarkOne(notif.id)}
                            className="text-xs font-bold text-[#626d84] hover:text-[var(--dp-color-ink)] hover:underline flex items-center gap-1 cursor-pointer mr-2"
                            aria-label="تحديد الإشعار كمقروء"
                          >
                            <Check className="w-3.5 h-3.5" />
                            تحديد كمقروء
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDelete(notif.id)}
                        className="text-[#a0aec0] hover:text-rose-600 transition-colors cursor-pointer p-1"
                        title="إخفاء الإشعار"
                        aria-label="إخفاء الإشعار"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
