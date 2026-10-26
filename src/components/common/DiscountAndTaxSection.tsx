import React from 'react';
import { Percent, Check, Tag, ShieldCheck } from 'lucide-react';
import { ClientInfo } from '../../types';

interface DiscountAndTaxSectionProps {
  clientInfo?: ClientInfo;
  onUpdateClientInfo?: (info: Partial<ClientInfo>) => void;
  className?: string;
}

export const DiscountAndTaxSection: React.FC<DiscountAndTaxSectionProps> = ({
  clientInfo,
  onUpdateClientInfo,
  className = '',
}) => {
  if (!clientInfo || !onUpdateClientInfo) {
    return null;
  }

  const isDiscountActive = clientInfo.discountValue > 0;
  const isTaxActive = Boolean(clientInfo.includeTax);

  const handleToggleDiscount = (checked: boolean) => {
    if (checked) {
      onUpdateClientInfo({
        discountType: clientInfo.discountType || 'percentage',
        discountValue: clientInfo.discountValue > 0 ? clientInfo.discountValue : 20,
        _userToggledDiscount: true,
      } as any);
    } else {
      onUpdateClientInfo({
        discountValue: 0,
        _userToggledDiscount: true,
      } as any);
    }
  };

  const handleToggleTax = (checked: boolean) => {
    onUpdateClientInfo({
      includeTax: checked,
      _userToggledTax: true,
    } as any);
  };

  const handleDiscountValueChange = (val: number) => {
    onUpdateClientInfo({
      discountValue: Math.max(0, val),
      _userToggledDiscount: true,
    } as any);
  };

  const handleDiscountTypeChange = (type: 'percentage' | 'fixed') => {
    onUpdateClientInfo({
      discountType: type,
      _userToggledDiscount: true,
    } as any);
  };

  const handlePresetDiscount = (val: number) => {
    onUpdateClientInfo({
      discountType: 'percentage',
      discountValue: val,
      _userToggledDiscount: true,
    } as any);
  };

  return (
    <div
      className={`bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
        <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Percent className="w-4 h-4 text-amber-600" />
          </div>
          <span>الخصومات والضريبة النظامية</span>
        </h3>
        <span className="text-xs text-stone-500 font-medium flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-stone-400" />
          <span>قائمة ثابتة وموحدة لكافة أقسام وعروض الأسعار</span>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Discount Box */}
        <div className="space-y-2">
          <label
            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
              isDiscountActive
                ? 'bg-emerald-500/10 border-emerald-500 text-stone-950 font-bold shadow-2xs'
                : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={isDiscountActive}
                onChange={(e) => handleToggleDiscount(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-bold block text-stone-900">
                  تطبيق خصم خاص (
                  {clientInfo.discountType === 'percentage'
                    ? `${clientInfo.discountValue || 20}%`
                    : `${clientInfo.discountValue || 0} ر.س`}
                  )
                </span>
                <span className="text-[10px] text-emerald-700 block font-medium">
                  {isDiscountActive ? 'الخصم معتمد ومطبق على إجمالي العرض' : 'انقر لتفعيل الخصم التجاري'}
                </span>
              </div>
            </div>

            {isDiscountActive && (
              <span className="text-[11px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                مفعل (
                {clientInfo.discountType === 'percentage'
                  ? `${clientInfo.discountValue}%`
                  : `${clientInfo.discountValue} ريال`}
                )
              </span>
            )}
          </label>

          {/* Quick Preset Buttons & Controls when active */}
          {isDiscountActive && (
            <div className="bg-stone-50/80 p-3 rounded-xl border border-stone-200 space-y-2.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-stone-500 font-bold flex items-center gap-1">
                  <Tag className="w-3 h-3 text-stone-400" />
                  <span>نسب سريعة:</span>
                </span>
                {[5, 10, 15, 20, 25, 30].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handlePresetDiscount(preset)}
                    className={`text-[11px] px-2 py-0.5 rounded-md font-bold transition ${
                      clientInfo.discountType === 'percentage' && clientInfo.discountValue === preset
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {preset}%
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-stone-200/60">
                <span className="text-[11px] text-stone-600 font-bold whitespace-nowrap">
                  تحديد القيمة:
                </span>
                <input
                  type="number"
                  min="0"
                  value={clientInfo.discountValue || ''}
                  onChange={(e) => handleDiscountValueChange(Number(e.target.value) || 0)}
                  placeholder="20"
                  className="w-full bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs font-bold text-stone-900 focus:ring-2 focus:ring-emerald-500 outline-hidden transition"
                />
                <select
                  value={clientInfo.discountType}
                  onChange={(e) => handleDiscountTypeChange(e.target.value as 'percentage' | 'fixed')}
                  className="bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-stone-900 focus:ring-2 focus:ring-emerald-500 outline-hidden transition cursor-pointer shrink-0"
                >
                  <option value="percentage">% نسبة مئوية</option>
                  <option value="fixed">ريال سعودي</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* VAT Tax Box */}
        <div className="space-y-2">
          <label
            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
              isTaxActive
                ? 'bg-amber-500/10 border-amber-500 text-stone-950 font-bold shadow-2xs'
                : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={isTaxActive}
                onChange={(e) => handleToggleTax(e.target.checked)}
                className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-bold block text-stone-900">
                  إضافة ضريبة القيمة المضافة (15%)
                </span>
                <span className="text-[10px] text-stone-500 block font-medium">
                  المعتمدة لهيئة الزكاة والضريبة والجمارك (ZATCA)
                </span>
              </div>
            </div>

            {isTaxActive ? (
              <span className="text-[11px] font-black text-amber-900 bg-amber-200/90 px-2 py-0.5 rounded-md border border-amber-300 flex items-center gap-1">
                <Check className="w-3 h-3 text-amber-900" />
                <span>مفعلة 15%</span>
              </span>
            ) : (
              <span className="text-[10px] text-stone-400 font-bold bg-stone-100 px-2 py-0.5 rounded-md">
                غير مشمولة
              </span>
            )}
          </label>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-[11px] text-stone-600 leading-relaxed">
            {isTaxActive ? (
              <span className="text-amber-900 font-medium">
                ✓ سيتم احتساب ضريبة القيمة المضافة (15%) نظامياً وإبرازها كبند مستقل في عرض السعر النهائي والطباعة.
              </span>
            ) : (
              <span className="text-stone-500">
                • الأسعار المعروضة تعتبر غير شاملة لضريبة القيمة المضافة حتى يتم تفعيل الخيار أعلاه.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
