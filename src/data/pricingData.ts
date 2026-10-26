import { DesignSubItem, BuildingType, RiyadhLocationZone } from '../types';

export const RIYADH_ZONE_CONFIGS: Record<
  RiyadhLocationZone,
  {
    label: string;
    shortLabel: string;
    adjustmentPercent: number; // +20, -20, -40, 0
    multiplier: number; // 1.20, 0.80, 0.60, 1.00
    badgeClass: string;
    description: string;
  }
> = {
  north_center: {
    label: 'شمال / وسط الرياض (+20%)',
    shortLabel: 'شمال / وسط (+20%)',
    adjustmentPercent: 20,
    multiplier: 1.2,
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    description: 'زيادة سعر (+20%) لأحياء شمال ووسط الرياض',
  },
  east_west: {
    label: 'شرق / غرب الرياض (-20%)',
    shortLabel: 'شرق / غرب (-20%)',
    adjustmentPercent: -20,
    multiplier: 0.8,
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
    description: 'تخفيض سعر (-20%) لأحياء شرق وغرب الرياض',
  },
  south: {
    label: 'جنوب الرياض (-40%)',
    shortLabel: 'جنوب الرياض (-40%)',
    adjustmentPercent: -40,
    multiplier: 0.6,
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    description: 'تخفيض سعر (-40%) لأحياء جنوب الرياض',
  },
  none: {
    label: 'بدون تعديل جغرافي (0%)',
    shortLabel: 'بدون تعديل (0%)',
    adjustmentPercent: 0,
    multiplier: 1.0,
    badgeClass: 'bg-stone-100 text-stone-700 border-stone-200',
    description: 'السعر الأساسي المعتمد بدون زيادة أو تخفيض جغرافي',
  },
};

export function getRiyadhZoneMultiplier(zone?: RiyadhLocationZone): number {
  if (!zone || !RIYADH_ZONE_CONFIGS[zone]) return 1.0;
  return RIYADH_ZONE_CONFIGS[zone].multiplier;
}

export function detectRiyadhZone(districtName?: string, currentCity?: string): RiyadhLocationZone {
  if (currentCity && !currentCity.includes('الرياض')) {
    return 'none';
  }
  if (!districtName) return 'none';
  const clean = districtName.trim().toLowerCase();

  const northCenterDistricts = [
    'حطين', 'النرجس', 'الياسمين', 'الملقا', 'الصحافة', 'العقيق', 'الغدير', 'النفل',
    'الربيع', 'الندى', 'الوادي', 'الفلاح', 'قرطبة', 'المروج', 'المصيف', 'التعاون',
    'الازدهار', 'إزدهار', 'العليا', 'السليمانية', 'الملز', 'المعذر', 'المؤتمرات',
    'الورود', 'صلاح الدين', 'الملك فهد', 'الملك عبد الله', 'الملك عبد العزيز',
    'الرحمانية', 'المحمدية', 'الرائد', 'الخزامى', 'شمال', 'وسط'
  ];
  if (northCenterDistricts.some((d) => clean.includes(d))) return 'north_center';

  const eastWestDistricts = [
    'اليرموك', 'الحمراء', 'الروضة', 'إشبيلية', 'اشبيلية', 'القادسية', 'المونسية',
    'الرمال', 'الجنادرية', 'النظيم', 'النهضة', 'الخليج', 'أشبيلية', 'النسيم', 'السعادة',
    'الفيحاء', 'الجزيرة', 'السلي', 'طويق', 'لبن', 'نمار', 'العريجاء', 'البديعة',
    'السويدي الغربي', 'ظهرة لبن', 'المشاعل', 'المهدية', 'عرقة', 'غرب', 'شرق'
  ];
  if (eastWestDistricts.some((d) => clean.includes(d))) return 'east_west';

  const southDistricts = [
    'الشفا', 'شفا', 'العزيزية', 'الدار البيضاء', 'الحاير', 'المناخ', 'بدر', 'المروة',
    'شبرا', 'عتيقة', 'غبيراء', 'منفوحة', 'اليمامة', 'المصانع', 'الحزم', 'جنوب'
  ];
  if (southDistricts.some((d) => clean.includes(d))) return 'south';

  return 'none';
}

export const INITIAL_DESIGN_SUB_ITEMS: DesignSubItem[] = [
  { id: 'arch', name: 'مخطط معماري', defaultPrice: 3000, selected: true },
  { id: 'structural', name: 'مخطط إنشائي', defaultPrice: 3000, selected: true },
  { id: 'electrical', name: 'مخطط كهرباء', defaultPrice: 1000, selected: true },
  { id: 'plumbing', name: 'مخطط سباكة وصرف', defaultPrice: 1000, selected: true },
  { id: 'hvac', name: 'مخطط تكييف', defaultPrice: 1000, selected: true },
  { id: 'energy', name: 'مخطط كود الطاقة والعزل', defaultPrice: 1000, selected: true },
  { id: 'soil_test', name: 'تقرير فحص تربة معتمد', defaultPrice: 2000, selected: true },
  { id: 'survey_decision', name: 'إصدار قرار مساحي', defaultPrice: 1500, selected: true },
];

export const DECOR_DELIVERABLES = [
  'رفع مساحي As-Built للموقع',
  'لوحة أفكار ومود بورد (Moodboard)',
  'لقطات وتصاميم ثلاثية الأبعاد (3D Renders)',
  'المخططات التنفيذية التفصيلية (Shop Drawings)',
  'جداول المواصفات واختيار المواد (Specifications)',
  'جداول الكميات وحصر المواد (BOQ)',
];

export const SURVEY_SERVICES = [
  { id: 'survey_decision', name: 'إصدار / تحديث قرار مساحي إلكتروني', basePrice: 1500, unit: 'للموقع' },
  { id: 'survey_topo', name: 'رفع مساحي طبوغرافي مع كروكي تفصيلي', basePrice: 2500, unit: 'للموقع حتى 1000م²' },
  { id: 'survey_split', name: 'فرز وتجزئة أراضي ووحدات عقارية', basePrice: 3500, unit: 'للمعاملة' },
  { id: 'survey_boundary', name: 'تبتير وتثبيت وتحديد أركان وحدود الأرض', basePrice: 2000, unit: 'للقطعة' },
  { id: 'survey_deed_mod', name: 'تعديل وتحديث وتطابق الصكوك', basePrice: 2500, unit: 'للصك' },
  { id: 'survey_kroki', name: 'استخراج كروكي تنظيمي بلدي معتمد', basePrice: 1800, unit: 'للكروكي' },
];

export const CIVIL_DEFENSE_SERVICES = [
  {
    id: 'cd_plans',
    name: 'مخططات شبكات الإنذار والإطفاء (اعتماد سلامة)',
    basePrice: 5000,
    unit: 'للمشروع',
    perMeterRate: 4,
    description: 'تشمل مضخات الحريق، الرشاشات، كواشف الدخان والإنذار، ومخارج الطوارئ طبقاً لكود البناء السعودي SBC 801.',
  },
  {
    id: 'cd_tech_report',
    name: 'تقرير فني لسلامة المنشأة والموقع (استشاري معتمد)',
    basePrice: 3000,
    unit: 'للتقرير',
    description: 'معاينة ميدانية وإصدار تقرير هندسي معتمد لتقديمه عبر منصة سلامة.',
  },
  {
    id: 'cd_license',
    name: 'استخراج / تجديد رخصة الدفاع المدني (بوابة سلامة)',
    basePrice: 2500,
    unit: 'للرخصة',
    description: 'متابعة المعاملة وإصدار شهادة التوافق واشتراطات الوقاية من الحريق.',
  },
  {
    id: 'cd_consultation',
    name: 'دراسة استشارية وحسابات هيدروليكية لأنظمة الإطفاء',
    basePrice: 2000,
    unit: 'للدراسة',
    description: 'حسابات الضغط والتدفق واختيار مضخات الحريق المناسبة.',
  },
];

