import React, { useState, useEffect } from 'react';
import { PaymentMilestone, ClientInfo } from '../../types';
import { formatSAR } from '../../utils/formatters';
import {
  X,
  CreditCard,
  Plus,
  Trash2,
  RotateCcw,
  Check,
  AlertCircle,
  CheckCircle2,
  Scale,
  Sparkles,
  HelpCircle,
  Tag,
} from 'lucide-react';
import {
  getDefaultMilestonesForType,
  getPaymentMilestones,
} from '../../data/masterTemplateDefaults';

interface EditPaymentMilestonesModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientInfo: ClientInfo;
  grandTotal: number;
  onSaveMilestones: (
    milestones: PaymentMilestone[],
    scheduleType: ClientInfo['paymentScheduleType']
  ) => void;
}

// Common milestone reasons for quick 1-click insertion
const QUICK_MILESTONE_REASONS = [
  'عند توقيع العقد وبدء العمل والرفع المساحي.',
  'بعد الانتهاء من المخططات الإنشائية والكهروميكانيكية والتنفيذية.',
  'عند اعتماد المخططات المعمارية والواجهات.',
  'عند صدور رخصة البناء المعتمدة واستكمال الملفات.',
  'بعد استلام أعمال القواعد والميدات والصبة.',
  'بعد الانتهاء من الهيكل الإنشائي وعظم المبنى.',
  'عند التسليم النهائي وإصدار شهادة الإشغال والاعتماد.',
];

