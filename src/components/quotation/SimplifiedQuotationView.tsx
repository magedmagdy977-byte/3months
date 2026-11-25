import React from 'react';
import { ClientInfo, PaymentMilestone, QuotationItem } from '../../types';
import { CompanyLogo } from '../CompanyLogo';
import { getCompanyProfile, resolveCompanyId } from '../../data/companies';
import { getActiveScopeItemsForQuotation } from '../../data/masterTemplateDefaults';
import { getQuotationAreaDetails } from '../../utils/formatters';
import { FileEdit } from 'lucide-react';

interface SimplifiedQuotationViewProps {
  items: QuotationItem[];
  clientInfo: ClientInfo;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  milestones: PaymentMilestone[];
  onEditMilestones?: () => void;
}

const formatEnNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(Math.round(num || 0));
};

const getCleanSubtitleLines = (clientInfo: ClientInfo): { line1: string; line2: string } => {
  const rawService = (clientInfo.serviceType || 'إصدار رخصة بناء وتصاميم هندسية').trim();
  const line1 = rawService.startsWith('أعمال') ? rawService : `أعمال ${rawService}`;

  const rawBuilding = (clientInfo.buildingType || 'فيلا سكنية').trim();
  let line2 = rawBuilding;
  if (rawBuilding.startsWith('لمشروع')) {
    line2 = rawBuilding;
  } else if (rawBuilding.startsWith('مشروع')) {
    line2 = `ل${rawBuilding}`;
  } else {
    line2 = `لمشروع ${rawBuilding}`;
  }

  return { line1, line2 };
};

const getSimplifiedScopeTitle = (id: string, defaultName: string): string => {
  switch (id) {
    case 'survey':
      return 'الرفع المساحي';
    case 'architectural':
      return defaultName && defaultName.trim() !== 'التصاميم المعمارية'
        ? defaultName.trim()
        : 'التصاميم المعمارية';
    case 'structural':
      return 'المخططات الإنشائية';
    case 'electrical':
      return 'المخططات الكهربائية';
    case 'hvac':
      return 'مخططات التكييف والتهوية';
    case 'plumbing':
      return 'مخططات السباكة';
    case 'buildingLicense':
      return 'إصدار رخصة البناء';
    case 'civilDefense':
      return 'مخططات الأمن والسلامة';
    case 'supervision':
      return 'الإشراف الهندسي';
    case 'asBuiltCorrection':
      return 'تصحيح وضع مبنى قائم';
    case 'modifyComponents':
      return 'تعديل مكونات البناء';
    case 'decor_as_built':
      return 'رفع مساحي للموقع';
    case 'decor_moodboard':
      return 'لوحة الأفكار والمود بورد';
    case 'decor_3d_renders':
      return 'مناظير ثلاثية الأبعاد 3D';
    case 'decor_shop_drawings':
      return 'المخططات التنفيذية';
    case 'decor_specifications':
      return 'جداول المواصفات والمواد';
    case 'decor_boq':
      return 'جداول الكميات BOQ';
    default:
      return defaultName;
  }
};

const getSimplifiedMilestoneLabel = (milestone: PaymentMilestone, index: number, total: number): string => {
  const desc = (milestone.description || '').trim();
  if (desc === 'عند توقيع العقد والبدء في إعداد الفكرة المعمارية والرفع المساحي للموقع.') {
    return 'عند توقيع العقد واعتماد البدء';
  }
  if (
    desc === 'بعد الانتهاء من المخططات الإنشائية والكهروميكانيكية والتنفيذية.' ||
    desc === 'عند اعتماد المخططات المعمارية والبدء بإعداد المخططات الإنشائية والكهروميكانيكية والتنفيذية.'
  ) {
    return 'بعد تسليم التصاميم المبدئية';
  }
  if (desc === 'عند استكمال كافة المخططات الهندسية والتقديم للاعتماد وإصدار رخصة البناء.') {
    return 'عند التسليم النهائي واعتماد المخرجات';
  }
  if (desc.length > 0) {
    return desc.replace(/\.$/, '');
  }
  if (index === 0) return 'عند توقيع العقد واعتماد البدء';
  if (index === total - 1) return 'عند التسليم النهائي واعتماد المخرجات';
  return 'بعد تسليم التصاميم المبدئية';
};

const getSimplifiedRevisionsText = (revisionText?: string): string => {
  const clean = (revisionText || '').trim();
  if (!clean || clean === 'تعديلان (2)' || clean === '(2) تعديلان') {
    return '(2) تعديلات لكل نطاق عمل';
  }
  return clean;
};

/**
 * Custom thin-stroke technical architectural icons matching the simplified infographic aesthetic
 */
