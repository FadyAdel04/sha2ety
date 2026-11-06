export interface DistrictInfo {
  name: string;
  city: string;
  lat: number;
  lng: number;
  isPopular?: boolean;
}

export interface GovernorateInfo {
  id: string;
  name: string;
  nameEn: string;
  lat: number;
  lng: number;
  districts: DistrictInfo[];
}

export const EGYPT_GOVERNORATES: GovernorateInfo[] = [
  {
    id: 'cairo',
    name: 'القاهرة',
    nameEn: 'Cairo',
    lat: 30.0444,
    lng: 31.2357,
    districts: [
      { name: 'التجمع الخامس (شارع التسعين والكمبوندات)', city: 'القاهرة الجديدة', lat: 30.0131, lng: 31.4989, isPopular: true },
      { name: 'التجمع الأول وحي النرجس والبنفسج', city: 'القاهرة الجديدة', lat: 30.0450, lng: 31.4720, isPopular: true },
      { name: 'بيت الوطن والمستثمرين', city: 'القاهرة الجديدة', lat: 30.0380, lng: 31.5450, isPopular: true },
      { name: 'الرحاب', city: 'القاهرة الجديدة', lat: 30.0620, lng: 31.4920, isPopular: true },
      { name: 'مدينتي', city: 'القاهرة الجديدة', lat: 30.1150, lng: 31.6310, isPopular: true },
      { name: 'العاصمة الإدارية الجديدة (منطقة الأعمال R7/R8)', city: 'العاصمة الإدارية', lat: 30.0160, lng: 31.7450, isPopular: true },
      { name: 'المعادي ودجلة وسرايات المعادي', city: 'المعادي', lat: 29.9602, lng: 31.2569, isPopular: true },
      { name: 'الزمالك', city: 'وسط القاهرة', lat: 30.0626, lng: 31.2197, isPopular: true },
      { name: 'مصر الجديدة والكوربة', city: 'مصر الجديدة', lat: 30.0910, lng: 31.3260, isPopular: true },
      { name: 'مدينة نصر ومكرم عبيد وعباس العقاد', city: 'مدينة نصر', lat: 30.0530, lng: 31.3400, isPopular: true },
      { name: 'المقطم والهضبة الوسطى', city: 'المقطم', lat: 30.0050, lng: 31.3020 },
      { name: 'الشروق وهليوبوليس الجديدة', city: 'الشروق', lat: 30.1450, lng: 31.6050, isPopular: true },
      { name: 'بدر ومدينة المستقبل (Mostakbal City)', city: 'بدر', lat: 30.1380, lng: 31.7150, isPopular: true },
      { name: 'وسط البلد وجاردن سيتي', city: 'وسط البلد', lat: 30.0400, lng: 31.2350 },
      { name: 'حلوان وحدائق حلوان', city: 'حلوان', lat: 29.8450, lng: 31.3350 },
    ],
  },
  {
    id: 'giza',
    name: 'الجيزة',
    nameEn: 'Giza',
    lat: 30.0131,
    lng: 31.2089,
    districts: [
      { name: 'الشيخ زايد (الثورة الخضراء ووصلة دهشور)', city: 'الشيخ زايد', lat: 30.0561, lng: 30.9856, isPopular: true },
      { name: 'زايد الجديدة (New Zayed والحزام الأخضر)', city: 'الشيخ زايد', lat: 30.0820, lng: 30.9250, isPopular: true },
      { name: '6 أكتوبر (المحور المركزي والأحياء 1-12)', city: '6 أكتوبر', lat: 29.9737, lng: 30.9593, isPopular: true },
      { name: 'حدائق أكتوبر والقرية السياحية', city: 'حدائق أكتوبر', lat: 29.9250, lng: 31.0250, isPopular: true },
      { name: 'أكتوبر الجديدة وغرب المطار', city: 'أكتوبر الجديدة', lat: 29.9100, lng: 30.8500 },
      { name: 'حدائق الأهرام (البوابات)', city: 'حدائق الأهرام', lat: 29.9800, lng: 31.1150, isPopular: true },
      { name: 'المهندسين وميدان لبنان وجامعة الدول', city: 'المهندسين', lat: 30.0570, lng: 31.2010, isPopular: true },
      { name: 'الدقي ومصدق وميدان المساحة', city: 'الدقي', lat: 30.0380, lng: 31.2110 },
      { name: 'العجوزة وكورنيش النيل', city: 'العجوزة', lat: 30.0520, lng: 31.2150 },
      { name: 'القرية الذكية والمحور', city: 'القرية الذكية', lat: 30.0750, lng: 31.0200, isPopular: true },
      { name: 'الهرم وفيصل ومحطة العريش', city: 'الهرم', lat: 29.9980, lng: 31.1550 },
    ],
  },
  {
    id: 'alexandria',
    name: 'الإسكندرية',
    nameEn: 'Alexandria',
    lat: 31.2001,
    lng: 29.9187,
    districts: [
      { name: 'سموحة (فيكتور عمانويل وحدائق الفيكتوريا)', city: 'الإسكندرية', lat: 31.2156, lng: 29.9553, isPopular: true },
      { name: 'كفر عبده ورشدي', city: 'الإسكندرية', lat: 31.2210, lng: 29.9480, isPopular: true },
      { name: 'لوران وجليم وشارع أبو قير', city: 'الإسكندرية', lat: 31.2480, lng: 29.9720, isPopular: true },
      { name: 'ستانلي وسيدي جابر على البحر', city: 'الإسكندرية', lat: 31.2350, lng: 29.9520, isPopular: true },
      { name: 'سان ستيفانو وزيزينيا', city: 'الإسكندرية', lat: 31.2440, lng: 29.9670, isPopular: true },
      { name: 'ميامي والعصافرة قبلي وبحري', city: 'الإسكندرية', lat: 31.2660, lng: 30.0020 },
      { name: 'المندرة والمعمورة الشاطئ', city: 'الإسكندرية', lat: 31.2850, lng: 30.0350 },
      { name: 'كينج مريوط وبرج العرب الجديدة', city: 'برج العرب وكينج مريوط', lat: 31.0180, lng: 29.8050, isPopular: true },
      { name: 'العجمي والبيطاش والهانوفيل', city: 'العجمي', lat: 31.1150, lng: 29.7750 },
    ],
  },
  {
    id: 'matrouh_northcoast',
    name: 'مطروح والساحل الشمالي',
    nameEn: 'Matrouh & North Coast',
    lat: 30.9578,
    lng: 28.7186,
    districts: [
      { name: 'رأس الحكمة (مشروع رأس الحكمة العالمي)', city: 'رأس الحكمة', lat: 31.0850, lng: 27.8420, isPopular: true },
      { name: 'سيدي عبد الرحمن ومراسي وأمواج', city: 'الساحل الشمالي', lat: 30.9578, lng: 28.7186, isPopular: true },
      { name: 'مدينة العلمين الجديدة والأبراج الشاطئية', city: 'العلمين الجديدة', lat: 30.8420, lng: 28.9550, isPopular: true },
      { name: 'مارينا وبورتو مارينا (ك 94 - 105)', city: 'مارينا العلمين', lat: 30.8250, lng: 29.0150, isPopular: true },
      { name: 'سيدي حنيش وألماظة باي', city: 'سيدي حنيش', lat: 31.1200, lng: 27.6500, isPopular: true },
      { name: 'مرسى مطروح (عجيبة وروميل والأبيض)', city: 'مرسى مطروح', lat: 31.3543, lng: 27.2373 },
      { name: 'الضبعة والساحل القديم (ك 21 إلى 80)', city: 'الساحل الشمالي', lat: 31.0250, lng: 28.4500 },
    ],
  },
  {
    id: 'red_sea',
    name: 'البحر الأحمر',
    nameEn: 'Red Sea',
    lat: 27.2579,
    lng: 33.8116,
    districts: [
      { name: 'الجونة (El Gouna الفيلات والشاليهات)', city: 'الجونة', lat: 27.3949, lng: 33.6766, isPopular: true },
      { name: 'الغردقة - الممشى السياحي والكوثر', city: 'الغردقة', lat: 27.2150, lng: 33.8250, isPopular: true },
      { name: 'سهل حشيش (Sahl Hasheesh)', city: 'سهل حشيش', lat: 27.0450, lng: 33.8820, isPopular: true },
      { name: 'مكادي باي وسوما باي', city: 'مكادي باي', lat: 26.9850, lng: 33.8990, isPopular: true },
      { name: 'مرسى علم وبورتو غالب', city: 'مرسى علم', lat: 25.0750, lng: 34.8950, isPopular: true },
      { name: 'سفاجا والقصير', city: 'سفاجا', lat: 26.7500, lng: 33.9350 },
    ],
  },
  {
    id: 'south_sinai',
    name: 'جنوب سيناء',
    nameEn: 'South Sinai',
    lat: 27.9158,
    lng: 34.3299,
    districts: [
      { name: 'شرم الشيخ (خليج نعمة وخليج القرش والغرقانة)', city: 'شرم الشيخ', lat: 27.9158, lng: 34.3299, isPopular: true },
      { name: 'دهب (المسبط واللايت هاوس والبلوهول)', city: 'دهب', lat: 28.5090, lng: 34.5130, isPopular: true },
      { name: 'رأس سدر والقرى السياحية', city: 'رأس سدر', lat: 29.5890, lng: 32.7160, isPopular: true },
      { name: 'نويبع وطابا', city: 'نويبع', lat: 29.0450, lng: 34.6650 },
    ],
  },
  {
    id: 'suez',
    name: 'السويس والعين السخنة',
    nameEn: 'Suez & Ain Sokhna',
    lat: 29.9668,
    lng: 32.5498,
    districts: [
      { name: 'العين السخنة (الجلالة وبورتو والزعفرانة)', city: 'العين السخنة', lat: 29.6020, lng: 32.3250, isPopular: true },
      { name: 'مدينة السويس وبورتوفيق', city: 'السويس', lat: 29.9668, lng: 32.5498 },
      { name: 'حي الأربعين وفيصل والملاحة', city: 'السويس', lat: 29.9850, lng: 32.5250 },
    ],
  },
  {
    id: 'dakahlia',
    name: 'الدقهلية',
    nameEn: 'Dakahlia',
    lat: 31.0409,
    lng: 31.3785,
    districts: [
      { name: 'المنصورة (حي الجامعة، المشاية السفلية، المختلط)', city: 'المنصورة', lat: 31.0409, lng: 31.3785, isPopular: true },
      { name: 'المنصورة الجديدة والأبراج الساحلية', city: 'المنصورة الجديدة', lat: 31.4500, lng: 31.5500, isPopular: true },
      { name: 'طلخا وشارع النوادي', city: 'طلخا', lat: 31.0550, lng: 31.3820 },
      { name: 'جمصة والمنطقة الصناعية', city: 'جمصة', lat: 31.4420, lng: 31.5120 },
      { name: 'ميت غمر ودكرنس وبلقاس', city: 'ميت غمر', lat: 30.7180, lng: 31.2580 },
    ],
  },
  {
    id: 'qalubia',
    name: 'القليوبية',
    nameEn: 'Qalyubia',
    lat: 30.4660,
    lng: 31.1850,
    districts: [
      { name: 'العبور والحي التاسع والتاسع فيلات والحي الخامس', city: 'العبور', lat: 30.2350, lng: 31.4750, isPopular: true },
      { name: 'العبور الجديدة وجمعية أحمد عرابي', city: 'العبور الجديدة', lat: 30.2750, lng: 31.5450, isPopular: true },
      { name: 'بنها وكورنيش النيل والفلل', city: 'بنها', lat: 30.4660, lng: 31.1850 },
      { name: 'شبرا الخيمة والشارع الجديد', city: 'شبرا الخيمة', lat: 30.1250, lng: 31.2450 },
    ],
  },
  {
    id: 'sharqia',
    name: 'الشرقية',
    nameEn: 'Sharqia',
    lat: 30.5877,
    lng: 31.5020,
    districts: [
      { name: 'العاشر من رمضان (المجاورات والأردنية)', city: 'العاشر من رمضان', lat: 30.2980, lng: 31.7450, isPopular: true },
      { name: 'الزقازيق (القومية، المحافظة، الغشام، المنتزه)', city: 'الزقازيق', lat: 30.5877, lng: 31.5020, isPopular: true },
      { name: 'بلبيس والصالحية الجديدة', city: 'بلبيس', lat: 30.4200, lng: 31.5650 },
    ],
  },
  {
    id: 'gharbia',
    name: 'الغربية',
    nameEn: 'Gharbia',
    lat: 30.7865,
    lng: 31.0004,
    districts: [
      { name: 'طنطا (شارع الجيش، النحاس، الاستاد، سعيد)', city: 'طنطا', lat: 30.7865, lng: 31.0004, isPopular: true },
      { name: 'المحلة الكبرى (شكري القوتلي ومنطقة الباشوات)', city: 'المحلة الكبرى', lat: 30.9700, lng: 31.1650, isPopular: true },
      { name: 'زفتى وكفر الزيات', city: 'زفتى', lat: 30.7100, lng: 31.2400 },
    ],
  },
  {
    id: 'monufia',
    name: 'المنوفية',
    nameEn: 'Monufia',
    lat: 30.5513,
    lng: 31.0108,
    districts: [
      { name: 'شبين الكوم (البر الشرقي وحي الجامعة)', city: 'شبين الكوم', lat: 30.5513, lng: 31.0108, isPopular: true },
      { name: 'مدينة السادات (المنطقة السكنية والصناعية)', city: 'مدينة السادات', lat: 30.3750, lng: 30.5250, isPopular: true },
      { name: 'قويسنا ومنوف وأشمون', city: 'قويسنا', lat: 30.5650, lng: 31.1450 },
    ],
  },
  {
    id: 'damietta',
    name: 'دمياط',
    nameEn: 'Damietta',
    lat: 31.4175,
    lng: 31.8144,
    districts: [
      { name: 'دمياط الجديدة (الحي المتميز وحي الفيلات)', city: 'دمياط الجديدة', lat: 31.4350, lng: 31.6650, isPopular: true },
      { name: 'رأس البر (منطقة اللسان وشارع النيل)', city: 'رأس البر', lat: 31.5150, lng: 31.8350, isPopular: true },
      { name: 'مدينة دمياط وفارسكور', city: 'دمياط', lat: 31.4175, lng: 31.8144 },
    ],
  },
  {
    id: 'port_said',
    name: 'بورسعيد',
    nameEn: 'Port Said',
    lat: 31.2653,
    lng: 32.3019,
    districts: [
      { name: 'حي الشرق (الفرنسي والتاريخي)', city: 'بورسعيد', lat: 31.2620, lng: 32.3050, isPopular: true },
      { name: 'بورفؤاد والملاحات وسهل الطينة', city: 'بورفؤاد', lat: 31.2450, lng: 32.3200, isPopular: true },
      { name: 'حي المناخ وحي الزهور وحي الضواحي', city: 'بورسعيد', lat: 31.2580, lng: 32.2850 },
    ],
  },
  {
    id: 'ismailia',
    name: 'الإسماعيلية',
    nameEn: 'Ismailia',
    lat: 30.5965,
    lng: 32.2715,
    districts: [
      { name: 'مدينة الإسماعيلية (نمرة 6 وحي الشيخ زايد)', city: 'الإسماعيلية', lat: 30.5965, lng: 32.2715, isPopular: true },
      { name: 'فايد وبحيرات التمساح والقرى السياحية', city: 'فايد', lat: 30.3250, lng: 32.2950, isPopular: true },
      { name: 'القنطرة شرق وغرب والتل الكبير', city: 'القنطرة', lat: 30.8550, lng: 32.3150 },
    ],
  },
  {
    id: 'beheira',
    name: 'البحيرة',
    nameEn: 'Beheira',
    lat: 31.0379,
    lng: 30.4725,
    districts: [
      { name: 'دمنهور (شارع عبد السلام الشاذلي واستاد دمنهور)', city: 'دمنهور', lat: 31.0379, lng: 30.4725 },
      { name: 'كفر الدوار وشارع بورسعيد', city: 'كفر الدوار', lat: 31.1350, lng: 30.1250 },
      { name: 'وادي النطرون والمزارع الاستثمارية', city: 'وادي النطرون', lat: 30.4150, lng: 30.3450 },
      { name: 'رشيد وإدكو', city: 'رشيد', lat: 31.4050, lng: 30.4150 },
    ],
  },
  {
    id: 'kafr_el_sheikh',
    name: 'كفر الشيخ',
    nameEn: 'Kafr El Sheikh',
    lat: 31.1107,
    lng: 30.9388,
    districts: [
      { name: 'كفر الشيخ (حي الجامعة والمحاربين)', city: 'كفر الشيخ', lat: 31.1107, lng: 30.9388 },
      { name: 'مصيف بلطيم وشاطئ النرجس والفيروز', city: 'بلطيم', lat: 31.5850, lng: 31.1050, isPopular: true },
      { name: 'دسوق وفوه ومطوبس', city: 'دسوق', lat: 31.1350, lng: 30.6450 },
    ],
  },
  {
    id: 'fayoum',
    name: 'الفيوم',
    nameEn: 'Fayoum',
    lat: 29.3084,
    lng: 30.8428,
    districts: [
      { name: 'مدينة الفيوم (حي الجامعة والجونة والمسلة)', city: 'الفيوم', lat: 29.3084, lng: 30.8428 },
      { name: 'الفيوم الجديدة ووادي الريان وبحيرة قارون', city: 'الفيوم الجديدة', lat: 29.3450, lng: 30.9150, isPopular: true },
      { name: 'يوسف الصديق وطامية وسنورس', city: 'طامية', lat: 29.4100, lng: 30.9500 },
    ],
  },
  {
    id: 'beni_suef',
    name: 'بني سويف',
    nameEn: 'Beni Suef',
    lat: 29.0661,
    lng: 31.0994,
    districts: [
      { name: 'بني سويف الجديدة (الحي الأول والمنطقة الصناعية)', city: 'بني سويف الجديدة', lat: 29.0450, lng: 31.1850, isPopular: true },
      { name: 'مدينة بني سويف ومقبل وكورنيش النيل', city: 'بني سويف', lat: 29.0661, lng: 31.0994 },
      { name: 'الواسطى وناصر وببا', city: 'الواسطى', lat: 29.3250, lng: 31.1950 },
    ],
  },
  {
    id: 'minya',
    name: 'المنيا',
    nameEn: 'Minya',
    lat: 28.1099,
    lng: 30.7503,
    districts: [
      { name: 'المنيا الجديدة (الحي الرابع وحي الفيلات والجامعة)', city: 'المنيا الجديدة', lat: 28.0850, lng: 30.8350, isPopular: true },
      { name: 'مدينة المنيا (طه حسين وكورنيش النيل والماص)', city: 'المنيا', lat: 28.1099, lng: 30.7503 },
      { name: 'ملوي وسمالوط وبني مزار ومغاغة', city: 'ملوي', lat: 27.7350, lng: 30.8450 },
    ],
  },
  {
    id: 'assiut',
    name: 'أسيوط',
    nameEn: 'Assiut',
    lat: 27.1783,
    lng: 31.1859,
    districts: [
      { name: 'أسيوط الجديدة (منطقة التوسعات وحي الفيلات)', city: 'أسيوط الجديدة', lat: 27.2450, lng: 31.3350, isPopular: true },
      { name: 'مدينة أسيوط (شارع الهلالي، النميس، كورنيش النيل، الجامعة)', city: 'أسيوط', lat: 27.1783, lng: 31.1859 },
      { name: 'ديروط والقوصية ومنفلوط وأبنوب', city: 'ديروط', lat: 27.5600, lng: 30.8150 },
    ],
  },
  {
    id: 'sohag',
    name: 'سوهاج',
    nameEn: 'Sohag',
    lat: 26.5569,
    lng: 31.6948,
    districts: [
      { name: 'سوهاج الجديدة (مدينة الكوامل)', city: 'سوهاج الجديدة', lat: 26.4750, lng: 31.6450, isPopular: true },
      { name: 'مدينة سوهاج (شارع 15 وكورنيش النيل الشرقي)', city: 'سوهاج', lat: 26.5569, lng: 31.6948 },
      { name: 'أخميم وطهطا وجرجا والبلينا', city: 'أخميم', lat: 26.5650, lng: 31.7450 },
    ],
  },
  {
    id: 'qena',
    name: 'قنا',
    nameEn: 'Qena',
    lat: 26.1551,
    lng: 32.7160,
    districts: [
      { name: 'قنا الجديدة (الحي السكني الأول والحي الثاني)', city: 'قنا الجديدة', lat: 26.1950, lng: 32.8150, isPopular: true },
      { name: 'مدينة قنا وحي المصالح ونقادة', city: 'قنا', lat: 26.1551, lng: 32.7160 },
      { name: 'نجع حمادي ودشنا وأبو تشت وقوص', city: 'نجع حمادي', lat: 26.0450, lng: 32.2450 },
    ],
  },
  {
    id: 'luxor',
    name: 'الأقصر',
    nameEn: 'Luxor',
    lat: 25.6872,
    lng: 32.6396,
    districts: [
      { name: 'مدينة الأقصر (شارع التليفزيون وكورنيش النيل وخالد بن الوليد)', city: 'الأقصر', lat: 25.6872, lng: 32.6396, isPopular: true },
      { name: 'طيبة الجديدة (المساحات السكنية والجامعية)', city: 'طيبة الجديدة', lat: 25.7550, lng: 32.7450, isPopular: true },
      { name: 'البر الغربي والقرنة وإسنا وأرمنت', city: 'الأقصر', lat: 25.7150, lng: 32.5950 },
    ],
  },
  {
    id: 'aswan',
    name: 'أسوان',
    nameEn: 'Aswan',
    lat: 24.0889,
    lng: 32.8998,
    districts: [
      { name: 'أسوان الجديدة (الشريط السياحي النهري والفلل)', city: 'أسوان الجديدة', lat: 24.1650, lng: 32.8550, isPopular: true },
      { name: 'مدينة أسوان (كورنيش النيل وأطلس وعباس العقاد)', city: 'أسوان', lat: 24.0889, lng: 32.8998 },
      { name: 'كوم أمبو ودراو ونصر النوبة وإدفو', city: 'كوم أمبو', lat: 24.4750, lng: 32.9450 },
    ],
  },
  {
    id: 'north_sinai',
    name: 'شمال سيناء',
    nameEn: 'North Sinai',
    lat: 31.1316,
    lng: 33.7984,
    districts: [
      { name: 'العريش (شاطئ النخيل وظلال النخيل والميدان)', city: 'العريش', lat: 31.1316, lng: 33.7984 },
      { name: 'بئر العبد والشيخ زويد ورفح الجديدة', city: 'بئر العبد', lat: 31.0150, lng: 33.0150 },
    ],
  },
  {
    id: 'new_valley',
    name: 'الوادي الجديد',
    nameEn: 'New Valley',
    lat: 25.4514,
    lng: 30.5472,
    districts: [
      { name: 'الخارجة (الزهور والبرامكة والبلد القديمة)', city: 'الخارجة', lat: 25.4514, lng: 30.5472 },
      { name: 'الداخلة والفرافرة وبلاط وموط', city: 'الداخلة', lat: 25.5150, lng: 28.9850 },
    ],
  },
];

