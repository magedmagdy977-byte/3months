import {
  MasterTemplateScopeFlags,
  MasterTemplateExclusions,
  CustomScopeOverride,
  BankAccountDetails,
  PaymentMilestone,
  QuotationItem,
  ClientInfo,
  CompanyId,
} from '../types';
import { generateQuoteNumber, getTodayDateString } from '../utils/formatters';
import { getCompanyProfile, getSavedActiveCompanyId } from './companies';

// 1. Definition of each conditional scope unit (ثالثًا: نطاق أعمال الاستشاري — وحدات شرطية)
export interface MasterScopeItemDef {
  id: keyof MasterTemplateScopeFlags;
  tag: string;
  name: string;
  category: 'license' | 'design' | 'supervision' | 'special';
  description: string;
}

export const MASTER_SCOPE_DEFINITIONS: MasterScopeItemDef[] = [
  {
    id: 'survey',
    tag: '{{IF:رفع_مساحي}}',
    name: 'الرفع المساحي',
    category: 'license',
    description: 'إعداد التقرير والرفع المساحي لمناسيب الأرض الطبيعية والشوارع المحيطة، وفق نطاق المشروع.',
  },
  {
    id: 'architectural',
    tag: '{{IF:معماري}}',
    name: 'التصاميم المعمارية',
    category: 'design',
    description: 'إعداد المخططات الابتدائية، الموقع العام، المساقط الأفقية مع الفرش، ثم المخططات النهائية والتنفيذية والواجهات والقطاعات والمناظير الخارجية ثلاثية الأبعاد حسب نطاق المشروع والأسوار الخارجية.',
  },
  {
    id: 'structural',
    tag: '{{IF:إنشائي}}',
    name: 'المخططات الإنشائية',
    category: 'design',
    description: 'إعداد مخططات المحاور والأعمدة والأساسات والأسقف والسلالم والخزانات والتفاصيل والجداول الإنشائية اللازمة للمشروع.',
  },
  {
    id: 'electrical',
    tag: '{{IF:كهرباء}}',
    name: 'المخططات الكهربائية',
    category: 'design',
    description: 'إعداد مخططات اللوحات الرئيسية والفرعية والقوى والإنارة والتيار الخفيف ومسارات الكابلات والتأريض وموانع الصواعق حسب متطلبات المشروع.',
  },
  {
    id: 'hvac',
    tag: '{{IF:تكييف}}',
    name: 'مخططات التكييف والتهوية',
    category: 'design',
    description: 'حساب الأحمال الحرارية وإعداد مخططات وحدات التكييف والدكت ومراوح الشفط والتهوية حسب نطاق المشروع.',
  },
  {
    id: 'plumbing',
    tag: '{{IF:صحي}}',
    name: 'مخططات الصرف الصحي (السباكة)',
    category: 'design',
    description: 'إعداد مخططات الصرف الصحي وصرف الأمطار والتغذية المائية والخزانات وشبكاتها وحساب أحمال المضخات حسب نطاق المشروع.',
  },
  {
    id: 'civilDefense',
    tag: '{{IF:دفاع_مدني}}',
    name: 'مخططات الأمن والسلامة',
    category: 'license',
    description: 'إعداد مخططات أنظمة السلامة والإطفاء المطلوبة للمشروع ومتابعة إجراءات الاعتماد وفق نطاق الخدمة المتفق عليه.',
  },
  {
    id: 'buildingLicense',
    tag: '{{IF:رخصة}}',
    name: 'إصدار رخصة البناء',
    category: 'license',
    description: 'إعداد واستكمال الأعمال الهندسية الداخلة ضمن نطاق المكتب الاستشاري والتقديم والمتابعة لإصدار رخصة البناء وفق متطلبات الجهات المختصة.',
  },
  {
    id: 'asBuiltCorrection',
    tag: '{{IF:تصحيح_وضع}}',
    name: 'تصحيح وضع مبنى قائم',
    category: 'special',
    description: 'إعداد التقرير الخاص بالمبنى وشهادة التحمل ومخططات الوضع القائم والتقديم على خدمة تصحيح وضع مبنى قائم، وفق نطاق العمل المعتمد.',
  },
  {
    id: 'modifyComponents',
    tag: '{{IF:تعديل_مكونات}}',
    name: 'تعديل مكونات البناء',
    category: 'special',
    description: 'مراجعة الرخصة والمخططات القائمة وإعداد المخططات والتعديلات الهندسية المطلوبة والتقديم على إجراء تعديل مكونات البناء وفق نطاق التعديل المعتمد.',
  },
  {
    id: 'supervision',
    tag: '{{IF:إشراف}}',
    name: 'الإشراف الهندسي',
    category: 'supervision',
    description: 'إدارة ومتابعة الأعمال فنيًا، ومتابعة الجودة والاستلامات وفق المخططات المعتمدة ونطاق الإشراف وعدد الزيارات المتفق عليه.',
  },
];

// 2. Definition of owner obligations (رابعًا: التزامات المالك)
export const GENERAL_OWNER_OBLIGATIONS = [
  'تزويد الاستشاري بالمستندات والبيانات المطلوبة لتنفيذ نطاق العمل.',
  'اعتماد المراحل والتصاميم في المواعيد المطلوبة.',
  'سداد أتعاب الاستشاري وفق جدول الدفعات المعتمد.',
  'سداد الرسوم الحكومية ورسوم الجهات ذات العلاقة.',
  'توفير التقارير والمستندات والمتطلبات التي تقع مسؤولية توفيرها على المالك.',
];