export const EditPaymentMilestonesModal: React.FC<EditPaymentMilestonesModalProps> = ({
  isOpen,
  onClose,
  clientInfo,
  grandTotal,
  onSaveMilestones,
}) => {
  const [milestones, setMilestones] = useState<PaymentMilestone[]>([]);
  const [scheduleType, setScheduleType] = useState<ClientInfo['paymentScheduleType']>(
    clientInfo.paymentScheduleType || 'design_standard'
  );

  useEffect(() => {
    if (isOpen) {
      const initial = getPaymentMilestones(
        clientInfo.paymentScheduleType,
        grandTotal,
        clientInfo.customMilestones
      );
      // Deep copy to prevent mutating parent state before saving
      setMilestones(JSON.parse(JSON.stringify(initial)));
      setScheduleType(clientInfo.paymentScheduleType || 'design_standard');
    }
  }, [isOpen, clientInfo, grandTotal]);

  if (!isOpen) return null;

  const currentSum = milestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
  const diff = grandTotal - currentSum;
  const isBalanced = Math.abs(diff) === 0;

  const handlePresetSelect = (type: ClientInfo['paymentScheduleType']) => {
    setScheduleType(type);
    const defaults = getDefaultMilestonesForType(type, grandTotal);
    setMilestones(defaults);
  };

  const handleUpdateMilestone = (index: number, updated: Partial<PaymentMilestone>) => {
    setMilestones((prev) => {
      const copy = [...prev];
      const target = { ...copy[index], ...updated };

      // If amount was edited, auto recalculate percentage
      if (updated.amount !== undefined) {
        const amt = Number(updated.amount) || 0;
        target.amount = amt;
        target.percentage = grandTotal > 0 ? Math.round((amt / grandTotal) * 100) : target.percentage;

        // If title still has (X%), update it nicely
        if (target.title.match(/\(\d+%\)/)) {
          target.title = target.title.replace(/\(\d+%\)/, `(${target.percentage}%)`);
        }
      }

      copy[index] = target;
      return copy;
    });
    setScheduleType('custom');
  };

  const handleAddMilestone = () => {
    const remaining = Math.max(0, diff);
    const newIndex = milestones.length + 1;
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
      description: 'استحقاق مرحلي حسب تقدم أعمال المشروع والاعتمادات الهندسية.',
    };
    setMilestones((prev) => [...prev, newMilestone]);
    setScheduleType('custom');
  };

  const handleDeleteMilestone = (index: number) => {
    if (milestones.length <= 1) return;
    setMilestones((prev) => prev.filter((_, i) => i !== index));
    setScheduleType('custom');
  };

  const handleAutoBalance = () => {
    if (milestones.length === 0) return;
    setMilestones((prev) => {
      const copy = [...prev];
      const lastIndex = copy.length - 1;
      const last = { ...copy[lastIndex] };
      const newAmount = Math.max(0, (Number(last.amount) || 0) + diff);
      const newPct = grandTotal > 0 ? Math.round((newAmount / grandTotal) * 100) : last.percentage;

      last.amount = newAmount;
      last.percentage = newPct;
      if (last.title.match(/\(\d+%\)/)) {
        last.title = last.title.replace(/\(\d+%\)/, `(${newPct}%)`);
      }
      copy[lastIndex] = last;
      return copy;
    });
    setScheduleType('custom');
  };

  const handleResetToPercentages = () => {
    const defaults = getDefaultMilestonesForType(scheduleType, grandTotal);
    setMilestones(defaults);
  };

  const handleSave = () => {
    onSaveMilestones(milestones, scheduleType);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/75 backdrop-blur-xs no-print animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl max-h-[92vh] rounded-2xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden text-stone-900 text-right">
        {/* Header */}
        <div className="bg-stone-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black">تعديل أسعار ومراحل جدول الدفعات يدوياً</h3>
                <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  إضافة / إنقاص وتعديل السبب
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                يمكنك كتابة مبالغ الدفعات يدوياً بالريال، إضافة أو حذف دفعات، وتعديل سبب واستحقاق كل دفعة
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Grand Total Bar */}
        <div className="bg-stone-100 px-4 py-3 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-stone-600 font-bold">إجمالي عرض السعر النهائي:</span>
            <span className="text-base font-black text-amber-700 font-mono bg-white px-2.5 py-0.5 rounded-lg border border-stone-300">
              {formatSAR(grandTotal)}
            </span>
          </div>

          {/* Balance Status Badge */}
          {isBalanced ? (
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>مجموع الدفعات متطابق 100% مع الإجمالي النهائي ({formatSAR(currentSum)})</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-900 bg-amber-100 border border-amber-300 px-3 py-1 rounded-xl">
              <AlertCircle className="w-4 h-4 text-amber-700" />
              <span>
                مجموع الدفعات: <strong className="font-mono">{formatSAR(currentSum)}</strong> (الفارق:{' '}
                <strong className="font-mono text-red-700">{formatSAR(Math.abs(diff))}</strong>)
              </span>
              <button
                type="button"
                onClick={handleAutoBalance}
                className="bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-black text-[11px] px-2 py-0.5 rounded-md flex items-center gap-1 transition cursor-pointer shadow-xs mr-1"
                title="تعديل قيمة الدفعة الأخيرة لاستيعاب الفارق وجعل المجموع متطابقاً"
              >
                <Scale className="w-3 h-3" />
                <span>موازنة الفارق في الدفعة الأخيرة</span>
              </button>
            </div>
          )}
        </div>

        {/* Model Presets Selector */}
        <div className="p-3.5 bg-stone-50 border-b border-stone-200 shrink-0">
          <div className="text-[11px] font-black text-stone-600 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>نماذج التوزيع القياسية (أو تحكم يدوياً بالدفعات في الأسفل):</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => handlePresetSelect('design_standard')}
              className={`p-2 rounded-xl border text-right transition cursor-pointer ${
                scheduleType === 'design_standard'
                  ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                  : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
              }`}
            >
              <div className="font-black text-xs">رخص وتصميم</div>
              <div className="text-[10px] opacity-80 font-mono">40% - 40% - 20%</div>
            </button>

            <button
              type="button"
              onClick={() => handlePresetSelect('supervision_stages')}
              className={`p-2 rounded-xl border text-right transition cursor-pointer ${
                scheduleType === 'supervision_stages'
                  ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                  : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
              }`}
            >
              <div className="font-black text-xs">إشراف هندسي</div>
              <div className="text-[10px] opacity-80 font-mono">30% - 35% - 35%</div>
            </button>

            <button
              type="button"
              onClick={() => handlePresetSelect('study_split')}
              className={`p-2 rounded-xl border text-right transition cursor-pointer ${
                scheduleType === 'study_split'
                  ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                  : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
              }`}
            >
              <div className="font-black text-xs">دراسات ومسح</div>
              <div className="text-[10px] opacity-80 font-mono">50% - 50%</div>
            </button>

            <button
              type="button"
              onClick={() => setScheduleType('custom')}
              className={`p-2 rounded-xl border text-right transition cursor-pointer ${
                scheduleType === 'custom'
                  ? 'bg-amber-500 text-stone-950 border-amber-600 font-black shadow-xs'
                  : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
              }`}
            >
              <div className="font-black text-xs">تخصيص يدوي حر</div>
              <div className="text-[10px] opacity-80 font-bold">مبالغ ومراحل حرة</div>
            </button>
          </div>
        </div>

        {/* Milestones Edit Table / List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-black text-stone-800">
              قائمة الدفعات المالية المعتمدة ({milestones.length} دفعات):
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetToPercentages}
                className="text-[11px] font-bold text-stone-600 hover:text-stone-900 flex items-center gap-1 transition cursor-pointer"
                title="إعادة احتساب مبالغ الدفعات وفق نسب النموذج القياسي"
              >
                <RotateCcw className="w-3 h-3 text-stone-500" />
                <span>إعادة ضبط النسب تلقائياً</span>
              </button>

              <button
                type="button"
                onClick={handleAddMilestone}
                className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-xs"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ إضافة دفعة جديدة</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {milestones.map((m, index) => {
              const pct = grandTotal > 0 ? Math.round((m.amount / grandTotal) * 100) : m.percentage;

              return (
                <div
                  key={m.id || index}
                  className="bg-white border-2 border-stone-200 hover:border-amber-400 rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-3 transition"
                >
                  {/* Top row: Sequence, Title, Amount (SAR), Percentage, Delete (إنقاص) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    {/* Milestone Title Input */}
                    <div className="flex items-center gap-2 flex-1">
                      <span className="w-7 h-7 rounded-lg bg-stone-900 text-amber-400 flex items-center justify-center font-mono font-black text-xs shrink-0">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={m.title}
                          onChange={(e) => handleUpdateMilestone(index, { title: e.target.value })}
                          placeholder="مسمى الدفعة (مثال: الدفعة الأولى)"
                          className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-1.5 text-xs font-bold text-stone-900 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden transition"
                        />
                      </div>
                    </div>

                    {/* Milestone Amount Input (SAR) & Delete */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 bg-amber-50/70 border-2 border-amber-300/80 rounded-xl px-2.5 py-1">
                        <label className="text-[11px] font-black text-amber-950 shrink-0">
                          المبلغ (ر.س):
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="10"
                          value={m.amount === 0 ? '' : m.amount}
                          onChange={(e) =>
                            handleUpdateMilestone(index, { amount: Math.max(0, Number(e.target.value) || 0) })
                          }
                          placeholder="0"
                          className="w-28 bg-white border border-stone-300 rounded-md px-2 py-1 text-xs font-black text-stone-900 font-mono text-left focus:border-amber-500 focus:ring-2 focus:ring-amber-500 outline-hidden"
                        />
                      </div>

                      {/* Percentage Badge */}
                      <span
                        className="font-mono text-xs font-black bg-stone-100 text-stone-800 px-2 py-1.5 rounded-lg border border-stone-300 shrink-0 min-w-[46px] text-center"
                        title="نسبة الدفعة من إجمالي العرض"
                      >
                        {pct}%
                      </span>

                      {/* Delete Milestone Button (إنقاص) */}
                      {milestones.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteMilestone(index)}
                          className="p-1.5 text-red-500 hover:text-white hover:bg-red-600 bg-red-50 border border-red-200 rounded-lg transition cursor-pointer shrink-0 active:scale-95 flex items-center gap-1 text-[11px] font-bold"
                          title="حذف هذه الدفعة (إنقاص)"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">حذف</span>
                        </button>
                      ) : (
                        <div
                          className="p-1.5 text-stone-300 bg-stone-50 border border-stone-200 rounded-lg shrink-0 cursor-not-allowed"
                          title="يجب الإبقاء على دفعة واحدة على الأقل"
                        >
                          <Trash2 className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Milestone Reason / Description (سبب واستحقاق الدفعة) */}
                  <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-stone-700">
                      <span className="flex items-center gap-1 text-amber-900">
                        <Tag className="w-3 h-3 text-amber-600" />
                        سبب واستحقاق الدفعة:
                      </span>
                      <span className="text-[10px] text-stone-400 font-normal">
                        يظهر بجدول العرض المطبوع ومستند Word
                      </span>
                    </div>

                    <input
                      type="text"
                      value={m.description || ''}
                      onChange={(e) => handleUpdateMilestone(index, { description: e.target.value })}
                      placeholder="اكتب سبب استحقاق الدفعة (مثال: عند توقيع العقد، أو عند اعتماد المخططات المعمارية، أو بعد صب القواعد...)"
                      className="w-full bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs font-medium text-stone-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden"
                    />

                    {/* Quick Suggestions Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-stone-400 font-bold shrink-0">أسباب شائعة جاهزة:</span>
                      {QUICK_MILESTONE_REASONS.map((reason, rIdx) => (
                        <button
                          key={rIdx}
                          type="button"
                          onClick={() => handleUpdateMilestone(index, { description: reason })}
                          className="text-[10px] font-medium bg-white hover:bg-amber-100 hover:text-amber-900 text-stone-600 border border-stone-200 hover:border-amber-300 px-2 py-0.5 rounded-md transition cursor-pointer shrink-0"
                          title="انقر لتعيين هذا السبب للدفعة"
                        >
                          {reason}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-stone-100 border-t border-stone-200 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-stone-600 flex items-center gap-1.5">
            <span className="font-bold">المجموع الكلي للدفعات:</span>
            <span className={`font-mono font-black text-sm ${isBalanced ? 'text-emerald-700' : 'text-amber-800'}`}>
              {formatSAR(currentSum)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-200 transition cursor-pointer"
            >
              إلغاء
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-black px-5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>حفظ وتطبيق الدفعات</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
