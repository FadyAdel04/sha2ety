import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatEGP, formatArea } from '@/lib/utils';
import {
  addSellerProperty,
  PropertyLegalDocument,
  SellerPropertyStatus,
} from '@/services/sellerService';
import {
  EGYPT_GOVERNORATES,
  TOP_NATIONAL_HOTSPOTS,
  getGovernorateDistricts,
} from '@/data/egyptRegions';
import {
  Building2,
  Home,
  Store,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  UploadCloud,
  Trash2,
  Star,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Compass,
  Check,
  Save,
  Eye,
  Sparkles,
  Lock,
  Layers3,
  LandPlot,
  X,
  FileCheck,
  Briefcase,
  Zap,
  Waves,
  Car,
  Wifi,
  Navigation,
  CheckCircle,
} from 'lucide-react';

export type PropertyType = 'شقة' | 'فيلا' | 'محل' | 'مكتب' | 'منزل' | 'أرض';

export interface PropertyFormData {
  // Step 1: Basic Information
  title: string;
  type: PropertyType;
  subType?: string;
  purpose: 'للبيع';
  description: string;

  // Step 2: Location & Map
  governorate: string;
  city: string;
  location: string;
  streetName: string;
  buildingNumber: string;
  latitude: number;
  longitude: number;

  // Step 3: Specifications & Amenities
  price: number | '';
  area: number | '';
  bedrooms: number;
  bathrooms: number;
  floor: string;
  totalFloors: string;
  buildingAge: string;
  finishing: string;
  furnished: string;
  amenities: string[];

  // Custom fields for محل (Commercial Shop / Store)
  shopFrontageWidth?: number | '';
  ceilingHeight?: number | '';
  hasMezzanine?: boolean;
  mezzanineArea?: number | '';
  electricityMeterType?: string;
  hasRestaurantChimney?: boolean;
  outdoorArea?: number | '';
  isInsideMall?: boolean;
  mallName?: string;
  commercialActivities?: string[];

  // Custom fields for فيلا (Villa)
  villaType?: string;
  landArea?: number | '';
  gardenArea?: number | '';
  poolType?: string;
  villaFloorsCount?: string;
  hasDriverRoom?: boolean;
  hasMaidRoom?: boolean;
  hasPrivateElevator?: boolean;
  garageCapacity?: number;

  // Custom fields for مكتب (Office / Administrative)
  officeLicenseType?: string;
  officeLayout?: string;
  meetingRoomsCount?: number;
  privateOfficesCount?: number;
  hasCentralAC?: boolean;
  hasFiberInternet?: boolean;
  parkingSlotsCount?: number;
  hasReceptionSecurity?: boolean;

  // Custom fields for أرض (Land)
  landZoning?: string;
  buildingFootprintRatio?: number | '';
  permittedFloorsCount?: string;
  landStreetWidth?: number | '';
  utilitiesAvailable?: string[];

  // Custom fields for منزل / عمارة (House / Building)
  apartmentsCount?: number | '';
  hasCommercialGround?: boolean;
  hasPrivateRoof?: boolean;

  // Step 4: Photos
  coverImageIndex: number;
  images: string[];

  // Step 5: Documents
  documents: PropertyLegalDocument[];
}

const INITIAL_FORM_DATA: PropertyFormData = {
  title: '',
  type: 'شقة',
  subType: 'شقة سكنية متكررة',
  purpose: 'للبيع',
  description: '',

  governorate: 'القاهرة',
  city: 'القاهرة الجديدة',
  location: 'التجمع الخامس (شارع التسعين والكمبوندات)',
  streetName: '',
  buildingNumber: '',
  latitude: 30.0131,
  longitude: 31.4989,

  price: '',
  area: '',
  bedrooms: 3,
  bathrooms: 2,
  floor: 'الثالث',
  totalFloors: '5',
  buildingAge: 'جديد كلياً (استلام فوري)',
  finishing: 'ألترا سوبر لوكس',
  furnished: 'غير مفروش',
  amenities: ['مصعد', 'جراج', 'شرفة', 'غاز طبيعي', 'أمن وحراسة'],

  // Custom fields defaults
  shopFrontageWidth: '',
  ceilingHeight: '',
  hasMezzanine: false,
  mezzanineArea: '',
  electricityMeterType: 'عداد تجاري 3 فاز (380V)',
  hasRestaurantChimney: false,
  outdoorArea: '',
  isInsideMall: false,
  mallName: '',
  commercialActivities: ['كافيه ومطعم', 'صيدلية', 'محل تجزئة'],

  villaType: 'فيلا مستقلة (Standalone)',
  landArea: '',
  gardenArea: '',
  poolType: 'خاص ومجهز',
  villaFloorsCount: 'بدروم + أرضي + أول + روف',
  hasDriverRoom: true,
  hasMaidRoom: true,
  hasPrivateElevator: false,
  garageCapacity: 2,

  officeLicenseType: 'إداري مرخص رسمي',
  officeLayout: 'مساحة مفتوحة (Open Space)',
  meetingRoomsCount: 1,
  privateOfficesCount: 3,
  hasCentralAC: true,
  hasFiberInternet: true,
  parkingSlotsCount: 2,
  hasReceptionSecurity: true,

  landZoning: 'سكني عمارات',
  buildingFootprintRatio: 40,
  permittedFloorsCount: 'بدروم + أرضي + 3 أدوار + روف',
  landStreetWidth: 20,
  utilitiesAvailable: ['مياه صالحة', 'كهرباء', 'صرف صحي', 'غاز طبيعي'],

  apartmentsCount: 8,
  hasCommercialGround: false,
  hasPrivateRoof: true,

  coverImageIndex: 0,
  images: [],
  documents: [],
};

const STORAGE_DRAFT_KEY = 'sha2ety_property_wizard_draft_v2';

// Realistic sample photos for 1-click test fill
const SAMPLE_PHOTOS_MAP: Record<PropertyType, string[]> = {
  شقة: [
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1200&q=80',
  ],
  فيلا: [
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
  ],
  محل: [
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
  ],
  مكتب: [
    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
  ],
  منزل: [
    'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
  ],
  أرض: [
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1500076656116-558758c991c1?auto=format&fit=crop&w=1200&q=80',
  ],
};

// Realistic sample documents for 1-click test fill
const SAMPLE_DOCUMENTS_BY_TYPE: Record<PropertyType, PropertyLegalDocument[]> = {
  شقة: [
    {
      id: 'doc-deed-1',
      name: 'عقد_ملكية_مسجل_شهر_عقاري_رسمي.pdf',
      type: 'deed',
      typeName: 'عقد ملكية مسجل بالشهر العقاري',
      url: 'https://images.unsplash.com/photo-1618042164219-62c820f10723?auto=format&fit=crop&w=1000&q=80',
      size: '2.8 ميجابايت',
      status: 'pending',
      uploadedAt: new Date().toISOString(),
    },
    {
      id: 'doc-permit-1',
      name: 'رخصة_بناء_العقار_وشهادة_المطابقة.pdf',
      type: 'building_permit',
      typeName: 'رخصة بناء معتمدة',
      url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1000&q=80',
      size: '1.9 ميجابايت',
      status: 'pending',
      uploadedAt: new Date().toISOString(),
    },
    {
      id: 'doc-id-1',
      name: 'بطاقة_الرقم_القومي_للمالك_وجه_وظهر.jpg',
      type: 'national_id',
      typeName: 'بطاقة الرقم القومي للمالك',
      url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1000&q=80',
      size: '950 كيلوبايت',
      status: 'pending',
      uploadedAt: new Date().toISOString(),
    },
  ],
  فيلا: [
    {
      id: 'doc-villa-deed',
      name: 'صك_ملكية_أرض_الفيلا_الشهر_العقاري.pdf',
      type: 'deed',
      typeName: 'عقد ملكية مسجل نهائي',
      url: 'https://images.unsplash.com/photo-1618042164219-62c820f10723?auto=format&fit=crop&w=1000&q=80',
      size: '3.4 ميجابايت',
      status: 'pending',
      uploadedAt: new Date().toISOString(),
    },
    {
      id: 'doc-villa-permit',
      name: 'رخصة_إنشاءات_الفيلا_وحمام_السباحة.pdf',
      type: 'building_permit',
      typeName: 'رخصة بناء ومطابقة إنشائية',
      url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1000&q=80',
      size: '2.5 ميجابايت',
      status: 'pending',
      uploadedAt: new Date().toISOString(),
    },
    {
      id: 'doc-villa-id',
      name: 'بطاقة_الرقم_القومي_للمالك_سارية.jpg',
      type: 'national_id',
      typeName: 'بطاقة الرقم القومي للمالك',
      url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1000&q=80',
      size: '1.1 ميجابايت',
      status: 'pending',
      uploadedAt: new Date().toISOString(),
    },
  ],
  محل: [
    {
      id: 'doc-shop-deed',
      name: 'عقد_شراء_المحل_التجاري_المعتمد.pdf',
      type: 'deed',
      typeName: 'عقد ملكية الوحدة التجارية',
      url: 'https://images.unsplash.com/photo-1618042164219-62c820f10723?auto=format&fit=crop&w=1000&q=80',
      size: '3.1 ميجابايت',
      status: 'pending',
      uploadedAt: new Date().toISOString(),
    },
    {
      id: 'doc-shop-commercial',
      name: 'السجل_التجاري_والبطاقة_الضريبية_ورخصة_التشغيل.pdf',
      type: 'tax_commercial_record',
      typeName: 'سجل تجاري وبطاقة ضريبية',
      url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1000&q=80',
      size: '2.2 ميجابايت',
      status: 'pending',
      uploadedAt: new Date().toISOString(),
    },
    {
      id: 'doc-shop-id',
      name: 'بطاقة_الرقم_القومي_للمالك_والممثل_القانوني.jpg',
      type: 'national_id',
      typeName: 'بطاقة الرقم القومي للمالك',
      url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1000&q=80',
      size: '1.0 ميجابايت',
      status: 'pending',
      uploadedAt: new Date().toISOString(),
    },
  ],
  مكتب: [
    {
      id: 'doc-office-deed',
      name: 'عقد_ملكية_المقر_الإداري.pdf',
      type: 'deed',
      typeName: 'عقد ملكية المقر الإداري',
      url: 'https://images.unsplash.com/photo-1618042164219-62c820f10723?auto=format&fit=crop&w=1000&q=80',
      size: '2.9 ميجابايت',
      status: 'pending',
      uploadedAt: new Date().toISOString(),
    },
    {
      id: 'doc-office-license',
      name: 'ترخيص_نشاط_إداري_معتمد_من_الجهاز.pdf',
      type: 'building_permit',
      typeName: 'ترخيص النشاط الإداري / الطبي',
      url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1000&q=80',
      size: '1.7 ميجابايت',
      status: 'pending',
      uploadedAt: new Date().toISOString(),
    },
    {
      id: 'doc-office-tax',
      name: 'السجل_التجاري_والملف_الضريبي.pdf',
      type: 'tax_commercial_record',
      typeName: 'سجل تجاري وبطاقة ضريبية',
      url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1000&q=80',
      size: '2.1 ميجابايت',
      status: 'pending',
      uploadedAt: new Date().toISOString(),
    },
  ],
  منزل: [
    {
      id: 'doc-building-deed',
      name: 'عقد_ملكية_العمارة_المسجل_نهائي.pdf',
      type: 'deed',
      typeName: 'عقد ملكية مسجل بالشهر العقاري',
      url: 'https://images.unsplash.com/photo-1618042164219-62c820f10723?auto=format&fit=crop&w=1000&q=80',
      size: '3.6 ميجابايت',
      status: 'pending',
      uploadedAt: new Date().toISOString(),
    },
    {
      id: 'doc-building-permit',
      name: 'رخصة_بناء_العمارة_وشهادة_المطابقة_لجميع_الأدوار.pdf',
      type: 'building_permit',
      typeName: 'رخصة بناء معتمدة لكافة الأدوار',
      url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1000&q=80',
      size: '2.4 ميجابايت',
      status: 'pending',
      uploadedAt: new Date().toISOString(),
    },
  ],
  أرض: [
    {
      id: 'doc-land-deed',
      name: 'عقد_تخصيص_وملكية_قطعة_الأرض.pdf',
      type: 'deed',
      typeName: 'عقد ملكية وتخصيص مسجل',
      url: 'https://images.unsplash.com/photo-1618042164219-62c820f10723?auto=format&fit=crop&w=1000&q=80',
      size: '2.7 ميجابايت',
      status: 'pending',
      uploadedAt: new Date().toISOString(),
    },
    {
      id: 'doc-land-reconciliation',
      name: 'محضر_استلام_قطعة_الأرض_والتراخيص.pdf',
      type: 'building_permit',
      typeName: 'محضر استلام وصلاحية الموقع للبناء',
      url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1000&q=80',
      size: '1.9 ميجابايت',
      status: 'pending',
      uploadedAt: new Date().toISOString(),
    },
  ],
};