export const EXECUTION_SERVICES = [
  {
    id: 'exec_turnkey',
    name: 'تنفيذ تسليم مفتاح (عظم وتشطيب متكامل)',
    ratePerMeter: 1550,
    unit: 'ريال / م² مسطح بناء',
    description: 'تنفيذ كامل من الحفر والأساسات حتى تشطيبات الدهانات والأرضيات والكهرباء والسباكة مع ضمانات معتمدة.',
  },
  {
    id: 'exec_bone_materials',
    name: 'تنفيذ عظم بالمواد (هيكل إنشائي كامل)',
    ratePerMeter: 650,
    unit: 'ريال / م² مسطح بناء',
    description: 'أعمال الحفر والخرسانات والحديد والمباني والعزل مع المواد المعتمدة للمرحلة الإنشائية.',
  },
  {
    id: 'exec_bone_labor',
    name: 'تنفيذ عظم مصنعيات (بدون مواد)',
    ratePerMeter: 160,
    unit: 'ريال / م² مسطح بناء',
    description: 'أجور اليد العاملة والنجارة والحدادة والصب والبناء بإشراف ومتابعة هندسية دقيقة.',
  },
  {
    id: 'exec_finishing',
    name: 'أعمال تشطيب وترميم وديكورات متقدمة',
    ratePerMeter: 450,
    unit: 'ريال / م² تقديري',
    description: 'تجديد الواجهات، أعمال اللياسة، الجبس بورد، التأسيسات والتكسيات المعمارية.',
  },
  {
    id: 'exec_site_supervision',
    name: 'إشراف هندسي مرحلي على بنود التنفيذ والمقاولين',
    basePrice: 4000,
    unit: 'ريال / شهرياً',
    description: 'مهندس مقيم للمطابقة مع المخططات وإصدار تقارير استلام حديد وخرسانات وعوازل.',
  },
];

/**
 * Calculates the standard base design package price based on building type and area:
 * 1. الفلل (Villas):
 *    - 200 إلى 400 م²: 25,000 ريال
 *    - 400 إلى 500 م²: 30,000 ريال
 *    - 500 إلى 700 م²: 40,000 ريال
 *    - 700 إلى 1,000 م²: 50,000 ريال
 *    - أكبر من 1,000 م²: 60,000 ريال
 *
 * 2. الاستراحات والشاليهات (Rest Houses):
 *    - من 200 إلى 500 م²: 15,000 ريال
 *    - من 500 إلى 700 م²: 18,000 ريال
 *    - من 700 إلى 1,000 م²: 20,000 ريال
 *    - أكبر من 1,000 م²: 25,000 ريال
 *
 * 3. العمائر السكنية (Residential Buildings):
 *    - 200 إلى 500 م²: 50,000 ريال
 *    - 500 إلى 1,000 م²: 80,000 ريال
 *    - 1,000 إلى 2,000 م²: 100,000 ريال
 *    - 2,000 إلى 5,000 م²: 120,000 ريال
 *    - 5,000 م² وأكثر: 160,000 ريال
 *
 * 4. العمائر التجارية (Commercial Buildings):
 *    - 200 إلى 500 م²: 60,000 ريال
 *    - 500 إلى 1,000 م²: 90,000 ريال
 *    - 1,000 إلى 2,000 م²: 110,000 ريال
 *    - 2,000 إلى 5,000 م²: 160,000 ريال
 *    - 5,000 م² وأكثر: 200,000 ريال
 *
 * ملاحظة: خدمة "تعديل مكونات البناء" (component_mod) أصبحت بنفس أسعار باقات الرخص الجديدة تماماً.
 */
export function getDesignAreaTierPrice(
  buildingType: BuildingType,
  area: number,
  serviceType?: string
): { price: number; tierLabel: string } {
  // خدمة تعديل المكونات بنفس أسعار الرخص الجديدة تماماً بدون خصم (ما عدا الفنادق لها تسعير خاص)
  const discount = 0;

  if (buildingType === 'residential') {
    if (area <= 500) {
      return { price: Math.max(0, 50000 - discount), tierLabel: 'من 200 إلى 500 م²' };
    } else if (area <= 1000) {
      return { price: Math.max(0, 80000 - discount), tierLabel: 'من 500 إلى 1,000 م²' };
    } else if (area <= 2000) {
      return { price: Math.max(0, 100000 - discount), tierLabel: 'من 1,000 إلى 2,000 م²' };
    } else if (area <= 5000) {
      return { price: Math.max(0, 120000 - discount), tierLabel: 'من 2,000 إلى 5,000 م²' };
    } else {
      return { price: Math.max(0, 160000 - discount), tierLabel: '5,000 م² وأكثر' };
    }
  } else if (buildingType === 'hotel') {
    // الفنادق
    if (serviceType === 'component_mod') {
      // تعديل مكونات الفنادق: 500: 50 ألف، 500-1000: 60 ألف، 1000-2000: 80 ألف، 2000-5000: 100 ألف
      if (area <= 500) {
        return { price: 50000, tierLabel: 'حتى 500 م²' };
      } else if (area <= 1000) {
        return { price: 60000, tierLabel: 'من 500 إلى 1,000 م²' };
      } else if (area <= 2000) {
        return { price: 80000, tierLabel: 'من 1,000 إلى 2,000 م²' };
      } else if (area <= 5000) {
        return { price: 100000, tierLabel: 'من 2,000 إلى 5,000 م²' };
      } else {
        return { price: 130000, tierLabel: '5,000 م² وأكثر' };
      }
    }
    // رخص جديدة للفنادق (حتى 500م²: 70 ألف، 500-1000: 100 ألف، 1000-2000: 120 ألف، 2000-5000: 170 ألف، 5000 فأكثر: 210 ألف)
    if (area <= 500) {
      return { price: Math.max(0, 70000 - discount), tierLabel: 'حتى 500 م²' };
    } else if (area <= 1000) {
      return { price: Math.max(0, 100000 - discount), tierLabel: 'من 500 إلى 1,000 م²' };
    } else if (area <= 2000) {
      return { price: Math.max(0, 120000 - discount), tierLabel: 'من 1,000 إلى 2,000 م²' };
    } else if (area <= 5000) {
      return { price: Math.max(0, 170000 - discount), tierLabel: 'من 2,000 إلى 5,000 م²' };
    } else {
      return { price: Math.max(0, 210000 - discount), tierLabel: '5,000 م² وأكثر' };
    }
  } else if (buildingType === 'gas_station') {
    // محطات الوقود (40 ألف - 60 ألف - 80 ألف)
    if (area <= 1000) {
      return { price: Math.max(0, 40000 - discount), tierLabel: 'من 500 إلى 1,000 م²' };
    } else if (area <= 2000) {
      return { price: Math.max(0, 60000 - discount), tierLabel: 'من 1,000 إلى 2,000 م²' };
    } else if (area <= 3000) {
      return { price: Math.max(0, 80000 - discount), tierLabel: 'من 2,000 إلى 3,000 م²' };
    } else {
      return { price: Math.max(0, 100000 - discount), tierLabel: '3,000 م² وأكثر' };
    }
  } else if (buildingType === 'warehouse_workshop') {
    // ورش ومستودعات - رخص جديدة وتعديل مكونات (40 - 60 - 80 - 100 ألف)
    if (area <= 500) {
      return { price: 40000, tierLabel: 'حتى 500 م²' };
    } else if (area <= 1000) {
      return { price: 60000, tierLabel: 'من 500 إلى 1,000 م²' };
    } else if (area <= 2000) {
      return { price: 80000, tierLabel: 'من 1,000 إلى 2,000 م²' };
    } else if (area <= 5000) {
      return { price: 100000, tierLabel: 'من 2,000 إلى 5,000 م²' };
    } else {
      return { price: 130000, tierLabel: '5,000 م² وأكثر' };
    }
  } else if (buildingType === 'factory') {
    // المصانع - رخص جديدة: 500-1000: 90 ألف، 1000-2000: 120 ألف، 2000-3000: 180 ألف، 3000-5000: 200 ألف
    if (area <= 1000) {
      return { price: 90000, tierLabel: 'من 500 إلى 1,000 م²' };
    } else if (area <= 2000) {
      return { price: 120000, tierLabel: 'من 1,000 إلى 2,000 م²' };
    } else if (area <= 3000) {
      return { price: 180000, tierLabel: 'من 2,000 إلى 3,000 م²' };
    } else if (area <= 5000) {
      return { price: 200000, tierLabel: 'من 3,000 إلى 5,000 م²' };
    } else {
      return { price: 240000, tierLabel: '5,000 م² وأكثر' };
    }
  } else if (buildingType === 'commercial') {
    // العمائر التجارية
    if (area <= 500) {
      return { price: Math.max(0, 60000 - discount), tierLabel: 'من 200 إلى 500 م²' };
    } else if (area <= 1000) {
      return { price: Math.max(0, 90000 - discount), tierLabel: 'من 500 إلى 1,000 م²' };
    } else if (area <= 2000) {
      return { price: Math.max(0, 110000 - discount), tierLabel: 'من 1,000 إلى 2,000 م²' };
    } else if (area <= 5000) {
      return { price: Math.max(0, 160000 - discount), tierLabel: 'من 2,000 إلى 5,000 م²' };
    } else {
      return { price: Math.max(0, 200000 - discount), tierLabel: '5,000 م² وأكثر' };
    }
  } else if (buildingType === 'rest_house') {
    // الاستراحات والشاليهات (شرائح رخص جديدة: 15 - 18 - 20 - 25 ألف)
    if (area <= 500) {
      return { price: Math.max(0, 15000 - discount), tierLabel: 'من 200 إلى 500 م²' };
    } else if (area <= 700) {
      return { price: Math.max(0, 18000 - discount), tierLabel: 'من 500 إلى 700 م²' };
    } else if (area <= 1000) {
      return { price: Math.max(0, 20000 - discount), tierLabel: 'من 700 إلى 1,000 م²' };
    } else {
      return { price: Math.max(0, 25000 - discount), tierLabel: 'أكبر من 1,000 م²' };
    }
  } else {
    // Villa (الفلل)
    if (area <= 400) {
      return { price: Math.max(0, 25000 - discount), tierLabel: 'من 200 إلى 400 م²' };
    } else if (area <= 500) {
      return { price: Math.max(0, 30000 - discount), tierLabel: 'من 400 إلى 500 م²' };
    } else if (area <= 700) {
      return { price: Math.max(0, 40000 - discount), tierLabel: 'من 500 إلى 700 م²' };
    } else if (area <= 1000) {
      return { price: Math.max(0, 50000 - discount), tierLabel: 'من 700 إلى 1,000 م²' };
    } else {
      return { price: Math.max(0, 60000 - discount), tierLabel: 'أكبر من 1,000 م²' };
    }
  }
}