const ScopeIcon: React.FC<{ id: string }> = ({ id }) => {
  const stroke = '#2C3E4C';
  switch (id) {
    case 'survey':
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9 print:w-8 print:h-8" fill="none" stroke={stroke} strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
          <rect x="14" y="6" width="12" height="7" rx="1.5" />
          <line x1="20" y1="6" x2="20" y2="4" />
          <circle cx="20" cy="9.5" r="1.5" />
          <line x1="12" y1="15.5" x2="28" y2="15.5" />
          <line x1="20" y1="13" x2="20" y2="32" />
          <line x1="17" y1="15.5" x2="10" y2="34" />
          <line x1="23" y1="15.5" x2="30" y2="34" />
          <line x1="13.5" y1="25" x2="26.5" y2="25" />
        </svg>
      );
    case 'architectural':
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9 print:w-8 print:h-8" fill="none" stroke={stroke} strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
          <rect x="7" y="7" width="26" height="26" rx="1.5" />
          <line x1="19" y1="7" x2="19" y2="20" />
          <line x1="7" y1="20" x2="15" y2="20" />
          <line x1="24" y1="20" x2="33" y2="20" />
          <line x1="24" y1="20" x2="24" y2="33" />
          <path d="M19 20 A 5 5 0 0 1 14 25" strokeDasharray="2 1.5" />
          <line x1="12" y1="7" x2="12" y2="10" />
          <line x1="28" y1="7" x2="28" y2="10" />
        </svg>
      );
    case 'structural':
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9 print:w-8 print:h-8" fill="none" stroke={stroke} strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="8,14 22,7 32,12 18,19" />
          <polyline points="8,14 8,17.5 14,20.5 14,27.5 8,24.5 8,28 18,33 32,26 32,22.5 26,19.5" />
          <line x1="18" y1="19" x2="18" y2="22.5" />
          <line x1="32" y1="12" x2="32" y2="15.5" />
          <line x1="18" y1="22.5" x2="32" y2="15.5" />
          <line x1="22" y1="20.5" x2="22" y2="28" />
          <line x1="18" y1="29.5" x2="18" y2="33" />
          <polyline points="14,27.5 18,29.5 32,22.5" />
        </svg>
      );
    case 'electrical':
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9 print:w-8 print:h-8" fill="none" stroke={stroke} strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="22,6 10,22 19,22 16.5,34 30,17 20.5,17" />
        </svg>
      );
    case 'hvac':
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9 print:w-8 print:h-8" fill="none" stroke={stroke} strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="20" cy="20" r="13.5" />
          <circle cx="20" cy="20" r="3" />
          <path d="M20 17 C18.5 11.5 23 8.5 25.5 11.5 C27 13.5 24 16.5 22.5 18" />
          <path d="M22.5 21.5 C27.5 23.5 28 28.5 24 29 C21.5 29.3 20 25.5 20 23" />
          <path d="M17.5 21.5 C12.5 23.5 10.5 19 13 16.5 C15 14.5 17.5 17 18.5 18.5" />
        </svg>
      );
    case 'plumbing':
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9 print:w-8 print:h-8" fill="none" stroke={stroke} strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
          <rect x="8" y="29" width="11" height="3.5" rx="1" />
          <rect x="29" y="8" width="3.5" height="11" rx="1" />
          <path d="M10.5 29 V17.5 C10.5 13 13.5 10.5 18 10.5 H29" />
          <path d="M16.5 29 V19 C16.5 17.5 17.5 16.5 19 16.5 H29" />
          <line x1="21.5" y1="8.5" x2="21.5" y2="18.5" />
        </svg>
      );
    case 'buildingLicense':
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9 print:w-8 print:h-8" fill="none" stroke={stroke} strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="6" width="22" height="27" rx="2.5" />
          <line x1="14" y1="12" x2="26" y2="12" />
          <line x1="14" y1="16.5" x2="26" y2="16.5" />
          <line x1="14" y1="21" x2="19" y2="21" />
          <circle cx="24" cy="24.5" r="3.5" />
          <polyline points="22.5,27.8 22,33 24,31.5 26,33 25.5,27.8" />
        </svg>
      );
    case 'civilDefense':
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9 print:w-8 print:h-8" fill="none" stroke={stroke} strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 L31 10.5 V19.5 C31 26.5 26.2 31.8 20 34 C13.8 31.8 9 26.5 9 19.5 V10.5 L20 6 Z" />
          <path d="M20 13 C22.5 16 24 18.2 24 20.5 C24 22.8 22.2 24.5 20 24.5 C17.8 24.5 16 22.8 16 20.5 C16 18.2 17.5 16 20 13 Z" />
        </svg>
      );
    case 'supervision':
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9 print:w-8 print:h-8" fill="none" stroke={stroke} strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 24 H32 V26.5 C32 27.5 31 28 30 28 H10 C9 28 8 27.5 8 26.5 V24 Z" />
          <path d="M11 24 V19 C11 14 15 10.5 20 10.5 C25 10.5 29 14 29 19 V24" />
          <line x1="20" y1="10.5" x2="20" y2="20" />
          <line x1="15.5" y1="15" x2="15.5" y2="24" />
          <line x1="24.5" y1="15" x2="24.5" y2="24" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9 print:w-8 print:h-8" fill="none" stroke={stroke} strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
          <rect x="8" y="8" width="24" height="24" rx="3" />
          <polyline points="14.5,20.5 18.5,24.5 26,16" />
        </svg>
      );
  }
};

/**
 * Signature slanted navy ribbon header with golden-amber left edge
 */