export const CONDITIONAL_OWNER_OBLIGATIONS = {
  modifyComponents: 'تزويد الاستشاري بنسخة من رخصة البناء القائمة والمخططات والمستندات اللازمة لإجراء التعديل.',
  supervision: 'تزويد الاستشاري برخصة البناء والمخططات المعتمدة وعقد المقاول والجدول الزمني، والتنسيق المسبق لمواعيد الزيارات والاستلامات.',
};

// 3. Exclusions definitions (سابعًا: الأعمال غير المشمولة)
export const EXCLUSION_CLAUSES = {
  excludeGovFees: 'لا تشمل الأتعاب الرسوم الحكومية أو رسوم الجهات ذات العلاقة.',
  excludeSupervision: 'لا يشمل هذا العرض أعمال الإشراف الهندسي على التنفيذ.',
  excludeQuantities: 'لا يشمل هذا العرض إعداد حصر أو حساب الكميات.',
  excludeCivilDefense: 'لا يشمل هذا العرض إعداد أو اعتماد مخططات الدفاع المدني.',
  excludeSoilTest: 'لا يشمل العرض تكلفة فحص التربة.',
  excludeInsurance: 'لا يشمل العرض تكلفة التأمين ضد العيوب الخفية.',
};

// 4. Default bank details
export const DEFAULT_BANK_DETAILS: BankAccountDetails = {
  bankName: 'البنك السعودي للاستثمار',
  accountName: 'شركة الرؤية المضيئة للاستشارات الهندسية',
  iban: 'SA83 6500 0000 1383 4937 6001',
  accountNumber: '0138-349376-001',
};

// 5. Default initial ClientInfo
export function getDefaultClientInfo(companyId?: CompanyId): ClientInfo {
  const activeCompanyId = companyId || getSavedActiveCompanyId();
  const company = getCompanyProfile(activeCompanyId);
  return {
    companyId: activeCompanyId,
    proposalNumber: generateQuoteNumber(),
    date: getTodayDateString(),
    clientName: '',
    nationalId: '',
    buildingType: 'فيلا سكنية',
    isDuplex: false,
    projectCity: 'الرياض',
    district: '',
    locationZone: 'none',
    plotNumber: '',
    planNumber: '',
    blockNumber: '',
    deedNumber: '',
    deedDate: '',
    deedRestrictions: '',
    borders: '',
    landArea: 600,
    buildingArea: 1008, // مساحة الأرض × 1.68 (600 × 1.68)
    serviceType: 'إصدار رخصة بناء وتصاميم هندسية',
    projectTitle: 'مشروع فيلا سكنية خاصة',
    phone: '',
    email: '',
    notes: '',

    executionDurationDays: 45,
    startDateNotice: 'من سداد الدفعة واعتماد المخططات المعمارية والواجهات',
    revisionCountText: 'تعديلان (2)',
    validityDays: 30,
    marketingRightsText: 'يحق للاستشاري توثيق ونشر لقطات وتصاميم المشروع ضمن المعرض الترويجي والمهني دون الإخلال ببيانات المالك الشخصية.',

    scopeFlags: {
      survey: true,
      architectural: true,
      structural: true,
      electrical: true,
      hvac: true,
      plumbing: true,
      civilDefense: false,
      buildingLicense: true,
      asBuiltCorrection: false,
      modifyComponents: false,
      supervision: false,
    },

    exclusions: {
      excludeSupervision: true,
      excludeQuantities: true,
      excludeCivilDefense: true,
      excludeGovFees: true,
      excludeSoilTest: false,
      excludeInsurance: true,
      customExclusions: '',
    },

    paymentScheduleType: 'design_standard',
    bankDetails: { ...company.defaultBankDetails },

    includeTax: false,
    discountType: 'percentage',
    discountValue: 20,
  };
}

export const DECOR_SCOPE_DEFINITIONS: Array<{
  id: keyof MasterTemplateScopeFlags;
  tag: string;
  name: string;
  description: string;
}> = [
  {
    id: 'decor_as_built',
    tag: '{{IF:رفع_مساحي_ديكور}}',
    name: 'رفع مساحي As-Built للموقع',
    description: 'معاينة ورفع مساحي دقيق للموقع والفراغات الداخلية على الطبيعة ومطابقة الأبعاد والمناسيب الفعلية.',
  },
  {
    id: 'decor_moodboard',
    tag: '{{IF:مود_بورد}}',
    name: 'لوحة أفكار ومود بورد (Moodboard)',
    description: 'إعداد لوحات الأفكار التوجيهية وتناسق الألوان والخامات والتوجه التصميمي العام للفراغات الداخلية.',
  },
  {
    id: 'decor_3d_renders',
    tag: '{{IF:مناظير_3D}}',
    name: 'لقطات وتصاميم ثلاثية الأبعاد (3D Renders)',
    description: 'إعداد المناظير واللقطات الواقعية ثلاثية الأبعاد عالية الدقة لكافة الفراغات المشمولة بالتصميم الداخلي.',
  },
  {
    id: 'decor_shop_drawings',
    tag: '{{IF:مخططات_تنفيذية_ديكور}}',
    name: 'المخططات التنفيذية التفصيلية (Shop Drawings)',
    description: 'إعداد المخططات التنفيذية لتوزيع الأثاث، الأسقف المستعارة، الإنارة، الأرضيات، وتفاصيل الجدران والنجارة.',
  },
  {
    id: 'decor_specifications',
    tag: '{{IF:جداول_المواصفات}}',
    name: 'جداول المواصفات واختيار المواد (Specifications)',
    description: 'إعداد جداول توصيف المواد والتشطيبات والألوان وعينات الخامات المعتمدة للتنفيذ.',
  },
  {
    id: 'decor_boq',
    tag: '{{IF:جداول_الكميات}}',
    name: 'جداول الكميات وحصر المواد (BOQ)',
    description: 'إعداد قوائم وجداول حصر الكميات والمواد اللازمة لتنفيذ أعمال التصميم الداخلي والديكور.',
  },
];

