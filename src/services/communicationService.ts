import { PropertyItem } from '@/components/ui/PropertyCard';
import { supabase } from '@/lib/supabase';
import { sbCreateNotification } from '@/services/supabaseService';

export type NotificationCategory = 'properties' | 'appointments' | 'inquiries' | 'account';

export interface NotificationItem {
  id: string;
  userId: string; // 'seller' | 'buyer' | 'admin' or user UUID
  category: NotificationCategory;
  categoryLabel: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: 'buyer' | 'seller' | 'admin';
  senderName: string;
  text: string;
  timestamp: string;
  read: boolean;
}

export interface ConversationThread {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyImage: string;
  propertyPrice: number;
  propertyLocation: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  status: 'new' | 'replied' | 'handled';
  statusLabel: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadBySeller: number;
  unreadByBuyer: number;
  createdAt: string;
}

// Storage keys
const STORAGE_NOTIFICATIONS = 'sha2ety_notifications_v2';
const STORAGE_CONVERSATIONS = 'sha2ety_conversations_v2';
const STORAGE_MESSAGES = 'sha2ety_messages_v2';
const STORAGE_INQUIRY_RATE_LIMIT = 'sha2ety_inquiry_rate_limits';

// Initial pre-seeded notifications
const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  // Seller notifications
  {
    id: 'notif-s-1',
    userId: 'seller',
    category: 'appointments',
    categoryLabel: 'المعاينات',
    title: 'لديك طلب معاينة جديد',
    message: 'قام المشتري كريم عبد الله بطلب حجز موعد معاينة لشقة ميفيدا بالتجمع الخامس.',
    timestamp: 'منذ ١٥ دقيقة',
    read: false,
    actionUrl: '/seller/appointments',
    actionLabel: 'مراجعة طلب المعاينة',
  },
  {
    id: 'notif-s-2',
    userId: 'seller',
    category: 'properties',
    categoryLabel: 'العقارات',
    title: 'تمت الموافقة على عقارك ومنحه شارة التوثيق',
    message: 'تهانينا! تمت مراجعة مستندات "دوبلكس 260 م² بالنرجس" بنجاح، العقار منشور وموثق الآن في السوق.',
    timestamp: 'منذ ساعتين',
    read: false,
    actionUrl: '/seller/properties',
    actionLabel: 'مشاهدة العقار بالسوق',
  },
  {
    id: 'notif-s-3',
    userId: 'seller',
    category: 'inquiries',
    categoryLabel: 'الاستفسارات',
    title: 'لديك استفسار جديد بخصوص شقة ميفيدا',
    message: 'أرسل المشتري حسام البدري سؤالاً: "هل السعر شامل وديعة الصيانة وحصة الجراج المسجلة؟"',
    timestamp: 'اليوم، ١١:٣٠ ص',
    read: false,
    actionUrl: '/seller/inquiries',
    actionLabel: 'الرد على الاستفسار',
  },
  {
    id: 'notif-s-4',
    userId: 'seller',
    category: 'properties',
    categoryLabel: 'العقارات',
    title: 'يحتاج عقارك إلى تعديلات ومستندات إضافية',
    message: 'طلب المشرف القانوني إرفاق ترخيص النشاط وتحديث رقم الدور لمقر التجمع الإداري.',
    timestamp: 'أمس، ٠٤:١٥ م',
    read: true,
    actionUrl: '/seller/properties',
    actionLabel: 'تعديل البيانات',
  },
  {
    id: 'notif-s-5',
    userId: 'seller',
    category: 'properties',
    categoryLabel: 'العقارات',
    title: 'تم استلام عقارك بنجاح',
    message: 'تم إدراج عقارك الجديد في طابور المراجعة القانونية وجاري تدقيق مستندات الملكية.',
    timestamp: 'منذ يومين',
    read: true,
    actionUrl: '/seller/properties',
    actionLabel: 'متابعة حالة العقار',
  },
  {
    id: 'notif-s-6',
    userId: 'seller',
    category: 'account',
    categoryLabel: 'الحساب',
    title: 'تم تأكيد هويتك كبائع معتمد',
    message: 'تم فحص صورة بطاقة الرقم القومي واعتماد حسابك كبائع موثوق لدى شقتي.',
    timestamp: 'منذ أسبوع',
    read: true,
    actionUrl: '/seller/profile',
    actionLabel: 'الملف الشخصي',
  },

  // Buyer notifications
  {
    id: 'notif-b-1',
    userId: 'buyer',
    category: 'appointments',
    categoryLabel: 'المعاينات',
    title: 'تم تأكيد موعد المعاينة الميدانية',
    message: 'قام البائع محمد السيد بتأكيد موعد المعاينة لشقة ميفيدا يوم الخميس القادم الساعة ٠٢:٠٠ م.',
    timestamp: 'منذ ٣٠ دقيقة',
    read: false,
    actionUrl: '/buyer/appointments',
    actionLabel: 'عرض تفاصيل الموعد',
  },
  {
    id: 'notif-b-2',
    userId: 'buyer',
    category: 'inquiries',
    categoryLabel: 'الاستفسارات',
    title: 'تلقيت رداً جديداً من البائع',
    message: 'أجاب المالك طارق رضوان على استفسارك بخصوص تسهيلات السداد لدوبلكس النرجس.',
    timestamp: 'منذ ساعة',
    read: false,
    actionUrl: '/buyer/inquiries',
    actionLabel: 'عرض المحادثة',
  },
  {
    id: 'notif-b-3',
    userId: 'buyer',
    category: 'properties',
    categoryLabel: 'العقارات',
    title: 'انخفاض في سعر عقار بقائمتك المفضلة',
    message: 'تم تخفيض سعر "فيلا الربوة بالشيخ زايد" بنسبة ٥٪ ليصبح ١٢,٨٠٠,٠٠٠ ج.م.',
    timestamp: 'أمس، ٠٦:٤٠ م',
    read: true,
    actionUrl: '/properties/prop-2',
    actionLabel: 'مشاهدة العقار',
  },
  {
    id: 'notif-b-4',
    userId: 'buyer',
    category: 'account',
    categoryLabel: 'الحساب',
    title: 'أهلاً بك في منصة شقتي',
    message: 'اكتمل إنشاء حسابك بنجاح، يمكنك الآن حفظ العقارات المفضلة وحجز مواعيد المعاينة المجانية.',
    timestamp: 'منذ أسبوعين',
    read: true,
    actionUrl: '/buyer/profile',
    actionLabel: 'إعدادات الحساب',
  },
];

