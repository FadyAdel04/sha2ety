import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Textarea';
import { formatEGP } from '@/lib/utils';
import {
  ConversationThread,
  ChatMessage,
  getConversationById,
  sendChatMessage,
  markConversationAsHandled,
} from '@/services/communicationService';
import {
  MessageSquare,
  Send,
  Phone,
  CheckCircle2,
  Clock,
  User,
  ShieldCheck,
  Building,
  Check,
  CheckCheck,
  Lock,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

export interface ConversationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string | null;
  currentUserRole: 'seller' | 'buyer' | 'admin';
  currentUserId?: string;
  onUpdate?: () => void;
}

export const ConversationDrawer: React.FC<ConversationDrawerProps> = ({
  isOpen,
  onClose,
  conversationId,
  currentUserRole,
  currentUserId,
  onUpdate,
}) => {
  if (!conversationId) return null;

  const [conversation, setConversation] = useState<ConversationThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isHandledSuccess, setIsHandledSuccess] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversation & messages
  const loadData = () => {
    const res = getConversationById(conversationId, currentUserRole, currentUserId);
    if (res.error) {
      setErrorMsg(res.error);
      setConversation(null);
      setMessages([]);
    } else {
      setConversation(res.conversation);
      setMessages(res.messages);
      setErrorMsg('');
    }
  };

  useEffect(() => {
    if (isOpen && conversationId) {
      loadData();
      setIsHandledSuccess(false);
    }
  }, [isOpen, conversationId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Send Message
  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim()) return;

    setIsSending(true);
    const senderName =
      currentUserRole === 'seller'
        ? conversation?.sellerName || 'المالك'
        : currentUserRole === 'admin'
        ? 'مشرف منصة شقتي'
        : conversation?.buyerName || 'المشتري';

    const senderId = currentUserId || (currentUserRole === 'seller' ? 'demo-seller-1' : 'demo-buyer-1');

    const res = sendChatMessage(conversationId, currentUserRole, senderName, senderId, replyText);
    setIsSending(false);

    if (!res.success) {
      setErrorMsg(res.error || 'حدث خطأ أثناء إرسال الرسالة.');
      return;
    }

    setReplyText('');
    loadData();
    if (onUpdate) onUpdate();
  };

  // Quick Reply suggestions
  const quickReplies =
    currentUserRole === 'seller'
      ? [
          'أهلاً بك! نعم السعر يشمل وديعة الصيانة وحصة الجراج.',
          'العقار متاح للمعاينة الميدانية غداً بعد العصر.',
          'السعر قابل لتفاوض بسيط في حالة السداد كاش فوراً.',
          'تم التواصل هاتفياً وتحديد التفاصيل.',
        ]
      : [
          'شكراً جزيلاً لردك السريع.',
          'هل يمكن التنسيق لمعاينة العقار على الطبيعة؟',
          'سأتواصل معك هاتفياً اليوم لتحديد موعد.',
        ];

  // Mark as handled
  const handleMarkHandled = () => {
    markConversationAsHandled(conversationId);
    setIsHandledSuccess(true);
    loadData();
    if (onUpdate) onUpdate();
    setTimeout(() => setIsHandledSuccess(false), 2500);
  };

  const getStatusBadge = () => {
    if (!conversation) return null;
    switch (conversation.status) {
      case 'new':
        return <Badge variant="warm" size="sm">استفسار جديد</Badge>;
      case 'replied':
        return <Badge variant="fresh" size="sm">تم الرد</Badge>;
      case 'handled':
        return <Badge variant="secondary" size="sm">مكتمل ومعالج</Badge>;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={conversation ? `محادثة استفسار: ${conversation.propertyTitle}` : 'المحادثة الخاصة'}
      size="lg"
    >
      <div className="space-y-4 text-right">
        {/* Access Restriction Error */}
        {errorMsg && !conversation && (
          <div className="p-6 bg-rose-50 border-[2.5px] border-rose-300 rounded-xl text-center space-y-2">
            <Lock className="w-10 h-10 text-rose-600 mx-auto" />
            <h4 className="font-black text-sm text-rose-900">حظر الوصول إلى المحادثة</h4>
            <p className="text-xs text-rose-800">{errorMsg}</p>
          </div>
        )}

        {conversation && (
          <>
            {/* Top Info Bar: Property & Counterparty */}
            <div className="p-4 bg-[var(--dp-color-field-soft)] border-[2.5px] border-[var(--dp-color-outline)] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-hard-sm">
              <div className="flex items-center gap-3">
                <img
                  src={conversation.propertyImage}
                  alt={conversation.propertyTitle}
                  className="w-14 h-14 rounded-xl object-cover border border-[var(--dp-color-outline)] shrink-0"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-[var(--dp-color-ink)] line-clamp-1">
                      {conversation.propertyTitle}
                    </span>
                    {getStatusBadge()}
                  </div>
                  <span className="text-xs font-bold text-[#626d84] block">
                    {conversation.propertyLocation} • {formatEGP(conversation.propertyPrice)}
                  </span>
                  <span className="text-[11px] font-bold text-[#4a5568] block">
                    {currentUserRole === 'seller' ? (
                      <>
                        المشتري: <strong>{conversation.buyerName}</strong> ({conversation.buyerPhone})
                      </>
                    ) : (
                      <>
                        المالك: <strong>{conversation.sellerName}</strong> ({conversation.sellerPhone})
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`tel:${currentUserRole === 'seller' ? conversation.buyerPhone : conversation.sellerPhone}`}
                  className="p-2 bg-white rounded-xl border border-[var(--dp-color-outline)] text-emerald-700 hover:bg-emerald-50 text-xs font-black flex items-center gap-1.5 shadow-hard-sm transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  اتصال هاتفي
                </a>

                {currentUserRole === 'seller' && conversation.status !== 'handled' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMarkHandled}
                    className="text-xs font-black bg-white"
                  >
                    تحديد كمكتمل
                  </Button>
                )}
              </div>
            </div>

            {isHandledSuccess && (
              <div className="p-2.5 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-black flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                تم تحديد الاستفسار كمكتمل ومعالج بنجاح.
              </div>
            )}

            {/* Chat History Box (Speech-like outlined panels) */}
            <div className="bg-[var(--dp-color-ground)] border-[2.5px] border-[var(--dp-color-outline)] rounded-2xl p-4 sm:p-5 h-[340px] overflow-y-auto space-y-4 shadow-inner">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center text-xs text-[#8b95aa]">
                  لا توجد رسائل سابقة في هذه المحادثة
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe =
                    (currentUserRole === 'seller' && msg.senderRole === 'seller') ||
                    (currentUserRole === 'buyer' && msg.senderRole === 'buyer') ||
                    (currentUserRole === 'admin' && msg.senderRole === 'admin');

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-start' : 'items-end'}`}
                    >
                      <div className="flex items-center gap-2 mb-1 px-1">
                        <span className="text-[11px] font-black text-[#526078]">
                          {msg.senderName}
                        </span>
                        <span className="text-[10px] text-[#8b95aa]">{msg.timestamp}</span>
                      </div>

                      {/* Speech Bubble */}
                      <div
                        className={`relative max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl border-[2px] border-[var(--dp-color-outline)] text-xs sm:text-sm font-medium leading-relaxed shadow-hard-sm ${
                          isMe
                            ? 'bg-[var(--dp-color-accent)] text-white rounded-tr-none'
                            : 'bg-white text-[var(--dp-color-ink)] rounded-tl-none'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies Bar */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-[#8b95aa] block">
                ردود مقترحة سريعة:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {quickReplies.map((reply, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setReplyText(reply)}
                    className="px-2.5 py-1 bg-white hover:bg-[var(--dp-color-selection)] border border-[var(--dp-color-outline)] rounded-lg text-[11px] font-bold text-[#374151] transition-colors cursor-pointer"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            </div>

            {/* Input & Send Form */}
            <form onSubmit={handleSend} className="space-y-2 pt-1">
              <div className="relative">
                <Textarea
                  placeholder="اكتب ردك هنا بالتفصيل (اضغط Enter للإرسال)..."
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  maxLength={1000}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#8b95aa]">
                  {replyText.length} / 1000 حرف
                </span>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSending}
                  disabled={!replyText.trim()}
                  rightIcon={<Send className="w-4 h-4" />}
                  className="shadow-hard-sm font-black"
                >
                  إرسال الرد
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </Modal>
  );
};