// Top 10 national investment hotspots
export const TOP_NATIONAL_HOTSPOTS = [
  { name: 'التجمع الخامس (القاهرة الجديدة)', gov: 'القاهرة', city: 'القاهرة الجديدة', location: 'التجمع الخامس (شارع التسعين والكمبوندات)', lat: 30.0131, lng: 31.4989 },
  { name: 'الشيخ زايد (الجيزة)', gov: 'الجيزة', city: 'الشيخ زايد', location: 'الشيخ زايد (الثورة الخضراء ووصلة دهشور)', lat: 30.0561, lng: 30.9856 },
  { name: 'العاصمة الإدارية الجديدة', gov: 'القاهرة', city: 'العاصمة الإدارية', location: 'العاصمة الإدارية الجديدة (منطقة الأعمال R7/R8)', lat: 30.0160, lng: 31.7450 },
  { name: 'رأس الحكمة (الساحل الشمالي)', gov: 'مطروح والساحل الشمالي', city: 'رأس الحكمة', location: 'رأس الحكمة (مشروع رأس الحكمة العالمي)', lat: 31.0850, lng: 27.8420 },
  { name: 'سيدي عبد الرحمن (مراسي وأمواج)', gov: 'مطروح والساحل الشمالي', city: 'الساحل الشمالي', location: 'سيدي عبد الرحمن ومراسي وأمواج', lat: 30.9578, lng: 28.7186 },
  { name: 'سموحة (الإسكندرية)', gov: 'الإسكندرية', city: 'الإسكندرية', location: 'سموحة (فيكتور عمانويل وحدائق الفيكتوريا)', lat: 31.2156, lng: 29.9553 },
  { name: 'الجونة (البحر الأحمر)', gov: 'البحر الأحمر', city: 'الجونة', location: 'الجونة (El Gouna الفيلات والشاليهات)', lat: 27.3949, lng: 33.6766 },
  { name: 'العين السخنة (الجلالة)', gov: 'السويس والعين السخنة', city: 'العين السخنة', location: 'العين السخنة (الجلالة وبورتو والزعفرانة)', lat: 29.6020, lng: 32.3250 },
  { name: 'المنصورة الجديدة', gov: 'الدقهلية', city: 'المنصورة الجديدة', location: 'المنصورة الجديدة والأبراج الساحلية', lat: 31.4500, lng: 31.5500 },
  { name: 'المعادي وسرايات المعادي', gov: 'القاهرة', city: 'المعادي', location: 'المعادي ودجلة وسرايات المعادي', lat: 29.9602, lng: 31.2569 },
];

export function getGovernorateByName(name: string): GovernorateInfo | undefined {
  if (!name) return undefined;
  const clean = name.trim();
  return (
    EGYPT_GOVERNORATES.find((g) => g.name === clean) ||
    EGYPT_GOVERNORATES.find((g) => clean.includes(g.name) || g.name.includes(clean))
  );
}

export function getGovernorateDistricts(govName: string): DistrictInfo[] {
  const gov = getGovernorateByName(govName);
  return gov ? gov.districts : [];
}