// Initial Conversations
const INITIAL_CONVERSATIONS: ConversationThread[] = [
  {
    id: 'conv-101',
    propertyId: 'prop-1',
    propertyTitle: 'شقة فاخرة 175 م² - ميفيدا، التجمع الخامس',
    propertyImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
    propertyPrice: 6850000,
    propertyLocation: 'ميفيدا، التجمع الخامس، القاهرة الجديدة',
    buyerId: 'demo-buyer-1',
    buyerName: 'كريم عبد الله',
    buyerPhone: '01098765432',
    sellerId: 'demo-seller-1',
    sellerName: 'محمد السيد (المالك)',
    sellerPhone: '01001234567',
    status: 'replied',
    statusLabel: 'تم الرد',
    lastMessage: 'نعم السعر يشمل حصة الجراج ووديعة الصيانة مسددة بالكامل.',
    lastMessageAt: 'اليوم، ١١:٤٥ ص',
    unreadBySeller: 0,
    unreadByBuyer: 1,
    createdAt: '2026-11-04 11:20',
  },
  {
    id: 'conv-102',
    propertyId: 'prop-3',
    propertyTitle: 'دوبلكس 260 م² بحديقة خاصة - النرجس الجديدة',
    propertyImage: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=600&q=80',
    propertyPrice: 6850000,
    propertyLocation: 'النرجس الجديدة، القاهرة الجديدة',
    buyerId: 'demo-buyer-2',
    buyerName: 'محمود فهمي',
    buyerPhone: '01122334455',
    sellerId: 'demo-seller-1',
    sellerName: 'محمد السيد (المالك)',
    sellerPhone: '01001234567',
    status: 'new',
    statusLabel: 'استفسار جديد',
    lastMessage: 'مساء الخير، هل يوجد إمكانية لتسهيلات في السداد على سنة أم السعر كاش فقط؟',
    lastMessageAt: 'منذ ساعتين',
    unreadBySeller: 1,
    unreadByBuyer: 0,
    createdAt: '2026-11-04 18:30',
  },
  {
    id: 'conv-103',
    propertyId: 'prop-2',
    propertyTitle: 'فيلا مستقلة 420 م² - الربوة، الشيخ زايد',
    propertyImage: 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?auto=format&fit=crop&w=600&q=80',
    propertyPrice: 13500000,
    propertyLocation: 'الربوة، الشيخ زايد',
    buyerId: 'demo-buyer-1',
    buyerName: 'كريم عبد الله',
    buyerPhone: '01098765432',
    sellerId: 'demo-seller-2',
    sellerName: 'د. حسام البدري',
    sellerPhone: '01222334455',
    status: 'handled',
    statusLabel: 'مكتمل ومعالج',
    lastMessage: 'تم التنسيق هاتفياً وحجز موعد المعاينة يوم الجمعة القادم.',
    lastMessageAt: 'أمس، ٠٥:٠٠ م',
    unreadBySeller: 0,
    unreadByBuyer: 0,
    createdAt: '2026-11-03 14:10',
  },
];