// Quick-add suggestion chips tailored to every conditional scope item
export const SCOPE_QUICK_CHIPS: Partial<Record<keyof MasterTemplateScopeFlags, string[]>> = {
  survey: [
    'تحديد الزوايا والبتر المساحية على الطبيعة',
    'رفع مناسيب الشوارع والمباني المجاورة',
    'تحديث الصك الإلكتروني والرفع المساحي عبر بلدي',
    'مخطط طبوغرافي ومناسيب الحفر والردم',
  ],
  architectural: [
    'تصميم الحدائق واللاندسكيب',
    'تصميم الأسوار الخارجية والبوابات',
    'المناظير الخارجية ثلاثية الأبعاد (3D)',
    'جداول الأبواب والشبابيك والتشطيبات',
    'تفاصيل الملاحق الخارجية والمسبح',
    'دراسة توزيع الفرش والأثاث المعماري',
  ],
  structural: [
    'مخططات القبو والجدران الاستنادية',
    'تصميم إنشائي للمسبح والخزانات الأرضية',
    'تصميم الأسوار الخارجية إنشائياً',
    'جداول حصر كميات الحديد والخرسانة',
  ],
  electrical: [
    'نظام المنزل الذكي (Smart Home)',
    'تأسيس شاحن السيارات الكهربائية (EV)',
    'مخططات كاميرات المراقبة والإنتركوم والشبكات',
    'توزيع إنارة الواجهات والحدائق الخارجية',
  ],
  hvac: [
    'تصميم التكييف المخفي (Concealed)',
    'تصميم التكييف المركزي (VRF / Chiller)',
    'أنظمة التهوية وتجديد الهواء النقي (Fresh Air)',
    'مخططات مراوح سحب الدخان والشفط',
  ],
  plumbing: [
    'مخططات شبكات المسابح والنوافير',
    'شبكة الري الأوتوماتيكي للحدائق',
    'مخططات تصريف مياه السيول والأمطار للأسطح والأحواش',
    'نظام تدوير المياه الساخنة والسخانات المركزية',
  ],
  civilDefense: [
    'نظام الإطفاء الآلي بالرشاشات المائية',
    'مخططات الإخلاء ومخارج الطوارئ واللوحات الإرشادية',
    'نظام الإنذار المبكر وكواشف الدخان والحرارة',
    'متابعة الاعتماد عبر بوابة سلامة',
  ],
  buildingLicense: [
    'استكمال متطلبات كود الطاقة والعزل الحراري',
    'اعتماد المخططات الهندسية عبر منصة بلدي',
    'إعداد تعهدات المكتب الاستشاري المطلوبة للرخصة',
    'متابعة طلب الرخصة حتى صدورها النهائي',
  ],
  asBuiltCorrection: [
    'إصدار شهادة السلامة الإنشائية للمبنى',
    'تقرير فحص وتقييم العناصر الإنشائية القائمة',
    'مخططات الوضع الراهن المعمارية والإنشائية',
    'التقديم والمتابعة عبر منصة بلدي لإتمام التصحيح',
  ],
  modifyComponents: [
    'إضافة ملحق علوي أو أرضي',
    'تعديل التقسيمات الداخلية والواجهات',
    'تحديث المخططات المعتمدة وإصدار رخصة التعديل',
    'تعديل عدد الوحدات أو المكونات النظامية',
  ],
  supervision: [
    'رفع تقارير المراحل الإلزامية عبر منصة بلدي',
    'استلام أعمال الحديد والنجارة وتصاريح الصب',
    'فحص العزل المائي والحراري واختبارات الضغط',
    'إصدار تقرير شهادة الإشغال النهائية',
  ],
  decor_as_built: [
    'توثيق فوتوغرافي كامل للفراغات القائمة',
    'رفع مواقع التأسيسات الكهربائية والصحية والتكييف',
    'مخططات الأبعاد الفعلية ومناسيب الأسقف',
  ],
  decor_moodboard: [
    'لوحة الألوان والخامات الرئيسية لكل فراغ',
    'أفكار الإضاءة الديكورية والأثاث المقترح',
    'تحديد الهوية والطراز التصميمي العام',
  ],
  decor_3d_renders: [
    'تعديلان مجانيان قبل الاعتماد النهائي',
    'لقطات ليلية ونهارية توضح توزيع الإضاءة',
    'تغطية كافة الفراغات الداخلية المتفق عليها',
  ],
  decor_shop_drawings: [
    'مخططات الجبس والأسقف المستعارة والمناسيب',
    'مخططات الأرضيات وتقطيع الرخام والبورسلان',
    'تفاصيل الجدران والنجارة والديكورات الخشبية',
    'مخططات توزيع الإنارة والمفاتيح والأفياش الديكورية',
  ],
  decor_specifications: [
    'أكواد الدهانات والرخام والبورسلان المقترحة',
    'توصيف الإضاءات والوحدات الصحية والإكسسوارات',
    'مقترحات الموردين والبدائل المعتمدة بالسوق المحلي',
  ],
  decor_boq: [
    'جدول حصر كميات الأعمال المدنية والجبسية',
    'جدول حصر كميات الأرضيات والتكسيات والدهانات',
    'قائمة كميات الإضاءة والأثاث الثابت والمتحرك',
  ],
};

