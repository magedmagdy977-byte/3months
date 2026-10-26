import React, { useState } from 'react';
import { QuotationItem, ClientInfo } from '../../types';
import { EXECUTION_SERVICES } from '../../data/pricingData';
import { formatSAR } from '../../utils/formatters';
import { Hammer, Plus, Check, HardHat, Calculator, Ruler } from 'lucide-react';
import { DiscountAndTaxSection } from '../common/DiscountAndTaxSection';

interface ExecutionCalculatorProps {
  onAddItem: (item: QuotationItem) => void;
  clientInfo?: ClientInfo;
  onUpdateClientInfo?: (info: Partial<ClientInfo>) => void;
}

export const ExecutionCalculator: React.FC<ExecutionCalculatorProps> = ({
  onAddItem,
  clientInfo,
  onUpdateClientInfo,
}) => {
  const [selectedServiceId, setSelectedServiceId] = useState<string>(EXECUTION_SERVICES[0].id);
  const [builtUpArea, setBuiltUpArea] = useState<number>(650);
  const [monthsCount, setMonthsCount] = useState<number>(1);
  const [customRate, setCustomRate] = useState<number | null>(null);
  const [projectCity, setProjectCity] = useState<string>('الرياض');

  const activeService =
    EXECUTION_SERVICES.find((s) => s.id === selectedServiceId) || EXECUTION_SERVICES[0];

  const isMonthlySupervision = activeService.id === 'exec_site_supervision';

  const defaultUnitRate = isMonthlySupervision
    ? activeService.basePrice || 4000
    : activeService.ratePerMeter || 650;

  const currentUnitRate = customRate !== null ? customRate : defaultUnitRate;

  const calculatedTotal = isMonthlySupervision
    ? currentUnitRate * monthsCount
    : currentUnitRate * builtUpArea;

  const handleAddExecutionItem = () => {
    const details = [
      `بند التنفيذ: ${activeService.name}`,
      isMonthlySupervision
        ? `مدة الإشراف التنفيذي: ${monthsCount} أشهر (${formatSAR(currentUnitRate)}/شهر)`
        : `مسطحات البناء المستهدفة: ${builtUpArea} م² (${formatSAR(currentUnitRate)}/م²)`,
      `مدينة المشروع: ${projectCity}`,
      activeService.description,
    ];

    const newItem: QuotationItem = {
      id: `exec-${Date.now()}`,
      departmentId: 'execution',
      departmentName: 'قسم التنفيذ',
      title: `${activeService.name}`,
      area: isMonthlySupervision ? undefined : builtUpArea,
      details,
      basePrice: calculatedTotal,
      totalPrice: calculatedTotal,
      notes: isMonthlySupervision
        ? `إشراف ${monthsCount} أشهر في ${projectCity}`
        : `مسطح ${builtUpArea} م² في ${projectCity}`,
    };

    if (onUpdateClientInfo) {
      onUpdateClientInfo({
        buildingArea: builtUpArea,
        landArea: Math.round(builtUpArea / 1.68) || builtUpArea,
        serviceType: activeService.name,
      });
    }

    onAddItem(newItem);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-md">
              قسم التنفيذ والمقاولات الإنشائية
            </span>
            <span className="text-xs text-stone-500">جودة تنفيذ وضمانات هندسية موثقة</span>
          </div>
          <h2 className="text-xl font-black text-stone-900 mt-1">
            تسعير أعمال البناء، العظم، والتشطيبات
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-stone-800 flex items-center gap-2">
              <HardHat className="w-4 h-4 text-amber-500" />
              <span>اختر نطاق أعمال المقاولات والتنفيذ</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {EXECUTION_SERVICES.map((srv) => {
                const isSelected = selectedServiceId === srv.id;
                return (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => {
                      setSelectedServiceId(srv.id);
                      setCustomRate(null);
                    }}
                    className={`p-4 rounded-xl border text-right transition flex flex-col justify-between gap-2.5 ${
                      isSelected
                        ? 'bg-stone-900 text-white border-stone-900 shadow-md ring-2 ring-amber-500/30'
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">{srv.name}</div>
                      <p
                        className={`text-[11px] mt-1.5 leading-relaxed line-clamp-2 ${
                          isSelected ? 'text-stone-300' : 'text-stone-500'
                        }`}
                      >
                        {srv.description}
                      </p>
                    </div>
                    <div className="text-sm font-black text-amber-400">
                      {srv.ratePerMeter
                        ? `${srv.ratePerMeter} ريال / م²`
                        : `${formatSAR(srv.basePrice || 0)} / شهر`}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-stone-800">بيانات المسطحات والموقع</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {!isMonthlySupervision ? (
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    إجمالي مسطحات البناء المقدرة (م²):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={builtUpArea}
                      onChange={(e) => setBuiltUpArea(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-2.5 text-stone-900 text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-hidden"
                    />
                    <span className="text-xs text-stone-500 font-bold whitespace-nowrap">م²</span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    مدة الإشراف التنفيذي (بالأشهر):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={monthsCount}
                      onChange={(e) => setMonthsCount(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-2.5 text-stone-900 text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-hidden"
                    />
                    <span className="text-xs text-stone-500 font-bold whitespace-nowrap">شهر</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  المدينة وموقع المشروع:
                </label>
                <input
                  type="text"
                  value={projectCity}
                  onChange={(e) => setProjectCity(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-2.5 text-stone-900 text-xs focus:ring-2 focus:ring-amber-500 outline-hidden"
                  placeholder="الرياض، جدة، الدمام..."
                />
              </div>

              {/* Rate Adjustment */}
              <div className="sm:col-span-2 pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs text-stone-600 font-medium">
                  تعديل سعر المتر أو الشهر (ريال):
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder={String(defaultUnitRate)}
                    value={customRate !== null ? customRate : ''}
                    onChange={(e) =>
                      setCustomRate(e.target.value === '' ? null : Number(e.target.value))
                    }
                    className="w-28 bg-white border border-stone-300 rounded-xl px-3 py-2 text-center font-bold text-stone-900 text-xs"
                  />
                  <span className="text-xs font-bold text-stone-500">
                    {isMonthlySupervision ? 'ريال/شهر' : 'ريال/م²'}
                  </span>
                  {customRate !== null && (
                    <button
                      type="button"
                      onClick={() => setCustomRate(null)}
                      className="text-xs text-red-600 hover:underline mr-2"
                    >
                      استعادة الافتراضي
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Discounts & Tax Controls (الخصومات والضريبة النظامية) - قائمة ثابتة وموحدة لجميع الأقسام */}
          <DiscountAndTaxSection clientInfo={clientInfo} onUpdateClientInfo={onUpdateClientInfo} />
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4">
          <div className="bg-stone-900 text-stone-100 p-5 rounded-2xl border border-stone-800 shadow-lg sticky top-[135px] space-y-5">
            <div className="border-b border-stone-800 pb-3">
              <span className="text-[11px] text-amber-400 font-bold uppercase tracking-wider">
                ملخص تسعير قسم التنفيذ
              </span>
              <h3 className="text-base font-black text-white mt-1">{activeService.name}</h3>
              <p className="text-xs text-stone-400">
                {isMonthlySupervision
                  ? `إشراف ${monthsCount} أشهر - ${projectCity}`
                  : `مسطح بناء ${builtUpArea} م² - ${projectCity}`}
              </p>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-stone-300">
                <span>سعر الوحدة المقدر:</span>
                <span className="font-bold text-white">
                  {currentUnitRate} {isMonthlySupervision ? 'ريال / شهر' : 'ريال / م²'}
                </span>
              </div>

              <div className="flex justify-between items-center text-stone-300">
                <span>الكمية المحسوبة:</span>
                <span className="font-bold text-white">
                  {isMonthlySupervision ? `${monthsCount} أشهر` : `${builtUpArea} م²`}
                </span>
              </div>

              <div className="pt-3 border-t border-stone-800 flex justify-between items-baseline">
                <span className="text-sm font-bold text-stone-300">الإجمالي:</span>
                <span className="text-2xl font-black text-amber-400">
                  {formatSAR(calculatedTotal)}
                </span>
              </div>
            </div>

            <div className="bg-stone-800/60 p-3 rounded-xl border border-stone-800 text-[11px] text-stone-300 space-y-1.5">
              <div className="font-bold text-stone-200">الضمانات والتنفيذ:</div>
              <ul className="space-y-1 text-stone-400">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>ضمان هيكل إنشائي وعوازل معتمد</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>جدول دفعات مرتبط بمحطات الإنجاز الفعلي</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={handleAddExecutionItem}
              className="w-full bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-black py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة أعمال التنفيذ إلى عرض السعر</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
