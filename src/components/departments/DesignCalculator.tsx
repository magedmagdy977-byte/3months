import React, { useState, useEffect } from 'react';
import {
  BuildingType,
  DesignServiceType,
  SupervisionType,
  DesignSubItem,
  QuotationItem,
  ClientInfo,
} from '../../types';
import {
  INITIAL_DESIGN_SUB_ITEMS,
  getDesignAreaTierPrice,
  getAsBuiltTierPrice,
  getPlanDesignTierPrice,
  getTierListForDisplay,
  getRenovationFixedPrice,
  getDemolitionFixedPrice,
  getSupervisionPrice,
  calculateDesignFormulaPrice,
  DESIGN_FORMULA_CONFIGS,
  RIYADH_ZONE_CONFIGS,
  getRiyadhZoneMultiplier,
} from '../../data/pricingData';
import { formatSAR } from '../../utils/formatters';
import { UnifiedProjectDataSection } from '../UnifiedProjectDataSection';
import { DiscountAndTaxSection } from '../common/DiscountAndTaxSection';
import {
  Check,
  Plus,
  Layers,
  Building,
  Home,
  Store,
  Info,
  Sliders,
  CheckCircle2,
  Calculator,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Percent,
  Warehouse,
  Fuel,
  Factory,
  Hotel,
  Trees,
  Copy,
} from 'lucide-react';

interface DesignCalculatorProps {
  onAddItem: (item: QuotationItem) => void;
  clientInfo?: ClientInfo;
  onUpdateClientInfo?: (info: Partial<ClientInfo>) => void;
  onOpenAiAssistant?: () => void;
}

const SERVICE_TYPE_DISPLAY_NAMES: Record<DesignServiceType, string> = {
  new_license: 'رخصة بناء جديدة',
  plan_design: 'تصميم مخططات',
  renovation: 'ترميم مبنى',
  as_built_mod: 'تصحيح وضع مبنى قائم',
  component_mod: 'تعديل مكونات',
  demolition: 'رخصة هدم',
};

const SERVICE_TYPE_FEE_LABELS: Record<DesignServiceType, string> = {
  new_license: 'أتعاب التصميم والمخططات:',
  plan_design: 'أتعاب تصميم المخططات:',
  renovation: 'أتعاب رخصة ترميم المبنى والتصاميم:',
  as_built_mod: 'أتعاب تصحيح وضع مبنى قائم:',
  component_mod: 'أتعاب تعديل المكونات:',
  demolition: 'رسوم خدمة الهدم:',
};

const BUILDING_TYPE_SHORT_LABELS: Record<BuildingType, string> = {
  villa: 'فيلا سكنية',
  residential: 'عمارة سكنية',
  commercial: 'عمارة تجارية',
  rest_house: 'استراحة / شاليهات',
  hotel: 'فندق',
  gas_station: 'محطة وقود',
  factory: 'مصنع',
  warehouse_workshop: 'ورش ومستودعات',
};

