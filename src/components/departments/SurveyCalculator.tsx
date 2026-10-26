import React, { useState } from 'react';
import { QuotationItem, ClientInfo } from '../../types';
import { SURVEY_SERVICES } from '../../data/pricingData';
import { formatSAR } from '../../utils/formatters';
import { MapPin, Plus, Check, FileCheck2, Calculator } from 'lucide-react';
import { DiscountAndTaxSection } from '../common/DiscountAndTaxSection';

interface SurveyCalculatorProps {
  onAddItem: (item: QuotationItem) => void;
  clientInfo?: ClientInfo;
  onUpdateClientInfo?: (info: Partial<ClientInfo>) => void;
}

export const SurveyCalculator: React.FC<SurveyCalculatorProps> = ({
  onAddItem,
  clientInfo,
  onUpdateClientInfo,
}) => {
  const [selectedServiceId, setSelectedServiceId] = useState<string>(SURVEY_SERVICES[0].id);
  const [quantity, setQuantity] = useState<number>(1);
  const [customPrice, setCustomPrice] = useState<number | null>(null);
  const [locationNote, setLocationNote] = useState<string>('');
  const [area, setArea] = useState<number>(() => clientInfo?.landArea || 600);

  // Sync area with clientInfo.landArea if updated externally
  React.useEffect(() => {
    if (clientInfo?.landArea !== undefined && clientInfo.landArea !== area) {
      setArea(clientInfo.landArea);
    }
  }, [clientInfo?.landArea]);

  // Sync locationNote with clientInfo location details
  React.useEffect(() => {
    if (clientInfo?.plotNumber || clientInfo?.planNumber || clientInfo?.district) {
      const parts = [
        clientInfo.plotNumber ? `قطعة ${clientInfo.plotNumber}` : '',
        clientInfo.planNumber ? `مخطط ${clientInfo.planNumber}` : '',
        clientInfo.district ? `حي ${clientInfo.district}` : '',
        clientInfo.projectCity || '',
      ].filter(Boolean);
      if (parts.length > 0 && !locationNote) {
        setLocationNote(parts.join(' - '));
      }
    }
  }, [clientInfo?.plotNumber, clientInfo?.planNumber, clientInfo?.district, clientInfo?.projectCity]);

  const activeService = SURVEY_SERVICES.find((s) => s.id === selectedServiceId) || SURVEY_SERVICES[0];
  const unitPrice = customPrice !== null ? customPrice : activeService.basePrice;
  const totalPrice = unitPrice * quantity;

  const handleAddSurveyItem = () => {
    const details = [
      `الخدمة المساحية: ${activeService.name}`,
      `الكمية / عدد المعاملات: ${quantity} (${activeService.unit})`,
      `سعر الوحدة: ${formatSAR(unitPrice)}`,
    ];

    if (locationNote.trim()) {
      details.push(`الموقع / رقم القطعة والمخطط: ${locationNote}`);
    }
    if (area > 0) {
      details.push(`مساحة الأرض المقدرة: ${area} م²`);
    }

    const newItem: QuotationItem = {
      id: `survey-${Date.now()}`,
      departmentId: 'survey',
      departmentName: 'قسم المساحة',
      title: `${activeService.name} (عدد ${quantity})`,
      area,
      details,
      basePrice: totalPrice,
      totalPrice,
      notes: locationNote || `مساحة ${area} م²`,
    };

    if (onUpdateClientInfo) {
      onUpdateClientInfo({
        landArea: area,
        serviceType: activeService.name,
      });
    }

    onAddItem(newItem);
    setLocationNote('');
    setCustomPrice(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-md">
              قسم المساحة والمخططات التنظيمية
            </span>
            <span className="text-xs text-stone-500">أجهزة مساحية دقيقة ومعتمدة</span>
          </div>
          <h2 className="text-xl font-black text-stone-900 mt-1">
            تسعير خدمات الرفع المساحي والقرارات التنظيمية
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Services list & config */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-stone-800 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-500" />
              <span>اختر المعاملة أو الخدمة المساحية المطلوبة</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SURVEY_SERVICES.map((srv) => {
                const isSelected = selectedServiceId === srv.id;
                return (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => {
                      setSelectedServiceId(srv.id);
                      setCustomPrice(null);
                    }}
                    className={`p-4 rounded-xl border text-right transition flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'bg-stone-900 text-white border-stone-900 shadow-md ring-2 ring-amber-500/30'
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">{srv.name}</div>
                      <div
                        className={`text-[11px] mt-1 ${
                          isSelected ? 'text-stone-300' : 'text-stone-500'
                        }`}
                      >
                        وحدة الحساب: {srv.unit}
                      </div>
                    </div>
                    <div className="text-sm font-black text-amber-400">
                      {formatSAR(srv.basePrice)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Details & Area config */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-stone-800">تفاصيل الموقع والمعاملة</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  الكمية / عدد المعاملات أو القطع:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-2.5 text-stone-900 text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-hidden"
                  />
                  <span className="text-xs text-stone-500 font-bold whitespace-nowrap">
                    {activeService.unit}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  مساحة الأرض التقريبية (م²):
                </label>
                <input
                  type="number"
                  min="0"
                  value={area}
                  onChange={(e) => setArea(Math.max(0, Number(e.target.value) || 0))}
                  placeholder="مثال: 600"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-2.5 text-stone-900 text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  رقم المخطط / القطعة / الحي (اختياري للتوثيق):
                </label>
                <input
                  type="text"
                  value={locationNote}
                  onChange={(e) => setLocationNote(e.target.value)}
                  placeholder=""
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-2.5 text-stone-900 text-xs focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Discounts & Tax Controls (الخصومات والضريبة النظامية) - قائمة ثابتة وموحدة لجميع الأقسام */}
          <DiscountAndTaxSection clientInfo={clientInfo} onUpdateClientInfo={onUpdateClientInfo} />
        </div>

        {/* Right Column: Summary Card */}
        <div className="lg:col-span-4">
          <div className="bg-stone-900 text-stone-100 p-5 rounded-2xl border border-stone-800 shadow-lg sticky top-[135px] space-y-5">
            <div className="border-b border-stone-800 pb-3">
              <span className="text-[11px] text-amber-400 font-bold uppercase tracking-wider">
                ملخص تسعير قسم المساحة
              </span>
              <h3 className="text-base font-black text-white mt-1">{activeService.name}</h3>
              <p className="text-xs text-stone-400">
                الكمية: {quantity} {activeService.unit}
              </p>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-stone-300">
                <span>سعر الوحدة الافتراضي:</span>
                <span className="font-bold text-white">{formatSAR(activeService.basePrice)}</span>
              </div>

              {/* Price adjustment */}
              <div className="bg-stone-800/80 p-3 rounded-xl border border-stone-700/60 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-stone-400">تعديل سعر الوحدة:</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      placeholder={String(activeService.basePrice)}
                      value={customPrice !== null ? customPrice : ''}
                      onChange={(e) =>
                        setCustomPrice(e.target.value === '' ? null : Number(e.target.value))
                      }
                      className="w-24 bg-stone-900 border border-stone-700 rounded px-2 py-1 text-center font-bold text-amber-400 text-xs"
                    />
                    <span className="text-[10px] text-stone-500">ريال</span>
                    {customPrice !== null && (
                      <button
                        type="button"
                        onClick={() => setCustomPrice(null)}
                        className="text-[10px] text-red-400 hover:underline"
                      >
                        إلغاء
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center text-stone-300">
                <span>عدد الوحدات:</span>
                <span className="font-bold text-white">× {quantity}</span>
              </div>

              <div className="pt-3 border-t border-stone-800 flex justify-between items-baseline">
                <span className="text-sm font-bold text-stone-300">الإجمالي:</span>
                <span className="text-2xl font-black text-amber-400">
                  {formatSAR(totalPrice)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddSurveyItem}
              className="w-full bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-black py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة الخدمة المساحية إلى عرض السعر</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