/**
 * شرائح أسعار تصحيح وضع مبنى قائم:
 * 1. الفنادق (Hotels):
 *    - حتى 500 م²: 40,000 ريال
 *    - 500 إلى 1,000 م²: 50,000 ريال
 *    - 1,000 إلى 2,000 م²: 60,000 ريال
 *    - 2,000 إلى 5,000 م²: 70,000 ريال
 *
 * 2. محطات الوقود (Gas Stations):
 *    - 500 إلى 1,000 م²: 20,000 ريال
 *    - 1,000 إلى 2,000 م²: 30,000 ريال
 *    - 2,000 إلى 3,000 م²: 40,000 ريال
 *
 * 3. ورش ومستودعات (Warehouses & Workshops):
 *    - حتى 500 م²: 15,000 ريال
 *    - 500 إلى 1,000 م²: 25,000 ريال
 *    - 1,000 إلى 2,000 م²: 35,000 ريال
 *    - 2,000 إلى 5,000 م²: 45,000 ريال
 *
 * 4. الفلل والاستراحات (Villas & Rest Houses):
 *    - من 200 إلى 400 م²: 10,000 ريال
 *    - من 400 إلى 500 م²: 12,000 ريال
 *    - من 500 إلى 700 م²: 15,000 ريال
 *    - من 700 إلى 1,000 م²: 18,000 ريال
 *    - أكبر من 1,000 م²: 20,000 ريال
 *
 * 5. العمائر السكنية والتجارية (Residential & Commercial):
 *    - من 200 إلى 400 م²: 20,000 ريال
 *    - من 400 إلى 500 م²: 24,000 ريال
 *    - من 500 إلى 700 م²: 30,000 ريال
 *    - من 700 إلى 1,000 م²: 36,000 ريال
 *    - أكبر من 1,000 م²: 40,000 ريال
 */
export function getAsBuiltTierPrice(
  buildingType: BuildingType,
  area: number
): { price: number; tierLabel: string } {
  if (buildingType === 'hotel') {
    // فنادق - تصحيح وضع مبنى قائم
    if (area <= 500) {
      return { price: 40000, tierLabel: 'حتى 500 م²' };
    } else if (area <= 1000) {
      return { price: 50000, tierLabel: 'من 500 إلى 1,000 م²' };
    } else if (area <= 2000) {
      return { price: 60000, tierLabel: 'من 1,000 إلى 2,000 م²' };
    } else if (area <= 5000) {
      return { price: 70000, tierLabel: 'من 2,000 إلى 5,000 م²' };
    } else {
      return { price: 85000, tierLabel: '5,000 م² وأكثر' };
    }
  }

  if (buildingType === 'gas_station') {
    // محطات الوقود - تصحيح وضع مبنى قائم (20 - 30 - 40 ألف)
    if (area <= 1000) {
      return { price: 20000, tierLabel: 'من 500 إلى 1,000 م²' };
    } else if (area <= 2000) {
      return { price: 30000, tierLabel: 'من 1,000 إلى 2,000 م²' };
    } else if (area <= 3000) {
      return { price: 40000, tierLabel: 'من 2,000 إلى 3,000 م²' };
    } else {
      return { price: 50000, tierLabel: '3,000 م² وأكثر' };
    }
  }

  if (buildingType === 'warehouse_workshop') {
    // ورش ومستودعات - تصحيح وضع مبنى قائم (15 - 25 - 35 - 45 ألف)
    if (area <= 500) {
      return { price: 15000, tierLabel: 'حتى 500 م²' };
    } else if (area <= 1000) {
      return { price: 25000, tierLabel: 'من 500 إلى 1,000 م²' };
    } else if (area <= 2000) {
      return { price: 35000, tierLabel: 'من 1,000 إلى 2,000 م²' };
    } else if (area <= 5000) {
      return { price: 45000, tierLabel: 'من 2,000 إلى 5,000 م²' };
    } else {
      return { price: 55000, tierLabel: '5,000 م² وأكثر' };
    }
  }

  if (buildingType === 'factory') {
    // المصانع - تصحيح وضع مبنى قائم (نصف سعر المخططات: 40 - 55 - 85 - 95 ألف)
    if (area <= 1000) {
      return { price: 40000, tierLabel: 'من 500 إلى 1,000 م²' };
    } else if (area <= 2000) {
      return { price: 55000, tierLabel: 'من 1,000 إلى 2,000 م²' };
    } else if (area <= 3000) {
      return { price: 85000, tierLabel: 'من 2,000 إلى 3,000 م²' };
    } else if (area <= 5000) {
      return { price: 95000, tierLabel: 'من 3,000 إلى 5,000 م²' };
    } else {
      return { price: 115000, tierLabel: '5,000 م² وأكثر' };
    }
  }

  const isResOrComm =
    buildingType !== 'villa' && buildingType !== 'rest_house';

  if (isResOrComm) {
    if (area <= 400) {
      return { price: 20000, tierLabel: 'من 200 إلى 400 م²' };
    } else if (area <= 500) {
      return { price: 24000, tierLabel: 'من 400 إلى 500 م²' };
    } else if (area <= 700) {
      return { price: 30000, tierLabel: 'من 500 إلى 700 م²' };
    } else if (area <= 1000) {
      return { price: 36000, tierLabel: 'من 700 إلى 1,000 م²' };
    } else {
      return { price: 40000, tierLabel: 'أكبر من 1,000 م²' };
    }
  }

  // Villa & rest_house (الفلل والاستراحات)
  if (area <= 400) {
    return { price: 10000, tierLabel: 'من 200 إلى 400 م²' };
  } else if (area <= 500) {
    return { price: 12000, tierLabel: 'من 400 إلى 500 م²' };
  } else if (area <= 700) {
    return { price: 15000, tierLabel: 'من 500 إلى 700 م²' };
  } else if (area <= 1000) {
    return { price: 18000, tierLabel: 'من 700 إلى 1,000 م²' };
  } else {
    return { price: 20000, tierLabel: 'أكبر من 1,000 م²' };
  }
}

