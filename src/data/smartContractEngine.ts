import {
  ClientInfo,
  ContractData,
  ContractScopeSubgroup,
  ContractTemplateKind,
  ContractTimelineRow,
  DepartmentId,
  QuotationItem,
} from '../types';
import {
  formatNumber,
  formatSAR,
  getQuotationAreaDetails,
  tafqeetSAR,
} from '../utils/formatters';
import {
  getActiveScopeItemsForQuotation,
  getPaymentMilestones,
} from './masterTemplateDefaults';

export interface ContractTemplateMeta {
  id: ContractTemplateKind;
  label: string;
  shortLabel: string;
  description: string;
  departmentBadge: string;
}

export const CONTRACT_TEMPLATE_CATALOG: ContractTemplateMeta[] = [
  {
    id: 'design_license',
    label: 'عقد تصميم معماري وإصدار رخصة بناء',
    shortLabel: 'تصميم ورخصة بناء',
    description: 'نموذج متكامل للتصميم المعماري والإنشائي والكهروميكانيكي وإصدار رخصة البناء عبر بلدي.',
    departmentBadge: 'قسم التصميم والرخص',
  },
  {
    id: 'design_plans',
    label: 'عقد تصميم مخططات هندسية',
    shortLabel: 'تصميم مخططات فقط',
    description: 'نموذج مخصص لإعداد المخططات المعمارية والهندسية والتنفيذية دون استخراج رخصة بناء.',
    departmentBadge: 'قسم التصميم',
  },
  {
    id: 'design_as_built',
    label: 'عقد تصحيح وضع / تعديل مكونات / ترميم',
    shortLabel: 'تصحيح وضع وتعديل مكونات',
    description: 'نموذج مخصص لتصحيح وضع المباني القائمة أو تعديل مكونات البناء أو رخص الترميم والهدم.',
    departmentBadge: 'التراخيص الخاصة',
  },
  {
    id: 'supervision',
    label: 'عقد إشراف هندسي (مرحلة العظم / إدارة مشروع)',
    shortLabel: 'إشراف هندسي',
    description: 'نموذج الإشراف المعتمد مع جدول مراحل الاستلامات وحد الزيارات ورسوم الزيارات الإضافية.',
    departmentBadge: 'قسم الإشراف',
  },
  {
    id: 'decor',
    label: 'عقد تصميم داخلي وديكور',
    shortLabel: 'تصميم داخلي وديكور',
    description: 'نموذج متخصص للتصميم الداخلي، المناظير 3D، المخططات التنفيذية، وجداول المواد والكميات.',
    departmentBadge: 'قسم الديكور',
  },
  {
    id: 'survey',
    label: 'عقد أعمال الرفع المساحي والقرارات المساحية',
    shortLabel: 'المساحة والقرارات',
    description: 'نموذج مخصص للقرارات المساحية، الرفع الطبوغرافي، الفرز والتجزئة، والتبتير وتحديث الصكوك.',
    departmentBadge: 'قسم المساحة',
  },
  {
    id: 'civil_defense',
    label: 'عقد أعمال السلامة والوقاية من الحريق (الدفاع المدني)',
    shortLabel: 'الدفاع المدني والسلامة',
    description: 'نموذج مخصص لمخططات الإنذار والإطفاء SBC 801 والتقارير الفنية وبوابة سلامة.',
    departmentBadge: 'الدفاع المدني',
  },
  {
    id: 'execution',
    label: 'عقد تنفيذ ومقاولات إنشائية',
    shortLabel: 'تنفيذ ومقاولات',
    description: 'نموذج لعقود التنفيذ تسليم مفتاح، العظم بالمواد أو المصنعيات، وأعمال التشطيب.',
    departmentBadge: 'قسم التنفيذ',
  },
  {
    id: 'combined',
    label: 'عقد تقديم خدمات استشارية وهندسية متكاملة',
    shortLabel: 'عقد شامل (متعدد الأقسام)',
    description: 'يدمج تلقائياً كافة الأقسام والخدمات المختارة في عرض السعر ضمن عقد واحد منظم.',
    departmentBadge: 'متعدد الأقسام',
  },
];

export const DEFAULT_SECOND_PARTY_TEXT =
  'شركة الرؤية المضيئة للاستشارات الهندسية – سجل تجاري رقم (1010788646)، عنوانها مدينة الرياض – حي الملقا – طريق محمد بن سعد بن عبد العزيز، بريد الكتروني (lv2000design@gmail.com)، ويشار إليه فيما بعد بالطرف الثاني أو الاستشاري.';

const ARABIC_DAYS = [
  'الأحد',
  'الاثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت',
];

export function getArabicDayName(dateStr?: string): string {
  try {
    const d = dateStr ? new Date(`${dateStr}T12:00:00`) : new Date();
    if (!isNaN(d.getTime())) {
      return ARABIC_DAYS[d.getDay()] || 'الأحد';
    }
  } catch {
    // ignore
  }
  return 'الأحد';
}