const RibbonHeader: React.FC<{
  title: string;
  icon: React.ReactNode;
  widthClass?: string;
  className?: string;
  bgColor?: string;
  accentColor?: string;
}> = ({
  title,
  icon,
  widthClass = 'min-w-[215px] print:min-w-[190px]',
  className = '',
  bgColor = '#2C3E4C',
  accentColor = '#F0A429',
}) => {
  return (
    <div
      className={`relative inline-flex items-stretch h-[35px] print:h-[31px] select-none ${widthClass} ${className}`}
    >
      {/* Slanted accent edge layer */}
      <div
        className="w-full h-full flex items-stretch"
        style={{
          backgroundColor: accentColor,
          clipPath: 'polygon(16px 0%, 100% 0%, 100% 100%, 0% 100%)',
          borderTopRightRadius: '11px',
        }}
      >
        {/* Main ribbon body */}
        <div
          className="w-full h-full flex items-center gap-2.5 pr-4 pl-9 text-white"
          style={{
            backgroundColor: bgColor,
            marginLeft: '10px',
            clipPath: 'polygon(16px 0%, 100% 0%, 100% 100%, 0% 100%)',
            borderTopRightRadius: '11px',
          }}
        >
          <span className="shrink-0 opacity-95">{icon}</span>
          <span className="text-[14.5px] print:text-[13px] font-extrabold tracking-tight whitespace-nowrap">
            {title}
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * Subtle high-craft architectural limestone villa illustration for top-left backdrop
 */
const ArchitecturalVillaBackdrop: React.FC = () => (
  <div
    className="absolute top-0 left-0 w-[44%] h-[215px] print:h-[195px] pointer-events-none overflow-hidden select-none"
    aria-hidden="true"
  >
    <svg
      viewBox="0 0 420 250"
      className="w-full h-full object-cover"
      preserveAspectRatio="xMinYMin slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="skyWash" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E6E1D9" stopOpacity="0.95" />
          <stop offset="55%" stopColor="#F2EFEA" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="stoneMain" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D7CEC2" />
          <stop offset="100%" stopColor="#EFECE7" />
        </linearGradient>
        <linearGradient id="stoneSide" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#C3B8AA" />
          <stop offset="100%" stopColor="#DDD5CA" />
        </linearGradient>
        <linearGradient id="glassTint" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#464E54" stopOpacity="0.72" />
          <stop offset="45%" stopColor="#7C858B" stopOpacity="0.48" />
          <stop offset="100%" stopColor="#D8D1C5" stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id="fadeRight" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="62%" stopColor="#FFFFFF" stopOpacity="0.18" />
          <stop offset="86%" stopColor="#FFFFFF" stopOpacity="0.88" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="1" />
        </linearGradient>
        <linearGradient id="fadeBottom" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="68%" stopColor="#FFFFFF" stopOpacity="0.15" />
          <stop offset="92%" stopColor="#FFFFFF" stopOpacity="0.92" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="1" />
        </linearGradient>
      </defs>

      {/* Soft sky wash */}
      <rect width="420" height="250" fill="url(#skyWash)" />

      {/* Left architectural concrete/stone wing */}
      <polygon points="0,0 140,0 140,185 0,215" fill="url(#stoneSide)" opacity="0.75" />
      <line x1="0" y1="45" x2="140" y2="30" stroke="#B7ABA0" strokeWidth="0.6" opacity="0.5" />
      <line x1="0" y1="92" x2="140" y2="82" stroke="#B7ABA0" strokeWidth="0.6" opacity="0.5" />
      <line x1="0" y1="140" x2="140" y2="132" stroke="#B7ABA0" strokeWidth="0.6" opacity="0.5" />

      {/* Main projecting upper travertine volume */}
      <polygon points="118,0 296,42 296,178 118,140" fill="url(#stoneMain)" />
      {/* Subtle stone cladding horizontal joints */}
      <line x1="118" y1="36" x2="296" y2="74" stroke="#C5BBB0" strokeWidth="0.7" opacity="0.65" />
      <line x1="118" y1="72" x2="296" y2="108" stroke="#C5BBB0" strokeWidth="0.7" opacity="0.55" />
      <line x1="118" y1="108" x2="296" y2="142" stroke="#C5BBB0" strokeWidth="0.7" opacity="0.5" />

      {/* Left recessed dark return edge of upper volume */}
      <polygon points="106,0 118,0 118,140 106,144" fill="#A99E90" opacity="0.82" />

      {/* Panoramic contemporary recessed window */}
      <polygon points="164,28 272,56 272,158 164,132" fill="#2A3136" opacity="0.78" />
      <polygon points="170,33 268,58 268,154 170,130" fill="url(#glassTint)" />
      {/* Interior warm curtain & mullion reflections */}
      <polygon points="222,46 266,57 266,152 222,141" fill="#EAE4DA" opacity="0.55" />
      <line x1="216" y1="43" x2="216" y2="142" stroke="#2F373D" strokeWidth="2.4" opacity="0.72" />
      <line x1="170" y1="88" x2="268" y2="112" stroke="#2F373D" strokeWidth="1.2" opacity="0.45" />
      {/* Diagonal glass sheen */}
      <polygon points="174,36 205,44 188,134 172,130" fill="#FFFFFF" opacity="0.22" />

      {/* Ground floor dark recessed terrace & colonnade */}
      <polygon points="118,140 296,178 296,232 118,225" fill="#E3DDD4" opacity="0.65" />
      <polygon points="145,148 212,162 212,218 145,212" fill="#635D56" opacity="0.45" />
      <polygon points="224,165 268,174 268,220 224,216" fill="#C9BFB2" opacity="0.55" />

      {/* Minimalist tree foliage accent on far left */}
      <g opacity="0.52" fill="#5D694D">
        <circle cx="32" cy="112" r="14" />
        <circle cx="52" cy="100" r="12" />
        <circle cx="46" cy="126" r="15" />
        <circle cx="20" cy="134" r="16" />
        <circle cx="68" cy="118" r="10" />
        <circle cx="28" cy="154" r="13" />
        <circle cx="58" cy="144" r="11" />
        <circle cx="80" cy="136" r="8" />
        <circle cx="15" cy="96" r="11" />
      </g>
      <g opacity="0.34" fill="#8C977D">
        <circle cx="38" cy="108" r="9" />
        <circle cx="58" cy="122" r="9" />
        <circle cx="24" cy="142" r="10" />
        <circle cx="132" cy="192" r="14" />
        <circle cx="154" cy="198" r="11" />
        <circle cx="116" cy="202" r="12" />
      </g>
      {/* Delicate trunk lines */}
      <path d="M40 218 Q42 175 44 135 M43 162 L62 134 M42 156 L22 138" stroke="#6E665D" strokeWidth="1.8" fill="none" opacity="0.42" />

      {/* Smooth seamless white fade masks on right & bottom */}
      <rect width="420" height="250" fill="url(#fadeRight)" />
      <rect width="420" height="250" fill="url(#fadeBottom)" />
    </svg>
  </div>
);

export const SimplifiedQuotationView: React.FC<SimplifiedQuotationViewProps> = ({
  items,
  clientInfo,
  subtotal,
  discountAmount,
  taxAmount,
  grandTotal,
  milestones,
  onEditMilestones,
}) => {
  const activeCompanyId = resolveCompanyId(clientInfo.companyId);
  const company = getCompanyProfile(activeCompanyId);
  const isArq = activeCompanyId === 'arq';
  const ribbonBg = company.colors.ribbonBg;
  const ribbonAccent = company.colors.ribbonAccent;
  const activeScopeItems = getActiveScopeItemsForQuotation(clientInfo, items);
  const areaDetails = getQuotationAreaDetails(clientInfo, items);
  const { line1, line2 } = getCleanSubtitleLines(clientInfo);

  const isPureDecor = areaDetails.departmentId === 'decor';
  const landAreaDisplay = isPureDecor
    ? `${formatEnNumber(areaDetails.numericArea)} م²`
    : `${formatEnNumber(clientInfo.landArea || areaDetails.numericArea || 0)} م²`;
  const landAreaLabel = isPureDecor ? 'المساحة الطابقية' : 'مساحة الأرض';

  const buildingAreaValue = clientInfo.buildingArea || Math.round((clientInfo.landArea || 0) * 1.68);
  const secondAreaLabel = isPureDecor ? 'رقم العرض' : 'مسطح البناء';
  const secondAreaDisplay = isPureDecor
    ? clientInfo.proposalNumber || '—'
    : `${formatEnNumber(buildingAreaValue)} م²`;

  const locationDisplay = [clientInfo.projectCity || 'الرياض', clientInfo.district]
    .filter((v) => v && v.trim().length > 0)
    .join(' - ');

  const currentYear = (clientInfo.date || '').split('-')[0] || '2026';

  // Grid columns logic for Scope of Work
  const scopeCount = activeScopeItems.length;
  const scopeColsClass =
    scopeCount <= 3
      ? 'grid-cols-3'
      : scopeCount === 4
      ? 'grid-cols-4'
      : scopeCount === 5
      ? 'grid-cols-5'
      : scopeCount === 6
      ? 'grid-cols-6'
      : scopeCount === 7
      ? 'grid-cols-7'
      : 'grid-cols-4';

  const milestoneGridClass =
    milestones.length === 1
      ? 'grid-cols-1'
      : milestones.length === 2
      ? 'grid-cols-1 sm:grid-cols-2 print:grid-cols-2'
      : milestones.length === 4
      ? 'grid-cols-2 sm:grid-cols-4 print:grid-cols-4'
      : 'grid-cols-1 sm:grid-cols-3 print:grid-cols-3';

  return (
    <div
      dir="rtl"
      className="relative w-full h-full flex-1 flex flex-col justify-between bg-white text-[#263746] overflow-hidden px-5 sm:px-7 py-5 print:px-4 print:py-2.5 select-text"
      style={{ fontFamily: "'Cairo', 'Tajawal', sans-serif" }}
    >
      {/* Top-left Architectural Villa Soft Backdrop */}
      <ArchitecturalVillaBackdrop />

      {/* =========================================================================
          1. TOP HEADER & HERO SECTION
         ========================================================================= */}
      <header className="relative z-10 flex flex-col items-start pt-1 print:pt-0.5 pb-3 print:pb-2">
        {/* Brand Lockup (Top-Right in RTL) */}
        {isArq ? (
          <div className="flex items-center gap-3">
            <div className="h-[64px] print:h-[58px] flex items-center justify-center shrink-0">
              <CompanyLogo companyId="arq" variant="full" className="h-full w-auto" color="#1c1917" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="h-[58px] print:h-[52px] flex items-center justify-center shrink-0">
              <CompanyLogo companyId="luminous" variant="icon" className="h-full w-auto" />
            </div>
            <div className="flex flex-col text-right leading-tight">
              <span className="text-[17px] print:text-[15.5px] font-black text-[#263746] tracking-tight">
                {company.groupNameAr}
              </span>
              <span
                dir="ltr"
                className="inline-flex items-center justify-end gap-1.5 text-[11.5px] print:text-[10.5px] font-black tracking-[0.22em] mt-0.5"
              >
                <span className="text-[#263746]">LUMINOUS</span>
                <span className="text-[#E37725]">VISION</span>
              </span>
              <span className="text-[11.5px] print:text-[10.5px] font-bold text-[#3D4D5C] mt-0.5">
                {company.subtitleAr}
              </span>
            </div>
          </div>
        )}

        {/* Main Hero Title & Subtitle Block */}
        <div className="mt-5 print:mt-4 pr-1 sm:pr-4 max-w-[66%]">
          <h1 className="text-[36px] sm:text-[40px] print:text-[34px] font-black text-[#263746] leading-none tracking-tight">
            عرض سعر
          </h1>
          {/* Short warm accent rule under title */}
          <div
            className="w-14 h-[3.5px] rounded-full mt-2.5 print:mt-2"
            style={{ backgroundColor: ribbonAccent }}
          />

          {/* Subtitle Row with Document + Orange Pencil Icon */}
          <div className="mt-3 print:mt-2.5 flex items-center gap-3.5">
            <div className="shrink-0">
              <svg
                viewBox="0 0 46 46"
                className="w-11 h-11 print:w-10 print:h-10"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Document outline */}
                <rect
                  x="7"
                  y="5"
                  width="24"
                  height="34"
                  rx="3.5"
                  stroke="#2C3E4C"
                  strokeWidth="1.9"
                  fill="#FFFFFF"
                />
                <line x1="12.5" y1="12" x2="25.5" y2="12" stroke="#2C3E4C" strokeWidth="1.7" strokeLinecap="round" />
                <line x1="12.5" y1="17.5" x2="25.5" y2="17.5" stroke="#2C3E4C" strokeWidth="1.7" strokeLinecap="round" />
                <line x1="12.5" y1="23" x2="21.5" y2="23" stroke="#2C3E4C" strokeWidth="1.7" strokeLinecap="round" />
                <path d="M12.5 31.5 C15 29.5 17 32.5 19.5 30.5" stroke="#2C3E4C" strokeWidth="1.5" strokeLinecap="round" />
                {/* Diagonal amber pencil */}
                <g transform="translate(21, 13) rotate(35)">
                  <rect x="6" y="0" width="5.5" height="20" rx="1.2" fill="#FFFFFF" stroke="#E37725" strokeWidth="1.8" />
                  <polygon points="6,20 11.5,20 8.75,25.5" fill="#F0A429" stroke="#E37725" strokeWidth="1.2" strokeLinejoin="round" />
                  <line x1="6" y1="4.5" x2="11.5" y2="4.5" stroke="#E37725" strokeWidth="1.4" />
                </g>
              </svg>
            </div>
            <div className="text-[16.5px] sm:text-[18px] print:text-[15.5px] font-extrabold text-[#263746] leading-[1.45]">
              <div>{line1}</div>
              <div>{line2}</div>
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================================
          2. CLIENT & PROJECT METADATA 5-COLUMN STRIP
         ========================================================================= */}
      <section className="relative z-10 mt-2 print:mt-1.5">
        <div className="bg-[#F6F6F5] border border-[#D8D8D6] rounded-[18px] py-3.5 print:py-2.5 px-2 grid grid-cols-2 sm:grid-cols-5 print:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse print:divide-y-0 print:divide-x print:divide-x-reverse divide-[#D5D5D3]">
          {/* 1. Client Name */}
          <div className="flex flex-col items-center justify-center text-center px-2 py-1">
            <svg viewBox="0 0 28 28" className="w-6 h-6 print:w-5.5 print:h-5.5 mb-1.5 text-[#2C3E4C]" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="14" cy="9.5" r="4" />
              <path d="M6.5 23 C6.5 18.5 9.8 16 14 16 C18.2 16 21.5 18.5 21.5 23" />
            </svg>
            <span className="text-[11px] print:text-[10px] font-bold text-[#5A6773]">اسم العميل</span>
            <span className="text-[13px] print:text-[11.5px] font-black text-[#263746] mt-0.5 leading-snug">
              {clientInfo.clientName?.trim() || 'العميل الكريم'}
            </span>
          </div>

          {/* 2. Project Type */}
          <div className="flex flex-col items-center justify-center text-center px-2 py-1">
            <svg viewBox="0 0 28 28" className="w-6 h-6 print:w-5.5 print:h-5.5 mb-1.5 text-[#2C3E4C]" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
              <rect x="6" y="5" width="11" height="18" rx="1" />
              <path d="M17 11 H22 V23 H17" />
              <line x1="9.5" y1="9" x2="10.5" y2="9" />
              <line x1="13" y1="9" x2="14" y2="9" />
              <line x1="9.5" y1="13" x2="10.5" y2="13" />
              <line x1="13" y1="13" x2="14" y2="13" />
              <line x1="9.5" y1="17" x2="10.5" y2="17" />
              <line x1="13" y1="17" x2="14" y2="17" />
              <line x1="19.5" y1="15" x2="20" y2="15" />
              <line x1="19.5" y1="19" x2="20" y2="19" />
              <line x1="4" y1="23" x2="24" y2="23" />
            </svg>
            <span className="text-[11px] print:text-[10px] font-bold text-[#5A6773]">نوع المشروع</span>
            <span className="text-[13px] print:text-[11.5px] font-black text-[#263746] mt-0.5 leading-snug">
              {clientInfo.buildingType || 'فيلا سكنية'}
            </span>
          </div>

          {/* 3. Location */}
          <div className="flex flex-col items-center justify-center text-center px-2 py-1">
            <svg viewBox="0 0 28 28" className="w-6 h-6 print:w-5.5 print:h-5.5 mb-1.5 text-[#2C3E4C]" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 24 C14 24 21 17.5 21 11.5 C21 7.6 17.9 4.5 14 4.5 C10.1 4.5 7 7.6 7 11.5 C7 17.5 14 24 14 24 Z" />
              <circle cx="14" cy="11.5" r="2.7" />
            </svg>
            <span className="text-[11px] print:text-[10px] font-bold text-[#5A6773]">الموقع</span>
            <span className="text-[13px] print:text-[11.5px] font-black text-[#263746] mt-0.5 leading-snug">
              {locationDisplay || 'الرياض'}
            </span>
          </div>

          {/* 4. Land Area */}
          <div className="flex flex-col items-center justify-center text-center px-2 py-1">
            <svg viewBox="0 0 28 28" className="w-6 h-6 print:w-5.5 print:h-5.5 mb-1.5 text-[#2C3E4C]" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5.5" y="5.5" width="17" height="17" rx="2" strokeDasharray="5 2.5" />
              <polyline points="9,11.5 9,9 11.5,9" />
              <polyline points="16.5,9 19,9 19,11.5" />
              <polyline points="19,16.5 19,19 16.5,19" />
              <polyline points="11.5,19 9,19 9,16.5" />
            </svg>
            <span className="text-[11px] print:text-[10px] font-bold text-[#5A6773]">{landAreaLabel}</span>
            <span className="text-[13.5px] print:text-[12px] font-black text-[#263746] mt-0.5 tabular-nums">
              {landAreaDisplay}
            </span>
          </div>

          {/* 5. Built-up Area */}
          <div className="col-span-2 sm:col-span-1 print:col-span-1 flex flex-col items-center justify-center text-center px-2 py-1">
            <svg viewBox="0 0 28 28" className="w-6 h-6 print:w-5.5 print:h-5.5 mb-1.5 text-[#2C3E4C]" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="14,5 23,9.5 14,14 5,9.5" />
              <polyline points="5,14 14,18.5 23,14" />
              <polyline points="5,18.5 14,23 23,18.5" />
            </svg>
            <span className="text-[11px] print:text-[10px] font-bold text-[#5A6773]">{secondAreaLabel}</span>
            <span className="text-[13.5px] print:text-[12px] font-black text-[#263746] mt-0.5 tabular-nums">
              {secondAreaDisplay}
            </span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. SCOPE OF WORK (نطاق الأعمال)
         ========================================================================= */}
      <section className="relative z-10 mt-3.5 print:mt-2.5">
        <div className="flex justify-start">
          <RibbonHeader
            title="نطاق الأعمال"
            bgColor={ribbonBg}
            accentColor={ribbonAccent}
            icon={
              <svg viewBox="0 0 24 24" className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="4" width="14" height="17" rx="2" />
                <path d="M9 4 V3 A1 1 0 0 1 10 2 H14 A1 1 0 0 1 15 3 V4" />
                <line x1="9" y1="10" x2="15" y2="10" />
                <line x1="9" y1="14" x2="15" y2="14" />
                <line x1="9" y1="18" x2="13" y2="18" />
              </svg>
            }
          />
        </div>

        <div className="bg-[#F6F6F5] border border-[#D8D8D6] rounded-[18px] rounded-tr-none py-4 print:py-3 px-2 -mt-px">
          {activeScopeItems.length > 0 ? (
            <div
              className={`grid ${scopeColsClass} ${
                scopeCount <= 7 ? 'divide-x divide-x-reverse divide-[#D5D5D3]' : 'gap-y-3 divide-x divide-x-reverse divide-[#D5D5D3]'
              }`}
            >
              {activeScopeItems.map((scope) => (
                <div
                  key={scope.id}
                  className="flex flex-col items-center justify-start text-center px-1.5 py-1"
                >
                  <div className="mb-2 print:mb-1.5 flex items-center justify-center">
                    <ScopeIcon id={scope.id} />
                  </div>
                  <span className="text-[12px] print:text-[10.5px] font-extrabold text-[#263746] leading-[1.35]">
                    {getSimplifiedScopeTitle(scope.id, scope.name)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-3 text-center text-xs font-bold text-[#5A6773]">
              يرجى تفعيل وحدات نطاق الأعمال من نافذة عرض السعر
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          4. FINANCIAL OFFER (العرض المالي) + DURATION & REVISIONS (المدة والتعديلات)
         ========================================================================= */}
      <section className="relative z-10 mt-3.5 print:mt-2.5 grid grid-cols-1 sm:grid-cols-12 print:grid-cols-12 gap-4 print:gap-3.5 items-stretch">
        {/* Right Side: Financial Offer (العرض المالي) */}
        <div className="sm:col-span-7 print:col-span-7 flex flex-col">
          <div className="flex justify-start">
            <RibbonHeader
              title="العرض المالي"
              widthClass="w-[74%] min-w-[210px]"
              bgColor={ribbonBg}
              accentColor={ribbonAccent}
              icon={
                <svg viewBox="0 0 24 24" className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <ellipse cx="9.5" cy="7" rx="5.5" ry="2.2" />
                  <path d="M4 7 V11 C4 12.2 6.5 13.2 9.5 13.2 C12.5 13.2 15 12.2 15 11 V7" />
                  <path d="M4 11 V15 C4 16.2 6.5 17.2 9.5 17.2" />
                  <ellipse cx="15" cy="14" rx="5" ry="2" />
                  <path d="M10 14 V18 C10 19.1 12.2 20 15 20 C17.8 20 20 19.1 20 18 V14" />
                </svg>
              }
            />
          </div>

          <div className="flex-1 bg-[#F6F6F5] border border-[#D8D8D6] rounded-[18px] rounded-tr-none overflow-hidden flex flex-col justify-between -mt-px">
            <div className="divide-y divide-[#E2E2E0]">
              {/* Subtotal row */}
              <div className="grid grid-cols-12 items-center">
                <div className="col-span-7 px-4 py-2.5 print:py-2 text-[14px] print:text-[12.5px] font-extrabold text-[#263746]">
                  قيمة الأعمال
                </div>
                <div className="col-span-5 px-4 py-2.5 print:py-2 border-r border-[#D8D8D6] text-left text-[15px] print:text-[13.5px] font-black text-[#263746] tabular-nums">
                  {formatEnNumber(subtotal)} ر.س
                </div>
              </div>

              {/* Discount row */}
              {discountAmount > 0 && (
                <div className="grid grid-cols-12 items-center">
                  <div className="col-span-7 px-4 py-2.5 print:py-2 text-[14px] print:text-[12.5px] font-extrabold text-[#D9821E]">
                    الخصم التجاري (
                    {clientInfo.discountType === 'percentage' ? `${clientInfo.discountValue}%` : 'خاص'})
                  </div>
                  <div className="col-span-5 px-4 py-2.5 print:py-2 border-r border-[#D8D8D6] text-left text-[15px] print:text-[13.5px] font-black text-[#263746] tabular-nums">
                    <span dir="ltr" className="inline-block">
                      - {formatEnNumber(discountAmount)}
                    </span>{' '}
                    ر.س
                  </div>
                </div>
              )}

              {/* VAT row (only when tax is explicitly enabled) */}
              {clientInfo.includeTax && (
                <div className="grid grid-cols-12 items-center">
                  <div className="col-span-7 px-4 py-2 print:py-1.5 text-[13px] print:text-[11.5px] font-bold text-[#4A5865]">
                    ضريبة القيمة المضافة (15%)
                  </div>
                  <div className="col-span-5 px-4 py-2 print:py-1.5 border-r border-[#D8D8D6] text-left text-[14px] print:text-[12.5px] font-extrabold text-[#263746] tabular-nums">
                    {formatEnNumber(taxAmount)} ر.س
                  </div>
                </div>
              )}
            </div>

            {/* Highlighted Navy Grand Total Row */}
            <div>
              <div className="grid grid-cols-12 items-center bg-[#2C3E4C] text-white">
                <div className="col-span-7 px-4 py-2.5 print:py-2 text-[15px] print:text-[13.5px] font-black">
                  {clientInfo.includeTax ? 'الإجمالي شامل الضريبة' : 'الإجمالي قبل الضريبة'}
                </div>
                <div className="col-span-5 px-4 py-2.5 print:py-2 border-r border-white/25 text-left text-[17px] print:text-[15.5px] font-black text-[#F5B43C] tabular-nums">
                  {formatEnNumber(grandTotal)} ر.س
                </div>
              </div>

              {/* Tax Note Footer Strip */}
              <div className="px-4 py-2 print:py-1.5 text-[11.5px] print:text-[10.5px] font-bold text-[#9C6521] flex items-center gap-1.5 bg-[#F6F6F5]">
                <span className="text-[#F0A429] text-sm leading-none">•</span>
                <span>
                  {clientInfo.includeTax
                    ? 'الأسعار أعلاه شاملة ضريبة القيمة المضافة (15%).'
                    : 'الأسعار غير شاملة ضريبة القيمة المضافة (15%).'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Left Side: Duration & Revisions (المدة والتعديلات) */}
        <div className="sm:col-span-5 print:col-span-5 flex flex-col">
          <div className="flex justify-start">
            <RibbonHeader
              title="المدة والتعديلات"
              widthClass="w-[78%] min-w-[195px]"
              bgColor={ribbonBg}
              accentColor={ribbonAccent}
              icon={
                <svg viewBox="0 0 24 24" className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3.5" y="4.5" width="17" height="16" rx="2" />
                  <line x1="3.5" y1="9.5" x2="20.5" y2="9.5" />
                  <line x1="8" y1="2.5" x2="8" y2="6" />
                  <line x1="16" y1="2.5" x2="16" y2="6" />
                  <circle cx="8.5" cy="13.5" r="0.8" fill="currentColor" />
                  <circle cx="12" cy="13.5" r="0.8" fill="currentColor" />
                  <circle cx="15.5" cy="13.5" r="0.8" fill="currentColor" />
                  <circle cx="8.5" cy="17" r="0.8" fill="currentColor" />
                  <circle cx="12" cy="17" r="0.8" fill="currentColor" />
                </svg>
              }
            />
          </div>

          <div className="flex-1 bg-[#F6F6F5] border border-[#D8D8D6] rounded-[18px] rounded-tr-none px-5 py-3 print:py-2 flex flex-col justify-center -mt-px">
            {/* Execution Duration */}
            <div className="flex-1 flex items-center justify-center gap-4 py-2">
              <svg viewBox="0 0 36 36" className="w-9 h-9 print:w-8 print:h-8 text-[#2C3E4C] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="7" width="26" height="23" rx="3" />
                <line x1="5" y1="14" x2="31" y2="14" />
                <line x1="12" y1="4" x2="12" y2="9.5" />
                <line x1="24" y1="4" x2="24" y2="9.5" />
                <circle cx="11.5" cy="19.5" r="1.1" fill="currentColor" />
                <circle cx="16" cy="19.5" r="1.1" fill="currentColor" />
                <circle cx="20.5" cy="19.5" r="1.1" fill="currentColor" />
                <circle cx="25" cy="19.5" r="1.1" fill="currentColor" />
                <circle cx="11.5" cy="24.5" r="1.1" fill="currentColor" />
                <circle cx="16" cy="24.5" r="1.1" fill="currentColor" />
                <circle cx="20.5" cy="24.5" r="1.1" fill="currentColor" />
              </svg>
              <div className="text-right">
                <div className="text-[14px] print:text-[12.5px] font-black text-[#263746]">مدة التنفيذ</div>
                <div className="text-[13px] print:text-[11.5px] font-bold text-[#4A5865] mt-0.5 tabular-nums">
                  {clientInfo.executionDurationDays ? `${clientInfo.executionDurationDays} يوم عمل` : '[ ... ] يوم عمل'}
                </div>
              </div>
            </div>

            <div className="border-t border-[#D5D5D3] mx-2" />

            {/* Revisions */}
            <div className="flex-1 flex items-center justify-center gap-4 py-2">
              <svg viewBox="0 0 36 36" className="w-9 h-9 print:w-8 print:h-8 text-[#2C3E4C] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M27.5 14.5 A 10.5 10.5 0 0 0 9.8 11.2" />
                <polyline points="24,14.5 28,15 28.5,11" />
                <path d="M8.5 21.5 A 10.5 10.5 0 0 0 26.2 24.8" />
                <polyline points="12,21.5 8,21 7.5,25" />
              </svg>
              <div className="text-right">
                <div className="text-[14px] print:text-[12.5px] font-black text-[#263746]">التعديلات</div>
                <div className="text-[12.5px] print:text-[11px] font-bold text-[#4A5865] mt-0.5">
                  {getSimplifiedRevisionsText(clientInfo.revisionCountText)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. PAYMENT SCHEDULE (جدول الدفعات)
         ========================================================================= */}
      <section className="relative z-10 mt-3.5 print:mt-2.5">
        <div className="flex items-end justify-between">
          <RibbonHeader
            title="جدول الدفعات"
            bgColor={ribbonBg}
            accentColor={ribbonAccent}
            icon={
              <svg viewBox="0 0 24 24" className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="5.5" width="18" height="13" rx="2" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <line x1="7" y1="14.5" x2="11" y2="14.5" />
              </svg>
            }
          />
          {onEditMilestones && (
            <button
              type="button"
              onClick={onEditMilestones}
              className="no-print mb-1.5 text-[11px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition"
              title="تعديل نسب ومبالغ وأسباب الدفعات"
            >
              <FileEdit className="w-3.5 h-3.5 text-amber-700" />
              <span>تعديل الدفعات</span>
            </button>
          )}
        </div>

        <div
          onClick={onEditMilestones}
          className={`bg-[#F6F6F5] border border-[#D8D8D6] rounded-[18px] rounded-tr-none py-4 print:py-3 px-2 -mt-px ${
            onEditMilestones ? 'cursor-pointer hover:border-[#F0A429] transition' : ''
          }`}
          title={onEditMilestones ? 'انقر لتعديل نسب ومبالغ الدفعات' : undefined}
        >
          <div className={`grid ${milestoneGridClass} divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse print:divide-y-0 print:divide-x print:divide-x-reverse divide-[#D5D5D3]`}>
            {milestones.map((m, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === milestones.length - 1;
              return (
                <div
                  key={m.id}
                  className="flex flex-col items-center justify-center text-center px-3 py-1"
                >
                  <div className="flex items-center justify-center gap-2.5">
                    <span className="text-[22px] print:text-[19px] font-black text-[#263746] tabular-nums leading-none">
                      {m.percentage}%
                    </span>
                    {/* Tailored milestone icon matching the screenshot */}
                    {isFirst ? (
                      <svg viewBox="0 0 36 28" className="w-8 h-7 print:w-7 print:h-6 text-[#2C3E4C]" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 11 L10 7 L17 11 L24 7 L32 12 L28 19 L21 15" />
                        <path d="M4 11 L8 18 L15 22 C16.5 22.8 18 22 18.8 20.8 L22.5 22.5 C24 23 25.5 22 26 20.5" />
                        <path d="M13 13 L17 15 C18.5 15.8 20.2 14.8 20.5 13.5 L23 11.5" />
                      </svg>
                    ) : isLast ? (
                      <svg viewBox="0 0 28 28" className="w-7 h-7 print:w-6 print:h-6 text-[#2C3E4C]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="14" cy="14" r="10.5" />
                        <polyline points="9.5,14.5 12.8,17.8 19,11" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 34 28" className="w-8 h-7 print:w-7 print:h-6 text-[#2C3E4C]" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="4" y="4" width="26" height="17" rx="2" />
                        <line x1="12" y1="24.5" x2="22" y2="24.5" />
                        <line x1="17" y1="21" x2="17" y2="24.5" />
                        <line x1="15" y1="4" x2="15" y2="14" />
                        <line x1="4" y1="13" x2="21" y2="13" />
                        <line x1="22" y1="10" x2="22" y2="21" />
                      </svg>
                    )}
                  </div>

                  <p className="text-[12.5px] print:text-[11px] font-bold text-[#3C4B59] mt-2 print:mt-1.5 leading-snug">
                    {getSimplifiedMilestoneLabel(m, idx, milestones.length)}
                  </p>
                  {m.amount > 0 && (
                    <span className="text-[11px] print:text-[9.5px] font-extrabold text-[#6E7C88] mt-0.5 tabular-nums">
                      ({formatEnNumber(m.amount)} ر.س)
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. VALIDITY & BANK DETAILS STRIP
         ========================================================================= */}
      <section className="relative z-10 mt-3.5 print:mt-2.5">
        <div className="bg-[#F6F6F5] border border-[#E2E2E0] rounded-[18px] px-5 sm:px-7 py-3.5 print:py-2.5 flex flex-col sm:flex-row print:flex-row items-center justify-between gap-4">
          {/* Right: Proposal Validity */}
          <div className="flex items-center gap-3.5 shrink-0 sm:pl-4 print:pl-4">
            <div className="text-center">
              <div className="text-[12px] print:text-[10.5px] font-bold text-[#4A5865]">صلاحية العرض</div>
              <div className="text-[16px] print:text-[14.5px] font-black text-[#263746] tabular-nums mt-0.5">
                {clientInfo.validityDays || 30} يوماً
              </div>
            </div>
            <svg viewBox="0 0 36 36" className="w-8 h-8 print:w-7 print:h-7 text-[#2C3E4C] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="7" width="26" height="23" rx="3" />
              <line x1="5" y1="14" x2="31" y2="14" />
              <line x1="12" y1="4" x2="12" y2="9.5" />
              <line x1="24" y1="4" x2="24" y2="9.5" />
              <circle cx="11.5" cy="19.5" r="1.1" fill="currentColor" />
              <circle cx="16" cy="19.5" r="1.1" fill="currentColor" />
              <circle cx="20.5" cy="19.5" r="1.1" fill="currentColor" />
              <circle cx="25" cy="19.5" r="1.1" fill="currentColor" />
              <circle cx="11.5" cy="24.5" r="1.1" fill="currentColor" />
              <circle cx="16" cy="24.5" r="1.1" fill="currentColor" />
              <circle cx="20.5" cy="24.5" r="1.1" fill="currentColor" />
            </svg>
          </div>

          {/* Vertical Divider */}
          <div className="hidden sm:block print:block h-11 w-px bg-[#D5D5D3] shrink-0" />

          {/* Left: Bank Account Details */}
          <div className="flex-1 flex items-center justify-between gap-4 w-full">
            <div className="flex-1 text-center">
              <div className="text-[13px] print:text-[11.5px] font-black text-[#263746]">
                بيانات الحساب البنكي
              </div>
              <div className="text-[12.5px] print:text-[11px] font-bold text-[#4A5865] mt-0.5">
                {clientInfo.bankDetails?.bankName || 'البنك السعودي للاستثمار'}
              </div>
              <div
                dir="ltr"
                className="text-[13.5px] print:text-[12px] font-black text-[#1F2D3A] tracking-wider font-mono mt-0.5"
              >
                {clientInfo.bankDetails?.iban || 'SA83 6500 0000 1383 4937 6001'}
              </div>
            </div>

            {/* Bank Building Icon */}
            <svg viewBox="0 0 38 38" className="w-9 h-9 print:w-8 print:h-8 text-[#2C3E4C] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="19,5 33,13 5,13" />
              <line x1="7" y1="16.5" x2="31" y2="16.5" />
              <line x1="10" y1="16.5" x2="10" y2="27" />
              <line x1="16" y1="16.5" x2="16" y2="27" />
              <line x1="22" y1="16.5" x2="22" y2="27" />
              <line x1="28" y1="16.5" x2="28" y2="27" />
              <rect x="6" y="27" width="26" height="3" rx="0.8" />
              <line x1="4" y1="33" x2="34" y2="33" />
            </svg>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. FOOTER: CLIENT APPROVAL & BRAND SIGNATURE
         ========================================================================= */}
      <footer className="relative z-10 mt-4 print:mt-3 pt-1 flex items-end justify-between gap-4">
        {/* Right: Client Approval Signature */}
        <div className="w-52 sm:w-56 print:w-52 shrink-0">
          <div className="text-[13.5px] print:text-[12px] font-black text-[#263746]">
            اعتماد العميل
          </div>
          <div className="border-b border-[#8C96A0] h-5 print:h-4 w-full" />
          <div className="flex items-center justify-between text-[11.5px] print:text-[10.5px] font-bold text-[#4A5865] mt-1.5">
            <span>التاريخ :</span>
            <span dir="ltr" className="tracking-widest font-mono">
              &nbsp;&nbsp;&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;/ {currentYear} م
            </span>
          </div>
        </div>

        {/* Center connecting subtle line */}
        <div className="hidden sm:block print:block flex-1 border-b border-[#B8C0C8] mb-3.5" />

        {/* Left: Compact Brand Logo Lockup */}
        {isArq ? (
          <div className="flex items-center shrink-0 pb-0.5">
            <CompanyLogo companyId="arq" variant="full" className="h-12 print:h-11 w-auto" color="#1c1917" />
          </div>
        ) : (
          <div className="flex items-center gap-2.5 shrink-0 pb-0.5">
            <div className="flex flex-col text-left leading-tight">
              <span className="text-[13px] print:text-[11.5px] font-black text-[#263746]">
                {company.shortNameAr}
              </span>
              <span
                dir="ltr"
                className="inline-flex items-center justify-end gap-1 text-[8.5px] print:text-[7.5px] font-black tracking-[0.12em] mt-0.5"
              >
                <span className="text-[#263746]">LUMINOUS</span>
                <span className="text-[#E37725]">VISION</span>
              </span>
              <span className="text-[8.5px] print:text-[7.5px] font-bold text-[#5A6773] mt-0.5">
                للاستشارات والتصميم
              </span>
            </div>
            <div className="h-10 print:h-9 flex items-center justify-center shrink-0">
              <CompanyLogo companyId="luminous" variant="icon" className="h-full w-auto" />
            </div>
          </div>
        )}
      </footer>
    </div>
  );
};
