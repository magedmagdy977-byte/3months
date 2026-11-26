export type CompanyId = 'luminous' | 'arq';

export type DepartmentId = 'design' | 'supervision' | 'decor' | 'survey' | 'civil_defense' | 'execution';

export type BuildingType =
  | 'villa'
  | 'residential'
  | 'commercial'
  | 'rest_house'
  | 'hotel'
  | 'gas_station'
  | 'factory'
  | 'warehouse_workshop';

export type SupervisionItemType = 'balady' | 'general' | 'project_management' | 'damage_report';

export type DesignServiceType =
  | 'new_license'
  | 'plan_design'
  | 'renovation'
  | 'as_built_mod'
  | 'component_mod'
  | 'demolition';

export type SupervisionType = 'none' | 'lump_sum' | 'monthly';

export type DecorStyle = 'modern' | 'neoclassic' | 'classic';

export interface DesignSubItem {
  id: string;
  name: string;
  defaultPrice: number;
  selected: boolean;
}

export interface QuotationItem {
  id: string;
  departmentId: DepartmentId;
  departmentName: string;
  title: string;
  buildingTypeLabel?: string;
  area?: number;
  pricingArea?: number;
  isDuplex?: boolean;
  details: string[];
  deliverables?: string[];
  basePrice: number;
  commercialMarkup?: number;
  totalPrice: number;
  notes?: string;
}

// Master Template: Scope conditional flags ({{IF:...}})
export interface MasterTemplateScopeFlags {
  survey: boolean; // {{IF:رفع_مساحي}}
  architectural: boolean; // {{IF:معماري}}
  structural: boolean; // {{IF:إنشائي}}
  electrical: boolean; // {{IF:كهرباء}}
  hvac: boolean; // {{IF:تكييف}}
  plumbing: boolean; // {{IF:صحي}}
  civilDefense: boolean; // {{IF:دفاع_مدني}}
  buildingLicense: boolean; // {{IF:رخصة}}
  asBuiltCorrection: boolean; // {{IF:تصحيح_وضع}}
  modifyComponents: boolean; // {{IF:تعديل_مكونات}}
  supervision: boolean; // {{IF:إشراف}}

  // قسم الديكور والتصميم الداخلي (وحدات شرطية IF قابلة للحذف والتعديل)
  decor_as_built?: boolean; // {{IF:رفع_مساحي_ديكور}}
  decor_moodboard?: boolean; // {{IF:مود_بورد}}
  decor_3d_renders?: boolean; // {{IF:مناظير_3D}}
  decor_shop_drawings?: boolean; // {{IF:مخططات_تنفيذية_ديكور}}
  decor_specifications?: boolean; // {{IF:جداول_المواصفات}}
  decor_boq?: boolean; // {{IF:جداول_الكميات}}
}

export interface CustomScopeOverride {
  title?: string;
  description?: string;
}

// Master Template: Conditional exclusions (الأعمال غير المشمولة)
export interface MasterTemplateExclusions {
  excludeSupervision: boolean; // {{IF:لا_يشمل_إشراف}}
  excludeQuantities: boolean; // {{IF:لا_يشمل_كميات}}
  excludeCivilDefense: boolean; // {{IF:لا_يشمل_دفاع_مدني}}
  excludeGovFees: boolean; // {{IF:رسوم_حكومية_غير_مشمولة}}
  excludeSoilTest: boolean; // {{IF:فحص_تربة_غير_مشمول}}
  excludeInsurance: boolean; // {{IF:تأمين_غير_مشمول}}
  customExclusions?: string; // {{استثناءات_إضافية}}
}

// Payment milestone in quotation
export interface PaymentMilestone {
  id: string;
  title: string;
  percentage: number;
  amount: number;
  description: string;
}

// Official bank account details
export interface BankAccountDetails {
  bankName: string;
  accountName: string;
  iban: string;
  accountNumber?: string;
}

export interface ClientInfo {
  // الشركة المصدرة للعرض والعقد
  companyId?: CompanyId;
  // أولًا: بيانات العرض والمشروع
  proposalNumber: string; // {{رقم_العرض}}
  date: string; // {{التاريخ}}
  clientName: string; // {{اسم_العميل}}
  nationalId?: string; // رقم الهوية / السجل التجاري
  buildingType: string; // {{نوع_المبنى}}
  isDuplex?: boolean; // فلل دوبلكس (تخفيض مساحة التسعير للنصف)
  projectCity: string; // {{المدينة}}
  district: string; // {{الحي}}
  plotNumber: string; // {{رقم_القطعة}}
  planNumber: string; // {{رقم_المخطط}}
  blockNumber?: string; // رقم البلك
  deedNumber?: string; // رقم الصك أو الوثيقة
  deedDate?: string; // تاريخ الصك
  deedRestrictions?: string; // القيود والالتزامات والرهون العقارية
  borders?: string; // الحدود والأطوال وعروض الشوارع
  landArea: number; // {{مساحة_الأرض}} م²
  buildingArea?: number; // مسطح البناء الإجمالي م²
  floorArea?: number; // المساحة الطابقية المدخلة بالفعل (خاص بقسم الديكور والفراغات) م²
  areaLabel?: string; // مسمى حقل المساحة المخصص (مثل "المساحة الطابقية" لقسم الديكور)
  serviceType: string; // {{نوع_الخدمة}}
  projectTitle: string;
  phone: string;
  email?: string;
  notes: string;

