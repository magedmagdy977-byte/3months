import React, { useState, useRef, useEffect } from 'react';
import { CompanyId, QuotationItem, ClientInfo, PaymentMilestone, ContractData, DocumentOutputBundle } from '../../types';
import { formatSAR, tafqeetSAR, formatNumber, generatePdfFileName, getQuotationAreaDetails } from '../../utils/formatters';
import {
  Printer,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  FileText,
  Sliders,
  Building,
  CreditCard,
  Building2,
  CheckSquare,
  Cloud,
  FileEdit,
  Download,
  Share2,
  Maximize2,
  Sparkles,
  FileSignature,
} from 'lucide-react';
import { CompanyLogo, CompanyOfficialSeal } from '../CompanyLogo';
import { getCompanyProfile, resolveCompanyId } from '../../data/companies';
import {
  MASTER_SCOPE_DEFINITIONS,
  getFormattedScopeDefinitions,
  getActiveScopeItemsForQuotation,
  GENERAL_OWNER_OBLIGATIONS,
  CONDITIONAL_OWNER_OBLIGATIONS,
  EXCLUSION_CLAUSES,
  getPaymentMilestones,
} from '../../data/masterTemplateDefaults';
import { createAndShareGoogleDocQuotation } from '../../lib/googleDocsExport';
import { downloadWordDocument } from '../../lib/wordExport';
import { GoogleDocExportModal } from '../modals/GoogleDocExportModal';
import { EditPaymentMilestonesModal } from '../modals/EditPaymentMilestonesModal';
import { SimplifiedQuotationView } from './SimplifiedQuotationView';
import { ContractPrintView } from '../contract/ContractPrintView';
import { ContractEditorModal } from '../contract/ContractEditorModal';
import {
  resolveActiveContractData,
  buildContractPlainText,
} from '../../data/smartContractEngine';

export type QuotationViewMode = 'master' | 'simplified' | 'compact';

interface QuotationPrintViewProps {
  items: QuotationItem[];
  clientInfo: ClientInfo;
  onBack: () => void;
  onPrintComplete?: () => void;
  onUpdateClientInfo?: (info: Partial<ClientInfo>) => void;
  onSelectCompany?: (companyId: CompanyId) => void;
  initialViewMode?: QuotationViewMode;
  onViewModeChange?: (mode: QuotationViewMode) => void;
}

const cleanEngineerName = (name?: string) => {
  if (!name) return 'ماجد';
  return name.replace(/^(م\.|م\/|م\s+)/, '').trim() || name;
};

const formatProposalDetailedTitle = (clientInfo: ClientInfo) => {
  const service = (clientInfo.serviceType || '').trim();
  const building = (clientInfo.buildingType || '').trim();

  let servicePart = service;
  if (!servicePart) {
    servicePart = 'إصدار التراخيص والاستشارات الهندسية';
  }
  if (!servicePart.startsWith('أعمال')) {
    servicePart = `أعمال ${servicePart}`;
  }

  let buildingPart = building || 'فيلا سكنية';
  if (!buildingPart.startsWith('لمشروع') && !buildingPart.startsWith('مشروع')) {
    buildingPart = `لمشروع ${buildingPart}`;
  } else if (buildingPart.startsWith('مشروع')) {
    buildingPart = `ل${buildingPart}`;
  }

  // If a custom projectTitle was explicitly entered and is truly customized (not a stale default that contradicts buildingType)
  const isDefaultVillaTitle =
    clientInfo.projectTitle === 'مشروع فيلا سكنية خاصة' ||
    clientInfo.projectTitle === 'مشروع فيلا سكنية' ||
    clientInfo.projectTitle === 'فيلا سكنية خاصة';

  if (
    clientInfo.projectTitle &&
    clientInfo.projectTitle.trim().length > 3 &&
    !isDefaultVillaTitle &&
    clientInfo.projectTitle.trim() !== `مشروع ${building}`
  ) {
    let custom = clientInfo.projectTitle.trim();
    if (!custom.startsWith('أعمال') && !custom.startsWith('مشروع') && !custom.startsWith('لمشروع')) {
      custom = `أعمال ${custom}`;
    }
    return custom;
  }

  return `${servicePart} ${buildingPart}`;
};

