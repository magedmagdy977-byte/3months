import React, { useState } from 'react';
import { ClientInfo, BuildingType, DesignServiceType, RiyadhLocationZone } from '../types';
import { generateQuoteNumber, incrementQuoteNumber, isMaxQuoteSequenceReached, getTodayDateString, formatSAR } from '../utils/formatters';
import { getAuthorizedUsersList } from '../lib/security';
import { RIYADH_ZONE_CONFIGS, detectRiyadhZone } from '../data/pricingData';
import {
  Building2,
  User,
  Phone,
  Calendar,
  Hash,
  MapPin,
  Maximize2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  Home,
  Building,
  Store,
  Clock,
  Edit3,
  CheckCircle2,
  FileSpreadsheet,
  Percent,
  ShieldCheck,
  Copy,
  FileText,
  AlertTriangle,
  Compass,
} from 'lucide-react';

interface UnifiedProjectDataSectionProps {
  clientInfo: ClientInfo;
  onUpdateClientInfo: (info: Partial<ClientInfo>) => void;
  calculatorArea?: number;
  onAreaChange?: (area: number) => void;
  calculatorBuildingType?: BuildingType;
  onBuildingTypeChange?: (bType: BuildingType) => void;
  calculatorServiceType?: DesignServiceType;
  onServiceTypeChange?: (sType: DesignServiceType) => void;
  onOpenAiAssistant?: () => void;
}

