import { PropertyItem } from '@/components/ui/PropertyCard';
import { getStoredAppointments, AppointmentItem } from '@/services/appointmentService';
import { getStoredPropertiesMaster, saveMasterProperty } from '@/services/propertyService';
import { addNotification } from '@/services/communicationService';
import { sbCreateNotification, sbUpdatePropertyStatus } from '@/services/supabaseService';
import { supabase } from '@/lib/supabase';

export type PropertyReviewStatus =
  | 'pending_review'
  | 'published'
  | 'requires_changes'
  | 'rejected'
  | 'archived';

export interface PropertyDocument {
  id: string;
  name: string;
  type: 'deed' | 'license' | 'power_of_attorney' | 'national_id' | 'tax_card' | 'other';
  url: string;
  size: string;
  uploadDate: string;
  status: 'verified' | 'pending' | 'rejected';
  rejectionReason?: string;
}

export interface PropertyImageReview {
  id: string;
  url: string;
  caption?: string;
  quality: 'high' | 'acceptable' | 'low';
  isFlagged?: boolean;
  flagReason?: string;
}

export interface AdminProperty extends Omit<PropertyItem, 'isVerified'> {
  reviewStatus: PropertyReviewStatus;
  submissionDate: string;
  lastReviewedDate?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  correctionNotes?: string;
  isVerified: boolean;
  documents: PropertyDocument[];
  imagesList: PropertyImageReview[];
  seller: {
    id: string;
    name: string;
    phone: string;
    email: string;
    registrationDate: string;
    isIdentityVerified: boolean;
    rating: number;
    totalSubmitted: number;
    approvedCount: number;
    rejectedCount: number;
  };
  district?: string;
  streetName?: string;
  buildingNo?: string;
  totalFloors?: number;
  age?: string;
  furnishing?: string;
  amenitiesList?: string[];
  subType?: string;
  customDetails?: Record<string, any>;
}

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'buyer' | 'seller' | 'admin';
  status: 'active' | 'suspended';
  suspendReason?: string;
  suspendedAt?: string;
  registeredAt: string;
  avatarUrl?: string;
  isVerified: boolean;
  propertiesCount: number;
  appointmentsCount: number;
}

export type AuditActionType =
  | 'approve_property'
  | 'reject_property'
  | 'request_changes'
  | 'suspend_user'
  | 'reactivate_user'
  | 'update_settings'
  | 'delete_property';

export interface AuditLogEntry {
  id: string;
  adminName: string;
  adminEmail: string;
  actionType: AuditActionType;
  actionTitle: string;
  targetType: 'property' | 'user' | 'platform';
  targetId: string;
  targetTitle: string;
  prevStatus?: string;
  newStatus?: string;
  timestamp: string;
  reasonOrNotes?: string;
}

export interface AdminInquiry {
  id: string;
  propertyId: string;
  propertyTitle: string;
  buyerName: string;
  buyerPhone: string;
  sellerName: string;
  sellerPhone: string;
  message: string;
  date: string;
  status: 'responded' | 'waiting_response';
  response?: string;
}

export interface PlatformSettings {
  siteName: string;
  officialCurrency: string;
  areaUnit: string;
  adminNotificationEmail: string;
  requireOwnershipDocs: boolean;
  sendSmsAlerts: boolean;
  allowDirectBooking: boolean;
  maintenanceMode: boolean;
  maxUploadSizeMb: number;
}

// Storage keys
const STORAGE_ADMIN_PROPERTIES = 'sha2ety_admin_properties';
const STORAGE_ADMIN_USERS = 'sha2ety_admin_users';
const STORAGE_AUDIT_LOG = 'sha2ety_admin_audit_log';
const STORAGE_INQUIRIES = 'sha2ety_admin_inquiries';
const STORAGE_SETTINGS = 'sha2ety_admin_settings';