// Quick one-click presets for key scope items
export const SCOPE_QUICK_PRESETS: Partial<
  Record<keyof MasterTemplateScopeFlags, Array<{ label: string; title: string; description: string }>>
> = {
  architectural: [
    {
      label: 'بدون 3D والأسوار',
      title: 'التصاميم المعمارية',
      description:
        'إعداد المخططات الابتدائية، الموقع العام، المساقط الأفقية مع الفرش، ثم المخططات النهائية والتنفيذية والواجهات والقطاعات حسب نطاق المشروع.',
    },
    {
      label: 'شامل 3D واللاندسكيب',
      title: 'التصاميم المعمارية والواجهات',
      description:
        'إعداد المخططات الابتدائية والنهائية، المساقط الأفقية، تصميم الواجهات الخارجية، واللقطات والمناظير ثلاثية الأبعاد (3D) مع الأسوار الخارجية واللاندسكيب.',
    },
    {
      label: 'واجهات خارجية فقط',
      title: 'تطوير وتصميم الواجهات المعمارية',
      description:
        'إعداد تصميم الواجهات الخارجية والمناظير ثلاثية الأبعاد (3D) مع المخططات التنفيذية للواجهات والأسوار الخارجية.',
    },
  ],
  structural: [
    {
      label: 'مخططات إنشائية بدون قبو',
      title: 'المخططات الإنشائية',
      description:
        'إعداد مخططات المحاور والأعمدة والقواعد والميد والأسقف والسلالم والخزانات والتفاصيل والجداول الإنشائية وفق كود البناء السعودي.',
    },
    {
      label: 'شامل القبو والمسبح',
      title: 'المخططات الإنشائية الشاملة',
      description:
        'إعداد كافة المخططات الإنشائية للمبنى شاملًا تصميم القبو والجدران الاستنادية والمسبح والخزانات والأسوار الخارجية والجداول والتفاصيل التنفيذية.',
    },
  ],
  electrical: [
    {
      label: 'كهرباء أساسية للرخصة',
      title: 'المخططات الكهربائية',
      description:
        'إعداد مخططات اللوحات الرئيسية والفرعية وتوزيع الإنارة والقوى والأحمال الكهربائية حسب متطلبات كود البناء السعودي.',
    },
    {
      label: 'شامل Smart Home والكاميرات',
      title: 'المخططات الكهربائية والأنظمة الذكية',
      description:
        'إعداد مخططات القوى والإنارة واللوحات والتيار الخفيف والتأريض وموانع الصواعق مع تأسيس نظام المنزل الذكي والكاميرات وشاحن السيارات الكهربائية.',
    },
  ],
  hvac: [
    {
      label: 'تكييف مخفي وسبليت',
      title: 'مخططات التكييف والتهوية',
      description:
        'حساب الأحمال الحرارية وإعداد مخططات وحدات التكييف المخفي (Concealed) والسبليت ومسارات الدكت ومراوح الشفط والتهوية.',
    },
  ],
  civilDefense: [
    {
      label: 'تقرير ومخططات سلامة كاملة',
      title: 'مخططات الأمن والسلامة (الدفاع المدني)',
      description:
        'إعداد مخططات أنظمة الإنذار المبكر والإطفاء ومخارج الطوارئ وفق كود البناء السعودي (SBC 801) ومتابعة الاعتماد عبر بوابة سلامة.',
    },
  ],
};

/**
 * Retrieve any manual title/description override for a given conditional scope item,
 * maintaining full backward compatibility with legacy architectural/supervision fields.
 */
export function getScopeItemOverride(
  clientInfo: ClientInfo,
  id: keyof MasterTemplateScopeFlags
): CustomScopeOverride | undefined {
  const mapOverride = clientInfo.customScopeOverrides?.[id];
  if (mapOverride && (mapOverride.title !== undefined || mapOverride.description !== undefined)) {
    return mapOverride;
  }
  if (id === 'architectural') {
    if (
      clientInfo.architecturalScopeCustomTitle !== undefined ||
      clientInfo.architecturalScopeCustomDescription !== undefined
    ) {
      return {
        title: clientInfo.architecturalScopeCustomTitle,
        description: clientInfo.architecturalScopeCustomDescription,
      };
    }
  }
  if (id === 'supervision') {
    if (
      clientInfo.supervisionScopeCustomTitle !== undefined ||
      clientInfo.supervisionScopeCustomDescription !== undefined
    ) {
      return {
        title: clientInfo.supervisionScopeCustomTitle,
        description: clientInfo.supervisionScopeCustomDescription,
      };
    }
  }
  return undefined;
}

