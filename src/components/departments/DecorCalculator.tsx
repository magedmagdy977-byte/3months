import React, { useState, useEffect } from 'react';
import { BuildingType, DecorStyle, QuotationItem } from '../../types';
import { calculateDecorPrice, DECOR_DELIVERABLES } from '../../data/pricingData';
import { formatSAR } from '../../utils/formatters';
import { ClientInfo } from '../../types';
import { DiscountAndTaxSection } from '../common/DiscountAndTaxSection';
import {
  Palette,
  Sparkles,
  Home,
  Building,
  Store,
  CheckCircle2,
  Plus,
  FileCheck,
  Calculator,
  Sliders,
  Pencil,
  AlertCircle,
  Trash2,
  RotateCcw,
} from 'lucide-react';

interface DecorCalculatorProps {
  onAddItem: (item: QuotationItem) => void;
  clientInfo?: ClientInfo;
  onUpdateClientInfo?: (info: Partial<ClientInfo>) => void;
}

export const DecorCalculator: React.FC<DecorCalculatorProps> = ({
  onAddItem,
  clientInfo,
  onUpdateClientInfo,
}) => {
  const [buildingType, setBuildingType] = useState<BuildingType>(() => {
    const b = clientInfo?.buildingType || '';
    if (b.includes('تجاري')) return 'commercial';
    if (b.includes('عمارة')) return 'residential';
    return 'villa';
  });

  useEffect(() => {
    if (clientInfo?.buildingType) {
      const b = clientInfo.buildingType;
      if (b.includes('تجاري') && buildingType !== 'commercial') setBuildingType('commercial');
      else if (b.includes('عمارة') && buildingType !== 'residential') setBuildingType('residential');
      else if (b.includes('فيلا') && buildingType !== 'villa') setBuildingType('villa');
    }
  }, [clientInfo?.buildingType]);

  const handleSelectDecorBuilding = (bType: BuildingType) => {
    setBuildingType(bType);
    if (onUpdateClientInfo) {
      const labels: Record<string, string> = {
        villa: 'فيلا سكنية خاصة',
        residential: 'عمارة سكنية متعددة الأدوار',
        commercial: 'عمارة تجارية / إدارية',
      };
      const label = labels[bType] || 'فيلا سكنية';
      onUpdateClientInfo({
        buildingType: label,
        projectTitle: `مشروع ${label}`,
      });
    }
  };
  const [decorStyle, setDecorStyle] = useState<DecorStyle>('modern');
  const [area, setArea] = useState<number>(() => clientInfo?.floorArea || 350);
  const [areaInputStr, setAreaInputStr] = useState<string>(() => String(clientInfo?.floorArea || 350));
  const [manualPrice, setManualPrice] = useState<number | null>(null);
  const [includedDeliverables, setIncludedDeliverables] = useState<string[]>(DECOR_DELIVERABLES);
  const [customPriceOverride, setCustomPriceOverride] = useState<number | null>(null);

  // Sync floor area from clientInfo if updated externally
  useEffect(() => {
    if (clientInfo?.floorArea && clientInfo.floorArea !== area) {
      setArea(clientInfo.floorArea);
      setAreaInputStr(String(clientInfo.floorArea));
    }
  }, [clientInfo?.floorArea]);

  const isLessThan200 = area < 200;
  const priceCalculation = calculateDecorPrice(decorStyle, area);
  const calculatedTotal = priceCalculation.total;
  const activePrice = isLessThan200
    ? (manualPrice !== null ? manualPrice : 0)
    : customPriceOverride !== null
    ? customPriceOverride
    : calculatedTotal;

  const handleToggleDeliverable = (item: string) => {
    setIncludedDeliverables((prev) => {
      const next = prev.includes(item) ? prev.filter((d) => d !== item) : [...prev, item];
      syncDeliverablesWithFlags(next);
      return next;
    });
  };

  const handleDeleteDeliverable = (item: string) => {
    setIncludedDeliverables((prev) => {
      const next = prev.filter((d) => d !== item);
      syncDeliverablesWithFlags(next);
      return next;
    });
  };

  const handleRestoreDeliverable = (item: string) => {
    setIncludedDeliverables((prev) => {
      const next = prev.includes(item) ? prev : [...prev, item];
      syncDeliverablesWithFlags(next);
      return next;
    });
  };

  const syncDeliverablesWithFlags = (deliverables: string[]) => {
    if (onUpdateClientInfo && clientInfo) {
      onUpdateClientInfo({
        scopeFlags: {
          ...clientInfo.scopeFlags,
          decor_as_built: deliverables.includes('رفع مساحي As-Built للموقع'),
          decor_moodboard: deliverables.includes('لوحة أفكار ومود بورد (Moodboard)'),
          decor_3d_renders: deliverables.includes('لقطات وتصاميم ثلاثية الأبعاد (3D Renders)'),
          decor_shop_drawings: deliverables.includes('المخططات التنفيذية التفصيلية (Shop Drawings)'),
          decor_specifications: deliverables.includes('جداول المواصفات واختيار المواد (Specifications)'),
          decor_boq: deliverables.includes('جداول الكميات وحصر المواد (BOQ)'),
        },
      });
    }
  };

  const handleQuickArea = (val: number) => {
    setArea(val);
    setAreaInputStr(String(val));
    setCustomPriceOverride(null);
    if (onUpdateClientInfo) {
      onUpdateClientInfo({
        floorArea: val,
      });
    }
  };

  const handleAreaInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setAreaInputStr(raw);
    const num = Number(raw);
    if (!isNaN(num) && num > 0) {
      setArea(num);
      setCustomPriceOverride(null);
      if (onUpdateClientInfo) {
        onUpdateClientInfo({
          floorArea: num,
        });
      }
    }
  };

  const handleAreaInputBlur = () => {
    const num = Number(areaInputStr);
    const finalVal = isNaN(num) || num <= 0 ? 350 : num;
    setArea(finalVal);
    setAreaInputStr(String(finalVal));
    if (onUpdateClientInfo) {
      onUpdateClientInfo({
        floorArea: finalVal,
      });
    }
  };

  const handleAddCurrentToQuote = () => {
    if (isLessThan200 && (!manualPrice || manualPrice <= 0)) {
      alert('يرجى إدخال السعر في خانة السعر اليدوي أولاً قبل إضافة العرض');
      return;
    }

    const buildingTypeLabels: Record<BuildingType, string> = {
      villa: 'فيلا سكنية',
      residential: 'عمارة سكنية',
      commercial: 'عمارة تجارية',
      rest_house: 'استراحة / شاليهات',
      hotel: 'فندق / ضيافة',
      gas_station: 'محطة وقود',
      factory: 'مصنع',
      warehouse_workshop: 'ورش ومستودعات',
    };

    const styleLabels: Record<DecorStyle, string> = {
      modern: 'طراز مودرن (عصري حديث)',
      neoclassic: 'طراز نيوكلاسيك (كلاسيك معاصر)',
      classic: 'طراز كلاسيك (فخم ملكي)',
    };

    const detailsList: string[] = [
      `نوع المشروع: ${buildingTypeLabels[buildingType]}`,
      `طراز الديكور: ${styleLabels[decorStyle]}`,
      isLessThan200
        ? `مساحة الديكور: ${area} م² (أقل من 200 م² - تسعير يدوي مخصص)`
        : `مساحة الديكور: ${area} م² (${priceCalculation.tierDescription})`,
      isLessThan200
        ? `السعر المحدد يدوياً: ${formatSAR(activePrice)}`
        : `معادلة الحساب: ${priceCalculation.formulaDescription}`,
      ...includedDeliverables.map((deliv, idx) => `${idx + 1}. ${deliv}`),
    ];

    if (!isLessThan200 && customPriceOverride !== null) {
      detailsList.push(`تعديل سعري يدوي متفق عليه: ${formatSAR(customPriceOverride)}`);
    }

    if (onUpdateClientInfo && clientInfo) {
      onUpdateClientInfo({
        floorArea: area,
        serviceType: 'التصميم الداخلي والديكور',
        scopeFlags: {
          ...clientInfo.scopeFlags,
          decor_as_built: includedDeliverables.includes('رفع مساحي As-Built للموقع'),
          decor_moodboard: includedDeliverables.includes('لوحة أفكار ومود بورد (Moodboard)'),
          decor_3d_renders: includedDeliverables.includes('لقطات وتصاميم ثلاثية الأبعاد (3D Renders)'),
          decor_shop_drawings: includedDeliverables.includes('المخططات التنفيذية التفصيلية (Shop Drawings)'),
          decor_specifications: includedDeliverables.includes('جداول المواصفات واختيار المواد (Specifications)'),
          decor_boq: includedDeliverables.includes('جداول الكميات وحصر المواد (BOQ)'),
        },
      });
    }

    const newItem: QuotationItem = {
      id: `decor-${Date.now()}`,
      departmentId: 'decor',
      departmentName: 'قسم الديكور',
      title: `تصميم ديكور داخلي (${styleLabels[decorStyle]}) - ${buildingTypeLabels[buildingType]}`,
      buildingTypeLabel: buildingTypeLabels[buildingType],
      area,
      details: detailsList,
      deliverables: [...includedDeliverables],
      basePrice: activePrice,
      totalPrice: activePrice,
      notes: isLessThan200
        ? `المساحة: ${area}م² (أقل من 200 م² - تسعير يدوي) | الطراز: ${styleLabels[decorStyle]}`
        : `المساحة: ${area}م² | الطراز: ${styleLabels[decorStyle]}`,
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
              قسم الديكور والتصميم الداخلي
            </span>
            <span className="text-xs text-stone-500">حساب الأنماط والشرائح بالمتر المربع</span>
          </div>
          <h2 className="text-xl font-black text-stone-900 mt-1">
            تسعير خدمات التصميم الداخلي والديكور
          </h2>
        </div>

        {/* Building type selector */}
        <div className="flex items-center gap-2 bg-stone-100 p-1.5 rounded-xl border border-stone-200">
          <button
            type="button"
            onClick={() => handleSelectDecorBuilding('villa')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              buildingType === 'villa'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>فلل</span>
          </button>
          <button
            type="button"
            onClick={() => handleSelectDecorBuilding('residential')}
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
            onClick={() => handleSelectDecorBuilding('commercial')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              buildingType === 'commercial'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>عمارة تجارية</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configurator */}
        <div className="lg:col-span-8 space-y-6">
          {/* Style Selector */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-stone-800 flex items-center gap-2">
                <Palette className="w-4 h-4 text-amber-500" />
                <span>اختر نمط وطراز الديكور الداخلي</span>
              </h3>
              <span className="text-xs text-stone-500">حسب طلب العميل</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'modern' as DecorStyle,
                  name: 'مودرن (Modern)',
                  desc: 'خطوط هندسية نظيفة وبساطة عصرية راقية',
                  tag: 'الأكثر طلباً',
                  color: 'amber',
                },
                {
                  id: 'neoclassic' as DecorStyle,
                  name: 'نيوكلاسيك (Neoclassic)',
                  desc: 'مزيج متناغم بين الفخامة الكلاسيكية والروح المعاصرة',
                  tag: 'فخامة متزنة',
                  color: 'stone',
                },
                {
                  id: 'classic' as DecorStyle,
                  name: 'كلاسيك (Classic)',
                  desc: 'زخارف غنية، تفاصيل معمارية بارزة وطابع ملكي',
                  tag: 'فخامة ملكية',
                  color: 'stone',
                },
              ].map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => {
                    setDecorStyle(style.id);
                    setCustomPriceOverride(null);
                  }}
                  className={`p-4 rounded-xl border text-right transition flex flex-col justify-between gap-3 ${
                    decorStyle === style.id
                      ? 'bg-stone-900 text-white border-stone-900 shadow-md ring-2 ring-amber-500/30'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">{style.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          decorStyle === style.id
                            ? 'bg-amber-400 text-stone-950'
                            : 'bg-stone-200 text-stone-700'
                        }`}
                      >
                        {style.tag}
                      </span>
                    </div>
                    <p
                      className={`text-[11px] mt-1.5 leading-relaxed ${
                        decorStyle === style.id ? 'text-stone-300' : 'text-stone-500'
                      }`}
                    >
                      {style.desc}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-stone-700/40 text-[11px] font-bold text-amber-400">
                    {area < 200
                      ? 'تسعير يدوي (حسب الاتفاق)'
                      : style.id === 'modern'
                      ? 'من 40 إلى 60 ريال / م²'
                      : style.id === 'neoclassic'
                      ? 'من 60 إلى 80 ريال / م²'
                      : 'من 80 إلى 100 ريال / م²'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Area Input & Tier Matrix */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-stone-800 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-amber-500" />
                  <span>اختر شريحة مساحة أعمال الديكور:</span>
                </label>
                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  {area < 200 ? 'شريحة: أقل من 200 م² (تسعير يدوي)' : `المساحة المحددة: ${area} م²`}
                </span>
              </div>

              {/* 4 Official Tier Selection Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setArea(150);
                    setAreaInputStr('150');
                    setCustomPriceOverride(null);
                  }}
                  className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    area < 200
                      ? 'bg-amber-500 text-stone-950 border-amber-600 shadow-md ring-2 ring-amber-400 font-black'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200 font-bold'
                  }`}
                >
                  <span className="text-xs font-black">أقل من 200 م²</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      area < 200
                        ? 'bg-stone-950 text-amber-300'
                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}
                  >
                    ✍️ إدخال السعر يدوياً
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setArea(350);
                    setAreaInputStr('350');
                    setCustomPriceOverride(null);
                  }}
                  className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    area >= 200 && area <= 1000
                      ? 'bg-amber-500 text-stone-950 border-amber-600 shadow-md ring-2 ring-amber-400 font-black'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200 font-bold'
                  }`}
                >
                  <span className="text-xs font-black">200 إلى 1,000 م²</span>
                  <span
                    className={`text-[10px] ${
                      area >= 200 && area <= 1000 ? 'text-stone-950 font-bold' : 'text-stone-500'
                    }`}
                  >
                    (المساحة × سعر المتر)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setArea(1200);
                    setAreaInputStr('1200');
                    setCustomPriceOverride(null);
                  }}
                  className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    area > 1000 && area <= 2000
                      ? 'bg-amber-500 text-stone-950 border-amber-600 shadow-md ring-2 ring-amber-400 font-black'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200 font-bold'
                  }`}
                >
                  <span className="text-xs font-black">1,000 إلى 2,000 م²</span>
                  <span
                    className={`text-[10px] ${
                      area > 1000 && area <= 2000 ? 'text-stone-950 font-bold' : 'text-stone-500'
                    }`}
                  >
                    (المساحة × سعر المتر)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setArea(2500);
                    setAreaInputStr('2500');
                    setCustomPriceOverride(null);
                  }}
                  className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    area > 2000
                      ? 'bg-amber-500 text-stone-950 border-amber-600 shadow-md ring-2 ring-amber-400 font-black'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200 font-bold'
                  }`}
                >
                  <span className="text-xs font-black">أكبر من 2,000 م²</span>
                  <span
                    className={`text-[10px] ${
                      area > 2000 ? 'text-stone-950 font-bold' : 'text-stone-500'
                    }`}
                  >
                    (المساحة × سعر المتر)
                  </span>
                </button>
              </div>
            </div>

            {/* PERMANENT STABLE FLOOR AREA INPUT (لا يختفي أو يغير مكانه أثناء التعديل إطلاقاً) */}
            <div className="space-y-3 pt-1 bg-stone-50/70 p-4 rounded-2xl border border-stone-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label htmlFor="decor-area-input" className="text-xs font-bold text-stone-800 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-amber-500" />
                  <span>تعديل المساحة الطابقية الدقيقة (م²):</span>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                    مساحة أعمال الديكور والتصميم الداخلي
                  </span>
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[120, 320, 650, 1200, 1800, 2400].map((quick) => (
                    <button
                      key={quick}
                      type="button"
                      onClick={() => handleQuickArea(quick)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition cursor-pointer ${
                        area === quick
                          ? 'bg-amber-500 text-stone-950 border-amber-600 font-bold shadow-2xs'
                          : 'bg-white text-stone-600 hover:bg-stone-100 border-stone-200'
                      }`}
                    >
                      {quick} م²
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <input
                    id="decor-area-input"
                    type="number"
                    min="1"
                    step="1"
                    value={areaInputStr}
                    onChange={handleAreaInputChange}
                    onBlur={handleAreaInputBlur}
                    placeholder="اكتب المساحة الدقيقة بالمتر المربع..."
                    className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-stone-900 text-sm font-bold focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden transition shadow-2xs"
                  />
                  <span className="absolute left-3.5 top-2.5 text-xs text-stone-400 font-bold pointer-events-none">
                    متر مربع
                  </span>
                </div>

                {!isLessThan200 ? (
                  <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap shadow-2xs">
                    <span>المعادلة المطبقة:</span>
                    <span className="text-amber-800 underline decoration-amber-400">
                      {priceCalculation.formulaDescription}
                    </span>
                  </div>
                ) : (
                  <div className="bg-amber-100/90 border border-amber-300 text-amber-950 px-3.5 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 whitespace-nowrap shadow-2xs">
                    <span>⚠️ أقل من 200 م² — مطلوب إدخال السعر يدوياً أدناه</span>
                  </div>
                )}
              </div>
            </div>

            {/* DEDICATED MANUAL PRICE INPUT CARD (يظهر بوضوح تحت المساحة عند الشريحة < 200 م²) */}
            {isLessThan200 && (
              <div className="bg-gradient-to-l from-amber-50 to-orange-50 border-2 border-amber-400 p-5 rounded-2xl shadow-xs space-y-3.5 animate-in fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-amber-500 text-stone-950 rounded-xl shadow-xs">
                      <Pencil className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-stone-950">
                        خانة إدخال السعر يدوياً (المساحة المحددة {area} م² - أقل من 200 م²):
                      </h4>
                      <p className="text-xs text-stone-700">
                        لا توجد تسعيرة ثابتة باللائحة للمساحات الأقل من 200 م² — أدخل السعر المتفق عليه بنفسك هنا:
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-900 mb-1.5">
                    أدخل السعر المطلوب لمساحة ({area} م²):
                  </label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min="1"
                        step="100"
                        placeholder="اكتب السعر هنا بالريال السعودي (مثال: 12000)..."
                        value={manualPrice !== null ? manualPrice : ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? null : Math.max(0, Number(e.target.value));
                          setManualPrice(val);
                        }}
                        className="w-full bg-white border-2 border-amber-500 rounded-xl px-4 py-3 text-stone-950 text-base font-black focus:ring-2 focus:ring-amber-500 outline-hidden shadow-xs placeholder:text-stone-400 placeholder:font-normal"
                      />
                      <span className="absolute left-4 top-3 text-sm text-stone-500 font-bold">
                        ريال سعودي
                      </span>
                    </div>

                    {/* Quick suggestion amounts if needed */}
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className="text-[11px] text-stone-500 font-medium">مبالغ شائعة:</span>
                      {[5000, 8000, 10000, 12000, 15000].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setManualPrice(preset)}
                          className={`text-xs px-2.5 py-2 rounded-lg border font-bold transition cursor-pointer ${
                            manualPrice === preset
                              ? 'bg-stone-900 text-amber-300 border-stone-900 shadow-xs'
                              : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-300'
                          }`}
                        >
                          {preset.toLocaleString('ar-SA')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {(!manualPrice || manualPrice <= 0) && (
                    <div className="text-xs text-amber-900 font-bold flex items-center gap-1.5 mt-2 bg-amber-100/70 p-2 rounded-lg border border-amber-300">
                      <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                      <span>الخانة بانتظار إدخال السعر اليدوي المطلوب ليتم اعتماده وإضافته لعرض السعر</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Official Prompt Tier Table Comparison */}
            <div className="pt-3 border-t border-stone-100">
              <div className="text-xs font-bold text-stone-700 mb-2">
                جدول مقارنة شرائح تسعير الديكور المعتمدة:
              </div>
              <div className="overflow-x-auto rounded-xl border border-stone-200">
                <table className="w-full text-xs text-stone-800 text-right">
                  <thead className="bg-stone-100 text-stone-700 font-bold">
                    <tr>
                      <th className="p-2.5 border-b border-stone-200">شريحة المساحة</th>
                      <th
                        className={`p-2.5 border-b border-stone-200 ${
                          decorStyle === 'modern' ? 'bg-amber-100 text-amber-950 font-black' : ''
                        }`}
                      >
                        مودرن
                      </th>
                      <th
                        className={`p-2.5 border-b border-stone-200 ${
                          decorStyle === 'neoclassic' ? 'bg-amber-100 text-amber-950 font-black' : ''
                        }`}
                      >
                        نيوكلاسيك
                      </th>
                      <th
                        className={`p-2.5 border-b border-stone-200 ${
                          decorStyle === 'classic' ? 'bg-amber-100 text-amber-950 font-black' : ''
                        }`}
                      >
                        كلاسيك
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 bg-white">
                    <tr className={area < 200 ? 'bg-amber-500/10 font-bold' : ''}>
                      <td className="p-2.5">
                        أقل من 200 م²
                      </td>
                      <td className="p-2.5 text-amber-700 font-bold" colSpan={3}>
                        تسعير يدوي حسب الاتفاق (لا توجد شريحة أسعار ثابتة)
                      </td>
                    </tr>
                    <tr className={area >= 200 && area <= 1000 ? 'bg-amber-50/70 font-bold' : ''}>
                      <td className="p-2.5">من 200 إلى 1,000 م²</td>
                      <td className="p-2.5">المساحة × 60 ريال</td>
                      <td className="p-2.5">المساحة × 80 ريال</td>
                      <td className="p-2.5">المساحة × 100 ريال</td>
                    </tr>
                    <tr className={area > 1000 && area <= 2000 ? 'bg-amber-50/70 font-bold' : ''}>
                      <td className="p-2.5">من 1,000 إلى 2,000 م²</td>
                      <td className="p-2.5">المساحة × 50 ريال</td>
                      <td className="p-2.5">المساحة × 70 ريال</td>
                      <td className="p-2.5">المساحة × 90 ريال</td>
                    </tr>
                    <tr className={area > 2000 ? 'bg-amber-50/70 font-bold' : ''}>
                      <td className="p-2.5">أكبر من 2,000 م²</td>
                      <td className="p-2.5">المساحة × 40 ريال</td>
                      <td className="p-2.5">المساحة × 60 ريال</td>
                      <td className="p-2.5">المساحة × 80 ريال</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Deliverables Checklist with explicit delete/restore options */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 pb-3 gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-stone-800 flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-amber-500" />
                    <span>مخرجات التصميم الداخلي المعتمدة (قسم الديكور — 6 وحدات شرطية IF)</span>
                  </h3>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full">
                    إمكانية الحذف والاستبعاد متاحة ✓
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  خاصة بقسم الديكور: يمكنك حذف أو استبعاد أو إعادة تفعيل أي بند من مخرجات الديكور حسب الاتفاق مع العميل.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIncludedDeliverables([...DECOR_DELIVERABLES]);
                    syncDeliverablesWithFlags([...DECOR_DELIVERABLES]);
                  }}
                  className="text-[10.5px] font-bold bg-stone-100 hover:bg-stone-200 text-stone-800 px-2.5 py-1.5 rounded-lg border border-stone-300 transition cursor-pointer"
                >
                  تحديد الكل (6)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIncludedDeliverables([]);
                    syncDeliverablesWithFlags([]);
                  }}
                  className="text-[10.5px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 px-2.5 py-1.5 rounded-lg border border-rose-200 transition cursor-pointer"
                >
                  حذف واستبعاد الكل
                </button>
                <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  {includedDeliverables.length} من {DECOR_DELIVERABLES.length} مشمولة
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              {[
                {
                  id: 'decor_as_built',
                  name: 'رفع مساحي As-Built للموقع',
                  tag: '{{IF:رفع_مساحي_ديكور}}',
                  desc: 'معاينة ورفع مساحي دقيق للموقع والفراغات الداخلية على الطبيعة ومطابقة الأبعاد والمناسيب الفعلية.',
                },
                {
                  id: 'decor_moodboard',
                  name: 'لوحة أفكار ومود بورد (Moodboard)',
                  tag: '{{IF:مود_بورد}}',
                  desc: 'إعداد لوحات الأفكار التوجيهية وتناسق الألوان والخامات والتوجه التصميمي العام للفراغات الداخلية.',
                },
                {
                  id: 'decor_3d_renders',
                  name: 'لقطات وتصاميم ثلاثية الأبعاد (3D Renders)',
                  tag: '{{IF:مناظير_3D}}',
                  desc: 'إعداد المناظير واللقطات الواقعية ثلاثية الأبعاد عالية الدقة لكافة الفراغات المشمولة بالتصميم الداخلي.',
                },
                {
                  id: 'decor_shop_drawings',
                  name: 'المخططات التنفيذية التفصيلية (Shop Drawings)',
                  tag: '{{IF:مخططات_تنفيذية_ديكور}}',
                  desc: 'إعداد المخططات التنفيذية لتوزيع الأثاث، الأسقف المستعارة، الإنارة، الأرضيات، وتفاصيل الجدران والنجارة.',
                },
                {
                  id: 'decor_specifications',
                  name: 'جداول المواصفات واختيار المواد (Specifications)',
                  tag: '{{IF:جداول_المواصفات}}',
                  desc: 'إعداد جداول توصيف المواد والتشطيبات والألوان وعينات الخامات المعتمدة للتنفيذ.',
                },
                {
                  id: 'decor_boq',
                  name: 'جداول الكميات وحصر المواد (BOQ)',
                  tag: '{{IF:جداول_الكميات}}',
                  desc: 'إعداد قوائم وجداول حصر الكميات والمواد اللازمة لتنفيذ أعمال التصميم الداخلي والديكور.',
                },
              ].map((def, index) => {
                const isChecked = includedDeliverables.includes(def.name);
                return (
                  <div
                    key={def.name}
                    className={`p-3.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isChecked
                        ? 'bg-white border-amber-400 shadow-2xs ring-1 ring-amber-400/20'
                        : 'bg-stone-50 border-stone-300 opacity-65 hover:opacity-100'
                    }`}
                  >
                    <div
                      onClick={() => handleToggleDeliverable(def.name)}
                      className="flex items-start gap-3 cursor-pointer flex-1"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleDeliverable(def.name)}
                        className="w-4 h-4 accent-amber-600 rounded mt-0.5 cursor-pointer shrink-0"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-800 text-[10px] font-black flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <span className={`text-xs font-black ${isChecked ? 'text-stone-900' : 'line-through text-stone-500'}`}>
                            {def.name}
                          </span>
                          <span className="text-[10px] font-mono text-amber-800 bg-amber-100/90 px-1.5 py-0.5 rounded border border-amber-300 font-bold">
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
                        <p className={`text-[11px] mt-1 leading-relaxed ${isChecked ? 'text-stone-600' : 'text-stone-400'}`}>
                          {def.desc}
                        </p>
                      </div>
                    </div>

                    {/* زر الحذف والاستعادة المباشر */}
                    <div className="shrink-0 flex items-center justify-end pt-1 sm:pt-0">
                      {isChecked ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteDeliverable(def.name)}
                          title="حذف هذا المخرج من العقد والنطاق الشرطي"
                          className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 hover:border-red-600 px-3 py-1.5 rounded-lg transition cursor-pointer shadow-2xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف المخرج</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRestoreDeliverable(def.name)}
                          title="استعادة وإدراج هذا المخرج في العرض"
                          className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-white bg-emerald-50 hover:bg-emerald-600 border border-emerald-200 hover:border-emerald-600 px-3 py-1.5 rounded-lg transition cursor-pointer shadow-2xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>استعادة وتضمين</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Discounts & Tax Controls (الخصومات والضريبة النظامية) - قائمة ثابتة وموحدة لجميع الأقسام */}
          <DiscountAndTaxSection clientInfo={clientInfo} onUpdateClientInfo={onUpdateClientInfo} />
        </div>

        {/* Right Column: Live Summary Card & Action Button */}
        <div className="lg:col-span-4">
          <div className="bg-stone-900 text-stone-100 p-5 rounded-2xl border border-stone-800 shadow-lg sticky top-[135px] space-y-5">
            <div className="border-b border-stone-800 pb-3">
              <span className="text-[11px] text-amber-400 font-bold uppercase tracking-wider">
                ملخص تسعير قسم الديكور
              </span>
              <h3 className="text-lg font-black text-white mt-1">
                ديكور {decorStyle === 'modern' ? 'مودرن' : decorStyle === 'neoclassic' ? 'نيوكلاسيك' : 'كلاسيك'}
              </h3>
              <p className="text-xs text-stone-400">
                {buildingType === 'villa'
                  ? 'فيلا سكنية'
                  : buildingType === 'residential'
                  ? 'عمارة سكنية'
                  : 'عمارة تجارية'}{' '}
                - مساحة {area} م²
              </p>
            </div>

            {/* Financial breakdown */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-stone-300">
                <span>الشريحة المساحية:</span>
                <span className="font-bold text-white">{priceCalculation.tierDescription}</span>
              </div>

              <div className="flex justify-between items-center text-stone-300">
                <span>طريقة الاحتساب:</span>
                <span className="font-bold text-white">{priceCalculation.formulaDescription}</span>
              </div>

              {priceCalculation.ratePerMeter && (
                <div className="flex justify-between items-center text-stone-300">
                  <span>سعر المتر المربع:</span>
                  <span className="font-bold text-amber-400">
                    {priceCalculation.ratePerMeter} ريال / م²
                  </span>
                </div>
              )}

              {/* Price override toggle or manual price */}
              {isLessThan200 ? (
                <div className="bg-amber-500/15 p-3 rounded-xl border border-amber-500/30 space-y-2">
                  <div className="flex justify-between items-center text-[11px] text-amber-300 font-bold">
                    <span>شريحة أقل من 200 م²:</span>
                    <span className="text-[10px] text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded font-black">
                      إدخال يدوي
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-amber-500/20">
                    <span className="text-[11px] text-stone-300 font-medium">السعر في الخانة:</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        step="100"
                        placeholder="أدخل السعر..."
                        value={manualPrice !== null ? manualPrice : ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? null : Math.max(0, Number(e.target.value));
                          setManualPrice(val);
                        }}
                        className="w-24 bg-stone-900 border border-amber-500 rounded px-2 py-1 text-center font-bold text-amber-400 text-xs"
                      />
                      <span className="text-[10px] text-stone-400">ريال</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-stone-800/80 p-3 rounded-xl border border-stone-700/60 space-y-2">
                  <div className="flex justify-between items-center text-[11px] text-stone-300">
                    <span>السعر الحسابي النظامي:</span>
                    <span className="font-bold">{formatSAR(calculatedTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-stone-700">
                    <span className="text-[11px] text-stone-400">تعديل يدوي (اختياري):</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        placeholder={String(calculatedTotal)}
                        value={customPriceOverride !== null ? customPriceOverride : ''}
                        onChange={(e) =>
                          setCustomPriceOverride(
                            e.target.value === '' ? null : Number(e.target.value)
                          )
                        }
                        className="w-24 bg-stone-900 border border-stone-700 rounded px-2 py-1 text-center font-bold text-amber-400 text-xs"
                      />
                      <span className="text-[10px] text-stone-500">ريال</span>
                      {customPriceOverride !== null && (
                        <button
                          type="button"
                          onClick={() => setCustomPriceOverride(null)}
                          className="text-[10px] text-red-400 hover:underline"
                        >
                          إلغاء
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-stone-800 flex justify-between items-baseline">
                <span className="text-sm font-bold text-stone-300">الإجمالي الصافي:</span>
                <span className="text-2xl font-black text-amber-400">
                  {isLessThan200 && (!manualPrice || manualPrice <= 0) ? (
                    <span className="text-xs text-amber-400/80 font-normal">
                      بانتظار إدخال السعر...
                    </span>
                  ) : (
                    formatSAR(activePrice)
                  )}
                </span>
              </div>
              <p className="text-[10px] text-stone-400 text-left">غير شامل ضريبة القيمة المضافة (15%)</p>
            </div>

            {/* Deliverables summary */}
            <div className="bg-stone-800/60 p-3 rounded-xl border border-stone-800 text-[11px] text-stone-300 space-y-1.5">
              <div className="font-bold text-stone-200">
                المخرجات المتفق عليها ({includedDeliverables.length}):
              </div>
              <ul className="space-y-1 text-stone-400 max-h-36 overflow-y-auto pr-1">
                {includedDeliverables.map((item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-amber-400 flex-shrink-0" />
                    <span className="truncate">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Add to quotation button */}
            <button
              type="button"
              onClick={handleAddCurrentToQuote}
              disabled={isLessThan200 && (!manualPrice || manualPrice <= 0)}
              className={`w-full font-black py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition ${
                isLessThan200 && (!manualPrice || manualPrice <= 0)
                  ? 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed opacity-60'
                  : 'bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>
                {isLessThan200 && (!manualPrice || manualPrice <= 0)
                  ? 'أدخل السعر في الخانة أولاً'
                  : 'إضافة أعمال الديكور إلى عرض السعر'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
