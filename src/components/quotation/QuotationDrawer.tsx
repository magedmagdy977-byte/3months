import React, { useState } from 'react';
import { QuotationItem, ClientInfo, MasterTemplateScopeFlags, PaymentMilestone, ContractTemplateKind, CompanyId } from '../../types';
import { formatSAR } from '../../utils/formatters';
import { CompanyLogo } from '../CompanyLogo';
import { getCompanyProfile, resolveCompanyId } from '../../data/companies';
import {
  MASTER_SCOPE_DEFINITIONS,
  DECOR_SCOPE_DEFINITIONS,
  getFormattedScopeDefinitions,
  EXCLUSION_CLAUSES,
  autoDetectScopeFlags,
  autoDetectExclusions,
  getPaymentMilestones,
  getDefaultMilestonesForType,
} from '../../data/masterTemplateDefaults';
import {
  CONTRACT_TEMPLATE_CATALOG,
  buildSmartContract,
  resolveActiveContractData,
} from '../../data/smartContractEngine';
import {
  X,
  Trash2,
  Printer,
  Save,
  FileText,
  User,
  Sliders,
  Calendar,
  Percent,
  Layers,
  Sparkles,
  CreditCard,
  Building2,
  MapPin,
  CheckCircle2,
  RotateCcw,
  Cloud,
  FileEdit,
  Download,
  PlusCircle,
  Scale,
  Plus,
  Edit3,
  Check,
  LayoutTemplate,
  FileSignature,
  RefreshCw,
} from 'lucide-react';
import { createAndShareGoogleDocQuotation } from '../../lib/googleDocsExport';
import { downloadWordDocument } from '../../lib/wordExport';
import { GoogleDocExportModal } from '../modals/GoogleDocExportModal';
import { EditPaymentMilestonesModal } from '../modals/EditPaymentMilestonesModal';

interface QuotationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: QuotationItem[];
  onRemoveItem: (id: string) => void;
  onUpdateItem?: (updatedItem: QuotationItem) => void;
  onClearItems: () => void;
  clientInfo: ClientInfo;
  onUpdateClientInfo: (info: Partial<ClientInfo>) => void;
  onPrint: () => void;
  onSaveQuote: () => void;
  onOpenAiAssistant?: () => void;
  onNewQuotation?: () => void;
  isSimplifiedMode?: boolean;
  onToggleSimplifiedMode?: () => void;
  onOpenContractEditor?: () => void;
  onSelectCompany?: (companyId: CompanyId) => void;
}