/**
 * Resolve final display name, description, raw editor values, and customization flag for any scope item.
 */
export function resolveScopeItemContent(
  clientInfo: ClientInfo,
  def: { id: keyof MasterTemplateScopeFlags; name: string; description: string }
): {
  name: string;
  description: string;
  rawTitle: string;
  rawDescription: string;
  isCustomized: boolean;
} {
  const override = getScopeItemOverride(clientInfo, def.id);
  const rawTitle = override?.title !== undefined ? override.title : def.name;
  const name = override?.title?.trim() || def.name;

  if (def.id === 'supervision') {
    const hasCustomBullets =
      Array.isArray(clientInfo.supervisionScopeCustomBullets) &&
      clientInfo.supervisionScopeCustomBullets.some((b) => b.trim() !== '');
    const joinedBullets = hasCustomBullets
      ? clientInfo.supervisionScopeCustomBullets!.filter((b) => b.trim()).join(' • ')
      : '';
    const rawDescription =
      override?.description !== undefined ? override.description : def.description;
    const description =
      override?.description !== undefined && override.description.trim() !== ''
        ? override.description.trim()
        : joinedBullets || def.description;
    const isCustomized =
      (override?.title !== undefined &&
        override.title.trim() !== '' &&
        override.title.trim() !== def.name.trim()) ||
      (override?.description !== undefined &&
        override.description.trim() !== def.description.trim()) ||
      hasCustomBullets;
    return { name, description, rawTitle, rawDescription, isCustomized };
  }

  const rawDescription =
    override?.description !== undefined ? override.description : def.description;
  const description =
    override?.description !== undefined && override.description.trim() !== ''
      ? override.description.trim()
      : def.description;

  const isCustomized =
    (override?.title !== undefined &&
      override.title.trim() !== '' &&
      override.title.trim() !== def.name.trim()) ||
    (override?.description !== undefined &&
      override.description.trim() !== def.description.trim());

  return { name, description, rawTitle, rawDescription, isCustomized };
}