export const DesignCalculator: React.FC<DesignCalculatorProps> = ({
  onAddItem,
  clientInfo,
  onUpdateClientInfo,
  onOpenAiAssistant,
}) => {
  const [buildingType, setBuildingType] = useState<BuildingType>(() => {
    const b = clientInfo?.buildingType || '';
    if (b.includes('مصنع')) return 'factory';
    if (b.includes('ورش') || b.includes('مستودع')) return 'warehouse_workshop';
    if (b.includes('فندق') || b.includes('ضيافة')) return 'hotel';
    if (b.includes('محطة')) return 'gas_station';
    if (b.includes('استراحة') || b.includes('شاليه')) return 'rest_house';
    if (b.includes('تجاري')) return 'commercial';
    if (b.includes('عمارة')) return 'residential';
    return 'villa';
  });
  const [serviceType, setServiceType] = useState<DesignServiceType>('new_license');
  const [area, setArea] = useState<number>(() => clientInfo?.landArea || 600);

  // Sync area with clientInfo.landArea if updated externally
  useEffect(() => {
    if (clientInfo?.landArea !== undefined && clientInfo.landArea !== area) {
      setArea(clientInfo.landArea);
    }
  }, [clientInfo?.landArea]);

  // Sync buildingType with clientInfo.buildingType if updated externally
  useEffect(() => {
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

  // Sync serviceType with clientInfo.serviceType if updated externally
  useEffect(() => {
    if (clientInfo?.serviceType) {
      const s = clientInfo.serviceType;
      let mappedService: DesignServiceType = 'new_license';
      if (s.includes('ترميم')) mappedService = 'renovation';
      else if (s.includes('تصحيح') || s.includes('قائم')) mappedService = 'as_built_mod';
      else if (s.includes('تعديل')) mappedService = 'component_mod';
      else if (s.includes('هدم')) mappedService = 'demolition';
      else if (s.includes('مخطط')) mappedService = 'plan_design';
      if (mappedService !== serviceType) {
        setServiceType(mappedService);
      }
    }
  }, [clientInfo?.serviceType]);

  // For "رخصة بناء جديدة":
  // Design mode: 'tier' (باقة حسب شريحة المساحة) | 'formula' (معادلة سعر المتر) | 'itemized' (تجميع بنود منفردة)
  const [designPricingMode, setDesignPricingMode] = useState<'tier' | 'formula' | 'itemized'>('tier');
  const [customDesignPrice, setCustomDesignPrice] = useState<number | null>(null);

  // Optional customized parameters for the formula (if engineer adjusts maxRate/minRate)
  const [customFormulaRates, setCustomFormulaRates] = useState<{
    maxRate?: number;
    minRate?: number;
  }>({});
  const [showFormulaCustomizer, setShowFormulaCustomizer] = useState<boolean>(false);

  const [subItems, setSubItems] = useState<DesignSubItem[]>(INITIAL_DESIGN_SUB_ITEMS);

  // Supervision
  const [supervisionType, setSupervisionType] = useState<SupervisionType>('none');
  const [customSupervisionPrice, setCustomSupervisionPrice] = useState<number | null>(null);

  // Fixed service prices for renovation and demolition (سعر ثابت وليس شرائح)
  const [renovationPrice, setRenovationPrice] = useState<number>(() => getRenovationFixedPrice(buildingType));
  const [demolitionPrice, setDemolitionPrice] = useState<number>(() => getDemolitionFixedPrice(buildingType));

  // When buildingType changes, update default renovation and demolition prices
  useEffect(() => {
    setRenovationPrice(getRenovationFixedPrice(buildingType));
    setDemolitionPrice(getDemolitionFixedPrice(buildingType));
  }, [buildingType]);

  // Duplex Villa state: When buildingType is 'villa', duplex option reduces billable pricing area by 50%
  const [isDuplex, setIsDuplex] = useState<boolean>(() => {
    return !!clientInfo?.isDuplex || (clientInfo?.buildingType || '').includes('دوبلكس');
  });

  // Sync isDuplex with clientInfo
  useEffect(() => {
    if (clientInfo?.isDuplex !== undefined && clientInfo.isDuplex !== isDuplex) {
      setIsDuplex(clientInfo.isDuplex);
    }
  }, [clientInfo?.isDuplex]);

  // Effective billable area: if Duplex Villa is checked, halved to 50%
  const isDuplexActive = isDuplex && buildingType === 'villa';
  const effectivePricingArea = isDuplexActive ? Math.max(1, Math.round(area / 2)) : area;

  // Toggle duplex state and sync with client info
  const handleToggleDuplex = (val: boolean) => {
    setIsDuplex(val);
    if (onUpdateClientInfo) {
      onUpdateClientInfo({
        isDuplex: val,
        buildingType: val ? 'فلل دوبلكس' : 'فيلا سكنية خاصة',
        projectTitle: val ? 'مشروع فلل دوبلكس' : 'مشروع فيلا سكنية خاصة',
      });
    }
  };

  // Calculations
  const tierResult =
    serviceType === 'plan_design'
      ? getPlanDesignTierPrice(effectivePricingArea, buildingType)
      : serviceType === 'as_built_mod'
      ? getAsBuiltTierPrice(buildingType, effectivePricingArea)
      : getDesignAreaTierPrice(buildingType, effectivePricingArea, serviceType);
  const formulaConfig = DESIGN_FORMULA_CONFIGS[buildingType];
  const formulaResult = calculateDesignFormulaPrice(buildingType, effectivePricingArea, customFormulaRates);

  // Itemized design subtotal
  const itemizedSubtotal = subItems
    .filter((item) => item.selected)
    .reduce((sum, item) => sum + item.defaultPrice, 0);

  // Tier services vs Fixed services
  const isTierService =
    serviceType === 'new_license' ||
    serviceType === 'plan_design' ||
    serviceType === 'as_built_mod' ||
    serviceType === 'component_mod';

  // Base design fee before manual override
  let computedDesignFee = 0;
  if (isTierService) {
    if (designPricingMode === 'tier') {
      computedDesignFee = tierResult.price;
    } else if (designPricingMode === 'formula') {
      computedDesignFee = formulaResult.totalPrice;
    } else {
      computedDesignFee = itemizedSubtotal;
    }
  } else if (serviceType === 'renovation') {
    computedDesignFee = renovationPrice;
  } else if (serviceType === 'demolition') {
    computedDesignFee = demolitionPrice;
  } else {
    computedDesignFee = 1000;
  }

  // Base design fee with manual override capability
  const baseDesignFee = customDesignPrice !== null ? customDesignPrice : computedDesignFee;

  // Supervision fee
  let supervisionFee = 0;
  let supervisionLabel = 'بدون خدمة إشراف';
  if (isTierService && supervisionType !== 'none') {
    if (customSupervisionPrice !== null) {
      supervisionFee = customSupervisionPrice;
      supervisionLabel = `إشراف مخصص (${supervisionType === 'lump_sum' ? '10 زيارات مقطوع' : 'شهري كامل'})`;
    } else {
      const supResult = getSupervisionPrice(supervisionType, effectivePricingArea);
      supervisionFee = supResult.price;
      supervisionLabel = supResult.label;
    }
  }

  // Total before zone adjustment
  const subtotalBeforeZone = baseDesignFee + supervisionFee;

  // Riyadh Geographic Location Zone Adjustment (+20% North/Center, -20% East/West, -40% South)
  const zoneConfig = RIYADH_ZONE_CONFIGS[clientInfo?.locationZone || 'none'];
  const zoneMultiplier = zoneConfig.multiplier;
  const finalTotal = Math.round(subtotalBeforeZone * zoneMultiplier);

  const handleToggleSubItem = (id: string) => {
    setSubItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleSubItemPriceChange = (id: string, newPrice: number) => {
    setSubItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, defaultPrice: Math.max(0, newPrice) } : item))
    );
  };

  const handleAreaChange = (val: number) => {
    const safeVal = Math.max(0, val);
    setArea(safeVal);
    if (onUpdateClientInfo) {
      const newBuildingArea = Math.round(safeVal * 1.68);
      onUpdateClientInfo({
        landArea: safeVal,
        buildingArea: newBuildingArea,
      });
    }
  };

  const handleBuildingTypeChange = (bType: BuildingType) => {
    setBuildingType(bType);
    if (onUpdateClientInfo) {
      const labels: Record<BuildingType, string> = {
        villa: 'فيلا سكنية خاصة',
        residential: 'عمارة سكنية متعددة الأدوار',
        commercial: 'عمارة تجارية / إدارية',
        rest_house: 'استراحة / شاليهات خاصة',
        hotel: 'فندق / منشأة ضيافة فندقية',
        gas_station: 'محطة وقود وخدمات سيارات',
        factory: 'مصنع / منشأة صناعية',
        warehouse_workshop: 'ورش ومستودعات تجارية / صناعية',
      };
      const isResOrComm = bType !== 'villa' && bType !== 'rest_house';
      const currentScope = clientInfo?.scopeFlags || ({} as any);
      const currentExclusions = clientInfo?.exclusions || ({} as any);

      onUpdateClientInfo({
        buildingType: labels[bType],
        projectTitle: `مشروع ${labels[bType]}`,
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
    }
  };

  const handleServiceTypeChange = (sType: DesignServiceType) => {
    setServiceType(sType);
    setCustomDesignPrice(null);

    if (onUpdateClientInfo) {
      const srvLabels: Record<DesignServiceType, string> = {
        new_license: 'إصدار رخصة بناء وتصاميم هندسية',
        plan_design: 'تصميم مخططات هندسية',
        renovation: 'رخصة ترميم مبنى وتصاميم هندسية',
        as_built_mod: 'تصحيح وضع مبنى قائم وشهادة التحمل الإنشائي',
        component_mod: 'تعديل مكونات البناء وتعديل رخصة البناء',
        demolition: 'إصدار رخصة هدم للمبنى',
      };

      const currentScope = clientInfo?.scopeFlags || ({} as any);
      const isResOrComm = buildingType === 'residential' || buildingType === 'commercial';

      const updatedScope = {
        ...currentScope,
        // Rule: لا تقم بالتأشير على خانة إصدار رخصة البناء في حالة تصحيح مبنى قائم أو تصميم مخططات
        buildingLicense:
          sType === 'as_built_mod' || sType === 'plan_design'
            ? false
            : sType === 'new_license' || sType === 'renovation'
            ? true
            : sType === 'component_mod'
            ? false
            : currentScope.buildingLicense,
        // مع حذف الرفع المساحي واصدار رخصة البناء من النطاق الشرطي في خدمة تصميم مخططات
        survey: sType === 'plan_design' ? false : currentScope.survey,
        architectural: sType === 'plan_design' ? true : currentScope.architectural,
        structural: sType === 'plan_design' ? true : currentScope.structural,
        electrical: sType === 'plan_design' ? true : currentScope.electrical,
        hvac: sType === 'plan_design' ? true : currentScope.hvac,
        plumbing: sType === 'plan_design' ? true : currentScope.plumbing,
        // Rule: عدم التأشير على خانة الإشراف الهندسي في النطاق الشرطي عند اختيار تصميم مخططات أو بدون إشراف
        supervision: sType === 'plan_design' || supervisionType === 'none' ? false : currentScope.supervision,
        asBuiltCorrection: sType === 'as_built_mod',
        modifyComponents: sType === 'component_mod',
        // Rule: العمائر السكنية والتجارية تتضمن تلقائياً مخططات الأمن والسلامة
        civilDefense: isResOrComm ? true : currentScope.civilDefense,
      };

      const currentExclusions = clientInfo?.exclusions || ({} as any);
      onUpdateClientInfo({
        serviceType: srvLabels[sType],
        scopeFlags: updatedScope,
        ...((sType === 'plan_design' || supervisionType === 'none') && {
          exclusions: {
            ...currentExclusions,
            excludeSupervision: true,
          },
        }),
      });
    }
  };

  const handleAddCurrentToQuote = () => {
    const detailsList: string[] = [];
    const buildingTypeLabels: Record<BuildingType, string> = {
      villa: isDuplexActive ? 'فلل دوبلكس' : 'فيلا سكنية',
      residential: 'عمارة سكنية',
      commercial: 'عمارة تجارية',
      rest_house: 'استراحة / شاليهات خاصة',
      hotel: 'فندق / منشأة ضيافة فندقية',
      gas_station: 'محطة وقود وخدمات سيارات',
      factory: 'مصنع / منشأة صناعية',
      warehouse_workshop: 'ورش ومستودعات تجارية / صناعية',
    };

    const serviceLabels: Record<DesignServiceType, string> = {
      new_license: 'إصدار رخصة بناء وتصاميم هندسية',
      plan_design: 'تصميم مخططات',
      renovation: 'رخصة ترميم مبنى',
      as_built_mod: 'تصحيح وضع مبنى قائم',
      component_mod: 'تعديل مكونات',
      demolition: 'رخصة هدم',
    };

    if (isDuplexActive) {
      detailsList.push(`نوع العقار: فلل دوبلكس (وحدات متطابقة)`);
      detailsList.push(`المساحة الإجمالية للمشروع: ${area} م²`);
      detailsList.push(`مساحة التسعير المحتسبة (خفض 50% للدوبلكس): ${effectivePricingArea} م²`);
    } else {
      detailsList.push(`نوع العقار: ${buildingTypeLabels[buildingType]}`);
      detailsList.push(`المساحة الإجمالية: ${area} م²`);
    }

    if (isTierService) {
      if (customDesignPrice !== null) {
        detailsList.push(`سعر الأتعاب: تسعير يدوي مخصص (${formatSAR(customDesignPrice)})`);
      } else if (designPricingMode === 'tier') {
        detailsList.push(`باقة شريحة المساحة: ${tierResult.tierLabel} (${formatSAR(tierResult.price)})`);
      } else if (designPricingMode === 'formula') {
        detailsList.push(
          `تسعير بمعادلة سعر المتر (${formulaConfig.buildingLabel}): ${formulaResult.ratePerMeter.toFixed(2)} ريال/م² (${formatSAR(formulaResult.totalPrice)}) - ${formulaResult.areaStatusLabel}`
        );
      } else {
        const selectedNames = subItems.filter((i) => i.selected).map((i) => i.name).join('، ');
        detailsList.push(`بنود المخططات المنفردة (${formatSAR(itemizedSubtotal)}): ${selectedNames}`);
      }

      if (supervisionType !== 'none') {
        detailsList.push(`خدمة الإشراف: ${supervisionLabel} (${formatSAR(supervisionFee)})`);
      } else {
        detailsList.push(`خدمة الإشراف: بدون إشراف هندسي (تصميم مخططات فقط 0 ريال)`);
      }
    } else {
      if (serviceType === 'renovation') {
        detailsList.push(`أتعاب رخصة ترميم مبنى (سعر مقطوع ثابت): ${formatSAR(computedDesignFee)}`);
      } else if (serviceType === 'demolition') {
        detailsList.push(`أتعاب رخصة الهدم (سعر مقطوع ثابت): ${formatSAR(computedDesignFee)}`);
      } else {
        detailsList.push(`سعر الخدمة الأساسي: ${formatSAR(computedDesignFee)}`);
      }
    }

    if (clientInfo?.locationZone && clientInfo.locationZone !== 'none') {
      detailsList.push(
        `نطاق تسعير موقع الحي: ${zoneConfig.label} (${zoneConfig.adjustmentPercent > 0 ? `+${zoneConfig.adjustmentPercent}% زيادة` : `${zoneConfig.adjustmentPercent}% تخفيض`})`
      );
    }

    const newItem: QuotationItem = {
      id: `design-${Date.now()}`,
      departmentId: 'design',
      departmentName: 'قسم التصميم',
      title: `${serviceLabels[serviceType]} - ${buildingTypeLabels[buildingType]}`,
      buildingTypeLabel: buildingTypeLabels[buildingType],
      area,
      pricingArea: effectivePricingArea,
      isDuplex: isDuplexActive,
      details: detailsList,
      basePrice: finalTotal,
      totalPrice: finalTotal,
      notes: isDuplexActive
        ? `فلل دوبلكس: المساحة الكلية ${area} م² - مساحة التسعير المحسوبة للنصف ${effectivePricingArea} م²`
        : `المساحة المسجلة: ${area} متر مربع`,
    };

    onAddItem(newItem);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Department Intro */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-md">
              قسم التصميم والاستشارات المعمارية
            </span>
            <span className="text-xs text-stone-500">حساب رخص البناء والتقسيمات التفصيلية</span>
          </div>
          <h2 className="text-xl font-black text-stone-900 mt-1">
            تسعير خدمات التصميم المعماري ورخص البناء
          </h2>
        </div>

        {/* Quick building type selectors */}
        <div className="flex items-center gap-1.5 bg-stone-100 p-1.5 rounded-xl border border-stone-200 flex-wrap">
          <button
            type="button"
            onClick={() => handleBuildingTypeChange('villa')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              buildingType === 'villa'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>فلل</span>
          </button>
          {buildingType === 'villa' && (
            <button
              type="button"
              onClick={() => handleToggleDuplex(!isDuplex)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border cursor-pointer ${
                isDuplex
                  ? 'bg-amber-500 text-stone-950 border-amber-600 shadow-xs font-black'
                  : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-300'
              }`}
              title="تأشير فلل دوبلكس لخفض مساحة التسعير للنصف (50%)"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>فلل دوبلكس {isDuplex ? '(نصف المساحة ✓)' : ''}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => handleBuildingTypeChange('residential')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              buildingType === 'residential'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>عمارة سكنية</span>
          </button>
          <button
            type="button"
            onClick={() => handleBuildingTypeChange('commercial')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              buildingType === 'commercial'
                ? 'bg-amber-500 text-stone-950 shadow-xs font-black'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>عمارة تجارية</span>
          </button>
          <button
            type="button"
            onClick={() => handleBuildingTypeChange('rest_house')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              buildingType === 'rest_house'
                ? 'bg-[#433c71] text-white shadow-xs font-black'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Trees className="w-3.5 h-3.5" />
            <span>استراحات</span>
          </button>
          <button
            type="button"
            onClick={() => handleBuildingTypeChange('hotel')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              buildingType === 'hotel'
                ? 'bg-indigo-900 text-white shadow-xs font-black'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Hotel className="w-3.5 h-3.5" />
            <span>فنادق</span>
          </button>
          <button
            type="button"
            onClick={() => handleBuildingTypeChange('gas_station')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              buildingType === 'gas_station'
                ? 'bg-red-900 text-white shadow-xs font-black'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Fuel className="w-3.5 h-3.5" />
            <span>محطات وقود</span>
          </button>
          <button
            type="button"
            onClick={() => handleBuildingTypeChange('factory')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              buildingType === 'factory'
                ? 'bg-stone-900 text-amber-400 shadow-xs font-black'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Factory className="w-3.5 h-3.5" />
            <span>مصانع</span>
          </button>
          <button
            type="button"
            onClick={() => handleBuildingTypeChange('warehouse_workshop')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              buildingType === 'warehouse_workshop'
                ? 'bg-amber-600 text-white shadow-xs font-black'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Warehouse className="w-3.5 h-3.5" />
            <span>ورش ومستودعات</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form & Inputs */}
        <div className="lg:col-span-8 space-y-6">
          {/* Service Selection (اختيار نوع الخدمة والمساحة) */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-stone-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-500" />
              <span>اختر نوع الخدمة الهندسية المطلوبة</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {[
                {
                  id: 'new_license',
                  label: 'رخصة بناء جديدة',
                  sub:
                    buildingType === 'hotel'
                      ? 'فنادق (70 - 210 ألف)'
                      : buildingType === 'gas_station'
                      ? 'محطات (40 - 100 ألف)'
                      : 'شرائح المساحة + إشراف',
                },
                {
                  id: 'plan_design',
                  label: 'تصميم مخططات',
                  sub: buildingType === 'hotel' ? 'فنادق (60 - 120 ألف)' : 'شرائح (8 - 20 ألف)',
                },
                {
                  id: 'renovation',
                  label: 'رخصة ترميم مبنى',
                  sub:
                    buildingType === 'hotel'
                      ? 'سعر ثابت (5,000 ر.س)'
                      : buildingType === 'villa' || buildingType === 'rest_house'
                      ? 'سعر ثابت (2,000 ر.س)'
                      : 'سعر ثابت (3,000 ر.س)',
                },
                {
                  id: 'as_built_mod',
                  label: 'تصحيح وضع مبنى قائم',
                  sub:
                    buildingType === 'hotel'
                      ? 'فنادق (20-35 ألف)'
                      : buildingType === 'villa' || buildingType === 'rest_house'
                      ? 'فلل (10-20 ألف)'
                      : 'عمائر (20-40 ألف)',
                },
                { id: 'component_mod', label: 'تعديل مكونات', sub: 'نفس أسعار الرخص الجديدة' },
                {
                  id: 'demolition',
                  label: 'رخصة هدم',
                  sub: buildingType === 'hotel' ? 'سعر ثابت (3,000 ر.س)' : 'سعر ثابت (1,000 ر.س)',
                },
              ].map((srv) => (
                <button
                  key={srv.id}
                  type="button"
                  onClick={() => handleServiceTypeChange(srv.id as DesignServiceType)}
                  className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 text-xs font-bold ${
                    serviceType === srv.id
                      ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                  }`}
                >
                  <span>{srv.label}</span>
                  <span
                    className={`text-[10px] font-normal ${
                      serviceType === srv.id ? 'text-amber-300' : 'text-stone-500'
                    }`}
                  >
                    {srv.sub}
                  </span>
                </button>
              ))}
            </div>

            {/* Area Input Box */}
            <div className="pt-2 border-t border-stone-100 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label htmlFor="area-input" className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                  <span>المساحة الإجمالية للمشروع (بالمتر المربع م²):</span>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 border border-amber-300/70 px-1.5 py-0.5 rounded">
                    تسمّع تلقائياً في مساحة الأرض ومسطح البناء
                  </span>
                </label>
                <div className="flex items-center gap-1.5">
                  {[300, 450, 600, 850, 1200].map((quick) => (
                    <button
                      key={quick}
                      type="button"
                      onClick={() => handleAreaChange(quick)}
                      className={`text-[11px] px-2 py-0.5 rounded-md border font-medium transition ${
                        area === quick
                          ? 'bg-amber-500 text-stone-950 border-amber-600 font-bold'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200 border-stone-200'
                      }`}
                    >
                      {quick} م²
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <input
                    id="area-input"
                    type="number"
                    min="0"
                    step="10"
                    value={area === 0 ? '' : area}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const num = raw === '' ? 0 : Number(raw);
                      handleAreaChange(num);
                    }}
                    placeholder="مثال: 500"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-2.5 text-stone-900 text-sm font-bold focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
                  />
                  <span className="absolute left-3.5 top-2.5 text-xs text-stone-400 font-bold">
                    متر مربع
                  </span>
                </div>

                <div className="bg-amber-50 border border-amber-200 text-amber-900 px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 whitespace-nowrap font-medium">
                  <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>
                    شريحة السعر:{' '}
                    <strong>
                      {tierResult.tierLabel} ({formatSAR(tierResult.price)})
                    </strong>
                    {isDuplexActive && (
                      <span className="text-[10px] text-amber-800 bg-amber-200/80 px-1.5 py-0.5 rounded mr-1 font-bold">
                        (مساحة التسعير: {effectivePricingArea} م²)
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Duplex Villa Interactive Toggle (أيقونة وخيار فلل دوبلكس) */}
              {buildingType === 'villa' && (
                <div
                  onClick={() => handleToggleDuplex(!isDuplex)}
                  className={`p-3 rounded-xl border-2 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isDuplex
                      ? 'bg-amber-500/15 border-amber-500 shadow-xs ring-1 ring-amber-400'
                      : 'bg-stone-50 border-stone-200 hover:border-amber-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition ${
                        isDuplex
                          ? 'bg-amber-500 text-stone-950 font-black shadow-xs'
                          : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      <Copy className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-stone-900">
                          أيقونة فلل دوبلكس (وحدات سكنية متطابقة)
                        </span>
                        {isDuplex && (
                          <span className="text-[10px] bg-amber-500 text-stone-950 font-black px-2 py-0.5 rounded-full">
                            مخفض للنصف (50%)
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-600 mt-0.5">
                        عند التأشير على فلل دوبلكس يتم خفض المساحة المدخلة للتسعير إلى النصف تلقائياً:
                        {' '}
                        <strong className="text-stone-900">{effectivePricingArea} م²</strong>
                        {' '}(بدلاً من {area} م²)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <span
                      className={`text-xs font-black px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5 ${
                        isDuplex
                          ? 'bg-amber-500 text-stone-950 border-amber-600 font-black'
                          : 'bg-white text-stone-700 border-stone-300'
                      }`}
                    >
                      <CheckCircle2 className={`w-4 h-4 ${isDuplex ? 'text-stone-950' : 'text-stone-300'}`} />
                      <span>{isDuplex ? 'مفعل: احتساب نصف المساحة ✓' : 'تأشير: فلل دوبلكس'}</span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* بيانات المشروع الموحد (Master Template) والعميل */}
          {clientInfo && onUpdateClientInfo && (
            <UnifiedProjectDataSection
              clientInfo={clientInfo}
              onUpdateClientInfo={onUpdateClientInfo}
              calculatorArea={area}
              onAreaChange={handleAreaChange}
              calculatorBuildingType={buildingType}
              onBuildingTypeChange={handleBuildingTypeChange}
              calculatorServiceType={serviceType}
              onServiceTypeChange={handleServiceTypeChange}
              onOpenAiAssistant={onOpenAiAssistant}
            />
          )}

          {/* Conditional Content for Tier Services (رخصة بناء جديدة، ترميم مبنى، تصحيح وضع مبنى قائم، تعديل مكونات) */}
          {isTierService ? (
            <>
              {/* Part 1: Design Service */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-stone-900 text-white text-[11px] flex items-center justify-center font-bold">
                        1
                      </span>
                      <span>
                        {serviceType === 'new_license'
                          ? 'خدمة التصميم الهندسي للمخططات ورخصة البناء'
                          : serviceType === 'plan_design'
                          ? 'خدمة تصميم المخططات الهندسية'
                          : serviceType === 'as_built_mod'
                          ? 'خدمة تصحيح وضع مبنى قائم واعتماد المخططات'
                          : serviceType === 'component_mod'
                          ? 'خدمة تعديل مكونات البناء وتعديل الرخصة'
                          : serviceType === 'demolition'
                          ? 'خدمة إصدار رخصة هدم للمبنى'
                          : 'خدمة رخصة ترميم مبنى'}
                      </span>
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {serviceType === 'new_license'
                        ? 'اختر طريقة التسعير المناسبة: الباقة الشاملة (حسب شرائح المساحة)، أو معادلة سعر المتر، أو تفصيل البنود'
                        : serviceType === 'plan_design'
                        ? `تسعير خدمة تصميم المخططات الهندسية وفق شرائح الأسعار المعتمدة حسب المساحة (${area} م²)`
                        : `تسعير خدمة ${
                            serviceType === 'as_built_mod'
                              ? 'تصحيح وضع مبنى قائم'
                              : serviceType === 'component_mod'
                              ? 'تعديل مكونات'
                              : serviceType === 'demolition'
                              ? 'رخصة هدم'
                              : 'ترميم مبنى'
                          } وفق شرائح الأسعار المعتمدة حسب المساحة (${area} م²)`}
                    </p>
                  </div>

                  {/* Mode switcher */}
                  <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 self-start sm:self-auto flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setDesignPricingMode('tier');
                        setCustomDesignPrice(null);
                      }}
                      className={`text-xs px-3 py-1.5 rounded-lg font-bold transition ${
                        designPricingMode === 'tier'
                          ? 'bg-stone-900 text-white shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      باقة المساحة ({formatSAR(tierResult.price)})
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDesignPricingMode('formula');
                        setCustomDesignPrice(null);
                      }}
                      className={`text-xs px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                        designPricingMode === 'formula'
                          ? 'bg-[#433c71] text-white shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      <Calculator className="w-3.5 h-3.5 text-amber-400" />
                      <span>تسعير بالمعادلة ({formatSAR(formulaResult.totalPrice)})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDesignPricingMode('itemized');
                        setCustomDesignPrice(null);
                      }}
                      className={`text-xs px-3 py-1.5 rounded-lg font-bold transition ${
                        designPricingMode === 'itemized'
                          ? 'bg-stone-900 text-white shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      بنود مفصلة ({formatSAR(itemizedSubtotal)})
                    </button>
                  </div>
                </div>

                {designPricingMode === 'tier' && (
                  /* Tier mode explanation table */
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                      {getTierListForDisplay(serviceType, buildingType, effectivePricingArea).map((t) => (
                        <div
                          key={t.range}
                          className={`p-3 rounded-xl border text-center transition ${
                            t.active
                              ? 'bg-amber-500/15 border-amber-500 text-stone-950 font-bold ring-2 ring-amber-500/20'
                              : 'bg-stone-50 border-stone-200 text-stone-600'
                          }`}
                        >
                          <div className="text-[11px]">{t.range}</div>
                          <div className="text-sm font-black mt-1 text-stone-900">
                            {formatSAR(t.price)}
                          </div>
                          {t.active && (
                            <span className="text-[10px] text-amber-700 font-bold mt-1 inline-block">
                              ✓ الشريحة الحالية
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs">
                      <div className="text-stone-600 text-[11px]">
                        تشمل باقة التصميم الكاملة: المخططات المعمارية والإنشائية، وتأسيس الكهرباء، السباكة، التكييف، كود الطاقة، فحص التربة المعتمد، وإصدار القرار المساحي.
                      </div>
                      <button
                        type="button"
                        onClick={() => setDesignPricingMode('formula')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#433c71]/10 hover:bg-[#433c71]/20 text-[#433c71] font-bold rounded-lg transition text-[11px] shrink-0 self-start sm:self-auto"
                      >
                        <Calculator className="w-3.5 h-3.5 text-[#433c71]" />
                        <span>التسعير بمعادلة سعر المتر ({formatSAR(formulaResult.totalPrice)})</span>
                      </button>
                    </div>
                  </div>
                )}

                {designPricingMode === 'formula' && (
                  /* Formula mode (Excel interactive calculator) */
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-stone-50 via-white to-amber-50/20 border border-stone-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
                      {/* Formula Header & Building Switcher */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 pb-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#433c71] text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                            <Calculator className="w-5 h-5 text-amber-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-black text-stone-900">
                                {formulaConfig.buildingLabel}
                              </h4>
                              <span className="text-[10px] font-mono bg-amber-500/20 text-amber-900 border border-amber-500/30 px-2 py-0.5 rounded-md font-bold">
                                معادلة تناقص سعر المتر مع المساحة
                              </span>
                            </div>
                            <p className="text-xs text-stone-500 mt-0.5">
                              {formulaConfig.description}
                            </p>
                          </div>
                        </div>

                        {/* Quick building type switcher buttons inside the formula card */}
                        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 self-start sm:self-auto">
                          <button
                            type="button"
                            onClick={() => setBuildingType('villa')}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${
                              buildingType === 'villa'
                                ? 'bg-white text-stone-900 shadow-2xs'
                                : 'text-stone-500 hover:text-stone-800'
                            }`}
                          >
                            فيلا
                          </button>
                          <button
                            type="button"
                            onClick={() => setBuildingType('residential')}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${
                              buildingType === 'residential'
                                ? 'bg-white text-stone-900 shadow-2xs'
                                : 'text-stone-500 hover:text-stone-800'
                            }`}
                          >
                            عمارة سكنية
                          </button>
                          <button
                            type="button"
                            onClick={() => setBuildingType('commercial')}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${
                              buildingType === 'commercial'
                                ? 'bg-white text-stone-900 shadow-2xs'
                                : 'text-stone-500 hover:text-stone-800'
                            }`}
                          >
                            عمارة تجارية
                          </button>
                        </div>
                      </div>

                      {/* Main Metric Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {/* Rate Per Meter */}
                        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs flex flex-col justify-between">
                          <div className="flex items-center justify-between text-xs font-bold text-stone-500">
                            <span>سعر المتر المحسوب:</span>
                            <span className="text-[10px] text-stone-400 font-mono">ريال / م²</span>
                          </div>
                          <div className="mt-2.5 flex items-baseline gap-2">
                            <span className="text-3xl font-black text-[#433c71] font-mono tracking-tight">
                              {formulaResult.ratePerMeter.toFixed(2)}
                            </span>
                            <span className="text-xs text-stone-500 font-bold">ريال/م²</span>
                          </div>
                          <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
                            <span className="text-stone-400">المساحة المطبقة:</span>
                            <span className="font-bold text-stone-800 font-mono">
                              {effectivePricingArea} م²
                              {isDuplexActive && (
                                <span className="text-amber-700 text-[10px] mr-1">(نصف المساحة لفلل الدوبلكس)</span>
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Total Design Price */}
                        <div className="bg-white p-4 rounded-xl border-2 border-amber-500/40 bg-amber-50/20 shadow-2xs flex flex-col justify-between">
                          <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                            <span>إجمالي سعر التصميم:</span>
                            <span className="text-[10px] bg-amber-600 text-white font-bold px-2 py-0.5 rounded">
                              ناتج المعادلة
                            </span>
                          </div>
                          <div className="mt-2.5 flex items-baseline gap-2">
                            <span className="text-3xl font-black text-stone-950 font-mono tracking-tight">
                              {formatSAR(formulaResult.totalPrice)}
                            </span>
                          </div>
                          <div className="mt-2 pt-2 border-t border-amber-200/60 flex items-center justify-between text-[11px]">
                            <span className="text-stone-500">حالة المساحة:</span>
                            {formulaResult.areaStatus === 'within_range' ? (
                              <span className="font-bold text-emerald-700 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>ضمن النطاق المسموح</span>
                              </span>
                            ) : (
                              <span className="font-bold text-amber-800 flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                <span>{formulaResult.areaStatusLabel}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Parameters Table (matching Excel Table) */}
                      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden text-xs">
                        <div className="bg-stone-50 px-4 py-2.5 font-bold text-stone-800 border-b border-stone-200 flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Sliders className="w-3.5 h-3.5 text-stone-500" />
                            <span>جدول معطيات المعادلة الرسمية ({formulaConfig.buildingLabel})</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowFormulaCustomizer(!showFormulaCustomizer)}
                            className="text-[11px] text-[#433c71] hover:underline font-bold"
                          >
                            {showFormulaCustomizer ? 'إخفاء تخصيص الأسعار' : '⚙️ تخصيص أسعار المتر يدوياً'}
                          </button>
                        </div>

                        <div className="divide-y divide-stone-100 text-stone-700">
                          <div className="flex items-center justify-between px-4 py-2">
                            <span className="text-stone-500">أقل مساحة مسموحة (م²):</span>
                            <span className="font-bold font-mono text-stone-900">{formulaResult.minArea.toLocaleString('ar-SA')} م²</span>
                          </div>
                          <div className="flex items-center justify-between px-4 py-2">
                            <span className="text-stone-500">أعلى مساحة مسموحة (م²):</span>
                            <span className="font-bold font-mono text-stone-900">{formulaResult.maxArea.toLocaleString('ar-SA')} م²</span>
                          </div>
                          <div className="flex items-center justify-between px-4 py-2">
                            <span className="text-stone-500">أعلى سعر للمتر (ريال):</span>
                            <span className="font-bold font-mono text-stone-900">{formulaResult.maxRate.toFixed(2)} ريال (عند {formulaResult.minArea} م²)</span>
                          </div>
                          <div className="flex items-center justify-between px-4 py-2">
                            <span className="text-stone-500">أدنى سعر للمتر (ريال):</span>
                            <span className="font-bold font-mono text-stone-900">{formulaResult.minRate.toFixed(2)} ريال (عند {formulaResult.maxArea.toLocaleString('ar-SA')} م²)</span>
                          </div>
                        </div>

                        {/* Optional Customizer Form */}
                        {showFormulaCustomizer && (
                          <div className="bg-stone-50/80 p-3.5 border-t border-stone-200 space-y-3">
                            <div className="text-[11px] font-bold text-stone-700">
                              تعديل قيمتي أعلى وأدنى سعر للمتر (لتخصيص معادلة هذا المشروع):
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[11px] text-stone-600 block">
                                  أعلى سعر للمتر (عند {formulaResult.minArea} م²):
                                </label>
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="number"
                                    value={customFormulaRates.maxRate ?? formulaConfig.maxRate}
                                    onChange={(e) =>
                                      setCustomFormulaRates((prev) => ({
                                        ...prev,
                                        maxRate: Math.max(1, Number(e.target.value)),
                                      }))
                                    }
                                    className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1 text-xs font-bold text-stone-900"
                                  />
                                  <span className="text-[11px] text-stone-500">ريال</span>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[11px] text-stone-600 block">
                                  أدنى سعر للمتر (عند {formulaResult.maxArea.toLocaleString('ar-SA')} م²):
                                </label>
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="number"
                                    value={customFormulaRates.minRate ?? formulaConfig.minRate}
                                    onChange={(e) =>
                                      setCustomFormulaRates((prev) => ({
                                        ...prev,
                                        minRate: Math.max(1, Number(e.target.value)),
                                      }))
                                    }
                                    className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1 text-xs font-bold text-stone-900"
                                  />
                                  <span className="text-[11px] text-stone-500">ريال</span>
                                </div>
                              </div>
                            </div>

                            {(customFormulaRates.maxRate !== undefined || customFormulaRates.minRate !== undefined) && (
                              <button
                                type="button"
                                onClick={() => setCustomFormulaRates({})}
                                className="text-[11px] text-red-600 hover:underline font-bold"
                              >
                                استعادة أسعار المعادلة الافتراضية للشركة
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <p className="text-[11px] text-stone-500">
                        {formulaConfig.description}
                      </p>
                    </div>
                  </div>
                )}

                {designPricingMode === 'itemized' && (
                  /* Itemized mode checkboxes */
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {subItems.map((item) => (
                        <div
                          key={item.id}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition ${
                            item.selected
                              ? 'bg-stone-50 border-amber-400/80 shadow-2xs'
                              : 'bg-stone-50/50 border-stone-200 opacity-60'
                          }`}
                        >
                          <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                            <input
                              type="checkbox"
                              checked={item.selected}
                              onChange={() => handleToggleSubItem(item.id)}
                              className="w-4 h-4 accent-amber-600 rounded"
                            />
                            <span className="text-xs font-bold text-stone-800">{item.name}</span>
                          </label>

                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              value={item.defaultPrice}
                              onChange={(e) =>
                                handleSubItemPriceChange(item.id, Number(e.target.value))
                              }
                              disabled={!item.selected}
                              className="w-20 bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs text-left font-bold"
                            />
                            <span className="text-[11px] text-stone-400">ريال</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center text-xs text-stone-600 bg-stone-100 p-2 rounded-xl">
                      <span>إجمالي بنود التصميم المختارة:</span>
                      <span className="font-bold text-stone-900">{formatSAR(itemizedSubtotal)}</span>
                    </div>
                  </div>
                )}

                {/* Optional Manual Price Override for Design - Just like Supervision */}
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-stone-500 shrink-0" />
                    <div>
                      <span className="text-stone-700 font-bold block">
                        تعديل سعر التصميم يدوياً (إذا لزم):
                      </span>
                      <span className="text-[11px] text-stone-400">
                        {customDesignPrice !== null
                          ? `سعر يدوي معتمد حالياً (${formatSAR(customDesignPrice)})`
                          : `السعر المحسوب بالطريقة المختارة (${formatSAR(computedDesignFee)})`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder={String(computedDesignFee)}
                      value={customDesignPrice !== null ? customDesignPrice : ''}
                      onChange={(e) =>
                        setCustomDesignPrice(
                          e.target.value === '' ? null : Number(e.target.value)
                        )
                      }
                      className="w-28 bg-white border border-stone-300 rounded-lg px-2 py-1 text-center font-bold text-stone-900 shadow-2xs"
                    />
                    <span className="text-stone-500">ريال</span>
                    {customDesignPrice !== null && (
                      <button
                        type="button"
                        onClick={() => setCustomDesignPrice(null)}
                        className="text-[11px] text-red-600 hover:underline font-bold"
                      >
                        استعادة الافتراضي
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Part 2: Supervision Service */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-stone-900 text-white text-[11px] flex items-center justify-center font-bold">
                        2
                      </span>
                      <span>خدمة الإشراف الهندسي (أعمال العظم)</span>
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      الإشراف الميداني الهندسي المعتمد لرخصة البناء
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* None */}
                  <button
                    type="button"
                    onClick={() => {
                      setSupervisionType('none');
                      setCustomSupervisionPrice(null);
                      if (onUpdateClientInfo) {
                        const currentScope = clientInfo?.scopeFlags || ({} as any);
                        const currentExclusions = clientInfo?.exclusions || ({} as any);
                        onUpdateClientInfo({
                          scopeFlags: {
                            ...currentScope,
                            supervision: false,
                          },
                          exclusions: {
                            ...currentExclusions,
                            excludeSupervision: true,
                          },
                        });
                      }
                    }}
                    className={`p-3.5 rounded-xl border text-right transition flex flex-col justify-between ${
                      supervisionType === 'none'
                        ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">بدون إشراف هندسي</div>
                      <div className="text-[11px] text-stone-400 mt-1">تصميم مخططات فقط</div>
                    </div>
                    <div className="text-sm font-black mt-3">0 ريال</div>
                  </button>

                  {/* Lump Sum (10 visits) */}
                  <button
                    type="button"
                    onClick={() => {
                      setSupervisionType('lump_sum');
                      setCustomSupervisionPrice(null);
                      if (onUpdateClientInfo) {
                        const currentScope = clientInfo?.scopeFlags || ({} as any);
                        const currentExclusions = clientInfo?.exclusions || ({} as any);
                        onUpdateClientInfo({
                          scopeFlags: {
                            ...currentScope,
                            supervision: true,
                          },
                          exclusions: {
                            ...currentExclusions,
                            excludeSupervision: false,
                          },
                        });
                      }
                    }}
                    className={`p-3.5 rounded-xl border text-right transition flex flex-col justify-between ${
                      supervisionType === 'lump_sum'
                        ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">إشراف مقطوع</div>
                      <div className="text-[11px] opacity-80 mt-0.5">
                        10 زيارات هندسية لأعمال العظم
                      </div>
                    </div>
                    <div className="text-sm font-black mt-3">
                      {formatSAR(getSupervisionPrice('lump_sum', effectivePricingArea).price)}
                    </div>
                  </button>

                  {/* Monthly */}
                  <button
                    type="button"
                    onClick={() => {
                      setSupervisionType('monthly');
                      setCustomSupervisionPrice(null);
                      if (onUpdateClientInfo) {
                        const currentScope = clientInfo?.scopeFlags || ({} as any);
                        const currentExclusions = clientInfo?.exclusions || ({} as any);
                        onUpdateClientInfo({
                          scopeFlags: {
                            ...currentScope,
                            supervision: true,
                          },
                          exclusions: {
                            ...currentExclusions,
                            excludeSupervision: false,
                          },
                        });
                      }
                    }}
                    className={`p-3.5 rounded-xl border text-right transition flex flex-col justify-between ${
                      supervisionType === 'monthly'
                        ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">إشراف شهري كامل</div>
                      <div className="text-[11px] opacity-80 mt-0.5">
                        متابعة مستمرة لكامل مراحل البناء
                      </div>
                    </div>
                    <div className="text-sm font-black mt-3">
                      {formatSAR(getSupervisionPrice('monthly', effectivePricingArea).price)}
                    </div>
                  </button>
                </div>

                {supervisionType !== 'none' && (
                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs flex items-center justify-between">
                    <span className="text-stone-600 font-medium">
                      تعديل سعر الإشراف يدوياً (إذا لزم):
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder={String(supervisionFee)}
                        value={customSupervisionPrice !== null ? customSupervisionPrice : ''}
                        onChange={(e) =>
                          setCustomSupervisionPrice(
                            e.target.value === '' ? null : Number(e.target.value)
                          )
                        }
                        className="w-24 bg-white border border-stone-300 rounded-lg px-2 py-1 text-center font-bold text-stone-900"
                      />
                      <span className="text-stone-500">ريال</span>
                      {customSupervisionPrice !== null && (
                        <button
                          type="button"
                          onClick={() => setCustomSupervisionPrice(null)}
                          className="text-[11px] text-red-600 hover:underline"
                        >
                          استعادة الافتراضي
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Fixed price service box (رخصة ترميم مبنى أو رخصة هدم) */
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h3 className="text-sm font-black text-stone-800 flex items-center gap-2">
                  <span>
                    {serviceType === 'renovation'
                      ? 'تسعير خدمة رخصة ترميم مبنى (سعر مقطوع ثابت)'
                      : 'تسعير خدمة رخصة هدم (سعر مقطوع ثابت)'}
                  </span>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                    سعر ثابت وليس شرائح
                  </span>
                </h3>
              </div>

              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-stone-800 block">
                    {serviceType === 'renovation'
                      ? `أتعاب رخصة ترميم المبنى (${
                          buildingType === 'hotel'
                            ? 'الفنادق: 5,000 ريال'
                            : buildingType === 'villa' || buildingType === 'rest_house'
                            ? 'الفلل والاستراحات: 2,000 ريال'
                            : 'العمائر السكنية والتجارية: 3,000 ريال'
                        }):`
                      : `أتعاب خدمة رخصة الهدم وإصدار التقرير الفني المعتمد (${
                          buildingType === 'hotel' ? 'الفنادق: 3,000 ريال' : '1,000 ريال'
                        }):`}
                  </span>
                  <p className="text-[11px] text-stone-500">
                    {serviceType === 'renovation'
                      ? 'سعر مقطوع ثابت معتمد لكامل إجراءات رخصة الترميم والتصاميم الهندسية، مع إمكانية التعديل يدوياً.'
                      : `سعر مقطوع ثابت معتمد (${
                          buildingType === 'hotel' ? '3,000 ريال' : '1,000 ريال'
                        }) لإصدار رخصة الهدم ورفع المخططات عبر بلدي.`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="number"
                    value={serviceType === 'renovation' ? renovationPrice : demolitionPrice}
                    onChange={(e) => {
                      const val = Math.max(0, Number(e.target.value));
                      if (serviceType === 'renovation') {
                        setRenovationPrice(val);
                      } else {
                        setDemolitionPrice(val);
                      }
                    }}
                    className="w-28 bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-center font-bold text-stone-900"
                  />
                  <span className="text-xs font-bold text-stone-500">ريال</span>
                </div>
              </div>
            </div>
          )}

          {/* Discounts & Tax Controls (الخصومات والضريبة النظامية) - قائمة ثابتة وموحدة لجميع الأقسام */}
          <DiscountAndTaxSection clientInfo={clientInfo} onUpdateClientInfo={onUpdateClientInfo} />
        </div>

        {/* Right Column: Live Summary Card & Action Button */}
        <div className="lg:col-span-4">
          <div className="bg-stone-900 text-stone-100 p-5 rounded-2xl border border-stone-800 shadow-lg sticky top-[135px] space-y-5">
            <div className="border-b border-stone-800 pb-3">
              <span className="text-[11px] text-amber-400 font-bold uppercase tracking-wider">
                ملخص تسعير قسم التصميم
              </span>
              <h3 className="text-lg font-black text-white mt-1">
                {SERVICE_TYPE_DISPLAY_NAMES[serviceType]}
              </h3>
              <p className="text-xs text-stone-400">
                {isDuplexActive
                  ? 'فلل دوبلكس'
                  : BUILDING_TYPE_SHORT_LABELS[buildingType] || 'مشروع هندسي'}{' '}
                - مساحة {area} م²
              </p>
            </div>

            {/* Financial breakdown */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-stone-300">
                <span>{SERVICE_TYPE_FEE_LABELS[serviceType]}</span>
                <span className="font-bold text-white">{formatSAR(baseDesignFee)}</span>
              </div>

              {isTierService && supervisionType !== 'none' && (
                <div className="flex justify-between items-center text-stone-300">
                  <span>خدمة الإشراف الهندسي:</span>
                  <span className="font-bold text-white">
                    {formatSAR(supervisionFee)}
                  </span>
                </div>
              )}

              {/* Geographic Zone Adjustment (تعديل موقع الحي بالرياض) */}
              {clientInfo?.locationZone && clientInfo.locationZone !== 'none' && (
                <div
                  className={`flex justify-between items-center p-2 rounded-lg border text-xs font-bold ${
                    zoneConfig.adjustmentPercent > 0
                      ? 'text-amber-300 bg-amber-500/15 border-amber-500/30'
                      : 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30'
                  }`}
                >
                  <span>موقع الحي: {zoneConfig.label}</span>
                  <span className="font-mono text-sm">
                    {zoneConfig.adjustmentPercent > 0
                      ? `+${formatSAR(finalTotal - subtotalBeforeZone)}`
                      : `-${formatSAR(subtotalBeforeZone - finalTotal)}`}
                  </span>
                </div>
              )}

              {/* Discount if present in clientInfo */}
              {clientInfo && clientInfo.discountValue > 0 && (
                <div className="flex justify-between items-center text-emerald-400 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                  <span>
                    خصم خاص ({clientInfo.discountType === 'percentage' ? `${clientInfo.discountValue}%` : 'مقطوع'}):
                  </span>
                  <span className="font-bold">
                    -{formatSAR(
                      clientInfo.discountType === 'percentage'
                        ? Math.round((finalTotal * clientInfo.discountValue) / 100)
                        : Math.min(clientInfo.discountValue, finalTotal)
                    )}
                  </span>
                </div>
              )}

              {/* VAT if enabled in clientInfo */}
              {clientInfo?.includeTax && (
                <div className="flex justify-between items-center text-amber-300">
                  <span>ضريبة القيمة المضافة (15%):</span>
                  <span className="font-bold">
                    +{formatSAR(
                      Math.round(
                        (finalTotal -
                          (clientInfo.discountValue > 0
                            ? clientInfo.discountType === 'percentage'
                              ? (finalTotal * clientInfo.discountValue) / 100
                              : Math.min(clientInfo.discountValue, finalTotal)
                            : 0)) *
                          0.15
                      )
                    )}
                  </span>
                </div>
              )}

              <div className="pt-3 border-t border-stone-800 flex justify-between items-baseline">
                <span className="text-sm font-bold text-stone-300">
                  {clientInfo?.includeTax ? 'الإجمالي شامل الضريبة:' : 'الإجمالي غير شامل الضريبة:'}
                </span>
                <span className="text-2xl font-black text-amber-400">
                  {formatSAR(
                    (() => {
                      const disc =
                        clientInfo && clientInfo.discountValue > 0
                          ? clientInfo.discountType === 'percentage'
                            ? Math.round((finalTotal * clientInfo.discountValue) / 100)
                            : Math.min(clientInfo.discountValue, finalTotal)
                          : 0;
                      const afterDisc = Math.max(0, finalTotal - disc);
                      const tax = clientInfo?.includeTax ? Math.round(afterDisc * 0.15) : 0;
                      return afterDisc + tax;
                    })()
                  )}
                </span>
              </div>
              <p className="text-[10px] text-stone-400 text-left">
                {clientInfo?.includeTax
                  ? 'شامل ضريبة القيمة المضافة (15%)'
                  : 'غير شامل ضريبة القيمة المضافة (15%)'}
              </p>
            </div>

            {/* Inclusions summary pills */}
            <div className="bg-stone-800/60 p-3 rounded-xl border border-stone-800 text-[11px] text-stone-300 space-y-1.5">
              <div className="font-bold text-stone-200">الخدمات المتضمنة:</div>
              <ul className="space-y-1 text-stone-400">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>
                    {serviceType === 'plan_design'
                      ? 'تسليم المخططات الهندسية التنفيذية المعتمدة'
                      : 'اعتماد المخططات عبر منصة بلدي'}
                  </span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>المطابقة مع كود البناء السعودي (SBC)</span>
                </li>
                {supervisionType !== 'none' && isTierService && (
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span>تقارير استلام هندسية معتمدة لكل مرحلة</span>
                  </li>
                )}
              </ul>
            </div>

            {/* Add to quotation button */}
            <button
              type="button"
              onClick={handleAddCurrentToQuote}
              className="w-full bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-black py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة هذا البند إلى عرض السعر</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