// Initial Messages
const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {
  'conv-101': [
    {
      id: 'msg-101-1',
      conversationId: 'conv-101',
      senderId: 'demo-buyer-1',
      senderRole: 'buyer',
      senderName: 'كريم عبد الله',
      text: 'السلام عليكم، هل السعر المعروض 6,850,000 ج.م شامل وديعة الصيانة وحصة الجراج المسجلة بالعقد؟',
      timestamp: 'اليوم، ١١:٢٠ ص',
      read: true,
    },
    {
      id: 'msg-101-2',
      conversationId: 'conv-101',
      senderId: 'demo-seller-1',
      senderRole: 'seller',
      senderName: 'محمد السيد (المالك)',
      text: 'وعليكم السلام ورحمة الله أستاذ كريم. نعم السعر يشمل حصة الجراج ووديعة الصيانة مسددة بالكامل بالجهاز.',
      timestamp: 'اليوم، ١١:٤٥ ص',
      read: false,
    },
  ],
  'conv-102': [
    {
      id: 'msg-102-1',
      conversationId: 'conv-102',
      senderId: 'demo-buyer-2',
      senderRole: 'buyer',
      senderName: 'محمود فهمي',
      text: 'مساء الخير، هل يوجد إمكانية لتسهيلات في السداد على سنة أم السعر كاش فقط؟',
      timestamp: 'منذ ساعتين',
      read: false,
    },
  ],
  'conv-103': [
    {
      id: 'msg-103-1',
      conversationId: 'conv-103',
      senderId: 'demo-buyer-1',
      senderRole: 'buyer',
      senderName: 'كريم عبد الله',
      text: 'مرحبا دكتور حسام، هل الفيلا بها غرفة حارس منفصلة وغرفة مربية بحمام خاص؟',
      timestamp: 'أمس، ٠٢:١٥ م',
      read: true,
    },
    {
      id: 'msg-103-2',
      conversationId: 'conv-103',
      senderId: 'demo-seller-2',
      senderRole: 'seller',
      senderName: 'د. حسام البدري',
      text: 'أهلاً بك، نعم تحتوي على غرفة حارس بالحمام بمدخل خاص، وغرفة مربية داخلية.',
      timestamp: 'أمس، ٠٣:٣٠ م',
      read: true,
    },
    {
      id: 'msg-103-3',
      conversationId: 'conv-103',
      senderId: 'demo-seller-2',
      senderRole: 'seller',
      senderName: 'د. حسام البدري',
      text: 'تم التنسيق هاتفياً وحجز موعد المعاينة يوم الجمعة القادم.',
      timestamp: 'أمس، ٠٥:٠٠ م',
      read: true,
    },
  ],
};

// -----------------------------------------------------------------
// Helper Functions: Notifications
// -----------------------------------------------------------------

export function getStoredNotifications(): NotificationItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_NOTIFICATIONS);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load notifications:', err);
  }
  return [];
}