/**
 * شرائح أسعار خدمة "تصميم مخططات":
 * - الفنادق:
 *   * 500 إلى 1,000 م²: 60,000 ريال
 *   * 1,000 إلى 2,000 م²: 80,000 ريال
 *   * 2,000 إلى 5,000 م²: 100,000 ريال
 * - محطات الوقود:
 *   * 500 إلى 1,000 م²: 30,000 ريال
 *   * 1,000 إلى 2,000 م²: 50,000 ريال
 *   * 2,000 إلى 3,000 م²: 70,000 ريال
 * - ورش ومستودعات:
 *   * حتى 500 م²: 30,000 ريال
 *   * 500 إلى 1,000 م²: 40,000 ريال
 *   * 1,000 إلى 2,000 م²: 50,000 ريال
 *   * 2,000 إلى 5,000 م²: 60,000 ريال
 * - الفلل والمشاريع العامة:
 *   * من 200 إلى 400 م²: 8,000 ريال 
 *   * من 400 إلى 500 م²: 10,000 ريال 
 *   * من 500 إلى 700 م²: 12,000 ريال 
 *   * من 700 إلى 1,000 م²: 15,000 ريال 
 *   * أكبر من 1,000 م²: 20,000 ريال 
 */
export function getPlanDesignTierPrice(
  area: number,
  buildingType?: BuildingType
): { price: number; tierLabel: string } {
  if (buildingType === 'hotel') {
    if (area <= 1000) {
      return { price: 60000, tierLabel: 'من 500 إلى 1,000 م²' };
    } else if (area <= 2000) {
      return { price: 80000, tierLabel: 'من 1,000 إلى 2,000 م²' };
    } else if (area <= 5000) {
      return { price: 100000, tierLabel: 'من 2,000 إلى 5,000 م²' };
    } else {
      return { price: 120000, tierLabel: '5,000 م² وأكثر' };
    }
  }

  if (buildingType === 'gas_station') {
    // محطات الوقود: مخططات (30 - 50 - 70 ألف)
    if (area <= 1000) {
      return { price: 30000, tierLabel: 'من 500 إلى 1,000 م²' };
    } else if (area <= 2000) {
      return { price: 50000, tierLabel: 'من 1,000 إلى 2,000 م²' };
    } else if (area <= 3000) {
      return { price: 70000, tierLabel: 'من 2,000 إلى 3,000 م²' };
    } else {
      return { price: 90000, tierLabel: '3,000 م² وأكثر' };
    }
  }

  if (buildingType === 'warehouse_workshop') {
    // ورش ومستودعات: مخططات (30 - 40 - 50 - 60 ألف)
    if (area <= 500) {
      return { price: 30000, tierLabel: 'حتى 500 م²' };
    } else if (area <= 1000) {
      return { price: 40000, tierLabel: 'من 500 إلى 1,000 م²' };
    } else if (area <= 2000) {
      return { price: 50000, tierLabel: 'من 1,000 إلى 2,000 م²' };
    } else if (area <= 5000) {
      return { price: 60000, tierLabel: 'من 2,000 إلى 5,000 م²' };
    } else {
      return { price: 75000, tierLabel: '5,000 م² وأكثر' };
    }
  }

  if (buildingType === 'factory') {
    // المصانع: مخططات (نفس أسعار الرخص أقل بـ 10 آلاف: 80 - 110 - 170 - 190 ألف)
    if (area <= 1000) {
      return { price: 80000, tierLabel: 'من 500 إلى 1,000 م²' };
    } else if (area <= 2000) {
      return { price: 110000, tierLabel: 'من 1,000 إلى 2,000 م²' };
    } else if (area <= 3000) {
      return { price: 170000, tierLabel: 'من 2,000 إلى 3,000 م²' };
    } else if (area <= 5000) {
      return { price: 190000, tierLabel: 'من 3,000 إلى 5,000 م²' };
    } else {
      return { price: 230000, tierLabel: '5,000 م² وأكثر' };
    }
  }

  if (area <= 400) {
    return { price: 8000, tierLabel: 'من 200 إلى 400 م²' };
  } else if (area <= 500) {
    return { price: 10000, tierLabel: 'من 400 إلى 500 م²' };
  } else if (area <= 700) {
    return { price: 12000, tierLabel: 'من 500 إلى 700 م²' };
  } else if (area <= 1000) {
    return { price: 15000, tierLabel: 'من 700 إلى 1,000 م²' };
  } else {
    return { price: 20000, tierLabel: 'أكبر من 1,000 م²' };
  }
}

export interface TierDisplayItem {
  range: string;
  price: number;
  active: boolean;
}

