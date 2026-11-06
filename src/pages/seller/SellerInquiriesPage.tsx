import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ConversationDrawer } from '@/components/inquiries/ConversationDrawer';
import { formatEGP } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useSellerInquiries } from '@/hooks/useSupabaseData';
import {
  getUserConversations,
  getStoredConversations,
  saveStoredConversations,
  getStoredMessages,
  saveStoredMessages,
  ConversationThread,
  ChatMessage,
  markConversationAsHandled,
} from '@/services/communicationService';
import {
  MessageSquare,
  Search,
  Send,
  Phone,
  CheckCircle2,
  Clock,
  User,
  Building,
  Check,
  AlertTriangle,
  X,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';

export const SellerInquiriesPage: React.FC = () => {
  const { user } = useAuth();
  const { inquiries: sbInquiries, loading: sbLoading, reload: reloadSbInquiries } = useSellerInquiries(user?.id);
  const [conversations, setConversations] = useState<ConversationThread[]>([]);
  const [selectedStatusTab, setSelectedStatusTab] = useState<'all' | 'new' | 'replied' | 'handled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeConvId, setActiveConvId] = useState<string | null>(null);

  const refreshList = useCallback(() => {
    const localConvs = getUserConversations('seller', user?.id);

    if (sbInquiries && sbInquiries.length > 0) {
      const mappedSb: ConversationThread[] = sbInquiries.map((inq: any) => ({
        id: inq.id,
        propertyId: inq.property_id,
        propertyTitle: inq.property?.title || 'عقار معروض',
        propertyImage: inq.property?.cover_image || inq.property?.cover_image_url || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
        propertyPrice: inq.property?.price || 0,
        propertyLocation: inq.property?.city || 'الإسكندرية',
        buyerId: inq.buyer_id,
        buyerName: inq.buyer?.full_name || 'مشتري مهتم',
        buyerPhone: inq.buyer?.phone || 'غير مسجل',
        sellerId: inq.seller_id,
        sellerName: user?.fullName || 'البائع',
        sellerPhone: user?.phone || '',
        status: (inq.status as ConversationThread['status']) || 'new',
        statusLabel: inq.status === 'replied' ? 'تم الرد' : inq.status === 'handled' ? 'مكتمل ومعالج' : 'استفسار جديد',
        lastMessage: inq.reply || inq.message,
        lastMessageAt: new Date(inq.created_at).toLocaleDateString('ar-EG', {
          day: 'numeric',
          month: 'short',
        }),
        unreadBySeller: inq.status === 'new' ? 1 : 0,
        unreadByBuyer: 0,
        createdAt: inq.created_at,
      }));

      // Sync into stored conversations so ConversationDrawer can open it
      const existingConvs = getStoredConversations();
      const existingMap = new Map(existingConvs.map((c) => [c.id, c]));
      mappedSb.forEach((c) => existingMap.set(c.id, c));
      saveStoredConversations(Array.from(existingMap.values()));

      // Sync initial message into stored messages
      const storedMsgs = getStoredMessages();
      sbInquiries.forEach((inq: any) => {
        if (!storedMsgs[inq.id]) {
          const list: ChatMessage[] = [
            {
              id: `msg-${inq.id}-buyer`,
              conversationId: inq.id,
              senderId: inq.buyer_id || 'buyer',
              senderRole: 'buyer',
              senderName: inq.buyer?.full_name || 'مشتري مهتم',
              text: inq.message,
              timestamp: inq.created_at,
              read: true,
            },
          ];
          if (inq.reply) {
            list.push({
              id: `msg-${inq.id}-seller`,
              conversationId: inq.id,
              senderId: user?.id || 'seller',
              senderRole: 'seller',
              senderName: user?.fullName || 'البائع',
              text: inq.reply,
              timestamp: inq.replied_at || inq.created_at,
              read: true,
            });
          }
          storedMsgs[inq.id] = list;
        }
      });
      saveStoredMessages(storedMsgs);

      // Merge unique by ID for UI
      const map = new Map<string, ConversationThread>();
      mappedSb.forEach((c) => map.set(c.id, c));
      localConvs.forEach((c) => {
        if (!map.has(c.id)) map.set(c.id, c);
      });
      setConversations(Array.from(map.values()));
    } else {
      setConversations(localConvs);
    }
  }, [sbInquiries, user?.id, user?.fullName, user?.phone]);

  useEffect(() => {
    refreshList();
  }, [refreshList]);

  // Filtered
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      if (selectedStatusTab !== 'all' && c.status !== selectedStatusTab) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchBuyer = c.buyerName.toLowerCase().includes(q);
        const matchProp = c.propertyTitle.toLowerCase().includes(q);
        const matchMsg = c.lastMessage.toLowerCase().includes(q);
        if (!matchBuyer && !matchProp && !matchMsg) return false;
      }
      return true;
    });
  }, [conversations, selectedStatusTab, searchTerm]);

  const newCount = conversations.filter((c) => c.status === 'new').length;
  const repliedCount = conversations.filter((c) => c.status === 'replied').length;
  const handledCount = conversations.filter((c) => c.status === 'handled').length;

  const getStatusBadge = (status: ConversationThread['status']) => {
    switch (status) {
      case 'new':
        return <Badge variant="warm" size="sm">استفسار جديد</Badge>;
      case 'replied':
        return <Badge variant="fresh" size="sm">تم الرد</Badge>;
      case 'handled':
        return <Badge variant="secondary" size="sm">مكتمل ومعالج</Badge>;
    }
  };

  return (
    <DashboardLayout
      role="seller"
      title="صندوق استفسارات المشترين"
      subtitle="تواصل مع المشترين المهتمين بعقاراتك، أجب عن استفساراتهم، ونسق مواعيد المعاينة."
    >
      <div className="space-y-6 text-right">
        {/* Status Tabs */}
        <div className="flex border-b-[2.5px] border-[var(--dp-color-outline)] gap-2 overflow-x-auto pb-0.5">
          {[
            { id: 'all', label: 'كافة الاستفسارات', count: conversations.length },
            { id: 'new', label: 'استفسارات جديدة', count: newCount },
            { id: 'replied', label: 'تم الرد عليها', count: repliedCount },
            { id: 'handled', label: 'مكتملة / معالجة', count: handledCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatusTab(tab.id as any)}
              className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer border-b-[3px] -mb-[2.5px] whitespace-nowrap ${
                selectedStatusTab === tab.id
                  ? 'border-[var(--dp-color-accent)] text-[var(--dp-color-accent)]'
                  : 'border-transparent text-[#626d84] hover:text-[var(--dp-color-ink)]'
              }`}
            >
              <span>{tab.label}</span>
              <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 border border-gray-300 text-gray-800">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="bg-[var(--dp-color-panel)] border-[2.5px] border-[var(--dp-color-outline)] rounded-xl p-4 shadow-hard-sm">
          <div className="relative">
            <Input
              placeholder="ابحث باسم المشتري، عنوان العقار، أو نص الرسالة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              rightIcon={<Search className="w-4 h-4 text-[#8b95aa]" />}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Conversations Inbox List */}
        {sbLoading ? (
          <div className="p-12 text-center bg-white border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] shadow-hard space-y-4">
            <RefreshCw className="w-8 h-8 text-[var(--dp-color-accent)] animate-spin mx-auto" />
            <p className="text-sm font-bold text-[#626d84]">جاري جلب استفسارات المشترين من قاعدة البيانات...</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-12 bg-white border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] text-center shadow-hard space-y-3">
            <MessageSquare className="w-14 h-14 text-indigo-400 mx-auto" />
            <h3 className="text-lg font-black text-[var(--dp-color-ink)]">
              لا توجد استفسارات في هذا التصنيف
            </h3>
            <p className="text-xs text-[#626d84]">
              عند قيام أي مشترٍ بالاستفسار عن عقاراتك المعروضة، ستظهر رسالته هنا للمتابعة والرد الفوري.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredConversations.map((conv) => (
              <div
                key={conv.id}
                className={`bg-white border-[3px] rounded-[var(--dp-radius-corner)] p-5 shadow-hard transition-all space-y-4 ${
                  conv.unreadBySeller > 0
                    ? 'border-[var(--dp-color-accent)] ring-2 ring-[var(--dp-color-accent)]/20'
                    : 'border-[var(--dp-color-outline)]'
                }`}
              >
                {/* Header: Buyer & Property */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-[#ece9db]">
                  <div className="flex items-center gap-3">
                    <img
                      src={conv.propertyImage}
                      alt={conv.propertyTitle}
                      className="w-12 h-12 rounded-xl object-cover border border-[var(--dp-color-outline)] shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-[var(--dp-color-ink)]">
                          {conv.buyerName}
                        </span>
                        {getStatusBadge(conv.status)}
                        {conv.unreadBySeller > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-hard-sm">
                            رسالة جديدة
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-[#626d84] font-bold block mt-0.5">
                        العقار: {conv.propertyTitle} • {formatEGP(conv.propertyPrice)}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-[#8b95aa] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {conv.lastMessageAt}
                  </span>
                </div>

                {/* Speech-like outlined panel for last message preview */}
                <div className="relative p-3.5 bg-[var(--dp-color-ground)] rounded-xl border border-[var(--dp-color-outline)] text-xs sm:text-sm text-[#374151] font-medium leading-relaxed">
                  <p className="line-clamp-2">"{conv.lastMessage}"</p>
                </div>

                {/* Footer Controls: Reply & Direct Phone */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-3 text-xs font-bold text-[#4a5568]">
                    <span>رقم الهاتف: <strong>{conv.buyerPhone}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${conv.buyerPhone}`}
                      className="p-2 bg-[var(--dp-color-ground)] hover:bg-[var(--dp-color-selection)] rounded-xl border border-[var(--dp-color-outline)] text-xs font-black text-emerald-800 flex items-center gap-1.5 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      اتصال بالمشتري
                    </a>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setActiveConvId(conv.id)}
                      className="text-xs font-black shadow-hard-sm"
                      rightIcon={<MessageSquare className="w-4 h-4" />}
                    >
                      فتح المحادثة والرد
                    </Button>
                  </div>
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
        currentUserRole="seller"
        currentUserId={user?.id}
        onUpdate={refreshList}
      />
    </DashboardLayout>
  );
};