export const QuotationPrintView: React.FC<QuotationPrintViewProps> = ({
  items,
  clientInfo,
  onBack,
  onPrintComplete,
  onUpdateClientInfo,
  onSelectCompany,
  initialViewMode = 'master',
  onViewModeChange,
}) => {
  const activeCompanyId = resolveCompanyId(clientInfo.companyId);
  const company = getCompanyProfile(activeCompanyId);
  const isArq = activeCompanyId === 'arq';
  const [viewMode, setViewMode] = useState<QuotationViewMode>(initialViewMode);

  useEffect(() => {
    setViewMode(initialViewMode);
  }, [initialViewMode]);

  const handleSelectViewMode = (mode: QuotationViewMode) => {
    setViewMode(mode);
    if (onViewModeChange) {
      onViewModeChange(mode);
    }
  };

  const [copied, setCopied] = useState<boolean>(false);
  const [printScaleMode, setPrintScaleMode] = useState<'auto' | '100' | '95' | '90' | '85'>('auto');
  const [isEditMilestonesOpen, setIsEditMilestonesOpen] = useState<boolean>(false);
  const [documentBundle, setDocumentBundle] = useState<DocumentOutputBundle>(
    clientInfo.contractData?.enabled ? 'quote_and_contract' : 'quote_only'
  );
  const [isContractEditorOpen, setIsContractEditorOpen] = useState<boolean>(false);

  useEffect(() => {
    if (clientInfo.contractData?.enabled) {
      setDocumentBundle((prev) => (prev === 'quote_only' ? 'quote_and_contract' : prev));
    } else if (clientInfo.contractData && !clientInfo.contractData.enabled) {
      setDocumentBundle((prev) => (prev === 'quote_and_contract' ? 'quote_only' : prev));
    }
  }, [clientInfo.contractData?.enabled]);

  const activeContract = resolveActiveContractData(clientInfo, items);

  const handleSaveContractData = (updatedContract: ContractData) => {
    const sanitized: ContractData = {
      ...updatedContract,
      scopeGroups: updatedContract.scopeGroups.map((g) => ({
        ...g,
        subtitle: g.subtitle || '',
      })),
    };
    if (onUpdateClientInfo) {
      onUpdateClientInfo({ contractData: sanitized });
    }
    if (sanitized.enabled && documentBundle === 'quote_only') {
      setDocumentBundle('quote_and_contract');
    } else if (!sanitized.enabled && documentBundle !== 'quote_only') {
      setDocumentBundle('quote_only');
    }
  };

  const handleSelectBundle = (bundle: DocumentOutputBundle) => {
    setDocumentBundle(bundle);
    if (onUpdateClientInfo) {
      const shouldEnable = bundle !== 'quote_only';
      if (Boolean(clientInfo.contractData?.enabled) !== shouldEnable) {
        onUpdateClientInfo({
          contractData: {
            ...activeContract,
            enabled: shouldEnable,
            scopeGroups: activeContract.scopeGroups.map((g) => ({
              ...g,
              subtitle: g.subtitle || '',
            })),
          },
        });
      }
    }
  };

  const printContainerRef = useRef<HTMLDivElement>(null);

  // Google Docs and Word export state
  const [isGoogleDocModalOpen, setIsGoogleDocModalOpen] = useState<boolean>(false);
  const [isExportingDoc, setIsExportingDoc] = useState<boolean>(false);
  const [docExportError, setDocExportError] = useState<string | null>(null);
  const [googleDocUrl, setGoogleDocUrl] = useState<string | null>(null);
  const [googleDocTitle, setGoogleDocTitle] = useState<string | null>(null);

  // Financial computations
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

  // Active conditional scope items (including all 6 Decor deliverables when Decor is selected)
  const activeScopeItems = getActiveScopeItemsForQuotation(clientInfo, items);

  // Exact context-aware area details matching active department (Decor floor area, built-up area, etc.)
  const areaDetails = getQuotationAreaDetails(clientInfo, items);

  // Active exclusions (سابعًا: الأعمال غير المشمولة)
  const activeExclusions: string[] = [];
  if (clientInfo.exclusions?.excludeGovFees) {
    activeExclusions.push(EXCLUSION_CLAUSES.excludeGovFees);
  }
  if (clientInfo.exclusions?.customExclusions?.trim()) {
    activeExclusions.push(clientInfo.exclusions.customExclusions.trim());
  }

  // Payment milestones
  const milestones = getPaymentMilestones(
    clientInfo.paymentScheduleType,
    grandTotal,
    clientInfo.customMilestones
  );

  const handleSaveMilestones = (
    newMilestones: PaymentMilestone[],
    newScheduleType: ClientInfo['paymentScheduleType']
  ) => {
    if (onUpdateClientInfo) {
      onUpdateClientInfo({
        customMilestones: newMilestones,
        paymentScheduleType: newScheduleType,
      });
    }
  };

  // Adaptive density so any quotation fills 100% of a single A4 page harmoniously
  const scopeCount = activeScopeItems.length;
  const density: 'comfort' | 'balanced' | 'compact' =
    viewMode === 'master'
      ? scopeCount <= 6
        ? 'comfort'
        : scopeCount <= 8
        ? 'balanced'
        : 'compact'
      : items.length <= 3
      ? 'comfort'
      : items.length <= 5
      ? 'balanced'
      : 'compact';

  // Guarantee single-page fit upon printing without double-shrinking
  const updateAutoPrintScale = () => {
    if (!printContainerRef.current) return;
    const container = printContainerRef.current;

    if (printScaleMode !== 'auto') {
      const val = parseFloat(printScaleMode) / 100;
      container.style.setProperty('--print-scale', val.toString());
      return;
    }

    // In auto mode, adaptive density + A4 flex distribution fills 100% of 1 A4 page at scale 1
    container.style.setProperty('--print-scale', '1');
  };

  useEffect(() => {
    updateAutoPrintScale();
    window.addEventListener('beforeprint', updateAutoPrintScale);
    return () => {
      window.removeEventListener('beforeprint', updateAutoPrintScale);
    };
  }, [viewMode, printScaleMode, items, clientInfo, density]);

  const hasNotifiedPrintCompleteRef = useRef(false);

  const notifyExportComplete = () => {
    if (!hasNotifiedPrintCompleteRef.current) {
      hasNotifiedPrintCompleteRef.current = true;
      if (onPrintComplete) {
        onPrintComplete();
      }
    }
  };

  const handlePrint = () => {
    updateAutoPrintScale();
    const originalTitle = document.title;
    const baseTitle = generatePdfFileName(clientInfo);
    document.title =
      documentBundle === 'quote_and_contract'
        ? `${baseTitle}_وعقد`
        : documentBundle === 'contract_only'
        ? baseTitle.replace('عرض_سعر', 'عقد')
        : baseTitle;
    // Allow CSS zoom variable to settle in DOM before print preview executes
    requestAnimationFrame(() => {
      setTimeout(() => {
        window.print();
        setTimeout(() => {
          document.title = originalTitle;
          notifyExportComplete();
        }, 1000);
      }, 50);
    });
  };

  const handleExportGoogleDoc = () => {
    setIsGoogleDocModalOpen(true);
  };

  const handleCloudExportGoogleDoc = async () => {
    setIsExportingDoc(true);
    setDocExportError(null);
    try {
      const result = await createAndShareGoogleDocQuotation(clientInfo, items);
      notifyExportComplete();
      setGoogleDocUrl(result.url);
      setGoogleDocTitle(result.title);
      try {
        window.open(result.url, '_blank');
      } catch (e) {
        // Pop-up might be blocked in browser, URL is visible in modal
      }
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        console.info('Google Docs sign-in closed by user');
        setDocExportError('تم إغلاق نافذة المصادقة. يمكنك استخدام خيار «الفتح المباشر في حسابك بالجيميل» أعلاه بدون أي مصادقة، أو تحميل نسخة Word.');
      } else if (err?.code === 'auth/popup-blocked') {
        console.warn('Google Docs popup was blocked');
        setDocExportError('قام المتصفح بحظر النافذة المنبثقة. يمكنك استخدام خيار «الفتح المباشر في حسابك بالجيميل» أعلاه أو تحميل ملف Word.');
      } else {
        console.error('Google Doc export error:', err);
        setDocExportError(err?.message || 'تعذر إنشاء وتعديل مستند جوجل');
      }
    } finally {
      setIsExportingDoc(false);
    }
  };

  const handleDownloadWordFile = () => {
    notifyExportComplete();
    downloadWordDocument(clientInfo, items, documentBundle);
  };

  const handleCopyText = () => {
    const quoteLines = [
      `عرض سعر رسمي — ${company.fullTitleAr}`,
      `رقم العرض: ${clientInfo.proposalNumber} | التاريخ: ${clientInfo.date}`,
      `العميل: ${clientInfo.clientName || 'العميل الكريم'} | الجوال: ${clientInfo.phone || 'غير مسجل'}`,
      `المشروع: ${clientInfo.projectTitle} (${clientInfo.buildingType})`,
      `الموقع: ${clientInfo.projectCity} - ${clientInfo.district || ''} | قطعة: ${clientInfo.plotNumber || '-'} | مخطط: ${clientInfo.planNumber || '-'} | ${areaDetails.label} ${areaDetails.value}`,
      `نوع الخدمة: ${clientInfo.serviceType}`,
      `---------------------------------------`,
      `نطاق الأعمال المشمول:`,
      ...activeScopeItems.map((s, idx) => `${idx + 1}. ${s.name}: ${s.description}`),
      `---------------------------------------`,
      `مدة التنفيذ: ${clientInfo.executionDurationDays || 45} يوم عمل`,
      `بداية المدة: ${clientInfo.startDateNotice}`,
      `عدد التعديلات: ${clientInfo.revisionCountText}`,
      `صلاحية العرض: ${clientInfo.validityDays || 30} يوماً`,
      `---------------------------------------`,
      `الإجمالي قبل الخصم: ${formatSAR(subtotal)}`,
      discountAmount > 0 ? `الخصم التجاري: - ${formatSAR(discountAmount)}` : null,
      clientInfo.includeTax ? `ضريبة القيمة المضافة (15%): ${formatSAR(taxAmount)}` : null,
      `الإجمالي النهائي: ${formatSAR(grandTotal)}`,
      `المبلغ كتابةً: ${tafqeetSAR(grandTotal)}`,
      `---------------------------------------`,
      `الحساب البنكي: ${clientInfo.bankDetails?.bankName} - IBAN: ${clientInfo.bankDetails?.iban}`,
    ]
      .filter(Boolean)
      .join('\n');

    let finalOutput = quoteLines;
    if (documentBundle === 'contract_only') {
      finalOutput = buildContractPlainText(activeContract, clientInfo, items);
    } else if (documentBundle === 'quote_and_contract') {
      finalOutput = `${quoteLines}\n\n=======================================\n\n${buildContractPlainText(activeContract, clientInfo, items)}`;
    }

    navigator.clipboard.writeText(finalOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="print-outer-wrapper min-h-screen print:min-h-0 bg-stone-100 print:bg-white p-3 sm:p-8 print:!p-0 print:!m-0 font-sans">
      {/* Floating Control Bar for Screen (Hidden on Print) */}
      <div className="max-w-4xl mx-auto mb-6 bg-stone-900 text-white p-3.5 sm:p-4 rounded-2xl shadow-xl space-y-3 no-print">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 text-xs font-bold bg-stone-800 hover:bg-stone-700 text-stone-200 px-3.5 py-2 rounded-xl transition cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة لبرنامج التسعير</span>
            </button>

            {/* Quick Dual-Company Switcher inside Print Preview */}
            {onSelectCompany && (
              <div className="bg-stone-950 border border-stone-700/80 p-1 rounded-xl flex items-center gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => onSelectCompany('luminous')}
                  className={`px-2.5 py-1.5 rounded-lg font-black transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    !isArq
                      ? 'bg-white text-[#433c71] shadow-xs'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <CompanyLogo companyId="luminous" variant="icon" className="h-3.5 w-auto" />
                  <span>الرؤية المضيئة</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectCompany('arq')}
                  className={`px-2.5 py-1.5 rounded-lg font-black transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    isArq
                      ? 'bg-white text-stone-950 shadow-xs'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <CompanyLogo
                    companyId="arq"
                    variant="icon"
                    className="h-3 w-auto"
                    arqColor={isArq ? '#111111' : '#d6d3d1'}
                  />
                  <span>أرك (ARQ)</span>
                </button>
              </div>
            )}

            {/* View Mode Switcher (hidden only when viewing contract_only) */}
            {documentBundle !== 'contract_only' && (
              <div className="bg-stone-800 p-1 rounded-xl flex items-center gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => handleSelectViewMode('simplified')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    viewMode === 'simplified'
                      ? 'bg-[#F0A429] text-[#1D2B36] shadow-xs'
                      : 'text-stone-300 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>برنامج الاصالة المبسط</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectViewMode('master')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    viewMode === 'master'
                      ? 'bg-amber-500 text-stone-950 shadow-xs'
                      : 'text-stone-300 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>النموذج الموحد (Master Template)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectViewMode('compact')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    viewMode === 'compact'
                      ? 'bg-amber-500 text-stone-950 shadow-xs'
                      : 'text-stone-300 hover:text-white'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>الجدول المالي المبسط</span>
                </button>
              </div>
            )}

            {/* Single-Page Auto-fit Indicator & Preset Picker */}
            {documentBundle !== 'contract_only' && (
              <div className="flex items-center gap-1.5 bg-stone-800/90 border border-stone-700/80 px-2.5 py-1.5 rounded-xl text-xs">
                <div className="flex items-center gap-1 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">مقياس العرض:</span>
                </div>
                <select
                  value={printScaleMode}
                  onChange={(e) => setPrintScaleMode(e.target.value as any)}
                  className="bg-stone-900 border border-stone-700 text-stone-200 text-[11px] font-bold rounded-lg px-2 py-0.5 focus:outline-none focus:border-amber-400 cursor-pointer"
                  title="ملاءمة مقياس الطباعة ليخرج عرض السعر دائماً على صفحة واحدة متناسقة دون انقسام"
                >
                  <option value="auto">تلقائي (صفحة واحدة 100%)</option>
                  <option value="100">100% قياسي</option>
                  <option value="95">95% مدمج</option>
                  <option value="90">90% مكثف</option>
                  <option value="85">85% خفيف</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyText}
              className="flex items-center gap-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
              title="نسخ صيغة المستند كنص للواتساب أو الإيميل"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-stone-400" />}
              <span className="hidden sm:inline">{copied ? 'تم النسخ' : 'نسخ النص'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsEditMilestonesOpen(true)}
              className="flex items-center gap-1.5 bg-stone-800 hover:bg-stone-700 text-amber-400 border border-stone-700 hover:border-amber-500/50 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
              title="تعديل مبالغ وأسعار الدفعات يدوياً بالريال السعودي"
            >
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span>تعديل الدفعات</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadWordFile}
              className="flex items-center gap-1.5 bg-blue-900/50 hover:bg-blue-800/70 border border-blue-400/40 text-blue-100 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
              title="تحميل كملف مايكروسوفت وورد Word (.docx)"
            >
              <Download className="w-4 h-4 text-blue-300" />
              <span>Word (.docx)</span>
            </button>

            <button
              type="button"
              onClick={handleExportGoogleDoc}
              className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-md transition cursor-pointer"
              title="إنشاء وفتح مستند جوجل مفتوح الرابط للتعديل للجميع مباشرة من الكمبيوتر أو الجوال"
            >
              <FileEdit className="w-4 h-4 text-amber-300" />
              <span>مستند جوجل</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-black px-4 sm:px-5 py-2 rounded-xl text-xs shadow-md transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>
                {documentBundle === 'quote_and_contract'
                  ? 'طباعة / PDF (عرض + عقد)'
                  : documentBundle === 'contract_only'
                  ? 'طباعة / PDF (العقد فقط)'
                  : 'طباعة / PDF (صفحة واحدة)'}
              </span>
            </button>
          </div>
        </div>

        {/* Smart Contract Bundle Bar */}
        <div className="pt-2.5 border-t border-stone-800 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-[#d4c3a3]">
              <FileSignature className="w-4 h-4 text-[#c2ac82]" />
              <span>خيار إرفاق العقد الذكي:</span>
            </div>

            <div className="bg-stone-800 p-1 rounded-xl flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => handleSelectBundle('quote_only')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  documentBundle === 'quote_only'
                    ? 'bg-stone-200 text-stone-950 shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                عرض سعر فقط
              </button>
              <button
                type="button"
                onClick={() => handleSelectBundle('quote_and_contract')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  documentBundle === 'quote_and_contract'
                    ? 'bg-[#a6926b] text-white shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <FileSignature className="w-3.5 h-3.5" />
                <span>عرض السعر + العقد</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectBundle('contract_only')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  documentBundle === 'contract_only'
                    ? 'bg-[#a6926b] text-white shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                العقد فقط
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-stone-400 hidden md:inline">
              القالب المفعّل: <strong className="text-stone-200">{activeContract.contractTitle}</strong>
            </span>
            <button
              type="button"
              onClick={() => setIsContractEditorOpen(true)}
              className="flex items-center gap-1.5 bg-[#a6926b]/20 hover:bg-[#a6926b]/35 text-[#e6d7b9] border border-[#a6926b]/50 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer"
              title="فتح محرر العقد الذكي لتعديل البنود والأطراف والمدد وتبديل القالب"
            >
              <FileSignature className="w-3.5 h-3.5" />
              <span>تعديل بنود العقد الذكي</span>
            </button>
          </div>
        </div>
      </div>

      {/* Official Printable Document Container (A4 Single-Page Harmonious Layout) */}
      {documentBundle !== 'contract_only' && (
      <div
        ref={printContainerRef}
        className={`print-document-container ${
          documentBundle === 'quote_only' ? 'single-page-only' : ''
        } max-w-[210mm] min-h-[292mm] print:max-w-none print:w-full print:min-h-[279mm] print:max-h-[282mm] mx-auto bg-white shadow-2xl rounded-2xl print:rounded-none print:shadow-none print:!p-0 print:!m-0 border border-stone-200 print:border-none text-stone-900 text-right font-sans flex flex-col justify-between overflow-hidden ${
          viewMode === 'simplified' ? 'p-0' : 'p-5 sm:p-7'
        }`}
      >
        {viewMode === 'simplified' ? (
          <SimplifiedQuotationView
            items={items}
            clientInfo={clientInfo}
            subtotal={subtotal}
            discountAmount={discountAmount}
            taxAmount={taxAmount}
            grandTotal={grandTotal}
            milestones={milestones}
            onEditMilestones={() => setIsEditMilestonesOpen(true)}
          />
        ) : (
          <>
        {/* =========================================================================
            HEADER & LETTERHEAD
           ========================================================================= */}
        <div
          className={`border-b-2 ${
            isArq ? 'border-[#1c1917]' : 'border-stone-900'
          } flex flex-row items-center justify-between gap-4 shrink-0 ${
            density === 'comfort'
              ? 'pb-2.5 print:pb-2'
              : density === 'balanced'
              ? 'pb-2 print:pb-1.5'
              : 'pb-1.5 print:pb-1'
          }`}
        >
          {isArq ? (
            <div className="flex items-center gap-3.5 print:gap-3">
              <div
                className={`shrink-0 flex items-center justify-center ${
                  density === 'comfort'
                    ? 'h-16 print:!h-14'
                    : density === 'balanced'
                    ? 'h-14 print:!h-12'
                    : 'h-12 print:!h-11'
                }`}
              >
                <CompanyLogo companyId="arq" variant="full" className="h-full w-auto" color="#111111" />
              </div>
              <div className="border-r border-[#d4cfc3] pr-3 space-y-0.5">
                <h1
                  className={`font-black text-[#1c1917] tracking-tight leading-tight ${
                    density === 'comfort'
                      ? 'text-base sm:text-lg print:text-[15.5px]'
                      : density === 'balanced'
                      ? 'text-base print:text-[14px]'
                      : 'text-sm sm:text-base print:text-[13px]'
                  }`}
                >
                  {company.fullNameAr}
                </h1>
                <div className="text-[10.5px] print:text-[9px] font-extrabold text-[#a6926b] tracking-wider font-mono" dir="ltr">
                  ARQ ENGINEERING CONSULTANCY
                </div>
                <p className="text-[10px] print:text-[8.5px] text-stone-500 font-medium leading-tight">
                  {company.credentialsLineAr}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 sm:gap-3.5 print:gap-3">
              <div
                className={`shrink-0 flex items-center justify-center ${
                  density === 'comfort'
                    ? 'w-14 h-16 print:!w-14 print:!h-14'
                    : density === 'balanced'
                    ? 'w-13 h-15 print:!w-12 print:!h-12'
                    : 'w-12 h-14 print:!w-10 print:!h-10'
                }`}
              >
                <CompanyLogo companyId="luminous" variant="icon" className="w-full h-full" />
              </div>
              <div className="space-y-0.5 print:space-y-0.5">
                <h1
                  className={`font-black text-[#433c71] tracking-tight leading-tight ${
                    density === 'comfort'
                      ? 'text-lg sm:text-xl print:text-[17px]'
                      : density === 'balanced'
                      ? 'text-lg sm:text-xl print:text-[15.5px]'
                      : 'text-base sm:text-lg print:text-[14px]'
                  }`}
                >
                  {company.groupNameAr}
                </h1>
                <div className="flex items-center gap-2 text-xs print:text-[10.5px] font-black">
                  <span dir="ltr" className="inline-flex items-center gap-1.5 tracking-wider font-black">
                    <span className="text-[#433c71]">LUMINOUS</span>
                    <span className="text-[#e37725]">VISION</span>
                  </span>
                  <span className="text-stone-400">•</span>
                  <span className="text-stone-700 font-bold">{company.subtitleAr}</span>
                </div>
                <p className="text-[10px] print:text-[8.5px] text-stone-500 font-medium leading-tight">
                  {company.credentialsLineAr}
                </p>
              </div>
            </div>
          )}

          <div className="text-left space-y-0.5 text-xs border-r border-stone-200 pr-3 sm:border-r-0 sm:pr-0 print:border-r-0 shrink-0">
            <div className="text-stone-600 font-mono text-[11px] print:text-[9.5px] leading-snug">
              رقم العرض: <strong className="text-stone-900">{clientInfo.proposalNumber}</strong>
            </div>
            <div className="text-stone-600 text-[11px] print:text-[9.5px] leading-snug">
              التاريخ: <strong className="text-stone-900">{clientInfo.date}</strong>
            </div>
            {clientInfo.preparedBy && (
              <div className="text-stone-600 text-[10.5px] print:text-[9px] leading-snug">
                إعداد: <strong className="text-stone-900">{clientInfo.preparedBy}</strong>
              </div>
            )}
            <div
              className={`text-[10.5px] print:text-[9px] font-bold leading-snug ${
                isArq ? 'text-[#8a754c]' : 'text-amber-700'
              }`}
            >
              صلاحية العرض: {clientInfo.validityDays || 30} يوماً
            </div>
          </div>
        </div>

        {/* =========================================================================
            PROMINENT PROPOSAL TITLE (عريض وواضح في منتصف الورقة)
           ========================================================================= */}
        <div
          className={`text-center border-b border-stone-300 print:border-stone-200 shrink-0 ${
            density === 'comfort'
              ? 'py-2 print:py-1.5'
              : density === 'balanced'
              ? 'py-1.5 print:py-1'
              : 'py-1 print:py-0.5'
          }`}
        >
          <h2
            className={`font-black tracking-tight leading-tight ${
              isArq ? 'text-[#1c1917]' : 'text-[#433c71]'
            } ${
              density === 'comfort'
                ? 'text-lg sm:text-xl print:text-[16.5px]'
                : density === 'balanced'
                ? 'text-lg sm:text-xl print:text-[15px]'
                : 'text-base sm:text-lg print:text-[13.5px]'
            }`}
          >
            عرض سعر
          </h2>
          <div
            className={`font-bold text-stone-800 mt-0.5 ${
              density === 'comfort'
                ? 'text-sm sm:text-base print:text-[11.5px]'
                : density === 'balanced'
                ? 'text-sm print:text-[10.5px]'
                : 'text-xs sm:text-sm print:text-[9.5px]'
            }`}
          >
            {formatProposalDetailedTitle(clientInfo)}
          </div>
        </div>

        {/* =========================================================================
            VIEW MODE 1: MASTER TEMPLATE (النموذج الموحد الرسمي)
           ========================================================================= */}
        {viewMode === 'master' ? (
          <div className="flex-1 flex flex-col justify-between pt-1.5 print:pt-1">
            {/* أولًا: بيانات العرض والمشروع */}
            <section className="space-y-1 print:space-y-1 break-inside-avoid">
              <div
                className={`text-xs print:text-[10.5px] font-black uppercase tracking-wide border-r-4 print:border-r-3 pr-2 print:pr-1.5 ${
                  isArq ? 'text-[#1c1917] border-[#a6926b]' : 'text-[#433c71] border-[#e37725]'
                }`}
              >
                أولًا: بيانات العرض والمشروع
              </div>

              <div className="bg-stone-300 border border-stone-300 rounded-xl overflow-hidden">
                <div className="grid grid-cols-2 sm:grid-cols-5 print:grid-cols-5 gap-px bg-stone-300">
                  <div
                    className={`bg-stone-50 ${
                      density === 'comfort'
                        ? 'p-2 print:py-1.5 print:px-2'
                        : density === 'balanced'
                        ? 'p-1.5 print:py-1 print:px-2'
                        : 'p-1.5 print:py-0.5 print:px-1.5'
                    }`}
                  >
                    <span className="block text-[10px] print:text-[8px] text-stone-500 font-bold">رقم العرض:</span>
                    <span className="font-bold text-stone-900 font-mono text-xs print:text-[9.5px]">
                      {clientInfo.proposalNumber}
                    </span>
                  </div>
                  <div
                    className={`bg-stone-50 ${
                      density === 'comfort'
                        ? 'p-2 print:py-1.5 print:px-2'
                        : density === 'balanced'
                        ? 'p-1.5 print:py-1 print:px-2'
                        : 'p-1.5 print:py-0.5 print:px-1.5'
                    }`}
                  >
                    <span className="block text-[10px] print:text-[8px] text-stone-500 font-bold">التاريخ:</span>
                    <span className="font-bold text-stone-900 text-xs print:text-[9.5px]">{clientInfo.date}</span>
                  </div>
                  <div
                    className={`bg-stone-50 ${
                      density === 'comfort'
                        ? 'p-2 print:py-1.5 print:px-2'
                        : density === 'balanced'
                        ? 'p-1.5 print:py-1 print:px-2'
                        : 'p-1.5 print:py-0.5 print:px-1.5'
                    }`}
                  >
                    <span className="block text-[10px] print:text-[8px] text-stone-500 font-bold">اسم العميل:</span>
                    <span className="font-black text-stone-900 text-xs print:text-[10px]">
                      {clientInfo.clientName || 'العميل الكريم'}
                    </span>
                  </div>
                  <div
                    className={`bg-stone-50 ${
                      density === 'comfort'
                        ? 'p-2 print:py-1.5 print:px-2'
                        : density === 'balanced'
                        ? 'p-1.5 print:py-1 print:px-2'
                        : 'p-1.5 print:py-0.5 print:px-1.5'
                    }`}
                  >
                    <span className="block text-[10px] print:text-[8px] text-stone-500 font-bold">نوع المبنى:</span>
                    <span className="font-bold text-stone-900 text-xs print:text-[9.5px]">{clientInfo.buildingType}</span>
                  </div>
                  <div
                    className={`bg-stone-50 ${
                      density === 'comfort'
                        ? 'p-2 print:py-1.5 print:px-2'
                        : density === 'balanced'
                        ? 'p-1.5 print:py-1 print:px-2'
                        : 'p-1.5 print:py-0.5 print:px-1.5'
                    }`}
                  >
                    <span className="block text-[10px] print:text-[8px] text-stone-500 font-bold">المدينة:</span>
                    <span className="font-bold text-stone-900 text-xs print:text-[9.5px]">{clientInfo.projectCity}</span>
                  </div>
                  <div
                    className={`bg-stone-50 ${
                      density === 'comfort'
                        ? 'p-2 print:py-1.5 print:px-2'
                        : density === 'balanced'
                        ? 'p-1.5 print:py-1 print:px-2'
                        : 'p-1.5 print:py-0.5 print:px-1.5'
                    }`}
                  >
                    <span className="block text-[10px] print:text-[8px] text-stone-500 font-bold">الحي:</span>
                    <span className="font-bold text-stone-900 text-xs print:text-[9.5px]">
                      {clientInfo.district || 'غير محدد'}
                    </span>
                  </div>
                  <div
                    className={`bg-stone-50 ${
                      density === 'comfort'
                        ? 'p-2 print:py-1.5 print:px-2'
                        : density === 'balanced'
                        ? 'p-1.5 print:py-1 print:px-2'
                        : 'p-1.5 print:py-0.5 print:px-1.5'
                    }`}
                  >
                    <span className="block text-[10px] print:text-[8px] text-stone-500 font-bold">رقم القطعة:</span>
                    <span className="font-bold text-stone-900 text-xs print:text-[9.5px]">
                      {clientInfo.plotNumber || '-'}
                    </span>
                  </div>
                  <div
                    className={`bg-stone-50 ${
                      density === 'comfort'
                        ? 'p-2 print:py-1.5 print:px-2'
                        : density === 'balanced'
                        ? 'p-1.5 print:py-1 print:px-2'
                        : 'p-1.5 print:py-0.5 print:px-1.5'
                    }`}
                  >
                    <span className="block text-[10px] print:text-[8px] text-stone-500 font-bold">رقم المخطط:</span>
                    <span className="font-bold text-stone-900 text-xs print:text-[9.5px]">
                      {clientInfo.planNumber || '-'}
                    </span>
                  </div>
                  <div
                    className={`bg-stone-50 ${
                      density === 'comfort'
                        ? 'p-2 print:py-1.5 print:px-2'
                        : density === 'balanced'
                        ? 'p-1.5 print:py-1 print:px-2'
                        : 'p-1.5 print:py-0.5 print:px-1.5'
                    }`}
                  >
                    <span className="block text-[10px] print:text-[8px] text-stone-500 font-bold">{areaDetails.label}</span>
                    <span className="font-bold text-stone-900 text-xs print:text-[9.5px]">
                      {areaDetails.value}
                    </span>
                  </div>
                  <div
                    className={`bg-stone-50 col-span-2 sm:col-span-1 print:col-span-1 ${
                      density === 'comfort'
                        ? 'p-2 print:py-1.5 print:px-2'
                        : density === 'balanced'
                        ? 'p-1.5 print:py-1 print:px-2'
                        : 'p-1.5 print:py-0.5 print:px-1.5'
                    }`}
                  >
                    <span className="block text-[10px] print:text-[8px] text-stone-500 font-bold">نوع الخدمة:</span>
                    <span className="font-black text-amber-900 text-xs print:text-[9.5px]">
                      {clientInfo.serviceType}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* ثانيًا: مقدمة العرض */}
            <section className="space-y-1 print:space-y-1 break-inside-avoid">
              <div
                className={`text-xs print:text-[10.5px] font-black uppercase tracking-wide border-r-4 print:border-r-3 pr-2 print:pr-1.5 ${
                  isArq ? 'text-[#1c1917] border-[#a6926b]' : 'text-[#433c71] border-[#e37725]'
                }`}
              >
                ثانيًا: مقدمة العرض
              </div>

              <div
                className={`bg-stone-50/90 rounded-xl border border-stone-200 text-stone-800 ${
                  density === 'comfort'
                    ? 'p-2.5 print:p-2 text-xs print:text-[10px] leading-relaxed print:leading-relaxed'
                    : density === 'balanced'
                    ? 'p-2 print:p-1.5 text-xs print:text-[9.5px] leading-snug print:leading-snug'
                    : 'p-1.5 print:p-1.5 text-[11px] print:text-[8.5px] leading-snug print:leading-tight'
                }`}
              >
                <p className="mb-0.5 print:mb-0.5">
                  السيد/ <strong className="text-stone-900">{clientInfo.clientName || 'العميل المحترم'}</strong> المحترم،
                </p>
                <p className="text-justify">
                  بناءً على طلبكم، يسر <strong>{company.fullNameAr}</strong> أن تقدم لسعادتكم عرض السعر الخاص بأعمال{' '}
                  <strong className="text-stone-900">{clientInfo.serviceType}</strong> لمشروع{' '}
                  <strong className="text-stone-900">{clientInfo.buildingType}</strong>، والكائن بمدينة{' '}
                  <strong className="text-stone-900">{clientInfo.projectCity}</strong>، حي{' '}
                  <strong className="text-stone-900">{clientInfo.district || 'الموضح أعلاه'}</strong>، على قطعة الأرض رقم{' '}
                  <strong className="text-stone-900">{clientInfo.plotNumber || '—'}</strong> من المخطط رقم{' '}
                  <strong className="text-stone-900">{clientInfo.planNumber || '—'}</strong>،{' '}
                  <strong className="text-stone-900">{areaDetails.introText}</strong>، وذلك وفق نطاق الأعمال والشروط الموضحة أدناه.
                </p>
              </div>
            </section>

            {/* ثالثًا: نطاق أعمال الاستشاري — وحدات شرطية بتنسيق شبكي متناسق */}
            <section className="space-y-1 print:space-y-1">
              <div
                className={`text-xs print:text-[10.5px] font-black uppercase tracking-wide border-r-4 print:border-r-3 pr-2 print:pr-1.5 flex justify-between items-center ${
                  isArq ? 'text-[#1c1917] border-[#a6926b]' : 'text-[#433c71] border-[#e37725]'
                }`}
              >
                <span>ثالثًا: نطاق أعمال الاستشاري المعتمد</span>
                <span className="text-[10px] print:text-[8.5px] text-stone-500 font-bold">
                  ({activeScopeItems.length} وحدات هندسية مشمولة)
                </span>
              </div>

              <div className="border border-stone-300 rounded-xl overflow-hidden bg-white p-1.5 print:p-1.5">
                <div
                  className={`grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 ${
                    density === 'comfort'
                      ? 'gap-2 print:gap-1.5'
                      : density === 'balanced'
                      ? 'gap-1.5 print:gap-1.5'
                      : 'gap-1 print:gap-1'
                  }`}
                >
                  {activeScopeItems.map((scope, index) => {
                    const isLastOdd =
                      activeScopeItems.length % 2 === 1 && index === activeScopeItems.length - 1;
                    return (
                      <div
                        key={scope.id}
                        className={`bg-stone-50/70 border border-stone-200/80 rounded-lg break-inside-avoid ${
                          isLastOdd ? 'sm:col-span-2 print:col-span-2' : ''
                        } ${
                          density === 'comfort'
                            ? 'p-2 print:p-2'
                            : density === 'balanced'
                            ? 'p-1.5 print:p-1.5'
                            : 'p-1.5 print:p-1'
                        }`}
                      >
                        <div className="flex items-start gap-2 print:gap-1.5">
                          <span
                            className={`rounded-md font-black flex items-center justify-center shrink-0 mt-0.5 ${
                              isArq
                                ? 'bg-[#1c1917]/10 text-[#1c1917]'
                                : 'bg-[#433c71]/10 text-[#433c71]'
                            } ${
                              density === 'comfort'
                                ? 'w-5 h-5 print:w-4.5 print:h-4.5 text-[10px] print:text-[9px]'
                                : 'w-4 h-4 print:w-4 print:h-4 text-[10px] print:text-[8px]'
                            }`}
                          >
                            {index + 1}
                          </span>
                          <div className="space-y-0.5 print:space-y-0.5">
                            <span
                              className={`font-black text-stone-900 block ${
                                density === 'comfort'
                                  ? 'text-xs print:text-[10px]'
                                  : density === 'balanced'
                                  ? 'text-xs print:text-[9.5px]'
                                  : 'text-[11px] print:text-[8.5px]'
                              }`}
                            >
                              {scope.name}
                            </span>
                            <p
                              className={`text-stone-600 ${
                                density === 'comfort'
                                  ? 'text-[11px] print:text-[9px] leading-snug print:leading-snug'
                                  : density === 'balanced'
                                  ? 'text-[11px] print:text-[8.5px] leading-snug print:leading-snug'
                                  : 'text-[10.5px] print:text-[7.5px] leading-tight print:leading-tight'
                              }`}
                            >
                              {scope.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {activeScopeItems.length === 0 && (
                    <div className="sm:col-span-2 print:col-span-2 p-2 text-center text-xs print:text-[9px] text-stone-500">
                      يرجى تفعيل وحدات النطاق الشرطية من لوحة التعديل.
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* رابعًا: الشروط والالتزامات العامة والتنفيذية */}
            <section className="space-y-1 print:space-y-1 break-inside-avoid">
              <div
                className={`text-xs print:text-[10.5px] font-black uppercase tracking-wide border-r-4 print:border-r-3 pr-2 print:pr-1.5 ${
                  isArq ? 'text-[#1c1917] border-[#a6926b]' : 'text-[#433c71] border-[#e37725]'
                }`}
              >
                رابعًا: الشروط والالتزامات العامة والتنفيذية
              </div>

              <div
                className={`grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-2 print:gap-2 items-stretch ${
                  density === 'comfort'
                    ? 'text-[11px] print:text-[9px] leading-snug print:leading-snug'
                    : density === 'balanced'
                    ? 'text-[11px] print:text-[8.5px] leading-snug print:leading-snug'
                    : 'text-[10.5px] print:text-[8px] leading-tight print:leading-tight'
                }`}
              >
                {/* Card 1: التزامات المالك والأعمال غير المشمولة */}
                <div
                  className={`bg-stone-50 rounded-xl border border-stone-200 h-full flex flex-col justify-between ${
                    density === 'comfort'
                      ? 'p-2.5 print:p-2 space-y-1 print:space-y-1'
                      : density === 'balanced'
                      ? 'p-2 print:p-1.5 space-y-1 print:space-y-0.5'
                      : 'p-1.5 print:p-1.5 space-y-0.5 print:space-y-0.5'
                  }`}
                >
                  <div className="font-bold text-stone-900 border-b border-stone-200 pb-1 print:pb-0.5 text-xs print:text-[9.5px]">
                    التزامات المالك والأعمال المستثناة:
                  </div>
                  <div className="space-y-1 print:space-y-0.5 text-stone-700 flex-1 flex flex-col justify-around">
                    {GENERAL_OWNER_OBLIGATIONS.slice(0, 3).map((ob, idx) => (
                      <div key={idx} className="flex items-start gap-1">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>{ob}</span>
                      </div>
                    ))}
                    {/* تأكيد استثناء الإشراف في حال عدم تفعيل أيقونة الإشراف (بند بدون إشراف) */}
                    {(!clientInfo.scopeFlags?.supervision ||
                      clientInfo.exclusions?.excludeSupervision ||
                      !items.some(
                        (i) =>
                          i.departmentId === 'supervision' ||
                          i.details.some(
                            (d) =>
                              d.includes('خدمة الإشراف:') &&
                              !d.includes('بدون خدمة إشراف') &&
                              !d.includes('بدون إشراف')
                          )
                      )) && (
                      <div className="flex items-start gap-1">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>
                          تأكيد (بدون إشراف): يؤكد هذا العرض على أن نطاق الأعمال المتفق عليه لا يشمل أعمال الإشراف الهندسي الميداني على التنفيذ.
                        </span>
                      </div>
                    )}
                    {clientInfo.exclusions?.excludeGovFees && (
                      <div className="flex items-start gap-1 text-stone-900 font-medium">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>
                          <strong>مستثنى:</strong> {EXCLUSION_CLAUSES.excludeGovFees}
                        </span>
                      </div>
                    )}
                    {clientInfo.exclusions?.customExclusions?.trim() && (
                      <div className="flex items-start gap-1 text-stone-900 font-medium">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>
                          <strong>مستثنى:</strong> {clientInfo.exclusions.customExclusions.trim()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card 2: المدد الزمنية والتعديلات والملكية الفكرية */}
                <div
                  className={`bg-stone-50 rounded-xl border border-stone-200 h-full flex flex-col justify-between ${
                    density === 'comfort'
                      ? 'p-2.5 print:p-2 space-y-1 print:space-y-1'
                      : density === 'balanced'
                      ? 'p-2 print:p-1.5 space-y-1 print:space-y-0.5'
                      : 'p-1.5 print:p-1.5 space-y-0.5 print:space-y-0.5'
                  }`}
                >
                  <div className="font-bold text-stone-900 border-b border-stone-200 pb-1 print:pb-0.5 text-xs print:text-[9.5px]">
                    المدد الزمنية والتعديلات والملكية الفكرية:
                  </div>
                  <div className="space-y-1 print:space-y-1 text-stone-700 flex-1 flex flex-col justify-around">
                    <div className="flex items-start gap-1">
                      <span className="text-amber-600 font-bold">•</span>
                      <span>
                        <strong>مدة التنفيذ:</strong> {clientInfo.executionDurationDays || 45} يوم عمل من سداد الدفعة واعتماد المخططات المعمارية والواجهات.
                      </span>
                    </div>
                    <div className="flex items-start gap-1">
                      <span className="text-amber-600 font-bold">•</span>
                      <span>
                        <strong>الاعتمادات:</strong> {clientInfo.revisionCountText}، ويعتمد كل طور قبل التالي.
                      </span>
                    </div>
                    <div className="flex items-start gap-1">
                      <span className="text-amber-600 font-bold">•</span>
                      <span>
                        <strong>الملكية الفكرية:</strong> المخرجات الهندسية تخضع لحقوق الاستخدام لموقع المشروع حصراً.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* خامسًا & سادسًا: الأسعار والبيان المالي وجدول الدفعات والبيانات البنكية */}
            <div className="grid grid-cols-1 sm:grid-cols-12 print:grid-cols-12 gap-2.5 print:gap-2 items-stretch break-inside-avoid">
              {/* خامسًا: الأسعار والبيان المالي (7 Cols) */}
              <section className="sm:col-span-7 print:col-span-7 flex flex-col justify-between space-y-1 print:space-y-1">
                <div
                  className={`text-xs print:text-[10.5px] font-black uppercase tracking-wide border-r-4 print:border-r-3 pr-2 print:pr-1.5 ${
                    isArq ? 'text-[#1c1917] border-[#a6926b]' : 'text-[#433c71] border-[#e37725]'
                  }`}
                >
                  خامسًا: الأسعار والبيان المالي
                </div>

                <div className="flex-1 flex flex-col justify-between space-y-1.5 print:space-y-1">
                  <div className="border border-stone-300 rounded-xl overflow-hidden text-xs print:text-[9.5px]">
                    <table className="w-full text-right divide-y divide-stone-300">
                      <thead className="bg-stone-900 text-white font-bold">
                        <tr>
                          <th
                            className={
                              density === 'comfort'
                                ? 'p-2 print:py-1.5 print:px-2.5'
                                : 'p-1.5 print:py-1 print:px-2'
                            }
                          >
                            البيان
                          </th>
                          <th
                            className={`text-left w-36 print:w-32 ${
                              density === 'comfort'
                                ? 'p-2 print:py-1.5 print:px-2.5'
                                : 'p-1.5 print:py-1 print:px-2'
                            }`}
                          >
                            القيمة (ريال)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200 bg-white">
                        <tr>
                          <td
                            className={`font-bold text-stone-900 ${
                              density === 'comfort'
                                ? 'p-2 print:py-1.5 print:px-2.5'
                                : 'p-1.5 print:py-1 print:px-2'
                            }`}
                          >
                            أتعاب أعمال {clientInfo.serviceType}
                          </td>
                          <td
                            className={`text-left font-black text-stone-900 ${
                              density === 'comfort'
                                ? 'p-2 print:py-1.5 print:px-2.5'
                                : 'p-1.5 print:py-1 print:px-2'
                            }`}
                          >
                            {formatSAR(subtotal)}
                          </td>
                        </tr>

                        {discountAmount > 0 && (
                          <tr className="text-red-600 bg-red-50/60">
                            <td
                              className={`font-bold ${
                                density === 'comfort'
                                  ? 'p-2 print:py-1.5 print:px-2.5'
                                  : 'p-1.5 print:py-1 print:px-2'
                              }`}
                            >
                              الخصم التجاري الممنوح (
                              {clientInfo.discountType === 'percentage' ? `${clientInfo.discountValue}%` : 'خاص'})
                            </td>
                            <td
                              className={`text-left font-bold ${
                                density === 'comfort'
                                  ? 'p-2 print:py-1.5 print:px-2.5'
                                  : 'p-1.5 print:py-1 print:px-2'
                              }`}
                            >
                              - {formatSAR(discountAmount)}
                            </td>
                          </tr>
                        )}

                        {clientInfo.includeTax ? (
                          <tr>
                            <td
                              className={`text-stone-700 ${
                                density === 'comfort'
                                  ? 'p-2 print:py-1.5 print:px-2.5'
                                  : 'p-1.5 print:py-1 print:px-2'
                              }`}
                            >
                              ضريبة القيمة المضافة المستحقة (15%)
                            </td>
                            <td
                              className={`text-left font-bold text-stone-900 ${
                                density === 'comfort'
                                  ? 'p-2 print:py-1.5 print:px-2.5'
                                  : 'p-1.5 print:py-1 print:px-2'
                              }`}
                            >
                              {formatSAR(taxAmount)}
                            </td>
                          </tr>
                        ) : (
                          <tr>
                            <td
                              colSpan={2}
                              className="p-1.5 print:py-1 print:px-2 text-[10px] print:text-[8px] text-stone-500"
                            >
                              * الأسعار أعلاه غير شاملة ضريبة القيمة المضافة
                            </td>
                          </tr>
                        )}

                        <tr className="bg-stone-900 text-white font-black text-xs print:text-[10px]">
                          <td
                            className={
                              density === 'comfort'
                                ? 'p-2 print:py-1.5 print:px-2.5'
                                : 'p-1.5 print:py-1 print:px-2'
                            }
                          >
                            الإجمالي النهائي {clientInfo.includeTax ? 'شامل الضريبة' : ''}
                          </td>
                          <td
                            className={`text-left text-amber-300 text-xs sm:text-sm print:text-[11px] font-black ${
                              density === 'comfort'
                                ? 'p-2 print:py-1.5 print:px-2.5'
                                : 'p-1.5 print:py-1 print:px-2'
                            }`}
                          >
                            {formatSAR(grandTotal)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Tafqeet block */}
                  <div
                    className={`bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs print:text-[9px] flex items-center justify-between gap-2 ${
                      density === 'comfort'
                        ? 'p-2 print:py-1.5 print:px-2.5'
                        : 'p-1.5 print:py-1 print:px-2'
                    }`}
                  >
                    <span className="font-bold text-stone-900">المبلغ كتابةً:</span>
                    <span className="font-black text-amber-900 text-xs print:text-[9.5px]">
                      {tafqeetSAR(grandTotal)}
                    </span>
                  </div>
                </div>
              </section>

              {/* سادسًا: جدول سداد الدفعات والبيانات البنكية (5 Cols) */}
              <section className="sm:col-span-5 print:col-span-5 flex flex-col justify-between space-y-1 print:space-y-1">
                <div className="flex items-center justify-between">
                  <div
                    className={`text-xs print:text-[10.5px] font-black uppercase tracking-wide border-r-4 print:border-r-3 pr-2 print:pr-1.5 ${
                      isArq ? 'text-[#1c1917] border-[#a6926b]' : 'text-[#433c71] border-[#e37725]'
                    }`}
                  >
                    سادسًا: جدول الدفعات والبنك
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditMilestonesOpen(true)}
                    className="no-print text-[10.5px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition shadow-2xs active:scale-95"
                    title="تعديل مبالغ وأسعار الدفعات أو إضافة/إنقاص وتعديل سبب الدفعة"
                  >
                    <FileEdit className="w-3.5 h-3.5 text-amber-700" />
                    <span>تعديل أسعار وأسباب الدفعات</span>
                  </button>
                </div>

                <div className="flex-1 flex flex-col justify-between space-y-1.5 print:space-y-1">
                  {/* Milestones */}
                  <div className="border border-stone-300 rounded-xl overflow-hidden text-xs print:text-[9px]">
                    <div className="divide-y divide-stone-200 bg-white">
                      {milestones.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => setIsEditMilestonesOpen(true)}
                          className={`flex items-start justify-between gap-2 cursor-pointer hover:bg-amber-50/60 transition group ${
                            density === 'comfort'
                              ? 'p-2 print:py-1.5 print:px-2'
                              : 'p-1.5 print:py-1 print:px-2'
                          }`}
                          title="انقر لتعديل أسعار الدفعات أو إضافة/إنقاص وتعديل السبب"
                        >
                          <div className="flex-1 min-w-0 pr-0.5">
                            <span className="font-bold text-stone-900 group-hover:text-amber-800 transition block">
                              {m.title}
                            </span>
                            {m.description && (
                              <span className="text-[10px] print:text-[8px] text-stone-500 font-medium leading-tight block mt-0.5">
                                {m.description}
                              </span>
                            )}
                          </div>
                          <span className="font-black text-stone-900 font-mono flex items-center gap-1 shrink-0 pt-0.5">
                            {formatSAR(m.amount)}
                            <FileEdit className="w-2.5 h-2.5 text-stone-400 group-hover:text-amber-600 no-print opacity-0 group-hover:opacity-100 transition" />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bank & Validity */}
                  <div
                    className={`bg-stone-50 rounded-xl border border-stone-200 text-xs print:text-[8.5px] space-y-0.5 text-stone-700 leading-snug ${
                      density === 'comfort' ? 'p-2.5 print:p-2' : 'p-2 print:p-1.5'
                    }`}
                  >
                    <div>
                      <strong>البنك:</strong> {clientInfo.bankDetails?.bankName} ({clientInfo.bankDetails?.accountName})
                    </div>
                    <div className="font-mono text-stone-900 font-bold break-all">
                      <strong>IBAN:</strong> {clientInfo.bankDetails?.iban}
                    </div>
                    <div className="text-amber-800 font-bold">
                      صلاحية العرض: {clientInfo.validityDays || 30} يوماً من تاريخ إصداره.
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* سابعًا: الاعتمادات والتوقيع والختم الرسمي + التذييل */}
            <div className="shrink-0 space-y-1.5 print:space-y-1">
              <div
                className={`border-t-2 border-stone-300 grid grid-cols-2 print:grid-cols-2 gap-4 print:gap-3 text-xs print:text-[9px] break-inside-avoid items-center ${
                  density === 'comfort' ? 'pt-2.5 print:pt-2' : 'pt-2 print:pt-1.5'
                }`}
              >
                <div className="space-y-1.5 print:space-y-1">
                  <div className="font-black text-stone-900 text-xs sm:text-sm print:text-[10px]">
                    اعتماد وقبول العميل:
                  </div>
                  <div className="space-y-1 print:space-y-0.5 text-stone-700 text-xs print:text-[8.5px]">
                    <div>الاسم: ....................................................</div>
                    <div>التوقيع: ..................................................</div>
                    <div>التاريخ: ..... / ..... / 2026 م</div>
                  </div>
                </div>

                <div className="space-y-1 print:space-y-0.5 text-left">
                  <div className="font-black text-stone-900 text-xs sm:text-sm print:text-[10px]">
                    اعتماد {company.fullNameAr}:
                  </div>
                  <div className="text-[11px] print:text-[9px] text-stone-700 font-bold">
                    إعداد المهندس:{' '}
                    <span className="text-stone-950 font-black">{cleanEngineerName(clientInfo.preparedBy)}</span>
                  </div>
                  <div className="flex justify-end pt-0.5 print:pt-0">
                    <CompanyOfficialSeal
                      companyId={activeCompanyId}
                      className={`w-auto ${
                        density === 'comfort'
                          ? 'h-16 sm:h-18 print:!h-14 max-w-[140px] print:max-w-[130px]'
                          : density === 'balanced'
                          ? 'h-14 sm:h-16 print:!h-12 max-w-[130px] print:max-w-[115px]'
                          : 'h-12 sm:h-14 print:!h-10 max-w-[120px] print:max-w-[100px]'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Document Print Footer */}
              <div className="flex items-center justify-between text-[9px] print:text-[7.5px] text-stone-400 pt-1 border-t border-stone-200 break-inside-avoid">
                <span>
                  {company.fullTitleAr} • عرض سعر رقم {clientInfo.proposalNumber} • س.ت: {company.crNumber}
                </span>
                <span className="font-bold">وثيقة عرض سعر معتمدة رسمياً</span>
              </div>
            </div>
          </div>
        ) : (
          /* =========================================================================
              VIEW MODE 2: COMPACT / ITEM-BY-ITEM VIEW
             ========================================================================= */
          <div className="flex-1 flex flex-col justify-between pt-2 print:pt-1.5">
            {/* Client & Project Details */}
            <div className="bg-stone-50 p-3 print:p-2 rounded-xl border border-stone-200 grid grid-cols-2 sm:grid-cols-4 print:grid-cols-4 gap-3 print:gap-2 text-xs print:text-[9.5px] break-inside-avoid">
              <div>
                <span className="block text-[11px] print:text-[8px] text-stone-500 font-bold mb-0.5">اسم العميل:</span>
                <span className="font-black text-stone-900 text-xs sm:text-sm print:text-[10px]">
                  {clientInfo.clientName || 'العميل الكريم'}
                </span>
              </div>

              <div>
                <span className="block text-[11px] print:text-[8px] text-stone-500 font-bold mb-0.5">رقم الجوال:</span>
                <span className="font-bold text-stone-800 font-mono print:text-[9.5px]">
                  {clientInfo.phone || 'غير مسجل'}
                </span>
              </div>

              <div>
                <span className="block text-[11px] print:text-[8px] text-stone-500 font-bold mb-0.5">
                  نوع المشروع / المبنى:
                </span>
                <span className="font-bold text-stone-900 print:text-[9.5px]">
                  {clientInfo.buildingType || clientInfo.projectTitle || 'مشروع هندسي'}
                </span>
              </div>

              <div>
                <span className="block text-[11px] print:text-[8px] text-stone-500 font-bold mb-0.5">
                  الموقع / المدينة:
                </span>
                <span className="font-bold text-stone-900 print:text-[9.5px]">
                  {clientInfo.projectCity} {clientInfo.district ? `- ${clientInfo.district}` : ''}
                </span>
              </div>
            </div>

            {/* Scope of Work Table */}
            <div className="space-y-1.5 print:space-y-1">
              <h2 className="text-xs sm:text-sm print:text-[10.5px] font-black text-stone-900">
                جدول نطاق الأعمال والخدمات الهندسية المسعرة:
              </h2>

              <div className="overflow-x-auto border border-stone-300 rounded-xl">
                <table className="w-full text-xs print:text-[9.5px] text-right divide-y divide-stone-300">
                  <thead className="bg-stone-900 text-white font-bold">
                    <tr>
                      <th className="p-2.5 print:py-1.5 print:px-2 w-10 text-center">م</th>
                      <th className="p-2.5 print:py-1.5 print:px-2">القسم</th>
                      <th className="p-2.5 print:py-1.5 print:px-2">تفاصيل الخدمة والبنود المتضمنة</th>
                      <th className="p-2.5 print:py-1.5 print:px-2 text-left w-32 print:w-28">المبلغ (ريال)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 bg-white">
                    {items.map((item, index) => (
                      <tr key={item.id} className="align-top break-inside-avoid">
                        <td className="p-2.5 print:py-1.5 print:px-2 text-center font-bold text-stone-500 bg-stone-50">
                          {index + 1}
                        </td>
                        <td className="p-2.5 print:py-1.5 print:px-2 font-black text-stone-900 whitespace-nowrap">
                          {item.departmentName}
                        </td>
                        <td className="p-2.5 print:py-1.5 print:px-2 space-y-1 print:space-y-0.5">
                          <div className="font-bold text-stone-900 print:text-[10px]">{item.title}</div>
                          <ul className="text-[11px] print:text-[9px] text-stone-600 space-y-0.5 pr-2">
                            {item.details.map((d, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <span className="text-amber-600 font-black">•</span>
                                <span className="print:leading-snug">{d}</span>
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td className="p-2.5 print:py-1.5 print:px-2 text-left font-black text-stone-900 whitespace-nowrap text-xs sm:text-sm print:text-[10px]">
                          {formatSAR(item.totalPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-12 print:grid-cols-12 gap-3 print:gap-2 items-stretch break-inside-avoid">
              <div className="sm:col-span-7 print:col-span-7 bg-stone-50 p-3 print:p-2 rounded-xl border border-stone-200 space-y-1.5 print:space-y-1 text-xs print:text-[9.5px] flex flex-col justify-between">
                <div>
                  <div className="font-bold text-stone-900 print:text-[9.5px] mb-1">المبلغ الإجمالي كتابةً:</div>
                  <div className="text-amber-800 font-bold text-xs sm:text-sm print:text-[9.5px] bg-amber-500/10 p-2 print:py-1 print:px-2 rounded-lg border border-amber-500/20">
                    {tafqeetSAR(grandTotal)}
                  </div>
                </div>

                <div className="pt-1 text-[11px] print:text-[8.5px] text-stone-600 space-y-0.5">
                  <div className="flex items-center justify-between font-bold text-stone-800">
                    <span>جدول الدفعات المالية المقترحة:</span>
                    <button
                      type="button"
                      onClick={() => setIsEditMilestonesOpen(true)}
                      className="no-print text-[10px] text-amber-700 hover:text-amber-900 flex items-center gap-0.5 font-bold cursor-pointer"
                    >
                      <FileEdit className="w-2.5 h-2.5" />
                      <span>تعديل المبالغ</span>
                    </button>
                  </div>
                  {milestones.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => setIsEditMilestonesOpen(true)}
                      className="flex justify-between items-center cursor-pointer hover:bg-amber-50/60 rounded px-1 transition"
                      title="انقر لتعديل أسعار الدفعات يدوياً"
                    >
                      <span>
                        • {m.title}: {m.description}
                      </span>
                      <span className="font-bold font-mono">{formatSAR(m.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-5 print:col-span-5 bg-white p-3 print:p-2 rounded-xl border-2 border-stone-900 space-y-1.5 print:space-y-1 text-xs print:text-[9.5px] flex flex-col justify-between">
                <div className="space-y-1.5 print:space-y-1">
                  <div className="flex justify-between items-center text-stone-600">
                    <span>المجموع الفرعي:</span>
                    <span className="font-bold text-stone-900">{formatSAR(subtotal)}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between items-center text-red-600">
                      <span>الخصم التجاري الممنوح:</span>
                      <span className="font-bold">- {formatSAR(discountAmount)}</span>
                    </div>
                  )}

                  {clientInfo.includeTax ? (
                    <div className="flex justify-between items-center text-stone-600">
                      <span>ضريبة القيمة المضافة (15%):</span>
                      <span className="font-bold text-stone-900">{formatSAR(taxAmount)}</span>
                    </div>
                  ) : (
                    <div className="text-[10px] print:text-[8px] text-stone-500 text-left">
                      * الأسعار أعلاه غير شاملة ضريبة القيمة المضافة
                    </div>
                  )}
                </div>

                <div className="pt-1.5 print:pt-1 border-t-2 border-stone-900 flex justify-between items-baseline">
                  <span className="text-xs sm:text-sm print:text-[10px] font-black text-stone-900">
                    الإجمالي النهائي:
                  </span>
                  <span className="text-base sm:text-lg print:text-[11px] font-black text-stone-900">
                    {formatSAR(grandTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* General Terms & Conditions */}
            <div className="border-t border-stone-200 pt-2 print:pt-1.5 text-[10.5px] print:text-[8.5px] text-stone-600 space-y-0.5 break-inside-avoid leading-snug">
              <div className="font-bold text-stone-800">شروط وأحكام العرض:</div>
              <p>
                1. يشمل العرض كافة الرسوم الهندسية والاستشارية الموضحة في بنود الجدول أعلاه دون رسوم المنصات الحكومية والبلدية.
              </p>
              {(!clientInfo.scopeFlags?.supervision ||
                clientInfo.exclusions?.excludeSupervision ||
                !items.some(
                  (i) =>
                    i.departmentId === 'supervision' ||
                    i.details.some(
                      (d) =>
                        d.includes('خدمة الإشراف:') &&
                        !d.includes('بدون خدمة إشراف') &&
                        !d.includes('بدون إشراف')
                    )
                )) && (
                <p>
                  2. تأكيد (بدون إشراف): يؤكد هذا العرض على أن نطاق الأعمال المتفق عليه لا يشمل أعمال الإشراف الهندسي الميداني على التنفيذ.
                </p>
              )}
              <p>
                {!clientInfo.scopeFlags?.supervision ||
                clientInfo.exclusions?.excludeSupervision ||
                !items.some((i) => i.departmentId === 'supervision')
                  ? '3'
                  : '2'}
                . يتم الالتزام بكافة متطلبات الكود السعودي للبناء (SBC) واشتراطات الدفاع المدني والبلديات المعتمدة.
              </p>
              <p>
                {!clientInfo.scopeFlags?.supervision ||
                clientInfo.exclusions?.excludeSupervision ||
                !items.some((i) => i.departmentId === 'supervision')
                  ? '4'
                  : '3'}
                . أي تعديلات جوهرية أو إضافات خارج نطاق الأعمال المسعر أعلاه يتم الاتفاق عليها بملحق عقد إضافي.
              </p>
            </div>

            {/* Signatures & Stamp Block + Footer */}
            <div className="shrink-0 space-y-1.5 print:space-y-1">
              <div className="pt-2.5 print:pt-2 border-t-2 border-stone-200 grid grid-cols-2 print:grid-cols-2 gap-6 print:gap-3 text-xs print:text-[9px] break-inside-avoid items-center">
                <div className="space-y-1.5 print:space-y-1">
                  <div className="font-black text-stone-800 print:text-[10px]">اعتماد وقبول العميل:</div>
                  <div className="space-y-1 print:space-y-0.5 text-stone-600 text-xs print:text-[8.5px]">
                    <div>الاسم: ....................................................</div>
                    <div>التوقيع: ..................................................</div>
                    <div>التاريخ: ..... / ..... / 2026 م</div>
                  </div>
                </div>

                <div className="space-y-1 print:space-y-0.5 text-left">
                  <div className="font-black text-stone-900 text-xs sm:text-sm print:text-[10px]">
                    اعتماد {company.fullNameAr}:
                  </div>
                  <div className="text-[11px] print:text-[9px] text-stone-700 font-bold">
                    إعداد المهندس:{' '}
                    <span className="text-stone-950 font-black">{cleanEngineerName(clientInfo.preparedBy)}</span>
                  </div>
                  <div className="flex justify-end pt-0.5 print:pt-0">
                    <CompanyOfficialSeal
                      companyId={activeCompanyId}
                      className="h-16 sm:h-18 print:!h-14 max-w-[140px] print:max-w-[130px] w-auto"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[9px] print:text-[7.5px] text-stone-400 pt-1 border-t border-stone-200 break-inside-avoid">
                <span>
                  {company.fullTitleAr} • عرض سعر رقم {clientInfo.proposalNumber} • س.ت: {company.crNumber}
                </span>
                <span className="font-bold">وثيقة عرض سعر معتمدة رسمياً</span>
              </div>
            </div>
          </div>
        )}
          </>
        )}
      </div>
      )}

      {/* Visual Screen Divider Between Quotation & Attached Contract */}
      {documentBundle === 'quote_and_contract' && (
        <div className="max-w-[210mm] mx-auto my-6 bg-[#f3f0e8] border border-[#d6c9ae] rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2 text-xs text-stone-800">
            <FileSignature className="w-4 h-4 text-[#a6926b] shrink-0" />
            <span>
              <strong>المرفق الرسمي:</strong> {activeContract.contractTitle} — يُطبع تلقائياً بدءاً من الصفحة التالية بتنسيق العقد المعتمد
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsContractEditorOpen(true)}
            className="text-xs font-bold bg-[#3a3c3e] hover:bg-stone-800 text-white px-3 py-1.5 rounded-lg transition cursor-pointer"
          >
            تعديل بنود العقد
          </button>
        </div>
      )}

      {/* Attached Smart Contract Printable Document */}
      {(documentBundle === 'quote_and_contract' || documentBundle === 'contract_only') && (
        <ContractPrintView
          contract={activeContract}
          clientInfo={clientInfo}
          items={items}
          subtotal={subtotal}
          discountAmount={discountAmount}
          taxAmount={taxAmount}
          grandTotal={grandTotal}
          milestones={milestones}
          startsOnNewPage={documentBundle === 'quote_and_contract'}
          onEditContract={() => setIsContractEditorOpen(true)}
          onEditMilestones={() => setIsEditMilestonesOpen(true)}
        />
      )}

      {/* Google Doc Export & Share Modal */}
      <GoogleDocExportModal
        isOpen={isGoogleDocModalOpen}
        onClose={() => setIsGoogleDocModalOpen(false)}
        isLoading={isExportingDoc}
        error={docExportError}
        docUrl={googleDocUrl}
        docTitle={googleDocTitle}
        clientInfo={clientInfo}
        items={items}
        onRetry={handleCloudExportGoogleDoc}
      />

      {/* Edit Payment Milestones Modal */}
      <EditPaymentMilestonesModal
        isOpen={isEditMilestonesOpen}
        onClose={() => setIsEditMilestonesOpen(false)}
        clientInfo={clientInfo}
        grandTotal={grandTotal}
        onSaveMilestones={handleSaveMilestones}
      />

      {/* Smart Contract Editor Modal */}
      <ContractEditorModal
        isOpen={isContractEditorOpen}
        onClose={() => setIsContractEditorOpen(false)}
        clientInfo={clientInfo}
        items={items}
        onSaveContract={handleSaveContractData}
        onOpenEditMilestones={() => {
          setIsContractEditorOpen(false);
          setIsEditMilestonesOpen(true);
        }}
      />
    </div>
  );
};
