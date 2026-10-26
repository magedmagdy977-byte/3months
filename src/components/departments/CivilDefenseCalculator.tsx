import React, { useState } from 'react';
import { QuotationItem, ClientInfo } from '../../types';
import { CIVIL_DEFENSE_SERVICES } from '../../data/pricingData';
import { formatSAR } from '../../utils/formatters';
import { ShieldAlert, Plus, Check, FileCheck, ShieldCheck } from 'lucide-react';
import { DiscountAndTaxSection } from '../common/DiscountAndTaxSection';

interface CivilDefenseCalculatorProps {
  onAddItem: (item: QuotationItem) => void;
  clientInfo?: ClientInfo;
  onUpdateClientInfo?: (info: Partial<ClientInfo>) => void;
}

export const CivilDefenseCalculator: React.FC<CivilDefenseCalculatorProps> = ({
  onAddItem,
  clientInfo,
  onUpdateClientInfo,
}) => {
  const [selectedServiceId, setSelectedServiceId] = useState<string>(CIVIL_DEFENSE_SERVICES[0].id);
  const [area, setArea] = useState<number>(() => clientInfo?.landArea || 500);
  const [occupancyType, setOccupancyType] = useState<string>(() => {
    if (clientInfo?.buildingType?.includes('عمارة')) return 'سكني تجاري';
    if (clientInfo?.buildingType?.includes('فندق')) return 'فندقي وضيافة';
    if (clientInfo?.buildingType?.includes('محطة')) return 'محطة وقود وخدمات سيارات';
    if (clientInfo?.buildingType?.includes('مصنع')) return 'صناعي وإنتاجي';
    if (clientInfo?.buildingType?.includes('مستودع')) return 'تخزين ومستودعات';
    return 'تجاري (معارض ومحلات)';
  });
  const [customPrice, setCustomPrice] = useState<number | null>(null);

  // Sync area with clientInfo.landArea if updated externally
  React.useEffect(() => {
    if (clientInfo?.landArea !== undefined && clientInfo.landArea !== area) {
      setArea(clientInfo.landArea);
    }
  }, [clientInfo?.landArea]);

  // Sync occupancyType if buildingType changes
  React.useEffect(() => {
    if (clientInfo?.buildingType) {
      const b = clientInfo.buildingType;
      if (b.includes('مصنع')) setOccupancyType('صناعي وإنتاجي');
      else if (b.includes('ورش') || b.includes('مستودع')) setOccupancyType('تخزين ومستودعات');
      else if (b.includes('فندق')) setOccupancyType('فندقي وضيافة');
      else if (b.includes('محطة')) setOccupancyType('محطة وقود وخدمات سيارات');
      else if (b.includes('عمارة')) setOccupancyType('سكني تجاري متعدد الأدوار');
    }
  }, [clientInfo?.buildingType]);

  const activeService =
    CIVIL_DEFENSE_SERVICES.find((s) => s.id === selectedServiceId) || CIVIL_DEFENSE_SERVICES[0];

  // If service has perMeterRate (like safety networks):
  let calculatedFee = activeService.basePrice;
  if (activeService.perMeterRate && area > 500) {
    calculatedFee = activeService.basePrice + (area - 500) * activeService.perMeterRate;
  }

  const finalPrice = customPrice !== null ? customPrice : calculatedFee;

  const handleAddCivilDefenseItem = () => {
    const details = [
      `الخدمة: ${activeService.name}`,
      `نوع النشاط / الإشغال: ${occupancyType}`,
      `المساحة الإجمالية: ${area} م²`,
      activeService.description,
    ];

    if (activeService.perMeterRate && area > 500) {
      details.push(
        `تفصيل الاحتساب: ${formatSAR(activeService.basePrice)} حتى 500م² + (${area - 500}م² × ${
          activeService.perMeterRate
        } ريال/م²)`
      );
    }

    const newItem: QuotationItem = {
      id: `cd-${Date.now()}`,
      departmentId: 'civil_defense',
      departmentName: 'قسم الدفاع المدني',
      title: `${activeService.name}`,
      area,
      details,
      basePrice: finalPrice,
      totalPrice: finalPrice,
      notes: `النشاط: ${occupancyType} | مساحة ${area} م²`,
    };

    if (onUpdateClientInfo) {
      onUpdateClientInfo({
        landArea: area,
        buildingArea: area,
        serviceType: activeService.name,
      });
    }

    onAddItem(newItem);
    setCustomPrice(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-md">
              قسم الدفاع المدني وأنظمة السلامة
            </span>
            <span className="text-xs text-stone-500">معتمدون لدى منصة سلامة وكود SBC 801</span>
          </div>
          <h2 className="text-xl font-black text-stone-900 mt-1">
            تسعير مخططات وتقارير ورخص الدفاع المدني
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-stone-800 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span>اختر خدمة السلامة والدفاع المدني</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CIVIL_DEFENSE_SERVICES.map((srv) => {
                const isSelected = selectedServiceId === srv.id;
                return (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => {
                      setSelectedServiceId(srv.id);
                      setCustomPrice(null);
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
                      {srv.perMeterRate ? `يبدأ من ${formatSAR(srv.basePrice)}` : formatSAR(srv.basePrice)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-stone-800">بيانات النشاط والمساحة</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  نوع النشاط والإشغال:
                </label>
                <select
                  value={occupancyType}
                  onChange={(e) => setOccupancyType(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-stone-900 text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-hidden"
                >
                  <option value="تجاري (معارض ومحلات)">تجاري (معارض ومحلات وتجزئة)</option>
                  <option value="مطاعم ومقاهي وكافيهات">مطاعم ومقاهي (درجة خطورة متوسطة)</option>
                  <option value="مكاتب إدارية وشركات">مكاتب إدارية وشركات</option>
                  <option value="مستودعات وتخزين">مستودعات وتخزين ولوجستي</option>
                  <option value="سكني تجاري">مبنى سكني تجاري متعدد الطوابق</option>
                  <option value="صناعي وورش">صناعي، ورش، ومصانع خفيفة</option>
                  <option value="صحي وتعليمي">مراكز طبية، عيادات، أو مدارس</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  المساحة الإجمالية للمنشأة (م²):
                </label>
                <input
                  type="number"
                  min="1"
                  value={area}
                  onChange={(e) => setArea(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-2 text-stone-900 text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-hidden"
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
                ملخص قسم الدفاع المدني
              </span>
              <h3 className="text-base font-black text-white mt-1">{activeService.name}</h3>
              <p className="text-xs text-stone-400">
                {occupancyType} - {area} م²
              </p>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-stone-300">
                <span>سعر الخدمة الأساسي:</span>
                <span className="font-bold text-white">{formatSAR(calculatedFee)}</span>
              </div>

              {/* Price adjustment */}
              <div className="bg-stone-800/80 p-3 rounded-xl border border-stone-700/60 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-stone-400">سعر متفق عليه:</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      placeholder={String(calculatedFee)}
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

              <div className="pt-3 border-t border-stone-800 flex justify-between items-baseline">
                <span className="text-sm font-bold text-stone-300">الإجمالي:</span>
                <span className="text-2xl font-black text-amber-400">
                  {formatSAR(finalPrice)}
                </span>
              </div>
            </div>

            <div className="bg-stone-800/60 p-3 rounded-xl border border-stone-800 text-[11px] text-stone-300 space-y-1.5">
              <div className="font-bold text-stone-200">الاشتراطات والمعايير:</div>
              <ul className="space-y-1 text-stone-400">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>اعتماد مهندس سلامة معتمد ومرخص</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>تقديم الملف ومتابعته عبر منصة سلامة</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={handleAddCivilDefenseItem}
              className="w-full bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-black py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة خدمات السلامة إلى عرض السعر</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