  // خامسًا وسادسًا: المدد والاعتمادات
  executionDurationDays: number; // {{مدة_التنفيذ}} يوم عمل
  startDateNotice: string; // {{بداية_المدة}}
  revisionCountText: string; // {{عدد_التعديلات}}
  validityDays: number; // {{مدة_صلاحية_العرض}}
  marketingRightsText: string; // {{حق_التسويق}}

  // ثالثًا وسابعًا: الشروط والاستثناءات
  scopeFlags: MasterTemplateScopeFlags;
  exclusions: MasterTemplateExclusions;

  // عاشرًا: جدول الدفعات والبنك
  paymentScheduleType: 'design_standard' | 'supervision_stages' | 'study_split' | 'custom';
  customMilestones?: PaymentMilestone[];
  bankDetails: BankAccountDetails;

  // الحسابات المالية
  includeTax: boolean; // 15%
  discountType: 'percentage' | 'fixed';
  discountValue: number;

  // مهندس المشروع ومعد العرض
  preparedBy?: string;

  // نطاق موقع الحي في الرياض (قسم التصميم وقسم الإشراف)
  locationZone?: RiyadhLocationZone;

  // التعديل اليدوي الشامل لجميع بنود النطاق الشرطي (الهندسية والديكور)
  customScopeOverrides?: Partial<Record<keyof MasterTemplateScopeFlags, CustomScopeOverride>>;

  // التعديل اليدوي لبند التصاميم المعمارية في النطاق الشرطي (توافق رجعي)
  architecturalScopeCustomTitle?: string;
  architecturalScopeCustomDescription?: string;

  // التعديل اليدوي لبنود قسم الإشراف في النطاق الشرطي
  supervisionScopeCustomTitle?: string;
  supervisionScopeCustomDescription?: string;
  supervisionScopeCustomBullets?: string[];

  // العقد الذكي القابل للتعديل والمرفق مع عرض السعر
  contractData?: ContractData;

  // حالة التعاقد مع العميل (تتبع داخلي للأرشيف)
  isContracted?: boolean;
  contractedAt?: string;
  contractedBy?: string;
}

export type ContractTemplateKind =
  | 'design_license'
  | 'design_plans'
  | 'design_as_built'
  | 'supervision'
  | 'decor'
  | 'survey'
  | 'civil_defense'
  | 'execution'
  | 'combined';

export type DocumentOutputBundle = 'quote_only' | 'quote_and_contract' | 'contract_only';

export interface ContractScopeSubgroup {
  id: string;
  title: string;
  subtitle?: string;
  items: string[];
  layout?: 'list' | 'two_column';
}

export interface ContractTimelineRow {
  id: string;
  stage: string;
  workTitle: string;
  details: string;
  duration: string;
}

export interface ContractData {
  enabled: boolean;
  templateKind: ContractTemplateKind;
  autoSynced: boolean;
  contractTitle: string;
  contractSubtitle: string;
  contractNumber: string;
  signingCity: string;
  signingDayName: string;
  signingDate: string;
  // الطرف الأول (المالك)
  firstPartyName: string;
  firstPartyId: string;
  firstPartyAddress: string;
  firstPartyPhone: string;
  firstPartyEmail: string;
  propertyDescription: string;
  propertyRealEstateNumber: string;
  // الطرف الثاني (الاستشاري)
  secondPartyText: string;
  // المقدمة
  preambleText: string;
  // الوصف العام للمشروع (اختياري - يظهر في عقود الإشراف والتنفيذ)
  showProjectOverview: boolean;
  projectOverviewText: string;
  // نطاق أعمال والتزامات الاستشاري
  consultantScopeTitle: string;
  scopeGroups: ContractScopeSubgroup[];
  // مراحل استلامات الأعمال (للإشراف أو العقود المشتركة)
  showSupervisionStages: boolean;
  supervisionStagesTitle: string;
  supervisionMaxVisitsText: string;
  supervisionExtraVisitFeeText: string;
  supervisionStages: string[];
  // التزامات المالك
  ownerObligations: string[];
  // المدة الزمنية لإنهاء مراحل المشروع
  showTimelineTable: boolean;
  timelineNotes: string[];
  timelineRows: ContractTimelineRow[];
  timelineTotalLabel: string;
  timelineTotalDuration: string;
  // شروط عامة
  generalTerms: string[];
  // حقوق الملكية الفكرية والفنية
  showIpRights: boolean;
  ipRights: string[];
  // الأسعار وطريقة الدفع
  pricingIntroText: string;
  paymentMethodNote: string;
  closingText: string;
  showCompanySeal: boolean;
}

export type RiyadhLocationZone = 'north_center' | 'east_west' | 'south' | 'none';

export interface UserSession {
  engineerName: string;
  role: 'admin' | 'engineer';
  loginTime: string;
}

export interface SavedQuotation {
  id: string;
  companyId?: CompanyId;
  quoteNumber: string;
  createdAt: string;
  clientInfo: ClientInfo;
  items: QuotationItem[];
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  preparedBy?: string;
  isSequential?: boolean;
  isContracted?: boolean;
  contractedAt?: string;
  contractedBy?: string;
}