export function saveStoredNotifications(items: NotificationItem[]): void {
  try {
    localStorage.setItem(STORAGE_NOTIFICATIONS, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save notifications:', err);
  }
}

export function getUserNotifications(userRoleOrId: string, category?: NotificationCategory | 'all'): NotificationItem[] {
  const all = getStoredNotifications();
  return all.filter((item) => {
    // Match seller vs buyer vs admin
    const isTargetUser =
      item.userId === userRoleOrId ||
      (userRoleOrId === 'seller' && item.userId === 'seller') ||
      (userRoleOrId === 'buyer' && item.userId === 'buyer') ||
      userRoleOrId === 'admin';

    if (!isTargetUser) return false;
    if (category && category !== 'all' && item.category !== category) return false;
    return true;
  });
}

export function getUnreadNotificationsCount(userRoleOrId: string): number {
  return getUserNotifications(userRoleOrId).filter((n) => !n.read).length;
}

export function markNotificationAsRead(id: string): NotificationItem[] {
  const all = getStoredNotifications();
  const updated = all.map((n) => (n.id === id ? { ...n, read: true } : n));
  saveStoredNotifications(updated);
  return updated;
}

export function markAllNotificationsAsRead(userRoleOrId: string): NotificationItem[] {
  const all = getStoredNotifications();
  const updated = all.map((n) => {
    if (n.userId === userRoleOrId || userRoleOrId === 'admin') {
      return { ...n, read: true };
    }
    return n;
  });
  saveStoredNotifications(updated);
  return updated;
}

export function deleteNotification(id: string): NotificationItem[] {
  const all = getStoredNotifications();
  const updated = all.filter((n) => n.id !== id);
  saveStoredNotifications(updated);
  return updated;
}

export function addNotification(
  notif: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>
): NotificationItem {
  const all = getStoredNotifications();
  const now = new Date();
  const timeFormatted = `${now.getHours() > 12 ? now.getHours() - 12 : now.getHours()}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() >= 12 ? 'م' : 'ص'}`;
  
  const newItem: NotificationItem = {
    ...notif,
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: `اليوم، ${timeFormatted}`,
    read: false,
  };

  const updated = [newItem, ...all];
  saveStoredNotifications(updated);
  return newItem;
}

// -----------------------------------------------------------------
// Helper Functions: Conversations & Inquiries
// -----------------------------------------------------------------

export function getStoredConversations(): ConversationThread[] {
  try {
    const raw = localStorage.getItem(STORAGE_CONVERSATIONS);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load conversations:', err);
  }
  return [];
}

export function saveStoredConversations(items: ConversationThread[]): void {
  try {
    localStorage.setItem(STORAGE_CONVERSATIONS, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save conversations:', err);
  }
}

export function getStoredMessages(): Record<string, ChatMessage[]> {
  try {
    const raw = localStorage.getItem(STORAGE_MESSAGES);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load messages:', err);
  }
  return {};
}

export function saveStoredMessages(data: Record<string, ChatMessage[]>): void {
  try {
    localStorage.setItem(STORAGE_MESSAGES, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save messages:', err);
  }
}

export function getUserConversations(
  userRole: 'seller' | 'buyer' | 'admin',
  userId?: string
): ConversationThread[] {
  const all = getStoredConversations();
  if (userRole === 'admin') return all;

  if (userRole === 'seller') {
    // Return conversations for seller
    return all.filter((c) => c.sellerId === userId || !userId || c.sellerId === 'demo-seller-1');
  }

  // Buyer
  return all.filter((c) => c.buyerId === userId || !userId || c.buyerId === 'demo-buyer-1');
}

export function getConversationById(
  convId: string,
  userRole: 'seller' | 'buyer' | 'admin',
  userId?: string
): { conversation: ConversationThread | null; messages: ChatMessage[]; error?: string } {
  const convs = getStoredConversations();
  const conv = convs.find((c) => c.id === convId);
  if (!conv) {
    return { conversation: null, messages: [], error: 'المحادثة غير موجودة.' };
  }

  // Security check: Only participants and admin
  if (userRole !== 'admin') {
    const isParticipant =
      (userRole === 'seller' && (conv.sellerId === userId || conv.sellerId === 'demo-seller-1')) ||
      (userRole === 'buyer' && (conv.buyerId === userId || conv.buyerId === 'demo-buyer-1'));

    if (!isParticipant) {
      return {
        conversation: null,
        messages: [],
        error: 'عفواً، لا تملك الصلاحية للوصول إلى هذه المحادثة الخاصة.',
      };
    }
  }

  const allMessages = getStoredMessages();
  const messages = allMessages[convId] || [];

  return { conversation: conv, messages };
}

// Send a message in a conversation thread
export function sendChatMessage(
  convId: string,
  senderRole: 'seller' | 'buyer' | 'admin',
  senderName: string,
  senderId: string,
  text: string
): { success: boolean; message?: ChatMessage; error?: string } {
  const trimmed = text.trim();
  if (!trimmed) {
    return { success: false, error: 'لا يمكن إرسال رسالة فارغة.' };
  }
  if (trimmed.length > 1000) {
    return { success: false, error: 'الحد الأقصى للرسالة هو ١٠٠٠ حرف.' };
  }

  const convs = getStoredConversations();
  const index = convs.findIndex((c) => c.id === convId);
  if (index === -1) {
    return { success: false, error: 'المحادثة غير موجودة.' };
  }

  const conv = convs[index];
  const now = new Date();
  const timeFormatted = `${now.getHours() > 12 ? now.getHours() - 12 : now.getHours()}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() >= 12 ? 'م' : 'ص'}`;

  const newMsg: ChatMessage = {
    id: `msg-${convId}-${Date.now()}`,
    conversationId: convId,
    senderId,
    senderRole,
    senderName,
    text: trimmed,
    timestamp: `اليوم، ${timeFormatted}`,
    read: false,
  };

  // Save message
  const allMessages = getStoredMessages();
  const threadMessages = allMessages[convId] || [];
  allMessages[convId] = [...threadMessages, newMsg];
  saveStoredMessages(allMessages);

  // Update conversation last message & status
  const isSeller = senderRole === 'seller';
  const updatedConv: ConversationThread = {
    ...conv,
    lastMessage: trimmed,
    lastMessageAt: `اليوم، ${timeFormatted}`,
    status: isSeller ? 'replied' : 'new',
    statusLabel: isSeller ? 'تم الرد' : 'استفسار جديد',
    unreadBySeller: isSeller ? 0 : conv.unreadBySeller + 1,
    unreadByBuyer: isSeller ? conv.unreadByBuyer + 1 : 0,
  };

  convs[index] = updatedConv;
  saveStoredConversations(convs);

  // Trigger Notification to the other party
  const recipientRole = isSeller ? 'buyer' : 'seller';
  addNotification({
    userId: recipientRole,
    category: 'inquiries',
    categoryLabel: 'الاستفسارات',
    title: isSeller ? `رد جديد من المالك بخصوص "${conv.propertyTitle}"` : `استفسار جديد من ${senderName}`,
    message: trimmed.length > 90 ? `${trimmed.slice(0, 90)}...` : trimmed,
    actionUrl: isSeller ? '/buyer/inquiries' : '/seller/inquiries',
    actionLabel: 'مشاهدة المحادثة',
  });

  // Sync message & inquiry to Supabase
  try {
    if (isSeller) {
      supabase.from('inquiries').update({ reply: trimmed, status: 'replied' }).eq('id', convId).then();
    }
    supabase.from('messages').insert({
      conversation_id: convId,
      sender_id: senderId,
      content: trimmed,
    }).then();
    sbCreateNotification({
      user_id: recipientRole,
      title: isSeller ? `رد جديد من المالك بخصوص "${conv.propertyTitle}"` : `استفسار جديد من ${senderName}`,
      message: trimmed.length > 90 ? `${trimmed.slice(0, 90)}...` : trimmed,
      type: 'inquiries',
      related_id: conv.propertyId,
    }).catch(() => {});
  } catch {}

  return { success: true, message: newMsg };
}

// Mark conversation handled / closed
export function markConversationAsHandled(convId: string): boolean {
  const convs = getStoredConversations();
  const index = convs.findIndex((c) => c.id === convId);
  if (index === -1) return false;

  convs[index] = {
    ...convs[index],
    status: 'handled',
    statusLabel: 'مكتمل ومعالج',
    unreadBySeller: 0,
  };
  saveStoredConversations(convs);

  try {
    supabase.from('inquiries').update({ status: 'handled' }).eq('id', convId).then();
  } catch {}

  return true;
}

// -----------------------------------------------------------------
// Create New Property Inquiry (From Property Details Modal)
// -----------------------------------------------------------------

export function createPropertyInquiry(data: {
  property: PropertyItem;
  buyerName: string;
  buyerPhone: string;
  message: string;
  buyerId?: string;
}): { success: boolean; conversation?: ConversationThread; error?: string } {
  const name = data.buyerName.trim();
  const phone = data.buyerPhone.trim();
  const message = data.message.trim();

  if (!name) return { success: false, error: 'يرجى إدخال اسمك بالكامل.' };
  if (!/^01[0125][0-9]{8}$/.test(phone)) {
    return { success: false, error: 'يرجى إدخال رقم هاتف مصري صحيح يبدأ بـ 01 ويتكون من 11 رقماً.' };
  }
  if (!message || message.length < 5) {
    return { success: false, error: 'يرجى كتابة نص الاستفسار (5 أحرف على الأقل).' };
  }

  // Spam prevention check: Same phone/property in last 5 minutes
  try {
    const rawLimits = localStorage.getItem(STORAGE_INQUIRY_RATE_LIMIT);
    const limits: { key: string; time: number }[] = rawLimits ? JSON.parse(rawLimits) : [];
    const key = `${phone}_${data.property.id}`;
    const recent = limits.find((l) => l.key === key && Date.now() - l.time < 5 * 60 * 1000);

    if (recent) {
      return {
        success: false,
        error: 'لقد قمت بإرسال استفسار حول هذا العقار للتو. يُرجى الانتظار بضع دقائق لتجنب تكرار الرسائل.',
      };
    }

    // Record rate limit
    limits.push({ key, time: Date.now() });
    localStorage.setItem(STORAGE_INQUIRY_RATE_LIMIT, JSON.stringify(limits.slice(-50)));
  } catch {
    // Ignore rate limit storage errors
  }

  const now = new Date();
  const timeFormatted = `${now.getHours() > 12 ? now.getHours() - 12 : now.getHours()}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() >= 12 ? 'م' : 'ص'}`;
  const convId = `conv-${Date.now()}`;

  const buyerId = data.buyerId || 'demo-buyer-1';
  const sellerId = 'demo-seller-1';

  const newThread: ConversationThread = {
    id: convId,
    propertyId: data.property.id,
    propertyTitle: data.property.title,
    propertyImage: data.property.imageUrl,
    propertyPrice: data.property.price,
    propertyLocation: data.property.location,
    buyerId,
    buyerName: name,
    buyerPhone: phone,
    sellerId,
    sellerName: 'محمد السيد (المالك)',
    sellerPhone: '01001234567',
    status: 'new',
    statusLabel: 'استفسار جديد',
    lastMessage: message,
    lastMessageAt: `اليوم، ${timeFormatted}`,
    unreadBySeller: 1,
    unreadByBuyer: 0,
    createdAt: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
  };

  const initialChatMessage: ChatMessage = {
    id: `msg-${convId}-1`,
    conversationId: convId,
    senderId: buyerId,
    senderRole: 'buyer',
    senderName: name,
    text: message,
    timestamp: `اليوم، ${timeFormatted}`,
    read: false,
  };

  // Save conversation
  const convs = getStoredConversations();
  saveStoredConversations([newThread, ...convs]);

  // Save message
  const allMessages = getStoredMessages();
  allMessages[convId] = [initialChatMessage];
  saveStoredMessages(allMessages);

  // Trigger Notifications
  // 1. Seller notification
  addNotification({
    userId: 'seller',
    category: 'inquiries',
    categoryLabel: 'الاستفسارات',
    title: `استفسار جديد بخصوص "${data.property.title}"`,
    message: `أرسل ${name} (${phone}): "${message.slice(0, 80)}..."`,
    actionUrl: '/seller/inquiries',
    actionLabel: 'الرد على الاستفسار',
  });

  // 2. Buyer confirmation notification
  addNotification({
    userId: 'buyer',
    category: 'inquiries',
    categoryLabel: 'الاستفسارات',
    title: `تم إرسال استفسارك بنجاح إلى المالك`,
    message: `سيصلك إشعار فور رد مالك "${data.property.title}".`,
    actionUrl: '/buyer/inquiries',
    actionLabel: 'مشاهدة الاستفسار',
  });

  // 3. Sync to Supabase inquiries and notifications
  try {
    supabase.from('inquiries').insert({
      id: convId,
      property_id: data.property.id,
      buyer_id: buyerId,
      seller_id: sellerId,
      message,
      status: 'new',
    }).then();

    sbCreateNotification({
      user_id: sellerId,
      title: `استفسار جديد بخصوص "${data.property.title}"`,
      message: `أرسل ${name} (${phone}): "${message.slice(0, 80)}..."`,
      type: 'inquiries',
      related_id: data.property.id,
    }).catch(() => {});
  } catch {
    // Ignore
  }

  return { success: true, conversation: newThread };
}