export function getTierListForDisplay(
  serviceType: string,
  buildingType: BuildingType,
  area: number
): TierDisplayItem[] {
  if (serviceType === 'plan_design') {
    if (buildingType === 'hotel') {
      return [
        { range: 'من 500 إلى 1,000 م²', price: 60000, active: area <= 1000 },
        { range: 'من 1,000 إلى 2,000 م²', price: 80000, active: area > 1000 && area <= 2000 },
        { range: 'من 2,000 إلى 5,000 م²', price: 100000, active: area > 2000 && area <= 5000 },
        ...(area > 5000 ? [{ range: '5,000 م² وأكثر', price: 120000, active: true }] : []),
      ];
    }

    if (buildingType === 'gas_station') {
      return [
        { range: 'من 500 إلى 1,000 م²', price: 30000, active: area <= 1000 },
        { range: 'من 1,000 إلى 2,000 م²', price: 50000, active: area > 1000 && area <= 2000 },
        { range: 'من 2,000 إلى 3,000 م²', price: 70000, active: area > 2000 && area <= 3000 },
        ...(area > 3000 ? [{ range: '3,000 م² وأكثر', price: 90000, active: true }] : []),
      ];
    }

    if (buildingType === 'warehouse_workshop') {
      return [
        { range: 'حتى 500 م²', price: 30000, active: area <= 500 },
        { range: 'من 500 إلى 1,000 م²', price: 40000, active: area > 500 && area <= 1000 },
        { range: 'من 1,000 إلى 2,000 م²', price: 50000, active: area > 1000 && area <= 2000 },
        { range: 'من 2,000 إلى 5,000 م²', price: 60000, active: area > 2000 && area <= 5000 },
        ...(area > 5000 ? [{ range: '5,000 م² وأكثر', price: 75000, active: true }] : []),
      ];
    }

    if (buildingType === 'factory') {
      return [
        { range: 'من 500 إلى 1,000 م²', price: 80000, active: area <= 1000 },
        { range: 'من 1,000 إلى 2,000 م²', price: 110000, active: area > 1000 && area <= 2000 },
        { range: 'من 2,000 إلى 3,000 م²', price: 170000, active: area > 2000 && area <= 3000 },
        { range: 'من 3,000 إلى 5,000 م²', price: 190000, active: area > 3000 && area <= 5000 },
        ...(area > 5000 ? [{ range: '5,000 م² وأكثر', price: 230000, active: true }] : []),
      ];
    }

    return [
      { range: 'من 200 إلى 400 م²', price: 8000, active: area <= 400 },
      { range: 'من 400 إلى 500 م²', price: 10000, active: area > 400 && area <= 500 },
      { range: 'من 500 إلى 700 م²', price: 12000, active: area > 500 && area <= 700 },
      { range: 'من 700 إلى 1,000 م²', price: 15000, active: area > 700 && area <= 1000 },
      { range: 'أكبر من 1,000 م²', price: 20000, active: area > 1000 },
    ];
  }

  if (serviceType === 'as_built_mod') {
    if (buildingType === 'hotel') {
      return [
        { range: 'حتى 500 م²', price: 40000, active: area <= 500 },
        { range: 'من 500 إلى 1,000 م²', price: 50000, active: area > 500 && area <= 1000 },
        { range: 'من 1,000 إلى 2,000 م²', price: 60000, active: area > 1000 && area <= 2000 },
        { range: 'من 2,000 إلى 5,000 م²', price: 70000, active: area > 2000 && area <= 5000 },
        ...(area > 5000 ? [{ range: '5,000 م² وأكثر', price: 85000, active: true }] : []),
      ];
    }

    if (buildingType === 'gas_station') {
      return [
        { range: 'من 500 إلى 1,000 م²', price: 20000, active: area <= 1000 },
        { range: 'من 1,000 إلى 2,000 م²', price: 30000, active: area > 1000 && area <= 2000 },
        { range: 'من 2,000 إلى 3,000 م²', price: 40000, active: area > 2000 && area <= 3000 },
        ...(area > 3000 ? [{ range: '3,000 م² وأكثر', price: 50000, active: true }] : []),
      ];
    }

    if (buildingType === 'warehouse_workshop') {
      return [
        { range: 'حتى 500 م²', price: 15000, active: area <= 500 },
        { range: 'من 500 إلى 1,000 م²', price: 25000, active: area > 500 && area <= 1000 },
        { range: 'من 1,000 إلى 2,000 م²', price: 35000, active: area > 1000 && area <= 2000 },
        { range: 'من 2,000 إلى 5,000 م²', price: 45000, active: area > 2000 && area <= 5000 },
        ...(area > 5000 ? [{ range: '5,000 م² وأكثر', price: 55000, active: true }] : []),
      ];
    }

    if (buildingType === 'factory') {
      return [
        { range: 'من 500 إلى 1,000 م²', price: 40000, active: area <= 1000 },
        { range: 'من 1,000 إلى 2,000 م²', price: 55000, active: area > 1000 && area <= 2000 },
        { range: 'من 2,000 إلى 3,000 م²', price: 85000, active: area > 2000 && area <= 3000 },
        { range: 'من 3,000 إلى 5,000 م²', price: 95000, active: area > 3000 && area <= 5000 },
        ...(area > 5000 ? [{ range: '5,000 م² وأكثر', price: 115000, active: true }] : []),
      ];
    }

    const isResOrComm = buildingType === 'residential' || buildingType === 'commercial';
    if (isResOrComm) {
      return [
        { range: 'من 200 إلى 400 م²', price: 20000, active: area <= 400 },
        { range: 'من 400 إلى 500 م²', price: 24000, active: area > 400 && area <= 500 },
        { range: 'من 500 إلى 700 م²', price: 30000, active: area > 500 && area <= 700 },
        { range: 'من 700 إلى 1,000 م²', price: 36000, active: area > 700 && area <= 1000 },
        ...(area > 1000 ? [{ range: 'أكبر من 1,000 م²', price: 40000, active: true }] : []),
      ];
    }

    return [
      { range: 'من 200 إلى 400 م²', price: 10000, active: area <= 400 },
      { range: 'من 400 إلى 500 م²', price: 12000, active: area > 400 && area <= 500 },
      { range: 'من 500 إلى 700 م²', price: 15000, active: area > 500 && area <= 700 },
      { range: 'من 700 إلى 1,000 م²', price: 18000, active: area > 700 && area <= 1000 },
      ...(area > 1000 ? [{ range: 'أكبر من 1,000 م²', price: 20000, active: true }] : []),
    ];
  }

  // خدمة تعديل المكونات للفنادق
  if (serviceType === 'component_mod' && buildingType === 'hotel') {
    return [
      { range: 'حتى 500 م²', price: 50000, active: area <= 500 },
      { range: 'من 500 إلى 1,000 م²', price: 60000, active: area > 500 && area <= 1000 },
      { range: 'من 1,000 إلى 2,000 م²', price: 80000, active: area > 1000 && area <= 2000 },
      { range: 'من 2,000 إلى 5,000 م²', price: 100000, active: area > 2000 && area <= 5000 },
      ...(area > 5000 ? [{ range: '5,000 م² وأكثر', price: 130000, active: true }] : []),
    ];
  }

  const discount = 0;

  if (buildingType === 'residential') {
    return [
      { range: 'من 200 إلى 500 م²', price: 50000 - discount, active: area <= 500 },
      { range: 'من 500 إلى 1,000 م²', price: 80000 - discount, active: area > 500 && area <= 1000 },
      { range: 'من 1,000 إلى 2,000 م²', price: 100000 - discount, active: area > 1000 && area <= 2000 },
      { range: 'من 2,000 إلى 5,000 م²', price: 120000 - discount, active: area > 2000 && area <= 5000 },
      ...(area > 5000 ? [{ range: '5,000 م² وأكثر', price: 160000 - discount, active: true }] : []),
    ];
  }

  if (buildingType === 'hotel') {
    return [
      { range: 'حتى 500 م²', price: 70000 - discount, active: area <= 500 },
      { range: 'من 500 إلى 1,000 م²', price: 100000 - discount, active: area > 500 && area <= 1000 },
      { range: 'من 1,000 إلى 2,000 م²', price: 120000 - discount, active: area > 1000 && area <= 2000 },
      { range: 'من 2,000 إلى 5,000 م²', price: 170000 - discount, active: area > 2000 && area <= 5000 },
      ...(area > 5000 ? [{ range: '5,000 م² وأكثر', price: 210000 - discount, active: true }] : []),
    ];
  }

  if (buildingType === 'gas_station') {
    return [
      { range: 'من 500 إلى 1,000 م²', price: 40000 - discount, active: area <= 1000 },
      { range: 'من 1,000 إلى 2,000 م²', price: 60000 - discount, active: area > 1000 && area <= 2000 },
      { range: 'من 2,000 إلى 3,000 م²', price: 80000 - discount, active: area > 2000 && area <= 3000 },
      ...(area > 3000 ? [{ range: '3,000 م² وأكثر', price: 100000 - discount, active: true }] : []),
    ];
  }

  if (buildingType === 'warehouse_workshop') {
    return [
      { range: 'حتى 500 م²', price: 40000 - discount, active: area <= 500 },
      { range: 'من 500 إلى 1,000 م²', price: 60000 - discount, active: area > 500 && area <= 1000 },
      { range: 'من 1,000 إلى 2,000 م²', price: 80000 - discount, active: area > 1000 && area <= 2000 },
      { range: 'من 2,000 إلى 5,000 م²', price: 100000 - discount, active: area > 2000 && area <= 5000 },
      ...(area > 5000 ? [{ range: '5,000 م² وأكثر', price: 130000 - discount, active: true }] : []),
    ];
  }

  if (buildingType === 'factory') {
    return [
      { range: 'من 500 إلى 1,000 م²', price: 90000 - discount, active: area <= 1000 },
      { range: 'من 1,000 إلى 2,000 م²', price: 120000 - discount, active: area > 1000 && area <= 2000 },
      { range: 'من 2,000 إلى 3,000 م²', price: 180000 - discount, active: area > 2000 && area <= 3000 },
      { range: 'من 3,000 إلى 5,000 م²', price: 200000 - discount, active: area > 3000 && area <= 5000 },
      ...(area > 5000 ? [{ range: '5,000 م² وأكثر', price: 240000 - discount, active: true }] : []),
    ];
  }

  if (buildingType === 'commercial') {
    return [
      { range: 'من 200 إلى 500 م²', price: 60000 - discount, active: area <= 500 },
      { range: 'من 500 إلى 1,000 م²', price: 90000 - discount, active: area > 500 && area <= 1000 },
      { range: 'من 1,000 إلى 2,000 م²', price: 110000 - discount, active: area > 1000 && area <= 2000 },
      { range: 'من 2,000 إلى 5,000 م²', price: 160000 - discount, active: area > 2000 && area <= 5000 },
      ...(area > 5000 ? [{ range: '5,000 م² وأكثر', price: 200000 - discount, active: true }] : []),
    ];
  }

  if (buildingType === 'rest_house') {
    return [
      { range: 'من 200 إلى 500 م²', price: 15000 - discount, active: area <= 500 },
      { range: 'من 500 إلى 700 م²', price: 18000 - discount, active: area > 500 && area <= 700 },
      { range: 'من 700 إلى 1,000 م²', price: 20000 - discount, active: area > 700 && area <= 1000 },
      ...(area > 1000
        ? [{ range: 'أكبر من 1,000 م²', price: 25000 - discount, active: true }]
        : [{ range: 'أكبر من 1,000 م²', price: 25000 - discount, active: false }]),
    ];
  }

  // Villa
  return [
    { range: 'من 200 إلى 400 م²', price: 25000 - discount, active: area <= 400 },
    { range: 'من 400 إلى 500 م²', price: 30000 - discount, active: area > 400 && area <= 500 },
    { range: 'من 500 إلى 700 م²', price: 40000 - discount, active: area > 500 && area <= 700 },
    { range: 'من 700 إلى 1,000 م²', price: 50000 - discount, active: area > 700 && area <= 1000 },
    ...(area > 1000 ? [{ range: 'أكبر من 1,000 م²', price: 60000 - discount, active: true }] : []),
  ];
}