export const UnifiedProjectDataSection: React.FC<UnifiedProjectDataSectionProps> = ({
  clientInfo,
  onUpdateClientInfo,
  calculatorArea,
  onAreaChange,
  calculatorBuildingType,
  onBuildingTypeChange,
  calculatorServiceType,
  onServiceTypeChange,
  onOpenAiAssistant,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [showAdvancedTerms, setShowAdvancedTerms] = useState<boolean>(false);

  // Quick helper to regenerate quote number (+1)
  const handleRegenerateNumber = () => {
    if (isMaxQuoteSequenceReached(clientInfo.proposalNumber)) return;
    const newNum = incrementQuoteNumber(clientInfo.proposalNumber);
    onUpdateClientInfo({ proposalNumber: newNum });
  };

  // Quick helper to set today's date
  const handleSetToday = () => {
    onUpdateClientInfo({ date: getTodayDateString() });
  };

  // Quick change of building type
  const handleQuickBuildingType = (typeVal: BuildingType, label: string) => {
    if (onBuildingTypeChange) {
      onBuildingTypeChange(typeVal);
    }
    const isResOrComm = typeVal === 'residential' || typeVal === 'commercial';
    const currentScope = clientInfo.scopeFlags || ({} as any);
    const currentExclusions = clientInfo.exclusions || ({} as any);

    onUpdateClientInfo({
      buildingType: label,
      projectTitle: `مشروع ${label}`,
      // Rule: في حالة العمائر السكنية والتجارية يتم التأشير تلقائياً على بند مخططات الأمن والسلامة
      scopeFlags: {
        ...currentScope,
        civilDefense: isResOrComm ? true : currentScope.civilDefense,
      },
      exclusions: {
        ...currentExclusions,
        excludeCivilDefense: isResOrComm ? false : currentExclusions.excludeCivilDefense,
      },
    });
  };

  // Quick change of land area (مسطح البناء الإجمالي = مساحة الأرض × 1.68)
  const handleLandAreaChange = (val: number) => {
    const safeVal = Math.max(0, val);
    const newBuildingArea = Math.round(safeVal * 1.68);
    onUpdateClientInfo({
      landArea: safeVal,
      floorArea: safeVal,
      buildingArea: newBuildingArea,
    });
    if (onAreaChange) {
      onAreaChange(safeVal);
    }
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-amber-500/30 shadow-sm overflow-hidden transition-all">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-md shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black bg-amber-400 text-stone-950 px-2.5 py-0.5 rounded-md font-mono">
                أولاً
              </span>
              <h3 className="text-base sm:text-lg font-black text-white">
                بيانات المشروع الموحد (MASTER TEMPLATE)
              </h3>
              <span className="text-[10px] font-bold bg-white/10 text-stone-300 border border-white/10 px-2 py-0.5 rounded-full hidden sm:inline-block">
                الحقول المركزية &#123;&#123;...&#125;&#125;
              </span>
            </div>
            <p className="text-xs text-stone-300 mt-0.5">
              بيانات العرض والمشروع المنعكسة مباشرة في تسعير الخدمات وتوليد العرض والعقد الموحد
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {onOpenAiAssistant && (
            <button
              type="button"
              onClick={onOpenAiAssistant}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 text-xs font-black transition shadow-md border border-amber-300 cursor-pointer"
              title="قراءة الصك العقاري وتعبئة الحقول آلياً عبر الذكاء الاصطناعي (Gemini)"
            >
              <Sparkles className="w-3.5 h-3.5 text-stone-950" />
              <span>قراءة الصك بالذكاء الاصطناعي ✨</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition border border-stone-700"
            title={isExpanded ? 'طي بيانات المشروع' : 'توسيع بيانات المشروع'}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">طي الخانات</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">تعديل البيانات</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Summary preview bar when collapsed or quick reference */}
      {!isExpanded && (
        <div className="bg-amber-50/70 border-b border-amber-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 flex-wrap text-stone-700 font-medium">
            <div>
              <span className="text-stone-400 font-bold ml-1">العميل:</span>
              <span className="font-bold text-stone-900">{clientInfo.clientName || 'غير مسجل'}</span>
            </div>
            <div>
              <span className="text-stone-400 font-bold ml-1">العقار:</span>
              <span className="font-bold text-stone-900">{clientInfo.buildingType || 'فيلا سكنية'}</span>
            </div>
            <div>
              <span className="text-stone-400 font-bold ml-1">الموقع:</span>
              <span className="font-bold text-stone-900">
                {clientInfo.projectCity} - {clientInfo.district || 'حي حطين'} (قطعة {clientInfo.plotNumber || '-'})
              </span>
            </div>
            <div>
              <span className="text-stone-400 font-bold ml-1">مساحة الأرض:</span>
              <span className="font-bold text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded-md">
                {clientInfo.landArea || 0} م²
              </span>
            </div>
            <div>
              <span className="text-stone-400 font-bold ml-1">رقم العرض:</span>
              <span className="font-mono font-bold text-stone-800">{clientInfo.proposalNumber}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="text-xs font-bold text-amber-800 hover:text-amber-900 underline flex items-center gap-1"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>تعديل البيانات</span>
          </button>
        </div>
      )}

      {/* Expanded Form Fields */}
      {isExpanded && (
        <div className="p-4 sm:p-6 space-y-5 bg-stone-50/50">
          {/* Smart AI Deed Reader Banner */}
          {onOpenAiAssistant && (
            <div className="bg-gradient-to-l from-amber-500/20 via-amber-500/10 to-white border-2 border-dashed border-amber-400 p-3 sm:p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center shrink-0 shadow-md">
                  <Sparkles className="w-5 h-5 text-stone-950" />
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-black text-stone-900">
                      التعبئة الذكية عبر الذكاء الاصطناعي (Google Gemini)
                    </span>
                    <span className="text-[10px] font-black bg-amber-400 text-stone-950 px-2 py-0.5 rounded-full">
                      جديد ✨
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 mt-0.5">
                    ارفع صورة الصك العقاري أو رخصة البناء أو الصق رسالة العميل، وسيقوم المساعد بقراءة البيانات وتوزيعها في كافة الخانات الصحيحة فوراً.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenAiAssistant}
                className="w-full sm:w-auto bg-stone-900 hover:bg-stone-800 active:scale-95 text-amber-300 hover:text-white font-black px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition shrink-0 shadow-md border border-stone-800 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>فتح محادثة قراءة الصك 🤖</span>
              </button>
            </div>
          )}

          {/* Quick Notice Banner */}
          <div className="bg-amber-50 border border-amber-200/80 p-3 rounded-xl flex items-center justify-between gap-2 text-stone-700 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                هذه الخانات تمثل <strong>أولاً: بيانات العرض والمشروع</strong> بالنموذج الموحد الرسمي. يتم تحديث مخرجات العرض تلقائياً مع كل كتابة.
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleRegenerateNumber}
                className="text-[11px] font-bold text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 px-2.5 py-1 rounded-lg transition flex items-center gap-1"
                title="توليد رقم عرض جديد"
              >
                <RotateCcw className="w-3 h-3 text-amber-600" />
                <span className="hidden sm:inline">رقم جديد</span>
              </button>
              <button
                type="button"
                onClick={handleSetToday}
                className="text-[11px] font-bold text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 px-2.5 py-1 rounded-lg transition flex items-center gap-1"
                title="تحديث التاريخ لليوم"
              >
                <Calendar className="w-3 h-3 text-amber-600" />
                <span className="hidden sm:inline">تاريخ اليوم</span>
              </button>
            </div>
          </div>

          {/* SECTION A: Client & Quotation Metadata */}
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-3">
            <h4 className="text-xs font-black text-stone-800 flex items-center gap-2 border-b border-stone-100 pb-2">
              <User className="w-3.5 h-3.5 text-amber-500" />
              <span>بيانات العميل ورقم العرض (&#123;&#123;اسم_العميل&#125;&#125;، &#123;&#123;رقم_العرض&#125;&#125;، &#123;&#123;التاريخ&#125;&#125;)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Client Name */}
              <div className="sm:col-span-2 lg:col-span-2">
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  اسم العميل المكرم:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={clientInfo.clientName}
                    onChange={(e) => onUpdateClientInfo({ clientName: e.target.value })}
                    placeholder="مثال: فهد بن عبد العزيز آل سعود"
                    className="w-full bg-stone-50 hover:bg-white focus:bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:ring-2 focus:ring-amber-500 outline-hidden transition"
                  />
                </div>
              </div>

              {/* National ID / CR */}
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1 flex items-center justify-between">
                  <span>رقم الهوية / السجل:</span>
                  <span className="text-[10px] font-mono text-stone-400">&#123;&#123;رقم_الهوية&#125;&#125;</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    dir="ltr"
                    value={clientInfo.nationalId || ''}
                    onChange={(e) => onUpdateClientInfo({ nationalId: e.target.value })}
                    placeholder="10xxxxxxxx"
                    className="w-full bg-stone-50 hover:bg-white focus:bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:ring-2 focus:ring-amber-500 outline-hidden transition text-right"
                  />
                </div>
              </div>

              {/* Client Phone */}
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  رقم الجوال / الهاتف:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    dir="ltr"
                    value={clientInfo.phone}
                    onChange={(e) => onUpdateClientInfo({ phone: e.target.value })}
                    placeholder="05xxxxxxxx"
                    className="w-full bg-stone-50 hover:bg-white focus:bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:ring-2 focus:ring-amber-500 outline-hidden transition text-right"
                  />
                </div>
              </div>

              {/* Quotation Number & Date Container */}
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1 flex items-center justify-between">
                  <span>رقم وتاريخ العرض:</span>
                  <span className="text-[10px] font-mono text-stone-400">&#123;&#123;رقم_العرض&#125;&#125;</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={clientInfo.proposalNumber}
                    onChange={(e) => onUpdateClientInfo({ proposalNumber: e.target.value })}
                    className="w-full bg-stone-50 hover:bg-white focus:bg-white border border-stone-300 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-stone-900 focus:ring-2 focus:ring-amber-500 outline-hidden transition pl-7"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (isMaxQuoteSequenceReached(clientInfo.proposalNumber)) return;
                      onUpdateClientInfo({
                        proposalNumber: incrementQuoteNumber(clientInfo.proposalNumber),
                      });
                    }}
                    title="توليد رقم عرض جديد تصاعدياً (+1) لتجنب التكرار"
                    className="absolute left-1 p-1 text-stone-400 hover:text-amber-600 rounded-lg hover:bg-stone-100 transition"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Engineer Selection & Financial Discount Options */}
            <div className="pt-2 border-t border-stone-100 grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Preparing Engineer (معد العرض) */}
              <div className="bg-stone-50/70 p-2.5 rounded-xl border border-stone-200">
                <label className="block text-[11px] font-bold text-stone-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-500" />
                    <span>إعداد المهندس (موثق بالعرض والختم):</span>
                  </span>
                  <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded">
                    فريق المهندسين
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={clientInfo.preparedBy || 'م.ماجد'}
                    onChange={(e) => onUpdateClientInfo({ preparedBy: e.target.value })}
                    className="grow bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs font-bold text-stone-900 focus:ring-2 focus:ring-amber-500 outline-hidden cursor-pointer"
                  >
                    {getAuthorizedUsersList().map((eng) => (
                      <option key={eng} value={eng}>
                        {eng}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Quick Engineer Chips */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {getAuthorizedUsersList().map((eng) => (
                    <button
                      key={eng}
                      type="button"
                      onClick={() => onUpdateClientInfo({ preparedBy: eng })}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-bold transition border cursor-pointer ${
                        (clientInfo.preparedBy || 'م.ماجد') === eng
                          ? 'bg-amber-500 text-stone-950 border-amber-600 font-black'
                          : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200'
                      }`}
                    >
                      {eng}
                    </button>
                  ))}
                </div>
              </div>

              {/* Commercial Discount (20% Default) & VAT Toggle */}
              <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-200 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
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
                    <div>
                      <span className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                        <Percent className="w-3.5 h-3.5 text-emerald-600" />
                        <span>خصم تجاري افتراضي (20%)</span>
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold block">
                        {(clientInfo.discountValue || 0) > 0
                          ? `مفعل بنسبة ${clientInfo.discountValue || 20}% على إجمالي العرض`
                          : 'الخصم معطل حالياً (0%)'}
                      </span>
                    </div>
                  </label>

                  {/* Discount percentage input */}
                  {(clientInfo.discountValue || 0) > 0 && (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={clientInfo.discountValue || ''}
                        onChange={(e) =>
                          onUpdateClientInfo({
                            discountValue: Number(e.target.value) || 0,
                            _userToggledDiscount: true,
                          } as any)
                        }
                        className="w-14 bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs font-bold text-center outline-hidden"
                      />
                      <span className="text-xs font-bold text-stone-600">%</span>
                    </div>
                  )}
                </div>

                <div className="pt-1.5 mt-1.5 border-t border-emerald-200/60 flex items-center justify-between text-[11px]">
                  <label className="flex items-center gap-2 cursor-pointer text-stone-700">
                    <input
                      type="checkbox"
                      checked={clientInfo.includeTax}
                      onChange={(e) =>
                        onUpdateClientInfo({
                          includeTax: e.target.checked,
                          _userToggledTax: true,
                        } as any)
                      }
                      className="w-3.5 h-3.5 accent-amber-600 rounded cursor-pointer"
                    />
                    <span className="font-bold">إضافة ضريبة القيمة المضافة (15%)</span>
                  </label>
                  <span className="text-[10px] text-stone-500">
                    {clientInfo.includeTax ? 'الأسعار شاملة الضريبة' : 'غير شاملة'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION B: Property, Land, and Location */}
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <h4 className="text-xs font-black text-stone-800 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                <span>بيانات العقار والموقع والمساحة (المدينة، الحي، القطعة، المخطط، المساحة)</span>
              </h4>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                مساحة الأرض ترتبط مباشرة بأسعار الشرائح
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Building Type */}
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-[11px] font-bold text-stone-700 mb-1 flex items-center justify-between">
                  <span>نوع المبنى:</span>
                  <span className="text-[10px] font-mono text-stone-400">&#123;&#123;نوع_المبنى&#125;&#125;</span>
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
                  className="w-full bg-stone-50 hover:bg-white focus:bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:ring-2 focus:ring-amber-500 outline-hidden transition"
                />
                {/* Quick Selection Shortcuts */}
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleQuickBuildingType('villa', 'فيلا سكنية خاصة')}
                    className={`text-[10px] px-2 py-0.5 rounded-md font-bold transition border ${
                      calculatorBuildingType === 'villa'
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200'
                    }`}
                  >
                    فيلا سكنية
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const nextVal = !clientInfo.isDuplex;
                      handleQuickBuildingType('villa', nextVal ? 'فلل دوبلكس' : 'فيلا سكنية خاصة');
                      onUpdateClientInfo({
                        isDuplex: nextVal,
                        buildingType: nextVal ? 'فلل دوبلكس' : 'فيلا سكنية خاصة',
                        projectTitle: nextVal ? 'مشروع فلل دوبلكس' : 'مشروع فيلا سكنية خاصة',
                      });
                    }}
                    className={`text-[10px] px-2.5 py-0.5 rounded-md font-bold transition border flex items-center gap-1 cursor-pointer ${
                      clientInfo.isDuplex
                        ? 'bg-amber-500 text-stone-950 border-amber-600 font-black shadow-2xs'
                        : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                    }`}
                    title="تأشير فلل دوبلكس: خفض المساحة المدخلة بالسعر إلى النصف تلقائياً"
                  >
                    <Copy className="w-3 h-3" />
                    <span>فلل دوبلكس {clientInfo.isDuplex ? '(نصف المساحة ✓)' : ''}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickBuildingType('residential', 'عمارة سكنية متعددة الأدوار')}
                    className={`text-[10px] px-2 py-0.5 rounded-md font-bold transition border ${
                      calculatorBuildingType === 'residential'
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200'
                    }`}
                  >
                    عمارة سكنية
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickBuildingType('commercial', 'عمارة تجارية / إدارية')}
                    className={`text-[10px] px-2 py-0.5 rounded-md font-bold transition border ${
                      calculatorBuildingType === 'commercial'
                        ? 'bg-amber-500 text-stone-950 border-amber-600'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200'
                    }`}
                  >
                    عمارة تجارية
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickBuildingType('rest_house', 'استراحة / شاليهات خاصة')}
                    className={`text-[10px] px-2 py-0.5 rounded-md font-bold transition border ${
                      calculatorBuildingType === 'rest_house'
                        ? 'bg-[#433c71] text-white border-[#433c71]'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200'
                    }`}
                  >
                    استراحات
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickBuildingType('hotel', 'فندق / منشأة ضيافة فندقية')}
                    className={`text-[10px] px-2 py-0.5 rounded-md font-bold transition border ${
                      calculatorBuildingType === 'hotel'
                        ? 'bg-indigo-900 text-white border-indigo-900'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200'
                    }`}
                  >
                    فنادق
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickBuildingType('gas_station', 'محطة وقود وخدمات سيارات')}
                    className={`text-[10px] px-2 py-0.5 rounded-md font-bold transition border ${
                      calculatorBuildingType === 'gas_station'
                        ? 'bg-red-900 text-white border-red-900'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200'
                    }`}
                  >
                    محطات وقود
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickBuildingType('factory', 'مصنع / منشأة صناعية')}
                    className={`text-[10px] px-2 py-0.5 rounded-md font-bold transition border ${
                      calculatorBuildingType === 'factory'
                        ? 'bg-stone-900 text-amber-400 border-stone-900'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200'
                    }`}
                  >
                    مصانع
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickBuildingType('warehouse_workshop', 'ورش ومستودعات تجارية / صناعية')}
                    className={`text-[10px] px-2 py-0.5 rounded-md font-bold transition border ${
                      calculatorBuildingType === 'warehouse_workshop'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200'
                    }`}
                  >
                    ورش ومستودعات
                  </button>
                </div>
              </div>

              {/* City */}
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1 flex items-center justify-between">
                  <span>المدينة:</span>
                  <span className="text-[10px] font-mono text-stone-400">&#123;&#123;المدينة&#125;&#125;</span>
                </label>
                <input
                  type="text"
                  value={clientInfo.projectCity}
                  onChange={(e) => onUpdateClientInfo({ projectCity: e.target.value })}
                  placeholder="الرياض"
                  className="w-full bg-stone-50 hover:bg-white focus:bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:ring-2 focus:ring-amber-500 outline-hidden transition"
                />
                <div className="flex items-center gap-1 mt-1.5">
                  {['الرياض', 'جدة', 'الدمام', 'مكة المكرمة', 'الخبر'].map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => onUpdateClientInfo({ projectCity: city })}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-600 font-medium"
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>

              {/* District */}
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1 flex items-center justify-between">
                  <span>الحي:</span>
                  <span className="text-[10px] font-mono text-stone-400">&#123;&#123;الحي&#125;&#125;</span>
                </label>
                <input
                  type="text"
                  value={clientInfo.district || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const updates: Partial<ClientInfo> = { district: val };
                    const autoZone = detectRiyadhZone(val, clientInfo.projectCity);
                    if (autoZone !== 'none' || !clientInfo.locationZone) {
                      updates.locationZone = autoZone;
                    }
                    onUpdateClientInfo(updates);
                  }}
                  placeholder=""
                  className="w-full bg-stone-50 hover:bg-white focus:bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:ring-2 focus:ring-amber-500 outline-hidden transition"
                />
              </div>

              {/* Riyadh Geographic Location Pricing Zone (Design & Supervision) */}
              <div className="sm:col-span-2 lg:col-span-3 bg-gradient-to-r from-amber-50/70 via-stone-50 to-orange-50/50 p-3 rounded-2xl border border-amber-200/90 shadow-2xs space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-amber-200/60 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-xs font-black text-stone-900">
                      نطاق تسعير موقع الحي في الرياض (قسم التصميم وقسم الإشراف):
                    </span>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-md">
                      تعديل جغرافي تلقائي
                    </span>
                  </div>
                  <span className="text-[10.5px] text-stone-500">
                    {clientInfo.locationZone && RIYADH_ZONE_CONFIGS[clientInfo.locationZone]
                      ? RIYADH_ZONE_CONFIGS[clientInfo.locationZone].description
                      : 'السعر الأساسي بدون تعديل جغرافي'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      {
                        id: 'north_center',
                        title: 'شمال / وسط الرياض',
                        percentBadge: '+20%',
                        sub: 'حطين، النرجس، الملقا، العليا...',
                        activeClass: 'bg-amber-500 text-stone-950 border-amber-600 shadow-xs ring-2 ring-amber-400/40',
                      },
                      {
                        id: 'east_west',
                        title: 'شرق / غرب الرياض',
                        percentBadge: '-20%',
                        sub: 'اليرموك، الروضة، طويق، لبن...',
                        activeClass: 'bg-blue-600 text-white border-blue-700 shadow-xs ring-2 ring-blue-400/40',
                      },
                      {
                        id: 'south',
                        title: 'جنوب الرياض',
                        percentBadge: '-40%',
                        sub: 'الشفا، العزيزية، الدار البيضاء...',
                        activeClass: 'bg-emerald-600 text-white border-emerald-700 shadow-xs ring-2 ring-emerald-400/40',
                      },
                      {
                        id: 'none',
                        title: 'بدون تعديل جغرافي',
                        percentBadge: '0%',
                        sub: 'السعر المعتمد الافتراضي',
                        activeClass: 'bg-stone-900 text-white border-stone-900 shadow-xs ring-2 ring-stone-400/40',
                      },
                    ] as const
                  ).map((zone) => {
                    const isSelected = (clientInfo.locationZone || 'none') === zone.id;
                    return (
                      <button
                        key={zone.id}
                        type="button"
                        onClick={() => onUpdateClientInfo({ locationZone: zone.id as RiyadhLocationZone })}
                        className={`p-2 rounded-xl border text-right transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? zone.activeClass
                            : 'bg-white hover:bg-stone-100 text-stone-800 border-stone-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-black">{zone.title}</span>
                          <span
                            className={`text-[10px] font-black px-1.5 py-0.2 rounded-md ${
                              isSelected
                                ? 'bg-black/20 text-current'
                                : zone.percentBadge.startsWith('+')
                                ? 'bg-amber-100 text-amber-900'
                                : zone.percentBadge.startsWith('-')
                                ? 'bg-emerald-100 text-emerald-900'
                                : 'bg-stone-100 text-stone-600'
                            }`}
                          >
                            {zone.percentBadge}
                          </span>
                        </div>
                        <span className={`text-[9.5px] truncate ${isSelected ? 'opacity-90' : 'text-stone-400'}`}>
                          {zone.sub}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Plot Number */}
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1 flex items-center justify-between">
                  <span>رقم القطعة:</span>
                  <span className="text-[10px] font-mono text-stone-400">&#123;&#123;رقم_القطعة&#125;&#125;</span>
                </label>
                <input
                  type="text"
                  value={clientInfo.plotNumber || ''}
                  onChange={(e) => onUpdateClientInfo({ plotNumber: e.target.value })}
                  placeholder=""
                  className="w-full bg-stone-50 hover:bg-white focus:bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:ring-2 focus:ring-amber-500 outline-hidden transition"
                />
              </div>

              {/* Plan Number */}
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1 flex items-center justify-between">
                  <span>رقم المخطط:</span>
                  <span className="text-[10px] font-mono text-stone-400">&#123;&#123;رقم_المخطط&#125;&#125;</span>
                </label>
                <input
                  type="text"
                  value={clientInfo.planNumber || ''}
                  onChange={(e) => onUpdateClientInfo({ planNumber: e.target.value })}
                  placeholder=""
                  className="w-full bg-stone-50 hover:bg-white focus:bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:ring-2 focus:ring-amber-500 outline-hidden transition"
                />
              </div>

              {/* Block Number */}
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1 flex items-center justify-between">
                  <span>رقم البلك:</span>
                  <span className="text-[10px] font-mono text-stone-400">&#123;&#123;رقم_البلك&#125;&#125;</span>
                </label>
                <input
                  type="text"
                  value={clientInfo.blockNumber || ''}
                  onChange={(e) => onUpdateClientInfo({ blockNumber: e.target.value })}
                  placeholder=""
                  className="w-full bg-stone-50 hover:bg-white focus:bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:ring-2 focus:ring-amber-500 outline-hidden transition"
                />
              </div>

              {/* Deed Number */}
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1 flex items-center justify-between">
                  <span>رقم الصك العقاري:</span>
                  <span className="text-[10px] font-mono text-stone-400">&#123;&#123;رقم_الصك&#125;&#125;</span>
                </label>
                <input
                  type="text"
                  value={clientInfo.deedNumber || ''}
                  onChange={(e) => onUpdateClientInfo({ deedNumber: e.target.value })}
                  placeholder=""
                  className="w-full bg-stone-50 hover:bg-white focus:bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-stone-900 focus:ring-2 focus:ring-amber-500 outline-hidden transition"
                />
              </div>

              {/* Deed Date */}
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1 flex items-center justify-between">
                  <span>تاريخ الصك:</span>
                  <span className="text-[10px] font-mono text-stone-400">&#123;&#123;تاريخ_الصك&#125;&#125;</span>
                </label>
                <input
                  type="text"
                  value={clientInfo.deedDate || ''}
                  onChange={(e) => onUpdateClientInfo({ deedDate: e.target.value })}
                  placeholder=""
                  className="w-full bg-stone-50 hover:bg-white focus:bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:ring-2 focus:ring-amber-500 outline-hidden transition"
                />
              </div>

              {/* Land Area (m²) */}
              <div>
                <label className="block text-[11px] font-bold text-amber-950 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-amber-900">
                    <Maximize2 className="w-3 h-3 text-amber-600" />
                    <span>مساحة الأرض (م²):</span>
                  </span>
                  <span className="text-[10px] font-mono text-stone-400">&#123;&#123;مساحة_الأرض&#125;&#125;</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={
                      clientInfo.landArea !== undefined && clientInfo.landArea !== null
                        ? (clientInfo.landArea === 0 ? '' : clientInfo.landArea)
                        : (calculatorArea ? calculatorArea : '')
                    }
                    onChange={(e) => {
                      const raw = e.target.value;
                      const num = raw === '' ? 0 : Number(raw);
                      handleLandAreaChange(num);
                    }}
                    placeholder="450"
                    className="w-full bg-amber-50/70 hover:bg-white focus:bg-white border-2 border-amber-400 rounded-xl px-3 py-2 text-xs font-black text-amber-950 focus:ring-2 focus:ring-amber-500 outline-hidden transition"
                  />
                  <span className="absolute left-3 top-2 text-xs font-bold text-stone-400 pointer-events-none">
                    م²
                  </span>
                </div>
                <div className="text-[10px] text-amber-700 mt-1 flex flex-col gap-1 font-medium">
                  <span>* مرتبطة تلقائياً بالمساحة الإجمالية ومسطح البناء</span>
                  {clientInfo.isDuplex && (
                    <div className="bg-amber-100 border border-amber-300 text-amber-950 px-2 py-0.5 rounded text-[10px] font-bold flex items-center justify-between">
                      <span>✓ فلل دوبلكس مفعلة: مساحة التسعير المحسوبة = {Math.round((clientInfo.landArea || calculatorArea || 0) / 2)} م² (نصف المساحة)</span>
                      <span className="font-mono text-amber-800">50%</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Estimated Total Built-up Area (مسطح البناء الإجمالي = مساحة الأرض × 1.68) */}
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-stone-800">
                    <Building className="w-3 h-3 text-amber-600" />
                    <span>مسطح البناء الإجمالي (م² تقديري):</span>
                  </span>
                  <span className="text-[10px] font-mono text-stone-400">&#123;&#123;مسطح_البناء&#125;&#125;</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={
                      clientInfo.buildingArea !== undefined && clientInfo.buildingArea !== null
                        ? (clientInfo.buildingArea === 0 ? '' : clientInfo.buildingArea)
                        : (clientInfo.landArea ? Math.round(clientInfo.landArea * 1.68) : '')
                    }
                    onChange={(e) => {
                      const raw = e.target.value;
                      const num = raw === '' ? 0 : Number(raw);
                      onUpdateClientInfo({ buildingArea: num });
                    }}
                    placeholder="756"
                    className="w-full bg-stone-50 hover:bg-white focus:bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:ring-2 focus:ring-amber-500 outline-hidden transition"
                  />
                  <span className="absolute left-3 top-2 text-xs font-bold text-stone-400 pointer-events-none">
                    م²
                  </span>
                </div>
                <div className="text-[10px] text-amber-700 mt-1 flex items-center justify-between gap-1 font-medium">
                  <span>* المعادل المعتمد: مساحة الأرض × 1.68</span>
                  {(clientInfo.landArea || calculatorArea || 0) > 0 && (
                    <span className="font-mono text-stone-600">
                      ({clientInfo.landArea || calculatorArea} × 1.68 = {Math.round((clientInfo.landArea || calculatorArea || 0) * 1.68)} م²)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Sub-card: Deed Borders & Restrictions (مستخرجة عبر الذكاء الاصطناعي) */}
            {(clientInfo.borders || clientInfo.deedRestrictions || clientInfo.deedNumber) && (
              <div className="mt-3 p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-amber-600" />
                    <span>بيانات الصك والحدود والأطوال (مستخرجة آلياً عبر الذكاء الاصطناعي)</span>
                  </span>
                  {onOpenAiAssistant && (
                    <button
                      type="button"
                      onClick={onOpenAiAssistant}
                      className="text-[11px] font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      <span>إعادة الفحص / تحديث من الصك</span>
                    </button>
                  )}
                </div>

                {clientInfo.deedRestrictions && (
                  <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-900 flex items-start gap-2 text-xs">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-black">قيود أو رهونات مسجلة على الصك: </span>
                      <span className="font-medium">{clientInfo.deedRestrictions}</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    أطوال وحدود الأرض (شمالاً، جنوباً، شرقاً، غرباً):
                  </label>
                  <input
                    type="text"
                    value={clientInfo.borders || ''}
                    onChange={(e) => onUpdateClientInfo({ borders: e.target.value })}
                    placeholder="مثال: شمالاً: قطعة 1051 بطول 25م | جنوباً: شارع عرض 15م بطول 25م..."
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-medium text-stone-800 focus:ring-2 focus:ring-amber-500 outline-hidden transition"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION C: Service Definition & Execution Terms */}
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <h4 className="text-xs font-black text-stone-800 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>نوع الخدمة، مدة التنفيذ وشروط العرض الموحد</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowAdvancedTerms(!showAdvancedTerms)}
                className="text-[11px] font-bold text-stone-600 hover:text-stone-900 flex items-center gap-1"
              >
                <span>{showAdvancedTerms ? 'إخفاء الشروط المتقدمة' : 'عرض الشروط المتقدمة'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvancedTerms ? 'rotate-180' : ''}`} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Service Type Description */}
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-stone-700 mb-1 flex items-center justify-between">
                  <span>نوع الخدمة الهندسية بالعرض (عنوان المقدمة):</span>
                  <span className="text-[10px] font-mono text-stone-400">&#123;&#123;نوع_الخدمة&#125;&#125;</span>
                </label>
                <input
                  type="text"
                  value={clientInfo.serviceType}
                  onChange={(e) => onUpdateClientInfo({ serviceType: e.target.value })}
                  placeholder="مثال: إصدار رخصة بناء وتصاميم هندسية"
                  className="w-full bg-stone-50 hover:bg-white focus:bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:ring-2 focus:ring-amber-500 outline-hidden transition"
                />

                {/* Quick Selection Buttons for Standard Services */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  {[
                    {
                      key: 'new_license' as DesignServiceType,
                      label: 'إصدار رخصة بناء وتصاميم هندسية',
                      short: 'رخصة بناء وتصاميم هندسية',
                    },
                    {
                      key: 'plan_design' as DesignServiceType,
                      label: 'تصميم مخططات هندسية',
                      short: 'تصميم مخططات',
                    },
                    {
                      key: 'renovation' as DesignServiceType,
                      label: 'رخصة ترميم مبنى وتصاميم هندسية',
                      short: 'ترميم مبنى وتصاميم',
                    },
                    {
                      key: 'as_built_mod' as DesignServiceType,
                      label: 'تصحيح وضع مبنى قائم وشهادة التحمل الإنشائي',
                      short: 'تصحيح وضع مبنى قائم',
                    },
                    {
                      key: 'component_mod' as DesignServiceType,
                      label: 'تعديل مكونات البناء وتعديل رخصة البناء',
                      short: 'تعديل مكونات',
                    },
                    {
                      key: 'demolition' as DesignServiceType,
                      label: 'إصدار رخصة هدم للمبنى',
                      short: 'رخصة هدم',
                    },
                  ].map((srv) => {
                    const isActive =
                      calculatorServiceType === srv.key || clientInfo.serviceType === srv.label;
                    return (
                      <button
                        key={srv.key}
                        type="button"
                        onClick={() => {
                          if (onServiceTypeChange) {
                            onServiceTypeChange(srv.key);
                          }
                          const currentScope = clientInfo.scopeFlags || ({} as any);
                          const updatedScope = {
                            ...currentScope,
                            buildingLicense:
                              srv.key === 'as_built_mod' || srv.key === 'plan_design'
                                ? false
                                : srv.key === 'new_license' || srv.key === 'renovation'
                                ? true
                                : currentScope.buildingLicense,
                            survey: srv.key === 'plan_design' ? false : currentScope.survey,
                            architectural: srv.key === 'plan_design' ? true : currentScope.architectural,
                            structural: srv.key === 'plan_design' ? true : currentScope.structural,
                            electrical: srv.key === 'plan_design' ? true : currentScope.electrical,
                            hvac: srv.key === 'plan_design' ? true : currentScope.hvac,
                            plumbing: srv.key === 'plan_design' ? true : currentScope.plumbing,
                            supervision: srv.key === 'plan_design' ? false : currentScope.supervision,
                            asBuiltCorrection: srv.key === 'as_built_mod',
                            modifyComponents: srv.key === 'component_mod',
                          };
                          const currentExclusions = clientInfo.exclusions || ({} as any);
                          onUpdateClientInfo({
                            serviceType: srv.label,
                            scopeFlags: updatedScope,
                            ...(srv.key === 'plan_design' && {
                              exclusions: {
                                ...currentExclusions,
                                excludeSupervision: true,
                              },
                            }),
                          });
                        }}
                        className={`text-[10px] px-2.5 py-1 rounded-lg font-bold transition border ${
                          isActive
                            ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                            : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200'
                        }`}
                        title={srv.label}
                      >
                        {srv.short}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Execution Duration Days */}
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1 flex items-center justify-between">
                  <span>مدة التنفيذ (يوم عمل):</span>
                  <span className="text-[10px] font-mono text-stone-400">&#123;&#123;مدة_التنفيذ&#125;&#125;</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={clientInfo.executionDurationDays || 45}
                    onChange={(e) =>
                      onUpdateClientInfo({ executionDurationDays: Number(e.target.value) || 30 })
                    }
                    className="w-full bg-stone-50 hover:bg-white focus:bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:ring-2 focus:ring-amber-500 outline-hidden transition"
                  />
                  <span className="absolute left-3 top-2 text-xs font-bold text-stone-400 pointer-events-none">
                    يوم
                  </span>
                </div>
              </div>
            </div>

            {/* Advanced Terms toggleable */}
            {showAdvancedTerms && (
              <div className="pt-3 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Revisions Allowed */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1 flex items-center justify-between">
                    <span>عدد التعديلات المشمولة:</span>
                    <span className="text-[10px] font-mono text-stone-400">&#123;&#123;عدد_التعديلات&#125;&#125;</span>
                  </label>
                  <input
                    type="text"
                    value={clientInfo.revisionCountText}
                    onChange={(e) => onUpdateClientInfo({ revisionCountText: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>

                {/* Offer Validity */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1 flex items-center justify-between">
                    <span>مدة صلاحية العرض:</span>
                    <span className="text-[10px] font-mono text-stone-400">&#123;&#123;صلاحية_العرض&#125;&#125;</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="180"
                      value={clientInfo.validityDays || 30}
                      onChange={(e) =>
                        onUpdateClientInfo({ validityDays: Number(e.target.value) || 30 })
                      }
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-hidden"
                    />
                    <span className="absolute left-3 top-2 text-xs font-bold text-stone-400 pointer-events-none">
                      يوم
                    </span>
                  </div>
                </div>

                {/* Start Date Description */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-stone-700 mb-1 flex items-center justify-between">
                    <span>تاريخ بدء المدة التعاقدية:</span>
                    <span className="text-[10px] font-mono text-stone-400">&#123;&#123;بداية_المدة&#125;&#125;</span>
                  </label>
                  <input
                    type="text"
                    value={clientInfo.startDateNotice}
                    onChange={(e) => onUpdateClientInfo({ startDateNotice: e.target.value })}
                    placeholder="من سداد الدفعة واعتماد المخططات المعمارية والواجهات"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>

                {/* Exclusions Section (سابعاً) */}
                <div className="sm:col-span-2 pt-2 border-t border-stone-200 space-y-2">
                  <span className="block text-[11px] font-bold text-stone-700">
                    سابعًا: الأعمال غير المشمولة (&#123;&#123;IF:رسوم_حكومية_غير_مشمولة&#125;&#125; و &#123;&#123;استثناءات_إضافية&#125;&#125;):
                  </span>
                  <label className="flex items-center gap-2 p-2 bg-stone-50 rounded-xl border border-stone-200 cursor-pointer">
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
                    <span className="text-xs text-stone-800">
                      لا تشمل الأتعاب الرسوم الحكومية أو رسوم الجهات ذات العلاقة.
                    </span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-amber-50/70 rounded-xl border border-amber-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={clientInfo.exclusions?.excludeSupervision ?? !clientInfo.scopeFlags?.supervision}
                      onChange={(e) => {
                        const isExcluded = e.target.checked;
                        const updatedExclusions = {
                          ...clientInfo.exclusions,
                          excludeSupervision: isExcluded,
                        };
                        const updatedScope = {
                          ...(clientInfo.scopeFlags || ({} as any)),
                          supervision: !isExcluded,
                        };
                        onUpdateClientInfo({
                          exclusions: updatedExclusions,
                          scopeFlags: updatedScope,
                        });
                      }}
                      className="w-4 h-4 accent-amber-600 rounded"
                    />
                    <span className="text-xs text-stone-900 font-bold">
                      بند (بدون إشراف): تأكيد صريح في خانة (رابعاً) بأن العرض لا يشمل الإشراف الهندسي الميداني.
                    </span>
                  </label>

                  <input
                    type="text"
                    placeholder="استثناءات إضافية {{استثناءات_إضافية}}..."
                    value={clientInfo.exclusions?.customExclusions || ''}
                    onChange={(e) => {
                      const updated = {
                        ...clientInfo.exclusions,
                        customExclusions: e.target.value,
                      };
                      onUpdateClientInfo({ exclusions: updated });
                    }}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
