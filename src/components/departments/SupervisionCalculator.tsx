import React, { useState } from 'react';
import { QuotationItem, ClientInfo, BuildingType } from '../../types';
import {
  SUPERVISION_DEPARTMENT_ITEMS,
  SupervisionItemDef,
  getBaladySupervisionTierPrice,
  RIYADH_ZONE_CONFIGS,
  getRiyadhZoneMultiplier,
} from '../../data/pricingData';
import { formatSAR } from '../../utils/formatters';
import { DiscountAndTaxSection } from '../common/DiscountAndTaxSection';
import {
  ClipboardCheck,
  Building2,
  Eye,
  Briefcase,
  AlertTriangle,
  Plus,
  Check,
  CheckCircle2,
  Calculator,
  Sliders,
  Sparkles,
  Info,
  Calendar,
  Layers,
  MapPin,
  Building,
  Landmark,
} from 'lucide-react';

interface SupervisionCalculatorProps {
  onAddItem: (item: QuotationItem) => void;
  clientInfo?: ClientInfo;
  onUpdateClientInfo?: (info: Partial<ClientInfo>) => void;
}

export const SupervisionCalculator: React.FC<SupervisionCalculatorProps> = ({
  onAddItem,
  clientInfo,
  onUpdateClientInfo,
}) => {
  // Selected service among the 4 items
  const [selectedItemId, setSelectedItemId] = useState<
    'balady' | 'general' | 'project_management' | 'damage_report'
  >('balady');

  // Common parameters
  const [buildingType, setBuildingType] = useState<BuildingType>(
    clientInfo?.buildingType?.includes('عمارة')
      ? 'residential'
      : clientInfo?.buildingType?.includes('تجاري')
      ? 'commercial'
      : 'villa'
  );
  const [landArea, setLandArea] = useState<number>(() => clientInfo?.landArea || 600);
  const [projectCity, setProjectCity] = useState<string>(() => clientInfo?.projectCity || 'الرياض');

  // Helper functions for dynamic rates based on building type
  const getDefaultGeneralMonthlyRate = (type: BuildingType) => {
    if (type === 'commercial' || type === 'hotel' || type === 'gas_station' || type === 'factory' || type === 'warehouse_workshop') return 18000;
    if (type === 'residential') return 16000;
    return 12000; // villa / rest_house
  };

  const getDefaultPmRate = (type: BuildingType) => {
    if (type === 'commercial' || type === 'hotel' || type === 'gas_station' || type === 'factory' || type === 'warehouse_workshop') return 25000;
    if (type === 'residential') return 22000;
    return 18000; // villa / rest_house
  };

  // Item 1: Balady Supervision state
  const [baladyMode, setBaladyMode] = useState<'tier' | 'per_stage' | 'custom'>('tier');
  const [baladyStageCount, setBaladyStageCount] = useState<number>(7); // 7 standard inspection stages
  const [baladyRatePerStage, setBaladyRatePerStage] = useState<number>(2000);
  const [customBaladyPrice, setCustomBaladyPrice] = useState<number | null>(null);

  // Item 2: General Supervision state
  const [generalMode, setGeneralMode] = useState<'monthly' | 'bone_stage' | 'finish_stage' | 'per_visit' | 'custom'>('monthly');
  const [generalMonths, setGeneralMonths] = useState<number>(1);
  const [generalMonthlyRate, setGeneralMonthlyRate] = useState<number>(() => getDefaultGeneralMonthlyRate(buildingType));
  const [generalVisitsCount, setGeneralVisitsCount] = useState<number>(15);
  const [generalVisitRate, setGeneralVisitRate] = useState<number>(800);
  const [customGeneralPrice, setCustomGeneralPrice] = useState<number | null>(null);

  // Item 3: Project Management state
  const [pmMode, setPmMode] = useState<'monthly_pm' | 'lump_sum_pm' | 'percentage_pm' | 'custom'>('monthly_pm');
  const [pmMonths, setPmMonths] = useState<number>(1);
  const [pmMonthlyRate, setPmMonthlyRate] = useState<number>(() => getDefaultPmRate(buildingType));
  const [pmProjectCost, setPmProjectCost] = useState<number>(800000);
  const [pmPercentage, setPmPercentage] = useState<number>(5);
  const [customPmPrice, setCustomPmPrice] = useState<number | null>(null);

  // Item 4: Damage Report state
  const [damageMode, setDamageMode] = useState<'villa_report' | 'building_report' | 'commercial_report' | 'advanced_ndt' | 'custom'>('villa_report');
  const [damageScope, setDamageScope] = useState<string>('فحص شامل للتصدعات والشروخ الإنشائية والهبوط وعزل الأسطح');
  const [customDamagePrice, setCustomDamagePrice] = useState<number | null>(null);

  // Update rates when buildingType changes if not customized
  React.useEffect(() => {
    if (customGeneralPrice === null) {
      setGeneralMonthlyRate(getDefaultGeneralMonthlyRate(buildingType));
    }
    if (customPmPrice === null) {
      setPmMonthlyRate(getDefaultPmRate(buildingType));
    }
  }, [buildingType]);

  // Sync landArea with clientInfo.landArea if updated externally
  React.useEffect(() => {
    if (clientInfo?.landArea !== undefined && clientInfo.landArea !== landArea) {
      setLandArea(clientInfo.landArea);
    }
  }, [clientInfo?.landArea]);

  // Sync buildingType with clientInfo.buildingType if updated externally
  React.useEffect(() => {
    if (clientInfo?.buildingType) {
      const b = clientInfo.buildingType;
      let mappedType: BuildingType = 'villa';
      if (b.includes('مصنع')) mappedType = 'factory';
      else if (b.includes('ورش') || b.includes('مستودع')) mappedType = 'warehouse_workshop';
      else if (b.includes('فندق') || b.includes('ضيافة')) mappedType = 'hotel';
      else if (b.includes('محطة')) mappedType = 'gas_station';
      else if (b.includes('استراحة') || b.includes('شاليه')) mappedType = 'rest_house';
      else if (b.includes('تجاري')) mappedType = 'commercial';
      else if (b.includes('عمارة')) mappedType = 'residential';
      if (mappedType !== buildingType) {
        setBuildingType(mappedType);
      }
    }
  }, [clientInfo?.buildingType]);

  // Sync projectCity with clientInfo.projectCity
  React.useEffect(() => {
    if (clientInfo?.projectCity && clientInfo.projectCity !== projectCity) {
      setProjectCity(clientInfo.projectCity);
    }
  }, [clientInfo?.projectCity]);

  // Active item definition
  const activeDef: SupervisionItemDef =
    SUPERVISION_DEPARTMENT_ITEMS.find((item) => item.id === selectedItemId) ||
    SUPERVISION_DEPARTMENT_ITEMS[0];

  // Price calculations
  // 1. Balady
  let calculatedBaladyPrice = 0;
  const baladyTierResult = getBaladySupervisionTierPrice(landArea, buildingType);
  if (customBaladyPrice !== null) {
    calculatedBaladyPrice = customBaladyPrice;
  } else if (baladyMode === 'tier') {
    calculatedBaladyPrice = baladyTierResult.price;
  } else if (baladyMode === 'per_stage') {
    calculatedBaladyPrice = baladyStageCount * baladyRatePerStage;
  } else {
    calculatedBaladyPrice = 20000;
  }

  // 2. General
  let calculatedGeneralPrice = 0;
  if (customGeneralPrice !== null) {
    calculatedGeneralPrice = customGeneralPrice;
  } else if (generalMode === 'monthly') {
    calculatedGeneralPrice = generalMonths * generalMonthlyRate;
  } else if (generalMode === 'bone_stage') {
    calculatedGeneralPrice = 16000;
  } else if (generalMode === 'finish_stage') {
    calculatedGeneralPrice = 14000;
  } else if (generalMode === 'per_visit') {
    calculatedGeneralPrice = generalVisitsCount * generalVisitRate;
  } else {
    calculatedGeneralPrice = 20000;
  }

  // 3. Project Management
  let calculatedPmPrice = 0;
  if (customPmPrice !== null) {
    calculatedPmPrice = customPmPrice;
  } else if (pmMode === 'monthly_pm') {
    calculatedPmPrice = pmMonths * pmMonthlyRate;
  } else if (pmMode === 'lump_sum_pm') {
    calculatedPmPrice = getDefaultPmRate(buildingType);
  } else if (pmMode === 'percentage_pm') {
    calculatedPmPrice = Math.round((pmProjectCost * pmPercentage) / 100);
  } else {
    calculatedPmPrice = getDefaultPmRate(buildingType);
  }

  // 4. Damage Report (1,500 - 3,000 ر.س)
  let calculatedDamagePrice = 0;
  if (customDamagePrice !== null) {
    calculatedDamagePrice = customDamagePrice;
  } else if (damageMode === 'villa_report') {
    calculatedDamagePrice = 1500;
  } else if (damageMode === 'building_report') {
    calculatedDamagePrice = 2200;
  } else if (damageMode === 'commercial_report') {
    calculatedDamagePrice = 2800;
  } else if (damageMode === 'advanced_ndt') {
    calculatedDamagePrice = 3000;
  } else {
    calculatedDamagePrice = 2000;
  }

  // Current active calculated price
  const activeCalculatedPrice =
    selectedItemId === 'balady'
      ? calculatedBaladyPrice
      : selectedItemId === 'general'
      ? calculatedGeneralPrice
      : selectedItemId === 'project_management'
      ? calculatedPmPrice
      : calculatedDamagePrice;

  // Riyadh Geographic Location Zone Adjustment (+20% North/Center, -20% East/West, -40% South)
  const zoneConfig = RIYADH_ZONE_CONFIGS[clientInfo?.locationZone || 'none'];
  const zoneMultiplier = zoneConfig.multiplier;
  const finalPriceWithZone = Math.round(activeCalculatedPrice * zoneMultiplier);

  // Add Item Handler
  const handleAddItemToQuote = () => {
    let title = '';
    let details: string[] = [];
    let notes = '';

    const buildingLabel =
      buildingType === 'villa'
        ? 'فيلا سكنية'
        : buildingType === 'residential'
        ? 'عمارة سكنية'
        : 'مبنى تجاري';

    if (selectedItemId === 'balady') {
      title = 'إشراف بلدية (منصة بلدي وكود البناء السعودي)';
      details = [
        `نطاق الإشراف: اعتماد ومتابعة مراحل البناء ورفع التقارير الميدانية عبر منصة بلدي`,
        baladyMode === 'tier'
          ? `باقة مقطوعة حسب شريحة المساحة: ${baladyTierResult.tierLabel} (${landArea} م²)`
          : baladyMode === 'per_stage'
          ? `تسعير حسب مراحل الصب: ${baladyStageCount} مراحل إلزامية (${formatSAR(baladyRatePerStage)}/مرحلة)`
          : `سعر إشراف بلدي مخصص ومعتمد`,
        `نوع العقار المستهدف: ${buildingLabel} في ${projectCity}`,
        `المخرجات: زيارات استلام الصب، مطابقة الكود SBC، وإصدار شهادة الإشراف النهائية لرخصة الإشغال`,
      ];
      notes = `إشراف بلدي ${baladyTierResult.tierLabel} في ${projectCity}`;
    } else if (selectedItemId === 'general') {
      title = 'إشراف هندسي عام (استشاري شامل ومستمر)';
      details = [
        `نطاق الإشراف: متابعة استشارية هندسية شاملة للموقع وضمان جودة المقاولين والتنفيذ`,
        generalMode === 'monthly'
          ? `إشراف شهري: مدة ${generalMonths} أشهر (${formatSAR(generalMonthlyRate)}/شهرياً)`
          : generalMode === 'bone_stage'
          ? `باقة مقطوعة كاملة لمرحلة الهيكل الإنشائي والعظم`
          : generalMode === 'finish_stage'
          ? `باقة مقطوعة كاملة لمرحلة التشطيبات والكسوات والأنظمة`
          : generalMode === 'per_visit'
          ? `تسعير بالزيارة: ${generalVisitsCount} زيارات ميدانية (${formatSAR(generalVisitRate)}/زيارة)`
          : `سعر إشراف عام مخصص ومعتمد`,
        `نوع المشروع: ${buildingLabel} - ${projectCity}`,
        `المخرجات: محاضر استلام موقعية، مطابقة المخططات وجودة الخرسانات والعوازل والسباكة والكهرباء`,
      ];
      notes =
        generalMode === 'monthly'
          ? `إشراف استشاري ${generalMonths} أشهر`
          : `إشراف عام على التنفيذ`;
    } else if (selectedItemId === 'project_management') {
      title = 'إدارة مشروع هندسي (Project Management)';
      details = [
        `نطاق الإدارة: إدارة كاملة للمشروع وضبط الجدول الزمني والتكاليف والمقاولين وجودة العمل`,
        pmMode === 'monthly_pm'
          ? `إدارة شهرية متكاملة: مدة ${pmMonths} أشهر (${formatSAR(pmMonthlyRate)}/شهرياً)`
          : pmMode === 'lump_sum_pm'
          ? `إدارة مقطوعة شاملة لكامل مدة تنفيذ المشروع (${buildingLabel})`
          : pmMode === 'percentage_pm'
          ? `نسبة مئوية ${pmPercentage}% من تكلفة المشروع التقديرية (${formatSAR(pmProjectCost)})`
          : `أتعاب إدارة مشروع مخصصة ومعتمدة`,
        `التحكم ومراقبة التكاليف: تدقيق المستخلصات الشهرية وفواتير الموردين والمسار الحرج CPM`,
        `المخرجات: لوحة متابعة نسب الإنجاز، إدارة المقاولين، اجتماعات دورية، وتقارير تنفيذية شاملة`,
      ];
      notes =
        pmMode === 'monthly_pm'
          ? `إدارة مشروع ${pmMonths} أشهر`
          : `إدارة مشروع هندسي متكامل`;
    } else {
      title = 'تقرير أضرار وفحص مباني (تقرير استشاري معتمد)';
      details = [
        `نطاق الفحص: ${damageScope}`,
        damageMode === 'villa_report'
          ? `فحص ومعاينة هندسية لفيلا سكنية خاصة`
          : damageMode === 'building_report'
          ? `فحص ومعاينة هندسية لعمارة سكنية / مجمع`
          : damageMode === 'commercial_report'
          ? `فحص ومعاينة هندسية لمنشأة تجارية / مبنى خدمي`
          : damageMode === 'advanced_ndt'
          ? `فحص أضرار متقدم مع اختبارات غير إتلافية بالموقع (سكانر ومطرقة شميدت)`
          : `تقرير أضرار وفحص مخصص ومعتمد`,
        `العقار المستهدف: ${buildingLabel} بمدينة ${projectCity}`,
        `المخرجات: تقرير هندسي استشاري معتمد ومختوم يشمل توصيف الأسباب والحلول وتوصيات الترميم والتدعيم`,
      ];
      notes = `تقرير أضرار معتمد - ${buildingLabel} في ${projectCity}`;
    }

    if (clientInfo?.locationZone && clientInfo.locationZone !== 'none') {
      details.push(
        `نطاق تسعير موقع الحي: ${zoneConfig.label} (${zoneConfig.adjustmentPercent > 0 ? `+${zoneConfig.adjustmentPercent}% زيادة` : `${zoneConfig.adjustmentPercent}% تخفيض`})`
      );
    }

    const newItem: QuotationItem = {
      id: `sup-${Date.now()}`,
      departmentId: 'supervision',
      departmentName: 'قسم الإشراف وإدارة المشاريع',
      title,
      buildingTypeLabel: buildingLabel,
      area: selectedItemId === 'balady' ? landArea : undefined,
      details,
      basePrice: finalPriceWithZone,
      totalPrice: finalPriceWithZone,
      notes,
    };

    onAddItem(newItem);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1.5">
              <ClipboardCheck className="w-3.5 h-3.5 text-amber-700" />
              <span>قسم الإشراف وإدارة المشاريع</span>
            </span>
            {clientInfo?.locationZone && clientInfo.locationZone !== 'none' && (
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${zoneConfig.badgeClass}`}
              >
                موقع الحي: {zoneConfig.label}
              </span>
            )}
            <span className="text-xs text-stone-500 hidden sm:inline">
              كود البناء السعودي ومنصة بلدي مع التقارير الفنية المعتمدة
            </span>
          </div>
          <h2 className="text-xl font-black text-stone-900 mt-1.5">
            تسعير خدمات الإشراف الهندسي، إدارة المشاريع، وتقارير الأضرار
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            اختر أحد البنود الأربعة المعتمدة: إشراف بلدية، إشراف عام، إدارة مشروع، أو تقرير أضرار مع ضبط خيارات الدفع والاحتساب.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAddItemToQuote}
            className="w-full md:w-auto bg-stone-900 hover:bg-stone-800 text-amber-400 border border-amber-500/40 px-5 py-2.5 rounded-xl font-black text-sm shadow flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>إضافة البند للعرض ({formatSAR(finalPriceWithZone)})</span>
          </button>
        </div>
      </div>

      {/* Main 4 Items Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {SUPERVISION_DEPARTMENT_ITEMS.map((item) => {
          const isSelected = selectedItemId === item.id;
          let icon = <ClipboardCheck className="w-5 h-5 text-amber-500" />;
          if (item.id === 'balady') icon = <Landmark className="w-5 h-5 text-amber-500" />;
          if (item.id === 'general') icon = <Eye className="w-5 h-5 text-amber-500" />;
          if (item.id === 'project_management') icon = <Briefcase className="w-5 h-5 text-amber-500" />;
          if (item.id === 'damage_report') icon = <AlertTriangle className="w-5 h-5 text-amber-500" />;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedItemId(item.id)}
              className={`p-4 rounded-2xl border text-right transition-all flex flex-col justify-between text-stone-900 ${
                isSelected
                  ? 'bg-stone-900 text-white border-stone-900 shadow-md ring-2 ring-amber-500/40'
                  : 'bg-white hover:bg-stone-50 text-stone-800 border-stone-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isSelected ? 'bg-amber-400/20 text-amber-400' : 'bg-amber-50 text-amber-600'
                    }`}
                  >
                    {icon}
                  </div>
                  {isSelected && (
                    <span className="text-[10px] bg-amber-400 text-stone-950 font-black px-2 py-0.5 rounded-full">
                      البند النشط
                    </span>
                  )}
                </div>
                <div className="font-black text-sm">{item.shortName}</div>
                <p
                  className={`text-[11px] mt-1 line-clamp-2 leading-relaxed ${
                    isSelected ? 'text-stone-300' : 'text-stone-500'
                  }`}
                >
                  {item.tagline}
                </p>
              </div>

              <div className="mt-3 pt-3 border-t border-stone-100/20 flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-400">
                  {item.id === 'balady' && 'من 16,000 ريال'}
                  {item.id === 'general' && 'من 4,000 ريال/شهر'}
                  {item.id === 'project_management' && 'من 6,000 ريال/شهر'}
                  {item.id === 'damage_report' && 'من 3,500 ريال'}
                </span>
                <span
                  className={`text-[10px] font-bold ${
                    isSelected ? 'text-stone-400' : 'text-stone-500'
                  }`}
                >
                  خيارات متعددة
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Item Configuration & Calculation Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Parameters & Pricing Modes */}
        <div className="lg:col-span-8 space-y-6">
          {/* General Project Context (City / Building Type / Area) */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-sm font-black text-stone-800 flex items-center gap-2">
                <Building className="w-4 h-4 text-amber-500" />
                <span>بيانات المشروع والعقار المستهدف</span>
              </h3>
              <span className="text-[11px] text-stone-500">تحديث تلقائي لحسابات البند</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Building Type */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  نوع العقار:
                </label>
                <div className="flex flex-wrap gap-1 bg-stone-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setBuildingType('villa');
                      if (onUpdateClientInfo) onUpdateClientInfo({ buildingType: 'فيلا سكنية', projectTitle: 'مشروع فيلا سكنية' });
                    }}
                    className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition ${
                      buildingType === 'villa'
                        ? 'bg-stone-900 text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    فيلا
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBuildingType('residential');
                      if (onUpdateClientInfo) onUpdateClientInfo({ buildingType: 'عمارة سكنية', projectTitle: 'مشروع عمارة سكنية' });
                    }}
                    className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition ${
                      buildingType === 'residential'
                        ? 'bg-stone-900 text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    عمارة سكنية
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBuildingType('commercial');
                      if (onUpdateClientInfo) onUpdateClientInfo({ buildingType: 'مبنى تجاري', projectTitle: 'مشروع مبنى تجاري' });
                    }}
                    className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition ${
                      buildingType === 'commercial'
                        ? 'bg-stone-900 text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    تجاري
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBuildingType('rest_house');
                      if (onUpdateClientInfo) onUpdateClientInfo({ buildingType: 'استراحة / شاليهات خاصة', projectTitle: 'مشروع استراحة / شاليهات خاصة' });
                    }}
                    className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition ${
                      buildingType === 'rest_house'
                        ? 'bg-[#433c71] text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    استراحات
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBuildingType('hotel');
                      if (onUpdateClientInfo) onUpdateClientInfo({ buildingType: 'فندق / ضيافة', projectTitle: 'مشروع فندق / ضيافة' });
                    }}
                    className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition ${
                      buildingType === 'hotel'
                        ? 'bg-indigo-900 text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    فنادق
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBuildingType('gas_station');
                      if (onUpdateClientInfo) onUpdateClientInfo({ buildingType: 'محطة وقود', projectTitle: 'مشروع محطة وقود' });
                    }}
                    className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition ${
                      buildingType === 'gas_station'
                        ? 'bg-red-900 text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    محطات وقود
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBuildingType('factory');
                      if (onUpdateClientInfo) onUpdateClientInfo({ buildingType: 'مصنع', projectTitle: 'مشروع مصنع' });
                    }}
                    className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition ${
                      buildingType === 'factory'
                        ? 'bg-stone-900 text-amber-400 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    مصانع
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBuildingType('warehouse_workshop');
                      if (onUpdateClientInfo) onUpdateClientInfo({ buildingType: 'ورش ومستودعات', projectTitle: 'مشروع ورش ومستودعات' });
                    }}
                    className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition ${
                      buildingType === 'warehouse_workshop'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    ورش ومستودعات
                  </button>
                </div>
              </div>

              {/* Area */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  مساحة الأرض / البناء (م²):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="50"
                    value={landArea}
                    onChange={(e) => {
                      const val = Math.max(1, Number(e.target.value) || 1);
                      setLandArea(val);
                      if (onUpdateClientInfo) onUpdateClientInfo({ landArea: val });
                    }}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                  <span className="text-xs text-stone-500 font-bold whitespace-nowrap">م²</span>
                </div>
              </div>

              {/* City */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  مدينة المشروع:
                </label>
                <input
                  type="text"
                  value={projectCity}
                  onChange={(e) => {
                    setProjectCity(e.target.value);
                    if (onUpdateClientInfo) onUpdateClientInfo({ projectCity: e.target.value });
                  }}
                  placeholder="الرياض، جدة، الشرقية..."
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* ITEM 1: BALADY SUPERVISION */}
          {selectedItemId === 'balady' && (
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-5">
              <div>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                  البند الأول: إشراف بلدية
                </span>
                <h3 className="text-base font-black text-stone-900 mt-1">
                  نظام منصة بلدي والامتثال لكود البناء السعودي
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  إشراف معتمد لمراحل الهيكل الإنشائي ورفع تقارير التفتيش وإصدار شهادة الإشراف لرخصة الإشغال.
                </p>
              </div>

              {/* Pricing Mode Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setBaladyMode('tier');
                    setCustomBaladyPrice(null);
                  }}
                  className={`p-3 rounded-xl border text-right transition ${
                    baladyMode === 'tier'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-950 font-bold'
                      : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <div className="text-xs font-bold">شرائح المساحة (باقة مقطوعة)</div>
                  <div className="text-[11px] text-stone-500 mt-1">
                    الشريحة الحالية: {baladyTierResult.tierLabel}
                  </div>
                  <div className="text-xs font-black text-amber-700 mt-1">
                    {formatSAR(baladyTierResult.price)}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setBaladyMode('per_stage');
                    setCustomBaladyPrice(null);
                  }}
                  className={`p-3 rounded-xl border text-right transition ${
                    baladyMode === 'per_stage'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-950 font-bold'
                      : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <div className="text-xs font-bold">تسعير بمراحل الصب الإلزامية</div>
                  <div className="text-[11px] text-stone-500 mt-1">
                    {baladyStageCount} مراحل صب لبلدي
                  </div>
                  <div className="text-xs font-black text-amber-700 mt-1">
                    {formatSAR(baladyStageCount * baladyRatePerStage)}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setBaladyMode('custom');
                    if (customBaladyPrice === null) setCustomBaladyPrice(baladyTierResult.price);
                  }}
                  className={`p-3 rounded-xl border text-right transition ${
                    baladyMode === 'custom'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-950 font-bold'
                      : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <div className="text-xs font-bold">تحديد سعر مخصص يدوياً</div>
                  <div className="text-[11px] text-stone-500 mt-1">حرية تعديل المبلغ مباشرة</div>
                  <div className="text-xs font-black text-amber-700 mt-1">
                    {formatSAR(customBaladyPrice || baladyTierResult.price)}
                  </div>
                </button>
              </div>

              {/* Mode-specific Controls */}
              {baladyMode === 'tier' && (
                <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-amber-600" />
                      <span>
                        شرائح المساحة المعتمدة لباقة الإشراف المقطوعة (
                        {buildingType === 'villa'
                          ? 'فلل سكنية'
                          : buildingType === 'commercial'
                          ? 'مباني تجارية'
                          : 'عمائر ومباني سكنية'}
                        ):
                      </span>
                    </span>
                    <span className="text-[10px] bg-amber-200/80 text-amber-900 font-bold px-2 py-0.5 rounded-md">
                      المساحة المحددة: {landArea} م²
                    </span>
                  </div>

                  {buildingType === 'villa' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setLandArea(400);
                          if (onUpdateClientInfo) onUpdateClientInfo({ landArea: 400 });
                        }}
                        className={`p-3 rounded-xl border text-right transition flex flex-col justify-between gap-1.5 ${
                          landArea <= 500
                            ? 'bg-amber-500 text-stone-950 border-amber-600 shadow-sm font-bold ring-2 ring-amber-400'
                            : 'bg-white text-stone-700 border-amber-200 hover:bg-amber-100/60'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-bold">شريحة 0 - 500 م²</span>
                          {landArea <= 500 && (
                            <span className="text-[10px] bg-stone-900 text-amber-400 px-1.5 py-0.5 rounded-full font-black">
                              نشطة
                            </span>
                          )}
                        </div>
                        <div className="text-base font-black">16,000 ريال</div>
                        <div className="text-[10px] opacity-85">للفلل حتى 500 م² مسطح</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setLandArea(750);
                          if (onUpdateClientInfo) onUpdateClientInfo({ landArea: 750 });
                        }}
                        className={`p-3 rounded-xl border text-right transition flex flex-col justify-between gap-1.5 ${
                          landArea > 500 && landArea <= 1000
                            ? 'bg-amber-500 text-stone-950 border-amber-600 shadow-sm font-bold ring-2 ring-amber-400'
                            : 'bg-white text-stone-700 border-amber-200 hover:bg-amber-100/60'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-bold">شريحة 500 - 1000 م²</span>
                          {landArea > 500 && landArea <= 1000 && (
                            <span className="text-[10px] bg-stone-900 text-amber-400 px-1.5 py-0.5 rounded-full font-black">
                              نشطة
                            </span>
                          )}
                        </div>
                        <div className="text-base font-black">20,000 ريال</div>
                        <div className="text-[10px] opacity-85">للفلل من 500 إلى 1000 م²</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setLandArea(1200);
                          if (onUpdateClientInfo) onUpdateClientInfo({ landArea: 1200 });
                        }}
                        className={`p-3 rounded-xl border text-right transition flex flex-col justify-between gap-1.5 ${
                          landArea > 1000
                            ? 'bg-amber-500 text-stone-950 border-amber-600 shadow-sm font-bold ring-2 ring-amber-400'
                            : 'bg-white text-stone-700 border-amber-200 hover:bg-amber-100/60'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-bold">شريحة أكبر من 1000 م² (&gt;1000)</span>
                          {landArea > 1000 && (
                            <span className="text-[10px] bg-stone-900 text-amber-400 px-1.5 py-0.5 rounded-full font-black">
                              نشطة
                            </span>
                          )}
                        </div>
                        <div className="text-base font-black">25,000 ريال</div>
                        <div className="text-[10px] opacity-85">للفلل أكبر من 1000 م²</div>
                      </button>
                    </div>
                  ) : buildingType === 'commercial' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setLandArea(400);
                          if (onUpdateClientInfo) onUpdateClientInfo({ landArea: 400 });
                        }}
                        className={`p-3 rounded-xl border text-right transition flex flex-col justify-between gap-1.5 ${
                          landArea <= 500
                            ? 'bg-amber-500 text-stone-950 border-amber-600 shadow-sm font-bold ring-2 ring-amber-400'
                            : 'bg-white text-stone-700 border-amber-200 hover:bg-amber-100/60'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-bold">شريحة 0 - 500 م²</span>
                          {landArea <= 500 && (
                            <span className="text-[10px] bg-stone-900 text-amber-400 px-1.5 py-0.5 rounded-full font-black">
                              نشطة
                            </span>
                          )}
                        </div>
                        <div className="text-base font-black">25,000 ريال</div>
                        <div className="text-[10px] opacity-85">للمباني التجارية حتى 500 م²</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setLandArea(750);
                          if (onUpdateClientInfo) onUpdateClientInfo({ landArea: 750 });
                        }}
                        className={`p-3 rounded-xl border text-right transition flex flex-col justify-between gap-1.5 ${
                          landArea > 500 && landArea <= 1000
                            ? 'bg-amber-500 text-stone-950 border-amber-600 shadow-sm font-bold ring-2 ring-amber-400'
                            : 'bg-white text-stone-700 border-amber-200 hover:bg-amber-100/60'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-bold">شريحة 500 - 1000 م²</span>
                          {landArea > 500 && landArea <= 1000 && (
                            <span className="text-[10px] bg-stone-900 text-amber-400 px-1.5 py-0.5 rounded-full font-black">
                              نشطة
                            </span>
                          )}
                        </div>
                        <div className="text-base font-black">30,000 ريال</div>
                        <div className="text-[10px] opacity-85">للمباني التجارية من 500 إلى 1000 م²</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setLandArea(1200);
                          if (onUpdateClientInfo) onUpdateClientInfo({ landArea: 1200 });
                        }}
                        className={`p-3 rounded-xl border text-right transition flex flex-col justify-between gap-1.5 ${
                          landArea > 1000
                            ? 'bg-amber-500 text-stone-950 border-amber-600 shadow-sm font-bold ring-2 ring-amber-400'
                            : 'bg-white text-stone-700 border-amber-200 hover:bg-amber-100/60'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-bold">شريحة أكبر من 1000 م² (&gt;1000)</span>
                          {landArea > 1000 && (
                            <span className="text-[10px] bg-stone-900 text-amber-400 px-1.5 py-0.5 rounded-full font-black">
                              نشطة
                            </span>
                          )}
                        </div>
                        <div className="text-base font-black">35,000 ريال</div>
                        <div className="text-[10px] opacity-85">للمباني التجارية أكثر من 1000 م²</div>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setLandArea(400);
                          if (onUpdateClientInfo) onUpdateClientInfo({ landArea: 400 });
                        }}
                        className={`p-3 rounded-xl border text-right transition flex flex-col justify-between gap-1.5 ${
                          landArea <= 500
                            ? 'bg-amber-500 text-stone-950 border-amber-600 shadow-sm font-bold ring-2 ring-amber-400'
                            : 'bg-white text-stone-700 border-amber-200 hover:bg-amber-100/60'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-bold">شريحة 0 - 500 م²</span>
                          {landArea <= 500 && (
                            <span className="text-[10px] bg-stone-900 text-amber-400 px-1.5 py-0.5 rounded-full font-black">
                              نشطة
                            </span>
                          )}
                        </div>
                        <div className="text-base font-black">20,000 ريال</div>
                        <div className="text-[10px] opacity-85">للمباني السكنية حتى 500 م²</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setLandArea(750);
                          if (onUpdateClientInfo) onUpdateClientInfo({ landArea: 750 });
                        }}
                        className={`p-3 rounded-xl border text-right transition flex flex-col justify-between gap-1.5 ${
                          landArea > 500 && landArea <= 1000
                            ? 'bg-amber-500 text-stone-950 border-amber-600 shadow-sm font-bold ring-2 ring-amber-400'
                            : 'bg-white text-stone-700 border-amber-200 hover:bg-amber-100/60'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-bold">شريحة 500 - 1000 م²</span>
                          {landArea > 500 && landArea <= 1000 && (
                            <span className="text-[10px] bg-stone-900 text-amber-400 px-1.5 py-0.5 rounded-full font-black">
                              نشطة
                            </span>
                          )}
                        </div>
                        <div className="text-base font-black">25,000 ريال</div>
                        <div className="text-[10px] opacity-85">للمباني السكنية من 500 إلى 1000 م²</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setLandArea(1200);
                          if (onUpdateClientInfo) onUpdateClientInfo({ landArea: 1200 });
                        }}
                        className={`p-3 rounded-xl border text-right transition flex flex-col justify-between gap-1.5 ${
                          landArea > 1000
                            ? 'bg-amber-500 text-stone-950 border-amber-600 shadow-sm font-bold ring-2 ring-amber-400'
                            : 'bg-white text-stone-700 border-amber-200 hover:bg-amber-100/60'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-bold">شريحة أكبر من 1000 م² (&gt;1000)</span>
                          {landArea > 1000 && (
                            <span className="text-[10px] bg-stone-900 text-amber-400 px-1.5 py-0.5 rounded-full font-black">
                              نشطة
                            </span>
                          )}
                        </div>
                        <div className="text-base font-black">30,000 ريال</div>
                        <div className="text-[10px] opacity-85">للمباني السكنية أكثر من 1000 م²</div>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Mode-specific Controls */}
              {baladyMode === 'per_stage' && (
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      عدد مراحل صب بلدي الإلزامية:
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={baladyStageCount}
                      onChange={(e) => setBaladyStageCount(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2 text-xs font-bold text-stone-900"
                    />
                    <span className="text-[10px] text-stone-500">
                      تشمل: القواعد، الرقاب، الميدة، الأعمدة، والأسقف.
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      سعر المرحلة الواحدة (ريال):
                    </label>
                    <input
                      type="number"
                      min="100"
                      step="100"
                      value={baladyRatePerStage}
                      onChange={(e) => setBaladyRatePerStage(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2 text-xs font-bold text-stone-900"
                    />
                  </div>
                </div>
              )}

              {baladyMode === 'custom' && (
                <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200">
                  <label className="block text-xs font-bold text-amber-900 mb-1">
                    أدخل السعر الإجمالي المعتمد لإشراف بلدية (ريال):
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={customBaladyPrice ?? baladyTierResult.price}
                    onChange={(e) => setCustomBaladyPrice(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full bg-white border border-amber-300 rounded-lg px-3 py-2 text-sm font-bold text-stone-900"
                  />
                </div>
              )}

              {/* Balady Deliverables */}
              <div className="border-t border-stone-100 pt-4">
                <div className="text-xs font-bold text-stone-800 mb-2">
                  مخرجات والتزامات إشراف منصة بلدي المشمولة:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-stone-600">
                  {activeDef.deliverables.map((d, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span>{d}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ITEM 2: GENERAL SUPERVISION */}
          {selectedItemId === 'general' && (
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-5">
              <div>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                  البند الثاني: إشراف عام
                </span>
                <h3 className="text-base font-black text-stone-900 mt-1">
                  إشراف استشاري موقع واستلامات فنية دورية
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  حضور مهندس مدني للموقع لمتابعة جودة التنفيذ، تسليح الخرسانات، العوازل، والتشطيبات.
                </p>
              </div>

              {/* Mode Options */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setGeneralMode('monthly');
                    setCustomGeneralPrice(null);
                  }}
                  className={`p-3 rounded-xl border text-right transition ${
                    generalMode === 'monthly'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-950 font-bold'
                      : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <div className="text-xs font-bold">إشراف شهري</div>
                  <div className="text-[10px] text-stone-500 mt-1">
                    {generalMonths} أشهر × {generalMonthlyRate}
                  </div>
                  <div className="text-xs font-black text-amber-700 mt-1">
                    {formatSAR(generalMonths * generalMonthlyRate)}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setGeneralMode('bone_stage');
                    setCustomGeneralPrice(null);
                  }}
                  className={`p-3 rounded-xl border text-right transition ${
                    generalMode === 'bone_stage'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-950 font-bold'
                      : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <div className="text-xs font-bold">مقطوع مرحلة العظم</div>
                  <div className="text-[10px] text-stone-500 mt-1">الهيكل الإنشائي كاملاً</div>
                  <div className="text-xs font-black text-amber-700 mt-1">16,000 ريال</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setGeneralMode('finish_stage');
                    setCustomGeneralPrice(null);
                  }}
                  className={`p-3 rounded-xl border text-right transition ${
                    generalMode === 'finish_stage'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-950 font-bold'
                      : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <div className="text-xs font-bold">مقطوع التشطيبات</div>
                  <div className="text-[10px] text-stone-500 mt-1">التشطيب المعماري والأنظمة</div>
                  <div className="text-xs font-black text-amber-700 mt-1">14,000 ريال</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setGeneralMode('per_visit');
                    setCustomGeneralPrice(null);
                  }}
                  className={`p-3 rounded-xl border text-right transition ${
                    generalMode === 'per_visit'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-950 font-bold'
                      : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <div className="text-xs font-bold">بالزيارة المحددة</div>
                  <div className="text-[10px] text-stone-500 mt-1">{generalVisitsCount} زيارات</div>
                  <div className="text-xs font-black text-amber-700 mt-1">
                    {formatSAR(generalVisitsCount * generalVisitRate)}
                  </div>
                </button>
              </div>

              {/* Monthly Details Controls */}
              {generalMode === 'monthly' && (
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      مدة الإشراف الشهري (بالأشهر):
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="36"
                      value={generalMonths}
                      onChange={(e) => setGeneralMonths(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2 text-xs font-bold text-stone-900"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-stone-700">
                        أتعاب الإشراف شهرياً (ريال / شهر):
                      </label>
                      <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-1.5 py-0.2 rounded">
                        {buildingType === 'commercial' || buildingType === 'hotel' || buildingType === 'gas_station' || buildingType === 'factory' || buildingType === 'warehouse_workshop'
                          ? 'تجاري: 18,000 ريال'
                          : buildingType === 'residential'
                          ? 'سكني: 16,000 ريال'
                          : 'فيلا: 12,000 ريال'}
                      </span>
                    </div>
                    <input
                      type="number"
                      min="500"
                      step="500"
                      value={generalMonthlyRate}
                      onChange={(e) => setGeneralMonthlyRate(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2 text-xs font-bold text-stone-900"
                    />
                  </div>
                </div>
              )}

              {/* Per-visit Controls */}
              {generalMode === 'per_visit' && (
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      عدد الزيارات الميدانية المطلوبة:
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={generalVisitsCount}
                      onChange={(e) => setGeneralVisitsCount(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2 text-xs font-bold text-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      أتعاب الزيارة الواحدة (ريال):
                    </label>
                    <input
                      type="number"
                      min="100"
                      step="100"
                      value={generalVisitRate}
                      onChange={(e) => setGeneralVisitRate(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2 text-xs font-bold text-stone-900"
                    />
                  </div>
                </div>
              )}

              {/* General Deliverables */}
              <div className="border-t border-stone-100 pt-4">
                <div className="text-xs font-bold text-stone-800 mb-2">
                  مخرجات والتزامات الإشراف العام الاستشاري:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-stone-600">
                  {activeDef.deliverables.map((d, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span>{d}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ITEM 3: PROJECT MANAGEMENT */}
          {selectedItemId === 'project_management' && (
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-5">
              <div>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                  البند الثالث: إدارة مشروع
                </span>
                <h3 className="text-base font-black text-stone-900 mt-1">
                  إدارة هندسية احترافية للمشروع (Project Management)
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  تخطيط الجداول الزمنية، مراقبة التكاليف، تدقيق المستخلصات الشهرية، وإدارة المقاولين.
                </p>
              </div>

              {/* Modes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setPmMode('monthly_pm');
                    setCustomPmPrice(null);
                  }}
                  className={`p-3 rounded-xl border text-right transition ${
                    pmMode === 'monthly_pm'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-950 font-bold'
                      : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <div className="text-xs font-bold">إدارة شهرية للمشروع</div>
                  <div className="text-[10px] text-stone-500 mt-1">
                    {pmMonths} أشهر × {pmMonthlyRate} ريال
                  </div>
                  <div className="text-xs font-black text-amber-700 mt-1">
                    {formatSAR(pmMonths * pmMonthlyRate)}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPmMode('lump_sum_pm');
                    setCustomPmPrice(null);
                  }}
                  className={`p-3 rounded-xl border text-right transition ${
                    pmMode === 'lump_sum_pm'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-950 font-bold'
                      : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <div className="text-xs font-bold">مقطوع كامل مدة المشروع</div>
                  <div className="text-[10px] text-stone-500 mt-1">
                    {buildingType === 'villa'
                      ? 'للفيلا: 18,000 ريال'
                      : buildingType === 'residential'
                      ? 'للعمائر: 22,000 ريال'
                      : 'للتجاري: 25,000 ريال'}
                  </div>
                  <div className="text-xs font-black text-amber-700 mt-1">
                    {formatSAR(getDefaultPmRate(buildingType))}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPmMode('percentage_pm');
                    setCustomPmPrice(null);
                  }}
                  className={`p-3 rounded-xl border text-right transition ${
                    pmMode === 'percentage_pm'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-950 font-bold'
                      : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <div className="text-xs font-bold">نسبة من تكلفة المشروع</div>
                  <div className="text-[10px] text-stone-500 mt-1">{pmPercentage}% من التكلفة</div>
                  <div className="text-xs font-black text-amber-700 mt-1">
                    {formatSAR(Math.round((pmProjectCost * pmPercentage) / 100))}
                  </div>
                </button>
              </div>

              {/* Mode Controls */}
              {pmMode === 'monthly_pm' && (
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      مدة إدارة المشروع (بالأشهر):
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={pmMonths}
                      onChange={(e) => setPmMonths(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2 text-xs font-bold text-stone-900"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-stone-700">
                        أتعاب الإدارة شهرياً (ريال / شهر):
                      </label>
                      <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-1.5 py-0.2 rounded">
                        {buildingType === 'commercial' || buildingType === 'hotel' || buildingType === 'gas_station' || buildingType === 'factory' || buildingType === 'warehouse_workshop'
                          ? 'تجاري: 25,000 ريال'
                          : buildingType === 'residential'
                          ? 'سكني: 22,000 ريال'
                          : 'فيلا: 18,000 ريال'}
                      </span>
                    </div>
                    <input
                      type="number"
                      min="1000"
                      step="1000"
                      value={pmMonthlyRate}
                      onChange={(e) => setPmMonthlyRate(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2 text-xs font-bold text-stone-900"
                    />
                  </div>
                </div>
              )}

              {pmMode === 'percentage_pm' && (
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      تكلفة أعمال التنفيذ التقديرية (ريال):
                    </label>
                    <input
                      type="number"
                      min="10000"
                      step="50000"
                      value={pmProjectCost}
                      onChange={(e) => setPmProjectCost(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2 text-xs font-bold text-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      نسبة أتعاب الإدارة (%):
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      step="0.5"
                      value={pmPercentage}
                      onChange={(e) => setPmPercentage(Math.max(0.5, Number(e.target.value) || 1))}
                      className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2 text-xs font-bold text-stone-900"
                    />
                  </div>
                </div>
              )}

              {/* PM Deliverables */}
              <div className="border-t border-stone-100 pt-4">
                <div className="text-xs font-bold text-stone-800 mb-2">
                  مخرجات والتزامات إدارة المشروع الهندسية:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-stone-600">
                  {activeDef.deliverables.map((d, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span>{d}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ITEM 4: DAMAGE REPORT */}
          {selectedItemId === 'damage_report' && (
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-5">
              <div>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                  البند الرابع: تقرير أضرار
                </span>
                <h3 className="text-base font-black text-stone-900 mt-1">
                  تقرير أضرار وفحص السلامة الإنشائية والمعمارية (تقرير استشاري معتمد)
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  معاينة هندسية ميدانية لتشخيص الشروخ، التصدعات، الهبوط، والتسربات مع تقديم حلول التدعيم بتقرير رسمي مختوم.
                </p>
              </div>

              {/* Damage Report Package Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setDamageMode('villa_report');
                    setCustomDamagePrice(null);
                  }}
                  className={`p-3.5 rounded-xl border text-right transition ${
                    damageMode === 'villa_report' && customDamagePrice === null
                      ? 'bg-amber-500/10 border-amber-500 text-amber-950 font-bold'
                      : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <div className="text-xs font-bold">تقرير فحص ومعاينة أضرار فيلا سكنية</div>
                  <div className="text-[11px] text-stone-500 mt-1">
                    معاينة إنشائية ومعمارية شاملة للفيلا
                  </div>
                  <div className="text-xs font-black text-amber-700 mt-1">1,500 ريال</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDamageMode('building_report');
                    setCustomDamagePrice(null);
                  }}
                  className={`p-3.5 rounded-xl border text-right transition ${
                    damageMode === 'building_report' && customDamagePrice === null
                      ? 'bg-amber-500/10 border-amber-500 text-amber-950 font-bold'
                      : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <div className="text-xs font-bold">تقرير أضرار عمارة سكنية / تجارية</div>
                  <div className="text-[11px] text-stone-500 mt-1">
                    معاينة المباني متعددة الأدوار وتوصيات المعالجة
                  </div>
                  <div className="text-xs font-black text-amber-700 mt-1">2,200 ريال</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDamageMode('commercial_report');
                    setCustomDamagePrice(null);
                  }}
                  className={`p-3.5 rounded-xl border text-right transition ${
                    damageMode === 'commercial_report' && customDamagePrice === null
                      ? 'bg-amber-500/10 border-amber-500 text-amber-950 font-bold'
                      : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <div className="text-xs font-bold">تقرير أضرار منشأة كبرى / مستودع</div>
                  <div className="text-[11px] text-stone-500 mt-1">
                    معاينة الهياكل المعدنية والخرسانية وتدعيم العناصر
                  </div>
                  <div className="text-xs font-black text-amber-700 mt-1">2,800 ريال</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDamageMode('advanced_ndt');
                    setCustomDamagePrice(null);
                  }}
                  className={`p-3.5 rounded-xl border text-right transition ${
                    damageMode === 'advanced_ndt' && customDamagePrice === null
                      ? 'bg-amber-500/10 border-amber-500 text-amber-950 font-bold'
                      : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <div className="text-xs font-bold">تقرير شامل مع فحوصات واختبارات بالموقع</div>
                  <div className="text-[11px] text-stone-500 mt-1">
                    يشمل فحص سكانر الحديد ومطرقة شميدت بالموقع
                  </div>
                  <div className="text-xs font-black text-amber-700 mt-1">3,000 ريال</div>
                </button>
              </div>

              {/* Custom Damage Price Adjustment */}
              <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="font-bold text-stone-800 block">
                    تعديل سعر تقرير الأضرار يدوياً (1,500 - 3,000 ريال):
                  </span>
                  <span className="text-[11px] text-stone-500">
                    يمكنك تحديد أتعاب التقرير المعتمدة بالتراضي ضمن نطاق 1,500 إلى 3,000 ر.س
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="number"
                    min="1500"
                    max="3000"
                    step="100"
                    value={customDamagePrice !== null ? customDamagePrice : calculatedDamagePrice}
                    onChange={(e) => {
                      const val = e.target.value === '' ? null : Number(e.target.value);
                      setCustomDamagePrice(val);
                    }}
                    className="w-28 bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-center font-bold text-stone-900"
                  />
                  <span className="text-xs font-bold text-stone-500">ريال</span>
                  {customDamagePrice !== null && (
                    <button
                      type="button"
                      onClick={() => setCustomDamagePrice(null)}
                      className="text-xs text-red-600 hover:underline font-bold"
                    >
                      استعادة الافتراضي
                    </button>
                  )}
                </div>
              </div>

              {/* Damage Scope Input */}
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2">
                <label className="block text-xs font-bold text-stone-700">
                  توصيف نطاق الأضرار والمعاينة الفنية:
                </label>
                <textarea
                  rows={2}
                  value={damageScope}
                  onChange={(e) => setDamageScope(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-lg p-2.5 text-xs text-stone-900 outline-hidden focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-[10px] text-stone-500">
                  مثال: فحص شروخ بالجدران والأسقف، ترييح بالأساسات، تسرب مياه بالبدروم، أو صدأ بحديد الأسقف.
                </span>
              </div>

              {/* Damage Deliverables */}
              <div className="border-t border-stone-100 pt-4">
                <div className="text-xs font-bold text-stone-800 mb-2">
                  مخرجات التقرير الهندسي الاستشاري المعتمد:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-stone-600">
                  {activeDef.deliverables.map((d, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span>{d}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Discounts & Tax Controls (الخصومات والضريبة النظامية) - قائمة ثابتة وموحدة لجميع الأقسام */}
          <DiscountAndTaxSection clientInfo={clientInfo} onUpdateClientInfo={onUpdateClientInfo} />
        </div>

        {/* Right column: Summary Card & Action */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs sticky top-[130px] space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <span className="text-xs font-bold text-stone-500">ملخص البند المحدد</span>
              <span className="text-[11px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded">
                {activeDef.shortName}
              </span>
            </div>

            <div>
              <div className="text-sm font-black text-stone-900">{activeDef.name}</div>
              <div className="text-xs text-stone-500 mt-1">{activeDef.tagline}</div>
            </div>

            <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-2 text-xs">
              <div className="flex justify-between items-center text-stone-600">
                <span>نوع العقار:</span>
                <span className="font-bold text-stone-800">
                  {buildingType === 'villa'
                    ? 'فيلا سكنية'
                    : buildingType === 'residential'
                    ? 'عمارة سكنية'
                    : 'مبنى تجاري'}
                </span>
              </div>
              <div className="flex justify-between items-center text-stone-600">
                <span>المدينة المستهدفة:</span>
                <span className="font-bold text-stone-800">{projectCity}</span>
              </div>
              {selectedItemId === 'balady' && (
                <div className="flex justify-between items-center text-stone-600">
                  <span>المساحة:</span>
                  <span className="font-bold text-stone-800">{landArea} م²</span>
                </div>
              )}
              {selectedItemId === 'general' && generalMode === 'monthly' && (
                <div className="flex justify-between items-center text-stone-600">
                  <span>المدة بالأشهر:</span>
                  <span className="font-bold text-stone-800">{generalMonths} أشهر</span>
                </div>
              )}
              {selectedItemId === 'project_management' && pmMode === 'monthly_pm' && (
                <div className="flex justify-between items-center text-stone-600">
                  <span>مدة الإدارة:</span>
                  <span className="font-bold text-stone-800">{pmMonths} أشهر</span>
                </div>
              )}
            </div>

            {/* Price Box */}
            <div className="bg-stone-900 text-white p-4 rounded-xl space-y-1 shadow-inner">
              <div className="text-[11px] text-stone-400 font-bold">إجمالي أتعاب البند:</div>
              <div className="text-2xl font-black text-amber-400">
                {formatSAR(activeCalculatedPrice)}
              </div>
              <div className="text-[10px] text-stone-400 pt-1 border-t border-stone-800">
                * غير شامل ضريبة القيمة المضافة ما لم يتم تفعيلها بالعرض
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddItemToQuote}
              className="w-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-black py-3 rounded-xl shadow-md text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>إضافة {activeDef.shortName} إلى عرض السعر</span>
            </button>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>
                هذا القسم مستقل ومنفصل تماماً عن قسم التنفيذ، ويتم إصدار تقاريره ومتابعاته تحت إدارة الاستشارات الهندسية المعتمدة.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