/**
 * أسعار رخصة ترميم مبنى الثابتة:
 * - الفنادق: 5,000 ريال ثابت
 * - الفلل والاستراحات: 2,000 ريال ثابت
 * - العمائر السكنية والتجارية والمشاريع المتنوعة: 3,000 ريال ثابت
 */
export function getRenovationFixedPrice(buildingType: BuildingType): number {
  if (buildingType === 'hotel') return 5000;
  return buildingType === 'villa' || buildingType === 'rest_house' ? 2000 : 3000;
}

/**
 * أسعار رخصة الهدم الثابتة:
 * - الفنادق: 3,000 ريال ثابت
 * - محطات الوقود والورش والمستودعات والمصانع: 2,000 ريال ثابت
 * - الفلل والعمائر والمشاريع الأخرى: 1,000 ريال ثابت
 */
export function getDemolitionFixedPrice(buildingType: BuildingType): number {
  if (buildingType === 'hotel') return 3000;
  if (
    buildingType === 'gas_station' ||
    buildingType === 'warehouse_workshop' ||
    buildingType === 'factory'
  ) {
    return 2000;
  }
  return 1000;
}

/**
 * Supervision pricing for building license:
 * - مقطوع (10 زيارات أعمال عظم):
 *   * الفلل:
 *     - من 0 إلى 500 م²: 16,000 ريال
 *     - من 500 إلى 1,000 م²: 20,000 ريال
 *     - أكبر من 1,000 م² (>1000): 25,000 ريال
 *   * السكني (العمائر السكنية):
 *     - من 0 إلى 500 م²: 20,000 ريال
 *     - من 500 إلى 1,000 م²: 25,000 ريال
 *     - أكبر من 1,000 م²: 30,000 ريال
 *   * التجاري (المباني التجارية):
 *     - من 0 إلى 500 م²: 25,000 ريال
 *     - من 500 إلى 1,000 م²: 30,000 ريال
 *     - أكبر من 1,000 م²: 35,000 ريال
 *
 * - إشراف شهري كامل:
 *   * اقل من 500 م: 18000 ريال
 *   * من 500 الى 1000 م: 22000 ريال
 *   * من 1000 الى 2000 م: 26000 ريال
 *   * اكبر من 2000 م: 32000 ريال
 */
export function getSupervisionPrice(
  type: 'lump_sum' | 'monthly',
  area: number,
  buildingType: BuildingType = 'villa'
): { price: number; label: string } {
  if (type === 'lump_sum') {
    if (buildingType === 'villa') {
      if (area <= 500) return { price: 16000, label: 'إشراف مقطوع فلل (من 0 إلى 500 م²)' };
      if (area <= 1000) return { price: 20000, label: 'إشراف مقطوع فلل (من 500 إلى 1,000 م²)' };
      return { price: 25000, label: 'إشراف مقطوع فلل (أكبر من 1,000 م²)' };
    }
    if (buildingType === 'commercial') {
      if (area <= 500) return { price: 25000, label: 'إشراف مقطوع تجاري (من 0 إلى 500 م²)' };
      if (area <= 1000) return { price: 30000, label: 'إشراف مقطوع تجاري (من 500 إلى 1,000 م²)' };
      return { price: 35000, label: 'إشراف مقطوع تجاري (أكبر من 1,000 م²)' };
    }
    // residential
    if (area <= 500) return { price: 20000, label: 'إشراف مقطوع سكني (من 0 إلى 500 م²)' };
    if (area <= 1000) return { price: 25000, label: 'إشراف مقطوع سكني (من 500 إلى 1,000 م²)' };
    return { price: 30000, label: 'إشراف مقطوع سكني (أكبر من 1,000 م²)' };
  } else {
    if (area < 500) return { price: 18000, label: 'إشراف شهري كامل - مساحة < 500م²' };
    if (area <= 1000) return { price: 22000, label: 'إشراف شهري كامل - مساحة 500-1000م²' };
    if (area <= 2000) return { price: 26000, label: 'إشراف شهري كامل - مساحة 1000-2000م²' };
    return { price: 32000, label: 'إشراف شهري كامل - مساحة > 2000م²' };
  }
}

/**
 * Decor pricing rules:
 * - اقل من 200 متر: لا توجد شريحة سعرية ثابتة في اللائحة (السعر يدوياً حسب الاتفاق)
 * - من 200 الى 1000 متر:
 *   * مودرن: المساحة × 60
 *   * نيو كلاسيك: المساحة × 80
 *   * كلاسيك: المساحة × 100
 * - من 1000 الى 2000 متر:
 *   * مودرن: المساحة × 50
 *   * نيو كلاسيك: المساحة × 70
 *   * كلاسيك: المساحة × 90
 * - اكبر من 2000 متر:
 *   * مودرن: المساحة × 40
 *   * نيو كلاسيك: المساحة × 60
 *   * كلاسيك: المساحة × 80
 */
export function calculateDecorPrice(style: 'modern' | 'neoclassic' | 'classic', area: number): {
  total: number;
  ratePerMeter?: number;
  formulaDescription: string;
  tierDescription: string;
  isManual?: boolean;
} {
  const safeArea = Math.max(1, area);

  if (safeArea < 200) {
    return {
      total: 0,
      formulaDescription: 'تسعير يدوي حسب الاتفاق (أقل من 200 م²)',
      tierDescription: 'أقل من 200 م² (تسعير يدوي)',
      isManual: true,
    };
  } else if (safeArea <= 1000) {
    let rate = 60;
    if (style === 'neoclassic') rate = 80;
    if (style === 'classic') rate = 100;
    const total = safeArea * rate;
    return {
      total,
      ratePerMeter: rate,
      formulaDescription: `${safeArea} م² × ${rate} ريال/م²`,
      tierDescription: 'من 200 م² إلى 1,000 م²',
      isManual: false,
    };
  } else if (safeArea <= 2000) {
    let rate = 50;
    if (style === 'neoclassic') rate = 70;
    if (style === 'classic') rate = 90;
    const total = safeArea * rate;
    return {
      total,
      ratePerMeter: rate,
      formulaDescription: `${safeArea} م² × ${rate} ريال/م²`,
      tierDescription: 'من 1,000 م² إلى 2,000 م²',
      isManual: false,
    };
  } else {
    let rate = 40;
    if (style === 'neoclassic') rate = 60;
    if (style === 'classic') rate = 80;
    const total = safeArea * rate;
    return {
      total,
      ratePerMeter: rate,
      formulaDescription: `${safeArea} م² × ${rate} ريال/م²`,
      tierDescription: 'أكبر من 2,000 م²',
      isManual: false,
    };
  }
}

/**
 * Configuration and metadata for formula-based design pricing:
 * 1. الفلل: 150 ريال/م² عند 200 م² إلى 75 ريال/م² عند 2,000 م²
 * 2. العمائر السكنية: 200 ريال/م² عند 400 م² إلى 100 ريال/م² عند 2,000 م²
 * 3. العمائر التجارية: 200 ريال/م² عند 400 م² إلى 30 ريال/م² عند 10,000 م²
 */
export interface FormulaPricingConfig {
  buildingType: BuildingType;
  buildingLabel: string;
  minArea: number;
  maxArea: number;
  maxRate: number; // Highest rate per m² (at minArea)
  minRate: number; // Lowest rate per m² (at maxArea)
  description: string;
}