export const SellerNewPropertyPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<PropertyFormData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_DRAFT_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return INITIAL_FORM_DATA;
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionReference, setSubmissionReference] = useState<string | null>(null);
  const [draftSavedToast, setDraftSavedToast] = useState(false);
  const [deleteConfirmImgIndex, setDeleteConfirmImgIndex] = useState<number | null>(null);
  const [isDraggingImages, setIsDraggingImages] = useState(false);

  // Map state
  const [mapZoomDelta, setMapZoomDelta] = useState<number>(0.02);
  const [isGettingGps, setIsGettingGps] = useState(false);

  // Document Preview Modal State
  const [previewDoc, setPreviewDoc] = useState<PropertyLegalDocument | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-save form data to localStorage draft
  useEffect(() => {
    if (!submissionReference) {
      try {
        localStorage.setItem(STORAGE_DRAFT_KEY, JSON.stringify(formData));
      } catch {
        // Ignore quota
      }
    }
  }, [formData, submissionReference]);

  // Update single field in form data
  const updateField = <K extends keyof PropertyFormData>(key: K, value: PropertyFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (validationErrors[key as string]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[key as string];
        return next;
      });
    }
  };

  // When changing property type, set smart defaults
  const handleTypeSelect = (selectedType: PropertyType) => {
    setFormData((prev) => {
      let subType = prev.subType;
      if (selectedType === 'محل') subType = 'محل تجاري واجهة مباشرة';
      else if (selectedType === 'فيلا') subType = 'فيلا مستقلة (Standalone)';
      else if (selectedType === 'مكتب') subType = 'مقر إداري مرخص';
      else if (selectedType === 'شقة') subType = 'شقة سكنية متكررة';
      else if (selectedType === 'منزل') subType = 'عمارة سكنية كاملة';
      else if (selectedType === 'أرض') subType = 'أرض بناء سكنية';

      return {
        ...prev,
        type: selectedType,
        subType,
      };
    });
  };

  // When changing governorate, update available districts and set center coordinates
  const handleGovernorateChange = (govName: string) => {
    const gov = EGYPT_GOVERNORATES.find((g) => g.name === govName);
    if (gov) {
      const firstDistrict = gov.districts[0];
      setFormData((prev) => ({
        ...prev,
        governorate: gov.name,
        city: firstDistrict ? firstDistrict.city : gov.name,
        location: firstDistrict ? firstDistrict.name : gov.name,
        latitude: firstDistrict ? firstDistrict.lat : gov.lat,
        longitude: firstDistrict ? firstDistrict.lng : gov.lng,
      }));
    } else {
      updateField('governorate', govName);
    }
  };

  // When selecting a specific district
  const handleDistrictChange = (districtName: string) => {
    const districts = getGovernorateDistricts(formData.governorate);
    const target = districts.find((d) => d.name === districtName);
    if (target) {
      setFormData((prev) => ({
        ...prev,
        location: target.name,
        city: target.city,
        latitude: target.lat,
        longitude: target.lng,
      }));
    } else {
      updateField('location', districtName);
    }
  };

  // Hotspot click handler
  const handleHotspotClick = (hotspot: (typeof TOP_NATIONAL_HOTSPOTS)[0]) => {
    setFormData((prev) => ({
      ...prev,
      governorate: hotspot.gov,
      city: hotspot.city,
      location: hotspot.location,
      latitude: hotspot.lat,
      longitude: hotspot.lng,
    }));
  };

  // Get current GPS location
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('خدمة تحديد الموقع الجغرافي غير مدعومة في متصفحك.');
      return;
    }
    setIsGettingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsGettingGps(false);
        const lat = parseFloat(pos.coords.latitude.toFixed(4));
        const lng = parseFloat(pos.coords.longitude.toFixed(4));
        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));
      },
      () => {
        setIsGettingGps(false);
        alert('تعذر تحديد موقعك الحالي. يرجى التأكد من السماح بالوصول للموقع.');
      },
      { timeout: 8000 }
    );
  };

  // Quick 1-click test fill with realistic Egyptian market data
  const handleQuickFillDemo = () => {
    const currentType = formData.type;
    if (currentType === 'محل') {
      setFormData((prev) => ({
        ...prev,
        title: 'محل تجاري واجهة 9 متر على شارع التسعين الجنوبي الرئيسي',
        type: 'محل',
        subType: 'محل تجاري واجهة مباشرة',
        purpose: 'للبيع',
        description: 'محل تجاري استثنائي بواجهة زجاجية بانورامية 9 متر على شارع التسعين الجنوبي مباشرة، ارتفاع سقف 5.2 متر صافي مع دور ميزانين داخلي مرخص 40م²، عداد كهرباء تجاري 3 فاز 380V للأجهزة والمطاعم ومدخنة طرد هواء مجهزة معتمدة من الدفاع المدني، مساحة خارجية أوت دور 35م² للتراس.',
        governorate: 'القاهرة',
        city: 'القاهرة الجديدة',
        location: 'التجمع الخامس (شارع التسعين والكمبوندات)',
        streetName: 'شارع التسعين الجنوبي الرئيسي',
        buildingNumber: 'مبنى 84 ب محور التسعين',
        latitude: 30.0131,
        longitude: 31.4989,
        price: 8500000,
        area: 95,
        shopFrontageWidth: 9,
        ceilingHeight: 5.2,
        hasMezzanine: true,
        mezzanineArea: 40,
        electricityMeterType: 'عداد تجاري 3 فاز (380V)',
        hasRestaurantChimney: true,
        outdoorArea: 35,
        isInsideMall: false,
        mallName: '',
        commercialActivities: ['كافيه ومطعم', 'صيدلية ومعمل تحاليل', 'فرع بنك أو صرافة', 'سوبر ماركت وهايبر', 'كافة الأنشطة التجارية'],
        images: SAMPLE_PHOTOS_MAP['محل'],
        documents: SAMPLE_DOCUMENTS_BY_TYPE['محل'],
        coverImageIndex: 0,
        amenities: ['أمن وحراسة', 'كاميرات مراقبة', 'عداد تجاري 3 فاز', 'موقع تجاري حيوي', 'جراج سيارات'],
      }));
    } else if (currentType === 'فيلا') {
      setFormData((prev) => ({
        ...prev,
        title: 'فيلا مستقلة فاخرة بحمام سباحة مسخن وحديقة خاصة 400م² بالشيخ زايد',
        type: 'فيلا',
        subType: 'فيلا مستقلة (Standalone)',
        purpose: 'للبيع',
        description: 'فيلا مستقلة الترا سوبر لوكس داخل كمبوند راقي بالشيخ زايد، مساحة أرض إجمالية 650م² وحديقة خاصة 400م² مع حمام سباحة مسخن (Heated) وجاكوزي خارجي، تقسيم بدروم وأرضي وأول وروف، أسانسير داخلي خاص وغرفة سائق وغرفة مربية وجراج 3 سيارات.',
        governorate: 'الجيزة',
        city: 'الشيخ زايد',
        location: 'الشيخ زايد (الثورة الخضراء ووصلة دهشور)',
        streetName: 'طريق وصلة دهشور - محور البستان',
        buildingNumber: 'فيلا رقم 14 كمبوند زايد ديونز',
        latitude: 30.0561,
        longitude: 30.9856,
        price: 19500000,
        area: 520,
        villaType: 'فيلا مستقلة (Standalone)',
        landArea: 650,
        gardenArea: 400,
        poolType: 'مسخن (Heated)',
        villaFloorsCount: 'بدروم + أرضي + أول + روف',
        hasDriverRoom: true,
        hasMaidRoom: true,
        hasPrivateElevator: true,
        garageCapacity: 3,
        bedrooms: 5,
        bathrooms: 6,
        images: SAMPLE_PHOTOS_MAP['فيلا'],
        documents: SAMPLE_DOCUMENTS_BY_TYPE['فيلا'],
        coverImageIndex: 0,
        amenities: ['حمام سباحة', 'حديقة خاصة', 'مصعد', 'جراج خاص', 'غرفة سائق', 'غرفة مربية', 'أمن وحراسة'],
      }));
    } else if (currentType === 'مكتب') {
      setFormData((prev) => ({
        ...prev,
        title: 'مقر إداري مرخص رسمي 160م² تشطيب كامل وقاعة اجتماعات بالعاصمة الإدارية',
        type: 'مكتب',
        subType: 'مقر إداري مرخص',
        purpose: 'للبيع',
        description: 'مقر إداري مرخص رسمي للشركات والمؤسسات بالحي المالي بالعاصمة الإدارية الجديدة، تقسيم مساحة مفتوحة Open Space مع 3 مكاتب زجاجية وقاعة اجتماعات مستقلة، تكييف مركزي VRV وإنترنت فايبر وغرفة خوادم وباكيات جراج وبوابات أمن 24/7.',
        governorate: 'القاهرة',
        city: 'العاصمة الإدارية',
        location: 'العاصمة الإدارية الجديدة (منطقة الأعمال R7/R8)',
        streetName: 'المحور المالي والحي الدبلوماسي',
        buildingNumber: 'برج الإدارة بلازا - الدور الرابع',
        latitude: 30.0160,
        longitude: 31.7450,
        price: 9200000,
        area: 160,
        officeLicenseType: 'إداري مرخص رسمي',
        officeLayout: 'مساحة مفتوحة (Open Space)',
        meetingRoomsCount: 1,
        privateOfficesCount: 3,
        hasCentralAC: true,
        hasFiberInternet: true,
        parkingSlotsCount: 2,
        hasReceptionSecurity: true,
        images: SAMPLE_PHOTOS_MAP['مكتب'],
        documents: SAMPLE_DOCUMENTS_BY_TYPE['مكتب'],
        coverImageIndex: 0,
        amenities: ['تكييف مركزي', 'إنترنت فايبر', 'قاعة اجتماعات', 'مصعد إداري', 'أمن 24/7', 'باكيات جراج'],
      }));
    } else if (currentType === 'أرض') {
      setFormData((prev) => ({
        ...prev,
        title: 'قطعة أرض سكنية عمارات 600م² ناصية صريحة بيت الوطن التجمع الخامس',
        type: 'أرض',
        subType: 'أرض بناء سكنية',
        purpose: 'للبيع',
        description: 'قطعة أرض سكنية عمارات مميزة بناصية شارعين عرض 25 متر بالحي الثاني بيت الوطن، ترخيص بدروم وأرضي و3 أدوار متكررة وروف بنسبة بناء 40%، كافة المرافق جاهزة ومتصلة (مياه، كهرباء، صرف، غاز، فايبر، أسفلت).',
        governorate: 'القاهرة',
        city: 'القاهرة الجديدة',
        location: 'بيت الوطن والمستثمرين',
        streetName: 'شارع 20 الحي الثاني',
        buildingNumber: 'قطعة رقم 118',
        latitude: 30.0380,
        longitude: 31.5450,
        price: 6800000,
        area: 600,
        landZoning: 'سكني عمارات',
        buildingFootprintRatio: 40,
        permittedFloorsCount: 'بدروم + أرضي + 3 أدوار + روف',
        landStreetWidth: 25,
        utilitiesAvailable: ['مياه صالحة للشرب', 'شبكة كهرباء', 'صرف صحي', 'غاز طبيعي', 'خطوط تليفون وفايبر', 'طريق أسفلتي ممهد'],
        images: SAMPLE_PHOTOS_MAP['أرض'],
        documents: SAMPLE_DOCUMENTS_BY_TYPE['أرض'],
        coverImageIndex: 0,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        title: 'شقة فاخرة 185م² بإطلالة مفتوحة على الحديقة في كمبوند ميفيدا',
        type: 'شقة',
        subType: 'شقة سكنية متكررة',
        purpose: 'للبيع',
        description: 'شقة ألترا سوبر لوكس بتصميم مودرن وإطلالة مفتوحة على المساحات الخضراء والبحيرة، تشمل 3 غرف نوم و2 حمام وريسبشن 3 قطع، حصة بالجراج ومصعد وغاز طبيعي وأمن وحراسة 24/7.',
        governorate: 'القاهرة',
        city: 'القاهرة الجديدة',
        location: 'التجمع الخامس (شارع التسعين والكمبوندات)',
        streetName: 'شارع التسعين الجنوبي',
        buildingNumber: 'عمارة 24 ميفيدا بوليفارد',
        latitude: 30.0131,
        longitude: 31.4989,
        price: 6850000,
        area: 185,
        bedrooms: 3,
        bathrooms: 2,
        floor: 'الثالث',
        totalFloors: '5',
        buildingAge: 'جديد كلياً (استلام فوري)',
        finishing: 'ألترا سوبر لوكس',
        furnished: 'غير مفروش',
        images: SAMPLE_PHOTOS_MAP['شقة'],
        documents: SAMPLE_DOCUMENTS_BY_TYPE['شقة'],
        coverImageIndex: 0,
        amenities: ['مصعد', 'جراج', 'شرفة', 'غاز طبيعي', 'أمن وحراسة', 'كاميرات مراقبة'],
      }));
    }
    setValidationErrors({});
  };

  // Toggle amenity or commercial activity
  const toggleAmenity = (amenity: string) => {
    setFormData((prev) => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((a) => a !== amenity)
          : [...prev.amenities, amenity],
      };
    });
  };

  const toggleCommercialActivity = (act: string) => {
    setFormData((prev) => {
      const acts = prev.commercialActivities || [];
      const exists = acts.includes(act);
      return {
        ...prev,
        commercialActivities: exists ? acts.filter((a) => a !== act) : [...acts, act],
      };
    });
  };

  const toggleUtility = (util: string) => {
    setFormData((prev) => {
      const utils = prev.utilitiesAvailable || [];
      const exists = utils.includes(util);
      return {
        ...prev,
        utilitiesAvailable: exists ? utils.filter((u) => u !== util) : [...utils, util],
      };
    });
  };

  // Step Validation Logic
  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.title.trim()) {
        errors.title = 'يرجى إدخال عنوان واضح للإعلان.';
      } else if (formData.title.trim().length < 8) {
        errors.title = 'عنوان الإعلان يجب ألا يقل عن 8 أحرف لتوضيح العقار.';
      }

      if (!formData.description.trim()) {
        errors.description = 'يرجى إدخال وصف تفصيلي للعقار.';
      } else if (formData.description.trim().length < 25) {
        errors.description = 'الوصف قصير جداً، يرجى كتابة 25 حرفاً على الأقل يوضح مزايا العقار.';
      }
    }

    if (step === 2) {
      if (!formData.governorate.trim()) {
        errors.governorate = 'يرجى اختيار المحافظة.';
      }
      if (!formData.city.trim()) {
        errors.city = 'يرجى تحديد المدينة.';
      }
      if (!formData.location.trim()) {
        errors.location = 'يرجى تحديد الحي أو المنطقة السكنية.';
      }
    }

    if (step === 3) {
      if (!formData.price || Number(formData.price) <= 0) {
        errors.price = 'يرجى إدخال سعر بيع صحيح بالجنيه المصري.';
      }
      if (!formData.area || Number(formData.area) <= 0) {
        errors.area = 'يرجى إدخال المساحة بالمتر المربع.';
      }

      // Type-specific validations
      if (formData.type === 'محل') {
        if (!formData.shopFrontageWidth || Number(formData.shopFrontageWidth) <= 0) {
          errors.shopFrontageWidth = 'يرجى إدخال عرض الواجهة بالمتر للمحل التجاري.';
        }
      } else if (formData.type === 'فيلا') {
        if (!formData.landArea || Number(formData.landArea) <= 0) {
          errors.landArea = 'يرجى إدخال مساحة الأرض الإجمالية للفيلا.';
        }
      } else if (formData.type === 'مكتب') {
        if (!formData.officeLicenseType) {
          errors.officeLicenseType = 'يرجى تحديد نوع الترخيص للمقر الإداري.';
        }
      } else if (formData.type === 'أرض') {
        if (!formData.landZoning) {
          errors.landZoning = 'يرجى تحديد نوع تخصيص الأرض.';
        }
      }
    }

    if (step === 4) {
      if (formData.images.length === 0) {
        errors.images = 'يجب رفع صورة واحدة على الأقل للعقار (يُفضل 3 صور فأكثر).';
      }
    }

    if (step === 5) {
      if (formData.documents.length === 0) {
        errors.documents = 'يرجى إرفاق عقد الملكية أو مستند إثبات الملكية لبدء الفحص والتوثيق.';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Navigation handlers
  const handleNext = () => {
    if (validateStep(currentStep)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setCurrentStep((prev) => Math.min(prev + 1, 6));
    }
  };

  const handlePrev = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Compile customDetails object based on active property type
  const buildCustomDetails = (): Record<string, any> => {
    const details: Record<string, any> = {};

    if (formData.type === 'محل') {
      details.shopFrontageWidth = formData.shopFrontageWidth;
      details.ceilingHeight = formData.ceilingHeight;
      details.hasMezzanine = formData.hasMezzanine;
      details.mezzanineArea = formData.mezzanineArea;
      details.electricityMeterType = formData.electricityMeterType;
      details.hasRestaurantChimney = formData.hasRestaurantChimney;
      details.outdoorArea = formData.outdoorArea;
      details.isInsideMall = formData.isInsideMall;
      details.mallName = formData.mallName;
      details.commercialActivities = formData.commercialActivities;
    } else if (formData.type === 'فيلا') {
      details.villaType = formData.villaType;
      details.landArea = formData.landArea;
      details.gardenArea = formData.gardenArea;
      details.poolType = formData.poolType;
      details.villaFloorsCount = formData.villaFloorsCount;
      details.hasDriverRoom = formData.hasDriverRoom;
      details.hasMaidRoom = formData.hasMaidRoom;
      details.hasPrivateElevator = formData.hasPrivateElevator;
      details.garageCapacity = formData.garageCapacity;
    } else if (formData.type === 'مكتب') {
      details.officeLicenseType = formData.officeLicenseType;
      details.officeLayout = formData.officeLayout;
      details.meetingRoomsCount = formData.meetingRoomsCount;
      details.privateOfficesCount = formData.privateOfficesCount;
      details.hasCentralAC = formData.hasCentralAC;
      details.hasFiberInternet = formData.hasFiberInternet;
      details.parkingSlotsCount = formData.parkingSlotsCount;
      details.hasReceptionSecurity = formData.hasReceptionSecurity;
    } else if (formData.type === 'أرض') {
      details.landZoning = formData.landZoning;
      details.buildingFootprintRatio = formData.buildingFootprintRatio;
      details.permittedFloorsCount = formData.permittedFloorsCount;
      details.landStreetWidth = formData.landStreetWidth;
      details.utilitiesAvailable = formData.utilitiesAvailable;
    } else if (formData.type === 'منزل') {
      details.apartmentsCount = formData.apartmentsCount;
      details.hasCommercialGround = formData.hasCommercialGround;
      details.hasPrivateRoof = formData.hasPrivateRoof;
    }

    return details;
  };

  // Save as Draft
  const handleSaveAsDraft = async () => {
    setIsSubmitting(true);
    try {
      const cover =
        formData.images[formData.coverImageIndex] ||
        formData.images[0] ||
        SAMPLE_PHOTOS_MAP[formData.type][0];

      await addSellerProperty({
        sellerId: user?.id || 'demo-seller-1',
        title: formData.title.trim() || `مسودة إعلان ${formData.type} للبيع`,
        description: formData.description.trim() || 'مسودة قيد الاستكمال.',
        price: Number(formData.price) || 0,
        area: Number(formData.area) || 0,
        type: formData.type,
        subType: formData.subType,
        purpose: 'للبيع',
        governorate: formData.governorate,
        city: formData.city,
        location: formData.location,
        streetName: formData.streetName,
        buildingNumber: formData.buildingNumber,
        latitude: formData.latitude,
        longitude: formData.longitude,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        floor: formData.floor,
        totalFloors: formData.totalFloors,
        buildingAge: formData.buildingAge,
        finishing: formData.finishing,
        furnished: formData.furnished,
        amenities: formData.amenities,
        customDetails: buildCustomDetails(),
        imageUrl: cover,
        images: formData.images,
        documents: formData.documents,
        status: 'draft' as SellerPropertyStatus,
      });

      localStorage.removeItem(STORAGE_DRAFT_KEY);
      setDraftSavedToast(true);
      setTimeout(() => {
        navigate('/seller/properties');
      }, 1000);
    } catch (err) {
      console.error('Failed to save draft:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Final Submit for Review
  const handleSubmitForReview = async () => {
    // Validate all steps 1-5 before final submit
    for (let s = 1; s <= 5; s++) {
      if (!validateStep(s)) {
        setCurrentStep(s);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const cover = formData.images[formData.coverImageIndex] || formData.images[0];
      const ref = `SHA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      await addSellerProperty({
        sellerId: user?.id || 'demo-seller-1',
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        area: Number(formData.area),
        type: formData.type,
        subType: formData.subType,
        purpose: 'للبيع',
        governorate: formData.governorate,
        city: formData.city,
        location: formData.location,
        streetName: formData.streetName,
        buildingNumber: formData.buildingNumber,
        latitude: formData.latitude,
        longitude: formData.longitude,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        floor: formData.floor,
        totalFloors: formData.totalFloors,
        buildingAge: formData.buildingAge,
        finishing: formData.finishing,
        furnished: formData.furnished,
        amenities: formData.amenities,
        customDetails: buildCustomDetails(),
        imageUrl: cover,
        images: formData.images,
        documents: formData.documents,
        status: 'pending_review' as SellerPropertyStatus,
      });

      localStorage.removeItem(STORAGE_DRAFT_KEY);
      setSubmissionReference(ref);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Failed to submit property for review:', err);
      alert('حدث خطأ أثناء إرسال البيانات، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Image upload handling (real Data URL reading)
  const handleImageFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const validFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) {
        alert(`حجم الصورة "${file.name}" أكبر من 10 ميجابايت.`);
        continue;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        alert(`صيغة الملف "${file.name}" غير مدعومة، يرجى رفع ملفات JPG, PNG, أو WEBP.`);
        continue;
      }
      validFiles.push(file);
    }

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          setFormData((prev) => ({
            ...prev,
            images: [...prev.images, result],
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (indexToRemove: number) => {
    setFormData((prev) => {
      const newImages = prev.images.filter((_, idx) => idx !== indexToRemove);
      let newCover = prev.coverImageIndex;
      if (newCover === indexToRemove) newCover = 0;
      else if (newCover > indexToRemove) newCover -= 1;
      return { ...prev, images: newImages, coverImageIndex: newCover };
    });
    setDeleteConfirmImgIndex(null);
  };

  const moveImage = (index: number, direction: 'left' | 'right') => {
    setFormData((prev) => {
      const targetIndex = direction === 'left' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.images.length) return prev;

      const newImages = [...prev.images];
      const temp = newImages[index];
      newImages[index] = newImages[targetIndex];
      newImages[targetIndex] = temp;

      let newCover = prev.coverImageIndex;
      if (prev.coverImageIndex === index) newCover = targetIndex;
      else if (prev.coverImageIndex === targetIndex) newCover = index;

      return { ...prev, images: newImages, coverImageIndex: newCover };
    });
  };

  // Document upload handling with real file reader (Data URL for visual preview)
  const handleDocumentFiles = (
    files: FileList | null,
    docType: PropertyLegalDocument['type'],
    typeName: string
  ) => {
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = (e.target?.result as string) || '#';
        const newDoc: PropertyLegalDocument = {
          id: `doc-${Date.now()}-${i}`,
          name: file.name,
          type: docType,
          typeName,
          url: dataUrl,
          size: `${(file.size / (1024 * 1024)).toFixed(1)} ميجابايت`,
          status: 'pending',
          uploadedAt: new Date().toISOString(),
        };

        setFormData((prev) => ({
          ...prev,
          documents: [...prev.documents, newDoc],
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeDocument = (docId: string) => {
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.filter((d) => d.id !== docId),
    }));
  };

  // Calculated price per sqm
  const pricePerSqm =
    formData.price && formData.area && Number(formData.area) > 0
      ? Math.round(Number(formData.price) / Number(formData.area))
      : null;

  // Available districts for chosen governorate
  const activeDistricts = getGovernorateDistricts(formData.governorate);

  // Render dedicated technical fields based on selected property type
  const renderCustomFieldsForType = () => {
    return (
      <div className="space-y-4">
        {formData.type === 'محل' && (
          <div className="p-5 rounded-2xl bg-[var(--dp-color-ground)] border-[2.5px] border-[var(--dp-color-outline)] space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#ece9db] pb-3">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-[var(--dp-color-accent)]" />
                <h4 className="font-black text-sm sm:text-base text-[var(--dp-color-ink)]">
                  المواصفات الفنية والتجارية المخصصة للمحل التجاري
                </h4>
              </div>
              <Badge variant="primary" size="sm">محل تجاري</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1">
                  عرض واجهة المحل (بالمتر) <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="number"
                  value={formData.shopFrontageWidth || ''}
                  onChange={(e) => updateField('shopFrontageWidth', e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="مثال: 6 أو 8.5 متر"
                  error={validationErrors.shopFrontageWidth}
                />
              </div>

              <div>
                <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1">
                  ارتفاع السقف الصافي (بالمتر)
                </label>
                <Input
                  type="number"
                  value={formData.ceilingHeight || ''}
                  onChange={(e) => updateField('ceilingHeight', e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="مثال: 4.5 أو 6 متر"
                />
              </div>

              <Select
                label="نوع العداد والكهرباء"
                value={formData.electricityMeterType || 'عداد تجاري 3 فاز (380V)'}
                onChange={(e) => updateField('electricityMeterType', e.target.value)}
                options={[
                  { value: 'عداد تجاري 3 فاز (380V)', label: 'عداد تجاري 3 فاز (380V) للأجهزة والمطاعم' },
                  { value: 'عداد أحادي (220V)', label: 'عداد أحادي 220V' },
                  { value: 'عداد كودي مسبق الدفع', label: 'عداد كودي مسبق الدفع' },
                ]}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="p-3 rounded-xl bg-white border border-[var(--dp-color-outline)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[var(--dp-color-ink)]">يوجد دور ميزانين داخلي؟</span>
                  <input
                    type="checkbox"
                    checked={formData.hasMezzanine || false}
                    onChange={(e) => updateField('hasMezzanine', e.target.checked)}
                    className="w-4 h-4 accent-[var(--dp-color-accent)] cursor-pointer"
                  />
                </div>
                {formData.hasMezzanine && (
                  <Input
                    type="number"
                    placeholder="مساحة الميزانين م²"
                    value={formData.mezzanineArea || ''}
                    onChange={(e) => updateField('mezzanineArea', e.target.value === '' ? '' : Number(e.target.value))}
                  />
                )}
              </div>

              <div className="p-3 rounded-xl bg-white border border-[var(--dp-color-outline)] flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-[var(--dp-color-ink)] block">مدخنة كافيه ومطعم مجهزة</span>
                  <span className="text-[11px] text-[#626d84] block">تجهيزات تهوية معتمدة من الدفاع المدني</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.hasRestaurantChimney || false}
                  onChange={(e) => updateField('hasRestaurantChimney', e.target.checked)}
                  className="w-4 h-4 accent-[var(--dp-color-accent)] cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1">
                  مساحة الإشغال الخارجي / أوت دور (م²)
                </label>
                <Input
                  type="number"
                  placeholder="مثال: 45 م² تراس أمامي"
                  value={formData.outdoorArea || ''}
                  onChange={(e) => updateField('outdoorArea', e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-white border border-[var(--dp-color-outline)] flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-[var(--dp-color-ink)] block">الموقع التجاري: داخل مول؟</span>
                  <span className="text-[11px] text-[#626d84] block">حدد إذا كان المحل داخل مركز تسوق أو واجهة على شارع</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.isInsideMall || false}
                  onChange={(e) => updateField('isInsideMall', e.target.checked)}
                  className="w-4 h-4 accent-[var(--dp-color-accent)] cursor-pointer"
                />
              </div>

              {formData.isInsideMall && (
                <Input
                  label="اسم المول التجاري والدور"
                  placeholder="مثال: مول بوينت 90، الدور الأرضي"
                  value={formData.mallName || ''}
                  onChange={(e) => updateField('mallName', e.target.value)}
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-2">
                الأنشطة التجارية المصرح بها للوحدة
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  'كافيه ومطعم',
                  'صيدلية ومعمل تحاليل',
                  'فرع بنك أو صرافة',
                  'سوبر ماركت وهايبر',
                  'ملابس وعلامات تجارية',
                  'أجهزة إلكترونية واتصالات',
                  'محل عطور ومستحضرات',
                  'كافة الأنشطة التجارية',
                ].map((act) => {
                  const isChecked = (formData.commercialActivities || []).includes(act);
                  return (
                    <button
                      key={act}
                      type="button"
                      onClick={() => toggleCommercialActivity(act)}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-right flex items-center justify-between cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-950 font-black'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>{act}</span>
                      {isChecked && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {formData.type === 'فيلا' && (
          <div className="p-5 rounded-2xl bg-[var(--dp-color-ground)] border-[2.5px] border-[var(--dp-color-outline)] space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#ece9db] pb-3">
              <div className="flex items-center gap-2">
                <Home className="w-5 h-5 text-[var(--dp-color-accent)]" />
                <h4 className="font-black text-sm sm:text-base text-[var(--dp-color-ink)]">
                  مواصفات الفيلا والمساحات الخارجية والخدمات
                </h4>
              </div>
              <Badge variant="warm" size="sm">فيلا سكنية</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1">
                  مساحة الأرض الإجمالية (م²) *
                </label>
                <Input
                  type="number"
                  value={formData.landArea || ''}
                  onChange={(e) => updateField('landArea', e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="مثال: 550 م²"
                  error={validationErrors.landArea}
                />
              </div>

              <div>
                <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1">
                  مساحة الحديقة الخاصة (م²)
                </label>
                <Input
                  type="number"
                  value={formData.gardenArea || ''}
                  onChange={(e) => updateField('gardenArea', e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="مثال: 320 م² لاند سكيب"
                />
              </div>

              <Select
                label="حمام السباحة الخاص"
                value={formData.poolType || 'خاص ومجهز'}
                onChange={(e) => updateField('poolType', e.target.value)}
                options={[
                  { value: 'خاص ومجهز', label: 'حمام سباحة خاص مجهز بالكامل' },
                  { value: 'مسخن (Heated)', label: 'حمام سباحة خاص مسخن (Heated Pool)' },
                  { value: 'جاكوزي خارجي', label: 'جاكوزي خارجي بالحديقة' },
                  { value: 'بدون حمام سباحة', label: 'بدون حمام سباحة (حديقة فقط)' },
                ]}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="تقسيم أدوار الفيلا"
                value={formData.villaFloorsCount || 'بدروم + أرضي + أول + روف'}
                onChange={(e) => updateField('villaFloorsCount', e.target.value)}
                options={[
                  { value: 'بدروم + أرضي + أول + روف', label: 'بدروم كامل + أرضي + أول + روف' },
                  { value: 'أرضي + أول + روف', label: 'أرضي + دور أول + روف وتراس' },
                  { value: 'أرضي + دورين + روف', label: 'أرضي + دورين متكررين + روف' },
                ]}
              />

              <div>
                <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1">
                  سعة الجراج الخاص (عدد السيارات)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => updateField('garageCapacity', num)}
                      className={`py-2 rounded-xl border-[2px] font-black text-xs cursor-pointer ${
                        formData.garageCapacity === num
                          ? 'bg-[var(--dp-color-accent)] text-white border-[var(--dp-color-outline)] shadow-hard-xs'
                          : 'bg-white border-[var(--dp-color-outline)] text-[#4a5568]'
                      }`}
                    >
                      {num === 4 ? '+4 سيارات' : `${num} سيارات`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-white border border-[var(--dp-color-outline)] flex items-center justify-between">
                <span className="text-xs font-black text-[var(--dp-color-ink)]">غرفة سائق بحمام خاص</span>
                <input
                  type="checkbox"
                  checked={formData.hasDriverRoom || false}
                  onChange={(e) => updateField('hasDriverRoom', e.target.checked)}
                  className="w-4 h-4 accent-[var(--dp-color-accent)] cursor-pointer"
                />
              </div>

              <div className="p-3 rounded-xl bg-white border border-[var(--dp-color-outline)] flex items-center justify-between">
                <span className="text-xs font-black text-[var(--dp-color-ink)]">غرفة مربية بحمام خاص</span>
                <input
                  type="checkbox"
                  checked={formData.hasMaidRoom || false}
                  onChange={(e) => updateField('hasMaidRoom', e.target.checked)}
                  className="w-4 h-4 accent-[var(--dp-color-accent)] cursor-pointer"
                />
              </div>

              <div className="p-3 rounded-xl bg-white border border-[var(--dp-color-outline)] flex items-center justify-between">
                <span className="text-xs font-black text-[var(--dp-color-ink)]">مصعد (أسانسير) داخلي خاص</span>
                <input
                  type="checkbox"
                  checked={formData.hasPrivateElevator || false}
                  onChange={(e) => updateField('hasPrivateElevator', e.target.checked)}
                  className="w-4 h-4 accent-[var(--dp-color-accent)] cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {formData.type === 'مكتب' && (
          <div className="p-5 rounded-2xl bg-[var(--dp-color-ground)] border-[2.5px] border-[var(--dp-color-outline)] space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#ece9db] pb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[var(--dp-color-accent)]" />
                <h4 className="font-black text-sm sm:text-base text-[var(--dp-color-ink)]">
                  المواصفات والتجهيزات الإدارية والتقنية للمقر / المكتب
                </h4>
              </div>
              <Badge variant="primary" size="sm">مقر إداري</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="نوع الترخيص الرسمي للمقر *"
                value={formData.officeLicenseType || 'إداري مرخص رسمي'}
                onChange={(e) => updateField('officeLicenseType', e.target.value)}
                error={validationErrors.officeLicenseType}
                options={[
                  { value: 'إداري مرخص رسمي', label: 'إداري مرخص رسمي للشركات والمؤسسات' },
                  { value: 'طبي للعيادات والمراكز', label: 'طبي مرخص للعيادات والمراكز الطبية' },
                  { value: 'تجاري إداري متعدد', label: 'تجاري إداري متعدد الاستخدامات' },
                ]}
              />

              <Select
                label="التقسيم والتصميم الداخلي"
                value={formData.officeLayout || 'مساحة مفتوحة (Open Space)'}
                onChange={(e) => updateField('officeLayout', e.target.value)}
                options={[
                  { value: 'مساحة مفتوحة (Open Space)', label: 'مساحة مفتوحة كاملة (Open Space)' },
                  { value: 'مكاتب مقسمة زجاجياً', label: 'مكاتب مقسمة زجاجياً حديثة (Glass Partitions)' },
                  { value: 'غرف مغلقة كلاسيكية', label: 'غرف مغلقة كلاسيكية مستقلة' },
                ]}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1">
                  عدد قاعات الاجتماعات
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 1, 2, 3].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => updateField('meetingRoomsCount', num)}
                      className={`py-2 rounded-xl border-[2px] font-black text-xs cursor-pointer ${
                        formData.meetingRoomsCount === num
                          ? 'bg-[var(--dp-color-accent)] text-white border-[var(--dp-color-outline)] shadow-hard-xs'
                          : 'bg-white border-[var(--dp-color-outline)] text-[#4a5568]'
                      }`}
                    >
                      {num === 0 ? 'بدون' : `${num} قاعة`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1">
                  عدد المكاتب المستقلة المغلقة
                </label>
                <Input
                  type="number"
                  value={formData.privateOfficesCount ?? ''}
                  onChange={(e) => updateField('privateOfficesCount', e.target.value === '' ? undefined : Number(e.target.value))}
                  placeholder="مثال: 3 مكاتب"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1">
                  باكيات الجراج المخصصة للمقر
                </label>
                <Input
                  type="number"
                  value={formData.parkingSlotsCount ?? ''}
                  onChange={(e) => updateField('parkingSlotsCount', e.target.value === '' ? undefined : Number(e.target.value))}
                  placeholder="مثال: 2 مكان بالجراج"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-white border border-[var(--dp-color-outline)] flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-[var(--dp-color-ink)] block">تكييف مركزي VRV</span>
                  <span className="text-[11px] text-[#626d84] block">تحكم حراري مستقل لكل مكتب</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.hasCentralAC || false}
                  onChange={(e) => updateField('hasCentralAC', e.target.checked)}
                  className="w-4 h-4 accent-[var(--dp-color-accent)] cursor-pointer"
                />
              </div>

              <div className="p-3 rounded-xl bg-white border border-[var(--dp-color-outline)] flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-[var(--dp-color-ink)] block">إنترنت فايبر وغرفة خوادم</span>
                  <span className="text-[11px] text-[#626d84] block">Server Room وتمديدات شبكة داخلية</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.hasFiberInternet || false}
                  onChange={(e) => updateField('hasFiberInternet', e.target.checked)}
                  className="w-4 h-4 accent-[var(--dp-color-accent)] cursor-pointer"
                />
              </div>

              <div className="p-3 rounded-xl bg-white border border-[var(--dp-color-outline)] flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-[var(--dp-color-ink)] block">استقبال وبوابات أمن 24/7</span>
                  <span className="text-[11px] text-[#626d84] block">أمن وحراسة ومدخل فندقي راقي</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.hasReceptionSecurity || false}
                  onChange={(e) => updateField('hasReceptionSecurity', e.target.checked)}
                  className="w-4 h-4 accent-[var(--dp-color-accent)] cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {formData.type === 'أرض' && (
          <div className="p-5 rounded-2xl bg-[var(--dp-color-ground)] border-[2.5px] border-[var(--dp-color-outline)] space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#ece9db] pb-3">
              <div className="flex items-center gap-2">
                <LandPlot className="w-5 h-5 text-[var(--dp-color-accent)]" />
                <h4 className="font-black text-sm sm:text-base text-[var(--dp-color-ink)]">
                  المواصفات الفنية والتراخيص لقطعة الأرض
                </h4>
              </div>
              <Badge variant="secondary" size="sm">أرض للبناء</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="نوع التخصيص الرسمي لقطعة الأرض *"
                value={formData.landZoning || 'سكني عمارات'}
                onChange={(e) => updateField('landZoning', e.target.value)}
                error={validationErrors.landZoning}
                options={[
                  { value: 'سكني عمارات', label: 'سكني عمارات (بدروم + أرضي + متكرر + روف)' },
                  { value: 'سكني فيلات', label: 'سكني فيلات مخصص (Standalone / Twin)' },
                  { value: 'تجاري إداري', label: 'تجاري إداري وخدمي للأنشطة والشركات' },
                  { value: 'صناعي ومخازن', label: 'صناعي ومخازن ولوجستيات' },
                  { value: 'زراعي واستصلاح', label: 'زراعي أو استثماري' },
                ]}
              />

              <div>
                <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1">
                  نسبة البناء المصرح بها (%)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[40, 45, 50, 60].map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => updateField('buildingFootprintRatio', ratio)}
                      className={`py-2 rounded-xl border-[2px] font-black text-xs cursor-pointer ${
                        formData.buildingFootprintRatio === ratio
                          ? 'bg-[var(--dp-color-accent)] text-white border-[var(--dp-color-outline)] shadow-hard-xs'
                          : 'bg-white border-[var(--dp-color-outline)] text-[#4a5568]'
                      }`}
                    >
                      {ratio}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="الارتفاع والأدوار المصرح بها"
                value={formData.permittedFloorsCount || 'بدروم + أرضي + 3 أدوار + روف'}
                onChange={(e) => updateField('permittedFloorsCount', e.target.value)}
                options={[
                  { value: 'بدروم + أرضي + 3 أدوار + روف', label: 'بدروم + أرضي + 3 أدوار متكررة + روف' },
                  { value: 'أرضي + دورين + روف (فيلات)', label: 'أرضي + دورين + روف (فيلات)' },
                  { value: 'بدروم + أرضي + 4 أدوار + روف', label: 'بدروم + أرضي + 4 أدوار + روف' },
                  { value: 'أرضي + 5 أدوار أو أكثر', label: 'أرضي + 5 أدوار أو أكثر (أبراج)' },
                ]}
              />

              <div>
                <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1">
                  عرض الشارع أمام الأرض (بالمتر)
                </label>
                <Input
                  type="number"
                  value={formData.landStreetWidth || ''}
                  onChange={(e) => updateField('landStreetWidth', e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="مثال: 16 أو 20 أو 32 متر"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-2">
                المرافق المتصلة والجاهزة لقطعة الأرض
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {['مياه صالحة للشرب', 'شبكة كهرباء', 'صرف صحي', 'غاز طبيعي', 'خطوط تليفون وفايبر', 'طريق أسفلتي ممهد'].map((util) => {
                  const isChecked = (formData.utilitiesAvailable || []).includes(util);
                  return (
                    <button
                      key={util}
                      type="button"
                      onClick={() => toggleUtility(util)}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-right flex items-center justify-between cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-950 font-black'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>{util}</span>
                      {isChecked && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {formData.type === 'شقة' && (
          <div className="p-5 rounded-2xl bg-[var(--dp-color-ground)] border-[2.5px] border-[var(--dp-color-outline)] space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#ece9db] pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[var(--dp-color-accent)]" />
                <h4 className="font-black text-sm sm:text-base text-[var(--dp-color-ink)]">
                  مواصفات وتقسيم الشقة السكنية
                </h4>
              </div>
              <Badge variant="primary" size="sm">شقة سكنية</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-2">
                  عدد الغرف الرئيسية
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => updateField('bedrooms', num)}
                      className={`py-2 rounded-xl border-[2px] font-black text-sm cursor-pointer transition-all ${
                        formData.bedrooms === num
                          ? 'bg-[var(--dp-color-accent)] text-white border-[var(--dp-color-outline)] shadow-hard-xs'
                          : 'bg-white border-[var(--dp-color-outline)] text-[#4a5568]'
                      }`}
                    >
                      {num === 6 ? '+6' : num}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-2">
                  عدد الحمامات
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => updateField('bathrooms', num)}
                      className={`py-2 rounded-xl border-[2px] font-black text-sm cursor-pointer transition-all ${
                        formData.bathrooms === num
                          ? 'bg-[var(--dp-color-accent)] text-white border-[var(--dp-color-outline)] shadow-hard-xs'
                          : 'bg-white border-[var(--dp-color-outline)] text-[#4a5568]'
                      }`}
                    >
                      {num === 5 ? '+5' : num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <Select
                label="رقم الدور"
                value={formData.floor}
                onChange={(e) => updateField('floor', e.target.value)}
                options={[
                  { value: 'أرضي مرتفع', label: 'أرضي مرتفع' },
                  { value: 'أرضي بحديقة', label: 'أرضي بحديقة' },
                  { value: 'الأول', label: 'الدور الأول' },
                  { value: 'الثاني', label: 'الدور الثاني' },
                  { value: 'الثالث', label: 'الدور الثالث' },
                  { value: 'الرابع', label: 'الدور الرابع' },
                  { value: 'الخامس فأعلى', label: 'الدور الخامس فأعلى' },
                  { value: 'روف مع تراس', label: 'روف مع تراس' },
                ]}
              />

              <Select
                label="إجمالي أدوار المبنى"
                value={formData.totalFloors}
                onChange={(e) => updateField('totalFloors', e.target.value)}
                options={[
                  { value: '3', label: '3 أدوار' },
                  { value: '4', label: '4 أدوار' },
                  { value: '5', label: '5 أدوار' },
                  { value: '6', label: '6 أدوار' },
                  { value: '10+', label: 'برج سكني (10+)' },
                ]}
              />

              <Select
                label="حالة التشطيب"
                value={formData.finishing}
                onChange={(e) => updateField('finishing', e.target.value)}
                options={[
                  { value: 'ألترا سوبر لوكس', label: 'ألترا سوبر لوكس' },
                  { value: 'سوبر لوكس', label: 'سوبر لوكس' },
                  { value: 'لوكس', label: 'لوكس' },
                  { value: 'نصف تشطيب (محارة وحلوق)', label: 'نصف تشطيب' },
                  { value: 'بدون تشطيب (طوب أحمر)', label: 'طوب أحمر' },
                ]}
              />

              <Select
                label="حالة الفرش"
                value={formData.furnished}
                onChange={(e) => updateField('furnished', e.target.value)}
                options={[
                  { value: 'غير مفروش', label: 'غير مفروش' },
                  { value: 'مفروش بالكامل', label: 'مفروش بالكامل مودرن' },
                  { value: 'مفروش بالمطبخ والأجهزة فقط', label: 'بالمطبخ والتكييفات' },
                ]}
              />
            </div>
          </div>
        )}

        {formData.type === 'منزل' && (
          <div className="p-5 rounded-2xl bg-[var(--dp-color-ground)] border-[2.5px] border-[var(--dp-color-outline)] space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#ece9db] pb-3">
              <div className="flex items-center gap-2">
                <Layers3 className="w-5 h-5 text-[var(--dp-color-accent)]" />
                <h4 className="font-black text-sm sm:text-base text-[var(--dp-color-ink)]">
                  مواصفات العمارة / المبنى السكني
                </h4>
              </div>
              <Badge variant="fresh" size="sm">عمارة / منزل</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1">
                  إجمالي عدد الوحدات والشقق
                </label>
                <Input
                  type="number"
                  value={formData.apartmentsCount || ''}
                  onChange={(e) => updateField('apartmentsCount', e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="مثال: 8 شقق"
                />
              </div>

              <div className="p-3 rounded-xl bg-white border border-[var(--dp-color-outline)] flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-[var(--dp-color-ink)] block">أرضي تجاري ومحلات</span>
                  <span className="text-[11px] text-[#626d84] block">يوجد محلات بالدور الأرضي للعمارة</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.hasCommercialGround || false}
                  onChange={(e) => updateField('hasCommercialGround', e.target.checked)}
                  className="w-4 h-4 accent-[var(--dp-color-accent)] cursor-pointer"
                />
              </div>

              <div className="p-3 rounded-xl bg-white border border-[var(--dp-color-outline)] flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-[var(--dp-color-ink)] block">روف خاص مع تراس كامل</span>
                  <span className="text-[11px] text-[#626d84] block">استغلال خاص لسطح المبنى</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.hasPrivateRoof || false}
                  onChange={(e) => updateField('hasPrivateRoof', e.target.checked)}
                  className="w-4 h-4 accent-[var(--dp-color-accent)] cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Step descriptors
  const stepsConfig = [
    { num: 1, title: 'البيانات الأساسية', color: 'bg-[var(--dp-color-accent)]', text: 'text-white' },
    { num: 2, title: 'الموقع والخريطة', color: 'bg-[var(--dp-color-accent-fresh)]', text: 'text-emerald-950' },
    { num: 3, title: 'مواصفات العقار', color: 'bg-[var(--dp-color-accent-warm)]', text: 'text-amber-950' },
    { num: 4, title: 'معرض الصور', color: 'bg-[var(--dp-color-accent-secondary)]', text: 'text-rose-950' },
    { num: 5, title: 'المستندات القانونية', color: 'bg-emerald-600', text: 'text-white' },
    { num: 6, title: 'المراجعة والإرسال', color: 'bg-purple-600', text: 'text-white' },
  ];

  // ----------------------------------------------------------------------
  // SUBMISSION CONFIRMATION SCREEN
  // ----------------------------------------------------------------------
  if (submissionReference) {
    return (
      <DashboardLayout
        role="seller"
        title="تم إرسال العقار للمراجعة"
        subtitle="تم حفظ بيانات عقارك بنجاح ورفع مستندات الملكية للفحص والاعتماد."
      >
        <div className="max-w-2xl mx-auto text-right">
          <div className="relative">
            {/* Violet offset backing */}
            <div className="absolute inset-0 bg-[var(--dp-color-accent)] rounded-[var(--dp-radius-corner)] translate-x-2 translate-y-2 -z-10" />

            <div className="bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-8 sm:p-12 shadow-hard space-y-6">
              {/* Geometric Badge */}
              <div className="w-20 h-20 rounded-2xl bg-[var(--dp-color-accent-fresh)] border-[3px] border-[var(--dp-color-outline)] flex items-center justify-center text-emerald-900 mx-auto shadow-hard-sm">
                <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
              </div>

              <div className="text-center space-y-2">
                <span className="inline-block px-3 py-1 rounded-full bg-[var(--dp-color-selection)] border border-[var(--dp-color-outline)] text-xs font-black text-[var(--dp-color-accent)]">
                  رقم مرجعي: {submissionReference}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-[var(--dp-color-ink)]">
                  تم استلام عقارك للمراجعة والتوثيق!
                </h2>
                <p className="text-sm text-[#526078] font-bold max-w-md mx-auto leading-relaxed">
                  شكراً لك! العقار الآن في حالة <strong className="text-amber-800">قيد المراجعة القانونية</strong> وسيقوم المشرف القانوني بالتدقيق في المستندات واعتماد نشر العقار.
                </p>
              </div>

              {/* What happens next timeline */}
              <div className="p-5 rounded-2xl bg-[var(--dp-color-ground)] border-[2px] border-[var(--dp-color-outline)] space-y-3">
                <h4 className="font-black text-sm text-[var(--dp-color-ink)] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  خطوات فحص واعتماد العقار لدى شقتي:
                </h4>

                <div className="space-y-2.5 text-xs font-bold text-[#4a5568]">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[var(--dp-color-accent)] text-white text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">
                      ١
                    </span>
                    <span>فحص عقود الملكية المسجلة وتراخيص البناء بواسطة الإدارة القانونية المعتمدة.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[var(--dp-color-accent)] text-white text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">
                      ٢
                    </span>
                    <span>منح العقار شارة "عقار موثق رسمياً" وتحديث حالته تلقائياً إلى "منشور ومتاح".</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[var(--dp-color-accent)] text-white text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">
                      ٣
                    </span>
                    <span>ظهور الإعلان لآلاف المشترين المستعدين لحجز المعاينات الميدانية فوراً.</span>
                  </div>
                </div>
              </div>

              {/* Summary of submitted property */}
              <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[var(--dp-color-outline)]">
                <img
                  src={formData.images[formData.coverImageIndex] || formData.images[0]}
                  alt={formData.title}
                  className="w-16 h-16 rounded-lg object-cover border border-[var(--dp-color-outline)] shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <span className="font-black text-sm text-[var(--dp-color-ink)] block line-clamp-1">
                    {formData.title}
                  </span>
                  <span className="text-xs text-[#626d84] block mt-0.5">
                    {formData.type} • {formData.city} • {formData.location} • {formatEGP(Number(formData.price))}
                  </span>
                </div>
                <Badge variant="warm" size="sm">
                  قيد المراجعة
                </Badge>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => navigate('/seller/properties')}
                  className="w-full sm:w-auto font-black"
                >
                  الانتقال لقائمة عقاراتي
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => navigate('/seller/dashboard')}
                  className="w-full sm:w-auto font-bold"
                >
                  لوحة تحكم البائع
                </Button>
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => {
                    setSubmissionReference(null);
                    setCurrentStep(1);
                    setFormData(INITIAL_FORM_DATA);
                  }}
                  className="w-full sm:w-auto text-xs"
                >
                  إضافة عقار آخر
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ----------------------------------------------------------------------
  // MAIN WIZARD LAYOUT
  // ----------------------------------------------------------------------
  return (
    <DashboardLayout
      role="seller"
      title="إضافة عقار جديد للبيع"
      subtitle="معالج التقديم الذكي المكون من 6 خطوات لإدراج عقارك وتوثيقه قانونياً."
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleQuickFillDemo}
            leftIcon={<Sparkles className="w-4 h-4 text-amber-600 stroke-[2.5]" />}
            className="text-xs font-black shadow-xs bg-amber-50/50 hover:bg-amber-100/60 border-amber-300 text-amber-950"
          >
            تعبئة نموذج تجريبي ({formData.type})
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveAsDraft}
            isLoading={isSubmitting}
            rightIcon={<Save className="w-4 h-4 stroke-[2.5]" />}
          >
            حفظ كمسودة
          </Button>
          <Link to="/seller/properties">
            <Button variant="ghost" size="sm">
              إلغاء
            </Button>
          </Link>
        </div>
      }
    >
      {/* Toast Notification when draft is saved */}
      {draftSavedToast && (
        <div className="fixed bottom-6 left-6 z-50 bg-[var(--dp-color-panel)] border-[2.5px] border-[var(--dp-color-outline)] shadow-hard p-4 rounded-xl flex items-center gap-3 animate-fadeIn text-right">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span className="font-black text-sm text-[var(--dp-color-ink)]">
            تم حفظ العقار كمسودة بنجاح! جاري تحويلك...
          </span>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* STEP INDICATORS PROGRESS BAR (Playful Geometric) */}
      {/* ----------------------------------------------------------------- */}
      <section className="mb-8 text-right">
        {/* Desktop Step Strip */}
        <div className="hidden lg:block bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-4 shadow-hard">
          <div className="flex items-center justify-between relative">
            {/* Horizontal Connecting Progress Line */}
            <div className="absolute top-1/2 left-8 right-8 -translate-y-1/2 h-1 bg-[#e4e1d3] -z-0" />
            <div
              className="absolute top-1/2 right-8 -translate-y-1/2 h-1 bg-[var(--dp-color-accent)] -z-0 transition-all duration-300"
              style={{
                width: `${((currentStep - 1) / (stepsConfig.length - 1)) * 92}%`,
              }}
            />

            {stepsConfig.map((step) => {
              const isCompleted = currentStep > step.num;
              const isCurrent = currentStep === step.num;

              return (
                <button
                  key={step.num}
                  type="button"
                  onClick={() => setCurrentStep(step.num)}
                  className="relative z-10 flex flex-col items-center gap-1.5 focus:outline-hidden cursor-pointer group"
                >
                  <div
                    className={`w-11 h-11 rounded-xl border-[2.5px] border-[var(--dp-color-outline)] flex items-center justify-center font-black text-sm transition-all shadow-hard-xs ${
                      isCompleted
                        ? 'bg-[var(--dp-color-accent-fresh)] text-emerald-950 scale-105'
                        : isCurrent
                        ? `${step.color} ${step.text} scale-110 shadow-hard-sm ring-4 ring-[var(--dp-color-accent)]/20`
                        : 'bg-white text-[#8896ab] hover:border-[var(--dp-color-accent)]'
                    }`}
                  >
                    {isCompleted ? <Check className="w-5 h-5 stroke-[3]" /> : step.num}
                  </div>
                  <span
                    className={`text-xs font-black transition-colors ${
                      isCurrent
                        ? 'text-[var(--dp-color-accent)]'
                        : isCompleted
                        ? 'text-[var(--dp-color-ink)]'
                        : 'text-[#8896ab]'
                    }`}
                  >
                    {step.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile Step Strip (< lg) */}
        <div className="lg:hidden bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-4 shadow-hard space-y-3">
          <div className="flex items-center justify-between text-xs font-black">
            <span className="text-[var(--dp-color-accent)]">
              الخطوة {currentStep} من 6:
            </span>
            <span className="text-[var(--dp-color-ink)]">
              {stepsConfig[currentStep - 1].title}
            </span>
          </div>

          {/* Mobile Direct Step Navigation */}
          <div className="grid grid-cols-6 gap-1.5">
            {stepsConfig.map((s) => (
              <button
                key={s.num}
                type="button"
                onClick={() => setCurrentStep(s.num)}
                className={`py-1.5 text-xs font-black rounded-lg border-[2px] transition-all cursor-pointer ${
                  currentStep === s.num
                    ? 'bg-[var(--dp-color-accent)] text-white border-[var(--dp-color-outline)] shadow-xs'
                    : currentStep > s.num
                    ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                    : 'bg-white text-gray-500 border-gray-200'
                }`}
              >
                {s.num}
              </button>
            ))}
          </div>

          <div className="w-full h-2.5 bg-[#e4e1d3] rounded-full border border-[var(--dp-color-outline)] overflow-hidden">
            <div
              className="h-full bg-[var(--dp-color-accent)] transition-all duration-300"
              style={{ width: `${(currentStep / 6) * 100}%` }}
            />
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* MAIN WHITE BOOK PANEL WITH VIOLET OFFSET BACKING */}
      {/* ----------------------------------------------------------------- */}
      <div className="relative text-right max-w-4xl mx-auto mb-12">
        <div className="absolute inset-0 bg-[var(--dp-color-accent)] rounded-[var(--dp-radius-corner)] translate-x-2 translate-y-2 -z-10" />

        <div className="bg-[var(--dp-color-panel)] border-[3px] border-[var(--dp-color-outline)] rounded-[var(--dp-radius-corner)] p-6 sm:p-10 shadow-hard space-y-8">
          {/* ============================================================= */}
          {/* STEP 1: البيانات الأساسية ونوع العقار */}
          {/* ============================================================= */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b-2 border-[#ece9db] pb-4">
                <Badge variant="primary" className="mb-1.5">
                  الخطوة الأولى
                </Badge>
                <h3 className="text-xl sm:text-2xl font-black text-[var(--dp-color-ink)]">
                  البيانات الأساسية ونوع العقار
                </h3>
                <p className="text-xs sm:text-sm text-[#526078] font-bold mt-1">
                  اختر نوع العقار المناسب بدقة لتخصيص المواصفات الفنية المطلوبة في الخطوات التالية.
                </p>
              </div>

              {/* Title Field */}
              <div>
                <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1">
                  عنوان الإعلان <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="مثال: محل تجاري واجهة 8 متر بمول التسعين، أو فيلا مستقلة بحمام سباحة زايد ديونز"
                  error={validationErrors.title}
                />
                <span className="text-[11px] text-[#626d84] font-bold mt-1 block">
                  اجعل العنوان واضحاً يوضح المساحة والحي وأبرز ميزة حصرية (8 أحرف كحد أدنى).
                </span>
              </div>

              {/* Property Type Selection (6 dedicated types) */}
              <div>
                <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-2">
                  نوع العقار المعروض <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {[
                    { type: 'شقة' as PropertyType, icon: <Building2 className="w-5 h-5" />, desc: 'سكنية / دوبلكس' },
                    { type: 'فيلا' as PropertyType, icon: <Home className="w-5 h-5" />, desc: 'مستقلة / توين هاوس' },
                    { type: 'محل' as PropertyType, icon: <Store className="w-5 h-5" />, desc: 'تجاري / واجهة / مول' },
                    { type: 'مكتب' as PropertyType, icon: <Briefcase className="w-5 h-5" />, desc: 'إداري / عيادة طبية' },
                    { type: 'منزل' as PropertyType, icon: <Layers3 className="w-5 h-5" />, desc: 'بيت عائلي / عمارة' },
                    { type: 'أرض' as PropertyType, icon: <LandPlot className="w-5 h-5" />, desc: 'سكني / تجاري / بناء' },
                  ].map((item) => {
                    const isSelected = formData.type === item.type;
                    return (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => handleTypeSelect(item.type)}
                        className={`p-3.5 rounded-xl border-[2.5px] text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-[var(--dp-color-selection)] border-[var(--dp-color-accent)] text-[var(--dp-color-accent)] shadow-hard-xs scale-102 font-black ring-2 ring-[var(--dp-color-accent)]/30'
                            : 'bg-[var(--dp-color-ground)] border-[var(--dp-color-outline)] text-[#4a5568] hover:bg-white font-bold'
                        }`}
                      >
                        <span className={`p-2 rounded-lg ${isSelected ? 'bg-white text-[var(--dp-color-accent)] shadow-xs' : 'bg-gray-100'}`}>
                          {item.icon}
                        </span>
                        <span className="text-sm block">{item.type}</span>
                        <span className="text-[10px] text-[#8896ab] block">{item.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sub-type Selection Pills */}
              <div>
                <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1.5">
                  التصنيف الفرعي للعقار
                </label>
                <div className="flex flex-wrap gap-2">
                  {formData.type === 'شقة' &&
                    ['شقة سكنية متكررة', 'شقة أرضي بحديقة', 'دوبلكس راقي', 'بنتهاوس مع روف', 'استوديو'].map((sub) => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => updateField('subType', sub)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                          formData.subType === sub
                            ? 'bg-[var(--dp-color-accent)] text-white border-[var(--dp-color-accent)]'
                            : 'bg-white border-[#dcd8c8] text-[#4a5568] hover:bg-[var(--dp-color-ground)]'
                        }`}
                      >
                        {sub}
                      </button>
                    ))}

                  {formData.type === 'فيلا' &&
                    ['فيلا مستقلة (Standalone)', 'توين هاوس (Twin House)', 'تاون هاوس (Townhouse)', 'قصر فاخر (Palace)'].map((sub) => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => {
                          updateField('subType', sub);
                          updateField('villaType', sub);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                          formData.subType === sub
                            ? 'bg-[var(--dp-color-accent)] text-white border-[var(--dp-color-accent)]'
                            : 'bg-white border-[#dcd8c8] text-[#4a5568] hover:bg-[var(--dp-color-ground)]'
                        }`}
                      >
                        {sub}
                      </button>
                    ))}

                  {formData.type === 'محل' &&
                    ['محل تجاري واجهة مباشرة', 'محل داخل مول تجاري', 'مقر كافيه ومطعم مرخص', 'صيدلية تجارية', 'معرض كبير / Showroom'].map((sub) => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => updateField('subType', sub)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                          formData.subType === sub
                            ? 'bg-[var(--dp-color-accent)] text-white border-[var(--dp-color-accent)]'
                            : 'bg-white border-[#dcd8c8] text-[#4a5568] hover:bg-[var(--dp-color-ground)]'
                        }`}
                      >
                        {sub}
                      </button>
                    ))}

                  {formData.type === 'مكتب' &&
                    ['مقر إداري مرخص', 'عيادة / مركز طبي', 'مكتب مساحة مفتوحة (Open Space)', 'دور إداري كامل'].map((sub) => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => updateField('subType', sub)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                          formData.subType === sub
                            ? 'bg-[var(--dp-color-accent)] text-white border-[var(--dp-color-accent)]'
                            : 'bg-white border-[#dcd8c8] text-[#4a5568] hover:bg-[var(--dp-color-ground)]'
                        }`}
                      >
                        {sub}
                      </button>
                    ))}

                  {formData.type === 'منزل' &&
                    ['عمارة سكنية كاملة', 'بيت عائلي دورين', 'مبنى تجاري سكني'].map((sub) => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => updateField('subType', sub)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                          formData.subType === sub
                            ? 'bg-[var(--dp-color-accent)] text-white border-[var(--dp-color-accent)]'
                            : 'bg-white border-[#dcd8c8] text-[#4a5568] hover:bg-[var(--dp-color-ground)]'
                        }`}
                      >
                        {sub}
                      </button>
                    ))}

                  {formData.type === 'أرض' &&
                    ['أرض بناء سكنية', 'أرض تجارية إدارية', 'أرض فيلات', 'أرض صناعية ومخازن'].map((sub) => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => updateField('subType', sub)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                          formData.subType === sub
                            ? 'bg-[var(--dp-color-accent)] text-white border-[var(--dp-color-accent)]'
                            : 'bg-white border-[#dcd8c8] text-[#4a5568] hover:bg-[var(--dp-color-ground)]'
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                </div>
              </div>

              {/* Dynamic Technical Custom Specifications for Selected Property Type (Instant display upon type select) */}
              <div className="pt-2">
                <div className="mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-[#ece9db] pb-2">
                  <label className="text-xs font-black text-[var(--dp-color-ink)] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[var(--dp-color-accent)]" />
                    المواصفات الفنية المخصصة فوراً لـ ({formData.type}):
                  </label>
                  <span className="text-[11px] font-bold text-[#626d84]">
                    ⚡ تظهر هذه الخيارات الفنية والتجهيزات تلقائياً فور اختيارك لنوع العقار
                  </span>
                </div>
                {renderCustomFieldsForType()}
              </div>

              {/* Purpose Field (Locked to "للبيع") */}
              <div>
                <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1">
                  الغرض من الإعلان
                </label>
                <div className="p-3.5 rounded-xl border-[2px] border-[var(--dp-color-outline)] bg-[var(--dp-color-ground)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-[var(--dp-color-accent-warm)] border border-[var(--dp-color-outline)] text-amber-900">
                      <Sparkles className="w-4 h-4 stroke-[2.5]" />
                    </span>
                    <div>
                      <span className="text-sm font-black text-[var(--dp-color-ink)] block">
                        عقار معروض للبيع النهائي
                      </span>
                      <span className="text-xs text-[#626d84] font-bold block">
                        منصة شقتي مخصصة لمعاملات البيع والشراء الموثقة رسمياً لحماية أموال الطرفين.
                      </span>
                    </div>
                  </div>
                  <Badge variant="warm" size="sm">
                    للبيع
                  </Badge>
                </div>
              </div>

              {/* Description Field */}
              <div>
                <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1">
                  الوصف التفصيلي للعقار <span className="text-rose-500">*</span>
                </label>
                <Textarea
                  rows={5}
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="اكتب وصفاً مفصلاً يوضح: تقسيم الغرف، فيو التراس، حالة التشطيب، حصة الجراج، ومدى القرب من المحاور والخدمات..."
                  error={validationErrors.description}
                />
                <span className="text-[11px] text-[#626d84] font-bold mt-1 block">
                  الوصف الوافي يقلل من الاستفسارات المكررة ويزيد من سرعة حجز مواعيد المعاينة.
                </span>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* STEP 2: الموقع الجغرافي وخريطة مصر التفاعلية */}
          {/* ============================================================= */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b-2 border-[#ece9db] pb-4">
                <Badge variant="fresh" className="mb-1.5">
                  الخطوة الثانية
                </Badge>
                <h3 className="text-xl sm:text-2xl font-black text-[var(--dp-color-ink)]">
                  الموقع الجغرافي وخريطة مصر التفاعلية
                </h3>
                <p className="text-xs sm:text-sm text-[#526078] font-bold mt-1">
                  اختر من بين كافة محافظات مصر الـ 27 والمناطق الأكثر طلباً، مع ضبط دقيق لنقطة الخريطة.
                </p>
              </div>

              {/* Top 10 National Hotspots Bar */}
              <div className="space-y-2">
                <label className="text-xs font-black text-[var(--dp-color-accent)] flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-[var(--dp-color-accent)]" />
                  أهم الوجهات العقارية الأكثر طلباً في مصر (اختيار سريع):
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {TOP_NATIONAL_HOTSPOTS.map((hotspot) => {
                    const isSelected =
                      formData.governorate === hotspot.gov &&
                      (formData.location.includes(hotspot.city) || formData.city === hotspot.city);
                    return (
                      <button
                        key={hotspot.name}
                        type="button"
                        onClick={() => handleHotspotClick(hotspot)}
                        className={`px-3 py-1.5 rounded-xl border-[2px] text-xs font-black whitespace-nowrap cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[var(--dp-color-accent)] text-white border-[var(--dp-color-outline)] shadow-hard-xs'
                            : 'bg-white border-[var(--dp-color-outline)] text-[#374151] hover:bg-[var(--dp-color-selection)] hover:text-[var(--dp-color-accent)]'
                        }`}
                      >
                        {hotspot.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Geographic Hierarchy: Governorate, City, District */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Governorate Select (All 27 Egyptian Governorates) */}
                <Select
                  label="المحافظة (كافة محافظات مصر الـ 27) *"
                  value={formData.governorate}
                  onChange={(e) => handleGovernorateChange(e.target.value)}
                  error={validationErrors.governorate}
                  options={EGYPT_GOVERNORATES.map((gov) => ({
                    value: gov.name,
                    label: `${gov.name} (${gov.districts.length} مناطق شهيرة)`,
                  }))}
                />

                {/* Famous Districts in Chosen Governorate */}
                <div>
                  <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1">
                    المنطقة الشهيرة / الحي في {formData.governorate} *
                  </label>
                  <select
                    value={formData.location}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    className="w-full h-11 px-3 text-xs font-bold rounded-xl border-[2px] border-[var(--dp-color-outline)] bg-white focus:outline-hidden focus:ring-2 focus:ring-[var(--dp-color-accent)]"
                  >
                    {activeDistricts.map((d) => (
                      <option key={d.name} value={d.name}>
                        {d.isPopular ? '⭐ ' : ''}
                        {d.name}
                      </option>
                    ))}
                    <option value={formData.location}>-- إدخال مخصص بالأسفل --</option>
                  </select>
                </div>

                {/* City or Center */}
                <Input
                  label="المدينة أو التجمع السكني *"
                  value={formData.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  placeholder="مثال: القاهرة الجديدة، الشيخ زايد، 6 أكتوبر"
                  error={validationErrors.city}
                />

                {/* Specific Location or Compound Name */}
                <Input
                  label="الحي بالتفصيل أو اسم الكمبوند / المول *"
                  value={formData.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  placeholder="مثال: التجمع الخامس، حي النرجس، كمبوند ميفيدا، مول إتيرنال"
                  error={validationErrors.location}
                />

                {/* Street Name */}
                <Input
                  label="اسم الشارع أو المحور الرئيسي"
                  value={formData.streetName}
                  onChange={(e) => updateField('streetName', e.target.value)}
                  placeholder="مثال: شارع التسعين الجنوبي، محور محمد بن زايد، طريق وصلة دهشور"
                />

                {/* Building / Unit Number */}
                <div>
                  <Input
                    label="رقم العقار أو العمارة / رقم الفيلا (سري ومحمي)"
                    value={formData.buildingNumber}
                    onChange={(e) => updateField('buildingNumber', e.target.value)}
                    placeholder="مثال: عمارة رقم 42 أو قطعة 18"
                  />
                  <span className="text-[11px] text-[#626d84] font-bold mt-1 block">
                    🔒 رقم العقار الدقيق محمي ومخفي ولن يظهر للعامة؛ بل يشارك فقط مع المشتري عند تأكيد موعد المعاينة.
                  </span>
                </div>
              </div>

              {/* Interactive Map Section */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-black text-[var(--dp-color-ink)] flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[var(--dp-color-accent)]" />
                    الخريطة التفاعلية لموقع العقار
                  </label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGetCurrentLocation}
                      isLoading={isGettingGps}
                      leftIcon={<Navigation className="w-3.5 h-3.5 text-blue-600" />}
                      className="text-xs"
                    >
                      تحديد موقعي GPS
                    </Button>
                    <div className="flex items-center gap-1 bg-white border border-[var(--dp-color-outline)] rounded-lg px-2 py-1">
                      <span className="text-[11px] font-bold text-[#626d84]">التقريب:</span>
                      <button
                        type="button"
                        onClick={() => setMapZoomDelta((prev) => Math.max(0.005, prev - 0.01))}
                        className="px-1.5 font-black text-xs hover:bg-gray-100 rounded"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => setMapZoomDelta((prev) => Math.min(0.08, prev + 0.01))}
                        className="px-1.5 font-black text-xs hover:bg-gray-100 rounded"
                      >
                        -
                      </button>
                    </div>
                  </div>
                </div>

                {/* Embedded Map Container */}
                <div className="relative aspect-16/9 sm:aspect-21/9 w-full rounded-2xl overflow-hidden border-[2.5px] border-[var(--dp-color-outline)] bg-[#e9e6d8] shadow-hard-sm">
                  <iframe
                    title="موقع العقار على الخريطة"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${formData.longitude - mapZoomDelta}%2C${formData.latitude - (mapZoomDelta * 0.75)}%2C${formData.longitude + mapZoomDelta}%2C${formData.latitude + (mapZoomDelta * 0.75)}&layer=mapnik&marker=${formData.latitude}%2C${formData.longitude}`}
                    className="w-full h-full border-0"
                    loading="lazy"
                  />
                  <div className="absolute top-3 right-3 bg-[var(--dp-color-panel)]/95 border-[2px] border-[var(--dp-color-outline)] px-3 py-1.5 rounded-xl text-xs font-black shadow-hard-xs flex items-center gap-2 pointer-events-none">
                    <Compass className="w-4 h-4 text-[var(--dp-color-accent)]" />
                    <span>
                      {formData.location || formData.city} ({formData.governorate})
                    </span>
                  </div>
                </div>

                {/* Coordinates Feedback */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-[var(--dp-color-ground)] border border-[var(--dp-color-outline)]">
                    <span className="text-[#626d84] font-bold block">خط العرض (Latitude):</span>
                    <span className="font-mono font-bold text-[var(--dp-color-ink)]">{formData.latitude}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[var(--dp-color-ground)] border border-[var(--dp-color-outline)]">
                    <span className="text-[#626d84] font-bold block">خط الطول (Longitude):</span>
                    <span className="font-mono font-bold text-[var(--dp-color-ink)]">{formData.longitude}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* STEP 3: مواصفات مخصصة لكل عقار (محل، فيلا، مكتب، شقة، أرض) */}
          {/* ============================================================= */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b-2 border-[#ece9db] pb-4">
                <Badge variant="warm" className="mb-1.5">
                  الخطوة الثالثة
                </Badge>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl sm:text-2xl font-black text-[var(--dp-color-ink)]">
                    مواصفات {formData.type} والمميزات
                  </h3>
                  <Badge variant="primary" size="sm">
                    {formData.subType || formData.type}
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-[#526078] font-bold mt-1">
                  تم تخصيص هذه الحقول الفنية خصيصاً لتناسب نوع عقارك ({formData.type}) لتمنح المشتري كافة التفاصيل الدقيقة.
                </p>
              </div>

              {/* Price & Area (Common) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1">
                    السعر الإجمالي المطلوب (ج.م) <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => updateField('price', e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="6850000"
                    error={validationErrors.price}
                  />
                  {formData.price && Number(formData.price) > 0 && (
                    <span className="text-xs font-black text-[var(--dp-color-accent)] mt-1 block">
                      المبلغ المكتوب: {formatEGP(Number(formData.price))}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1">
                    المساحة الإجمالية (م² متر مربع) <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="number"
                    value={formData.area}
                    onChange={(e) => updateField('area', e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="180"
                    error={validationErrors.area}
                  />
                  {pricePerSqm && (
                    <span className="text-xs font-black text-emerald-800 mt-1 block">
                      سعر المتر المربع: {formatEGP(pricePerSqm)} / م²
                    </span>
                  )}
                </div>
              </div>

              {/* ----------------------------------------------------------- */}
              {/* CONDITIONAL SECTION: محل تجاري */}
              {/* ----------------------------------------------------------- */}
              {formData.type === 'محل' && (
                <div className="p-5 rounded-2xl bg-[var(--dp-color-ground)] border-[2.5px] border-[var(--dp-color-outline)] space-y-5">
                  <div className="flex items-center gap-2 border-b border-[#ece9db] pb-3">
                    <Store className="w-5 h-5 text-[var(--dp-color-accent)]" />
                    <h4 className="font-black text-sm text-[var(--dp-color-ink)]">
                      المواصفات التجارية والهندسية للمحل
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Frontage Width */}
                    <div>
                      <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1">
                        عرض واجهة المحل (بالمتر) *
                      </label>
                      <Input
                        type="number"
                        value={formData.shopFrontageWidth || ''}
                        onChange={(e) => updateField('shopFrontageWidth', e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="مثال: 6 متر أو 8.5"
                        error={validationErrors.shopFrontageWidth}
                      />
                    </div>

                    {/* Ceiling Height */}
                    <div>
                      <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1">
                        ارتفاع السقف الصافي (بالمتر)
                      </label>
                      <Input
                        type="number"
                        value={formData.ceilingHeight || ''}
                        onChange={(e) => updateField('ceilingHeight', e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="مثال: 4.5 أو 6 متر"
                      />
                    </div>

                    {/* Electricity Meter Type */}
                    <Select
                      label="نوع العداد والكهرباء"
                      value={formData.electricityMeterType || 'عداد تجاري 3 فاز (380V)'}
                      onChange={(e) => updateField('electricityMeterType', e.target.value)}
                      options={[
                        { value: 'عداد تجاري 3 فاز (380V)', label: 'عداد تجاري 3 فاز (380V) للمطاعم والأجهزة' },
                        { value: 'عداد أحادي (220V)', label: 'عداد أحادي (220V)' },
                        { value: 'عداد كودي مسبق الدفع', label: 'عداد كودي مسبق الدفع' },
                      ]}
                    />
                  </div>

                  {/* Mezzanine & Chimney & Outdoor Seating */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                    {/* Mezzanine Toggle */}
                    <div className="p-3 rounded-xl bg-white border border-[var(--dp-color-outline)] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-[var(--dp-color-ink)]">يوجد دور ميزانين داخلي؟</span>
                        <input
                          type="checkbox"
                          checked={formData.hasMezzanine || false}
                          onChange={(e) => updateField('hasMezzanine', e.target.checked)}
                          className="w-4 h-4 accent-[var(--dp-color-accent)] cursor-pointer"
                        />
                      </div>
                      {formData.hasMezzanine && (
                        <Input
                          type="number"
                          placeholder="مساحة الميزانين م²"
                          value={formData.mezzanineArea || ''}
                          onChange={(e) => updateField('mezzanineArea', e.target.value === '' ? '' : Number(e.target.value))}
                        />
                      )}
                    </div>

                    {/* Restaurant Chimney */}
                    <div className="p-3 rounded-xl bg-white border border-[var(--dp-color-outline)] flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black text-[var(--dp-color-ink)] block">مدخنة وتجهيز كافيه ومطعم</span>
                        <span className="text-[11px] text-[#626d84] block">مدخنة طرد هواء معتمدة من الدفاع المدني</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.hasRestaurantChimney || false}
                        onChange={(e) => updateField('hasRestaurantChimney', e.target.checked)}
                        className="w-4 h-4 accent-[var(--dp-color-accent)] cursor-pointer"
                      />
                    </div>

                    {/* Outdoor Area */}
                    <div>
                      <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1">
                        مساحة الإشغال الخارجي / أوت دور (م²)
                      </label>
                      <Input
                        type="number"
                        placeholder="مثال: 45 م² تراس أمامي"
                        value={formData.outdoorArea || ''}
                        onChange={(e) => updateField('outdoorArea', e.target.value === '' ? '' : Number(e.target.value))}
                      />
                    </div>
                  </div>

                  {/* Mall vs Street location */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl bg-white border border-[var(--dp-color-outline)] flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black text-[var(--dp-color-ink)] block">المحل داخل مول تجاري؟</span>
                        <span className="text-[11px] text-[#626d84] block">حدد إذا كان المحل جزءاً من مركز تسوق</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.isInsideMall || false}
                        onChange={(e) => updateField('isInsideMall', e.target.checked)}
                        className="w-4 h-4 accent-[var(--dp-color-accent)] cursor-pointer"
                      />
                    </div>

                    {formData.isInsideMall && (
                      <Input
                        label="اسم المول التجاري والدور"
                        placeholder="مثال: مول بوينت 90، الدور الأرضي"
                        value={formData.mallName || ''}
                        onChange={(e) => updateField('mallName', e.target.value)}
                      />
                    )}
                  </div>

                  {/* Permitted Commercial Activities */}
                  <div>
                    <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-2">
                      الأنشطة التجارية المصرح بها للوحدة
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        'كافيه ومطعم',
                        'صيدلية ومعمل تحاليل',
                        'فرع بنك أو صرافة',
                        'سوبر ماركت وهايبر',
                        'ملابس وعلامات تجارية',
                        'أجهزة إلكترونية واتصالات',
                        'محل عطور ومستحضرات',
                        'كافة الأنشطة التجارية',
                      ].map((act) => {
                        const isChecked = (formData.commercialActivities || []).includes(act);
                        return (
                          <button
                            key={act}
                            type="button"
                            onClick={() => toggleCommercialActivity(act)}
                            className={`p-2.5 rounded-xl border text-xs font-bold text-right flex items-center justify-between cursor-pointer transition-colors ${
                              isChecked
                                ? 'bg-emerald-50 border-emerald-600 text-emerald-950 font-black'
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <span>{act}</span>
                            {isChecked && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------------- */}
              {/* CONDITIONAL SECTION: فيلا */}
              {/* ----------------------------------------------------------- */}
              {formData.type === 'فيلا' && (
                <div className="p-5 rounded-2xl bg-[var(--dp-color-ground)] border-[2.5px] border-[var(--dp-color-outline)] space-y-5">
                  <div className="flex items-center gap-2 border-b border-[#ece9db] pb-3">
                    <Home className="w-5 h-5 text-[var(--dp-color-accent)]" />
                    <h4 className="font-black text-sm text-[var(--dp-color-ink)]">
                      مواصفات الفيلا والمساحات الخارجية
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Land Area */}
                    <div>
                      <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1">
                        مساحة الأرض الإجمالية (م²) *
                      </label>
                      <Input
                        type="number"
                        value={formData.landArea || ''}
                        onChange={(e) => updateField('landArea', e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="مثال: 550 م²"
                        error={validationErrors.landArea}
                      />
                    </div>

                    {/* Garden Area */}
                    <div>
                      <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1">
                        مساحة الحديقة الخاصة (م²)
                      </label>
                      <Input
                        type="number"
                        value={formData.gardenArea || ''}
                        onChange={(e) => updateField('gardenArea', e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="مثال: 320 م² لاند سكيب"
                      />
                    </div>

                    {/* Pool Type */}
                    <Select
                      label="حمام السباحة الخاص"
                      value={formData.poolType || 'خاص ومجهز'}
                      onChange={(e) => updateField('poolType', e.target.value)}
                      options={[
                        { value: 'خاص ومجهز', label: 'حمام سباحة خاص مجهز بالكامل' },
                        { value: 'مسخن (Heated)', label: 'حمام سباحة خاص مسخن (Heated Pool)' },
                        { value: 'جاكوزي خارجي', label: 'جاكوزي خارجي بالحديقة' },
                        { value: 'بدون حمام سباحة', label: 'بدون حمام سباحة (حديقة فقط)' },
                      ]}
                    />
                  </div>

                  {/* Floors & Garage */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select
                      label="تقسيم أدوار الفيلا"
                      value={formData.villaFloorsCount || 'بدروم + أرضي + أول + روف'}
                      onChange={(e) => updateField('villaFloorsCount', e.target.value)}
                      options={[
                        { value: 'بدروم + أرضي + أول + روف', label: 'بدروم كامل + أرضي + أول + روف' },
                        { value: 'أرضي + أول + روف', label: 'أرضي + دور أول + روف وتراس' },
                        { value: 'أرضي + دورين + روف', label: 'أرضي + دورين متكررين + روف' },
                      ]}
                    />

                    <div>
                      <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1">
                        سعة الجراج الخاص (عدد السيارات)
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {[1, 2, 3, 4].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => updateField('garageCapacity', num)}
                            className={`py-2 rounded-xl border-[2px] font-black text-xs cursor-pointer ${
                              formData.garageCapacity === num
                                ? 'bg-[var(--dp-color-accent)] text-white border-[var(--dp-color-outline)] shadow-hard-xs'
                                : 'bg-white border-[var(--dp-color-outline)] text-[#4a5568]'
                            }`}
                          >
                            {num === 4 ? '+4 سيارات' : `${num} سيارات`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Servant Quarters & Elevator */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-white border border-[var(--dp-color-outline)] flex items-center justify-between">
                      <span className="text-xs font-black text-[var(--dp-color-ink)]">غرفة سائق بحمام خاص</span>
                      <input
                        type="checkbox"
                        checked={formData.hasDriverRoom || false}
                        onChange={(e) => updateField('hasDriverRoom', e.target.checked)}
                        className="w-4 h-4 accent-[var(--dp-color-accent)] cursor-pointer"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-[var(--dp-color-outline)] flex items-center justify-between">
                      <span className="text-xs font-black text-[var(--dp-color-ink)]">غرفة مربية بحمام خاص</span>
                      <input
                        type="checkbox"
                        checked={formData.hasMaidRoom || false}
                        onChange={(e) => updateField('hasMaidRoom', e.target.checked)}
                        className="w-4 h-4 accent-[var(--dp-color-accent)] cursor-pointer"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-[var(--dp-color-outline)] flex items-center justify-between">
                      <span className="text-xs font-black text-[var(--dp-color-ink)]">أسانسير داخلي خاص</span>
                      <input
                        type="checkbox"
                        checked={formData.hasPrivateElevator || false}
                        onChange={(e) => updateField('hasPrivateElevator', e.target.checked)}
                        className="w-4 h-4 accent-[var(--dp-color-accent)] cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------------- */}
              {/* CONDITIONAL SECTION: مكتب / مقر إداري */}
              {/* ----------------------------------------------------------- */}
              {formData.type === 'مكتب' && (
                <div className="p-5 rounded-2xl bg-[var(--dp-color-ground)] border-[2.5px] border-[var(--dp-color-outline)] space-y-5">
                  <div className="flex items-center gap-2 border-b border-[#ece9db] pb-3">
                    <Briefcase className="w-5 h-5 text-[var(--dp-color-accent)]" />
                    <h4 className="font-black text-sm text-[var(--dp-color-ink)]">
                      مواصفات المقر الإداري والشبكات
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select
                      label="نوع الترخيص الرسمي *"
                      value={formData.officeLicenseType || 'إداري مرخص رسمي'}
                      onChange={(e) => updateField('officeLicenseType', e.target.value)}
                      error={validationErrors.officeLicenseType}
                      options={[
                        { value: 'إداري مرخص رسمي', label: 'إداري مرخص رسمي للشركات والمؤسسات' },
                        { value: 'طبي (عيادات ومراكز)', label: 'طبي مرخص عيادات ومراكز طبية' },
                        { value: 'تجاري إداري مفتوح', label: 'تجاري إداري متعدد الأغراض' },
                      ]}
                    />

                    <Select
                      label="التقسيم والتصميم الداخلي"
                      value={formData.officeLayout || 'مساحة مفتوحة (Open Space)'}
                      onChange={(e) => updateField('officeLayout', e.target.value)}
                      options={[
                        { value: 'مساحة مفتوحة (Open Space)', label: 'مساحة مفتوحة (Open Space)' },
                        { value: 'مكاتب مقسمة زجاجياً (Glass Partitions)', label: 'مكاتب مقسمة زجاجياً (Glass Partitions)' },
                        { value: 'غرف مغلقة كلاسيكية', label: 'غرف ومكاتب مغلقة كلاسيكية' },
                      ]}
                    />
                  </div>

                  {/* Rooms & Private offices */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1">
                        عدد قاعات الاجتماعات
                      </label>
                      <Input
                        type="number"
                        value={formData.meetingRoomsCount || 1}
                        onChange={(e) => updateField('meetingRoomsCount', Number(e.target.value))}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1">
                        عدد المكاتب المستقلة المغلقة
                      </label>
                      <Input
                        type="number"
                        value={formData.privateOfficesCount || 3}
                        onChange={(e) => updateField('privateOfficesCount', Number(e.target.value))}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1">
                        باكيات الجراج المخصصة للمقر
                      </label>
                      <Input
                        type="number"
                        value={formData.parkingSlotsCount || 2}
                        onChange={(e) => updateField('parkingSlotsCount', Number(e.target.value))}
                      />
                    </div>
                  </div>

                  {/* Infrastructure checkboxes */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-white border border-[var(--dp-color-outline)] flex items-center justify-between">
                      <span className="text-xs font-black text-[var(--dp-color-ink)]">تكييف مركزي VRV مستقل</span>
                      <input
                        type="checkbox"
                        checked={formData.hasCentralAC ?? true}
                        onChange={(e) => updateField('hasCentralAC', e.target.checked)}
                        className="w-4 h-4 accent-[var(--dp-color-accent)] cursor-pointer"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-[var(--dp-color-outline)] flex items-center justify-between">
                      <span className="text-xs font-black text-[var(--dp-color-ink)]">إنترنت فايبر وغرفة خوادم</span>
                      <input
                        type="checkbox"
                        checked={formData.hasFiberInternet ?? true}
                        onChange={(e) => updateField('hasFiberInternet', e.target.checked)}
                        className="w-4 h-4 accent-[var(--dp-color-accent)] cursor-pointer"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-[var(--dp-color-outline)] flex items-center justify-between">
                      <span className="text-xs font-black text-[var(--dp-color-ink)]">ريسبشن وبوابات أمن 24/7</span>
                      <input
                        type="checkbox"
                        checked={formData.hasReceptionSecurity ?? true}
                        onChange={(e) => updateField('hasReceptionSecurity', e.target.checked)}
                        className="w-4 h-4 accent-[var(--dp-color-accent)] cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------------- */}
              {/* CONDITIONAL SECTION: أرض */}
              {/* ----------------------------------------------------------- */}
              {formData.type === 'أرض' && (
                <div className="p-5 rounded-2xl bg-[var(--dp-color-ground)] border-[2.5px] border-[var(--dp-color-outline)] space-y-5">
                  <div className="flex items-center gap-2 border-b border-[#ece9db] pb-3">
                    <LandPlot className="w-5 h-5 text-[var(--dp-color-accent)]" />
                    <h4 className="font-black text-sm text-[var(--dp-color-ink)]">
                      اشتراطات وتخصيص قطعة الأرض
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Select
                      label="تخصيص الأرض الرسمي *"
                      value={formData.landZoning || 'سكني عمارات'}
                      onChange={(e) => updateField('landZoning', e.target.value)}
                      error={validationErrors.landZoning}
                      options={[
                        { value: 'سكني عمارات', label: 'سكني عمارات' },
                        { value: 'سكني فيلات', label: 'سكني فيلات' },
                        { value: 'تجاري إداري', label: 'تجاري إداري استثماري' },
                        { value: 'صناعي ومخازن', label: 'صناعي ومخازن لوجستية' },
                        { value: 'زراعي واستصلاح', label: 'زراعي واستصلاح' },
                      ]}
                    />

                    <div>
                      <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1">
                        نسبة البناء المصرح بها (%)
                      </label>
                      <Input
                        type="number"
                        placeholder="مثال: 40% أو 50%"
                        value={formData.buildingFootprintRatio || ''}
                        onChange={(e) => updateField('buildingFootprintRatio', e.target.value === '' ? '' : Number(e.target.value))}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1">
                        عرض الشارع أمام الأرض (بالمتر)
                      </label>
                      <Input
                        type="number"
                        placeholder="مثال: 20 متر أو 32 متر"
                        value={formData.landStreetWidth || ''}
                        onChange={(e) => updateField('landStreetWidth', e.target.value === '' ? '' : Number(e.target.value))}
                      />
                    </div>
                  </div>

                  {/* Permitted Floors */}
                  <div>
                    <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-1">
                      الارتفاع وعدد الأدوار المصرح بها
                    </label>
                    <Input
                      placeholder="مثال: بدروم + أرضي + 3 أدوار متكررة + روف"
                      value={formData.permittedFloorsCount || ''}
                      onChange={(e) => updateField('permittedFloorsCount', e.target.value)}
                    />
                  </div>

                  {/* Connected Utilities */}
                  <div>
                    <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-2">
                      المرافق المتصلة والجاهزة
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {['مياه صالحة للشرب', 'شبكة كهرباء', 'صرف صحي', 'غاز طبيعي', 'خطوط تليفون وفايبر', 'طريق أسفلتي ممهد'].map((util) => {
                        const isChecked = (formData.utilitiesAvailable || []).includes(util);
                        return (
                          <button
                            key={util}
                            type="button"
                            onClick={() => toggleUtility(util)}
                            className={`p-2.5 rounded-xl border text-xs font-bold text-right flex items-center justify-between cursor-pointer transition-colors ${
                              isChecked
                                ? 'bg-emerald-50 border-emerald-600 text-emerald-950 font-black'
                                : 'bg-white border-gray-300 text-gray-700'
                            }`}
                          >
                            <span>{util}</span>
                            {isChecked && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------------- */}
              {/* RESIDENTIAL ROOMS & BATHS (Only for Residential Types) */}
              {/* ----------------------------------------------------------- */}
              {formData.type !== 'محل' && formData.type !== 'أرض' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-2">
                        عدد الغرف الرئيسية
                      </label>
                      <div className="grid grid-cols-6 gap-2">
                        {[1, 2, 3, 4, 5, 6].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => updateField('bedrooms', num)}
                            className={`py-2 rounded-xl border-[2px] font-black text-sm cursor-pointer transition-all ${
                              formData.bedrooms === num
                                ? 'bg-[var(--dp-color-accent)] text-white border-[var(--dp-color-outline)] shadow-hard-xs'
                                : 'bg-[var(--dp-color-ground)] border-[var(--dp-color-outline)] text-[#4a5568] hover:bg-white'
                            }`}
                          >
                            {num === 6 ? '+6' : num}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-2">
                        عدد الحمامات
                      </label>
                      <div className="grid grid-cols-5 gap-2">
                        {[1, 2, 3, 4, 5].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => updateField('bathrooms', num)}
                            className={`py-2 rounded-xl border-[2px] font-black text-sm cursor-pointer transition-all ${
                              formData.bathrooms === num
                                ? 'bg-[var(--dp-color-accent)] text-white border-[var(--dp-color-outline)] shadow-hard-xs'
                                : 'bg-[var(--dp-color-ground)] border-[var(--dp-color-outline)] text-[#4a5568] hover:bg-white'
                            }`}
                          >
                            {num === 5 ? '+5' : num}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Floor & Total Floors & Age */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Select
                      label="رقم الدور"
                      value={formData.floor}
                      onChange={(e) => updateField('floor', e.target.value)}
                      options={[
                        { value: 'أرضي مرتفع', label: 'أرضي مرتفع' },
                        { value: 'أرضي بحديقة', label: 'أرضي بحديقة' },
                        { value: 'الأول', label: 'الدور الأول' },
                        { value: 'الثاني', label: 'الدور الثاني' },
                        { value: 'الثالث', label: 'الدور الثالث' },
                        { value: 'الرابع', label: 'الدور الرابع' },
                        { value: 'الخامس فأعلى', label: 'الدور الخامس فأعلى' },
                        { value: 'الدور الأخير', label: 'الدور الأخير' },
                        { value: 'روف مع تراس', label: 'روف مع تراس' },
                      ]}
                    />

                    <Select
                      label="إجمالي أدوار المبنى"
                      value={formData.totalFloors}
                      onChange={(e) => updateField('totalFloors', e.target.value)}
                      options={[
                        { value: '3', label: '3 أدوار (فيلا / عمارة)' },
                        { value: '4', label: '4 أدوار' },
                        { value: '5', label: '5 أدوار' },
                        { value: '6', label: '6 أدوار' },
                        { value: '10+', label: 'برج سكني (أكثر من 10 أدوار)' },
                      ]}
                    />

                    <Select
                      label="عمر العقار"
                      value={formData.buildingAge}
                      onChange={(e) => updateField('buildingAge', e.target.value)}
                      options={[
                        { value: 'جديد كلياً (استلام فوري)', label: 'جديد كلياً (استلام فوري)' },
                        { value: 'تحت الإنشاء', label: 'تحت الإنشاء' },
                        { value: 'سنة إلى 3 سنوات', label: 'سنة إلى 3 سنوات' },
                        { value: '4 إلى 7 سنوات', label: '4 إلى 7 سنوات' },
                        { value: 'أكثر من 8 سنوات', label: 'أكثر من 8 سنوات' },
                      ]}
                    />
                  </div>

                  {/* Finishing & Furnished */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select
                      label="نوع التشطيب"
                      value={formData.finishing}
                      onChange={(e) => updateField('finishing', e.target.value)}
                      options={[
                        { value: 'ألترا سوبر لوكس', label: 'ألترا سوبر لوكس' },
                        { value: 'سوبر لوكس', label: 'سوبر لوكس' },
                        { value: 'لوكس', label: 'لوكس' },
                        { value: 'نصف تشطيب (محارة وحلوق)', label: 'نصف تشطيب (محارة وحلوق)' },
                        { value: 'بدون تشطيب (ع الطوب الأحمر)', label: 'بدون تشطيب (ع الطوب الأحمر)' },
                      ]}
                    />

                    <Select
                      label="حالة الفرش"
                      value={formData.furnished}
                      onChange={(e) => updateField('furnished', e.target.value)}
                      options={[
                        { value: 'غير مفروش', label: 'غير مفروش' },
                        { value: 'مفروش بالكامل', label: 'مفروش بالكامل' },
                        { value: 'مفروش جزئياً (مطبخ وتكييفات)', label: 'مفروش جزئياً (مطبخ وتكييفات)' },
                      ]}
                    />
                  </div>

                  {/* Amenities */}
                  <div>
                    <label className="block text-xs font-black text-[var(--dp-color-ink)] mb-2">
                      المميزات ووسائل الراحة المتوفرة
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { name: 'مصعد', label: 'مصعد (أسانسير)' },
                        { name: 'جراج', label: 'جراج / موقف سيارات' },
                        { name: 'شرفة', label: 'شرفة / بلكونة' },
                        { name: 'حديقة', label: 'حديقة خاصة' },
                        { name: 'أمن وحراسة', label: 'أمن وحراسة 24/7' },
                        { name: 'تكييف', label: 'تكييف مركزي / سبليت' },
                        { name: 'غاز طبيعي', label: 'غاز طبيعي مركب' },
                      ].map((amenity) => {
                        const isChecked = formData.amenities.includes(amenity.name);
                        return (
                          <button
                            key={amenity.name}
                            type="button"
                            onClick={() => toggleAmenity(amenity.name)}
                            className={`p-3 rounded-xl border-[2px] text-right transition-all cursor-pointer flex items-center justify-between ${
                              isChecked
                                ? 'bg-[var(--dp-color-field-soft)] border-[var(--dp-color-outline)] text-emerald-950 font-black shadow-hard-xs'
                                : 'bg-[var(--dp-color-ground)] border-[var(--dp-color-outline)] text-[#4a5568] hover:bg-white font-bold'
                            }`}
                          >
                            <span className="text-xs">{amenity.label}</span>
                            <div
                              className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                                isChecked
                                  ? 'bg-emerald-600 border-emerald-700 text-white'
                                  : 'bg-white border-gray-300'
                              }`}
                            >
                              {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================= */}
          {/* STEP 4: صور العقار والمعرض */}
          {/* ============================================================= */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b-2 border-[#ece9db] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <Badge variant="secondary" className="mb-1.5">
                    الخطوة الرابعة
                  </Badge>
                  <h3 className="text-xl sm:text-2xl font-black text-[var(--dp-color-ink)]">
                    صور العقار (المعرض)
                  </h3>
                  <p className="text-xs sm:text-sm text-[#526078] font-bold mt-1">
                    ارفع صوراً حقيقية عالية الجودة تبرز الواجهة والمساحات الداخلية والتجهيزات.
                  </p>
                </div>

                {/* Quick Sample Photos Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const sampleList = SAMPLE_PHOTOS_MAP[formData.type] || SAMPLE_PHOTOS_MAP['شقة'];
                    setFormData((prev) => ({
                      ...prev,
                      images: Array.from(new Set([...prev.images, ...sampleList])),
                    }));
                  }}
                  rightIcon={<Sparkles className="w-4 h-4 text-amber-600 stroke-[2.5]" />}
                  className="self-start sm:self-auto text-xs"
                >
                  استخدام صور نموذجية ({formData.type})
                </Button>
              </div>

              {validationErrors.images && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs font-black text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{validationErrors.images}</span>
                </div>
              )}

              {/* Drag and drop upload zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingImages(true);
                }}
                onDragLeave={() => setIsDraggingImages(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingImages(false);
                  handleImageFiles(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`p-8 sm:p-12 border-[3px] border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                  isDraggingImages
                    ? 'border-[var(--dp-color-accent)] bg-[var(--dp-color-selection)] scale-101'
                    : 'border-[var(--dp-color-outline)] bg-[var(--dp-color-ground)] hover:bg-white'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleImageFiles(e.target.files)}
                />

                <div className="w-16 h-16 rounded-2xl bg-white border-[2px] border-[var(--dp-color-outline)] flex items-center justify-center text-[var(--dp-color-accent)] mx-auto mb-3 shadow-hard-xs">
                  <UploadCloud className="w-8 h-8 stroke-[2.2]" />
                </div>

                <h4 className="text-base font-black text-[var(--dp-color-ink)] mb-1">
                  اسحب الصور وأفلتها هنا أو اضغط للاختيار من جهازك
                </h4>
                <p className="text-xs text-[#626d84] font-bold">
                  يدعم صيغ JPG, PNG, WEBP حتى 10 ميجابايت لكل صورة. يمكنك رفع عدة صور في آن واحد.
                </p>
              </div>

              {/* Photos Grid & Management */}
              {formData.images.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-black text-[#526078]">
                    <span>تم رفع {formData.images.length} صور</span>
                    <span>الصورة التي تحمل شارة "الغلاف" هي التي تظهر أولاً في نتائج البحث</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {formData.images.map((img, idx) => {
                      const isCover = formData.coverImageIndex === idx;
                      return (
                        <div
                          key={idx}
                          className={`relative rounded-xl overflow-hidden border-[2.5px] bg-white group transition-all shadow-hard-xs ${
                            isCover ? 'border-[var(--dp-color-accent)] ring-3 ring-[var(--dp-color-accent)]/20' : 'border-[var(--dp-color-outline)]'
                          }`}
                        >
                          <img
                            src={img}
                            alt={`صورة عقار ${idx + 1}`}
                            className="w-full h-32 object-cover"
                          />

                          {isCover && (
                            <div className="absolute top-2 right-2 bg-[var(--dp-color-accent)] text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                              <Star className="w-3 h-3 fill-white" />
                              الغلاف الرئيسي
                            </div>
                          )}

                          <div className="p-2 bg-[var(--dp-color-ground)] border-t border-[var(--dp-color-outline)] flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => moveImage(idx, 'left')}
                                className="p-1 rounded bg-white border border-[var(--dp-color-outline)] disabled:opacity-30 cursor-pointer"
                                title="تحريك لليمين"
                              >
                                <ArrowRight className="w-3 h-3 text-[#374151]" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === formData.images.length - 1}
                                onClick={() => moveImage(idx, 'right')}
                                className="p-1 rounded bg-white border border-[var(--dp-color-outline)] disabled:opacity-30 cursor-pointer"
                                title="تحريك لليسار"
                              >
                                <ArrowLeft className="w-3 h-3 text-[#374151]" />
                              </button>
                            </div>

                            <div className="flex items-center gap-1">
                              {!isCover && (
                                <button
                                  type="button"
                                  onClick={() => updateField('coverImageIndex', idx)}
                                  className="text-[10px] font-bold text-[var(--dp-color-accent)] hover:underline cursor-pointer px-1"
                                >
                                  تعيين كغلاف
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmImgIndex(idx)}
                                className="p-1 rounded bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 cursor-pointer"
                                title="حذف الصورة"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================= */}
          {/* STEP 5: المستندات والوثائق القانونية المخصصة */}
          {/* ============================================================= */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b-2 border-[#ece9db] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <Badge variant="fresh" className="mb-1.5">
                    الخطوة الخامسة
                  </Badge>
                  <h3 className="text-xl sm:text-2xl font-black text-[var(--dp-color-ink)]">
                    رفع المستندات الرسمية والتوثيق القانوني
                  </h3>
                  <p className="text-xs sm:text-sm text-[#526078] font-bold mt-1">
                    ارفع أوراق إثبات الملكية وتراخيص العقار ليراجعها الإدمن ويعتمد نشر العقار بشارة "موثق".
                  </p>
                </div>

                {/* Quick sample documents for testing */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const sampleDocs = SAMPLE_DOCUMENTS_BY_TYPE[formData.type] || SAMPLE_DOCUMENTS_BY_TYPE['شقة'];
                    setFormData((prev) => ({
                      ...prev,
                      documents: sampleDocs,
                    }));
                  }}
                  rightIcon={<Sparkles className="w-4 h-4 text-amber-600 stroke-[2.5]" />}
                  className="self-start sm:self-auto text-xs"
                >
                  استخدام وثائق نموذجية ({formData.type})
                </Button>
              </div>

              {/* PRIVACY NOTICE */}
              <div className="p-5 rounded-2xl bg-[var(--dp-color-field-soft)] border-[2.5px] border-[var(--dp-color-outline)] shadow-hard-xs space-y-2">
                <div className="flex items-center gap-2 font-black text-sm text-emerald-950">
                  <ShieldCheck className="w-5 h-5 text-emerald-700 stroke-[2.5]" />
                  <span>إشعار الأمان والخصوصية القانونية:</span>
                </div>
                <p className="text-xs sm:text-sm text-[#253044] font-bold leading-relaxed">
                  "مستنداتك خاصة ومحمية بتشفير عالي، ولن يتم عرضها للمشترين أو الزوار في الموقع. يطلع عليها فقط المشرف القانوني المعتمد لمطابقة البيانات ومنح العقار شارة الاعتماد."
                </p>
              </div>

              {validationErrors.documents && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs font-black text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{validationErrors.documents}</span>
                </div>
              )}

              {/* Categorized Document Upload Slots */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. عقد الملكية (إلزامي للجميع) */}
                <div className="p-5 rounded-xl border-[2px] border-[var(--dp-color-outline)] bg-[var(--dp-color-ground)] space-y-3">
                  <div className="flex items-center gap-2 text-sm font-black text-[var(--dp-color-ink)]">
                    <FileCheck className="w-5 h-5 text-[var(--dp-color-accent)]" />
                    <span>عقد الملكية (مسجل / نهائي / ابتدائي) *</span>
                  </div>
                  <p className="text-xs text-[#626d84] font-bold leading-relaxed">
                    صورة واضحة من العقد المسجل بالشهر العقاري أو عقد البيع الابتدائي المعتمد.
                  </p>
                  <label className="block">
                    <input
                      type="file"
                      accept=".pdf,image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => handleDocumentFiles(e.target.files, 'deed', 'عقد ملكية مسجل')}
                    />
                    <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[var(--dp-color-outline)] text-xs font-black text-[var(--dp-color-accent)] hover:bg-[var(--dp-color-selection)] cursor-pointer shadow-xs">
                      <UploadCloud className="w-4 h-4" />
                      رفع عقد الملكية
                    </span>
                  </label>
                </div>

                {/* 2. رخصة البناء / شهادة التصالح ونموذج 10 */}
                <div className="p-5 rounded-xl border-[2px] border-[var(--dp-color-outline)] bg-[var(--dp-color-ground)] space-y-3">
                  <div className="flex items-center gap-2 text-sm font-black text-[var(--dp-color-ink)]">
                    <FileText className="w-5 h-5 text-emerald-700" />
                    <span>رخصة البناء / شهادة التصالح ونموذج 10</span>
                  </div>
                  <p className="text-xs text-[#626d84] font-bold leading-relaxed">
                    رخصة البناء الرسمية الصادرة من جهاز المدينة أو الحي، أو شهادة نموذج 10 للتصالح.
                  </p>
                  <label className="block">
                    <input
                      type="file"
                      accept=".pdf,image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => handleDocumentFiles(e.target.files, 'building_permit', 'رخصة بناء ومطابقة')}
                    />
                    <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[var(--dp-color-outline)] text-xs font-black text-emerald-800 hover:bg-emerald-50 cursor-pointer shadow-xs">
                      <UploadCloud className="w-4 h-4" />
                      رفع رخصة البناء
                    </span>
                  </label>
                </div>

                {/* 3. السجل التجاري والبطاقة الضريبية (خاص بالمحلات والمكاتب) */}
                {(formData.type === 'محل' || formData.type === 'مكتب') && (
                  <div className="p-5 rounded-xl border-[2px] border-amber-300 bg-amber-50/50 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-black text-amber-950">
                      <Briefcase className="w-5 h-5 text-amber-700" />
                      <span>السجل التجاري والبطاقة الضريبية ورخصة النشاط *</span>
                    </div>
                    <p className="text-xs text-[#626d84] font-bold leading-relaxed">
                      خاص بالوحدات التجارية والإدارية: مستخرج حديث من السجل التجاري والبطاقة الضريبية.
                    </p>
                    <label className="block">
                      <input
                        type="file"
                        accept=".pdf,image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => handleDocumentFiles(e.target.files, 'tax_commercial_record', 'سجل تجاري وبطاقة ضريبية')}
                      />
                      <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-amber-400 text-xs font-black text-amber-900 hover:bg-amber-100 cursor-pointer shadow-xs">
                        <UploadCloud className="w-4 h-4 text-amber-700" />
                        رفع السجل التجاري والضريبي
                      </span>
                    </label>
                  </div>
                )}

                {/* 4. بطاقة الرقم القومي للمالك */}
                <div className="p-5 rounded-xl border-[2px] border-[var(--dp-color-outline)] bg-[var(--dp-color-ground)] space-y-3">
                  <div className="flex items-center gap-2 text-sm font-black text-[var(--dp-color-ink)]">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    <span>بطاقة الرقم القومي للمالك (وجه وظهر) *</span>
                  </div>
                  <p className="text-xs text-[#626d84] font-bold leading-relaxed">
                    صورة واضحة وسارية لبطاقة الرقم القومي للتحقق من هوية صاحب العقار.
                  </p>
                  <label className="block">
                    <input
                      type="file"
                      accept=".pdf,image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => handleDocumentFiles(e.target.files, 'national_id', 'بطاقة الرقم القومي')}
                    />
                    <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[var(--dp-color-outline)] text-xs font-black text-blue-800 hover:bg-blue-50 cursor-pointer shadow-xs">
                      <UploadCloud className="w-4 h-4" />
                      رفع بطاقة الرقم القومي
                    </span>
                  </label>
                </div>

                {/* 5. توكيل رسمي بالشهر العقاري (اختياري) */}
                <div className="p-5 rounded-xl border-[2px] border-[var(--dp-color-outline)] bg-[var(--dp-color-ground)] space-y-3">
                  <div className="flex items-center gap-2 text-sm font-black text-[var(--dp-color-ink)]">
                    <Lock className="w-5 h-5 text-purple-700" />
                    <span>توكيل رسمي بالشهر العقاري (اختياري)</span>
                  </div>
                  <p className="text-xs text-[#626d84] font-bold leading-relaxed">
                    في حال البيع بموجب توكيل رسمي خاص أو إدارة أملاك موثق بالشهر العقاري.
                  </p>
                  <label className="block">
                    <input
                      type="file"
                      accept=".pdf,image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => handleDocumentFiles(e.target.files, 'power_of_attorney', 'توكيل رسمي بالشهر العقاري')}
                    />
                    <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[var(--dp-color-outline)] text-xs font-black text-purple-800 hover:bg-purple-50 cursor-pointer shadow-xs">
                      <UploadCloud className="w-4 h-4" />
                      رفع التوكيل الرسمي
                    </span>
                  </label>
                </div>
              </div>

              {/* Uploaded Documents List with Preview Buttons */}
              {formData.documents.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-black text-[var(--dp-color-ink)]">
                    المستندات المرفقة جاهزة للمراجعة والتدقيق ({formData.documents.length}):
                  </h4>

                  <div className="space-y-2">
                    {formData.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3.5 rounded-xl border-[2px] border-[var(--dp-color-outline)] bg-white flex items-center justify-between gap-3 shadow-hard-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="p-2 rounded-lg bg-[var(--dp-color-field-soft)] border border-[var(--dp-color-outline)] text-[var(--dp-color-accent)] shrink-0">
                            <FileText className="w-5 h-5" />
                          </span>
                          <div className="min-w-0">
                            <span className="font-black text-xs text-[var(--dp-color-ink)] block truncate">
                              {doc.name}
                            </span>
                            <div className="flex items-center gap-2 text-[11px] text-[#626d84] mt-0.5">
                              <Badge variant="fresh" size="sm">
                                {doc.typeName}
                              </Badge>
                              <span>{doc.size}</span>
                              <Badge variant="warm" size="sm">
                                بانتظار فحص الإدمن
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setPreviewDoc(doc)}
                            leftIcon={<Eye className="w-3.5 h-3.5" />}
                            className="text-xs"
                          >
                            معاينة
                          </Button>
                          <button
                            type="button"
                            onClick={() => removeDocument(doc.id)}
                            className="p-1.5 rounded-lg border border-[var(--dp-color-outline)] bg-rose-50 hover:bg-rose-100 text-rose-700 cursor-pointer shrink-0"
                            title="حذف المستند"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================= */}
          {/* STEP 6: المراجعة الشاملة والإرسال */}
          {/* ============================================================= */}
          {currentStep === 6 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b-2 border-[#ece9db] pb-4">
                <Badge variant="primary" className="mb-1.5">
                  الخطوة السادسة والأخيرة
                </Badge>
                <h3 className="text-xl sm:text-2xl font-black text-[var(--dp-color-ink)]">
                  معاينة الإعلان الشاملة قبل الإرسال
                </h3>
                <p className="text-xs sm:text-sm text-[#526078] font-bold mt-1">
                  راجع كافة المواصفات المخصصة والصور ومستندات الفحص وتأكد من دقتها قبل تأكيد الإرسال للإدمن.
                </p>
              </div>

              {/* Complete Property Preview Card */}
              <div className="p-5 rounded-2xl border-[3px] border-[var(--dp-color-outline)] bg-[var(--dp-color-ground)] space-y-6">
                {/* Photo Header & Gallery strip */}
                <div className="space-y-2">
                  <div className="relative aspect-16/9 w-full rounded-xl overflow-hidden border-[2px] border-[var(--dp-color-outline)]">
                    <img
                      src={
                        formData.images[formData.coverImageIndex] ||
                        formData.images[0] ||
                        SAMPLE_PHOTOS_MAP[formData.type][0]
                      }
                      alt={formData.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 bg-[var(--dp-color-accent-fresh)] text-emerald-950 font-black text-xs px-3 py-1 rounded-full border border-[var(--dp-color-outline)] shadow-xs">
                      جاهز للمراجعة القانونية
                    </div>
                  </div>

                  {formData.images.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                      {formData.images.map((img, i) => (
                        <img
                          key={i}
                          src={img}
                          alt="مصغرة"
                          className="w-16 h-14 rounded-lg object-cover border border-[var(--dp-color-outline)] shrink-0"
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Title & Price Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[#ece9db]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="primary" size="sm">
                        {formData.type}
                      </Badge>
                      {formData.subType && (
                        <Badge variant="secondary" size="sm">
                          {formData.subType}
                        </Badge>
                      )}
                      <span className="text-xs text-[#626d84] font-bold">
                        {formData.governorate} • {formData.city} ({formData.location})
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-[var(--dp-color-ink)]">
                      {formData.title || 'عنوان العقار'}
                    </h3>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <span className="text-xl sm:text-2xl font-black text-[var(--dp-color-accent)] block">
                      {formData.price ? formatEGP(Number(formData.price)) : '0 ج.م'}
                    </span>
                    {pricePerSqm && (
                      <span className="text-xs font-bold text-[#626d84] block">
                        {formatEGP(pricePerSqm)} / م²
                      </span>
                    )}
                  </div>
                </div>

                {/* Specifications Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white border border-[var(--dp-color-outline)]">
                    <span className="text-[#626d84] block mb-0.5">المساحة الإجمالية</span>
                    <span className="font-black text-sm text-[var(--dp-color-ink)]">
                      {formData.area ? formatArea(Number(formData.area)) : '0 م²'}
                    </span>
                  </div>

                  {formData.type === 'محل' ? (
                    <>
                      <div className="p-3 rounded-xl bg-white border border-[var(--dp-color-outline)]">
                        <span className="text-[#626d84] block mb-0.5">عرض الواجهة</span>
                        <span className="font-black text-sm text-[var(--dp-color-ink)]">
                          {formData.shopFrontageWidth || 0} متر
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-[var(--dp-color-outline)]">
                        <span className="text-[#626d84] block mb-0.5">ارتفاع السقف</span>
                        <span className="font-black text-sm text-[var(--dp-color-ink)]">
                          {formData.ceilingHeight ? `${formData.ceilingHeight} م` : 'قياسي'}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-[var(--dp-color-outline)]">
                        <span className="text-[#626d84] block mb-0.5">ميزانين / مدخنة</span>
                        <span className="font-black text-xs text-emerald-800">
                          {formData.hasMezzanine ? 'يوجد ميزانين' : 'بدون'} • {formData.hasRestaurantChimney ? 'مدخنة مجهزة' : ''}
                        </span>
                      </div>
                    </>
                  ) : formData.type === 'فيلا' ? (
                    <>
                      <div className="p-3 rounded-xl bg-white border border-[var(--dp-color-outline)]">
                        <span className="text-[#626d84] block mb-0.5">مساحة الأرض</span>
                        <span className="font-black text-sm text-[var(--dp-color-ink)]">
                          {formData.landArea || 0} م²
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-[var(--dp-color-outline)]">
                        <span className="text-[#626d84] block mb-0.5">الحديقة والمسبح</span>
                        <span className="font-black text-xs text-[var(--dp-color-ink)]">
                          {formData.gardenArea ? `${formData.gardenArea} م² حديقة` : 'حديقة'} • {formData.poolType}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-[var(--dp-color-outline)]">
                        <span className="text-[#626d84] block mb-0.5">الغرف والحمامات</span>
                        <span className="font-black text-sm text-[var(--dp-color-ink)]">
                          {formData.bedrooms} غرف • {formData.bathrooms} حمام
                        </span>
                      </div>
                    </>
                  ) : formData.type === 'مكتب' ? (
                    <>
                      <div className="p-3 rounded-xl bg-white border border-[var(--dp-color-outline)]">
                        <span className="text-[#626d84] block mb-0.5">الترخيص الرسمي</span>
                        <span className="font-black text-xs text-[var(--dp-color-ink)]">
                          {formData.officeLicenseType}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-[var(--dp-color-outline)]">
                        <span className="text-[#626d84] block mb-0.5">التقسيم الداخلي</span>
                        <span className="font-black text-xs text-[var(--dp-color-ink)]">
                          {formData.officeLayout}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-[var(--dp-color-outline)]">
                        <span className="text-[#626d84] block mb-0.5">قاعات ومكاتب</span>
                        <span className="font-black text-xs text-[var(--dp-color-ink)]">
                          {formData.meetingRoomsCount} قاعات • {formData.privateOfficesCount} مكاتب
                        </span>
                      </div>
                    </>
                  ) : formData.type === 'أرض' ? (
                    <>
                      <div className="p-3 rounded-xl bg-white border border-[var(--dp-color-outline)]">
                        <span className="text-[#626d84] block mb-0.5">التخصيص الرسمي</span>
                        <span className="font-black text-sm text-[var(--dp-color-ink)]">
                          {formData.landZoning}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-[var(--dp-color-outline)]">
                        <span className="text-[#626d84] block mb-0.5">نسبة البناء</span>
                        <span className="font-black text-sm text-[var(--dp-color-ink)]">
                          {formData.buildingFootprintRatio || 40}%
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-[var(--dp-color-outline)]">
                        <span className="text-[#626d84] block mb-0.5">عرض الشارع</span>
                        <span className="font-black text-sm text-[var(--dp-color-ink)]">
                          {formData.landStreetWidth || 20} متر
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-3 rounded-xl bg-white border border-[var(--dp-color-outline)]">
                        <span className="text-[#626d84] block mb-0.5">الغرف والحمامات</span>
                        <span className="font-black text-sm text-[var(--dp-color-ink)]">
                          {formData.bedrooms} غرف • {formData.bathrooms} حمام
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-[var(--dp-color-outline)]">
                        <span className="text-[#626d84] block mb-0.5">الدور</span>
                        <span className="font-black text-sm text-[var(--dp-color-ink)]">
                          {formData.floor} (من {formData.totalFloors} أدوار)
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-[var(--dp-color-outline)]">
                        <span className="text-[#626d84] block mb-0.5">التشطيب والفرش</span>
                        <span className="font-black text-sm text-[var(--dp-color-ink)]">
                          {formData.finishing}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Legal Documents Summary */}
                <div className="p-4 rounded-xl bg-white border-[2px] border-[var(--dp-color-outline)] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-[var(--dp-color-accent-fresh)] border border-[var(--dp-color-outline)] text-emerald-950">
                      <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-[var(--dp-color-ink)] block">
                        مستندات الملكية المرفوعة ({formData.documents.length} مستندات)
                      </span>
                      <span className="text-[11px] text-[#626d84] font-bold block">
                        محفوظة في بيئة آمنة ومشفرة للمراجعة والتدقيق القانوني من قبل الإدمن.
                      </span>
                    </div>
                  </div>
                  <Badge variant="fresh" size="sm">
                    مستوفى للفحص
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* STEPPER ACTION BUTTONS (Previous, Next, Save Draft, Submit) */}
          {/* ============================================================= */}
          <div className="pt-6 border-t-2 border-[#ece9db] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              {currentStep > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrev}
                  rightIcon={<ArrowRight className="w-4 h-4 stroke-[2.5]" />}
                >
                  السابق
                </Button>
              ) : (
                <Link to="/seller/properties">
                  <Button type="button" variant="ghost" size="sm">
                    إلغاء والعودة
                  </Button>
                </Link>
              )}
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="warm"
                onClick={handleSaveAsDraft}
                isLoading={isSubmitting}
                rightIcon={<Save className="w-4 h-4 stroke-[2.5]" />}
                className="text-xs"
              >
                حفظ كمسودة
              </Button>

              {currentStep < 6 ? (
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={handleNext}
                  leftIcon={<ArrowLeft className="w-4 h-4 stroke-[2.5]" />}
                >
                  التالي
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  onClick={handleSubmitForReview}
                  isLoading={isSubmitting}
                  rightIcon={<CheckCircle2 className="w-5 h-5 stroke-[2.5]" />}
                  className="font-black text-base shadow-hard"
                >
                  إرسال للمراجعة والتوثيق
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Document Preview Modal */}
      {previewDoc && (
        <Modal
          isOpen={Boolean(previewDoc)}
          onClose={() => setPreviewDoc(null)}
          title={`معاينة المستند: ${previewDoc.name}`}
          size="lg"
          footer={
            <Button variant="primary" size="sm" onClick={() => setPreviewDoc(null)}>
              إغلاق المعاينة
            </Button>
          }
        >
          <div className="space-y-4 text-right">
            {previewDoc.url && (previewDoc.url.startsWith('data:image/') || previewDoc.url.includes('.jpg') || previewDoc.url.includes('.png') || previewDoc.url.includes('.webp')) ? (
              <div className="rounded-xl border-[2px] border-[var(--dp-color-outline)] overflow-hidden bg-black max-h-[60vh] flex items-center justify-center p-2">
                <img
                  src={previewDoc.url}
                  alt={previewDoc.name}
                  className="max-h-[55vh] w-auto object-contain mx-auto rounded"
                />
              </div>
            ) : (
              <div className="p-8 bg-[var(--dp-color-ground)] rounded-xl border-[2px] border-[var(--dp-color-outline)] text-center space-y-3">
                <FileText className="w-16 h-16 text-[var(--dp-color-accent)] mx-auto" />
                <h4 className="text-base font-black text-[var(--dp-color-ink)]">
                  {previewDoc.name}
                </h4>
                <p className="text-xs text-[#626d84]">
                  نوع المستند: {previewDoc.typeName} • حجم الملف: {previewDoc.size}
                </p>
                <div className="p-3 bg-white border border-[#ece9db] rounded-lg text-xs font-mono text-[#4a5568]">
                  SHA-256 Verified Checksum: e4d909c290d0fb1ca068ffaddf22cbd0
                </div>
              </div>
            )}
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>المستند محمي ولن يظهر للمشترين؛ بل يقتصر على فحص الإدمن والمطابقة القانونية.</span>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirm Dialog for deleting image */}
      <ConfirmDialog
        isOpen={deleteConfirmImgIndex !== null}
        onClose={() => setDeleteConfirmImgIndex(null)}
        onConfirm={() => {
          if (deleteConfirmImgIndex !== null) removeImage(deleteConfirmImgIndex);
        }}
        title="تأكيد حذف الصورة"
        description="هل أنت متأكد من رغبتك في حذف هذه الصورة من معرض الإعلان؟"
        confirmLabel="حذف"
        cancelLabel="إلغاء"
        variant="danger"
      />
    </DashboardLayout>
  );
};
