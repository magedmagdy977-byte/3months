import React, { useState } from 'react';
import { X, BookOpen, Layers, CheckCircle2, Sliders, ShieldCheck, FileCheck, Copy, Check } from 'lucide-react';
import { MASTER_SCOPE_DEFINITIONS, DECOR_SCOPE_DEFINITIONS, EXCLUSION_CLAUSES, GENERAL_OWNER_OBLIGATIONS, CONDITIONAL_OWNER_OBLIGATIONS } from '../../data/masterTemplateDefaults';

interface MasterTemplateInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MasterTemplateInfoModal: React.FC<MasterTemplateInfoModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'clauses' | 'rules'>('overview');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCopyStructure = () => {
    const text = `MASTER TEMPLATE — نموذج عرض السعر الموحد
مرجع مركزي لتوليد عروض أسعار التصميم والرخص والإشراف والخدمات المرتبطة

أولًا: بيانات العرض والمشروع
ثانيًا: عنوان ومقدمة العرض
ثالثًا: نطاق أعمال الاستشاري (وحدات شرطية IF)
رابعًا: التزامات المالك
خامسًا: مدة تنفيذ الأعمال
سادسًا: الاعتمادات والتعديلات
سابعًا: الأعمال غير المشمولة (الاستثناءات)
ثامنًا: حقوق الملكية الفكرية والفنية
تاسعًا: الأسعار والضريبة
عاشرًا: جدول الدفعات والبيانات البنكية وصلاحية العرض والاعتماد`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-xs p-4 overflow-y-auto no-print">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-stone-900 text-white p-5 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black">MASTER TEMPLATE — نموذج عرض السعر الموحد</h3>
                <span className="text-[10px] font-bold bg-[#e37725]/20 text-[#e37725] border border-[#e37725]/40 px-2 py-0.5 rounded-full font-mono">
                  المرجع المعتمد
                </span>
              </div>
              <p className="text-xs text-stone-400">
                مرجع مركزي لتوليد عروض أسعار التصميم والرخص والإشراف والخدمات المرتبطة
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-stone-100 border-b border-stone-200 px-6 py-2.5 flex items-center justify-between gap-3 text-xs font-bold">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'overview'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200'
              }`}
            >
              الهيكل والتعليمات العشرة
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('clauses')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'clauses'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200'
              }`}
            >
              الوحدات الشرطية (11 وحدة IF)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('rules')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'rules'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200'
              }`}
            >
              الالتزامات والاستثناءات
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyStructure}
            className="flex items-center gap-1.5 text-xs text-stone-700 hover:text-stone-900 bg-white border border-stone-300 hover:bg-stone-50 px-3 py-1.5 rounded-lg transition shadow-2xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
            <span>{copied ? 'تم النسخ' : 'نسخ الهيكل'}</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-right text-stone-800">
          {activeTab === 'overview' && (
            <div className="space-y-6 text-xs">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-stone-800 space-y-2">
                <div className="font-black text-amber-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>تعليمات الاستخدام ونظام المتغيرات والوحدات الشرطية:</span>
                </div>
                <p className="leading-relaxed text-stone-700 text-[11px]">
                  • الحقول بين <strong>&#123;&#123; &#125;&#125;</strong> هي بيانات متغيرة (مثل رقم العرض، اسم العميل، رقم القطعة والمخطط، المساحة، والأسعار).
                  <br />
                  • البنود التي تبدأ بـ <strong>&#123;&#123;IF:...&#125;&#125;</strong> هي بنود ووحدات شرطية تظهر فقط عند اختيار الخدمة المقابلة في العرض.
                  <br />
                  • لا تُحذف البنود المركزية من النسخة الرئيسية؛ بل يتم التحكم فيها وتوليدها تلقائياً من بيانات العرض والبنود المسعرة.
                </p>
              </div>

              {/* 10 Sections Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-1.5">
                  <span className="font-black text-stone-900 text-xs block">أولًا: بيانات العرض والمشروع</span>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    رقم العرض، التاريخ، اسم العميل، نوع المبنى، المدينة، الحي، رقم القطعة، رقم المخطط، مساحة الأرض (م²)، ونوع الخدمة.
                  </p>
                </div>

                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-1.5">
                  <span className="font-black text-stone-900 text-xs block">ثانيًا: عنوان ومقدمة العرض</span>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    صيغة رسمية معتمدة موجهة للسيد العميل باسم مجموعة شركات الرؤية المضيئة للاستشارات الهندسية تبيّن موقع المشروع وحدوده.
                  </p>
                </div>

                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-1.5">
                  <span className="font-black text-stone-900 text-xs block">ثالثًا: نطاق أعمال الاستشاري</span>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    11 وحدة شرطية (الرفع المساحي، المعماري، الإنشائي، الكهرباء، التكييف، الصرف الصحي (السباكة)، الدفاع المدني، إصدار رخصة البناء، تصحيح وضع مبنى قائم، تعديل المكونات، الإشراف).
                  </p>
                </div>

                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-1.5">
                  <span className="font-black text-stone-900 text-xs block">رابعًا: التزامات المالك</span>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    تزويد الاستشاري بالبيانات، اعتماد المراحل، سداد الدفعات، الرسوم الحكومية، مع بنود شرطية خاصة بالإشراف وتعديل المكونات.
                  </p>
                </div>

                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-1.5">
                  <span className="font-black text-stone-900 text-xs block">خامسًا: مدة تنفيذ الأعمال</span>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    تحديد مدة التنفيذ بأيام العمل وتاريخ بدء المدة، واستبعاد فترات مراجعة المالك أو الجهات المختصة من المدة.
                  </p>
                </div>

                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-1.5">
                  <span className="font-black text-stone-900 text-xs block">سادسًا: الاعتمادات والتعديلات</span>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    اعتماد كل مرحلة قبل الانتقال للمرحلة التالية، تحديد عدد التعديلات المشمولة، وتقييم التغييرات الجوهرية كملحق مستقل.
                  </p>
                </div>

                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-1.5">
                  <span className="font-black text-stone-900 text-xs block">سابعًا: الأعمال غير المشمولة — تظهر حسب الحالة</span>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    ▪ &#123;&#123;IF:رسوم_حكومية_غير_مشمولة&#125;&#125; لا تشمل الأتعاب الرسوم الحكومية أو رسوم الجهات ذات العلاقة.
                    <br />
                    ▪ &#123;&#123;استثناءات_إضافية&#125;&#125;
                  </p>
                </div>

                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-1.5">
                  <span className="font-black text-stone-900 text-xs block">ثامنًا: حقوق الملكية الفكرية والفنية</span>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    حقوق استخدام المخرجات للمشروع، وحق الاستشاري في التوثيق والنشر الترويجي والمهني دون الإخلال بخصوصية العميل.
                  </p>
                </div>

                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-1.5">
                  <span className="font-black text-stone-900 text-xs block">تاسعًا: الأسعار والضريبة</span>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    جدول مالي معتمد: أتعاب الخدمة، الخصم الممنوح، ضريبة القيمة المضافة (15%)، الإجمالي النهائي، والتفقيط كتابةً بالريال.
                  </p>
                </div>

                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-1.5">
                  <span className="font-black text-stone-900 text-xs block">عاشرًا: جدول الدفعات والبيانات البنكية والاعتماد</span>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    جدول الدفعات المرحلي، حساب الآيبان والبنك، صلاحية العرض بالأيام، وتواقيع واعتماد الطرفين وختم الشركة المعتمد.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'clauses' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="text-xs font-black text-stone-800">
                  الوحدات الـ 11 الشرطية المعتمدة في نطاق أعمال الاستشاري (ثالثًا):
                </div>

                <div className="space-y-3">
                  {MASTER_SCOPE_DEFINITIONS.map((def, idx) => (
                    <div
                      key={def.id}
                      className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-stone-900 text-white font-mono text-[10px] flex items-center justify-center font-bold">
                            {idx + 1}
                          </span>
                          <span className="font-black text-stone-900">{def.name}</span>
                        </div>
                        <span className="font-mono text-[11px] text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded border border-amber-200 font-bold">
                          {def.tag}
                        </span>
                      </div>
                      <p className="text-stone-600 text-[11px] leading-relaxed pt-1">
                        {def.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* قسم الديكور والتصميم الداخلي */}
              <div className="space-y-3 pt-4 border-t border-stone-200">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black text-stone-800">
                    وحدات التصميم الداخلي والديكور الشرطية الـ 6 (قابلة للحذف والاستبعاد في العرض):
                  </div>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full">
                    قسم الديكور
                  </span>
                </div>

                <div className="space-y-3">
                  {DECOR_SCOPE_DEFINITIONS.map((def, idx) => (
                    <div
                      key={def.id}
                      className="p-3.5 bg-amber-50/50 border border-amber-300 rounded-xl space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-amber-600 text-white font-mono text-[10px] flex items-center justify-center font-bold">
                            {idx + 1}
                          </span>
                          <span className="font-black text-stone-900">{def.name}</span>
                        </div>
                        <span className="font-mono text-[11px] text-amber-800 bg-white px-2 py-0.5 rounded border border-amber-300 font-bold">
                          {def.tag}
                        </span>
                      </div>
                      <p className="text-stone-700 text-[11px] leading-relaxed pt-1">
                        {def.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-6 text-xs">
              {/* Obligations */}
              <div className="space-y-3">
                <div className="font-black text-stone-900 text-xs flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <span>التزامات المالك (رابعًا) — العامة والشرطية:</span>
                </div>
                <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl space-y-2 text-[11px] text-stone-700">
                  <div className="font-bold text-stone-900 mb-1">الالتزامات الدائمة:</div>
                  {GENERAL_OWNER_OBLIGATIONS.map((ob, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-amber-600 font-black">•</span>
                      <span>{ob}</span>
                    </div>
                  ))}

                  <div className="font-bold text-stone-900 mt-3 pt-2 border-t border-stone-200">
                    الالتزامات الشرطية:
                  </div>
                  <div className="flex items-start gap-2 text-stone-800">
                    <span className="text-blue-600 font-mono text-[10px] font-bold shrink-0">
                      &#123;&#123;IF:تعديل_مكونات&#125;&#125;
                    </span>
                    <span>{CONDITIONAL_OWNER_OBLIGATIONS.modifyComponents}</span>
                  </div>
                  <div className="flex items-start gap-2 text-stone-800">
                    <span className="text-blue-600 font-mono text-[10px] font-bold shrink-0">
                      &#123;&#123;IF:إشراف&#125;&#125;
                    </span>
                    <span>{CONDITIONAL_OWNER_OBLIGATIONS.supervision}</span>
                  </div>
                </div>
              </div>

              {/* Exclusions */}
              <div className="space-y-3">
                <div className="font-black text-stone-900 text-xs flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-600" />
                  <span>الأعمال غير المشمولة (سابعًا) — الاستثناءات الشرطية:</span>
                </div>
                <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl space-y-2 text-[11px] text-stone-700">
                  {Object.entries(EXCLUSION_CLAUSES).map(([key, text]) => (
                    <div key={key} className="flex items-start gap-2">
                      <span className="text-red-500 font-mono text-[10px] font-bold shrink-0">
                        &#123;&#123;IF:{key}&#125;&#125;
                      </span>
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-stone-100 p-4 border-t border-stone-200 flex items-center justify-between text-xs">
          <div className="text-[11px] text-stone-500">
            تم دمج نموذج Master Template بالكامل في نافذة تحرير عرض السعر وشاشة الطباعة/PDF.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="bg-stone-900 hover:bg-stone-800 text-white font-bold px-5 py-2 rounded-xl text-xs transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
