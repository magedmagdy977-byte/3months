import React from 'react';
import { X, HelpCircle, Check, Ruler, Palette, MapPin, ShieldAlert, Hammer, ClipboardCheck } from 'lucide-react';

interface PricingGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PricingGuideModal: React.FC<PricingGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs no-print animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden text-stone-900 text-right">
        {/* Header */}
        <div className="bg-stone-900 text-white p-5 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black">دليل لائحة تسعير الرؤية المضيئة المعتمدة</h2>
              <p className="text-xs text-stone-400">
                مرجع القواعد الحسابية والشرائح لكافة الأقسام الهندسية الستة
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs leading-relaxed">
          {/* Section 1: Design Department */}
          <div className="space-y-3 bg-stone-50 p-4 rounded-xl border border-stone-200">
            <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
              <Ruler className="w-4 h-4 text-amber-600" />
              <span>أولاً: قسم التصميم ورخص البناء</span>
            </h3>
            <p className="text-stone-600">
              يشمل (فلل، عمائر سكنية، عمائر تجارية) مع شرائح خاصة معتمدة لكل نوع عقار، بالإضافة لخدمات الرخص (تصحيح وضع مبنى قائم، رخصة ترميم مبنى، وتعديل مكونات البناء).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded-lg border border-stone-200 space-y-1.5">
                <div className="font-bold text-stone-900">🏡 1. شرائح الفلل السكنية:</div>
                <ul className="space-y-1 text-stone-700 text-[11px]">
                  <li>• من 200 إلى 400 م²: <strong>25,000 ريال</strong></li>
                  <li>• من 400 إلى 500 م²: <strong>30,000 ريال</strong></li>
                  <li>• من 500 إلى 700 م²: <strong>40,000 ريال</strong></li>
                  <li>• من 700 إلى 1,000 م²: <strong>50,000 ريال</strong></li>
                  <li>• أكبر من 1,000 م²: <strong>60,000 ريال</strong></li>
                </ul>
              </div>

              <div className="bg-white p-3 rounded-lg border border-stone-200 space-y-1.5">
                <div className="font-bold text-stone-900">🏕️ 2. شرائح الاستراحات:</div>
                <ul className="space-y-1 text-stone-700 text-[11px]">
                  <li>• من 200 إلى 500 م²: <strong>15,000 ريال</strong></li>
                  <li>• من 500 إلى 700 م²: <strong>18,000 ريال</strong></li>
                  <li>• من 700 إلى 1,000 م²: <strong>20,000 ريال</strong></li>
                  <li>• أكبر من 1,000 م²: <strong>25,000 ريال</strong></li>
                </ul>
              </div>

              <div className="bg-white p-3 rounded-lg border border-stone-200 space-y-1.5">
                <div className="font-bold text-stone-900">🏢 3. شرائح العمائر السكنية:</div>
                <ul className="space-y-1 text-stone-700 text-[11px]">
                  <li>• من 200 إلى 500 م²: <strong>50,000 ريال</strong></li>
                  <li>• من 500 إلى 1,000 م²: <strong>80,000 ريال</strong></li>
                  <li>• من 1,000 إلى 2,000 م²: <strong>100,000 ريال</strong></li>
                  <li>• من 2,000 إلى 5,000 م²: <strong>120,000 ريال</strong></li>
                  <li>• 5,000 م² وأكثر: <strong>160,000 ريال</strong></li>
                </ul>
              </div>

              <div className="bg-white p-3 rounded-lg border border-stone-200 space-y-1.5">
                <div className="font-bold text-stone-900">🏬 4. شرائح العمائر التجارية:</div>
                <ul className="space-y-1 text-stone-700 text-[11px]">
                  <li>• من 200 إلى 500 م²: <strong>60,000 ريال</strong></li>
                  <li>• من 500 إلى 1,000 م²: <strong>90,000 ريال</strong></li>
                  <li>• من 1,000 إلى 2,000 م²: <strong>110,000 ريال</strong></li>
                  <li>• من 2,000 إلى 5,000 م²: <strong>160,000 ريال</strong></li>
                  <li>• 5,000 م² وأكثر: <strong>200,000 ريال</strong></li>
                </ul>
              </div>

              <div className="bg-white p-3 rounded-lg border border-stone-200 space-y-1.5">
                <div className="font-bold text-stone-900">🏨 5. شرائح الفنادق (رخص جديدة):</div>
                <ul className="space-y-1 text-stone-700 text-[11px]">
                  <li>• حتى 500 م²: <strong>70,000 ريال</strong></li>
                  <li>• من 500 إلى 1,000 م²: <strong>100,000 ريال</strong></li>
                  <li>• من 1,000 إلى 2,000 م²: <strong>120,000 ريال</strong></li>
                  <li>• من 2,000 إلى 5,000 م²: <strong>170,000 ريال</strong></li>
                  <li>• 5,000 م² وأكثر: <strong>210,000 ريال</strong></li>
                </ul>
              </div>

              <div className="bg-white p-3 rounded-lg border border-stone-200 space-y-1.5">
                <div className="font-bold text-stone-900">⛽ 6. شرائح محطات الوقود:</div>
                <ul className="space-y-1 text-stone-700 text-[11px]">
                  <li>• رخص جديدة: 500-1000: <strong>40ك</strong> | 1000-2000: <strong>60ك</strong> | 2000-3000: <strong>80ك</strong></li>
                  <li>• تصميم مخططات: 500-1000: <strong>30ك</strong> | 1000-2000: <strong>50ك</strong> | 2000-3000: <strong>70ك</strong></li>
                  <li>• تصحيح وضع: 500-1000: <strong>20ك</strong> | 1000-2000: <strong>30ك</strong> | 2000-3000: <strong>40ك</strong></li>
                  <li>• رخصة هدم: <strong>2,000 ريال</strong> ثابت</li>
                </ul>
              </div>

              <div className="bg-white p-3 rounded-lg border border-stone-200 space-y-1.5">
                <div className="font-bold text-stone-900">📦 7. ورش ومستودعات:</div>
                <ul className="space-y-1 text-stone-700 text-[11px]">
                  <li>• رخص جديدة: <strong>40ك</strong> | <strong>60ك</strong> | <strong>80ك</strong> | <strong>100ك</strong></li>
                  <li>• تصميم مخططات: <strong>30ك</strong> | <strong>40ك</strong> | <strong>50ك</strong> | <strong>60ك</strong></li>
                  <li>• تصحيح وضع: <strong>15ك</strong> | <strong>25ك</strong> | <strong>35ك</strong> | <strong>45ك</strong></li>
                  <li>• تعديل مكونات: <strong>40ك</strong> | <strong>60ك</strong> | <strong>80ك</strong> | <strong>100ك</strong></li>
                  <li>• رخصة هدم: <strong>2,000 ريال</strong> ثابت</li>
                </ul>
              </div>

              <div className="bg-white p-3 rounded-lg border border-stone-200 space-y-1.5">
                <div className="font-bold text-stone-900">🏭 8. المصانع:</div>
                <ul className="space-y-1 text-stone-700 text-[11px]">
                  <li>• رخص جديدة: 500-1000: <strong>90ك</strong> | 1000-2000: <strong>120ك</strong> | 2000-3000: <strong>180ك</strong> | 3000-5000: <strong>200ك</strong></li>
                  <li>• تصميم مخططات: 500-1000: <strong>80ك</strong> | 1000-2000: <strong>110ك</strong> | 2000-3000: <strong>170ك</strong> | 3000-5000: <strong>190ك</strong></li>
                  <li>• تصحيح وضع: 500-1000: <strong>40ك</strong> | 1000-2000: <strong>55ك</strong> | 2000-3000: <strong>85ك</strong> | 3000-5000: <strong>95ك</strong></li>
                  <li>• تعديل مكونات: <strong>نفس أسعار الرخص الجديدة</strong> (90ك | 120ك | 180ك | 200ك)</li>
                  <li>• رخصة هدم: <strong>2,000 ريال</strong> ثابت</li>
                </ul>
              </div>

              <div className="bg-white p-3 rounded-lg border border-stone-200 space-y-1.5 md:col-span-2 lg:col-span-3">
                <div className="font-bold text-stone-900">خدمات الرخص والتصاميم الخاصة:</div>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 text-stone-700 text-[11px]">
                  <div className="p-2 bg-amber-50/60 border border-amber-200 rounded-lg">
                    <strong className="text-amber-900">📐 تصميم مخططات:</strong>
                    <div className="mt-1 space-y-0.5 text-[10px] text-stone-700">
                      <div>• عام: 8ك | 10ك | 12ك | 15ك | 20ك</div>
                      <div>• فنادق: 500-1000: <strong>60ك</strong> | 1000-2000: <strong>80ك</strong> | 2000-5000: <strong>100ك</strong></div>
                      <div>• مصانع: 80ك | 110ك | 170ك | 190ك</div>
                      <div>• محطات: 30ك | 50ك | 70ك</div>
                      <div>• ورش ومستودعات: 30ك | 40ك | 50ك | 60ك</div>
                      <div className="text-[9px] text-amber-800 font-bold mt-1">* مستثنى منها الرفع والرخصة</div>
                    </div>
                  </div>
                  <div className="p-2 bg-stone-50 rounded-lg">
                    <strong>تصحيح وضع مبنى قائم:</strong>
                    <div className="mt-1 space-y-1 text-[10px]">
                      <div>
                        <span className="font-bold text-stone-800">🏡 الفلل والاستراحات:</span>
                        <div className="text-stone-600">10ك | 12ك | 15ك | 18ك | 20ك</div>
                      </div>
                      <div>
                        <span className="font-bold text-stone-800">🏨 الفنادق:</span>
                        <div className="text-stone-600">500: 40ك | 500-1000: 50ك | 1000-2000: 60ك | 2000-5000: 70ك</div>
                      </div>
                      <div>
                        <span className="font-bold text-stone-800">🏭 المصانع:</span>
                        <div className="text-stone-600">40ك | 55ك | 85ك | 95ك</div>
                      </div>
                      <div>
                        <span className="font-bold text-stone-800">⛽ محطات الوقود:</span>
                        <div className="text-stone-600">20ك | 30ك | 40ك</div>
                      </div>
                      <div>
                        <span className="font-bold text-stone-800">📦 ورش ومستودعات:</span>
                        <div className="text-stone-600">15ك | 25ك | 35ك | 45ك</div>
                      </div>
                      <div>
                        <span className="font-bold text-stone-800">🏢 العمائر:</span>
                        <div className="text-stone-600">20ك | 24ك | 30ك | 36ك | 40ك</div>
                      </div>
                    </div>
                  </div>
                  <div className="p-2 bg-stone-50 rounded-lg">
                    <strong>تعديل مكونات بناء:</strong>
                    <div className="mt-1 text-[10px] text-stone-600 space-y-1">
                      <div>• عام، مصانع، ورش ومستودعات: <strong className="text-amber-700 font-bold">نفس أسعار الرخص الجديدة</strong> تماماً.</div>
                      <div>• فنادق: 500: <strong>50ك</strong> | 500-1000: <strong>60ك</strong> | 1000-2000: <strong>80ك</strong> | 2000-5000: <strong>100ك</strong></div>
                    </div>
                  </div>
                  <div className="p-2 bg-stone-50 rounded-lg">
                    <strong>رخصة ترميم مبنى:</strong>
                    <div className="mt-1 space-y-0.5 text-[10px]">
                      <div>• الفلل والاستراحات: <strong>2,000 ريال</strong></div>
                      <div>• الفنادق: <strong>5,000 ريال</strong></div>
                      <div>• السكني والتجاري والمصانع: <strong>3,000 ريال</strong></div>
                    </div>
                  </div>
                  <div className="p-2 bg-stone-50 rounded-lg">
                    <strong>رخصة هدم:</strong>
                    <div className="mt-1 space-y-0.5 text-[10px]">
                      <div>• الفنادق: <strong>3,000 ريال</strong> ثابت</div>
                      <div>• محطات وقود / ورش ومستودعات / مصانع: <strong>2,000 ريال</strong> ثابت</div>
                      <div>• المباني الأخرى: <strong>1,000 ريال</strong> ثابت</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-stone-200 space-y-1.5">
                <div className="font-bold text-stone-900">2. بنود خدمة التصميم المنفردة:</div>
                <ul className="space-y-0.5 text-stone-700 grid grid-cols-2">
                  <li>• معماري: 3,000 ريال</li>
                  <li>• إنشائي: 3,000 ريال</li>
                  <li>• كهرباء: 1,000 ريال</li>
                  <li>• سباكة: 1,000 ريال</li>
                  <li>• تكييف: 1,000 ريال</li>
                  <li>• كود الطاقة: 1,000 ريال</li>
                  <li>• فحص تربة: 2,000 ريال</li>
                  <li>• قرار مساحي: 1,500 ريال</li>
                </ul>
              </div>

              <div className="md:col-span-2 bg-white p-3 rounded-lg border border-stone-200 space-y-2">
                <div className="font-bold text-stone-900 flex items-center justify-between">
                  <span>3. خيار التسعير بمعادلة سعر المتر التنازلية (Excel Formula):</span>
                  <span className="text-[10px] bg-[#433c71] text-white px-2 py-0.5 rounded font-bold">معادلة رسمية</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-stone-700 text-[11px]">
                  <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-100">
                    <strong className="text-stone-900 block mb-1">🏡 الفلل السكنية:</strong>
                    <div>• النطاق: 200 إلى 2,000 م²</div>
                    <div>• السعر: يبدأ 150 ر.س/م² وينتهي عند 75 ر.س/م²</div>
                  </div>
                  <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-100">
                    <strong className="text-stone-900 block mb-1">🏢 العمائر السكنية:</strong>
                    <div>• النطاق: 400 إلى 2,000 م²</div>
                    <div>• السعر: يبدأ 200 ر.س/م² وينتهي عند 100 ر.س/م²</div>
                  </div>
                  <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-100">
                    <strong className="text-stone-900 block mb-1">🏬 العمائر التجارية:</strong>
                    <div>• النطاق: 400 إلى 10,000 م²</div>
                    <div>• السعر: يبدأ 200 ر.س/م² وينتهي عند 30 ر.س/م²</div>
                  </div>
                </div>
                <div className="text-[11px] text-stone-500">
                  * يتوفر خيار إضافي لتعديل سعر التصميم يدوياً لأي قيمة معتمدة خاصة.
                </div>
              </div>

              <div className="md:col-span-2 bg-white p-3 rounded-lg border border-stone-200 space-y-1.5">
                <div className="font-bold text-stone-900">خدمة الإشراف الملحقة برخصة البناء:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-stone-700">
                  <div>
                    <strong>إشراف مقطوع (10 زيارات أعمال عظم):</strong>
                    <div className="text-[11px] text-stone-600 mt-0.5">
                      فلل: 16k / 20k / 25k | سكني: 20k / 25k / 30k | تجاري: 25k / 30k / 35k
                    </div>
                  </div>
                  <div>
                    <strong>إشراف شهري كامل:</strong>
                    <div className="text-[11px] text-stone-600 mt-0.5">
                      أقل من 500م: 18,000 ريال | 500-1000م: 22,000 ريال | 1000-2000م: 26,000 ريال | &gt;2000م: 32,000 ريال
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Supervision & Project Management Department */}
          <div className="space-y-3 bg-stone-50 p-4 rounded-xl border border-stone-200">
            <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-amber-600" />
              <span>ثانياً: قسم الإشراف وإدارة المشاريع (قسم منفصل عن التنفيذ)</span>
            </h3>
            <p className="text-stone-600">
              قسم مستقل للاستشارات الهندسية والمتابعة الميدانية يشمل أربعة بنود رئيسية:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white p-3 rounded-lg border border-stone-200 space-y-1">
                <div className="font-bold text-stone-900 text-xs">🏛️ 1. إشراف بلدية:</div>
                <div className="text-[11px] text-stone-600">
                  شهادة إشراف منصة بلدي ومطابقة الكود السعودي SBC.
                </div>
                <ul className="text-[10px] text-stone-700 space-y-0.5 mt-1">
                  <li>• الفلل: 0-500: <strong>16,000 ريال</strong> | 500-1000: <strong>20,000 ريال</strong> | &gt;1000: <strong>25,000 ريال</strong></li>
                  <li>• سكني: 0-500: <strong>20,000 ريال</strong> | 500-1000: <strong>25,000 ريال</strong> | &gt;1000: <strong>30,000 ريال</strong></li>
                  <li>• تجاري: 0-500: <strong>25,000 ريال</strong> | 500-1000: <strong>30,000 ريال</strong> | &gt;1000: <strong>35,000 ريال</strong></li>
                  <li>• أو 2,000 ريال / مرحلة صب</li>
                </ul>
              </div>

              <div className="bg-white p-3 rounded-lg border border-stone-200 space-y-1">
                <div className="font-bold text-stone-900 text-xs">👁️ 2. إشراف عام:</div>
                <div className="text-[11px] text-stone-600">
                  إشراف استشاري موقع واستلامات حديد وخرسانات وعوازل.
                </div>
                <ul className="text-[10px] text-stone-700 space-y-0.5 mt-1">
                  <li>• إشراف شهري: <strong>فيلا: 12k / سكني: 16k / تجاري: 18k</strong></li>
                  <li>• مقطوع مرحلة العظم: <strong>16,000 ريال</strong></li>
                  <li>• مقطوع التشطيبات: <strong>14,000 ريال</strong></li>
                  <li>• بالزيارة المحددة: <strong>800 ريال / زيارة</strong></li>
                </ul>
              </div>

              <div className="bg-white p-3 rounded-lg border border-stone-200 space-y-1">
                <div className="font-bold text-stone-900 text-xs">📊 3. إدارة مشروع:</div>
                <div className="text-[11px] text-stone-600">
                  تخطيط الجدول الزمني CPM ومراقبة التكاليف والمستخلصات.
                </div>
                <ul className="text-[10px] text-stone-700 space-y-0.5 mt-1">
                  <li>• شهري / مقطوع: <strong>فلل: 18k / سكني: 22k / تجاري: 25k</strong></li>
                  <li>• نسبة مئوية: <strong>5% - 8%</strong> من التكلفة التقديرية</li>
                </ul>
              </div>

              <div className="bg-white p-3 rounded-lg border border-stone-200 space-y-1">
                <div className="font-bold text-stone-900 text-xs">⚠️ 4. تقرير أضرار:</div>
                <div className="text-[11px] text-stone-600">
                  فحص الشروخ والتصدعات والهبوط وتقديم تقرير معتمد (1,500 - 3,000 ريال).
                </div>
                <ul className="text-[10px] text-stone-700 space-y-0.5 mt-1">
                  <li>• فيلا سكنية: <strong>1,500 ريال</strong></li>
                  <li>• عمارة سكنية/تجارية: <strong>2,200 ريال</strong></li>
                  <li>• منشأة كبرى: <strong>2,800 ريال</strong></li>
                  <li>• فحص متقدم NDT: <strong>3,000 ريال</strong></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 3: Decor Department */}
          <div className="space-y-3 bg-stone-50 p-4 rounded-xl border border-stone-200">
            <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
              <Palette className="w-4 h-4 text-amber-600" />
              <span>ثالثاً: قسم الديكور والتصميم الداخلي</span>
            </h3>
            <p className="text-stone-600">
              يشمل المخرجات الستة المعتمدة: (رفع مساحي As Built، مود بورد، 3D، مخططات تنفيذية، جداول مواصفات، جداول كميات BOQ). النطاقات السعرية: مودرن (40 - 60 ر.س/م²)، نيوكلاسيك (60 - 80 ر.س/م²)، كلاسيك (80 - 100 ر.س/م²).
            </p>

            <div className="overflow-x-auto border border-stone-200 rounded-lg bg-white">
              <table className="w-full text-right divide-y divide-stone-200">
                <thead className="bg-stone-100 font-bold text-stone-800">
                  <tr>
                    <th className="p-2.5">شريحة المساحة الطابقية</th>
                    <th className="p-2.5">طراز مودرن (40-60)</th>
                    <th className="p-2.5">طراز نيوكلاسيك (60-80)</th>
                    <th className="p-2.5">طراز كلاسيك (80-100)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  <tr className="bg-amber-50/60">
                    <td className="p-2.5 font-bold">أقل من 200 م²</td>
                    <td className="p-2.5 text-amber-900 font-bold" colSpan={3}>
                      تسعير يدوي حسب الاتفاق (لا توجد شريحة أسعار ثابتة باللائحة)
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold">من 200 إلى 1,000 م²</td>
                    <td className="p-2.5">المساحة × 60 ريال</td>
                    <td className="p-2.5">المساحة × 80 ريال</td>
                    <td className="p-2.5">المساحة × 100 ريال</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold">من 1,000 إلى 2,000 م²</td>
                    <td className="p-2.5">المساحة × 50 ريال</td>
                    <td className="p-2.5">المساحة × 70 ريال</td>
                    <td className="p-2.5">المساحة × 90 ريال</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold">أكبر من 2,000 م²</td>
                    <td className="p-2.5">المساحة × 40 ريال</td>
                    <td className="p-2.5">المساحة × 60 ريال</td>
                    <td className="p-2.5">المساحة × 80 ريال</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4, 5, 6 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-1.5">
              <div className="font-black text-stone-900 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                <span>رابعاً: قسم المساحة</span>
              </div>
              <ul className="space-y-1 text-stone-600 text-[11px]">
                <li>• قرار مساحي: 1,500 ريال</li>
                <li>• رفع طبوغرافي: 2,500 ريال</li>
                <li>• فرز وتجزئة: 3,500 ريال</li>
                <li>• تبتير حدود: 2,000 ريال</li>
                <li>• كروكي تنظيمي: 1,800 ريال</li>
              </ul>
            </div>

            <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-1.5">
              <div className="font-black text-stone-900 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span>خامساً: الدفاع المدني</span>
              </div>
              <ul className="space-y-1 text-stone-600 text-[11px]">
                <li>• مخططات سلامة: تبدأ من 5,000 ريال</li>
                <li>• تقرير فني سلامة: 3,000 ريال</li>
                <li>• رخصة سلامة: 2,500 ريال</li>
                <li>• دراسة استشارية: 2,000 ريال</li>
              </ul>
            </div>

            <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-1.5">
              <div className="font-black text-stone-900 flex items-center gap-1.5">
                <Hammer className="w-3.5 h-3.5 text-amber-600" />
                <span>سادساً: قسم التنفيذ</span>
              </div>
              <ul className="space-y-1 text-stone-600 text-[11px]">
                <li>• تسليم مفتاح: 1,550 ريال/م²</li>
                <li>• عظم بالمواد: 650 ريال/م²</li>
                <li>• عظم مصنعيات: 160 ريال/م²</li>
                <li>• تشطيبات معمارية: 450 ريال/م²</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-stone-100 p-4 border-t border-stone-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-stone-900 hover:bg-stone-800 text-white font-bold px-5 py-2 rounded-xl text-xs transition"
          >
            إغلاق الدليل
          </button>
        </div>
      </div>
    </div>
  );
};
