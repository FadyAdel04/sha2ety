import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ConversationDrawer } from '@/components/inquiries/ConversationDrawer';
import { formatEGP } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import {
  getUserConversations,
  ConversationThread,
} from '@/services/communicationService';
import {
  MessageSquare,
  Search,
  Clock,
  Phone,
  Building,
  ArrowLeft,
  X,
  ExternalLink,
} from 'lucide-react';

export const BuyerInquiriesPage: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationThread[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState<'all' | 'replied' | 'pending'>('all');
  const [activeConvId, setActiveConvId] = useState<string | null>(null);

  const refreshList = () => {
    setConversations(getUserConversations('buyer', user?.id));
  };

  useEffect(() => {
    refreshList();
  }, [user?.id]);

  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      if (selectedStatusTab === 'replied' && c.status !== 'replied' && c.status !== 'handled') {
        return false;
      }
      if (selectedStatusTab === 'pending' && c.status !== 'new') {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchProp = c.propertyTitle.toLowerCase().includes(q);
        const matchSeller = c.sellerName.toLowerCase().includes(q);
        const matchMsg = c.lastMessage.toLowerCase().includes(q);
        if (!matchProp && !matchSeller && !matchMsg) return false;
      }
      return true;
    });
  }, [conversations, selectedStatusTab, searchTerm]);

  return (
    <DashboardLayout
      role="buyer"
      title="استفساراتي ورسائل الملاك"
      subtitle="متابعة ردود الملاك على استفساراتك والتنسيق المباشر حول الأسعار وتفاصيل العقارات."
    >
      <div className="space-y-6 text-right">
        {/* Status Tabs */}
        <div className="flex border-b-[2.5px] border-[var(--dp-color-outline)] gap-2">
          <button
            onClick={() => setSelectedStatusTab('all')}
            className={`pb-3 px-4 text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer border-b-[3px] -mb-[2.5px] ${
              selectedStatusTab === 'all'
                ? 'border-[var(--dp-color-accent)] text-[var(--dp-color-accent)]'
                : 'border-transparent text-[#626d84] hover:text-[var(--dp-color-ink)]'
            }`}
          >
            <span>كافة الاستفسارات ({conversations.length})</span>
          </button>

          <button
            onClick={() => setSelectedStatusTab('replied')}
            className={`pb-3 px-4 text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer border-b-[3px] -mb-[2.5px] ${
              selectedStatusTab === 'replied'
                ? 'border-[var(--dp-color-accent)] text-[var(--dp-color-accent)]'
                : 'border-transparent text-[#626d84] hover:text-[var(--dp-color-ink)]'
            }`}
          >
            <span>تم الرد من المالك</span>
            <span className="px-1.5 py-0.2 rounded-full text-xs bg-emerald-100 text-emerald-800">
              {conversations.filter((c) => c.status === 'replied' || c.status === 'handled').length}
            </span>
          </button>

          <button
            onClick={() => setSelectedStatusTab('pending')}
            className={`pb-3 px-4 text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer border-b-[3px] -mb-[2.5px] ${
              selectedStatusTab === 'pending'
                ? 'border-[var(--dp-color-accent)] text-[var(--dp-color-accent)]'
                : 'border-transparent text-[#626d84] hover:text-[var(--dp-color-ink)]'
            }`}
          >
            <span>بانتظار رد المالك</span>
            <span className="px-1.5 py-0.2 rounded-full text-xs bg-amber-100 text-amber-800">
              {conversations.filter((c) => c.status === 'new').length}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="bg-[var(--dp-color-panel)] border-[2.5px] border-[var(--dp-color-outline)] rounded-xl p-4 shadow-hard-sm">
          <div className="relative">
            <Input
              placeholder="ابحث بالعقار أو المالك أو محتوى الرسالة..."
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
        </div>

        {/* List */}
        {filteredConversations.length === 0 ? (
          <div className="p-12 bg-white border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] text-center shadow-hard space-y-3">
            <MessageSquare className="w-14 h-14 text-indigo-400 mx-auto" />
            <h3 className="text-lg font-black text-[var(--dp-color-ink)]">
              لم ترسل أي استفسارات بعد
            </h3>
            <p className="text-xs text-[#626d84]">
              يمكنك زيارة أي عقار في السوق والضغط على زر "إرسال استفسار للمالك" للتواصل المباشر.
            </p>
            <Link to="/properties">
              <Button variant="primary" size="sm" className="mt-2">
                استكشف العقارات الآن
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredConversations.map((conv) => (
              <div
                key={conv.id}
                className={`bg-white border-[3px] rounded-[var(--dp-radius-corner)] p-5 shadow-hard transition-all space-y-4 ${
                  conv.unreadByBuyer > 0
                    ? 'border-[var(--dp-color-accent)] ring-2 ring-[var(--dp-color-accent)]/20'
                    : 'border-[var(--dp-color-outline)]'
                }`}
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-[#ece9db]">
                  <div className="flex items-center gap-3">
                    <img
                      src={conv.propertyImage}
                      alt={conv.propertyTitle}
                      className="w-12 h-12 rounded-xl object-cover border border-[var(--dp-color-outline)] shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-[var(--dp-color-ink)] line-clamp-1">
                          {conv.propertyTitle}
                        </span>
                        <Badge
                          variant={conv.status === 'new' ? 'warm' : 'fresh'}
                          size="sm"
                        >
                          {conv.status === 'new' ? 'بانتظار الرد' : 'تم الرد'}
                        </Badge>
                      </div>
                      <span className="text-xs text-[#626d84] font-bold block mt-0.5">
                        المالك: {conv.sellerName} • السعر: {formatEGP(conv.propertyPrice)}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-[#8b95aa] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {conv.lastMessageAt}
                  </span>
                </div>

                {/* Speech-like panel */}
                <div className="relative p-3.5 bg-[var(--dp-color-ground)] rounded-xl border border-[var(--dp-color-outline)] text-xs sm:text-sm text-[#374151] font-medium leading-relaxed">
                  <span className="text-[10px] text-[#8b95aa] block font-bold mb-1">آخر رسالة بالمحادثة:</span>
                  <p className="line-clamp-2">"{conv.lastMessage}"</p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-3 pt-1">
                  <Link
                    to={`/properties/${conv.propertyId}`}
                    className="text-xs font-bold text-[var(--dp-color-accent)] hover:underline flex items-center gap-1"
                  >
                    عرض صفحة العقار
                    <ExternalLink className="w-3 h-3" />
                  </Link>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setActiveConvId(conv.id)}
                    className="text-xs font-black shadow-hard-sm"
                    rightIcon={<MessageSquare className="w-4 h-4" />}
                  >
                    عرض المحادثة كاملة
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Conversation Thread Drawer Modal */}
      <ConversationDrawer
        isOpen={Boolean(activeConvId)}
        onClose={() => setActiveConvId(null)}
        conversationId={activeConvId}
        currentUserRole="buyer"
        onUpdate={refreshList}
      />
    </DashboardLayout>
  );
};