export const DESIGN_FORMULA_CONFIGS: Record<BuildingType, FormulaPricingConfig> = {
  villa: {
    buildingType: 'villa',
    buildingLabel: 'تصميم الفلل',
    minArea: 200,
    maxArea: 2000,
    maxRate: 150,
    minRate: 75,
    description: 'الأسعار مبنية على 150 ريال/م² عند 200 م² و75 ريال/م² عند 2,000 م².',
  },
  residential: {
    buildingType: 'residential',
    buildingLabel: 'تصميم العمائر السكنية',
    minArea: 400,
    maxArea: 2000,
    maxRate: 200,
    minRate: 100,
    description: 'التسعير يعتمد على 200 ريال/م² عند 400 م² و100 ريال/م² عند 2,000 م².',
  },
  commercial: {
    buildingType: 'commercial',
    buildingLabel: 'تصميم العمائر التجارية',
    minArea: 400,
    maxArea: 10000,
    maxRate: 200,
    minRate: 30,
    description: 'التسعير يبدأ من 200 ريال/م² عند 400 م² وينتهي عند 30 ريال/م² عند 10,000 م².',
  },
  rest_house: {
    buildingType: 'rest_house',
    buildingLabel: 'تصميم الاستراحات والشاليهات',
    minArea: 200,
    maxArea: 2000,
    maxRate: 150,
    minRate: 75,
    description: 'الأسعار مبنية على 150 ريال/م² عند 200 م² و75 ريال/م² عند 2,000 م².',
  },
  hotel: {
    buildingType: 'hotel',
    buildingLabel: 'تصميم الفنادق والضيافة',
    minArea: 400,
    maxArea: 10000,
    maxRate: 200,
    minRate: 40,
    description: 'التسعير يبدأ من 200 ريال/م² عند 400 م² وينتهي عند 40 ريال/م² عند 10,000 م².',
  },
  gas_station: {
    buildingType: 'gas_station',
    buildingLabel: 'تصميم محطات الوقود والخدمات',
    minArea: 400,
    maxArea: 5000,
    maxRate: 200,
    minRate: 50,
    description: 'التسعير يبدأ من 200 ريال/م² عند 400 م² وينتهي عند 50 ريال/م² عند 5,000 م².',
  },
  factory: {
    buildingType: 'factory',
    buildingLabel: 'تصميم المصانع والمنشآت الصناعية',
    minArea: 500,
    maxArea: 10000,
    maxRate: 180,
    minRate: 30,
    description: 'التسعير يبدأ من 180 ريال/م² عند 500 م² وينتهي عند 30 ريال/م² عند 10,000 م².',
  },
  warehouse_workshop: {
    buildingType: 'warehouse_workshop',
    buildingLabel: 'تصميم الورش والمستودعات',
    minArea: 500,
    maxArea: 10000,
    maxRate: 160,
    minRate: 25,
    description: 'التسعير يبدأ من 160 ريال/م² عند 500 م² وينتهي عند 25 ريال/م² عند 10,000 م².',
  },
};

export interface FormulaCalculationResult {
  totalPrice: number;
  ratePerMeter: number;
  areaStatus: 'within_range' | 'below_min' | 'above_max';
  areaStatusLabel: string;
  minArea: number;
  maxArea: number;
  maxRate: number;
  minRate: number;
  totalAtMin: number;
  totalAtMax: number;
  slope: number;
}

export function calculateDesignFormulaPrice(
  buildingType: BuildingType,
  area: number,
  customParams?: Partial<{ maxRate: number; minRate: number; minArea: number; maxArea: number }>
): FormulaCalculationResult {
  const config = DESIGN_FORMULA_CONFIGS[buildingType];
  const minArea = customParams?.minArea ?? config.minArea;
  const maxArea = customParams?.maxArea ?? config.maxArea;
  const maxRate = customParams?.maxRate ?? config.maxRate;
  const minRate = customParams?.minRate ?? config.minRate;

  const totalAtMin = minArea * maxRate;
  const totalAtMax = maxArea * minRate;
  const slope = (totalAtMax - totalAtMin) / (maxArea - minArea);

  let areaStatus: 'within_range' | 'below_min' | 'above_max' = 'within_range';
  let areaStatusLabel = 'ضمن النطاق المسموح';

  if (area < minArea) {
    areaStatus = 'below_min';
    areaStatusLabel = `أقل من الحد الأدنى المسموح (${minArea} م²)`;
  } else if (area > maxArea) {
    areaStatus = 'above_max';
    areaStatusLabel = `أكبر من الحد الأقصى المسموح (${maxArea.toLocaleString('ar-SA')} م²)`;
  }

  // Calculate total price:
  let totalPrice: number;
  if (area <= minArea) {
    totalPrice = totalAtMin;
  } else if (area >= maxArea) {
    totalPrice = totalAtMax + (area - maxArea) * minRate;
  } else {
    totalPrice = totalAtMin + (area - minArea) * slope;
  }

  totalPrice = Math.round(totalPrice * 100) / 100;
  const ratePerMeter = area > 0 ? Math.round((totalPrice / area) * 100) / 100 : 0;

  return {
    totalPrice,
    ratePerMeter,
    areaStatus,
    areaStatusLabel,
    minArea,
    maxArea,
    maxRate,
    minRate,
    totalAtMin,
    totalAtMax,
    slope,
  };
}

/**
 * ========================================================
 * قسم الإشراف وإدارة المشاريع (قسم منفصل عن التنفيذ)
 * البنود الأربعة الرئيسية:
 * 1. إشراف بلدية (منصة بلدي وكود البناء السعودي)
 * 2. إشراف عام (إشراف استشاري موقع واستلامات مقاولين)
 * 3. إدارة مشروع (تخطيط، جداول زمنية، مراقبة تكاليف ومستخلصات)
 * 4. تقرير أضرار (فحص تصدعات، هبوط، شروخ، تسربات، وشهادات معتمدة)
 * ========================================================
 */

export interface SupervisionItemDef {
  id: 'balady' | 'general' | 'project_management' | 'damage_report';
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  deliverables: string[];
  pricingModes: {
    id: string;
    label: string;
    defaultPrice: number;
    unitLabel?: string;
  }[];
}