// 6. Intelligent auto-detection of scope flags from quotation items
export function autoDetectScopeFlags(items: QuotationItem[]): MasterTemplateScopeFlags {
  const flags: MasterTemplateScopeFlags = {
    survey: false,
    architectural: false,
    structural: false,
    electrical: false,
    hvac: false,
    plumbing: false,
    civilDefense: false,
    buildingLicense: false,
    asBuiltCorrection: false,
    modifyComponents: false,
    supervision: false,
    decor_as_built: false,
    decor_moodboard: false,
    decor_3d_renders: false,
    decor_shop_drawings: false,
    decor_specifications: false,
    decor_boq: false,
  };

  if (items.length === 0) {
    return flags;
  }

  // Detect decor deliverables if decor items are present
  const decorItems = items.filter((i) => i.departmentId === 'decor');
  if (decorItems.length > 0) {
    const combinedDecorText = decorItems
      .map((i) => [...(i.deliverables || []), ...i.details].join(' | '))
      .join(' | ');

    flags.decor_as_built = combinedDecorText.includes('As-Built') || combinedDecorText.includes('رفع مساحي');
    flags.decor_moodboard = combinedDecorText.includes('مود بورد') || combinedDecorText.includes('Moodboard');
    flags.decor_3d_renders = combinedDecorText.includes('ثلاثية الأبعاد') || combinedDecorText.includes('3D');
    flags.decor_shop_drawings = combinedDecorText.includes('تنفيذية') || combinedDecorText.includes('Shop Drawings');
    flags.decor_specifications = combinedDecorText.includes('مواصفات') || combinedDecorText.includes('Specifications');
    flags.decor_boq = combinedDecorText.includes('كميات') || combinedDecorText.includes('BOQ');
  }

  for (const item of items) {
    // Decor items have their own 6 interior design deliverables and should not trigger land survey or license flags
    if (item.departmentId === 'decor') {
      continue;
    }

    const text = `${item.departmentName} ${item.title} ${item.details.join(' ')}`.toLowerCase();

    if (item.departmentId === 'survey' || text.includes('مساح') || text.includes('كروكي') || text.includes('أرض')) {
      flags.survey = true;
    }
    if (item.departmentId === 'civil_defense' || text.includes('دفاع مدني') || text.includes('سلامة') || text.includes('إطفاء')) {
      flags.civilDefense = true;
    }
    // Rule: الإشراف الهندسي ({{IF:إشراف}}):
    // يتم التأشير عليه فقط في حال وجود إشراف فعلي مدفوع أو طلب من قسم الإشراف
    // ويجب عدم التأشير عليه إطلاقاً في حال كان الخيار "بدون إشراف هندسي تصميم مخططات فقط 0 ريال"
    const isExplicitNoSupervisionItem =
      text.includes('بدون إشراف') ||
      text.includes('بدون اشراف') ||
      item.details.some(
        (d) =>
          d.includes('بدون إشراف') ||
          d.includes('بدون اشراف') ||
          (d.includes('تصميم مخططات فقط') && (d.includes('0 ريال') || d.includes('0')))
      );

    const isExplicitPaidSupervisionItem =
      item.departmentId === 'supervision' ||
      (item.departmentId === 'execution' && text.includes('إشراف')) ||
      item.details.some(
        (d) =>
          (d.includes('إشراف مقطوع') ||
            d.includes('إشراف شهري') ||
            d.includes('إشراف مخصص') ||
            d.includes('زيارات هندسية لأعمال العظم') ||
            d.includes('متابعة مستمرة لكامل مراحل البناء')) &&
          !d.includes('بدون') &&
          !d.includes('0 ريال')
      );

    if (isExplicitPaidSupervisionItem && !isExplicitNoSupervisionItem) {
      flags.supervision = true;
    }
    if (text.includes('تصحيح') || text.includes('قائم') || text.includes('تحمل')) {
      flags.asBuiltCorrection = true;
    }
    if (text.includes('تعديل مكونات') || text.includes('تعديل رخصة')) {
      flags.modifyComponents = true;
    }
    if (item.departmentId === 'design') {
      const isAsBuilt = text.includes('تصحيح') || text.includes('قائم');
      // Only set buildingLicense if this item is explicitly a new license or renovation, and NOT as-built correction
      if (!isAsBuilt && (text.includes('رخصة') || text.includes('بلدي') || text.includes('ترميم'))) {
        flags.buildingLicense = true;
      }
      if (text.includes('معماري') || text.includes('واجهات') || text.includes('شاملة') || text.includes('باقة') || text.includes('فيلا') || text.includes('عمارة') || text.includes('ترميم')) {
        flags.architectural = true;
      }
      if (text.includes('إنشائي') || text.includes('شاملة') || text.includes('باقة') || text.includes('فيلا') || text.includes('عمارة') || text.includes('ترميم')) {
        flags.structural = true;
      }
      if (text.includes('كهرب') || text.includes('شاملة') || text.includes('باقة') || text.includes('فيلا') || text.includes('عمارة') || text.includes('ترميم')) {
        flags.electrical = true;
      }
      if (text.includes('تكييف') || text.includes('شاملة') || text.includes('باقة') || text.includes('فيلا') || text.includes('عمارة') || text.includes('ترميم')) {
        flags.hvac = true;
      }
      if (text.includes('سباكة') || text.includes('صحي') || text.includes('شاملة') || text.includes('باقة') || text.includes('فيلا') || text.includes('عمارة') || text.includes('ترميم')) {
        flags.plumbing = true;
      }
      if (text.includes('مسح') || text.includes('قرار مساحي')) {
        flags.survey = true;
      }
    }
  }

  // Rule: في خدمة تصميم مخططات: يتم حذف الرفع المساحي وإصدار رخصة البناء من النطاق الشرطي
  const hasPlanDesign = items.some(
    (i) => i.title.includes('تصميم مخططات') || i.details.some((d) => d.includes('تصميم مخططات'))
  );
  const hasExplicitSurvey = items.some(
    (i) =>
      i.departmentId === 'survey' ||
      i.title.includes('رفع مساحي') ||
      i.title.includes('قرار مساحي') ||
      i.title.includes('كروكي')
  );

  // Ensure: If the quotation has asBuiltCorrection (تصحيح وضع مبنى قائم) and lacks an explicit new license / renovation item,
  // do NOT check buildingLicense (إصدار رخصة البناء {{IF:رخصة}})!
  const hasExplicitLicenseItem = items.some(
    (i) =>
      i.departmentId === 'design' &&
      (i.title.includes('رخصة بناء جديدة') || i.title.includes('رخصة ترميم مبنى'))
  );

  if (hasPlanDesign) {
    if (!hasExplicitSurvey) {
      flags.survey = false;
    }
    if (!hasExplicitLicenseItem) {
      flags.buildingLicense = false;
    }
  }

  // Rule: في حالة اختيار بدون اشراف هندسي تصميم مخططات فقط 0 ريال:
  // يجب عدم التأشير على خانة الإشراف الهندسي في النطاق الشرطي
  const hasNoSupervisionSelected = items.some(
    (i) =>
      i.details.some(
        (d) =>
          d.includes('بدون إشراف') ||
          d.includes('بدون اشراف') ||
          (d.includes('تصميم مخططات فقط') && (d.includes('0 ريال') || d.includes('0')))
      ) ||
      i.title.includes('بدون إشراف') ||
      i.title.includes('بدون اشراف')
  );

  const hasAnyPaidSupervisionItem = items.some(
    (i) =>
      i.departmentId === 'supervision' ||
      (i.departmentId === 'execution' && i.title.includes('إشراف')) ||
      i.details.some(
        (d) =>
          (d.includes('إشراف مقطوع') ||
            d.includes('إشراف شهري') ||
            d.includes('إشراف مخصص') ||
            d.includes('زيارات هندسية لأعمال العظم') ||
            d.includes('متابعة مستمرة لكامل مراحل البناء')) &&
          !d.includes('بدون') &&
          !d.includes('0 ريال')
      )
  );

  if (hasNoSupervisionSelected && !hasAnyPaidSupervisionItem) {
    flags.supervision = false;
  }

  if (hasPlanDesign && !hasAnyPaidSupervisionItem) {
    flags.supervision = false;
  }

  if (flags.asBuiltCorrection && !hasExplicitLicenseItem) {
    flags.buildingLicense = false;
  }

  // Rule: في حالة العمائر السكنية والتجارية (لقسم التصميم والرخص) يتم التأشير تلقائياً على بند مخططات الأمن والسلامة في النطاق الشرطي
  const isResidentialOrCommercialDesign = items.some(
    (i) =>
      i.departmentId !== 'decor' &&
      (i.buildingTypeLabel?.includes('عمارة') ||
        i.title.includes('عمارة') ||
        i.details.some((d) => d.includes('عمارة سكنية') || d.includes('عمارة تجارية')))
  );
  if (isResidentialOrCommercialDesign) {
    flags.civilDefense = true;
  }

  return flags;
}