export function formatContractDisplayDate(dateStr?: string): string {
  if (!dateStr) {
    const now = new Date();
    return `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
  }
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const y = parts[0];
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    if (!isNaN(m) && !isNaN(d)) {
      return `${d}/${m}/${y}`;
    }
  }
  return dateStr;
}

export function formatContractNumber(proposalNumber?: string): string {
  const clean = (proposalNumber || '').trim();
  if (!clean) return 'LV-C-0';
  if (/^LV-/i.test(clean)) return clean;
  return `LV-P-${clean}`;
}

/**
 * Intelligently detects the most accurate contract template from quotation items & clientInfo.
 */
export function detectBestContractTemplate(
  clientInfo: ClientInfo,
  items: QuotationItem[]
): ContractTemplateKind {
  if (!items || items.length === 0) {
    const svc = (clientInfo.serviceType || '').toLowerCase();
    if (svc.includes('إشراف') || svc.includes('اشراف')) return 'supervision';
    if (svc.includes('ديكور') || svc.includes('داخلي')) return 'decor';
    if (svc.includes('مساح') || svc.includes('كروكي')) return 'survey';
    if (svc.includes('دفاع مدني') || svc.includes('سلامة')) return 'civil_defense';
    if (svc.includes('تنفيذ') || svc.includes('مقاول')) return 'execution';
    if (svc.includes('تصحيح') || svc.includes('تعديل مكونات') || svc.includes('ترميم') || svc.includes('هدم')) {
      return 'design_as_built';
    }
    if (svc.includes('تصميم مخططات') && !svc.includes('رخصة')) return 'design_plans';
    return 'design_license';
  }

  const depts = Array.from(new Set<DepartmentId>(items.map((i) => i.departmentId)));

  // Multiple distinct departments => combined smart contract
  if (depts.length > 1) {
    return 'combined';
  }

  const singleDept = depts[0];
  const combinedText = items
    .map((i) => `${i.title} ${i.details.join(' ')}`)
    .join(' ');

  if (singleDept === 'supervision') return 'supervision';
  if (singleDept === 'decor') return 'decor';
  if (singleDept === 'survey') return 'survey';
  if (singleDept === 'civil_defense') return 'civil_defense';
  if (singleDept === 'execution') return 'execution';

  // Design department sub-service detection
  if (singleDept === 'design') {
    const hasPaidSupervisionInsideDesign =
      Boolean(clientInfo.scopeFlags?.supervision) &&
      !combinedText.includes('بدون إشراف') &&
      !combinedText.includes('بدون اشراف');
    if (hasPaidSupervisionInsideDesign) {
      return 'combined';
    }
    if (
      combinedText.includes('تصحيح وضع') ||
      combinedText.includes('مبنى قائم') ||
      combinedText.includes('تعديل مكونات') ||
      combinedText.includes('رخصة ترميم') ||
      combinedText.includes('رخصة هدم')
    ) {
      return 'design_as_built';
    }
    if (
      combinedText.includes('تصميم مخططات') &&
      !combinedText.includes('رخصة بناء جديدة')
    ) {
      return 'design_plans';
    }
    return 'design_license';
  }

  return 'design_license';
}

function buildDesignScopeGroups(
  clientInfo: ClientInfo,
  items: QuotationItem[],
  includeLicenseAndSurvey: boolean
): ContractScopeSubgroup[] {
  const flags = clientInfo.scopeFlags;
  const groups: ContractScopeSubgroup[] = [];

  const showSurvey = includeLicenseAndSurvey ? flags?.survey !== false : Boolean(flags?.survey);
  if (showSurvey) {
    groups.push({
      id: 'scope-survey',
      title: 'الرفع المساحي :',
      items: ['التقرير المساحي والرفع المساحي للأرض ولمناسيب الأرض الطبيعية والشوارع المحيطة.'],
      layout: 'list',
    });
  }

  if (flags?.architectural !== false) {
    groups.push({
      id: 'scope-arch-prelim',
      title: 'التصاميم المعمارية :',
      subtitle: 'المخططات الابتدائية :',
      items: ['الموقع العام لكامل المشروع.', 'المساقط الأفقية مع الفرش.'],
      layout: 'list',
    });
    groups.push({
      id: 'scope-arch-final',
      title: '',
      subtitle: 'المخططات النهائية :',
      items: [
        'الموقع العام والمساقط الأفقية التنفيذية.',
        'الواجهات والقطاعات.',
        'المناظير الخارجية 3D حسب حاجة المشروع.',
        'الحدائق واللاند سكيب والأسوار الخارجية.',
      ],
      layout: 'list',
    });
  }

  if (flags?.structural !== false) {
    groups.push({
      id: 'scope-structural',
      title: 'المخططات الإنشائية :',
      items: [
        'جدول الرموز وقائمة المخططات.',
        'مخططات تسليح الأسقف للأدوار المختلفة.',
        'التفاصيل النمطية الإنشائية.',
        'الجداول الإنشائية لكافة العناصر الإنشائية.',
        'مخططات المحاور والأعمدة.',
        'مخططات الخزانات.',
        'مخططات الأساسات.',
        'مخططات السلالم والعناصر الإنشائية الفرعية.',
      ],
      layout: 'list',
    });
  }

  if (flags?.electrical !== false) {
    groups.push({
      id: 'scope-electrical',
      title: 'المخططات الكهربائية :',
      items: [
        'مخطط اللوحات الرئيسية والفرعية.',
        'مخططات أحمال القوى الصغرى والكبرى.',
        'مخطط أحادي القوى للمشروع.',
        'مخططات التيار الخفيف (الجهد المنخفض).',
        'مخطط مسارات الكابلات وحوامل الكابلات.',
        'مخططات التأريض وموانع الصواعق.',
        'مخططات توزيع الإنارة.',
      ],
      layout: 'list',
    });
  }

  if (flags?.hvac !== false) {
    groups.push({
      id: 'scope-hvac',
      title: 'مخططات التكييف :',
      items: [
        'حساب الحمل الحراري.',
        'مخطط وحدات التكييف الداخلية والخارجية.',
        'مخطط دكت التكييف.',
        'مخطط مراوح الشفط والتهوية.',
      ],
      layout: 'list',
    });
  }

  if (flags?.plumbing !== false) {
    groups.push({
      id: 'scope-plumbing',
      title: 'المخططات الصحية :',
      items: [
        'مخطط الصرف الصحي وصرف الأمطار.',
        'مخطط الخزانات وشبكتها.',
        'مخطط التغذية المائية.',
        'حساب أحمال مضخات المياه والصرف.',
      ],
      layout: 'two_column',
    });
  }

  if (flags?.civilDefense) {
    groups.push({
      id: 'scope-cd',
      title: 'مخططات الأمن والسلامة (الدفاع المدني) :',
      items: [
        'مخططات شبكات الإنذار المبكر وكواشف الدخان والحرارة طبقاً لكود البناء السعودي SBC 801.',
        'مخططات أنظمة الإطفاء ومخارج الطوارئ ولوحات الإرشاد.',
        'رفع المخططات ومتابعة الاعتماد عبر الجهات المختصة.',
      ],
      layout: 'list',
    });
  }

  if (includeLicenseAndSurvey && flags?.buildingLicense) {
    groups.push({
      id: 'scope-license',
      title: 'إصدار رخصة البناء :',
      items: [
        'استكمال متطلبات كود البناء السعودي وكود الطاقة والعزل الحراري.',
        'التقديم والمتابعة عبر منصة بلدي حتى إصدار رخصة البناء المعتمدة.',
      ],
      layout: 'list',
    });
  }

  if (groups.length === 0) {
    const active = getActiveScopeItemsForQuotation(clientInfo, items);
    active.forEach((s, idx) => {
      groups.push({
        id: `scope-auto-${idx}`,
        title: `${s.name} :`,
        items: [s.description],
        layout: 'list',
      });
    });
  }

  return groups;
}

function buildSupervisionInspectionStages(items: QuotationItem[], buildingType: string): {
  title: string;
  maxVisitsText: string;
  extraVisitFeeText: string;
  stages: string[];
} {
  const combined = items.map((i) => `${i.title} ${i.details.join(' ')}`).join(' ');
  const isDamageReport = combined.includes('تقرير أضرار') || combined.includes('أضرار');
  const isProjectMgmt = combined.includes('إدارة مشروع') || combined.includes('إدارة مشاريع');
  const isMonthly = combined.includes('شهري');

  if (isDamageReport) {
    return {
      title: 'مراحل الفحص والمعاينة الميدانية :',
      maxVisitsText:
        'يقوم الاستشاري بإجراء المعاينات الميدانية اللازمة لفحص المبنى ورصد الأضرار الإنشائية والمعمارية وإعداد التقرير الفني المعتمد.',
      extraVisitFeeText:
        'وفي حال طلب المالك زيارات ميدانية أو اختبارات إضافية خارج نطاق التقرير الأساسي تُحتسب رسوم الزيارة الإضافية بمبلغ 700 ريال.',
      stages: [
        'المعاينة الميدانية الأولية وتوثيق الحالة الراهنة بالتصوير',
        'فحص العناصر الإنشائية ورصد الشروخ والهبوطات والتسربات',
        'تحليل الأسباب الفنية للأضرار وتقييم السلامة الإنشائية',
        'إعداد التوصيات الهندسية ومقترحات المعالجة والترميم',
        'تسليم التقرير الفني النهائي المعتمد ومختوماً من المكتب',
      ],
    };
  }

  if (isProjectMgmt) {
    return {
      title: 'مراحل الإشراف وإدارة المشروع :',
      maxVisitsText:
        'يقوم الاستشاري بإدارة ومتابعة تنفيذ المشروع فنياً وإدارياً ومراجعة مستخلصات المقاولين والجدول الزمني حسب المراحل المعتمدة.',
      extraVisitFeeText:
        'وأي زيارات أو مهام إضافية خارج النطاق المعتمد تكون بقيمة 700 ريال للزيارة.',
      stages: [
        'مراجعة المخططات والمواصفات وتأهيل المقاولين والموردين',
        'استلام أعمال الحفر والأساسات والميدات والرقاب',
        'استلام أعمدة وأسقف الأدوار وفق المخططات الإنشائية',
        'متابعة تأسيسات الكهرباء والسباكة والتكييف والعزل',
        'متابعة أعمال اللياسة والتشطيبات والواجهات ومراقبة الجودة',
        'مراجعة المستخلصات والجدول الزمني وتقارير الإنجاز الدورية',
        'الاستلام الابتدائي للمشروع وحصر الملاحظات النهائية',
      ],
    };
  }

  const maxVisits = isMonthly
    ? 'يقوم الاستشاري بالإشراف الهندسي الدوري المنتظم وفق جدول الزيارات الشهري المتفق عليه وكود البناء السعودي.'
    : 'يقوم الاستشاري بالإشراف على مرحلة العظم، حسب الاستلامات المعتمدة من البلدية وكود البناء السعودي، بحد أقصى 10 زيارات.';

  const isMultiStory =
    buildingType.includes('عمارة') || buildingType.includes('فندق') || buildingType.includes('تجاري');

  const stages = isMultiStory
    ? [
        'الحفر وصبة النظافة والأساسات',
        'الرقاب والميدات والعزل',
        'أعمدة الدور الأرضي',
        'سقف الدور الأرضي',
        'أعمدة الأدوار المتكررة',
        'أسقف الأدوار المتكررة',
        'أعمدة الملحق العلوي والسطح',
        'سقف الملحق العلوي والسترة',
      ]
    : [
        'الأساسات',
        'الميدة',
        'أعمدة الدور الأرضي',
        'سقف الدور الأرضي',
        'أعمدة الدور الأول',
        'سقف الدور الأول',
        'أعمدة الملحق العلوي',
        'سقف الملحق العلوي',
      ];

  return {
    title: 'مراحل استلامات الأعمال :',
    maxVisitsText: maxVisits,
    extraVisitFeeText: 'وأي زيارات إضافية تكون بقيمة 700 ريال.',
    stages,
  };
}

/**
 * Main Smart Contract Factory: produces an editable ContractData tailored to any department or combination of services.
 */
export function buildSmartContract(
  clientInfo: ClientInfo,
  items: QuotationItem[],
  forcedTemplate?: ContractTemplateKind,
  enabledOverride?: boolean
): ContractData {
  const templateKind = forcedTemplate || detectBestContractTemplate(clientInfo, items);
  const areaDetails = getQuotationAreaDetails(clientInfo, items);
  const buildingType = (clientInfo.buildingType || 'فيلا سكنية').trim();
  const city = (clientInfo.projectCity || 'الرياض').trim();
  const district = (clientInfo.district || '').trim();
  const durationDays = clientInfo.executionDurationDays || 30;
  const contractNumber = formatContractNumber(clientInfo.proposalNumber);
  const signingDate = clientInfo.date || new Date().toISOString().split('T')[0];
  const signingDayName = getArabicDayName(signingDate);

  const combinedText = items.map((i) => `${i.title} ${i.details.join(' ')}`).join(' ');
  const isEnabled = enabledOverride !== undefined ? enabledOverride : Boolean(clientInfo.contractData?.enabled);

  // Common First Party values synced from clientInfo
  const firstPartyName = clientInfo.clientName?.trim() || '';
  const firstPartyId = clientInfo.nationalId?.trim() || '';
  const firstPartyAddress = district ? `مدينة ${city} – حي ${district}` : `مدينة ${city}`;
  const firstPartyPhone = clientInfo.phone?.trim() || '';
  const firstPartyEmail = clientInfo.email?.trim() || '';
  const propertyRealEstateNumber = clientInfo.deedNumber?.trim() || '';
  const defaultPropertyDesc =
    buildingType.includes('فيلا')
      ? `${buildingType}، مكونة من دور أرضي وأول وملحق علوي`
      : buildingType;

  // Base defaults
  let contractTitle = 'عقد تصميم معماري';
  let contractSubtitle = 'وإصدار رخصة بناء';
  let preambleText = '';
  let showProjectOverview = false;
  let projectOverviewText = defaultPropertyDesc;
  let consultantScopeTitle = 'التزامات الاستشاري :';
  let scopeGroups: ContractScopeSubgroup[] = [];
  let showSupervisionStages = false;
  let supervisionStagesTitle = 'مراحل استلامات الأعمال :';
  let supervisionMaxVisitsText = '';
  let supervisionExtraVisitFeeText = '';
  let supervisionStages: string[] = [];
  let ownerObligations: string[] = [];
  let showTimelineTable = true;
  let timelineNotes: string[] = [];
  let timelineRows: ContractTimelineRow[] = [];
  let timelineTotalLabel = 'إجمالي زمن إنهاء الأعمال المتفق عليها';
  let timelineTotalDuration = `${durationDays} يوم عمل`;
  let generalTerms: string[] = [];
  let showIpRights = true;
  let ipRights: string[] = [
    'يحق للاستشاري استخدام تصميم الواجهات والمناظير من دون المساقط ونشرها إعلامياً وتسويقياً.',
    'تعتبر الرسومات والمخرجات المعدة والمقدمة من قبل الاستشاري مملوكة فكرياً وفنياً له ولا يحق للمالك تكرار إقامتها أو منحها للغير إلا في حدود الاتفاق.',
  ];
  let pricingIntroText = clientInfo.includeTax
    ? 'حسب نطاق الأعمال المذكور في عرض السعر، تقدر أتعاب الاستشاري الإجمالية لكافة مراحل المشروع شاملة ضريبة القيمة المضافة (15%) وفقاً للتالي :'
    : 'حسب نطاق الأعمال المذكور في عرض السعر، تقدر أتعاب الاستشاري الإجمالية لكافة مراحل المشروع غير شاملة ضريبة القيمة المضافة، وفقاً للتالي :';
  let paymentMethodNote = 'يتم توزيع صرف الدفعات حسب مراحل المشروع المختلفة كالتالي:';

  switch (templateKind) {
    case 'design_license': {
      contractTitle = 'عقد تصميم معماري';
      contractSubtitle = 'وإصدار رخصة بناء';
      preambleText = `حيث إن الطرف الأول يرغب بعمل التصميمات المعمارية والهندسية وإصدار رخصة البناء لمشروع (${defaultPropertyDesc})، ويرغب في تكليف شركة استشارات هندسية للقيام بأعمال التصميم المعماري والهندسي واستخراج التراخيص اللازمة. وحيث إن الطرف الثاني هو شركة استشارات هندسية معتمدة وقد أبدى استعداده التام للقيام بالعمل المطلوب ووفقاً لبنود هذا العقد.`;
      scopeGroups = buildDesignScopeGroups(clientInfo, items, true);
      ownerObligations = [
        'تجهيز تقرير فحص التربة لموقع المشروع من مختبر معتمد.',
        'سداد الرسوم الحكومية أو أي رسوم أخرى تفرضها الجهات المختصة على المشروع.',
        'التأمين ضد العيوب الخفية وفق متطلبات كود البناء السعودي.',
        'اعتماد المراحل والتصاميم كتابياً في المواعيد المحددة وسداد الدفعات حسب الجدول المتفق عليه.',
      ];
      timelineNotes = [
        'الجدول الزمني المذكور لا يتضمن فترات المراجعة مع المالك أو استيفاء ملاحظاته على المراحل أو فترات الاعتماد من الجهات المختصة.',
        'تبدأ المدة الزمنية بعد اعتماد المخططات المعمارية والواجهات من قبل الطرف الأول.',
        'تبدأ أعمال التصميم بعد استلام الدفعة المقدمة.',
      ];
      timelineRows = [
        {
          id: 't-1',
          stage: 'الأولى',
          workTitle: 'التصميم المعماري والهندسي',
          details: 'إعداد المخططات المعمارية والإنشائية والكهروميكانيكية واستكمال متطلبات الرخصة',
          duration: `${durationDays} يوم عمل`,
        },
      ];
      timelineTotalLabel = 'إجمالي زمن إنهاء المخططات المعمارية والهندسية';
      timelineTotalDuration = `${durationDays} يوم عمل`;
      generalTerms = [
        'الأفكار الأولية حق من حقوق الاستشاري المصمم ولا يحق للمالك استخدام الأفكار أو تطويرها أو تعديلها مع مكتب استشاري آخر.',
        'يقوم الاستشاري بتسليم عدد نسخة واحدة مطبوعة من المخططات عند الانتهاء من أعمال التصميم ونسخة إلكترونية على إيميل المالك لكافة الأعمال.',
        'يتم اعتماد كل مرحلة من المالك كتابياً قبل البدء في المرحلة التالية، ولن يتم البدء في أي مرحلة من مراحل العمل إلا بعد الحصول على موافقة المالك على اعتماد المرحلة السابقة.',
        'عند طلب أي تغيير في التصميمات لأي مرحلة تكون قد انتهت واعتمدت من المالك، يحق للاستشاري المطالبة بأتعاب إضافية وزيادة المدة الزمنية، على أن يقوم الاستشاري برفع المطالبة للمالك لاعتمادها قبل البدء في التعديلات.',
        `يحق للمالك (${clientInfo.revisionCountText || 'تعديلان (2)'}) على التصميم المعماري ومناظير الواجهات قبل الاعتماد النهائي.`,
        'في حال انسحاب المالك من العقد لسبب بيع الأرض أو أي أسباب خاصة به، يحق له المطالبة بنسبة 10% من الدفعات المدفوعة للطرف الثاني، وتعتبر باقي النسبة (90%) من الدفعات المستلمة هي أتعاب الطرف الثاني عن الأعمال المنجزة حتى وقت انسحاب المالك.',
        'يقوم المالك بمراجعة المخططات كاملة ومطابقتها لجميع التخصصات وذلك لمدة شهر من تاريخ التسليم، على أن يتم إرسال الملاحظات كاملة إن وجدت لكافة التخصصات مرة واحدة لدراستها والرد عليها، وفي حال تأخر الطرف الأول عن مدة المراجعة يتم حساب رسوم مراجعة وتعديل إضافية يتم تقديرها في حينها حتى وإن وجدت ملاحظات.',
        ...(clientInfo.exclusions?.excludeSupervision !== false
          ? ['لا يشمل هذا العقد أعمال الإشراف الهندسي الميداني على التنفيذ.']
          : []),
        ...(clientInfo.exclusions?.excludeQuantities !== false
          ? ['لا يشمل العمل إعداد جداول حصر وحساب الكميات.']
          : []),
      ];
      paymentMethodNote = 'يتم توزيع صرف دفعات التصميم حسب مراحل المشروع المختلفة كالتالي:';
      break;
    }

    case 'design_plans': {
      contractTitle = 'عقد تصميم مخططات هندسية';
      contractSubtitle = `لمشروع ${buildingType}`;
      preambleText = `حيث إن الطرف الأول يرغب بإعداد التصاميم والمخططات الهندسية لمشروع (${defaultPropertyDesc}) دون استخراج رخصة بناء، ويرغب في تكليف شركة استشارات هندسية متخصصة لإعداد المخططات المعتمدة. وحيث إن الطرف الثاني هو شركة استشارات هندسية وقد أبدى استعداده التام للقيام بالعمل المطلوب وفقاً لبنود هذا العقد.`;
      scopeGroups = buildDesignScopeGroups(clientInfo, items, false);
      ownerObligations = [
        'تزويد الاستشاري بالرفع المساحي وصورة الصك وكافة المتطلبات التصميمية قبل البدء.',
        'مراجعة واعتماد كل مرحلة تصميمية كتابياً خلال المدة المحددة.',
        'سداد الدفعات المالية في مواعيد استحقاقها وفق جدول الدفعات.',
      ];
      timelineNotes = [
        'الجدول الزمني المذكور لا يتضمن فترات المراجعة مع المالك أو استيفاء ملاحظاته على المراحل.',
        'تبدأ المدة الزمنية من تاريخ استلام الدفعة المقدمة وكافة بيانات الأرض.',
      ];
      timelineRows = [
        {
          id: 't-1',
          stage: 'الأولى',
          workTitle: 'التصميم المعماري والمناظير',
          details: 'إعداد الفكرة المعمارية والمساقط الأفقية والواجهات والقطاعات',
          duration: `${Math.max(10, Math.round(durationDays * 0.45))} يوم عمل`,
        },
        {
          id: 't-2',
          stage: 'الثانية',
          workTitle: 'المخططات الهندسية التنفيذية',
          details: 'إعداد المخططات الإنشائية والكهربائية والصحية والتكييف وتسليم النسخ النهائية',
          duration: `${Math.max(10, durationDays - Math.round(durationDays * 0.45))} يوم عمل`,
        },
      ];
      timelineTotalLabel = 'إجمالي زمن إنهاء المخططات الهندسية';
      timelineTotalDuration = `${durationDays} يوم عمل`;
      generalTerms = [
        'الأفكار الأولية حق من حقوق الاستشاري المصمم ولا يحق للمالك استخدام الأفكار أو تطويرها مع مكتب استشاري آخر.',
        'لا يشمل هذا العقد أعمال الرفع المساحي أو استخراج رخصة البناء عبر منصة بلدي ما لم يُنص على ذلك صراحةً.',
        'يقوم الاستشاري بتسليم نسخة إلكترونية (PDF + CAD) للمخططات المعتمدة بعد سداد الدفعة الختامية.',
        `يحق للمالك (${clientInfo.revisionCountText || 'تعديلان (2)'}) قبل الاعتماد النهائي للمرحلة المعمارية، وأي تعديلات لاحقة بعد الاعتماد تخضع لأتعاب إضافية.`,
        'لا يشمل هذا العقد أعمال الإشراف الهندسي أو حساب الكميات.',
      ];
      break;
    }

    case 'design_as_built': {
      const isComponentMod = combinedText.includes('تعديل مكونات');
      const isRenovation = combinedText.includes('ترميم');
      const isDemolition = combinedText.includes('هدم');

      if (isComponentMod) {
        contractTitle = 'عقد تعديل مكونات بناء';
        contractSubtitle = 'وإصدار رخصة التعديل';
      } else if (isRenovation) {
        contractTitle = 'عقد استخراج رخصة ترميم مبنى';
        contractSubtitle = `لمشروع ${buildingType}`;
      } else if (isDemolition) {
        contractTitle = 'عقد استخراج رخصة هدم مبنى';
        contractSubtitle = `لمشروع ${buildingType}`;
      } else {
        contractTitle = 'عقد تصحيح وضع مبنى قائم';
        contractSubtitle = 'وإعداد المخططات والتقرير الهندسي';
      }

      preambleText = `حيث إن الطرف الأول يرغب بتكليف شركة استشارات هندسية معتمدة لتنفيذ أعمال (${contractTitle} ${contractSubtitle}) لمشروع (${buildingType}) القائم على العقار الموضح بياناته أعلاه، وحيث إن الطرف الثاني هو شركة استشارات هندسية معتمدة وقد أبدى استعداده التام لتنفيذ الأعمال وفقاً للأنظمة البلدية وكود البناء السعودي وبنود هذا العقد.`;

      scopeGroups = [
        {
          id: 'scope-asbuilt-1',
          title: 'المعاينة الفنية ومخططات الوضع القائم :',
          items: isDemolition
            ? [
                'المعاينة الميدانية للمبنى القائم وتوثيق حدوده والمباني المجاورة.',
                'إعداد مخطط ومذكرة إجراءات السلامة للهدم طبقاً لاشتراطات الأمانة.',
                'التقديم والمتابعة عبر منصة بلدي حتى إصدار رخصة الهدم المعتمدة.',
              ]
            : isRenovation
            ? [
                'معاينة المبنى القائم وتحديد نطاق أعمال الترميم المطلوبة.',
                'إعداد التقرير الفني ومخططات الترميم اللازمة لمنصة بلدي.',
                'رفع المعاملة ومتابعتها حتى إصدار رخصة الترميم النظامية.',
              ]
            : [
                'معاينة المبنى القائم ومطابقة الرخصة والمخططات السابقة مع الواقع الفعلي.',
                'إعداد مخططات الوضع القائم (As-Built) والتعديلات المعمارية والإنشائية المطلوبة.',
                'إعداد التقرير الفني للسلامة الإنشائية وشهادة تحمل المبنى (عند اللزوم).',
                'رفع الطلب ومتابعة الإجراءات النظامية عبر منصة بلدي حتى الاعتماد النهائي.',
              ],
          layout: 'list',
        },
      ];

      ownerObligations = [
        'تزويد الاستشاري بنسخة من صك الملكية ورخصة البناء السابقة والمخططات المتوفرة.',
        'تمكين فريق المعاينة والمساحة من دخول المبنى وتسهيل أعمال الرفع والتصوير.',
        'سداد الرسوم الحكومية والبلدية وأي غرامات أو رسوم جهات أخرى إن وجدت.',
        'سداد أتعاب الاستشاري حسب جدول الدفعات المتفق عليه.',
      ];
      timelineNotes = [
        'المدة الزمنية لا تشمل مدد المراجعة لدى الأمانة أو البلدية أو الجهات الحكومية الأخرى.',
        'تبدأ المدة فور استلام الدفعة المقدمة وكافة المستندات المطلوبة من المالك.',
      ];
      timelineRows = [
        {
          id: 't-1',
          stage: 'الأولى',
          workTitle: 'المعاينة وإعداد المخططات والتقارير',
          details: 'الرفع الميداني وإعداد المخططات والتقرير الهندسي المعتمد',
          duration: `${Math.max(7, Math.round(durationDays * 0.6))} يوم عمل`,
        },
        {
          id: 't-2',
          stage: 'الثانية',
          workTitle: 'الرفع والمتابعة بالمنصة',
          details: 'التقديم الإلكتروني عبر منصة بلدي واستيفاء الملاحظات الفنية حتى الإصدار',
          duration: `${Math.max(5, durationDays - Math.round(durationDays * 0.6))} يوم عمل`,
        },
      ];
      timelineTotalLabel = 'إجمالي المدة التقديرية للأعمال الهندسية';
      timelineTotalDuration = `${durationDays} يوم عمل`;
      generalTerms = [
        'يقتصر التزام الاستشاري على الجوانب الهندسية والفنية وإجراءات الرفع الإلكتروني وفق الأنظمة السارية، ولا يتحمل مسؤولية أي مخالفات نظامية غير قابلة للتصحيح لدى الأمانة.',
        'في حال طلب الجهة المختصة اختبارات إضافية (مثل فحص الخرسانة أو التربة أو اختبارات القلب الخرساني) يتحمل المالك تكاليفها مباشرة لدى المختبر المعتمد.',
        'يتم اعتماد المخططات من المالك قبل الرفع النهائي على منصة بلدي.',
        'في حال إلغاء العقد بعد بدء الأعمال الفنية، يستحق الاستشاري قيمة الأعمال المنجزة بحد أدنى الدفعة المقدمة.',
      ];
      showIpRights = false;
      break;
    }

    case 'supervision': {
      const supStages = buildSupervisionInspectionStages(items, buildingType);
      const isDamageReport = combinedText.includes('تقرير أضرار');
      const isProjectMgmt = combinedText.includes('إدارة مشروع');
      const isGeneralSup = combinedText.includes('إشراف عام') || combinedText.includes('شهري');

      if (isDamageReport) {
        contractTitle = 'عقد إعداد تقرير فني للأضرار';
        contractSubtitle = `لمشروع ${buildingType}`;
      } else if (isProjectMgmt) {
        contractTitle = 'عقد إشراف هندسي وإدارة مشروع';
        contractSubtitle = `لمشروع ${buildingType}`;
      } else if (isGeneralSup) {
        contractTitle = 'عقد إشراف هندسي عام';
        contractSubtitle = `لمشروع ${buildingType}`;
      } else {
        contractTitle = 'عقد إشراف مرحلة العظم';
        contractSubtitle = '';
      }

      preambleText = `حيث إن الطرف الأول يرغب بتكليف شركة استشارات هندسية لأعمال ${
        isDamageReport
          ? 'المعاينة الهندسية وإعداد التقرير الفني للأضرار'
          : isProjectMgmt
          ? 'الإشراف الهندسي وإدارة التنفيذ حسب كود البناء السعودي'
          : 'الإشراف الهندسي لمرحلة العظم والمواد حسب كود البناء السعودي'
      } لمشروع (${defaultPropertyDesc}). وحيث إن الطرف الثاني هو شركة استشارات هندسية وقد أبدى استعداده التام للقيام بالعمل المطلوب ووفقاً لبنود هذا العقد.`;

      showProjectOverview = true;
      projectOverviewText = defaultPropertyDesc;
      consultantScopeTitle = 'التزامات الاستشاري :';
      scopeGroups = [
        {
          id: 'scope-sup-main',
          title: '',
          items:
            clientInfo.supervisionScopeCustomBullets && clientInfo.supervisionScopeCustomBullets.length > 0
              ? clientInfo.supervisionScopeCustomBullets
              : [
                  'إدارة ومتابعة المشروع فنياً والتعامل مع المقاولين في الأمور الفنية فقط حسب الأصول الفنية والمخططات المعتمدة.',
                  'متابعة الجودة وخطة سير عمل المقاولين وتقييم أعمالهم.',
                  'اتباع القواعد والأصول الفنية لتحقيق مصلحة المالك بما يحفظ ولا يخل بحقوق أطراف العقود الأخرى بالمشروع.',
                  'عدم القيام بأي تعديلات يتم طلبها من أي طرف في المشروع عما جاء بالمخططات والمواصفات المعتمدة.',
                ],
          layout: 'list',
        },
      ];

      showSupervisionStages = true;
      supervisionStagesTitle = supStages.title;
      supervisionMaxVisitsText = supStages.maxVisitsText;
      supervisionExtraVisitFeeText = supStages.extraVisitFeeText;
      supervisionStages = supStages.stages;

      ownerObligations = [
        'تقديم أصل رخصة البناء والمخططات المعتمدة من البلدية والأمانة وعقد المقاول.',
        'عدم إدخال الاستشاري في أي أمر قضائي بينه وبين المقاولين، فهو يمثله فقط في الجانب الفني في الموقع وهو ليس مسؤولاً عن الأمور المادية والخلافات التعاقدية مع المقاولين.',
        'إشعار الاستشاري بموعد بدء التنفيذ.',
        'تسليم الاستشاري الجدول الزمني للعمل في الموقع.',
        'التنسيق مع المقاول على أن يقوم بإبلاغ المهندس المشرف قبل موعد الزيارة بـ 48 ساعة ليتسنى له تنسيق مواعيد العمل، وفي حالة الصب أو العمل بدون إذن أو أمر صب يتحمل المالك كامل المسؤولية لعدم التنسيق مع المهندس.',
      ];

      showTimelineTable = false;
      showIpRights = false;
      generalTerms = [
        'يفسخ العقد تلقائياً في حال عدم مراجعة الطرف الأول للاستشاري خلال شهر من توقيع العقد.',
        'في حالة تنفيذ أي أعمال مخالفة للمخططات المعتمدة من قبل الأمانة سيفسخ العقد تلقائياً وسيتم إبلاغ الأمانة بذلك.',
        'في حال تكرار الملاحظات من قبل المقاول وعدم تنفيذ ملاحظات المهندس المشرف تكون أي زيارة مكررة مدفوعة من قبل المالك بمبلغ 700 ريال.',
        'يحق للطرف الثاني استبعاد أي عامل أو مقاول في حال عدم اتباعه تعليمات المهندس المشرف الفنية أو تجاوز الآداب والأخلاق العامة بدون الرجوع للطرف الأول.',
        'في حال إلغاء العقد بناءً على بنود التعاقد، أو عدم التزام المالك في الدفعات، فإن الدفعات المسددة تكون من حق الاستشاري ولا يحق للمالك المطالبة بها وتعتبر هي أتعابه عن كافة الأعمال خلال مدة التعاقد وللاستشاري الحق بالمطالبة بأي مبالغ مستحقة عن أعمال أو زيارات أخرى تمت في إطار العمل.',
      ];
      paymentMethodNote = 'كيفية الدفع: يتم الدفع بتحويل بنكي على حساب الشركة المذكور أدناه وفق جدول الدفعات التالي:';
      break;
    }

    case 'decor': {
      contractTitle = 'عقد تصميم داخلي وديكور';
      contractSubtitle = `لمشروع ${buildingType}`;
      const decorAreaText = `${formatNumber(areaDetails.numericArea || clientInfo.floorArea || 350)} م²`;
      preambleText = `حيث إن الطرف الأول يرغب بإعداد أعمال التصميم الداخلي والديكور لمشروع (${buildingType}) بإجمالي مساحة طابقية مشمولة بالتصميم تبلغ (${decorAreaText})، ويرغب في تكليف شركة استشارات هندسية وتصميم داخلي للقيام بأعمال التصميم وإعداد المناظير والمخططات التنفيذية. وحيث إن الطرف الثاني هو شركة استشارات هندسية وتصميم وقد أبدى استعداده التام للقيام بالعمل المطلوب وفقاً لبنود هذا العقد.`;

      const activeDecorScopes = getActiveScopeItemsForQuotation(clientInfo, items);
      scopeGroups =
        activeDecorScopes.length > 0
          ? activeDecorScopes.map((s, idx) => ({
              id: `scope-decor-${idx}`,
              title: `${s.name} :`,
              items: [s.description],
              layout: 'list' as const,
            }))
          : [
              {
                id: 'scope-decor-1',
                title: 'الرفع المساحي ولوحة الأفكار (Moodboard) :',
                items: [
                  'معاينة ورفع الأبعاد الفعلية للفراغات الداخلية المستهدفة بالتصميم.',
                  'إعداد لوحات الأفكار التوجيهية (Moodboard) وتناسق الألوان والخامات والأثاث.',
                ],
                layout: 'list',
              },
              {
                id: 'scope-decor-2',
                title: 'المناظير ثلاثية الأبعاد (3D Renders) :',
                items: [
                  'إعداد لقطات ومناظير واقية ثلاثية الأبعاد عالية الدقة لجميع الفراغات المشمولة بالتصميم.',
                  'بيان توزيع الإضاءة، الدهانات، التكسيات الجدارية، الأسقف، وتنسيق الفرش.',
                ],
                layout: 'list',
              },
              {
                id: 'scope-decor-3',
                title: 'المخططات التنفيذية وجداول المواصفات (Shop Drawings & BOQ) :',
                items: [
                  'مخططات توزيع الأثاث والأرضيات والأسقف المستعارة ومخطط توزيع الإنارة والكهرباء الديكورية.',
                  'توصيف الخامات والمواد والألوان وجداول حصر الكميات اللازمة للتنفيذ.',
                ],
                layout: 'list',
              },
            ];

      ownerObligations = [
        'تزويد الاستشاري بالمخططات المعمارية للمبنى وتحديد قائمة الفراغات المستهدفة والأسلوب التصميمي المطلوب.',
        'تمكين فريق الرفع المساحي الداخلي من معاينة الموقع على الطبيعة.',
        'اعتماد لوحة الأفكار (Moodboard) واللقطات ثلاثية الأبعاد كتابياً قبل الانتقال لمرحلة المخططات التنفيذية.',
        'سداد الدفعات المالية حسب الجدول المعتمد في هذا العقد.',
      ];
      timelineNotes = [
        'لا يشمل الجدول الزمني فترات المراجعة والاعتماد من قبل المالك.',
        'تبدأ أعمال التصميم الداخلي فور استلام الدفعة المقدمة وإتمام الرفع الميداني للفراغات.',
      ];
      timelineRows = [
        {
          id: 't-d1',
          stage: 'الأولى',
          workTitle: 'الفكرة التصميمية واللقطات ثلاثية الأبعاد 3D',
          details: 'الرفع الميداني ولوحة الأفكار وإعداد المناظير الواقعية ثلاثية الأبعاد للفراغات',
          duration: `${Math.max(10, Math.round(durationDays * 0.6))} يوم عمل`,
        },
        {
          id: 't-d2',
          stage: 'الثانية',
          workTitle: 'المخططات التنفيذية وجداول المواد',
          details: 'إعداد المخططات التنفيذية التفصيلية وجداول توصيف المواد وحصر الكميات',
          duration: `${Math.max(7, durationDays - Math.round(durationDays * 0.6))} يوم عمل`,
        },
      ];
      timelineTotalLabel = 'إجمالي مدة أعمال التصميم الداخلي والديكور';
      timelineTotalDuration = `${durationDays} يوم عمل`;
      generalTerms = [
        `يشمل العقد عدد (${clientInfo.revisionCountText || 'تعديلان (2)'}) على اللقطات ثلاثية الأبعاد قبل الاعتماد النهائي، وأي تعديلات جوهرية بعد الاعتماد أو تغيير النمط التصميمي تُحسب بأتعاب إضافية.`,
        'لا يشمل هذا العقد أعمال التنفيذ أو التوريد أو الإشراف الميداني على مقاولي الديكور ما لم يُبرم ملحق عقد مستقل.',
        'تخضع أي زيادة في المساحة الطابقية الفعلية عن المساحة المتعاقد عليها لتعديل قيمة العقد بذات سعر المتر المربع المتفق عليه.',
        'يتم تسليم الملفات النهائية بصيغة PDF عالية الدقة ومخططات تنفيذية معتمدة بعد سداد الدفعة الختامية.',
      ];
      showIpRights = true;
      break;
    }

    case 'survey': {
      contractTitle = 'عقد أعمال الرفع المساحي';
      contractSubtitle = 'وإصدار القرارات المساحية';
      preambleText = `حيث إن الطرف الأول يرغب بتكليف مكتب هندسي مساحي معتمد لتنفيذ أعمال الرفع المساحي وإصدار القرارات / الكروكيات المساحية لقطعة الأرض الموضحة بياناتها أعلاه، وحيث إن الطرف الثاني هو شركة استشارات هندسية معتمدة وقد أبدى استعداده التام لتنفيذ الأعمال وفق معايير الأمانة والهيئة العامة للمساحة والمعلومات الجيومكانية وبنود هذا العقد.`;

      scopeGroups = [
        {
          id: 'scope-survey-work',
          title: 'نطاق الأعمال المساحية المتفق عليها :',
          items:
            items.length > 0
              ? items.flatMap((i) => [i.title, ...i.details.slice(0, 3)])
              : [
                  'المعاينة والرفع المساحي الميداني الدقيق باستخدام أجهزة الرصد المساحي المعتمدة (GPS / Total Station).',
                  'مطابقة حدود وأطوال الأرض مع الصك الإلكتروني والمخطط التنظيمي المعتمد.',
                  'إعداد التقرير المساحي والمخطط الإحداثي ورفعه عبر المنصات البلدية المعتمدة (بلدي).',
                ],
          layout: 'list',
        },
      ];
      ownerObligations = [
        'تقديم صورة الصك الإلكتروني الساري وهوية المالك وكافة المستندات النظامية للقطعة.',
        'إزالة أي عوائق بالموقع وتمكين الفرقة المساحية من الوصول لأركان الأرض وحدودها.',
        'سداد الرسوم الحكومية المقررة على منصة بلدي أو الجهات ذات العلاقة.',
      ];
      timelineNotes = [
        'تبدأ المدة من تاريخ استلام الدفعة المقدمة وتوفر كافة بيانات الصك وإتاحة دخول الموقع.',
        'المدة لا تشمل مدد التدقيق والاعتماد لدى الأمانة أو كتابة العدل.',
      ];
      timelineRows = [
        {
          id: 't-s1',
          stage: 'الأولى',
          workTitle: 'الرفع الميداني والمعالجة المكتبية',
          details: 'إجراء الرصد المساحي وإعداد الكروكي والتقرير الإحداثي ورفعه على المنصة',
          duration: `${Math.min(durationDays, 10)} يوم عمل`,
        },
      ];
      timelineTotalLabel = 'إجمالي مدة تنفيذ الأعمال المساحية';
      timelineTotalDuration = `${Math.min(durationDays, 10)} يوم عمل`;
      generalTerms = [
        'تتم جميع أعمال الرفع المساحي وفق الإحداثيات الوطنية المعتمدة واشتراطات الأمانة.',
        'في حال وجود تداخل في الصكوك أو عدم تطابق فعلي يستدعي إجراءات تعديل صك أو مراجعة لجان، تُنفذ وفق اتفاق إضافي مستقل.',
        'لا تتحمل الشركة أي تأخير ناتج عن توقف أو تحديث الأنظمة الحكومية أو عدم تمكين المساح من دخول الموقع.',
      ];
      showIpRights = false;
      break;
    }

    case 'civil_defense': {
      contractTitle = 'عقد أعمال السلامة والدفاع المدني';
      contractSubtitle = 'مخططات واعتمادات الوقاية من الحريق (SBC 801)';
      preambleText = `حيث إن الطرف الأول يرغب بتكليف مكتب استشارات هندسية معتمد لدى المديرية العامة للدفاع المدني لإعداد مخططات وتقارير السلامة والوقاية من الحريق لمشروع (${buildingType}) وفق كود البناء السعودي للحماية من الحرائق (SBC 801) واشتراطات بوابة سلامة، وحيث إن الطرف الثاني قد أبدى استعداده التام لتنفيذ الأعمال وفقاً لبنود هذا العقد.`;

      scopeGroups = [
        {
          id: 'scope-cd-work',
          title: 'نطاق أعمال السلامة والوقاية من الحريق :',
          items:
            items.length > 0
              ? items.flatMap((i) => [i.title, ...i.details.slice(0, 3)])
              : [
                  'دراسة المنشأة وإعداد مخططات أنظمة الإنذار المبكر والإطفاء ومخارج الطوارئ طبقاً لكود SBC 801.',
                  'إعداد الحسابات الهيدروليكية واختيار قدرات مضخات الحريق وشبكات الرش الآلي.',
                  'إعداد التقرير الفني للسلامة ورفع المعاملة ومتابعتها عبر بوابة سلامة حتى الاعتماد.',
                ],
          layout: 'list',
        },
      ];
      ownerObligations = [
        'تزويد الاستشاري بالمخططات المعمارية المعتمدة ورخصة البناء والسجل التجاري للنشاط.',
        'التعاقد المباشر مع مؤسسة/مقاول أمن وسلامة معتمد لدى الدفاع المدني لتنفيذ وتركيب الأنظمة في الموقع.',
        'سداد الرسوم الحكومية ورسوم بوابة سلامة وتنفيذ أي ملاحظات إنشائية أو تشغيلية بالموقع.',
      ];
      timelineNotes = [
        'المدة الزمنية لا تشمل فترات التدقيق والاعتماد لدى الدفاع المدني أو فترات تنفيذ مقاول السلامة في الموقع.',
      ];
      timelineRows = [
        {
          id: 't-cd1',
          stage: 'الأولى',
          workTitle: 'إعداد مخططات وتقارير السلامة',
          details: 'إعداد مخططات الإنذار والإطفاء والحسابات الهيدروليكية والتقرير الفني',
          duration: `${Math.min(durationDays, 15)} يوم عمل`,
        },
      ];
      timelineTotalLabel = 'إجمالي مدة إعداد مخططات وتقارير الدفاع المدني';
      timelineTotalDuration = `${Math.min(durationDays, 15)} يوم عمل`;
      generalTerms = [
        'يقتصر نطاق هذا العقد على الأعمال الاستشارية الهندسية والتصميمية ورفع التقارير عبر بوابة سلامة، ولا يشمل توريد أو تركيب معدات الإطفاء والإنذار.',
        'يلتزم المالك بتنفيذ جميع اشتراطات الدفاع المدني الموضحة في المخططات المعتمدة عبر مقاول سلامة مرخص قبل طلب الكشف النهائي.',
        'في حال طلب الدفاع المدني تعديلات ناتجة عن تغيير النشاط التجاري من قبل المالك، تُحسب بأتعاب إضافية.',
      ];
      showIpRights = false;
      break;
    }

    case 'execution': {
      const isTurnkey = combinedText.includes('تسليم مفتاح');
      const isBoneLabor = combinedText.includes('مصنعيات');
      const isFinishing = combinedText.includes('تشطيب') && !isTurnkey;
      contractTitle = isTurnkey
        ? 'عقد تنفيذ ومقاولات (تسليم مفتاح)'
        : isBoneLabor
        ? 'عقد تنفيذ أعمال العظم (مصنعيات)'
        : isFinishing
        ? 'عقد أعمال تشطيب وترميم'
        : 'عقد تنفيذ أعمال العظم بالمواد';
      contractSubtitle = `لمشروع ${buildingType}`;

      preambleText = `حيث إن الطرف الأول يرغب بتنفيذ أعمال (${contractTitle}) لمشروع (${defaultPropertyDesc}) وفق المخططات الهندسية المعتمدة والمواصفات الفنية المتفق عليها، وحيث إن الطرف الثاني لديه الخبرة والكفاءة الفنية والهندسية اللازمة لتنفيذ هذه الأعمال وقد أبدى استعداده للقيام بها وفقاً لبنود هذا العقد.`;

      showProjectOverview = true;
      projectOverviewText = `${defaultPropertyDesc} — بمسطح بناء تقديري (${formatNumber(
        areaDetails.numericArea || clientInfo.buildingArea || 650
      )} م²)`;

      scopeGroups = [
        {
          id: 'scope-exec-work',
          title: 'نطاق أعمال التنفيذ والمقاولات :',
          items:
            items.length > 0
              ? items.flatMap((i) => [i.title, ...i.details])
              : [
                  'تجهيز الموقع وتنفيذ الأعمال الإنشائية والمعمارية طبقاً للمخططات المعتمدة وكود البناء السعودي.',
                  'الالتزام بالمواصفات القياسية للخرسانة الجاهزة وحديد التسليح ومواد العزل والتشطيب المعتمدة.',
                  'توفير العمالة الفنية المؤهلة والمهندس المشرف على التنفيذ وضمان جودة وسلامة الموقع.',
                ],
          layout: 'list',
        },
      ];
      ownerObligations = [
        'تسليم الموقع خالياً من العوائق مع أصل رخصة البناء وكافة المخططات المعتمدة.',
        'توفير مصدر المياه والكهرباء المؤقت اللازم لأعمال التنفيذ في الموقع.',
        'سداد المستخلصات والدفعات المرحلية في مواعيد استحقاقها لضمان عدم توقف سير العمل.',
        'تعيين المكتب الهندسي المشرف (إن لم يكن مشمولاً بالعقد) لاعتماد مراحل الصب والاستلامات.',
      ];
      timelineNotes = [
        'تبدأ مدة التنفيذ من تاريخ استلام الموقع خالياً من العوائق واستلام الدفعة المقدمة.',
        'تمتد المدة تلقائياً بما يعادل أي تأخير ناتج عن أوامر التغيير أو تأخر اعتماد العينات أو سداد الدفعات.',
      ];
      timelineRows = [
        {
          id: 't-e1',
          stage: 'الأولى',
          workTitle: 'التجهيز والأعمال الإنشائية الأساسية',
          details: 'تجهيز الموقع والحفر والأساسات والهيكل الإنشائي وفق المخططات المعتمدة',
          duration: `${Math.max(30, Math.round(durationDays * 0.55))} يوم عمل`,
        },
        {
          id: 't-e2',
          stage: 'الثانية',
          workTitle: 'استكمال الأعمال والتسليم الابتدائي',
          details: 'استكمال البنود المتعاقد عليها والنظافة والتسليم الابتدائي للمالك',
          duration: `${Math.max(20, Math.round(durationDays * 0.45))} يوم عمل`,
        },
      ];
      timelineTotalLabel = 'إجمالي المدة التقديرية للتنفيذ';
      timelineTotalDuration = `${Math.max(50, durationDays)} يوم عمل`;
      generalTerms = [
        'تُنفذ جميع الأعمال وفق الأصول الفنية وكود البناء السعودي، ويخضع كل بند للاستلام الهندسي قبل الانتقال للبند التالي.',
        'أي أعمال إضافية أو تعديلات خارج المخططات المعتمدة تتطلب أمر تغيير مكتوب يوضح التكلفة الإضافية والأثر الزمني.',
        'يلتزم الطرف الثاني بالضمان النظامي للأعمال المنفذة وفق الأنظمة المعمول بها في المملكة العربية السعودية.',
        'يُعتمد التمتير الفعلي للمسطحات المنفذة على الطبيعة عند الحساب الختامي للعقد.',
      ];
      showIpRights = false;
      break;
    }

    case 'combined':
    default: {
      contractTitle = 'عقد تقديم خدمات استشارية وهندسية متكاملة';
      contractSubtitle = `لمشروع ${buildingType}`;
      const deptNames = Array.from(new Set(items.map((i) => i.departmentName))).join('، و');
      preambleText = `حيث إن الطرف الأول يرغب بتكليف شركة استشارات هندسية معتمدة لتنفيذ حزمة متكاملة من الأعمال الهندسية تشمل (${
        deptNames || clientInfo.serviceType
      }) لمشروع (${defaultPropertyDesc})، وحيث إن الطرف الثاني هو شركة استشارات هندسية وقد أبدى استعداده التام لتنفيذ كافة الأعمال المطلوبة ووفقاً لبنود هذا العقد.`;

      const hasDesign = items.some((i) => i.departmentId === 'design');
      const hasSupervision =
        items.some((i) => i.departmentId === 'supervision') || Boolean(clientInfo.scopeFlags?.supervision);
      const hasDecor = items.some((i) => i.departmentId === 'decor');
      const hasSurvey = items.some((i) => i.departmentId === 'survey');
      const hasCivilDefense = items.some((i) => i.departmentId === 'civil_defense');
      const hasExecution = items.some((i) => i.departmentId === 'execution');

      if (hasDesign) {
        scopeGroups.push(...buildDesignScopeGroups(clientInfo, items, true));
      }
      if (hasDecor) {
        const decorScopes = getActiveScopeItemsForQuotation(clientInfo, items).filter((s) =>
          s.id.startsWith('decor_')
        );
        scopeGroups.push({
          id: 'scope-comb-decor',
          title: 'أعمال التصميم الداخلي والديكور :',
          items:
            decorScopes.length > 0
              ? decorScopes.map((s) => `${s.name}: ${s.description}`)
              : [
                  'إعداد لوحات الأفكار واللقطات ثلاثية الأبعاد 3D والمخططات التنفيذية وجداول المواد والكميات.',
                ],
          layout: 'list',
        });
      }
      if (hasSurvey && !hasDesign) {
        scopeGroups.push({
          id: 'scope-comb-survey',
          title: 'أعمال المساحة والقرارات المساحية :',
          items: items
            .filter((i) => i.departmentId === 'survey')
            .flatMap((i) => [i.title, ...i.details.slice(0, 2)]),
          layout: 'list',
        });
      }
      if (hasCivilDefense) {
        scopeGroups.push({
          id: 'scope-comb-cd',
          title: 'أعمال الدفاع المدني والأمن والسلامة (SBC 801) :',
          items: items
            .filter((i) => i.departmentId === 'civil_defense')
            .flatMap((i) => [i.title, ...i.details.slice(0, 2)]),
          layout: 'list',
        });
      }
      if (hasExecution) {
        scopeGroups.push({
          id: 'scope-comb-exec',
          title: 'أعمال التنفيذ والمقاولات :',
          items: items
            .filter((i) => i.departmentId === 'execution')
            .flatMap((i) => [i.title, ...i.details.slice(0, 3)]),
          layout: 'list',
        });
      }
      if (hasSupervision) {
        scopeGroups.push({
          id: 'scope-comb-sup',
          title: 'أعمال الإشراف الهندسي الميداني :',
          items:
            clientInfo.supervisionScopeCustomBullets && clientInfo.supervisionScopeCustomBullets.length > 0
              ? clientInfo.supervisionScopeCustomBullets
              : [
                  'إدارة ومتابعة المشروع فنياً والتعامل مع المقاولين حسب الأصول الفنية والمخططات المعتمدة.',
                  'استلام مراحل التنفيذ وتوثيق التقارير والزيارات الميدانية عبر منصة بلدي.',
                ],
          layout: 'list',
        });
        const supStages = buildSupervisionInspectionStages(items, buildingType);
        showSupervisionStages = true;
        supervisionStagesTitle = supStages.title;
        supervisionMaxVisitsText = supStages.maxVisitsText;
        supervisionExtraVisitFeeText = supStages.extraVisitFeeText;
        supervisionStages = supStages.stages;
      }

      ownerObligations = [
        'تزويد الاستشاري بكافة المستندات النظامية (الصك، الهوية، الرخص السابقة) والبيانات المطلوبة للبدء.',
        'تجهيز تقرير فحص التربة وسداد الرسوم الحكومية والتأمين ضد العيوب الخفية إن انطبقت.',
        'اعتماد كل مرحلة كتابياً في المواعيد المحددة وسداد الدفعات حسب الجدول المتفق عليه.',
        ...(hasSupervision
          ? [
              'التنسيق مع المقاول لإبلاغ المهندس المشرف قبل موعد كل زيارة بـ 48 ساعة، وعدم الصب دون إذن هندسي.',
            ]
          : []),
      ];

      timelineNotes = [
        'الجدول الزمني المذكور لا يتضمن فترات المراجعة مع المالك أو فترات الاعتماد لدى الجهات الحكومية.',
        'تبدأ الأعمال فور استلام الدفعة المقدمة واعتماد المرحلة التمهيدية.',
      ];

      let stageNum = 1;
      const ordinals = ['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة'];
      if (hasDesign || hasSurvey || hasCivilDefense) {
        timelineRows.push({
          id: `t-c-${stageNum}`,
          stage: ordinals[stageNum - 1] || `${stageNum}`,
          workTitle: 'التصاميم والمخططات والتراخيص',
          details: 'إعداد المخططات الهندسية واستكمال التراخيص والاعتمادات المطلوبة',
          duration: `${durationDays} يوم عمل`,
        });
        stageNum++;
      }
      if (hasDecor) {
        timelineRows.push({
          id: `t-c-${stageNum}`,
          stage: ordinals[stageNum - 1] || `${stageNum}`,
          workTitle: 'التصميم الداخلي والديكور',
          details: 'إعداد اللقطات ثلاثية الأبعاد والمخططات التنفيذية وجداول المواد',
          duration: '25 يوم عمل',
        });
        stageNum++;
      }
      if (hasSupervision || hasExecution) {
        timelineRows.push({
          id: `t-c-${stageNum}`,
          stage: ordinals[stageNum - 1] || `${stageNum}`,
          workTitle: hasExecution ? 'أعمال التنفيذ والإشراف' : 'الإشراف الهندسي الميداني',
          details: 'متابعة واستلام المراحل الإنشائية وفق الجدول الزمني للمقاول في الموقع',
          duration: 'حسب مدة التنفيذ بالموقع',
        });
      }
      timelineTotalLabel = 'إجمالي المدة التعاقدية للأعمال المكتبية';
      timelineTotalDuration = `${durationDays} يوم عمل`;

      generalTerms = [
        'يتم اعتماد كل مرحلة من المالك كتابياً قبل البدء في المرحلة التالية.',
        'الأفكار والتصاميم الأولية حق أصيل للاستشاري ولا يحق للمالك استخدامها أو تطويرها مع مكتب آخر.',
        `يحق للمالك (${clientInfo.revisionCountText || 'تعديلان (2)'}) قبل الاعتماد النهائي، وأي تعديلات لاحقة بعد الاعتماد تُحسب بأتعاب إضافية.`,
        'عند انسحاب المالك من العقد، يستحق الاستشاري أتعاب كافة المراحل المنجزة وما تم بدؤه من أعمال بحد أدنى 90% من الدفعات المستلمة عن المرحلة الجارية.',
        ...(hasSupervision
          ? [
              'في حال تكرار ملاحظات المقاول وعدم التزامه بتعليمات المهندس المشرف تُحتسب الزيارة المكررة بقيمة 700 ريال.',
            ]
          : ['لا يشمل هذا العقد أعمال الإشراف الهندسي على التنفيذ ما لم يُذكر ضمن نطاق الأعمال أعلاه.']),
      ];
      showIpRights = true;
      break;
    }
  }

  return {
    enabled: isEnabled,
    templateKind,
    autoSynced: true,
    contractTitle,
    contractSubtitle,
    contractNumber,
    signingCity: city,
    signingDayName,
    signingDate,
    firstPartyName,
    firstPartyId,
    firstPartyAddress,
    firstPartyPhone,
    firstPartyEmail,
    propertyDescription: defaultPropertyDesc,
    propertyRealEstateNumber,
    secondPartyText: DEFAULT_SECOND_PARTY_TEXT,
    preambleText,
    showProjectOverview,
    projectOverviewText,
    consultantScopeTitle,
    scopeGroups,
    showSupervisionStages,
    supervisionStagesTitle,
    supervisionMaxVisitsText,
    supervisionExtraVisitFeeText,
    supervisionStages,
    ownerObligations,
    showTimelineTable,
    timelineNotes,
    timelineRows,
    timelineTotalLabel,
    timelineTotalDuration,
    generalTerms,
    showIpRights,
    ipRights,
    pricingIntroText,
    paymentMethodNote,
    closingText: 'هذا والله ولي التوفيق،',
    showCompanySeal: true,
  };
}

/**
 * Ensures we always have a clean, up-to-date ContractData for preview/editing/export.
 * - If user hasn't customized the contract manually (autoSynced !== false), regenerates smartly from current items & clientInfo.
 * - If user DID customize the contract manually (autoSynced === false), preserves all their custom text/clauses while keeping core quote identity fields fresh if empty.
 */
export function resolveActiveContractData(
  clientInfo: ClientInfo,
  items: QuotationItem[]
): ContractData {
  const existing = clientInfo.contractData;
  if (!existing) {
    return buildSmartContract(clientInfo, items, undefined, false);
  }
  if (existing.autoSynced !== false) {
    const fresh = buildSmartContract(clientInfo, items, undefined, existing.enabled);
    return {
      ...fresh,
      firstPartyId: existing.firstPartyId || fresh.firstPartyId,
      firstPartyAddress: existing.firstPartyAddress || fresh.firstPartyAddress,
      propertyRealEstateNumber: existing.propertyRealEstateNumber || fresh.propertyRealEstateNumber,
      showCompanySeal: existing.showCompanySeal !== undefined ? existing.showCompanySeal : true,
    };
  }
  // Custom-edited contract: keep user's manual edits intact, only backfill empty party fields from clientInfo
  return {
    ...existing,
    firstPartyName: existing.firstPartyName || clientInfo.clientName || '',
    firstPartyPhone: existing.firstPartyPhone || clientInfo.phone || '',
    firstPartyEmail: existing.firstPartyEmail || clientInfo.email || '',
    firstPartyId: existing.firstPartyId || clientInfo.nationalId || '',
    contractNumber: existing.contractNumber || formatContractNumber(clientInfo.proposalNumber),
  };
}

/**
 * Builds clean Arabic plain text for WhatsApp / clipboard sharing of the contract.
 */
export function buildContractPlainText(
  contract: ContractData,
  clientInfo: ClientInfo,
  items: QuotationItem[]
): string {
  const subtotal = items.reduce((acc, item) => acc + item.totalPrice, 0);
  let discountAmount = 0;
  if (clientInfo.discountType === 'percentage') {
    discountAmount = Math.round((subtotal * (clientInfo.discountValue || 0)) / 100);
  } else {
    discountAmount = clientInfo.discountValue || 0;
  }
  discountAmount = Math.min(discountAmount, subtotal);
  const amountAfterDiscount = subtotal - discountAmount;
  const taxAmount = clientInfo.includeTax ? Math.round(amountAfterDiscount * 0.15) : 0;
  const grandTotal = amountAfterDiscount + taxAmount;
  const milestones = getPaymentMilestones(
    clientInfo.paymentScheduleType,
    grandTotal,
    clientInfo.customMilestones
  );

  const lines: string[] = [
    `${contract.contractTitle}${contract.contractSubtitle ? ` — ${contract.contractSubtitle}` : ''}`,
    `الحمد لله رب العالمين والصلاة والسلام على نبينا محمد وعلى آله وصحبه أجمعين أما بعد،`,
    `تم إبرام العقد رقم (${contract.contractNumber}) بمدينة ${contract.signingCity} يوم ${contract.signingDayName} الموافق ${formatContractDisplayDate(contract.signingDate)} م`,
    `---------------------------------------`,
    `الطرف الأول (المالك): ${contract.firstPartyName || 'العميل الكريم'} | هوية: ${contract.firstPartyId || '—'} | جوال: ${contract.firstPartyPhone || '—'}`,
    `الطرف الثاني (الاستشاري): ${contract.secondPartyText}`,
    `---------------------------------------`,
    `المقدمة: ${contract.preambleText}`,
    `---------------------------------------`,
    `${contract.consultantScopeTitle}`,
    ...contract.scopeGroups.flatMap((g) => [
      ...(g.title ? [`▸ ${g.title}`] : []),
      ...(g.subtitle ? [`  ${g.subtitle}`] : []),
      ...g.items.map((item) => `  • ${item}`),
    ]),
    ...(contract.showSupervisionStages && contract.supervisionStages.length > 0
      ? [
          `---------------------------------------`,
          contract.supervisionStagesTitle,
          contract.supervisionMaxVisitsText,
          contract.supervisionExtraVisitFeeText,
          ...contract.supervisionStages.map((s, idx) => `${idx + 1}. ${s}`),
        ]
      : []),
    `---------------------------------------`,
    `التزامات المالك:`,
    ...contract.ownerObligations.map((o, idx) => `${idx + 1}. ${o}`),
    `---------------------------------------`,
    `شروط عامة:`,
    ...contract.generalTerms.map((t, idx) => `${idx + 1}. ${t}`),
    `---------------------------------------`,
    `الأسعار وطريقة الدفع:`,
    `قيمة الأعمال: ${formatSAR(subtotal)}`,
    ...(discountAmount > 0 ? [`الخصم: - ${formatSAR(discountAmount)}`] : []),
    ...(clientInfo.includeTax ? [`ضريبة القيمة المضافة (15%): ${formatSAR(taxAmount)}`] : []),
    `إجمالي قيمة العقد: ${formatSAR(grandTotal)} (${tafqeetSAR(grandTotal)})`,
    `جدول الدفعات:`,
    ...milestones.map((m, idx) => `${idx + 1}. ${m.title} (${m.percentage}%) — ${formatSAR(m.amount)}: ${m.description}`),
    `الحساب البنكي: ${clientInfo.bankDetails?.bankName} | ${clientInfo.bankDetails?.accountName} | IBAN: ${clientInfo.bankDetails?.iban}`,
    contract.closingText,
  ];

  return lines.filter(Boolean).join('\n');
}