export const SUPERVISION_DEPARTMENT_ITEMS: SupervisionItemDef[] = [
  {
    id: 'balady',
    name: 'إشراف بلدية (منصة بلدي وكود البناء السعودي)',
    shortName: 'إشراف بلدية',
    tagline: 'مطابقة الكود السعودي واعتماد مراحل الصب ورفع التقارير عبر بلدي',
    description:
      'إشراف هندسي نظامي معتمد متوافق مع متطلبات أمانة المنطقة ومنصة بلدي، يتضمن التفتيش الدوري واستلام مراحل البناء وإصدار شهادة الإشراف وإتمام البناء ورخصة الإشغال.',
    deliverables: [
      'استلام أعمال الحفر وتحديد المناسيب والحدود',
      'استلام ومطابقة حديد تسليح الأساسات والقواعد ورقاب الأعمدة',
      'استلام حديد ونجارة الميدة والصبات الخرسانية',
      'استلام حديد الأعمدة وجدران القص وحوائط المصاعد',
      'استلام حديد ونجارة الأسقف والكمرات الخرسانية لكافة الأدوار',
      'استلام عوازل الأساسات والمباني والأسطح',
      'رفع التقارير الميدانية والصور المعتمدة على منصة بلدي بعد كل مرحلة صب',
      'إصدار التقرير الفني النهائي وشهادة الإشراف لرخصة الإشغال',
    ],
    pricingModes: [
      { id: 'tier', label: 'باقة مقطوعة حسب شريحة المساحة', defaultPrice: 20000, unitLabel: 'للمشروع' },
      { id: 'per_stage', label: 'تسعير حسب عدد الزيارات/المراحل الإلزامية', defaultPrice: 2000, unitLabel: 'لكل مرحلة صب' },
      { id: 'custom', label: 'سعر مخصص محدد يدوياً', defaultPrice: 20000, unitLabel: 'مخصص' },
    ],
  },
  {
    id: 'general',
    name: 'إشراف عام (استشاري هندسي شامل ومستمر)',
    shortName: 'إشراف عام',
    tagline: 'متابعة هندسية دقيقة للمقاولين وجودة المواد واستلامات فنية دورية',
    description:
      'إشراف استشاري فني متكامل للموقع لمراقبة كافة بنود الأعمال الإنشائية والمعمارية والميكانيكية والكهربائية، وتدقيق التزام المقاولين بالمخططات وجودة المواد الموردة.',
    deliverables: [
      'حضور مهندس مدني / استشاري مختص للموقع أثناء الأعمال الحيوية',
      'تدقيق مطابقة المخططات الهندسية مع الواقع ورصد أي تعارضات',
      'استلام حديد التسليح والنجارة والمناسيب وتأكيد نسب خلط الخرسانة',
      'استلام تمديدات الكهرباء، السباكة، والصرف، والتكييف قبل الصب',
      'فحص واختبار العزل المائي للأسطح وخزانات المياه ودورات المياه',
      'متابعة أعمال المباني واللياسة والدهانات والتشطيبات المعمارية',
      'إصدار محاضر استلام موقعية رسمية وإشعارات عدم مطابقة للمقاول',
      'تقارير دورية موثقة بالصور لإطلاع المالك على جودة ونسب الإنجاز',
    ],
    pricingModes: [
      { id: 'monthly', label: 'إشراف شهري مستمر (فلل: 12k / سكني: 16k / تجاري: 18k)', defaultPrice: 12000, unitLabel: 'ريال / شهرياً' },
      { id: 'bone_stage', label: 'مقطوع مرحلة العظم بالكامل', defaultPrice: 16000, unitLabel: 'مقطوع عظم' },
      { id: 'finish_stage', label: 'مقطوع مرحلة التشطيبات', defaultPrice: 14000, unitLabel: 'مقطوع تشطيب' },
      { id: 'per_visit', label: 'تسعير بالزيارة الميدانية المحددة', defaultPrice: 800, unitLabel: 'لكل زيارة' },
      { id: 'custom', label: 'سعر مخصص محدد يدوياً', defaultPrice: 20000, unitLabel: 'مخصص' },
    ],
  },
  {
    id: 'project_management',
    name: 'إدارة مشروع (Project Management)',
    shortName: 'إدارة مشروع',
    tagline: 'إدارة الوقت والميزانية والمقاولين وضبط الجودة الشاملة من البداية للتسليم',
    description:
      'إدارة هندسية احترافية للمشروع تضمن التحكم في الجدول الزمني، تدقيق المستخلصات، دراسة عروض أسعار المقاولين والموردين، وضبط ميزانية المشروع دون تجاوزات وتفادي التأخيرات.',
    deliverables: [
      'إعداد الجدول الزمني التفصيلي للمشروع (Critical Path Method)',
      'مراجعة وتدقيق المستخلصات الشهرية وفواتير مقاولي التنفيذ والموردين',
      'إعداد كراسات الشروط والمواصفات وتحليل عروض الأسعار والمناقصات',
      'إدارة التغييرات وأوامر التعديل وحصر الفروقات المالية (Variation Orders)',
      'التنسيق الشامل بين فرق العمل ومقاولي الباطن والجهات الإشرافية',
      'مراقبة تكاليف المشروع وتحديث التدفقات النقدية (Cash Flow Forecasting)',
      'إدارة المخاطر وتجنب التعثرات أو التأخيرات في التوريد والعمليات',
      'إصدار تقارير تنفيذية شاملة للوحة التحكم ومتابعة نسب الإنجاز الفعلي',
    ],
    pricingModes: [
      { id: 'monthly_pm', label: 'إدارة شهرية للمشروع (فلل: 18k / سكني: 22k / تجاري: 25k)', defaultPrice: 18000, unitLabel: 'ريال / شهرياً' },
      { id: 'lump_sum_pm', label: 'مبلغ مقطوع ثابت لإدارة المشروع (فلل: 18k / سكني: 22k / تجاري: 25k)', defaultPrice: 18000, unitLabel: 'للمشروع' },
      { id: 'percentage_pm', label: 'نسبة مئوية من قيمة المشروع التقديرية (5% - 8%)', defaultPrice: 35000, unitLabel: 'نسبة تقديرية' },
      { id: 'custom', label: 'سعر مخصص محدد يدوياً', defaultPrice: 18000, unitLabel: 'مخصص' },
    ],
  },
  {
    id: 'damage_report',
    name: 'تقرير أضرار وفحص مباني (تقرير هندسي استشاري معتمد)',
    shortName: 'تقرير أضرار',
    tagline: 'فحص التصدعات والشروخ والهبوط والتسربات وحلول التدعيم والترميم المعتمدة (1,500 - 3,000 ر.س)',
    description:
      'معاينة هندسية ميدانية متخصصة لتشخيص العيوب الإنشائية والمعمارية للمبنى القائم، وتحديد مدى خطورتها وأسبابها، مع وضع الحلول الفنية والإنشائية للمعالجة والتدعيم بتقرير رسمي مختوم.',
    deliverables: [
      'معاينة بصرية وهندسية دقيقة لجميع عناصر المبنى (أساسات، أعمدة، أسقف، كمرات، جدران)',
      'رصد وتصنيف الشروخ والتصدعات (إنشائية خطيرة، شعرية، شروخ ترييح أو انكماش)',
      'فحص هبوط القواعد والأساسات ومناسيب الأرضيات والأسوار المحيطة',
      'الكشف عن تسربات المياه والرطوبة وتلف العوازل في الأسطح والمسابح والخزانات',
      'فحص صدأ وتآكل حديد التسليح وتفتت الغطاء الخرساني (Spalling)',
      'تحديد الأسباب الجذرية ودرجة خطورة المبنى على السلامة العامة',
      'تقديم التوصيات والحلول الهندسية وجدول خطوات التدعيم والترميم المعتمدة',
      'إصدار تقرير هندسي استشاري معتمد ومختوم بختم المكتب لتقديمه للجهات المختصة أو المحاكم أو الملاك',
    ],
    pricingModes: [
      { id: 'villa_report', label: 'تقرير فحص ومعاينة أضرار فيلا سكنية', defaultPrice: 1500, unitLabel: 'للفيلا' },
      { id: 'building_report', label: 'تقرير أضرار عمارة سكنية / تجارية', defaultPrice: 2200, unitLabel: 'للعمارة' },
      { id: 'commercial_report', label: 'تقرير أضرار منشأة كبرى / مستودع / مجمع', defaultPrice: 2800, unitLabel: 'للمنشأة' },
      { id: 'advanced_ndt', label: 'تقرير شامل مع فحوصات واختبارات هندسية متقدمة بالموقع', defaultPrice: 3000, unitLabel: 'تقرير متقدم' },
      { id: 'custom', label: 'سعر مخصص محدد يدوياً (1,500 - 3,000 ريال)', defaultPrice: 2000, unitLabel: 'مخصص' },
    ],
  },
];

/**
 * Calculates municipal (balady) supervision tier pricing:
 * الفلل:
 * - من 0 إلى 500 م²: 16,000 ريال
 * - من 500 إلى 1,000 م²: 20,000 ريال
 * - أكبر من 1,000 م² (>1000): 25,000 ريال
 *
 * السكني:
 * - من 0 إلى 500 م²: 20,000 ريال
 * - من 500 إلى 1,000 م²: 25,000 ريال
 * - أكبر من 1,000 م²: 30,000 ريال
 *
 * التجاري:
 * - من 0 إلى 500 م²: 25,000 ريال
 * - من 500 إلى 1,000 م²: 30,000 ريال
 * - أكبر من 1,000 م²: 35,000 ريال
 */
export function getBaladySupervisionTierPrice(
  area: number,
  buildingType: BuildingType = 'villa'
): { price: number; tierLabel: string } {
  if (buildingType === 'commercial') {
    if (area <= 500) {
      return { price: 25000, tierLabel: 'تجاري من 0 إلى 500 م²' };
    } else if (area <= 1000) {
      return { price: 30000, tierLabel: 'تجاري من 500 إلى 1,000 م²' };
    } else {
      return { price: 35000, tierLabel: 'تجاري أكبر من 1,000 م²' };
    }
  }

  if (buildingType === 'residential') {
    if (area <= 500) {
      return { price: 20000, tierLabel: 'سكني من 0 إلى 500 م²' };
    } else if (area <= 1000) {
      return { price: 25000, tierLabel: 'سكني من 500 إلى 1,000 م²' };
    } else {
      return { price: 30000, tierLabel: 'سكني أكبر من 1,000 م²' };
    }
  }

  // Villa (الفلل):
  if (area <= 500) {
    return { price: 16000, tierLabel: 'فلل من 0 إلى 500 م²' };
  } else if (area <= 1000) {
    return { price: 20000, tierLabel: 'فلل من 500 إلى 1,000 م²' };
  } else {
    return { price: 25000, tierLabel: 'فلل أكبر من 1,000 م²' };
  }
}