/**
 * دمج بندي رخصة البناء وتعديل مكونات البناء في حالة تعديل مكونات البناء:
 * "في حالة تعديل مكونات بناء يدمج البند رقم 7 اصدار رخص البناء والبند رقم 8 تعديل مكونات البناء
 * ليصبح بند واحد باسم 'رخصة تعديل مكونات بناء' الموجود في النطاق الشرطي"
 */
export function getFormattedScopeDefinitions(
  clientInfo?: ClientInfo,
  items?: QuotationItem[]
): MasterScopeItemDef[] {
  const isComponentMod =
    clientInfo?.serviceType?.includes('تعديل مكونات') ||
    items?.some((i) => i.title.includes('تعديل مكونات')) ||
    (clientInfo?.scopeFlags?.modifyComponents && !clientInfo?.scopeFlags?.buildingLicense);

  if (!isComponentMod) {
    return MASTER_SCOPE_DEFINITIONS;
  }

  const result: MasterScopeItemDef[] = [];
  let mergedAdded = false;

  for (const def of MASTER_SCOPE_DEFINITIONS) {
    if (def.id === 'buildingLicense' || def.id === 'modifyComponents') {
      if (!mergedAdded) {
        result.push({
          id: 'modifyComponents',
          tag: '{{IF:رخصة_تعديل_مكونات}}',
          name: 'رخصة تعديل مكونات بناء',
          category: 'special',
          description:
            'مراجعة رخصة البناء والمخططات القائمة، وإعداد واستكمال الأعمال الهندسية والتعديلات المطلوبة والتقديم والمتابعة لإصدار رخصة تعديل مكونات البناء وفق متطلبات واشتراطات الجهات المختصة.',
        });
        mergedAdded = true;
      }
    } else {
      result.push(def);
    }
  }

  return result;
}

/**
 * Returns the complete list of active scope items to display in "ثالثًا: نطاق أعمال الاستشاري المعتمد".
 * When Decor items are in the quotation, includes all selected Decor deliverables (6 items).
 */
export function getActiveScopeItemsForQuotation(
  clientInfo: ClientInfo,
  items: QuotationItem[]
): Array<{ id: string; tag: string; name: string; description: string }> {
  const decorItems = items.filter((i) => i.departmentId === 'decor');
  const hasNonDecorItems = items.some((i) => i.departmentId !== 'decor');

  const result: Array<{ id: string; tag: string; name: string; description: string }> = [];

  // Include standard engineering scope items if there are non-decor items (or if cart is empty)
  if (hasNonDecorItems || items.length === 0) {
    const formattedScopeDefs = getFormattedScopeDefinitions(clientInfo, items);
    const activeStandard = formattedScopeDefs
      .filter((def) => {
        if (
          def.id === 'modifyComponents' &&
          formattedScopeDefs.some((d) => d.name === 'رخصة تعديل مكونات بناء')
        ) {
          return !!clientInfo.scopeFlags?.modifyComponents || !!clientInfo.scopeFlags?.buildingLicense;
        }
        return !!clientInfo.scopeFlags?.[def.id];
      })
      .map((def) => {
        const resolved = resolveScopeItemContent(clientInfo, def);
        return {
          ...def,
          name: resolved.name,
          description: resolved.description,
        };
      });
    result.push(...activeStandard);
  }

  // Include Interior Design / Decor deliverables ONLY when Decor items are present in the quotation!
  if (decorItems.length > 0) {
    const combinedDecorText = decorItems
      .map((i) => [...(i.deliverables || []), ...i.details].join(' | '))
      .join(' | ');

    const activeDecorDefs = DECOR_SCOPE_DEFINITIONS.filter((def) => {
      // 1. If user explicitly unchecked / deleted this item in scopeFlags (value is false): DO NOT INCLUDE!
      if (clientInfo.scopeFlags?.[def.id] === false) {
        return false;
      }
      // 2. If user explicitly enabled this item in scopeFlags (value is true): INCLUDE!
      if (clientInfo.scopeFlags?.[def.id] === true) {
        return true;
      }
      // 3. If undefined in scopeFlags: check if in item deliverables
      return combinedDecorText.includes(def.name);
    }).map((def) => {
      const resolved = resolveScopeItemContent(clientInfo, def);
      return {
        ...def,
        name: resolved.name,
        description: resolved.description,
      };
    });

    result.push(...activeDecorDefs);
  }

  return result;
}

