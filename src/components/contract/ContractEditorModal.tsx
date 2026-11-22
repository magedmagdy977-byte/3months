import React, { useState, useEffect } from 'react';
import {
  ClientInfo,
  ContractData,
  ContractScopeSubgroup,
  ContractTemplateKind,
  ContractTimelineRow,
  QuotationItem,
} from '../../types';
import {
  CONTRACT_TEMPLATE_CATALOG,
  buildSmartContract,
  getArabicDayName,
  resolveActiveContractData,
} from '../../data/smartContractEngine';
import { formatSAR } from '../../utils/formatters';
import { getPaymentMilestones } from '../../data/masterTemplateDefaults';
import {
  X,
  FileSignature,
  RefreshCw,
  Plus,
  Trash2,
  Check,
  Printer,
  Layers,
  Users,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  ClipboardList,
} from 'lucide-react';

interface ContractEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientInfo: ClientInfo;
  items: QuotationItem[];
  onSaveContract: (contractData: ContractData) => void;
  onSaveAndPreview?: (contractData: ContractData) => void;
  onOpenEditMilestones?: () => void;
}

type EditorTab = 'parties' | 'scope' | 'terms' | 'financial';

export const ContractEditorModal: React.FC<ContractEditorModalProps> = ({
  isOpen,
  onClose,
  clientInfo,
  items,
  onSaveContract,
  onSaveAndPreview,
  onOpenEditMilestones,
}) => {
  const [activeTab, setActiveTab] = useState<EditorTab>('parties');
  const [draft, setDraft] = useState<ContractData>(() =>
    resolveActiveContractData(clientInfo, items)
  );
  const [newObligation, setNewObligation] = useState('');
  const [newTerm, setNewTerm] = useState('');
  const [newIpRight, setNewIpRight] = useState('');
  const [newSupervisionStage, setNewSupervisionStage] = useState('');
  const [newTimelineNote, setNewTimelineNote] = useState('');
  const [newScopeItemByGroup, setNewScopeItemByGroup] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setDraft(resolveActiveContractData(clientInfo, items));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Live financial preview
  const subtotal = items.reduce((acc, i) => acc + i.totalPrice, 0);
  let discountAmount = 0;
  if (clientInfo.discountType === 'percentage') {
    discountAmount = Math.round((subtotal * (clientInfo.discountValue || 0)) / 100);
  } else {
    discountAmount = clientInfo.discountValue || 0;
  }
  discountAmount = Math.min(discountAmount, subtotal);
  const amountAfterDiscount = Math.max(0, subtotal - discountAmount);
  const taxAmount = clientInfo.includeTax ? Math.round(amountAfterDiscount * 0.15) : 0;
  const grandTotal = amountAfterDiscount + taxAmount;
  const milestones = getPaymentMilestones(
    clientInfo.paymentScheduleType,
    grandTotal,
    clientInfo.customMilestones
  );

  const updateDraft = (patch: Partial<ContractData>) => {
    setDraft((prev) => ({
      ...prev,
      ...patch,
      autoSynced: false,
    }));
  };

  const handleSelectTemplate = (kind: ContractTemplateKind) => {
    const regenerated = buildSmartContract(clientInfo, items, kind, draft.enabled);
    setDraft({
      ...regenerated,
      firstPartyName: draft.firstPartyName || regenerated.firstPartyName,
      firstPartyId: draft.firstPartyId || regenerated.firstPartyId,
      firstPartyPhone: draft.firstPartyPhone || regenerated.firstPartyPhone,
      firstPartyEmail: draft.firstPartyEmail || regenerated.firstPartyEmail,
      firstPartyAddress: draft.firstPartyAddress || regenerated.firstPartyAddress,
      autoSynced: false,
    });
  };

  const handleResetSmartAuto = () => {
    const fresh = buildSmartContract(clientInfo, items, undefined, draft.enabled);
    setDraft(fresh);
  };

  // Scope subgroup helpers
  const handleAddScopeGroup = () => {
    const newGroup: ContractScopeSubgroup = {
      id: `scope-${Date.now()}`,
      title: 'بند نطاق عمل جديد :',
      subtitle: '',
      items: ['تفاصيل العمل المتفق عليه...'],
      layout: 'list',
    };
    updateDraft({ scopeGroups: [...draft.scopeGroups, newGroup] });
  };

  const handleUpdateScopeGroup = (
    groupIdx: number,
    patch: Partial<ContractScopeSubgroup>
  ) => {
    const updated = draft.scopeGroups.map((g, idx) =>
      idx === groupIdx ? { ...g, ...patch } : g
    );
    updateDraft({ scopeGroups: updated });
  };

  const handleDeleteScopeGroup = (groupIdx: number) => {
    updateDraft({
      scopeGroups: draft.scopeGroups.filter((_, idx) => idx !== groupIdx),
    });
  };

  const handleAddScopeGroupItem = (groupIdx: number, groupId: string) => {
    const val = (newScopeItemByGroup[groupId] || '').trim();
    if (!val) return;
    const updated = draft.scopeGroups.map((g, idx) =>
      idx === groupIdx ? { ...g, items: [...g.items, val] } : g
    );
    updateDraft({ scopeGroups: updated });
    setNewScopeItemByGroup((prev) => ({ ...prev, [groupId]: '' }));
  };

  const handleUpdateScopeGroupItem = (
    groupIdx: number,
    itemIdx: number,
    value: string
  ) => {
    const updated = draft.scopeGroups.map((g, idx) => {
      if (idx !== groupIdx) return g;
      const itemsCopy = [...g.items];
      itemsCopy[itemIdx] = value;
      return { ...g, items: itemsCopy };
    });
    updateDraft({ scopeGroups: updated });
  };

  const handleDeleteScopeGroupItem = (groupIdx: number, itemIdx: number) => {
    const updated = draft.scopeGroups.map((g, idx) => {
      if (idx !== groupIdx) return g;
      return { ...g, items: g.items.filter((_, i) => i !== itemIdx) };
    });
    updateDraft({ scopeGroups: updated });
  };

  // Timeline row helpers
  const handleAddTimelineRow = () => {
    const nextNum = draft.timelineRows.length + 1;
    const ordinals = ['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة'];
    const row: ContractTimelineRow = {
      id: `t-${Date.now()}`,
      stage: ordinals[nextNum - 1] || `${nextNum}`,
      workTitle: 'مرحلة عمل إضافية',
      details: 'وصف تفصيلي لمخرجات المرحلة',
      duration: '15 يوم عمل',
    };
    updateDraft({ timelineRows: [...draft.timelineRows, row] });
  };

  const handleSave = (andPreview: boolean) => {
    const cleaned: ContractData = {
      ...draft,
      ownerObligations: draft.ownerObligations.filter((o) => o.trim().length > 0),
      generalTerms: draft.generalTerms.filter((t) => t.trim().length > 0),
      ipRights: draft.ipRights.filter((r) => r.trim().length > 0),
      supervisionStages: draft.supervisionStages.filter((s) => s.trim().length > 0),
      timelineNotes: draft.timelineNotes.filter((n) => n.trim().length > 0),
    };
    onSaveContract(cleaned);
    if (andPreview && onSaveAndPreview) {
      onSaveAndPreview(cleaned);
    } else {
      onClose();
    }
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 no-print"
    >
      <div className="bg-white w-full max-w-5xl max-h-[92vh] rounded-2xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden">
        {/* Top Modal Header */}
        <div className="bg-stone-900 text-white px-5 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#a6926b]/20 border border-[#a6926b]/50 text-[#e8d5b0] flex items-center justify-center shrink-0">
              <FileSignature className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                محرر العقد الذكي الموحد
              </h2>
              <div className="text-xs text-stone-400 flex items-center gap-2 mt-0.5">
                <span>يتكيف تلقائياً مع جميع أقسام وخدمات البرنامج</span>
                <span aria-hidden="true">·</span>
                <span className="text-amber-300 font-bold">
                  {draft.autoSynced ? 'مُزامن تلقائياً مع العرض' : 'تعديل مخصص محفوظ'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Enable / Attach Contract Toggle */}
            <label
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition ${
                draft.enabled
                  ? 'bg-emerald-600/20 border-emerald-400/60 text-emerald-200'
                  : 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-750'
              }`}
            >
              <input
                type="checkbox"
                checked={draft.enabled}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, enabled: e.target.checked }))
                }
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
              <span>{draft.enabled ? 'مرفق مع عرض السعر' : 'تفعيل إرفاق العقد'}</span>
            </label>

            <button
              type="button"
              onClick={handleResetSmartAuto}
              className="inline-flex items-center gap-1.5 text-xs font-bold bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap"
              title="إعادة توليد العقد ذكياً من بنود العرض الحالية"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">إعادة التوليد الذكي</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center transition cursor-pointer"
              aria-label="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-stone-100 border-b border-stone-200 px-5 py-2.5 flex items-center gap-1.5 overflow-x-auto shrink-0">
          {[
            { id: 'parties' as EditorTab, label: 'القالب وبيانات الأطراف', icon: Users },
            { id: 'scope' as EditorTab, label: 'نطاق الأعمال والمراحل', icon: Layers },
            { id: 'terms' as EditorTab, label: 'الالتزامات والشروط والملكية', icon: ShieldCheck },
            { id: 'financial' as EditorTab, label: 'المالية والدفعات والاعتماد', icon: CreditCard },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 bg-stone-50/40">
          {/* =================================================================
              TAB 1: TEMPLATE & PARTIES
             ================================================================= */}
          {activeTab === 'parties' && (
            <div className="space-y-6">
              {/* Smart Template Picker */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-stone-900">
                    اختر نموذج العقد الذكي (مناسب لأي قسم أو خدمة)
                  </h3>
                  <span className="text-xs text-stone-500">
                    التغيير يُحدّث البنود والشروط تلقائياً مع الحفاظ على بيانات العميل
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {CONTRACT_TEMPLATE_CATALOG.map((tpl) => {
                    const selected = draft.templateKind === tpl.id;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => handleSelectTemplate(tpl.id)}
                        className={`p-3 rounded-xl border text-right transition cursor-pointer ${
                          selected
                            ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                            : 'bg-white text-stone-800 border-stone-200 hover:border-amber-400 hover:bg-amber-50/30'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-black">{tpl.shortLabel}</span>
                          {selected && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />}
                        </div>
                        <div
                          className={`text-[11px] mt-1 leading-snug ${
                            selected ? 'text-stone-300' : 'text-stone-500'
                          }`}
                        >
                          {tpl.departmentBadge}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <hr className="border-stone-200" />

              {/* Contract Header Info */}
              <div className="space-y-3">
                <h3 className="text-sm font-black text-stone-900">عنوان وبيانات إبرام العقد</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      عنوان العقد الرئيسي:
                    </label>
                    <input
                      type="text"
                      value={draft.contractTitle}
                      onChange={(e) => updateDraft({ contractTitle: e.target.value })}
                      className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:ring-2 focus:ring-amber-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      السطر الفرعي للعنوان (اختياري):
                    </label>
                    <input
                      type="text"
                      value={draft.contractSubtitle}
                      onChange={(e) => updateDraft({ contractSubtitle: e.target.value })}
                      placeholder="مثال: وإصدار رخصة بناء"
                      className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-medium text-stone-900 focus:ring-2 focus:ring-amber-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      رقم العقد:
                    </label>
                    <input
                      type="text"
                      value={draft.contractNumber}
                      onChange={(e) => updateDraft({ contractNumber: e.target.value })}
                      className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-stone-900 focus:ring-2 focus:ring-amber-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      مدينة التوقيع:
                    </label>
                    <input
                      type="text"
                      value={draft.signingCity}
                      onChange={(e) => updateDraft({ signingCity: e.target.value })}
                      className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:ring-2 focus:ring-amber-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      تاريخ العقد:
                    </label>
                    <input
                      type="date"
                      value={draft.signingDate}
                      onChange={(e) =>
                        updateDraft({
                          signingDate: e.target.value,
                          signingDayName: getArabicDayName(e.target.value),
                        })
                      }
                      className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:ring-2 focus:ring-amber-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      اليوم:
                    </label>
                    <input
                      type="text"
                      value={draft.signingDayName}
                      onChange={(e) => updateDraft({ signingDayName: e.target.value })}
                      className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:ring-2 focus:ring-amber-500 outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <hr className="border-stone-200" />

              {/* First Party Details */}
              <div className="space-y-3">
                <h3 className="text-sm font-black text-stone-900">بيانات الطرف الأول (المالك)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      اسم الطرف الأول:
                    </label>
                    <input
                      type="text"
                      value={draft.firstPartyName}
                      onChange={(e) => updateDraft({ firstPartyName: e.target.value })}
                      placeholder="اسم المالك الكامل"
                      className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:ring-2 focus:ring-amber-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      رقم الهوية / السجل التجاري:
                    </label>
                    <input
                      type="text"
                      value={draft.firstPartyId}
                      onChange={(e) => updateDraft({ firstPartyId: e.target.value })}
                      placeholder="10xxxxxxxx"
                      className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-stone-900 focus:ring-2 focus:ring-amber-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      رقم الجوال:
                    </label>
                    <input
                      type="text"
                      value={draft.firstPartyPhone}
                      onChange={(e) => updateDraft({ firstPartyPhone: e.target.value })}
                      placeholder="05xxxxxxxx"
                      className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-stone-900 focus:ring-2 focus:ring-amber-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      العنوان:
                    </label>
                    <input
                      type="text"
                      value={draft.firstPartyAddress}
                      onChange={(e) => updateDraft({ firstPartyAddress: e.target.value })}
                      placeholder="مدينة الرياض – حي ..."
                      className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-medium text-stone-900 focus:ring-2 focus:ring-amber-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      البريد الإلكتروني:
                    </label>
                    <input
                      type="email"
                      value={draft.firstPartyEmail}
                      onChange={(e) => updateDraft({ firstPartyEmail: e.target.value })}
                      placeholder="client@example.com"
                      className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-medium text-stone-900 focus:ring-2 focus:ring-amber-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      رقم الصك / العقار:
                    </label>
                    <input
                      type="text"
                      value={draft.propertyRealEstateNumber}
                      onChange={(e) => updateDraft({ propertyRealEstateNumber: e.target.value })}
                      placeholder="رقم الصك الإلكتروني"
                      className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-stone-900 focus:ring-2 focus:ring-amber-500 outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <hr className="border-stone-200" />

              {/* Second Party & Preamble */}
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    بيانات الطرف الثاني (الاستشاري):
                  </label>
                  <textarea
                    rows={2}
                    value={draft.secondPartyText}
                    onChange={(e) => updateDraft({ secondPartyText: e.target.value })}
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs leading-relaxed text-stone-900 focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    التمهيد / مقدمة العقد:
                  </label>
                  <textarea
                    rows={3}
                    value={draft.preambleText}
                    onChange={(e) => updateDraft({ preambleText: e.target.value })}
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs leading-relaxed text-stone-900 focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>

                {/* Optional Project Overview (e.g. Supervision) */}
                <div className="pt-1 space-y-2">
                  <label className="inline-flex items-center gap-2 text-xs font-bold text-stone-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draft.showProjectOverview}
                      onChange={(e) => updateDraft({ showProjectOverview: e.target.checked })}
                      className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                    />
                    <span>إظهار بند مستقل «الوصف العام للمشروع» قبل التزامات الاستشاري (مناسب لعقود الإشراف والتنفيذ)</span>
                  </label>
                  {draft.showProjectOverview && (
                    <input
                      type="text"
                      value={draft.projectOverviewText}
                      onChange={(e) => updateDraft({ projectOverviewText: e.target.value })}
                      placeholder="مثال: فيلا سكنية (دور قبو + دور أرضي + دور أول + ملحق علوي)"
                      className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:ring-2 focus:ring-amber-500 outline-hidden"
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              TAB 2: SCOPE, SUPERVISION STAGES & TIMELINE
             ================================================================= */}
          {activeTab === 'scope' && (
            <div className="space-y-6">
              {/* Scope Groups Editor */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-black text-stone-900">
                      نطاق الأعمال والتزامات الاستشاري ({draft.scopeGroups.length} مجموعات)
                    </h3>
                    <p className="text-xs text-stone-500">
                      يمكنك تعديل أي عنوان أو بند، إضافة مجموعات فرعية، أو حذف أي تفصيل لا ينطبق على العقد.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddScopeGroup}
                    className="inline-flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                    <span>إضافة مجموعة نطاق عمل</span>
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    عنوان بند التزامات الاستشاري:
                  </label>
                  <input
                    type="text"
                    value={draft.consultantScopeTitle}
                    onChange={(e) => updateDraft({ consultantScopeTitle: e.target.value })}
                    className="w-full sm:w-80 bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs font-bold text-stone-900 focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>

                <div className="space-y-4">
                  {draft.scopeGroups.map((group, gIdx) => (
                    <div
                      key={group.id || gIdx}
                      className="bg-white border border-stone-200 rounded-xl p-4 space-y-3"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          value={group.title}
                          onChange={(e) =>
                            handleUpdateScopeGroup(gIdx, { title: e.target.value })
                          }
                          placeholder="عنوان المجموعة (مثال: التصاميم المعمارية :)"
                          className="flex-1 min-w-[180px] bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs font-black text-stone-900 focus:bg-white focus:border-amber-500 outline-hidden"
                        />
                        <input
                          type="text"
                          value={group.subtitle || ''}
                          onChange={(e) =>
                            handleUpdateScopeGroup(gIdx, { subtitle: e.target.value })
                          }
                          placeholder="عنوان فرعي (اختياري)"
                          className="w-44 bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-stone-800 focus:bg-white focus:border-amber-500 outline-hidden"
                        />
                        <select
                          value={group.layout || 'list'}
                          onChange={(e) =>
                            handleUpdateScopeGroup(gIdx, {
                              layout: e.target.value as 'list' | 'two_column',
                            })
                          }
                          className="bg-stone-50 border border-stone-300 rounded-lg px-2 py-1.5 text-xs font-bold text-stone-700 cursor-pointer"
                        >
                          <option value="list">عمود واحد</option>
                          <option value="two_column">عمودان (مدمج)</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleDeleteScopeGroup(gIdx)}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="حذف هذه المجموعة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        {group.items.map((itemText, iIdx) => (
                          <div key={iIdx} className="flex items-center gap-2">
                            <span className="text-[#a6926b] font-black text-xs">•</span>
                            <input
                              type="text"
                              value={itemText}
                              onChange={(e) =>
                                handleUpdateScopeGroupItem(gIdx, iIdx, e.target.value)
                              }
                              className="flex-1 bg-stone-50 hover:bg-white border border-stone-200 rounded-lg px-2.5 py-1 text-xs text-stone-800 focus:bg-white focus:border-amber-500 outline-hidden"
                            />
                            <button
                              type="button"
                              onClick={() => handleDeleteScopeGroupItem(gIdx, iIdx)}
                              className="p-1 text-stone-400 hover:text-red-600 rounded transition cursor-pointer"
                              title="حذف السطر"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          value={newScopeItemByGroup[group.id] || ''}
                          onChange={(e) =>
                            setNewScopeItemByGroup((prev) => ({
                              ...prev,
                              [group.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddScopeGroupItem(gIdx, group.id);
                            }
                          }}
                          placeholder="إضافة بند جديد داخل هذه المجموعة..."
                          className="flex-1 bg-white border border-stone-300 rounded-lg px-2.5 py-1 text-xs focus:border-amber-500 outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddScopeGroupItem(gIdx, group.id)}
                          className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-3 py-1 rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>إضافة</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <hr className="border-stone-200" />

              {/* Supervision Inspection Stages Toggle & Editor */}
              <div className="space-y-3">
                <label className="inline-flex items-center gap-2 text-sm font-black text-stone-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.showSupervisionStages}
                    onChange={(e) =>
                      updateDraft({
                        showSupervisionStages: e.target.checked,
                        ...(e.target.checked && draft.supervisionStages.length === 0
                          ? {
                              supervisionStagesTitle: 'مراحل استلامات الأعمال :',
                              supervisionMaxVisitsText:
                                'يقوم الاستشاري بالإشراف على مرحلة العظم حسب الاستلامات المعتمدة من البلدية وكود البناء السعودي بحد أقصى 10 زيارات.',
                              supervisionExtraVisitFeeText:
                                'وأي زيارات إضافية تكون بقيمة 700 ريال.',
                              supervisionStages: [
                                'الأساسات',
                                'الميدة',
                                'أعمدة الدور الأرضي',
                                'سقف الدور الأرضي',
                                'أعمدة الدور الأول',
                                'سقف الدور الأول',
                                'أعمدة الملحق العلوي',
                                'سقف الملحق العلوي',
                              ],
                            }
                          : {}),
                      })
                    }
                    className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                  />
                  <ClipboardList className="w-4 h-4 text-[#a6926b]" />
                  <span>تضمين جدول «مراحل استلامات الأعمال والزيارات الميدانية» (خاص بالإشراف)</span>
                </label>

                {draft.showSupervisionStages && (
                  <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          نص حد الزيارات ونطاق الاستلام:
                        </label>
                        <input
                          type="text"
                          value={draft.supervisionMaxVisitsText}
                          onChange={(e) =>
                            updateDraft({ supervisionMaxVisitsText: e.target.value })
                          }
                          className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-1.5 text-xs focus:bg-white focus:border-amber-500 outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          نص رسوم الزيارة الإضافية:
                        </label>
                        <input
                          type="text"
                          value={draft.supervisionExtraVisitFeeText}
                          onChange={(e) =>
                            updateDraft({ supervisionExtraVisitFeeText: e.target.value })
                          }
                          className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-1.5 text-xs focus:bg-white focus:border-amber-500 outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {draft.supervisionStages.map((stage, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="w-6 text-center text-xs font-mono font-bold text-stone-500">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={stage}
                            onChange={(e) => {
                              const next = [...draft.supervisionStages];
                              next[idx] = e.target.value;
                              updateDraft({ supervisionStages: next });
                            }}
                            className="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1 text-xs font-bold text-stone-800 focus:bg-white focus:border-amber-500 outline-hidden"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              updateDraft({
                                supervisionStages: draft.supervisionStages.filter(
                                  (_, i) => i !== idx
                                ),
                              })
                            }
                            className="p-1 text-stone-400 hover:text-red-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newSupervisionStage}
                        onChange={(e) => setNewSupervisionStage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newSupervisionStage.trim()) {
                            e.preventDefault();
                            updateDraft({
                              supervisionStages: [
                                ...draft.supervisionStages,
                                newSupervisionStage.trim(),
                              ],
                            });
                            setNewSupervisionStage('');
                          }
                        }}
                        placeholder="إضافة مرحلة استلام جديدة (مثال: استلام عزل القبو)..."
                        className="flex-1 bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs focus:border-amber-500 outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newSupervisionStage.trim()) return;
                          updateDraft({
                            supervisionStages: [
                              ...draft.supervisionStages,
                              newSupervisionStage.trim(),
                            ],
                          });
                          setNewSupervisionStage('');
                        }}
                        className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer"
                      >
                        + إضافة مرحلة
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <hr className="border-stone-200" />

              {/* Timeline Table Editor */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="inline-flex items-center gap-2 text-sm font-black text-stone-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draft.showTimelineTable}
                      onChange={(e) => updateDraft({ showTimelineTable: e.target.checked })}
                      className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                    />
                    <span>تضمين جدول «المدة الزمنية لإنهاء مراحل المشروع»</span>
                  </label>
                  {draft.showTimelineTable && (
                    <button
                      type="button"
                      onClick={handleAddTimelineRow}
                      className="inline-flex items-center gap-1 bg-stone-900 hover:bg-stone-800 text-white px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-amber-400" />
                      <span>إضافة مرحلة زمنية</span>
                    </button>
                  )}
                </div>

                {draft.showTimelineTable && (
                  <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-3">
                    {/* Timeline start notes */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-stone-700">
                        ملاحظات احتساب المدة الزمنية:
                      </label>
                      {draft.timelineNotes.map((note, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={note}
                            onChange={(e) => {
                              const next = [...draft.timelineNotes];
                              next[idx] = e.target.value;
                              updateDraft({ timelineNotes: next });
                            }}
                            className="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1 text-xs text-stone-800 focus:bg-white focus:border-amber-500 outline-hidden"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              updateDraft({
                                timelineNotes: draft.timelineNotes.filter((_, i) => i !== idx),
                              })
                            }
                            className="p-1 text-stone-400 hover:text-red-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newTimelineNote}
                          onChange={(e) => setNewTimelineNote(e.target.value)}
                          placeholder="إضافة ملاحظة زمنية جديدة..."
                          className="flex-1 bg-white border border-stone-300 rounded-lg px-2.5 py-1 text-xs outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!newTimelineNote.trim()) return;
                            updateDraft({
                              timelineNotes: [...draft.timelineNotes, newTimelineNote.trim()],
                            });
                            setNewTimelineNote('');
                          }}
                          className="bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold px-3 py-1 rounded-lg text-xs cursor-pointer"
                        >
                          إضافة
                        </button>
                      </div>
                    </div>

                    {/* Timeline rows */}
                    <div className="space-y-2 pt-2">
                      {draft.timelineRows.map((row, idx) => (
                        <div
                          key={row.id || idx}
                          className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-stone-50 p-2 rounded-lg border border-stone-200"
                        >
                          <input
                            type="text"
                            value={row.stage}
                            onChange={(e) => {
                              const next = draft.timelineRows.map((r, i) =>
                                i === idx ? { ...r, stage: e.target.value } : r
                              );
                              updateDraft({ timelineRows: next });
                            }}
                            placeholder="المرحلة"
                            className="sm:col-span-2 bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs font-bold"
                          />
                          <input
                            type="text"
                            value={row.workTitle}
                            onChange={(e) => {
                              const next = draft.timelineRows.map((r, i) =>
                                i === idx ? { ...r, workTitle: e.target.value } : r
                              );
                              updateDraft({ timelineRows: next });
                            }}
                            placeholder="وصف العمل"
                            className="sm:col-span-3 bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs font-bold"
                          />
                          <input
                            type="text"
                            value={row.details}
                            onChange={(e) => {
                              const next = draft.timelineRows.map((r, i) =>
                                i === idx ? { ...r, details: e.target.value } : r
                              );
                              updateDraft({ timelineRows: next });
                            }}
                            placeholder="تفاصيل الأعمال"
                            className="sm:col-span-4 bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs"
                          />
                          <input
                            type="text"
                            value={row.duration}
                            onChange={(e) => {
                              const next = draft.timelineRows.map((r, i) =>
                                i === idx ? { ...r, duration: e.target.value } : r
                              );
                              updateDraft({ timelineRows: next });
                            }}
                            placeholder="الفترة"
                            className="sm:col-span-2 bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs font-bold"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              updateDraft({
                                timelineRows: draft.timelineRows.filter((_, i) => i !== idx),
                              })
                            }
                            className="sm:col-span-1 p-1.5 text-stone-400 hover:text-red-600 flex justify-center cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-stone-200">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          تسمية صف الإجمالي الزمني:
                        </label>
                        <input
                          type="text"
                          value={draft.timelineTotalLabel}
                          onChange={(e) => updateDraft({ timelineTotalLabel: e.target.value })}
                          className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          المدة الإجمالية:
                        </label>
                        <input
                          type="text"
                          value={draft.timelineTotalDuration}
                          onChange={(e) => updateDraft({ timelineTotalDuration: e.target.value })}
                          className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs font-black"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =================================================================
              TAB 3: OBLIGATIONS, GENERAL TERMS & IP RIGHTS
             ================================================================= */}
          {activeTab === 'terms' && (
            <div className="space-y-6">
              {/* Owner Obligations */}
              <div className="space-y-2.5">
                <h3 className="text-sm font-black text-stone-900">
                  التزامات المالك ({draft.ownerObligations.length})
                </h3>
                <div className="space-y-2">
                  {draft.ownerObligations.map((ob, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="w-6 pt-2 text-center text-xs font-mono font-bold text-stone-500">
                        {idx + 1}
                      </span>
                      <textarea
                        rows={2}
                        value={ob}
                        onChange={(e) => {
                          const next = [...draft.ownerObligations];
                          next[idx] = e.target.value;
                          updateDraft({ ownerObligations: next });
                        }}
                        className="flex-1 bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs text-stone-800 focus:border-amber-500 outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          updateDraft({
                            ownerObligations: draft.ownerObligations.filter((_, i) => i !== idx),
                          })
                        }
                        className="p-2 text-stone-400 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newObligation}
                    onChange={(e) => setNewObligation(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newObligation.trim()) {
                        e.preventDefault();
                        updateDraft({
                          ownerObligations: [...draft.ownerObligations, newObligation.trim()],
                        });
                        setNewObligation('');
                      }
                    }}
                    placeholder="إضافة التزام جديد على المالك..."
                    className="flex-1 bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newObligation.trim()) return;
                      updateDraft({
                        ownerObligations: [...draft.ownerObligations, newObligation.trim()],
                      });
                      setNewObligation('');
                    }}
                    className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-3.5 py-2 rounded-xl text-xs cursor-pointer"
                  >
                    + إضافة التزام
                  </button>
                </div>
              </div>

              <hr className="border-stone-200" />

              {/* General Terms */}
              <div className="space-y-2.5">
                <h3 className="text-sm font-black text-stone-900">
                  الشروط العامة ({draft.generalTerms.length})
                </h3>
                <div className="space-y-2">
                  {draft.generalTerms.map((term, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="w-6 pt-2 text-center text-xs font-mono font-bold text-stone-500">
                        {idx + 1}
                      </span>
                      <textarea
                        rows={2}
                        value={term}
                        onChange={(e) => {
                          const next = [...draft.generalTerms];
                          next[idx] = e.target.value;
                          updateDraft({ generalTerms: next });
                        }}
                        className="flex-1 bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs text-stone-800 focus:border-amber-500 outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          updateDraft({
                            generalTerms: draft.generalTerms.filter((_, i) => i !== idx),
                          })
                        }
                        className="p-2 text-stone-400 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newTerm}
                    onChange={(e) => setNewTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newTerm.trim()) {
                        e.preventDefault();
                        updateDraft({
                          generalTerms: [...draft.generalTerms, newTerm.trim()],
                        });
                        setNewTerm('');
                      }
                    }}
                    placeholder="إضافة شرط عام جديد للعقد..."
                    className="flex-1 bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newTerm.trim()) return;
                      updateDraft({
                        generalTerms: [...draft.generalTerms, newTerm.trim()],
                      });
                      setNewTerm('');
                    }}
                    className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-3.5 py-2 rounded-xl text-xs cursor-pointer"
                  >
                    + إضافة شرط
                  </button>
                </div>
              </div>

              <hr className="border-stone-200" />

              {/* Intellectual Property Rights */}
              <div className="space-y-3">
                <label className="inline-flex items-center gap-2 text-sm font-black text-stone-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.showIpRights}
                    onChange={(e) => updateDraft({ showIpRights: e.target.checked })}
                    className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                  />
                  <span>تضمين بند «حقوق الملكية الفكرية والفنية»</span>
                </label>

                {draft.showIpRights && (
                  <div className="space-y-2">
                    {draft.ipRights.map((ip, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <textarea
                          rows={2}
                          value={ip}
                          onChange={(e) => {
                            const next = [...draft.ipRights];
                            next[idx] = e.target.value;
                            updateDraft({ ipRights: next });
                          }}
                          className="flex-1 bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs text-stone-800 focus:border-amber-500 outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            updateDraft({
                              ipRights: draft.ipRights.filter((_, i) => i !== idx),
                            })
                          }
                          className="p-2 text-stone-400 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newIpRight}
                        onChange={(e) => setNewIpRight(e.target.value)}
                        placeholder="إضافة بند ملكية فكرية..."
                        className="flex-1 bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newIpRight.trim()) return;
                          updateDraft({ ipRights: [...draft.ipRights, newIpRight.trim()] });
                          setNewIpRight('');
                        }}
                        className="bg-stone-900 text-white font-bold px-3.5 py-2 rounded-xl text-xs cursor-pointer"
                      >
                        + إضافة
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =================================================================
              TAB 4: FINANCIAL SUMMARY, MILESTONES & SIGNING
             ================================================================= */}
          {activeTab === 'financial' && (
            <div className="space-y-6">
              {/* Synced financial summary strip */}
              <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-black text-stone-900">
                      ملخص القيمة المالية والدفعات (مُزامن تلقائياً مع عرض السعر)
                    </h3>
                    <p className="text-xs text-stone-500">
                      يتم سحب البنود والخصم والضريبة وجدول الدفعات والبيانات البنكية مباشرة من عرض السعر لضمان التطابق 100%.
                    </p>
                  </div>
                  {onOpenEditMilestones && (
                    <button
                      type="button"
                      onClick={onOpenEditMilestones}
                      className="inline-flex items-center gap-1.5 bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>تعديل جدول الدفعات والنسب</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-stone-100 text-xs">
                  <div>
                    <div className="text-stone-500">قيمة الأعمال</div>
                    <div className="text-sm font-black text-stone-900 font-mono tabular-nums mt-0.5">
                      {formatSAR(subtotal)}
                    </div>
                  </div>
                  <div>
                    <div className="text-stone-500">الخصم</div>
                    <div className="text-sm font-black text-red-600 font-mono tabular-nums mt-0.5">
                      {discountAmount > 0 ? `- ${formatSAR(discountAmount)}` : '0 ر.س'}
                    </div>
                  </div>
                  <div>
                    <div className="text-stone-500">الضريبة (15%)</div>
                    <div className="text-sm font-black text-stone-900 font-mono tabular-nums mt-0.5">
                      {clientInfo.includeTax ? formatSAR(taxAmount) : 'غير شاملة'}
                    </div>
                  </div>
                  <div>
                    <div className="text-stone-500">إجمالي العقد</div>
                    <div className="text-base font-black text-[#433c71] font-mono tabular-nums mt-0.5">
                      {formatSAR(grandTotal)}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-100 space-y-1.5 text-xs">
                  <div className="font-bold text-stone-700">الدفعات الحالية ({milestones.length}):</div>
                  {milestones.map((m, i) => (
                    <div key={m.id || i} className="flex items-center justify-between text-stone-700">
                      <span>
                        {i + 1}. <strong>{m.title}</strong> ({m.percentage}%) — {m.description}
                      </span>
                      <span className="font-mono font-bold tabular-nums">{formatSAR(m.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    الفقرة التمهيدية لبند الأسعار:
                  </label>
                  <textarea
                    rows={2}
                    value={draft.pricingIntroText}
                    onChange={(e) => updateDraft({ pricingIntroText: e.target.value })}
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    ملاحظة آلية صرف الدفعات:
                  </label>
                  <input
                    type="text"
                    value={draft.paymentMethodNote}
                    onChange={(e) => updateDraft({ paymentMethodNote: e.target.value })}
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    عبارة الختام قبل التوقيعات:
                  </label>
                  <input
                    type="text"
                    value={draft.closingText}
                    onChange={(e) => updateDraft({ closingText: e.target.value })}
                    className="w-full sm:w-80 bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>
                <label className="inline-flex items-center gap-2 text-xs font-bold text-stone-800 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={draft.showCompanySeal}
                    onChange={(e) => updateDraft({ showCompanySeal: e.target.checked })}
                    className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                  />
                  <span>إظهار الختم الرسمي لشركة الرؤية المضيئة في خانة الطرف الثاني</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-white border-t border-stone-200 px-5 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-stone-500">
            {draft.enabled
              ? 'العقد مفعّل وسيُرفق تلقائياً مع عرض السعر عند الطباعة وتصدير Word.'
              : 'ملاحظة: يمكنك تفعيل «مرفق مع عرض السعر» من الأعلى ليظهر تلقائياً مع العرض.'}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 text-xs font-bold transition cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={() => handleSave(false)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition cursor-pointer"
            >
              <Check className="w-4 h-4 text-amber-400" />
              <span>حفظ تعديلات العقد</span>
            </button>
            {onSaveAndPreview && (
              <button
                type="button"
                onClick={() => handleSave(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black shadow-sm transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>حفظ ومعاينة الطباعة</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