// Seed Initial Properties
const INITIAL_ADMIN_PROPERTIES: AdminProperty[] = [
  {
    id: 'prop-rev-101',
    title: 'دوبلكس 260 م² بحديقة خاصة - النرجس الجديدة، التجمع الخامس',
    type: 'شقة',
    price: 6850000,
    area: 260,
    bedrooms: 4,
    bathrooms: 3,
    floor: 'أرضي',
    totalFloors: 4,
    age: '1',
    finishing: 'سوبر لوكس',
    furnishing: 'نصف مفروش',
    city: 'القاهرة الجديدة',
    location: 'النرجس الجديدة، التجمع الخامس',
    district: 'النرجس الجديدة',
    streetName: 'شارع التسعين الجنوبي متفرع',
    buildingNo: 'عمارة 42',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    description: 'دوبلكس راقي بحديقة خاصة 85 م² ومدخل خاص. تشطيب الترا سوبر لوكس لم يُسكن من قبل. حصة بالأرض وجراج يسع سيارتين، استلام فوري مع كافة المرافق.',
    isVerified: false,
    reviewStatus: 'pending_review',
    submissionDate: '2026-11-04 14:30',
    amenitiesList: ['حديقة خاصة', 'جراج سيارات', 'أمن وحراسة', 'غاز طبيعي', 'تكييف مركزي', 'شرفة واسعة'],
    imagesList: [
      { id: 'img-1', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80', quality: 'high' },
      { id: 'img-2', url: 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?auto=format&fit=crop&w=1200&q=80', quality: 'high' },
      { id: 'img-3', url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80', quality: 'acceptable' },
    ],
    documents: [
      {
        id: 'doc-1',
        name: 'عقد مسجل شهر عقاري نهائي.pdf',
        type: 'deed',
        url: '#',
        size: '3.4 MB',
        uploadDate: '2026-11-04',
        status: 'pending',
      },
      {
        id: 'doc-2',
        name: 'رخصة بناء معتمدة من جهاز القاهرة الجديدة.pdf',
        type: 'license',
        url: '#',
        size: '2.1 MB',
        uploadDate: '2026-11-04',
        status: 'pending',
      },
      {
        id: 'doc-3',
        name: 'بطاقة الرقم القومي للمالك (وجه وظهر).pdf',
        type: 'national_id',
        url: '#',
        size: '1.2 MB',
        uploadDate: '2026-11-04',
        status: 'pending',
      },
    ],
    seller: {
      id: 'usr-seller-101',
      name: 'طارق محمود الشريف',
      phone: '01011223344',
      email: 'tarek.elsharif@gmail.com',
      registrationDate: '2026-08-15',
      isIdentityVerified: true,
      rating: 4.8,
      totalSubmitted: 3,
      approvedCount: 2,
      rejectedCount: 0,
    },
  },
  {
    id: 'prop-rev-102',
    title: 'شاليه 115 م² صف أول بحر - أمواج، الساحل الشمالي',
    type: 'شاليه',
    price: 4900000,
    area: 115,
    bedrooms: 2,
    bathrooms: 2,
    floor: 'الثاني',
    totalFloors: 3,
    age: '2',
    finishing: 'الترا لوكس',
    furnishing: 'مفروش بالكامل',
    city: 'الساحل الشمالي',
    location: 'قرية أمواج، الكيلو 136 طريق إسكندرية مطروح',
    district: 'سيدي عبد الرحمن',
    streetName: 'الممشى السياحي لاجون 3',
    buildingNo: 'مبنى B12',
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    description: 'شاليه فندقي مجهز بالكامل بالأجهزة والتكييفات وإطلالة مفتوحة على حمام السباحة والبحر مباشرة، مدفوع كامل الوديعة والصيانة.',
    isVerified: false,
    reviewStatus: 'pending_review',
    submissionDate: '2026-11-04 11:15',
    amenitiesList: ['إطلالة بحر', 'حمام سباحة', 'مفروش بالكامل', 'تكييف', 'أمن 24 ساعة'],
    imagesList: [
      { id: 'img-10', url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80', quality: 'high' },
      { id: 'img-11', url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80', quality: 'high' },
    ],
    documents: [
      {
        id: 'doc-10',
        name: 'مخالصة مالية نهائية من شركة الأهلي صبور.pdf',
        type: 'deed',
        url: '#',
        size: '1.8 MB',
        uploadDate: '2026-11-04',
        status: 'pending',
      },
      {
        id: 'doc-11',
        name: 'عقد التنازل ونقل الملكية المعتمد.pdf',
        type: 'power_of_attorney',
        url: '#',
        size: '2.4 MB',
        uploadDate: '2026-11-04',
        status: 'pending',
      },
    ],
    seller: {
      id: 'usr-seller-102',
      name: 'محمود عبد الرازق',
      phone: '01123456789',
      email: 'm.abdelrazek@yahoo.com',
      registrationDate: '2026-09-20',
      isIdentityVerified: true,
      rating: 4.6,
      totalSubmitted: 2,
      approvedCount: 1,
      rejectedCount: 0,
    },
  },
  {
    id: 'prop-rev-103',
    title: 'فيلا مستقلة 450 م² بحمام سباحة - زايد ديونز، الشيخ زايد',
    type: 'فيلا',
    price: 15500000,
    area: 450,
    bedrooms: 5,
    bathrooms: 5,
    floor: 'أرضي',
    totalFloors: 3,
    age: '0',
    finishing: 'نصف تشطيب',
    furnishing: 'بدون فرش',
    city: 'الشيخ زايد',
    location: 'كمبوند زايد ديونز، الشيخ زايد',
    district: 'زايد ديونز',
    imageUrl: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80',
    description: 'فيلا مودرن استلام فوري، تصميم معماري مميز على مساحة أرض 580 م² مع حمام سباحة خاص وحديقة واسعة.',
    isVerified: true,
    reviewStatus: 'published',
    submissionDate: '2026-10-28 09:00',
    lastReviewedDate: '2026-10-29 16:40',
    reviewedBy: 'م. أحمد مهران (مشرف النظام)',
    amenitiesList: ['حمام سباحة خاص', 'حديقة خاصة', 'جراج مغطى', 'غرفة سائق', 'غرفة خادمة', 'أمن وحراسة'],
    imagesList: [
      { id: 'img-20', url: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80', quality: 'high' },
    ],
    documents: [
      {
        id: 'doc-20',
        name: 'صك الملكية النهائي المسجل.pdf',
        type: 'deed',
        url: '#',
        size: '4.2 MB',
        uploadDate: '2026-10-28',
        status: 'verified',
      },
    ],
    seller: {
      id: 'usr-seller-103',
      name: 'م. حسام البدري',
      phone: '01222334455',
      email: 'hossam.elbadry@gmail.com',
      registrationDate: '2026-06-10',
      isIdentityVerified: true,
      rating: 4.9,
      totalSubmitted: 5,
      approvedCount: 5,
      rejectedCount: 0,
    },
  },
  {
    id: 'prop-rev-104',
    title: 'مقر إداري 180 م² مجهز بالكامل - مجمع البنوك، التجمع الخامس',
    type: 'تجاري',
    price: 9200000,
    area: 180,
    bedrooms: 4,
    bathrooms: 2,
    floor: 'الثالث',
    totalFloors: 5,
    age: '3',
    finishing: 'سوبر لوكس',
    furnishing: 'مفروش بالكامل',
    city: 'القاهرة الجديدة',
    location: 'القطاع الإداري، التجمع الخامس',
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
    description: 'مقر إداري مرخص تجاري إداري، مجهز بشبكات ومكاتب وقاعة اجتماعات، موقع حيوي مباشر على شارع التسعين.',
    isVerified: false,
    reviewStatus: 'requires_changes',
    submissionDate: '2026-11-01 15:20',
    lastReviewedDate: '2026-11-02 10:15',
    reviewedBy: 'م. أحمد مهران (مشرف النظام)',
    correctionNotes: 'يرجى إرفاق ترخيص النشاط التجاري الإداري المعتمد وصورة السجل التجاري للشركة المالكة.',
    amenitiesList: ['تكييف مركزي', 'مصعدين', 'أمن 24/7', 'مولد كهرباء احتياطي', 'جراج سيارات'],
    imagesList: [
      { id: 'img-30', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80', quality: 'high' },
    ],
    documents: [
      {
        id: 'doc-30',
        name: 'عقد البيع الابتدائي.pdf',
        type: 'deed',
        url: '#',
        size: '2.5 MB',
        uploadDate: '2026-11-01',
        status: 'pending',
      },
    ],
    seller: {
      id: 'usr-seller-104',
      name: 'شركة النور للاستثمار العقاري',
      phone: '01099887766',
      email: 'info@alnoor-invest.eg',
      registrationDate: '2026-07-01',
      isIdentityVerified: true,
      rating: 4.3,
      totalSubmitted: 4,
      approvedCount: 2,
      rejectedCount: 1,
    },
  },
  {
    id: 'prop-rev-105',
    title: 'شقة 140 م² دور أخير مع روف - الحي المتميز، مدينة بدر',
    type: 'شقة',
    price: 1350000,
    area: 140,
    bedrooms: 3,
    bathrooms: 2,
    floor: 'الخامس',
    totalFloors: 5,
    age: '4',
    finishing: 'نصف تشطيب',
    furnishing: 'بدون فرش',
    city: 'مدينة بدر',
    location: 'الحي المتميز، بالقرب من محطة القطار المكهرب',
    imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
    description: 'شقة مع روف خاص، موقع متميز وغير مجروح، مطلوب بيع كاش لظروف السفر.',
    isVerified: false,
    reviewStatus: 'rejected',
    submissionDate: '2026-10-25 18:00',
    lastReviewedDate: '2026-10-26 12:00',
    reviewedBy: 'م. أحمد مهران (مشرف النظام)',
    rejectionReason: 'مستندات الملكية غير مكتملة، وجود مخالفة بناء في الروف وعدم تقديم نموذج 10 للتصالح الصادر من الجهاز.',
    amenitiesList: ['شرفة واسعة', 'غاز طبيعي', 'عداد مياه وكهرباء قديم'],
    imagesList: [
      { id: 'img-40', url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80', quality: 'low' },
    ],
    documents: [],
    seller: {
      id: 'usr-seller-105',
      name: 'سيد عبد العال',
      phone: '01555667788',
      email: 'sayed.abdelal@gmail.com',
      registrationDate: '2026-10-20',
      isIdentityVerified: false,
      rating: 3.5,
      totalSubmitted: 1,
      approvedCount: 0,
      rejectedCount: 1,
    },
  },
];

// Seed Users
const INITIAL_ADMIN_USERS: AdminUser[] = [
  {
    id: 'usr-1',
    fullName: 'محمد السيد',
    email: 'seller@sha2ety.eg',
    phone: '01001234567',
    role: 'seller',
    status: 'active',
    registeredAt: '2026-03-12',
    isVerified: true,
    propertiesCount: 6,
    appointmentsCount: 14,
  },
  {
    id: 'usr-2',
    fullName: 'كريم عبد الله',
    email: 'buyer@sha2ety.eg',
    phone: '01098765432',
    role: 'buyer',
    status: 'active',
    registeredAt: '2026-04-05',
    isVerified: true,
    propertiesCount: 0,
    appointmentsCount: 5,
  },
  {
    id: 'usr-3',
    fullName: 'م. أحمد مهران (مشرف النظام)',
    email: 'admin@sha2ety.eg',
    phone: '01222334455',
    role: 'admin',
    status: 'active',
    registeredAt: '2026-01-01',
    isVerified: true,
    propertiesCount: 0,
    appointmentsCount: 0,
  },
  {
    id: 'usr-4',
    fullName: 'طارق محمود الشريف',
    email: 'tarek.elsharif@gmail.com',
    phone: '01011223344',
    role: 'seller',
    status: 'active',
    registeredAt: '2026-08-15',
    isVerified: true,
    propertiesCount: 3,
    appointmentsCount: 8,
  },
  {
    id: 'usr-5',
    fullName: 'محمود عبد الرازق',
    email: 'm.abdelrazek@yahoo.com',
    phone: '01123456789',
    role: 'seller',
    status: 'active',
    registeredAt: '2026-09-20',
    isVerified: true,
    propertiesCount: 2,
    appointmentsCount: 4,
  },
  {
    id: 'usr-6',
    fullName: 'أشرف عبد الغفور',
    email: 'ashraf.gafour@gmail.com',
    phone: '01033445566',
    role: 'buyer',
    status: 'active',
    registeredAt: '2026-09-02',
    isVerified: true,
    propertiesCount: 0,
    appointmentsCount: 3,
  },
  {
    id: 'usr-7',
    fullName: 'سيد عبد العال',
    email: 'sayed.abdelal@gmail.com',
    phone: '01555667788',
    role: 'seller',
    status: 'suspended',
    suspendReason: 'محاولة تقديم أوراق ملكية غير نظامية ومخالفات بناء متكررة',
    suspendedAt: '2026-10-27',
    registeredAt: '2026-10-20',
    isVerified: false,
    propertiesCount: 1,
    appointmentsCount: 0,
  },
  {
    id: 'usr-8',
    fullName: 'منى إبراهيم النجار',
    email: 'mona.elnaggar@hotmail.com',
    phone: '01277889900',
    role: 'buyer',
    status: 'active',
    registeredAt: '2026-10-14',
    isVerified: true,
    propertiesCount: 0,
    appointmentsCount: 2,
  },
];

// Seed Audit Logs
const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud-1',
    adminName: 'م. أحمد مهران',
    adminEmail: 'admin@sha2ety.eg',
    actionType: 'approve_property',
    actionTitle: 'اعتماد ونشر عقار موثق',
    targetType: 'property',
    targetId: 'prop-rev-103',
    targetTitle: 'فيلا مستقلة 450 م² بحمام سباحة - زايد ديونز',
    prevStatus: 'pending_review',
    newStatus: 'published',
    timestamp: '2026-10-29 16:40',
    reasonOrNotes: 'تم فحص ومطابقة صك الملكية مع السجل العيني والتأكد من مطابقة المواصفات.',
  },
  {
    id: 'aud-2',
    adminName: 'م. أحمد مهران',
    adminEmail: 'admin@sha2ety.eg',
    actionType: 'suspend_user',
    actionTitle: 'تجميد حساب بائع',
    targetType: 'user',
    targetId: 'usr-7',
    targetTitle: 'سيد عبد العال (sayed.abdelal@gmail.com)',
    prevStatus: 'active',
    newStatus: 'suspended',
    timestamp: '2026-10-27 12:15',
    reasonOrNotes: 'تقديم بيانات غير دقيقة عن عقارات مخالفة لا تملك ترخيص تصالح قانوني.',
  },
  {
    id: 'aud-3',
    adminName: 'م. أحمد مهران',
    adminEmail: 'admin@sha2ety.eg',
    actionType: 'reject_property',
    actionTitle: 'رفض طلب نشر عقار',
    targetType: 'property',
    targetId: 'prop-rev-105',
    targetTitle: 'شقة 140 م² دور أخير مع روف - مدينة بدر',
    prevStatus: 'pending_review',
    newStatus: 'rejected',
    timestamp: '2026-10-26 12:00',
    reasonOrNotes: 'مخالفة بناء في الروف وعدم تقديم نموذج 10 للتصالح الصادر من جهاز المدينة.',
  },
  {
    id: 'aud-4',
    adminName: 'م. أحمد مهران',
    adminEmail: 'admin@sha2ety.eg',
    actionType: 'request_changes',
    actionTitle: 'طلب تعديل واستيفاء مستندات',
    targetType: 'property',
    targetId: 'prop-rev-104',
    targetTitle: 'مقر إداري 180 م² مجهز - مجمع البنوك',
    prevStatus: 'pending_review',
    newStatus: 'requires_changes',
    timestamp: '2026-11-02 10:15',
    reasonOrNotes: 'المطلوب إرفاق ترخيص النشاط التجاري الإداري المعتمد وصورة السجل التجاري.',
  },
];

// Seed Inquiries
const INITIAL_INQUIRIES: AdminInquiry[] = [
  {
    id: 'inq-1',
    propertyId: 'prop-rev-101',
    propertyTitle: 'دوبلكس 260 م² بحديقة خاصة - النرجس الجديدة',
    buyerName: 'كريم عبد الله',
    buyerPhone: '01098765432',
    sellerName: 'طارق محمود الشريف',
    sellerPhone: '01011223344',
    message: 'هل السعر قابل للتفاوض في حالة السداد كاش فوراً؟ وهل الجراج مسجل بالعقد؟',
    date: '2026-11-04 15:10',
    status: 'waiting_response',
  },
  {
    id: 'inq-2',
    propertyId: 'prop-rev-103',
    propertyTitle: 'فيلا مستقلة 450 م² بحمام سباحة - زايد ديونز',
    buyerName: 'أشرف عبد الغفور',
    buyerPhone: '01033445566',
    sellerName: 'م. حسام البدري',
    sellerPhone: '01222334455',
    message: 'هل يوجد إمكانية تقسيط على سنة أم البيع كاش فقط؟',
    date: '2026-11-03 18:22',
    status: 'responded',
    response: 'البيع كاش أو تسهيلات على 6 أشهر بحد أقصى مع المالك مباشرة.',
  },
  {
    id: 'inq-3',
    propertyId: 'prop-rev-102',
    propertyTitle: 'شاليه 115 م² صف أول بحر - أمواج',
    buyerName: 'منى إبراهيم النجار',
    buyerPhone: '01277889900',
    sellerName: 'محمود عبد الرازق',
    sellerPhone: '01123456789',
    message: 'هل الشاليه شامل وديعة الصيانة ومصروفات التنازل في الشركة المطورة؟',
    date: '2026-11-02 14:05',
    status: 'responded',
    response: 'نعم السعر شامل وديعة الصيانة ورسوم نقل الملكية بالكامل.',
  },
];

// Initial Settings
const INITIAL_SETTINGS: PlatformSettings = {
  siteName: 'شقتي — منصة العقارات المصرية الموثوقة',
  officialCurrency: 'الجنيه المصري (ج.م)',
  areaUnit: 'المتر المربع (م²)',
  adminNotificationEmail: 'admin@sha2ety.eg',
  requireOwnershipDocs: true,
  sendSmsAlerts: true,
  allowDirectBooking: true,
  maintenanceMode: false,
  maxUploadSizeMb: 15,
};

// -------------------------------------------------------------
// Helper to map master PropertyItem to AdminProperty
// -------------------------------------------------------------
function mapMasterToAdminProperty(item: PropertyItem): AdminProperty {
  let reviewStatus: PropertyReviewStatus = 'pending_review';
  if (item.status === 'available') reviewStatus = 'published';
  else if (item.status === 'pending_review') reviewStatus = 'pending_review';
  else if (item.status === 'requires_changes') reviewStatus = 'requires_changes';
  else if (item.status === 'rejected') reviewStatus = 'rejected';
  else if (item.status === 'sold') reviewStatus = 'archived';

  // Look up in seller properties to grab real uploaded documents & custom details
  let realDocs: PropertyDocument[] = [];
  let realSubType: string | undefined = undefined;
  let realCustomDetails: Record<string, any> | undefined = undefined;
  try {
    const rawSeller = localStorage.getItem('sha2ety_seller_properties');
    if (rawSeller) {
      const sellerList = JSON.parse(rawSeller);
      const match = sellerList.find((p: any) => p.id === item.id);
      if (match) {
        realSubType = match.subType;
        realCustomDetails = match.customDetails;
        if (Array.isArray(match.documents) && match.documents.length > 0) {
          realDocs = match.documents.map((d: any) => ({
            id: d.id || `doc-${Date.now()}`,
            name: d.name || 'مستند ملكية',
            type: d.type === 'ownership_proof' ? 'license' : (d.type || 'deed'),
            url: d.url || '#',
            size: d.size || '1.5 MB',
            uploadDate: d.uploadedAt ? d.uploadedAt.split('T')[0] : '2026-11-06',
            status: item.isVerified ? 'verified' : (d.status || 'pending'),
          }));
        }
      }
    }
  } catch {
    // ignore
  }

  return {
    id: item.id,
    title: item.title,
    description: item.description || '',
    price: item.price,
    area: item.area,
    type: item.type,
    city: item.city,
    location: item.location,
    bedrooms: item.bedrooms,
    bathrooms: item.bathrooms,
    floor: item.floor,
    age: item.age,
    finishing: item.finishing,
    imageUrl: item.imageUrl,
    images: item.images,
    isVerified: Boolean(item.isVerified),
    viewsCount: item.viewsCount || 0,
    reviewStatus,
    submissionDate: item.createdAt || new Date().toISOString(),
    subType: realSubType,
    customDetails: realCustomDetails,
    documents: realDocs.length > 0 ? realDocs : [
      {
        id: `doc-${item.id}-1`,
        name: 'صورة عقد الملكية وسند الحيازة.pdf',
        type: 'deed',
        url: '#',
        size: '2.5 MB',
        uploadDate: (item.createdAt || '').split('T')[0] || '2026-11-04',
        status: item.isVerified ? 'verified' : 'pending',
      },
    ],
    imagesList: (item.images && item.images.length > 0 ? item.images : [item.imageUrl]).map((url, idx) => ({
      id: `img-${item.id}-${idx}`,
      url,
      quality: 'high',
    })),
    seller: {
      id: item.sellerId || 'demo-seller-1',
      name: item.sellerName || 'محمد السيد (المالك)',
      phone: item.sellerPhone || '01001234567',
      email: 'seller@sha2ety.eg',
      registrationDate: item.sellerJoinedDate || '2026-08-15',
      isIdentityVerified: true,
      rating: 4.8,
      totalSubmitted: 3,
      approvedCount: 2,
      rejectedCount: 0,
    },
  };
}

// -------------------------------------------------------------
// Service Methods
// -------------------------------------------------------------

export function getAdminProperties(): AdminProperty[] {
  let stored: AdminProperty[] = [];
  try {
    const raw = localStorage.getItem(STORAGE_ADMIN_PROPERTIES);
    if (raw) stored = JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse admin properties:', err);
  }

  // Combine dynamic properties from the master store
  const master = getStoredPropertiesMaster();
  const map = new Map<string, AdminProperty>();

  // If no stored admin properties yet, populate from master properties
  master.forEach((m) => {
    map.set(m.id, mapMasterToAdminProperty(m));
  });

  // Layer any stored admin-specific changes
  stored.forEach((s) => {
    map.set(s.id, s);
  });

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime()
  );
}

export function saveAdminProperties(properties: AdminProperty[]): void {
  try {
    localStorage.setItem(STORAGE_ADMIN_PROPERTIES, JSON.stringify(properties));
  } catch (err) {
    console.error('Failed to save admin properties:', err);
  }
}

export function getReviewQueue(): AdminProperty[] {
  return getAdminProperties().filter((p) => p.reviewStatus === 'pending_review');
}

export function getPropertyById(id: string): AdminProperty | undefined {
  return getAdminProperties().find((p) => p.id === id);
}

export function getAdminUsers(): AdminUser[] {
  let storedModifications: Record<string, Partial<AdminUser>> = {};
  try {
    const raw = localStorage.getItem(STORAGE_ADMIN_USERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((u: AdminUser) => {
          storedModifications[u.id] = u;
        });
      }
    }
  } catch (err) {
    console.error('Failed to parse admin users:', err);
  }

  // Load registered demo/real users
  const demoUsersKey = 'sha2ety_demo_users_v2';
  let registeredUsers: any[] = [];
  try {
    const rawDemo = localStorage.getItem(demoUsersKey);
    if (rawDemo) registeredUsers = JSON.parse(rawDemo);
  } catch {}

  const defaultAccounts: AdminUser[] = [
    {
      id: 'demo-admin-1',
      fullName: 'م. أحمد مهران (مشرف النظام)',
      email: 'admin@sha2ety.eg',
      phone: '01222334455',
      role: 'admin',
      status: 'active',
      registeredAt: '2026-08-01',
      isVerified: true,
      propertiesCount: 0,
      appointmentsCount: 0,
    },
    {
      id: 'demo-seller-1',
      fullName: 'محمد السيد (المالك المعتمد)',
      email: 'seller@sha2ety.eg',
      phone: '01001234567',
      role: 'seller',
      status: 'active',
      registeredAt: '2026-08-15',
      isVerified: true,
      propertiesCount: 0,
      appointmentsCount: 0,
    },
    {
      id: 'demo-buyer-1',
      fullName: 'كريم عبد الله',
      email: 'buyer@sha2ety.eg',
      phone: '01098765432',
      role: 'buyer',
      status: 'active',
      registeredAt: '2026-09-01',
      isVerified: true,
      propertiesCount: 0,
      appointmentsCount: 0,
    },
  ];

  const allUsersMap = new Map<string, AdminUser>();
  defaultAccounts.forEach((u) => allUsersMap.set(u.email.toLowerCase(), u));

  registeredUsers.forEach((u: any) => {
    const emailKey = (u.email || '').toLowerCase();
    if (!allUsersMap.has(emailKey)) {
      allUsersMap.set(emailKey, {
        id: u.id || `usr-${Date.now()}`,
        fullName: u.fullName || u.name || 'مستخدم جديد',
        email: u.email || '',
        phone: u.phone || '',
        role: u.role || 'buyer',
        status: 'active',
        registeredAt: u.registeredAt || new Date().toISOString().split('T')[0],
        isVerified: Boolean(u.emailVerified),
        propertiesCount: 0,
        appointmentsCount: 0,
      });
    }
  });

  const masterProps = getStoredPropertiesMaster();
  const allAppointments = getStoredAppointments();

  return Array.from(allUsersMap.values()).map((u) => {
    const propsCount = masterProps.filter((p) => p.sellerId === u.id).length;
    const appsCount = allAppointments.filter((a) => a.buyerId === u.id || a.sellerId === u.id).length;
    const override = storedModifications[u.id] || {};
    return {
      ...u,
      propertiesCount: propsCount,
      appointmentsCount: appsCount,
      ...override,
    };
  });
}

export function saveAdminUsers(users: AdminUser[]): void {
  try {
    localStorage.setItem(STORAGE_ADMIN_USERS, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save admin users:', err);
  }
}

export function getAuditLog(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_AUDIT_LOG);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse audit log:', err);
  }
  return [];
}

export function addAuditLogEntry(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void {
  const currentLogs = getAuditLog();
  const now = new Date();
  const formattedTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  const newEntry: AuditLogEntry = {
    ...entry,
    id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: formattedTime,
  };

  const updated = [newEntry, ...currentLogs];
  try {
    localStorage.setItem(STORAGE_AUDIT_LOG, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save audit log:', err);
  }
}

export function getAdminInquiries(): AdminInquiry[] {
  try {
    const rawConvs = localStorage.getItem('sha2ety_conversations_v2');
    if (rawConvs) {
      const convs = JSON.parse(rawConvs);
      if (Array.isArray(convs) && convs.length > 0) {
        return convs.map((c: any) => ({
          id: c.id,
          propertyId: c.propertyId,
          propertyTitle: c.propertyTitle,
          buyerName: c.buyerName,
          buyerPhone: c.buyerPhone,
          sellerName: c.sellerName,
          sellerPhone: c.sellerPhone,
          message: c.lastMessage || 'استفسار جديد بخصوص العقار',
          date: c.lastMessageAt || c.createdAt || '2026-11-04 12:00',
          status: c.status === 'replied' || c.status === 'handled' ? 'responded' : 'waiting_response',
          response: c.status === 'replied' ? 'تم الرد من قبل المالك' : undefined,
        }));
      }
    }

    const raw = localStorage.getItem(STORAGE_INQUIRIES);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse inquiries:', err);
  }
  return [];
}

export function getPlatformSettings(): PlatformSettings {
  try {
    const raw = localStorage.getItem(STORAGE_SETTINGS);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse platform settings:', err);
  }
  return INITIAL_SETTINGS;
}

export function savePlatformSettings(
  settings: PlatformSettings,
  adminName: string = 'م. أحمد مهران',
  adminEmail: string = 'admin@sha2ety.eg'
): void {
  try {
    localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(settings));
    addAuditLogEntry({
      adminName,
      adminEmail,
      actionType: 'update_settings',
      actionTitle: 'تحديث إعدادات وسياسات المنصة',
      targetType: 'platform',
      targetId: 'settings',
      targetTitle: 'الإعدادات العامة للسوق العقاري',
      reasonOrNotes: 'تحديث قواعد التوثيق والتنبيهات وسياسات النشر.',
    });
  } catch (err) {
    console.error('Failed to save platform settings:', err);
  }
}

// -------------------------------------------------------------
// Admin Workflow Actions
// -------------------------------------------------------------

export function approveProperty(
  propertyId: string,
  adminNotes?: string,
  adminName: string = 'م. أحمد مهران',
  adminEmail: string = 'admin@sha2ety.eg',
  fallbackProperty?: AdminProperty
): { success: boolean; property?: AdminProperty } {
  const properties = getAdminProperties();
  let index = properties.findIndex((p) => p.id === propertyId);
  let target: AdminProperty | undefined = index !== -1 ? properties[index] : fallbackProperty;

  if (!target) {
    const master = getStoredPropertiesMaster().find((p) => p.id === propertyId);
    if (master) {
      target = mapMasterToAdminProperty(master);
    } else {
      target = {
        id: propertyId,
        title: 'عقار موثق',
        price: 0,
        area: 0,
        bedrooms: 0,
        bathrooms: 0,
        city: 'القاهرة',
        location: 'القاهرة',
        type: 'شقة',
        imageUrl: '',
        images: [],
        imagesList: [],
        isVerified: true,
        status: 'available',
        reviewStatus: 'pending_review',
        submissionDate: new Date().toISOString().slice(0, 10),
        seller: {
          id: 'seller',
          name: 'مالك العقار',
          phone: '',
          email: '',
          registrationDate: '',
          isIdentityVerified: true,
          rating: 5,
          totalSubmitted: 1,
          approvedCount: 0,
          rejectedCount: 0,
        },
        documents: [],
      };
    }
  }

  const prevStatus = target.reviewStatus;
  const now = new Date();
  const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const updated: AdminProperty = {
    ...target,
    reviewStatus: 'published',
    isVerified: true,
    lastReviewedDate: formattedDate,
    reviewedBy: adminName,
    correctionNotes: undefined,
    rejectionReason: undefined,
    documents: (target.documents || []).map((d) => ({ ...d, status: 'verified' })),
    seller: {
      ...target.seller,
      approvedCount: (target.seller?.approvedCount || 0) + 1,
    },
  };

  if (index !== -1) {
    properties[index] = updated;
  } else {
    properties.unshift(updated);
  }
  saveAdminProperties(properties);

  // Synchronize with dynamic Master Property catalog and Supabase
  try {
    const masterProps = getStoredPropertiesMaster();
    const masterTarget = masterProps.find((p) => p.id === propertyId);
    if (masterTarget) {
      saveMasterProperty({
        ...masterTarget,
        status: 'available',
        isVerified: true,
        adminNotes,
      });
    }

    // Also synchronize seller's personal store
    const rawSeller = localStorage.getItem('sha2ety_seller_properties');
    if (rawSeller) {
      const sellerProps = JSON.parse(rawSeller);
      const updatedSellerProps = sellerProps.map((p: any) =>
        p.id === propertyId
          ? {
              ...p,
              status: 'published',
              isVerified: true,
              documents: (p.documents || []).map((d: any) => ({ ...d, status: 'verified' })),
            }
          : p
      );
      localStorage.setItem('sha2ety_seller_properties', JSON.stringify(updatedSellerProps));
    }

    supabase.from('properties').update({ status: 'available', is_verified: true, admin_notes: adminNotes || null }).eq('id', propertyId).then();
  } catch (syncErr) {
    console.warn('Failed to sync approved property to master:', syncErr);
  }

  // Add audit log
  addAuditLogEntry({
    adminName,
    adminEmail,
    actionType: 'approve_property',
    actionTitle: 'اعتماد ونشر عقار',
    targetType: 'property',
    targetId: target.id,
    targetTitle: target.title,
    prevStatus,
    newStatus: 'published',
    reasonOrNotes: adminNotes || 'تم التحقق من كافة أوراق الملكية واعتماد شارة التوثيق بنجاح.',
  });

  // Notify seller
  try {
    addNotification({
      userId: target.seller?.id || 'seller',
      category: 'properties',
      categoryLabel: 'العقارات',
      title: 'تهانينا! تم اعتماد عقارك ونشره رسمياً',
      message: `تمت مراجعة مستندات عقارك "${target.title}" بنجاح وحصل على شارة "عقار موثق". هو الآن معروض للمشترين!`,
      actionUrl: `/properties/${target.id}`,
      actionLabel: 'مشاهدة العقار بالسوق',
    });
    sbCreateNotification({
      user_id: target.seller?.id || 'seller',
      title: 'تمت الموافقة على عقارك ومنحه شارة التوثيق',
      message: `تهانينا! تمت مراجعة مستندات "${target.title}" بنجاح، العقار منشور وموثق الآن في السوق.`,
      type: 'properties',
      related_id: target.id,
    }).catch(() => {});

    const rawNotifs = localStorage.getItem('sha2ety_seller_notifications');
    const notifs = rawNotifs ? JSON.parse(rawNotifs) : [];
    notifs.unshift({
      id: `notif-${Date.now()}`,
      title: 'تهانينا! تم اعتماد عقارك ونشره رسمياً',
      message: `تمت مراجعة مستندات عقارك "${target.title}" بنجاح وحصل على شارة "عقار موثق". هو الآن معروض للمشترين!`,
      date: 'الآن',
      read: false,
      type: 'property_approved',
    });
    localStorage.setItem('sha2ety_seller_notifications', JSON.stringify(notifs));
  } catch {
    // Ignore notification errors
  }

  return { success: true, property: updated };
}

export function rejectProperty(
  propertyId: string,
  rejectionReason: string,
  adminName: string = 'م. أحمد مهران',
  adminEmail: string = 'admin@sha2ety.eg',
  fallbackProperty?: AdminProperty
): { success: boolean; property?: AdminProperty } {
  if (!rejectionReason.trim()) return { success: false };

  const properties = getAdminProperties();
  let index = properties.findIndex((p) => p.id === propertyId);
  let target: AdminProperty | undefined = index !== -1 ? properties[index] : fallbackProperty;

  if (!target) {
    const master = getStoredPropertiesMaster().find((p) => p.id === propertyId);
    if (master) {
      target = mapMasterToAdminProperty(master);
    } else {
      target = {
        id: propertyId,
        title: 'عقار مرفوض',
        price: 0,
        area: 0,
        bedrooms: 0,
        bathrooms: 0,
        city: 'القاهرة',
        location: 'القاهرة',
        type: 'شقة',
        imageUrl: '',
        images: [],
        imagesList: [],
        isVerified: false,
        status: 'rejected',
        reviewStatus: 'pending_review',
        submissionDate: new Date().toISOString().slice(0, 10),
        seller: {
          id: 'seller',
          name: 'مالك العقار',
          phone: '',
          email: '',
          registrationDate: '',
          isIdentityVerified: false,
          rating: 5,
          totalSubmitted: 1,
          approvedCount: 0,
          rejectedCount: 0,
        },
        documents: [],
      };
    }
  }

  const prevStatus = target.reviewStatus;
  const now = new Date();
  const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const updated: AdminProperty = {
    ...target,
    reviewStatus: 'rejected',
    isVerified: false,
    lastReviewedDate: formattedDate,
    reviewedBy: adminName,
    rejectionReason: rejectionReason.trim(),
    seller: {
      ...target.seller,
      rejectedCount: (target.seller?.rejectedCount || 0) + 1,
    },
  };

  if (index !== -1) {
    properties[index] = updated;
  } else {
    properties.unshift(updated);
  }
  saveAdminProperties(properties);

  // Synchronize with dynamic Master Property catalog and Supabase
  try {
    const masterProps = getStoredPropertiesMaster();
    const masterTarget = masterProps.find((p) => p.id === propertyId);
    if (masterTarget) {
      saveMasterProperty({
        ...masterTarget,
        status: 'rejected',
        isVerified: false,
        adminNotes: rejectionReason,
      });
    }
    supabase.from('properties').update({ status: 'rejected', is_verified: false, admin_notes: rejectionReason }).eq('id', propertyId).then();
  } catch (syncErr) {
    console.warn('Failed to sync rejected property to master:', syncErr);
  }

  // Add audit log
  addAuditLogEntry({
    adminName,
    adminEmail,
    actionType: 'reject_property',
    actionTitle: 'رفض نشر عقار',
    targetType: 'property',
    targetId: target.id,
    targetTitle: target.title,
    prevStatus,
    newStatus: 'rejected',
    reasonOrNotes: rejectionReason.trim(),
  });

  // Notify seller
  try {
    addNotification({
      userId: target.seller?.id || 'seller',
      category: 'properties',
      categoryLabel: 'العقارات',
      title: 'تم رفض طلب نشر العقار',
      message: `نأسف لإبلاغك بأن طلب نشر العقار "${target.title}" تم رفضه. السبب: ${rejectionReason.trim()}`,
      actionUrl: '/seller/properties',
      actionLabel: 'مراجعة أسباب الرفض',
    });
    sbCreateNotification({
      user_id: target.seller?.id || 'seller',
      title: 'تم رفض طلب نشر العقار',
      message: `نأسف لإبلاغك بأن طلب نشر العقار "${target.title}" تم رفضه. السبب: ${rejectionReason.trim()}`,
      type: 'properties',
      related_id: target.id,
    }).catch(() => {});

    const rawNotifs = localStorage.getItem('sha2ety_seller_notifications');
    const notifs = rawNotifs ? JSON.parse(rawNotifs) : [];
    notifs.unshift({
      id: `notif-${Date.now()}`,
      title: 'تم رفض طلب نشر العقار',
      message: `نأسف لإبلاغك بأن طلب نشر العقار "${target.title}" تم رفضه. السبب: ${rejectionReason.trim()}`,
      date: 'الآن',
      read: false,
      type: 'property_rejected',
    });
    localStorage.setItem('sha2ety_seller_notifications', JSON.stringify(notifs));
  } catch {
    // Ignore notification errors
  }

  return { success: true, property: updated };
}

export function requestChangesProperty(
  propertyId: string,
  correctionNotes: string,
  adminName: string = 'م. أحمد مهران',
  adminEmail: string = 'admin@sha2ety.eg',
  fallbackProperty?: AdminProperty
): { success: boolean; property?: AdminProperty } {
  if (!correctionNotes.trim()) return { success: false };

  const properties = getAdminProperties();
  let index = properties.findIndex((p) => p.id === propertyId);
  let target: AdminProperty | undefined = index !== -1 ? properties[index] : fallbackProperty;

  if (!target) {
    const master = getStoredPropertiesMaster().find((p) => p.id === propertyId);
    if (master) {
      target = mapMasterToAdminProperty(master);
    } else {
      target = {
        id: propertyId,
        title: 'عقار مطلوب تعديلات',
        price: 0,
        area: 0,
        bedrooms: 0,
        bathrooms: 0,
        city: 'القاهرة',
        location: 'القاهرة',
        type: 'شقة',
        imageUrl: '',
        images: [],
        imagesList: [],
        isVerified: false,
        status: 'requires_changes',
        reviewStatus: 'pending_review',
        submissionDate: new Date().toISOString().slice(0, 10),
        seller: {
          id: 'seller',
          name: 'مالك العقار',
          phone: '',
          email: '',
          registrationDate: '',
          isIdentityVerified: false,
          rating: 5,
          totalSubmitted: 1,
          approvedCount: 0,
          rejectedCount: 0,
        },
        documents: [],
      };
    }
  }

  const prevStatus = target.reviewStatus;
  const now = new Date();
  const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const updated: AdminProperty = {
    ...target,
    reviewStatus: 'requires_changes',
    isVerified: false,
    lastReviewedDate: formattedDate,
    reviewedBy: adminName,
    correctionNotes: correctionNotes.trim(),
  };

  if (index !== -1) {
    properties[index] = updated;
  } else {
    properties.unshift(updated);
  }
  saveAdminProperties(properties);

  // Synchronize with dynamic Master Property catalog and Supabase
  try {
    const masterProps = getStoredPropertiesMaster();
    const masterTarget = masterProps.find((p) => p.id === propertyId);
    if (masterTarget) {
      saveMasterProperty({
        ...masterTarget,
        status: 'requires_changes',
        isVerified: false,
        adminNotes: correctionNotes,
      });
    }
    supabase.from('properties').update({ status: 'requires_changes', is_verified: false, admin_notes: correctionNotes }).eq('id', propertyId).then();
  } catch (syncErr) {
    console.warn('Failed to sync requested changes to master:', syncErr);
  }

  // Add audit log
  addAuditLogEntry({
    adminName,
    adminEmail,
    actionType: 'request_changes',
    actionTitle: 'طلب تعديل واستيفاء أوراق',
    targetType: 'property',
    targetId: target.id,
    targetTitle: target.title,
    prevStatus,
    newStatus: 'requires_changes',
    reasonOrNotes: correctionNotes.trim(),
  });

  // Notify seller
  try {
    addNotification({
      userId: target.seller?.id || 'seller',
      category: 'properties',
      categoryLabel: 'العقارات',
      title: 'يحتاج عقارك إلى تعديلات ومستندات إضافية',
      message: `طلب المشرف القانوني استيفاء أوراق وتعديلات لعقارك "${target.title}": ${correctionNotes.trim()}`,
      actionUrl: '/seller/properties',
      actionLabel: 'استيفاء الأوراق المطلوبة',
    });
    sbCreateNotification({
      user_id: target.seller?.id || 'seller',
      title: 'يحتاج عقارك إلى تعديلات ومستندات إضافية',
      message: `طلب المشرف القانوني استيفاء أوراق وتعديلات لعقارك "${target.title}": ${correctionNotes.trim()}`,
      type: 'properties',
      related_id: target.id,
    }).catch(() => {});

    const rawNotifs = localStorage.getItem('sha2ety_seller_notifications');
    const notifs = rawNotifs ? JSON.parse(rawNotifs) : [];
    notifs.unshift({
      id: `notif-${Date.now()}`,
      title: 'مطلوب تعديلات على بيانات عقارك',
      message: `يرجى مراجعة وتحديث بيانات عقارك "${target.title}": ${correctionNotes.trim()}`,
      date: 'الآن',
      read: false,
      type: 'property_changes_requested',
    });
    localStorage.setItem('sha2ety_seller_notifications', JSON.stringify(notifs));
  } catch {
    // Ignore
  }

  return { success: true, property: updated };
}

// -------------------------------------------------------------
// User Management Actions
// -------------------------------------------------------------

export function suspendUser(
  userId: string,
  reason: string,
  adminName: string = 'م. أحمد مهران',
  adminEmail: string = 'admin@sha2ety.eg'
): { success: boolean; user?: AdminUser } {
  const users = getAdminUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return { success: false };

  // Never suspend admin
  if (users[index].role === 'admin') {
    return { success: false };
  }

  const target = users[index];
  const now = new Date();
  const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const updated: AdminUser = {
    ...target,
    status: 'suspended',
    suspendReason: reason.trim(),
    suspendedAt: formattedDate,
  };

  users[index] = updated;
  saveAdminUsers(users);

  addAuditLogEntry({
    adminName,
    adminEmail,
    actionType: 'suspend_user',
    actionTitle: 'تجميد حساب مستخدم',
    targetType: 'user',
    targetId: target.id,
    targetTitle: `${target.fullName} (${target.email})`,
    prevStatus: 'active',
    newStatus: 'suspended',
    reasonOrNotes: reason.trim(),
  });

  return { success: true, user: updated };
}

export function reactivateUser(
  userId: string,
  adminName: string = 'م. أحمد مهران',
  adminEmail: string = 'admin@sha2ety.eg'
): { success: boolean; user?: AdminUser } {
  const users = getAdminUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return { success: false };

  const target = users[index];
  const updated: AdminUser = {
    ...target,
    status: 'active',
    suspendReason: undefined,
    suspendedAt: undefined,
  };

  users[index] = updated;
  saveAdminUsers(users);

  addAuditLogEntry({
    adminName,
    adminEmail,
    actionType: 'reactivate_user',
    actionTitle: 'إلغاء تجميد وتنشيط حساب مستخدم',
    targetType: 'user',
    targetId: target.id,
    targetTitle: `${target.fullName} (${target.email})`,
    prevStatus: 'suspended',
    newStatus: 'active',
    reasonOrNotes: 'تم التحقق من زوال سبب التجميد وإعادة تنشيط الحساب رسمياً.',
  });

  return { success: true, user: updated };
}

// -------------------------------------------------------------
// Real Statistics Computed from Real DB Records
// -------------------------------------------------------------

export function getPlatformStats() {
  const users = getAdminUsers();
  const properties = getAdminProperties();
  const appointments = getStoredAppointments();

  const totalUsers = users.length;
  const buyersCount = users.filter((u) => u.role === 'buyer').length;
  const sellersCount = users.filter((u) => u.role === 'seller').length;

  const totalProperties = properties.length;
  const pendingReviewCount = properties.filter((p) => p.reviewStatus === 'pending_review').length;
  const publishedCount = properties.filter((p) => p.reviewStatus === 'published').length;
  const rejectedCount = properties.filter((p) => p.reviewStatus === 'rejected').length;
  const requiresChangesCount = properties.filter((p) => p.reviewStatus === 'requires_changes').length;

  const totalAppointments = appointments.length;

  return {
    totalUsers,
    buyersCount,
    sellersCount,
    totalProperties,
    pendingReviewCount,
    publishedCount,
    rejectedCount,
    requiresChangesCount,
    totalAppointments,
  };
}