// 7. Intelligent auto-detection of exclusions from quotation items
export function autoDetectExclusions(
  items: QuotationItem[],
  flags: MasterTemplateScopeFlags
): MasterTemplateExclusions {
  return {
    excludeSupervision: !flags.supervision,
    excludeCivilDefense: !flags.civilDefense,
    excludeQuantities: true,
    excludeGovFees: true,
    excludeSoilTest: !items.some((i) => i.title.includes('فحص تربة') || i.details.some((d) => d.includes('تربة'))),
    excludeInsurance: true,
    customExclusions: '',
  };
}

// 8. Generate dynamic payment milestones based on grandTotal and schedule type
export function getDefaultMilestonesForType(
  type: ClientInfo['paymentScheduleType'] = 'design_standard',
  grandTotal: number = 0
): PaymentMilestone[] {
  if (type === 'design_standard') {
    const p1 = Math.round(grandTotal * 0.4);
    const p2 = Math.round(grandTotal * 0.4);
    const p3 = Math.max(0, grandTotal - p1 - p2);
    return [
      {
        id: '1',
        title: 'الدفعة الأولى (40%)',
        percentage: 40,
        amount: p1,
        description: 'عند توقيع العقد والبدء في إعداد الفكرة المعمارية والرفع المساحي للموقع.',
      },
      {
        id: '2',
        title: 'الدفعة الثانية (40%)',
        percentage: 40,
        amount: p2,
        description: 'بعد الانتهاء من المخططات الإنشائية والكهروميكانيكية والتنفيذية.',
      },
      {
        id: '3',
        title: 'الدفعة الختامية (20%)',
        percentage: 20,
        amount: p3,
        description: 'عند استكمال كافة المخططات الهندسية والتقديم للاعتماد وإصدار رخصة البناء.',
      },
    ];
  } else if (type === 'supervision_stages') {
    const p1 = Math.round(grandTotal * 0.3);
    const p2 = Math.round(grandTotal * 0.35);
    const p3 = Math.max(0, grandTotal - p1 - p2);
    return [
      {
        id: '1',
        title: 'الدفعة الأولى (30%)',
        percentage: 30,
        amount: p1,
        description: 'عند توقيع العقد واستلام الموقع وتدقيق المخططات ورخصة البناء.',
      },
      {
        id: '2',
        title: 'الدفعة الثانية (35%)',
        percentage: 35,
        amount: p2,
        description: 'بعد استلام أعمال القواعد والميدات والرقاب وصبة نظافة الأرضية.',
      },
      {
        id: '3',
        title: 'الدفعة الثالثة (35%)',
        percentage: 35,
        amount: p3,
        description: 'بعد استلام أسقف وأعمدة كافة الأدوار حتى السطح وإصدار شهادة إتمام الهيكل الإنشائي.',
      },
    ];
  } else if (type === 'study_split') {
    const p1 = Math.round(grandTotal * 0.5);
    const p2 = Math.max(0, grandTotal - p1);
    return [
      {
        id: '1',
        title: 'الدفعة الأولى (50%)',
        percentage: 50,
        amount: p1,
        description: 'عند توقيع العقد والمعاينة الميدانية والبدء في الفحص وإعداد التقارير الفنية.',
      },
      {
        id: '2',
        title: 'الدفعة الثانية والأخيرة (50%)',
        percentage: 50,
        amount: p2,
        description: 'عند تسليم النسخ المعتمدة والرفع على المنصة المختصة واستخراج الوثيقة النهائية.',
      },
    ];
  }

  // Custom fallback: 50/50
  const p1 = Math.round(grandTotal * 0.5);
  const p2 = Math.max(0, grandTotal - p1);
  return [
    {
      id: '1',
      title: 'دفعة أولى (50%)',
      percentage: 50,
      amount: p1,
      description: 'دفعة مقدمة عند توقيع العقد وبدء العمل.',
    },
    {
      id: '2',
      title: 'دفعة نهائية (50%)',
      percentage: 50,
      amount: p2,
      description: 'عند التسليم النهائي والاعتماد.',
    },
  ];
}

export function getPaymentMilestones(
  type: ClientInfo['paymentScheduleType'] = 'design_standard',
  grandTotal: number = 0,
  customMilestones?: PaymentMilestone[]
): PaymentMilestone[] {
  if (customMilestones && customMilestones.length > 0) {
    return customMilestones.map((m) => {
      const amount = typeof m.amount === 'number' ? m.amount : Number(m.amount) || 0;
      const pct = grandTotal > 0 ? Math.round((amount / grandTotal) * 100) : m.percentage;
      const description =
        m.description === 'عند اعتماد المخططات المعمارية والبدء بإعداد المخططات الإنشائية والكهروميكانيكية والتنفيذية.'
          ? 'بعد الانتهاء من المخططات الإنشائية والكهروميكانيكية والتنفيذية.'
          : m.description;
      return {
        ...m,
        description,
        amount,
        percentage: pct,
      };
    });
  }

  return getDefaultMilestonesForType(type, grandTotal);
}