export const QuotationDrawer: React.FC<QuotationDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onRemoveItem,
  onUpdateItem,
  onClearItems,
  clientInfo,
  onUpdateClientInfo,
  onPrint,
  onSaveQuote,
  onOpenAiAssistant,
  onNewQuotation,
  isSimplifiedMode = false,
  onToggleSimplifiedMode,
  onOpenContractEditor,
  onSelectCompany,
}) => {
  const activeCompanyId = resolveCompanyId(clientInfo.companyId);
  const company = getCompanyProfile(activeCompanyId);
  const isArq = activeCompanyId === 'arq';
  const handleSwitchCompany = (nextId: CompanyId) => {
    if (onSelectCompany) {
      onSelectCompany(nextId);
    } else {
      onUpdateClientInfo({ companyId: nextId });
    }
  };
  const [activeTab, setActiveTab] = useState<'items' | 'project' | 'scope' | 'terms' | 'contract'>('items');

  // Item inline edit state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editDetails, setEditDetails] = useState<string[]>([]);
  const [newDetailInput, setNewDetailInput] = useState<string>('');
  const [supervisionNewBullet, setSupervisionNewBullet] = useState<string>('');

  // Supervision scope manual edit state
  const [showSupervisionScopeEditor, setShowSupervisionScopeEditor] = useState<boolean>(true);

  // Google Docs and Word export state
  const [isGoogleDocModalOpen, setIsGoogleDocModalOpen] = useState<boolean>(false);
  const [isExportingDoc, setIsExportingDoc] = useState<boolean>(false);
  const [docExportError, setDocExportError] = useState<string | null>(null);
  const [googleDocUrl, setGoogleDocUrl] = useState<string | null>(null);
  const [googleDocTitle, setGoogleDocTitle] = useState<string | null>(null);
  const [isEditMilestonesModalOpen, setIsEditMilestonesModalOpen] = useState<boolean>(false);

  const handleExportGoogleDoc = () => {
    setIsGoogleDocModalOpen(true);
  };

  const handleCloudExportGoogleDoc = async () => {
    setIsExportingDoc(true);
    setDocExportError(null);
    try {
      const result = await createAndShareGoogleDocQuotation(clientInfo, items);
      if (onSaveQuote) {
        onSaveQuote();
      }
      setGoogleDocUrl(result.url);
      setGoogleDocTitle(result.title);
      try {
        window.open(result.url, '_blank');
      } catch (e) {
        // Pop-up handled
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

  const activeContract = resolveActiveContractData(clientInfo, items);
  const isContractAttached = Boolean(clientInfo.contractData?.enabled);

  const handleToggleAttachContract = (enabled: boolean) => {
    const nextContract = clientInfo.contractData
      ? {
          ...activeContract,
          enabled,
          scopeGroups: activeContract.scopeGroups.map((g) => ({
            ...g,
            subtitle: g.subtitle || '',
          })),
        }
      : buildSmartContract(clientInfo, items, undefined, enabled);
    onUpdateClientInfo({ contractData: nextContract });
  };

  const handleQuickSelectContractTemplate = (kind: ContractTemplateKind) => {
    const regenerated = buildSmartContract(clientInfo, items, kind, true);
    onUpdateClientInfo({
      contractData: {
        ...regenerated,
        autoSynced: false,
        scopeGroups: regenerated.scopeGroups.map((g) => ({
          ...g,
          subtitle: g.subtitle || '',
        })),
      },
    });
  };

  const handleAutoSyncContract = () => {
    const regenerated = buildSmartContract(clientInfo, items, undefined, true);
    onUpdateClientInfo({
      contractData: {
        ...regenerated,
        autoSynced: true,
        scopeGroups: regenerated.scopeGroups.map((g) => ({
          ...g,
          subtitle: g.subtitle || '',
        })),
      },
    });
  };

  const handleDownloadWordFile = () => {
    if (onSaveQuote) {
      onSaveQuote();
    }
    downloadWordDocument(clientInfo, items, isContractAttached ? 'quote_and_contract' : 'quote_only');
  };

  if (!isOpen) return null;

  // Financial calculations
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

  const drawerMilestones = getPaymentMilestones(
    clientInfo.paymentScheduleType,
    grandTotal,
    clientInfo.customMilestones
  );
  const milestonesSum = drawerMilestones.reduce((acc, m) => acc + (Number(m.amount) || 0), 0);
  const milestonesDiff = grandTotal - milestonesSum;

  const handleDrawerMilestoneAmountChange = (index: number, newAmount: number) => {
    const updated = drawerMilestones.map((m, i) => {
      if (i === index) {
        const amt = Math.max(0, newAmount);
        const pct = grandTotal > 0 ? Math.round((amt / grandTotal) * 100) : m.percentage;
        let title = m.title;
        if (title.match(/\(\d+%\)/)) {
          title = title.replace(/\(\d+%\)/, `(${pct}%)`);
        }
        return { ...m, amount: amt, percentage: pct, title };
      }
      return m;
    });
    onUpdateClientInfo({
      customMilestones: updated,
      paymentScheduleType: 'custom',
    });
  };

  const handleDrawerMilestoneTitleChange = (index: number, newTitle: string) => {
    const updated = drawerMilestones.map((m, i) => (i === index ? { ...m, title: newTitle } : m));
    onUpdateClientInfo({
      customMilestones: updated,
      paymentScheduleType: 'custom',
    });
  };

  const handleDrawerMilestoneDescriptionChange = (index: number, newDesc: string) => {
    const updated = drawerMilestones.map((m, i) => (i === index ? { ...m, description: newDesc } : m));
    onUpdateClientInfo({
      customMilestones: updated,
      paymentScheduleType: 'custom',
    });
  };

  const handleDrawerAddMilestone = () => {
    const remaining = Math.max(0, milestonesDiff);
    const newIndex = drawerMilestones.length + 1;
    const pct = grandTotal > 0 ? Math.round((remaining / grandTotal) * 100) : 0;
    const arabicOrdinal =
      newIndex === 1
        ? 'الأولى'
        : newIndex === 2
        ? 'الثانية'
        : newIndex === 3
        ? 'الثالثة'
        : newIndex === 4
        ? 'الرابعة'
        : newIndex === 5
        ? 'الخامسة'
        : newIndex === 6
        ? 'السادسة'
        : `رقم (${newIndex})`;

    const newMilestone: PaymentMilestone = {
      id: `milestone-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: `الدفعة ${arabicOrdinal} (${pct}%)`,
      percentage: pct,
      amount: remaining,
      description: 'استحقاق مرحلي حسب تقدم أعمال المشروع والاعتمادات.',
    };
    onUpdateClientInfo({
      customMilestones: [...drawerMilestones, newMilestone],
      paymentScheduleType: 'custom',
    });
  };

  const handleDrawerDeleteMilestone = (index: number) => {
    if (drawerMilestones.length <= 1) return;
    const filtered = drawerMilestones.filter((_, i) => i !== index);
    onUpdateClientInfo({
      customMilestones: filtered,
      paymentScheduleType: 'custom',
    });
  };

  const handleDrawerAutoBalance = () => {
    if (drawerMilestones.length === 0) return;
    const copy = [...drawerMilestones];
    const lastIdx = copy.length - 1;
    const last = { ...copy[lastIdx] };
    const newAmount = Math.max(0, (Number(last.amount) || 0) + milestonesDiff);
    const newPct = grandTotal > 0 ? Math.round((newAmount / grandTotal) * 100) : last.percentage;
    last.amount = newAmount;
    last.percentage = newPct;
    if (last.title.match(/\(\d+%\)/)) {
      last.title = last.title.replace(/\(\d+%\)/, `(${newPct}%)`);
    }
    copy[lastIdx] = last;
    onUpdateClientInfo({
      customMilestones: copy,
      paymentScheduleType: 'custom',
    });
  };

  const handleDrawerResetPercentages = () => {
    const defaults = getDefaultMilestonesForType(clientInfo.paymentScheduleType || 'design_standard', grandTotal);
    onUpdateClientInfo({
      customMilestones: defaults,
    });
  };

  // Scope toggle handler
  const handleToggleScope = (key: keyof MasterTemplateScopeFlags) => {
    const current = clientInfo.scopeFlags || {};
    const isMergedComponentMod =
      clientInfo.serviceType?.includes('تعديل مكونات') ||
      items.some((i) => i.title.includes('تعديل مكونات'));

    if (key === 'modifyComponents' && isMergedComponentMod) {
      const nextVal = !(current.modifyComponents || current.buildingLicense);
      onUpdateClientInfo({
        scopeFlags: {
          ...current,
          modifyComponents: nextVal,
          buildingLicense: false,
        },
      });
      return;
    }

    if (key === 'supervision') {
      const nextSupervision = !current.supervision;
      onUpdateClientInfo({
        scopeFlags: {
          ...current,
          supervision: nextSupervision,
        },
        exclusions: {
          ...clientInfo.exclusions,
          excludeSupervision: !nextSupervision,
        },
      });
      return;
    }

    const currentVal =
      current[key] !== undefined
        ? !!current[key]
        : key.toString().startsWith('decor_')
        ? true
        : false;

    const updated = {
      ...current,
      [key]: !currentVal,
    };
    onUpdateClientInfo({
      scopeFlags: updated as MasterTemplateScopeFlags,
    });
  };

  // Specific delete and restore handlers for Decor scope items
  const handleDeleteDecorScope = (key: keyof MasterTemplateScopeFlags, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const current = clientInfo.scopeFlags || ({} as MasterTemplateScopeFlags);
    onUpdateClientInfo({
      scopeFlags: {
        ...current,
        [key]: false,
      },
    });
  };

  const handleRestoreDecorScope = (key: keyof MasterTemplateScopeFlags, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const current = clientInfo.scopeFlags || ({} as MasterTemplateScopeFlags);
    onUpdateClientInfo({
      scopeFlags: {
        ...current,
        [key]: true,
      },
    });
  };

  const handleSelectAllDecor = () => {
    const current = clientInfo.scopeFlags || ({} as MasterTemplateScopeFlags);
    const updated = { ...current };
    DECOR_SCOPE_DEFINITIONS.forEach((def) => {
      (updated as any)[def.id] = true;
    });
    onUpdateClientInfo({ scopeFlags: updated as MasterTemplateScopeFlags });
  };

  const handleDeselectAllDecor = () => {
    const current = clientInfo.scopeFlags || ({} as MasterTemplateScopeFlags);
    const updated = { ...current };
    DECOR_SCOPE_DEFINITIONS.forEach((def) => {
      (updated as any)[def.id] = false;
    });
    onUpdateClientInfo({ scopeFlags: updated as MasterTemplateScopeFlags });
  };

  // Auto-detect scope and exclusions from items
  const handleAutoDetect = () => {
    const detectedFlags = autoDetectScopeFlags(items);
    const detectedExclusions = autoDetectExclusions(items, detectedFlags);
    onUpdateClientInfo({
      scopeFlags: detectedFlags,
      exclusions: detectedExclusions,
    });
  };

  const handleStartEditItem = (item: QuotationItem) => {
    setEditingItemId(item.id);
    setEditTitle(item.title);
    setEditPrice(item.totalPrice);
    setEditDetails([...item.details]);
    setNewDetailInput('');
  };

  const handleSaveItemEdit = (item: QuotationItem) => {
    if (onUpdateItem) {
      onUpdateItem({
        ...item,
        title: editTitle.trim() || item.title,
        totalPrice: Number(editPrice) || item.totalPrice,
        basePrice: Number(editPrice) || item.basePrice,
        details: editDetails.filter((d) => d.trim()),
      });
    }
    setEditingItemId(null);
  };

  const handleCancelItemEdit = () => {
    setEditingItemId(null);
  };

  const handleAddDetailToItem = () => {
    if (!newDetailInput.trim()) return;
    setEditDetails((prev) => [...prev, newDetailInput.trim()]);
    setNewDetailInput('');
  };

  const handleRemoveDetailFromItem = (index: number) => {
    setEditDetails((prev) => prev.filter((_, idx) => idx !== index));
  };

  const defaultSupervisionBullets = [
    'إدارة ومتابعة الأعمال فنيًا ومطابقة التنفيذ للمخططات الإنشائية والمعمارية المعتمدة.',
    'استلام حديد التسليح والنجارة للقواعد والميد والأعمدة والأسقف وصب الخرسانة الجاهزة.',
    'توثيق الزيارات الميدانية ببطاقات استلام هندسية معتمدة ورفع التقارير عبر منصة بلدي.',
    'الإشراف على اختبارات الخرسانة وضبط الجودة والسلامة بموقع المشروع.',
  ];

  const currentSupervisionBullets =
    clientInfo.supervisionScopeCustomBullets && clientInfo.supervisionScopeCustomBullets.length > 0
      ? clientInfo.supervisionScopeCustomBullets
      : defaultSupervisionBullets;

  const handleAddSupervisionBullet = () => {
    if (!supervisionNewBullet.trim()) return;
    const updated = [...currentSupervisionBullets, supervisionNewBullet.trim()];
    onUpdateClientInfo({ supervisionScopeCustomBullets: updated });
    setSupervisionNewBullet('');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-stone-950/60 backdrop-blur-xs transition-opacity no-print">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-left duration-300">
        {/* Drawer Header */}
        <div className="bg-stone-900 text-white px-6 py-4 border-b border-stone-800 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`h-10 rounded-xl bg-white p-1.5 flex items-center justify-center shrink-0 border border-stone-700 ${
                  isArq ? 'w-14' : 'w-10'
                }`}
              >
                <CompanyLogo companyId={activeCompanyId} variant="icon" className="w-full h-full" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-black">عرض السعر والنموذج الموحد</h2>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                      isArq
                        ? 'bg-[#a6926b]/20 text-[#e8d9b8] border-[#a6926b]/40'
                        : 'bg-[#e37725]/20 text-[#e37725] border-[#e37725]/30'
                    }`}
                  >
                    {company.shortNameAr}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-stone-400 mt-0.5">
                  <span>رقم العرض: <strong className="text-stone-200 font-mono">{clientInfo.proposalNumber}</strong></span>
                  <span>•</span>
                  <span>{items.length} بنود مدرجة</span>
                  <span>•</span>
                  <span className="text-amber-400 font-bold bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md">
                    إعداد المهندس: {clientInfo.preparedBy || 'م.ماجد'}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center transition shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Segmented Company Switcher inside Drawer */}
          <div className="flex items-center justify-between gap-2 bg-stone-950/70 border border-stone-800 rounded-xl px-2.5 py-1.5">
            <span className="text-[11px] font-bold text-stone-400 whitespace-nowrap">
              الشركة المُصدرة للعرض والعقد:
            </span>
            <div className="inline-flex items-center bg-stone-900 border border-stone-700 rounded-lg p-0.5 gap-0.5">
              <button
                type="button"
                onClick={() => handleSwitchCompany('luminous')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-black transition whitespace-nowrap shrink-0 cursor-pointer ${
                  !isArq
                    ? 'bg-[#e37725] text-white shadow-xs'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800'
                }`}
              >
                الرؤية المضيئة
              </button>
              <button
                type="button"
                onClick={() => handleSwitchCompany('arq')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-black transition whitespace-nowrap shrink-0 cursor-pointer ${
                  isArq
                    ? 'bg-white text-stone-950 shadow-xs'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800'
                }`}
              >
                أرك (ARQ)
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-stone-100 border-b border-stone-200 px-4 py-2 flex items-center justify-between gap-1 text-xs font-bold overflow-x-auto">
          <div className="flex items-center gap-1.5 min-w-max">
            <button
              type="button"
              onClick={() => setActiveTab('items')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
                activeTab === 'items'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>بنود العرض ({items.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('project')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
                activeTab === 'project'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>بيانات المشروع (الموحد)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('scope')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
                activeTab === 'scope'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>النطاق الشرطي (IF)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('terms')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
                activeTab === 'terms'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>الشروط والدفعات والبنك</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('contract')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer ${
                activeTab === 'contract'
                  ? 'bg-[#3a3c3e] text-white shadow-xs'
                  : isContractAttached
                  ? 'bg-[#f3f0e8] text-stone-900 border border-[#a6926b]/60 hover:bg-[#ebe5d6]'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200'
              }`}
            >
              <FileSignature className="w-3.5 h-3.5 text-[#a6926b]" />
              <span>العقد الذكي</span>
              {isContractAttached && (
                <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-sm">
                  مرفق
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: ITEMS */}
          {activeTab === 'items' && (
            <div className="space-y-6">
              {/* Items List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black text-stone-800 flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-amber-500" />
                    <span>بنود عرض السعر المدرجة ({items.length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {onNewQuotation && (
                      <button
                        type="button"
                        onClick={onNewQuotation}
                        className="text-[10px] text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2 py-0.5 rounded-md font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                        title="تفريغ كافة البنود وتصفير بيانات المشروع فوراً وبدء عرض جديد"
                      >
                        <PlusCircle className="w-2.5 h-2.5 text-amber-700" />
                        <span>جديد فارغ</span>
                      </button>
                    )}
                    {items.length > 0 && (
                      <button
                        type="button"
                        onClick={onClearItems}
                        className="text-[11px] text-red-600 hover:text-red-700 font-bold transition flex items-center gap-1 cursor-pointer"
                        title="مسح قائمة البنود الحالية"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>تفريغ البنود</span>
                      </button>
                    )}
                  </div>
                </div>

                {items.length === 0 ? (
                  <div className="bg-stone-50 border-2 border-dashed border-stone-200 rounded-2xl p-8 text-center space-y-2">
                    <FileText className="w-8 h-8 text-stone-400 mx-auto" />
                    <div className="text-xs font-bold text-stone-700">لا توجد بنود مضافة حتى الآن</div>
                    <p className="text-[11px] text-stone-500 max-w-xs mx-auto">
                      اختر أحد الأقسام (التصميم، الديكور، المساحة، الدفاع المدني، التنفيذ) واضغط &quot;إضافة إلى عرض السعر&quot;.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map((item, index) => {
                      const isEditing = editingItemId === item.id;
                      if (isEditing) {
                        return (
                          <div
                            key={item.id}
                            className="bg-amber-50/70 p-4 rounded-xl border-2 border-amber-400 shadow-md space-y-3"
                          >
                            <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                              <div className="flex items-center gap-2">
                                <Edit3 className="w-4 h-4 text-amber-600" />
                                <span className="text-xs font-black text-amber-950">تعديل البند رقم ({index + 1})</span>
                              </div>
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                                {item.departmentName}
                              </span>
                            </div>

                            <div className="space-y-2.5">
                              <div>
                                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                                  مسمى البند في العرض:
                                </label>
                                <input
                                  type="text"
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-stone-900 focus:ring-2 focus:ring-amber-500 outline-hidden"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                                  السعر الإجمالي للبند (ر.س):
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={editPrice}
                                  onChange={(e) => setEditPrice(Number(e.target.value) || 0)}
                                  className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs font-black text-stone-900 focus:ring-2 focus:ring-amber-500 outline-hidden font-mono"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                                  التفاصيل والمهام المشمولة ({editDetails.length}):
                                </label>
                                <div className="space-y-1.5 max-h-48 overflow-y-auto p-1 bg-white rounded-lg border border-stone-200">
                                  {editDetails.map((detail, dIdx) => (
                                    <div key={dIdx} className="flex items-center gap-1.5 text-xs bg-stone-50 p-1.5 rounded border border-stone-200">
                                      <span className="text-amber-500 font-bold">•</span>
                                      <input
                                        type="text"
                                        value={detail}
                                        onChange={(e) => {
                                          const updated = [...editDetails];
                                          updated[dIdx] = e.target.value;
                                          setEditDetails(updated);
                                        }}
                                        className="flex-1 bg-transparent text-[11px] text-stone-800 outline-hidden"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveDetailFromItem(dIdx)}
                                        className="text-stone-400 hover:text-red-600 p-0.5 rounded transition cursor-pointer"
                                        title="حذف هذا التفصيل"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>

                                <div className="mt-2 flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={newDetailInput}
                                    onChange={(e) => setNewDetailInput(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddDetailToItem();
                                      }
                                    }}
                                    placeholder="إضافة تفصيل أو مهمة جديدة..."
                                    className="flex-1 bg-white border border-stone-300 rounded-lg px-2.5 py-1 text-xs focus:ring-2 focus:ring-amber-500 outline-hidden"
                                  />
                                  <button
                                    type="button"
                                    onClick={handleAddDetailToItem}
                                    className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 shadow-2xs cursor-pointer"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>إضافة</span>
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200">
                              <button
                                type="button"
                                onClick={handleCancelItemEdit}
                                className="px-3 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 text-xs font-bold transition cursor-pointer"
                              >
                                إلغاء
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveItemEdit(item)}
                                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>حفظ التعديل</span>
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={item.id}
                          className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-2 relative group hover:border-amber-300 transition"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-md bg-stone-100 text-stone-700 text-[10px] font-black flex items-center justify-center">
                                {index + 1}
                              </span>
                              <div>
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                  {item.departmentName}
                                </span>
                                <h4 className="text-xs font-black text-stone-900 mt-1">{item.title}</h4>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-stone-900 font-mono">
                                {formatSAR(item.totalPrice)}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleStartEditItem(item)}
                                className="text-stone-400 hover:text-amber-600 p-1.5 rounded hover:bg-amber-50 transition cursor-pointer"
                                title="تعديل هذا البند وسعره وتفاصيله"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onRemoveItem(item.id)}
                                className="text-stone-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition cursor-pointer"
                                title="حذف هذا البند"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Details bullet points */}
                          <div className="bg-stone-50 p-2.5 rounded-lg text-[11px] text-stone-600 space-y-1">
                            {item.details.map((d, i) => (
                              <div key={i} className="flex items-start gap-1.5">
                                <span className="text-amber-500 font-bold">•</span>
                                <span>{d}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Discounts & Tax Controls */}
              {items.length > 0 && (
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3">
                  <div className="text-xs font-black text-stone-800 flex items-center gap-2">
                    <Percent className="w-3.5 h-3.5 text-amber-500" />
                    <span>الخصومات والضريبة النظامية</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Discount Checkbox & Input */}
                    <div>
                      <label
                        className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition ${
                          (clientInfo.discountValue || 0) > 0
                            ? 'bg-emerald-500/10 border-emerald-500 text-stone-950 font-bold'
                            : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={(clientInfo.discountValue || 0) > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                onUpdateClientInfo({
                                  discountType: 'percentage',
                                  discountValue: 20,
                                  _userToggledDiscount: true,
                                } as any);
                              } else {
                                onUpdateClientInfo({
                                  discountValue: 0,
                                  _userToggledDiscount: true,
                                } as any);
                              }
                            }}
                            className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                          />
                          <div className="text-xs">
                            <span className="font-bold block text-stone-900">
                              خصم تجاري خاص ({clientInfo.discountType === 'percentage' ? `${clientInfo.discountValue || 20}%` : `${clientInfo.discountValue || 0} ر.س`})
                            </span>
                            <span className="text-[10px] text-emerald-700 block font-medium">
                              علامة الخصم معتمدة ومفعلة (20%)
                            </span>
                          </div>
                        </div>
                      </label>

                      {(clientInfo.discountValue || 0) > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="number"
                            min="0"
                            value={clientInfo.discountValue || ''}
                            onChange={(e) =>
                              onUpdateClientInfo({
                                discountValue: Number(e.target.value) || 0,
                                _userToggledDiscount: true,
                              } as any)
                            }
                            placeholder="20"
                            className="w-full bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-hidden"
                          />
                          <select
                            value={clientInfo.discountType}
                            onChange={(e) =>
                              onUpdateClientInfo({
                                discountType: e.target.value as 'percentage' | 'fixed',
                                _userToggledDiscount: true,
                              } as any)
                            }
                            className="bg-white border border-stone-300 rounded-xl px-2 py-1.5 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-hidden cursor-pointer"
                          >
                            <option value="percentage">% نسبة</option>
                            <option value="fixed">ريال</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Tax toggle */}
                    <div className="flex flex-col justify-end">
                      <label className="flex items-center gap-2 p-2.5 bg-white border border-stone-300 rounded-xl cursor-pointer">
                        <input
                          type="checkbox"
                          checked={clientInfo.includeTax}
                          onChange={(e) => onUpdateClientInfo({ includeTax: e.target.checked })}
                          className="w-4 h-4 accent-amber-600 rounded"
                        />
                        <div className="text-xs">
                          <span className="font-bold text-stone-900">
                            إضافة ضريبة القيمة المضافة (15%)
                          </span>
                          <span className="block text-[10px] text-stone-500">
                            لهيئة الزكاة والضريبة والجمارك
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PROJECT & CLIENT INFO (MASTER TEMPLATE SECTION 1) */}
          {activeTab === 'project' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-stone-800 text-[11px] leading-relaxed flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                <div>
                  <span className="font-black text-amber-900 block mb-0.5">أولًا: بيانات العرض والمشروع الموحدة</span>
                  هذه الحقول تملأ المتغيرات <strong>&#123;&#123;...&#125;&#125;</strong> في النموذج الموحد الرسمي ومقدمة العرض، وهي متزامنة ومتاحة للتعديل المباشر أيضاً في أعلى صفحة التسعير الرئيسية قبل اختيار نوع الخدمة.
                </div>
                {onOpenAiAssistant && (
                  <button
                    type="button"
                    onClick={onOpenAiAssistant}
                    className="shrink-0 bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>قراءة الصك (AI) 🤖</span>
                  </button>
                )}
              </div>

              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      رقم العرض (&#123;&#123;رقم_العرض&#125;&#125;):
                    </label>
                    <input
                      type="text"
                      value={clientInfo.proposalNumber}
                      onChange={(e) => onUpdateClientInfo({ proposalNumber: e.target.value })}
                      className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      التاريخ (&#123;&#123;التاريخ&#125;&#125;):
                    </label>
                    <input
                      type="date"
                      value={clientInfo.date}
                      onChange={(e) => onUpdateClientInfo({ date: e.target.value })}
                      className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      اسم العميل (&#123;&#123;اسم_العميل&#125;&#125;):
                    </label>
                    <input
                      type="text"
                      value={clientInfo.clientName}
                      onChange={(e) => onUpdateClientInfo({ clientName: e.target.value })}
                      placeholder="مثال: فهد بن عبد العزيز آل سعود"
                      className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      رقم الجوال / الهاتف:
                    </label>
                    <input
                      type="text"
                      value={clientInfo.phone}
                      onChange={(e) => onUpdateClientInfo({ phone: e.target.value })}
                      placeholder="05xxxxxxxx"
                      className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      نوع المبنى (&#123;&#123;نوع_المبنى&#125;&#125;):
                    </label>
                    <input
                      type="text"
                      value={clientInfo.buildingType}
                      onChange={(e) => {
                        const val = e.target.value;
                        onUpdateClientInfo({
                          buildingType: val,
                          projectTitle: val ? `مشروع ${val}` : '',
                        });
                      }}
                      placeholder="مثال: فيلا سكنية دورين وملحق"
                      className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-hidden"
                    />
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      {[
                        { label: 'فيلا سكنية خاصة', short: 'فيلا سكنية' },
                        { label: 'عمارة سكنية متعددة الأدوار', short: 'عمارة سكنية' },
                        { label: 'عمارة تجارية / إدارية', short: 'عمارة تجارية' },
                        { label: 'استراحة / شاليهات خاصة', short: 'استراحة' },
                        { label: 'فندق / منشأة ضيافة فندقية', short: 'فندق' },
                        { label: 'محطة وقود وخدمات سيارات', short: 'محطة وقود' },
                        { label: 'مصنع / منشأة صناعية', short: 'مصنع' },
                        { label: 'ورش ومستودعات تجارية / صناعية', short: 'ورش ومستودعات' },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() =>
                            onUpdateClientInfo({
                              buildingType: item.label,
                              projectTitle: `مشروع ${item.label}`,
                            })
                          }
                          className={`text-[9.5px] px-2 py-0.5 rounded-md font-bold transition border ${
                            clientInfo.buildingType === item.label
                              ? 'bg-amber-500 text-stone-950 border-amber-600 shadow-xs'
                              : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200'
                          }`}
                        >
                          {item.short}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      نوع الخدمة (&#123;&#123;نوع_الخدمة&#125;&#125;):
                    </label>
                    <input
                      type="text"
                      value={clientInfo.serviceType}
                      onChange={(e) => onUpdateClientInfo({ serviceType: e.target.value })}
                      placeholder="مثال: التصميم الهندسي وإصدار رخصة البناء"
                      className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      المدينة (&#123;&#123;المدينة&#125;&#125;):
                    </label>
                    <input
                      type="text"
                      value={clientInfo.projectCity}
                      onChange={(e) => onUpdateClientInfo({ projectCity: e.target.value })}
                      placeholder="الرياض"
                      className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      الحي (&#123;&#123;الحي&#125;&#125;):
                    </label>
                    <input
                      type="text"
                      value={clientInfo.district || ''}
                      onChange={(e) => onUpdateClientInfo({ district: e.target.value })}
                      placeholder=""
                      className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      رقم القطعة (&#123;&#123;رقم_القطعة&#125;&#125;):
                    </label>
                    <input
                      type="text"
                      value={clientInfo.plotNumber || ''}
                      onChange={(e) => onUpdateClientInfo({ plotNumber: e.target.value })}
                      placeholder=""
                      className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      رقم المخطط (&#123;&#123;رقم_المخطط&#125;&#125;):
                    </label>
                    <input
                      type="text"
                      value={clientInfo.planNumber || ''}
                      onChange={(e) => onUpdateClientInfo({ planNumber: e.target.value })}
                      placeholder=""
                      className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-hidden"
                    />
                  </div>

                  {items.some((i) => i.departmentId === 'decor') ? (
                    <div className="sm:col-span-2 bg-amber-50/80 p-3 rounded-xl border-2 border-amber-400">
                      <label className="block text-[11px] font-bold text-amber-950 mb-1 flex items-center justify-between">
                        <span>المساحة الطابقية المدخلة لأعمال الديكور (م²):</span>
                        <span className="text-[10px] font-black text-amber-900 bg-amber-200 px-2 py-0.5 rounded">
                          المساحة الطابقية الفعلية ✓
                        </span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={
                          clientInfo.floorArea !== undefined && clientInfo.floorArea !== null
                            ? (clientInfo.floorArea === 0 ? '' : clientInfo.floorArea)
                            : (clientInfo.landArea || '')
                        }
                        onChange={(e) => {
                          const raw = e.target.value;
                          const val = raw === '' ? 0 : Number(raw);
                          onUpdateClientInfo({
                            floorArea: val,
                          });
                        }}
                        placeholder="350"
                        className="w-full bg-white border border-amber-400 rounded-xl px-3 py-2 text-xs font-black text-amber-950 focus:ring-2 focus:ring-amber-500 outline-hidden"
                      />
                      <span className="text-[10px] text-amber-800 block mt-1 font-medium">
                        * تظهر مباشرة في العرض والطباعة بالمسمى المعتمد: «المساحة الطابقية: {clientInfo.floorArea || 350} م²»
                      </span>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-[11px] font-bold text-stone-600 mb-1">
                          مساحة الأرض (م²) (&#123;&#123;مساحة_الأرض&#125;&#125;):
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={clientInfo.landArea === 0 ? '' : (clientInfo.landArea || '')}
                          onChange={(e) => {
                            const raw = e.target.value;
                            const val = raw === '' ? 0 : Number(raw);
                            onUpdateClientInfo({
                              landArea: val,
                              buildingArea: Math.round(val * 1.68),
                            });
                          }}
                          placeholder="600"
                          className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-stone-600 mb-1">
                          مسطح البناء الإجمالي (م² تقديري):
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={clientInfo.buildingArea === 0 ? '' : (clientInfo.buildingArea || '')}
                          onChange={(e) => {
                            const raw = e.target.value;
                            const val = raw === '' ? 0 : Number(raw);
                            onUpdateClientInfo({ buildingArea: val });
                          }}
                          placeholder="750"
                          className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-hidden"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CONDITIONAL SCOPE (MASTER TEMPLATE SECTION 3) */}
          {activeTab === 'scope' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-amber-50 border border-amber-200 p-3 rounded-xl">
                <div>
                  <span className="font-black text-amber-900 text-xs block">
                    ثالثًا: نطاق أعمال الاستشاري — وحدات شرطية (&#123;&#123;IF:...&#125;&#125;)
                  </span>
                  <p className="text-[11px] text-stone-600">
                    البنود المفعلة أدناه هي التي ستظهر فقط في النموذج الموحد المطبوع.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAutoDetect}
                  className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-3 py-1.5 rounded-lg text-xs shadow-xs transition"
                  title="مزامنة ذكية وتحديد تلقائي بناءً على بنود التسعير"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>تحديد ذكي تلقائي</span>
                </button>
              </div>

              {/* قسم الديكور والتصميم الداخلي — يظهر حصراً وفقط عند وجود بنود ديكور في العرض */}
              {items.some((i) => i.departmentId === 'decor') && (
                <div className="space-y-3 bg-gradient-to-b from-amber-50/80 to-orange-50/30 p-4 rounded-2xl border-2 border-amber-300 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/80 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs text-stone-900">
                          مخرجات التصميم الداخلي الشرطية (قسم الديكور — 6 وحدات IF)
                        </span>
                        <span className="text-[10px] font-bold bg-amber-500 text-stone-950 px-2 py-0.5 rounded-full">
                          خيارات حذف وتعديل متاحة ✓
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-600 mt-0.5">
                        خاصة بقسم الديكور: يمكنك حذف أو استبعاد أو إعادة تفعيل أي بند من مخرجات الديكور حسب رغبتك:
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={handleSelectAllDecor}
                        className="text-[10.5px] font-bold bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 px-2.5 py-1 rounded-lg transition shadow-2xs cursor-pointer"
                      >
                        تحديد الكل (6)
                      </button>
                      <button
                        type="button"
                        onClick={handleDeselectAllDecor}
                        className="text-[10.5px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-lg transition shadow-2xs cursor-pointer"
                      >
                        حذف واستبعاد الكل
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {DECOR_SCOPE_DEFINITIONS.map((def, idx) => {
                      const isChecked =
                        clientInfo.scopeFlags?.[def.id] !== undefined
                          ? !!clientInfo.scopeFlags[def.id]
                          : true;

                      return (
                        <div
                          key={def.id}
                          className={`p-3 rounded-xl border transition flex items-start justify-between gap-3 ${
                            isChecked
                              ? 'bg-white border-amber-400 shadow-2xs ring-1 ring-amber-400/30'
                              : 'bg-stone-50/90 border-dashed border-stone-300 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <div
                            onClick={() => handleToggleScope(def.id)}
                            className="flex items-start gap-3 cursor-pointer flex-1"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleScope(def.id)}
                              className="w-4 h-4 accent-amber-600 rounded mt-0.5 cursor-pointer shrink-0"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-800 text-[10px] font-black flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                                <span
                                  className={`font-black text-xs ${
                                    isChecked ? 'text-stone-900' : 'text-stone-500 line-through'
                                  }`}
                                >
                                  {def.name}
                                </span>
                                <span className="text-[10px] font-mono text-amber-800 bg-amber-100/80 px-1.5 py-0.2 rounded border border-amber-200 font-bold">
                                  {def.tag}
                                </span>
                                <span
                                  className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full ${
                                    isChecked
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                                  }`}
                                >
                                  {isChecked ? 'مشمول بالعرض ✓' : 'محذوف من النطاق ✕'}
                                </span>
                              </div>
                              <p
                                className={`text-[11px] mt-1 leading-relaxed ${
                                  isChecked ? 'text-stone-600' : 'text-stone-400'
                                }`}
                              >
                                {def.description}
                              </p>
                            </div>
                          </div>

                          {/* زر الحذف أو الاستعادة المباشر */}
                          <div className="shrink-0 flex items-center pt-0.5">
                            {isChecked ? (
                              <button
                                type="button"
                                onClick={(e) => handleDeleteDecorScope(def.id, e)}
                                title="حذف هذا البند من النطاق الشرطي"
                                className="flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 hover:border-red-600 px-2.5 py-1 rounded-lg transition cursor-pointer shadow-2xs"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>حذف</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => handleRestoreDecorScope(def.id, e)}
                                title="إعادة تفعيل وإدراج هذا البند في النطاق الشرطي"
                                className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-white bg-emerald-50 hover:bg-emerald-600 border border-emerald-200 hover:border-emerald-600 px-2.5 py-1 rounded-lg transition cursor-pointer shadow-2xs"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>استعادة</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* النطاق الشرطي الهندسي العام (التصميم، الرخص، الإشراف) — يظهر عند وجود بنود هندسية أو إذا كانت السلة فارغة */}
              {(items.length === 0 || items.some((i) => i.departmentId !== 'decor')) && (
                <div className="space-y-2.5">
                  {getFormattedScopeDefinitions(clientInfo, items).map((def) => {
                  const isChecked =
                    def.id === 'modifyComponents' && def.name === 'رخصة تعديل مكونات بناء'
                      ? !!clientInfo.scopeFlags?.modifyComponents || !!clientInfo.scopeFlags?.buildingLicense
                      : !!clientInfo.scopeFlags?.[def.id];
                  return (
                    <div
                      key={def.id}
                      className={`p-3 rounded-xl border transition ${
                        isChecked
                          ? 'bg-amber-50/50 border-amber-400 shadow-2xs'
                          : 'bg-stone-50 border-stone-200 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div
                        onClick={() => handleToggleScope(def.id)}
                        className="flex items-start justify-between gap-3 cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleScope(def.id)}
                            className="w-4 h-4 accent-amber-600 rounded mt-0.5"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-xs text-stone-900">
                                {def.id === 'supervision' && clientInfo.supervisionScopeCustomTitle
                                  ? clientInfo.supervisionScopeCustomTitle
                                  : def.name}
                              </span>
                              <span className="text-[10px] font-mono text-stone-500 bg-white px-1.5 py-0.2 rounded border border-stone-300">
                                {def.tag}
                              </span>
                              {def.id === 'supervision' && (
                                <span className="text-[9.5px] font-bold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-full">
                                  تعديل يدوي متاح ✍️
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
                              {def.id === 'supervision' && clientInfo.supervisionScopeCustomDescription
                                ? clientInfo.supervisionScopeCustomDescription
                                : def.description}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Supervision Dedicated Scope Editor */}
                      {def.id === 'supervision' && isChecked && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="mt-3 pt-3 border-t border-amber-300 space-y-3 bg-white p-3.5 rounded-xl border border-amber-300 shadow-xs"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                              <span className="text-xs font-black text-amber-950">
                                تخصيص بنود ومسمى الإشراف الهندسي يدوياً
                              </span>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md">
                              صلاحية تعديل كاملة ✓
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-600">
                            يمكنك تعديل مسمى البند، أو تغيير نص المهام، أو إضافة وحذف بنود فرعية حسب رغبتك، وستظهر التعديلات مباشرة في عرض السعر المطبوع ووثائق العقد.
                          </p>

                          {/* Custom Title Input */}
                          <div>
                            <label className="block text-[11px] font-bold text-stone-700 mb-1">
                              مسمى بند الإشراف في العرض:
                            </label>
                            <input
                              type="text"
                              value={clientInfo.supervisionScopeCustomTitle ?? def.name}
                              onChange={(e) => onUpdateClientInfo({ supervisionScopeCustomTitle: e.target.value })}
                              placeholder="الإشراف الهندسي"
                              className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-stone-900 focus:ring-2 focus:ring-amber-500 outline-hidden"
                            />
                          </div>

                          {/* Quick Presets */}
                          <div>
                            <label className="block text-[10.5px] font-bold text-stone-600 mb-1.5">
                              نماذج وبنود جاهزة سريعة:
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  onUpdateClientInfo({
                                    supervisionScopeCustomTitle: 'الإشراف الهندسي المعتمد (منصة بلدي)',
                                    supervisionScopeCustomDescription: 'متابعة وإشراف هندسي مرحلي وفق متطلبات منصة بلدي والكود السعودي لإصدار شهادة الإشغال.',
                                    supervisionScopeCustomBullets: [
                                      'متابعة مراحل البناء الإلزامية وتأكيد الاستلامات ورفع التقارير المعتمدة عبر منصة بلدي.',
                                      'استلام أعمال الحفر والإحلال وصب خرسانة النظافة والقواعد والميد الإنشائية.',
                                      'استلام حديد ونجارة الأعمدة والأسقف ومطابقتها للمخططات المعتمدة وتصريح الصب.',
                                      'إصدار تقرير شهادة الإشغال وإنهاء الأعمال ورفع المخلفات وفق اشتراطات الكود السعودي.',
                                    ],
                                  });
                                }}
                                className="text-[10.5px] font-bold bg-amber-50 hover:bg-amber-100 text-stone-800 border border-amber-300 px-2 py-1 rounded-md transition cursor-pointer"
                              >
                                📋 نموذج بلدي المعتمد
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  onUpdateClientInfo({
                                    supervisionScopeCustomTitle: 'الإشراف الهندسي الشامل والمتابعة الميدانية',
                                    supervisionScopeCustomDescription: 'إشراف فني مستمر وزيارات ميدانية دورية لضمان جودة المواد ومطابقة التنفيذ للمخططات الإنشائية والمعمارية.',
                                    supervisionScopeCustomBullets: [
                                      'زيارات هندسية دورية منتظمة للموقع بواقع زيارات أسبوعية ومتابعة دقيقة للأعمال.',
                                      'استلام كافة عناصر الهيكل الإنشائي (عظم) واعتماد جودة المواد الموردة.',
                                      'مراجعة ومتابعة أعمال التأسيسات الكهروميكانيكية (السباكة والكهرباء والتكييف).',
                                      'إعداد تقارير فنية دورية مدعمة بالصور الفوتوغرافية وتوجيه الملاحظات للمقاول.',
                                    ],
                                  });
                                }}
                                className="text-[10.5px] font-bold bg-amber-50 hover:bg-amber-100 text-stone-800 border border-amber-300 px-2 py-1 rounded-md transition cursor-pointer"
                              >
                                🏗️ إشراف ميداني شامل
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  onUpdateClientInfo({
                                    supervisionScopeCustomTitle: 'إدارة ومراقبة جودة المشاريع الهندسية',
                                    supervisionScopeCustomDescription: 'إدارة فنية متقدمة وضبط الجودة والسلامة ومطابقة المواصفات والمقاييس المعتمدة.',
                                    supervisionScopeCustomBullets: [
                                      'إدارة فنية متكاملة للمشروع وضبط الجدول الزمني واعتماد العينات والمواد.',
                                      'فحص استلامات العزل المائي والحراري واختبارات الضغط للشبكات.',
                                      'التنسيق بين مقاولي الباطن والتحقق من التقيد بالمواصفات القياسية السعودية.',
                                      'استلام أعمال التشطيبات المتقدمة وإعداد القائمة الختامية بالملاحظات (Snag List).',
                                    ],
                                  });
                                }}
                                className="text-[10.5px] font-bold bg-amber-50 hover:bg-amber-100 text-stone-800 border border-amber-300 px-2 py-1 rounded-md transition cursor-pointer"
                              >
                                🎯 إدارة وضبط جودة
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  onUpdateClientInfo({
                                    supervisionScopeCustomTitle: undefined,
                                    supervisionScopeCustomDescription: undefined,
                                    supervisionScopeCustomBullets: undefined,
                                  });
                                }}
                                className="text-[10.5px] font-bold bg-stone-100 hover:bg-stone-200 text-stone-600 border border-stone-300 px-2 py-1 rounded-md transition cursor-pointer"
                              >
                                🔄 استعادة الافتراضي
                              </button>
                            </div>
                          </div>

                          {/* Bullets List & Editor */}
                          <div>
                            <label className="block text-[11px] font-bold text-stone-700 mb-1.5">
                              بنود ومهام الإشراف المدرجة ({currentSupervisionBullets.length}):
                            </label>
                            <div className="space-y-1.5 max-h-48 overflow-y-auto p-1 bg-stone-50 rounded-lg border border-stone-200">
                              {currentSupervisionBullets.map((bullet, bIdx) => (
                                <div key={bIdx} className="flex items-center gap-1.5 bg-white p-1.5 rounded border border-stone-200">
                                  <span className="text-amber-500 font-bold">•</span>
                                  <input
                                    type="text"
                                    value={bullet}
                                    onChange={(e) => {
                                      const next = [...currentSupervisionBullets];
                                      next[bIdx] = e.target.value;
                                      onUpdateClientInfo({ supervisionScopeCustomBullets: next });
                                    }}
                                    className="flex-1 bg-transparent text-[11px] text-stone-800 outline-hidden"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = currentSupervisionBullets.filter((_, idx) => idx !== bIdx);
                                      onUpdateClientInfo({ supervisionScopeCustomBullets: next });
                                    }}
                                    className="text-stone-400 hover:text-red-600 p-0.5 rounded transition cursor-pointer"
                                    title="حذف هذا البند"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>

                            {/* Add new bullet */}
                            <div className="mt-2 flex items-center gap-1.5">
                              <input
                                type="text"
                                value={supervisionNewBullet}
                                onChange={(e) => setSupervisionNewBullet(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddSupervisionBullet();
                                  }
                                }}
                                placeholder="إضافة بند أو مهمة إشراف جديدة..."
                                className="flex-1 bg-white border border-stone-300 rounded-lg px-2.5 py-1 text-xs focus:ring-2 focus:ring-amber-500 outline-hidden"
                              />
                              <button
                                type="button"
                                onClick={handleAddSupervisionBullet}
                                className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 shadow-2xs cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>إضافة</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

          {/* TAB 4: TERMS, EXCLUSIONS, MILESTONES, BANK */}
          {activeTab === 'terms' && (
            <div className="space-y-5 text-xs">
              {/* Duration and Revisions */}
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
                <span className="font-black text-stone-900 block text-xs">
                  خامسًا وسادسًا: مدة التنفيذ والاعتمادات والتعديلات
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      مدة تنفيذ الأعمال (يوم عمل):
                    </label>
                    <input
                      type="number"
                      value={clientInfo.executionDurationDays || 45}
                      onChange={(e) =>
                        onUpdateClientInfo({ executionDurationDays: Number(e.target.value) || 30 })
                      }
                      className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      صلاحية العرض (أيام):
                    </label>
                    <input
                      type="number"
                      value={clientInfo.validityDays || 30}
                      onChange={(e) =>
                        onUpdateClientInfo({ validityDays: Number(e.target.value) || 30 })
                      }
                      className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-hidden"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      تاريخ بدء المدة (&#123;&#123;بداية_المدة&#125;&#125;):
                    </label>
                    <input
                      type="text"
                      value={clientInfo.startDateNotice}
                      onChange={(e) => onUpdateClientInfo({ startDateNotice: e.target.value })}
                      className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-hidden"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      عدد التعديلات المشمولة (&#123;&#123;عدد_التعديلات&#125;&#125;):
                    </label>
                    <input
                      type="text"
                      value={clientInfo.revisionCountText}
                      onChange={(e) => onUpdateClientInfo({ revisionCountText: e.target.value })}
                      className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Exclusions */}
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
                <span className="font-black text-stone-900 block text-xs">
                  سابعًا: الأعمال غير المشمولة — تظهر حسب الحالة
                </span>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-stone-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!clientInfo.exclusions?.excludeGovFees}
                      onChange={(e) => {
                        const updated = {
                          ...clientInfo.exclusions,
                          excludeGovFees: e.target.checked,
                        };
                        onUpdateClientInfo({ exclusions: updated });
                      }}
                      className="w-4 h-4 accent-amber-600 rounded"
                    />
                    <div className="flex-1">
                      <span className="text-[11px] font-bold text-stone-800 block">
                        &#123;&#123;IF:رسوم_حكومية_غير_مشمولة&#125;&#125;
                      </span>
                      <span className="text-[11px] text-stone-700">
                        {EXCLUSION_CLAUSES.excludeGovFees}
                      </span>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1 flex items-center justify-between">
                    <span>استثناءات إضافية (&#123;&#123;استثناءات_إضافية&#125;&#125;):</span>
                    <span className="text-[10px] text-stone-400">تظهر كنقاط تحت بند سابعًا</span>
                  </label>
                  <textarea
                    rows={2}
                    value={clientInfo.exclusions?.customExclusions || ''}
                    onChange={(e) => {
                      const updated = {
                        ...clientInfo.exclusions,
                        customExclusions: e.target.value,
                      };
                      onUpdateClientInfo({ exclusions: updated });
                    }}
                    placeholder="أي استثناءات أو شروط إضافية غير مشمولة ضمن نطاق المشروع..."
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Payment Schedule Model & Editable Milestones */}
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-stone-900 block text-xs">
                    عاشرًا: نموذج وجدول الدفعات المالية
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditMilestonesModalOpen(true)}
                    className="text-[10.5px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition shadow-2xs active:scale-95"
                    title="فتح نافذة التعديل الموسع للدفعات"
                  >
                    <FileEdit className="w-3 h-3 text-amber-700" />
                    <span>تعديل موسع للدفعات</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const defaults = getDefaultMilestonesForType('design_standard', grandTotal);
                      onUpdateClientInfo({
                        paymentScheduleType: 'design_standard',
                        customMilestones: defaults,
                      });
                    }}
                    className={`p-2 rounded-xl border text-right transition cursor-pointer ${
                      clientInfo.paymentScheduleType === 'design_standard'
                        ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    <div className="font-black text-xs">رخص وتصميم</div>
                    <div className="text-[10px] opacity-80 font-mono">40% - 40% - 20%</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const defaults = getDefaultMilestonesForType('supervision_stages', grandTotal);
                      onUpdateClientInfo({
                        paymentScheduleType: 'supervision_stages',
                        customMilestones: defaults,
                      });
                    }}
                    className={`p-2 rounded-xl border text-right transition cursor-pointer ${
                      clientInfo.paymentScheduleType === 'supervision_stages'
                        ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    <div className="font-black text-xs">إشراف هندسي</div>
                    <div className="text-[10px] opacity-80 font-mono">30% - 35% - 35%</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const defaults = getDefaultMilestonesForType('study_split', grandTotal);
                      onUpdateClientInfo({
                        paymentScheduleType: 'study_split',
                        customMilestones: defaults,
                      });
                    }}
                    className={`p-2 rounded-xl border text-right transition cursor-pointer ${
                      clientInfo.paymentScheduleType === 'study_split'
                        ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    <div className="font-black text-xs">دراسات ومسح</div>
                    <div className="text-[10px] opacity-80 font-mono">50% - 50%</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateClientInfo({ paymentScheduleType: 'custom' })}
                    className={`p-2 rounded-xl border text-right transition cursor-pointer ${
                      clientInfo.paymentScheduleType === 'custom'
                        ? 'bg-amber-500 text-stone-950 border-amber-600 font-black shadow-xs'
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    <div className="font-black text-xs">تخصيص يدوي</div>
                    <div className="text-[10px] opacity-80 font-bold">مبالغ حرة</div>
                  </button>
                </div>

                {/* Direct Inline Payment Amounts & Reasons Editor */}
                <div className="space-y-3 pt-2 border-t border-stone-200">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-stone-700">
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                      <span>دفعات العرض ({drawerMilestones.length} دفعات):</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleDrawerAddMilestone}
                        className="bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-black px-2.5 py-1 rounded-lg flex items-center gap-1 text-[10.5px] cursor-pointer transition shadow-2xs"
                        title="إضافة دفعة مالية جديدة"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>+ إضافة دفعة</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDrawerResetPercentages}
                        className="text-[10px] text-stone-500 hover:text-stone-800 bg-stone-100 border border-stone-200 px-2 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition"
                        title="إعادة توزيع النسب وفق النموذج المختار"
                      >
                        <RotateCcw className="w-2.5 h-2.5 text-stone-500" />
                        <span>إعادة الضبط</span>
                      </button>
                    </div>
                  </div>

                  {/* Milestones List */}
                  <div className="space-y-2.5">
                    {drawerMilestones.map((m, index) => {
                      const pct = grandTotal > 0 ? Math.round((m.amount / grandTotal) * 100) : m.percentage;
                      return (
                        <div
                          key={m.id || index}
                          className="bg-white p-3 rounded-xl border border-stone-200 hover:border-amber-400/80 space-y-2 text-xs shadow-2xs transition"
                        >
                          {/* Row 1: Sequence, Title, Amount, Percentage, Delete */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="w-6 h-6 rounded-md bg-stone-900 text-amber-400 font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                                {index + 1}
                              </span>
                              <input
                                type="text"
                                value={m.title}
                                onChange={(e) => handleDrawerMilestoneTitleChange(index, e.target.value)}
                                placeholder="مسمى الدفعة"
                                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1 text-xs font-bold text-stone-900 focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden"
                                title="تعديل مسمى الدفعة"
                              />
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <div className="flex items-center gap-1 bg-amber-50/70 border border-amber-300 rounded-lg px-2 py-0.5">
                                <label className="text-[10px] font-black text-amber-900">المبلغ:</label>
                                <input
                                  type="number"
                                  min="0"
                                  step="10"
                                  value={m.amount === 0 ? '' : m.amount}
                                  onChange={(e) =>
                                    handleDrawerMilestoneAmountChange(index, Number(e.target.value) || 0)
                                  }
                                  placeholder="0"
                                  className="w-20 text-left font-mono font-black text-xs text-stone-900 bg-white border border-stone-200 rounded px-1.5 py-0.5 focus:border-amber-500 outline-none"
                                />
                                <span className="text-[10px] font-bold text-amber-900">ر.س</span>
                              </div>

                              <span
                                className="font-mono text-[10.5px] font-bold bg-stone-100 text-stone-700 px-2 py-1 rounded-md border border-stone-200 min-w-[36px] text-center"
                                title="نسبة الدفعة من الإجمالي"
                              >
                                {pct}%
                              </span>

                              {drawerMilestones.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleDrawerDeleteMilestone(index)}
                                  className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                  title="إنقاص / حذف هذه الدفعة"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Row 2: Reason / Description (سبب واستحقاق الدفعة) */}
                          <div className="flex items-center gap-1.5 pt-1 border-t border-stone-100">
                            <span className="text-[10px] font-bold text-amber-900 shrink-0">سبب الدفعة:</span>
                            <input
                              type="text"
                              value={m.description || ''}
                              onChange={(e) => handleDrawerMilestoneDescriptionChange(index, e.target.value)}
                              placeholder="سبب واستحقاق الدفعة (مثال: عند توقيع العقد، أو عند اعتماد المخططات المعمارية...)"
                              className="w-full bg-stone-50 hover:bg-white border border-stone-200 rounded-md px-2 py-1 text-[11px] font-medium text-stone-700 focus:bg-white focus:border-amber-500 outline-none transition"
                              title="تعديل سبب واستحقاق هذه الدفعة"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Balancing bar */}
                  <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-stone-500">المجموع:</span>
                      <strong className={`font-mono font-black ${Math.abs(milestonesDiff) === 0 ? 'text-emerald-700' : 'text-amber-800'}`}>
                        {formatSAR(milestonesSum)}
                      </strong>
                      <span className="text-stone-400">/</span>
                      <span className="text-stone-500">الإجمالي:</span>
                      <strong className="font-mono font-black text-stone-800">
                        {formatSAR(grandTotal)}
                      </strong>
                    </div>

                    {Math.abs(milestonesDiff) !== 0 && (
                      <button
                        type="button"
                        onClick={handleDrawerAutoBalance}
                        className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold px-2 py-0.5 rounded-md flex items-center gap-1 text-[10px] cursor-pointer transition active:scale-95"
                      >
                        <Scale className="w-3 h-3 text-amber-700" />
                        <span>موازنة الفارق ({formatSAR(Math.abs(milestonesDiff))}) بالدفعة الأخيرة</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
                <span className="font-black text-stone-900 block text-xs">
                  البيانات البنكية الرسمية للتحويل
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      اسم البنك:
                    </label>
                    <input
                      type="text"
                      value={clientInfo.bankDetails?.bankName || ''}
                      onChange={(e) => {
                        const updated = {
                          ...clientInfo.bankDetails,
                          bankName: e.target.value,
                        };
                        onUpdateClientInfo({ bankDetails: updated });
                      }}
                      className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      اسم الحساب:
                    </label>
                    <input
                      type="text"
                      value={clientInfo.bankDetails?.accountName || ''}
                      onChange={(e) => {
                        const updated = {
                          ...clientInfo.bankDetails,
                          accountName: e.target.value,
                        };
                        onUpdateClientInfo({ bankDetails: updated });
                      }}
                      className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-hidden"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">
                      رقم الآيبان الدولي (IBAN):
                    </label>
                    <input
                      type="text"
                      value={clientInfo.bankDetails?.iban || ''}
                      onChange={(e) => {
                        const updated = {
                          ...clientInfo.bankDetails,
                          iban: e.target.value,
                        };
                        onUpdateClientInfo({ bankDetails: updated });
                      }}
                      className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 outline-hidden"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SMART CONTRACT ATTACHMENT & TEMPLATE SELECTOR */}
          {activeTab === 'contract' && (
            <div className="space-y-4">
              {/* Main Enable/Disable Switch Card */}
              <div
                className={`p-4 rounded-2xl border-2 transition ${
                  isContractAttached
                    ? 'bg-[#f3f0e8] border-[#a6926b]'
                    : 'bg-stone-50 border-stone-200'
                }`}
              >
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isContractAttached}
                    onChange={(e) => handleToggleAttachContract(e.target.checked)}
                    className="w-5 h-5 mt-0.5 accent-[#a6926b] rounded cursor-pointer"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-black text-stone-900">
                        إرفاق العقد الذكي مع عرض السعر تلقائياً
                      </span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded ${
                          isContractAttached
                            ? 'bg-emerald-600 text-white'
                            : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        {isContractAttached ? 'مفعّل ومرفق' : 'عرض سعر فقط'}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-600 leading-relaxed">
                      عند التفعيل، يتم توليد عقد هندسي متكامل يتكيّف تلقائياً مع القسم والخدمات المختارة (تصميم ورخصة، إشراف عظم، ديكور، مساحة، دفاع مدني، تنفيذ، أو عقد شامل) مع مزامنة كاملة للأسعار والدفعات وبيانات العميل، ويُطبع مباشرة خلف عرض السعر أو في ملف Word موحد.
                    </p>
                  </div>
                </label>
              </div>

              {/* Active Contract Summary & Full Editor Launch */}
              <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-3 shadow-2xs">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-bold text-[#a6926b] uppercase">
                      النموذج النشط حالياً
                    </div>
                    <h4 className="text-sm font-black text-stone-900 mt-0.5">
                      {activeContract.contractTitle}
                    </h4>
                    <div className="text-[11px] text-stone-500 mt-0.5">
                      {activeContract.scopeGroups.length} أقسام نطاق عمل •{' '}
                      {activeContract.ownerObligations.length} التزامات للمالك •{' '}
                      {activeContract.generalTerms.length} شروط عامة
                      {activeContract.showSupervisionStages &&
                        ` • ${activeContract.supervisionStages.length} مرحلة استلام ميداني`}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoSyncContract}
                    className="inline-flex items-center gap-1 text-[11px] font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 px-2.5 py-1.5 rounded-lg transition cursor-pointer shrink-0"
                    title="إعادة التوليد الذكي وفق بنود السلة الحالية"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>توليد ذكي</span>
                  </button>
                </div>

                {onOpenContractEditor && (
                  <button
                    type="button"
                    onClick={onOpenContractEditor}
                    className="w-full bg-[#3a3c3e] hover:bg-stone-800 text-white font-black py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                  >
                    <FileSignature className="w-4 h-4 text-[#d4c3a3]" />
                    <span>فتح محرر العقد الكامل (تعديل كافة البنود والأطراف والمراحل)</span>
                  </button>
                )}
              </div>

              {/* Quick Template Switcher for All 9 Smart Templates */}
              <div className="space-y-2">
                <div className="text-xs font-black text-stone-800">
                  اختيار نموذج العقد المناسب للقسم / الخدمة:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CONTRACT_TEMPLATE_CATALOG.map((tpl) => {
                    const isSelected = activeContract.templateKind === tpl.id;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => handleQuickSelectContractTemplate(tpl.id)}
                        className={`text-right p-2.5 rounded-xl border transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#f3f0e8] border-[#a6926b] ring-1 ring-[#a6926b]'
                            : 'bg-white border-stone-200 hover:border-stone-400'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-black text-stone-900">
                            {tpl.shortLabel}
                          </span>
                          {isSelected && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#a6926b] shrink-0" />
                          )}
                        </div>
                        <p className="text-[10px] text-stone-500 mt-0.5 line-clamp-2">
                          {tpl.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer / Financial Summary */}
        <div className="bg-stone-900 text-stone-100 p-5 border-t border-stone-800 space-y-4">
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center text-stone-400">
              <span>المجموع قبل الخصم:</span>
              <span className="font-bold text-white">{formatSAR(subtotal)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between items-center text-red-400">
                <span>قيمة الخصم الممنوح:</span>
                <span className="font-bold">- {formatSAR(discountAmount)}</span>
              </div>
            )}

            {clientInfo.includeTax && (
              <div className="flex justify-between items-center text-stone-400">
                <span>ضريبة القيمة المضافة (15%):</span>
                <span className="font-bold text-white">{formatSAR(taxAmount)}</span>
              </div>
            )}

            <div className="pt-2 border-t border-stone-800 flex justify-between items-baseline">
              <span className="text-sm font-bold text-stone-200">الإجمالي النهائي:</span>
              <span className="text-2xl font-black text-amber-400">
                {formatSAR(grandTotal)}
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            {onToggleSimplifiedMode && (
              <div className="bg-stone-800/90 p-1 rounded-xl border border-stone-700/80 grid grid-cols-2 gap-1 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => {
                    if (isSimplifiedMode) onToggleSimplifiedMode();
                  }}
                  className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    !isSimplifiedMode
                      ? 'bg-amber-500 text-stone-950 font-black shadow-xs'
                      : 'text-stone-300 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span>النموذج الموحد</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!isSimplifiedMode) onToggleSimplifiedMode();
                  }}
                  className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    isSimplifiedMode
                      ? 'bg-[#2C3E4C] text-white border border-[#F0A429] font-black shadow-xs'
                      : 'text-stone-300 hover:text-white'
                  }`}
                >
                  <LayoutTemplate className="w-3.5 h-3.5 text-[#F0A429] shrink-0" />
                  <span>برنامج الاصالة المبسط</span>
                </button>
              </div>
            )}

            {/* Smart Contract Quick Attach Toggle Bar */}
            <div
              className={`rounded-xl border px-3 py-2 flex items-center justify-between gap-2 transition ${
                isContractAttached
                  ? 'bg-[#a6926b]/20 border-[#a6926b]/60'
                  : 'bg-stone-800/70 border-stone-700/80'
              }`}
            >
              <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                <input
                  type="checkbox"
                  checked={isContractAttached}
                  onChange={(e) => handleToggleAttachContract(e.target.checked)}
                  className="w-4 h-4 accent-[#a6926b] rounded cursor-pointer shrink-0"
                />
                <div className="min-w-0">
                  <div className="text-[11px] font-black text-white flex items-center gap-1.5">
                    <FileSignature className="w-3.5 h-3.5 text-[#d4c3a3] shrink-0" />
                    <span className="truncate">إرفاق العقد الذكي مع عرض السعر</span>
                  </div>
                  <div className="text-[10px] text-stone-300 truncate">
                    {activeContract.contractTitle}
                  </div>
                </div>
              </label>

              {onOpenContractEditor && (
                <button
                  type="button"
                  onClick={onOpenContractEditor}
                  className="shrink-0 bg-stone-950/70 hover:bg-stone-950 text-[#e6d7b9] border border-[#a6926b]/40 px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition cursor-pointer"
                >
                  تعديل العقد
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onPrint}
              disabled={items.length === 0}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 active:scale-[0.98] text-stone-950 font-black py-3 px-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-stone-950 flex-shrink-0" />
              <span>
                {isSimplifiedMode
                  ? isContractAttached
                    ? 'معاينة وطباعة عرض الاصالة + العقد الذكي'
                    : 'معاينة وطباعة برنامج الاصالة المبسط'
                  : isContractAttached
                  ? 'معاينة وطباعة عرض السعر + العقد الذكي'
                  : 'معاينة وطباعة النموذج الموحد'}
              </span>
              <span className="bg-stone-950/15 text-stone-900 border border-stone-950/20 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 mr-1">
                <Cloud className="w-3 h-3 text-stone-950" />
                حفظ سحابي تلقائي
              </span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleExportGoogleDoc}
                disabled={items.length === 0}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold py-2.5 px-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition"
                title="إنشاء وفتح مستند جوجل قابل للتعديل فورياً للجميع"
              >
                <FileEdit className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className="truncate">مستند Google Docs</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadWordFile}
                disabled={items.length === 0}
                className="bg-blue-900/50 hover:bg-blue-800/70 border border-blue-400/30 disabled:opacity-50 text-blue-200 font-bold py-2.5 px-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                title="تحميل كملف Word (.docx)"
              >
                <Download className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="truncate">ملف Word (.docx)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onSaveQuote}
              disabled={items.length === 0}
              className="w-full bg-stone-800/80 hover:bg-stone-800 disabled:opacity-50 text-stone-300 hover:text-white font-medium py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-2 transition"
            >
              <Save className="w-3.5 h-3.5 text-amber-400" />
              <span>حفظ بالأرشيف السحابي فقط (بدون معاينة)</span>
            </button>
          </div>
        </div>
      </div>

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
        isOpen={isEditMilestonesModalOpen}
        onClose={() => setIsEditMilestonesModalOpen(false)}
        clientInfo={clientInfo}
        grandTotal={grandTotal}
        onSaveMilestones={(newMilestones, newType) => {
          onUpdateClientInfo({
            customMilestones: newMilestones,
            paymentScheduleType: newType,
          });
        }}
      />
    </div>
  );
};
