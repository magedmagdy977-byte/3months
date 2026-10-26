import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Smartphone,
  Monitor,
  QrCode,
  Download,
  Share2,
  Copy,
  Check,
  ExternalLink,
  PlusSquare,
  Sparkles,
  ArrowRight,
  FolderArchive,
  Terminal,
  ShieldCheck,
  FileEdit,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { LuminousLogo } from './LuminousLogo';

interface ExportAndInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportAndInstallModal: React.FC<ExportAndInstallModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'mobile' | 'desktop' | 'docs' | 'code'>('mobile');
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  // Get canonical URL to open
  const currentUrl = window.location.href.split('?')[0];

  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(currentUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#1e1b2e',
          light: '#ffffff',
        },
      })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error('QR Code generation error:', err));
    }
  }, [isOpen, currentUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div
        className="relative bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 my-8"
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-stone-900 text-white p-6 relative flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white p-1.5 flex items-center justify-center shrink-0 border border-stone-700 shadow-xs">
              <LuminousLogo variant="icon" className="w-full h-full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">
                  استخراج واستخدام التطبيق
                </h3>
                <span className="text-[10px] font-bold bg-[#e37725] text-white px-2 py-0.5 rounded-full font-mono">
                  PWA & WEB
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                طرق فتح وتثبيت الأداة على الكمبيوتر والهاتف المحمول بدون برامج خارجية
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-colors shrink-0"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-stone-200 bg-stone-50/80 p-2 gap-2 text-sm font-bold">
          <button
            onClick={() => setActiveTab('mobile')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all ${
              activeTab === 'mobile'
                ? 'bg-white text-stone-900 shadow-xs border border-stone-200 font-black'
                : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
            }`}
          >
            <Smartphone className="w-4 h-4 text-[#e37725]" />
            <span>الهاتف المحمول (iOS & Android)</span>
          </button>

          <button
            onClick={() => setActiveTab('desktop')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all ${
              activeTab === 'desktop'
                ? 'bg-white text-stone-900 shadow-xs border border-stone-200 font-black'
                : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
            }`}
          >
            <Monitor className="w-4 h-4 text-[#433c71]" />
            <span>الكمبيوتر</span>
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all ${
              activeTab === 'docs'
                ? 'bg-white text-stone-900 shadow-xs border border-stone-200 font-black'
                : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
            }`}
          >
            <FileEdit className="w-4 h-4 text-emerald-600" />
            <span>مستندات جوجل & Word</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all ${
              activeTab === 'code'
                ? 'bg-white text-stone-900 shadow-xs border border-stone-200 font-black'
                : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
            }`}
          >
            <FolderArchive className="w-4 h-4 text-amber-600" />
            <span>ملفات ZIP</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {/* TAB 1: MOBILE */}
          {activeTab === 'mobile' && (
            <div className="space-y-6">
              {/* QR Code Section */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-6">
                <div className="bg-white p-3 rounded-2xl shadow-xs border border-stone-200 shrink-0">
                  {qrCodeUrl ? (
                    <img
                      src={qrCodeUrl}
                      alt="QR Code"
                      className="w-40 h-40 object-contain rounded-xl"
                    />
                  ) : (
                    <div className="w-40 h-40 flex items-center justify-center text-stone-400">
                      <QrCode className="w-12 h-12 animate-pulse" />
                    </div>
                  )}
                  <div className="text-center text-[10px] text-stone-500 font-bold mt-2">
                    امسح بكاميرا الجوال
                  </div>
                </div>

                <div className="space-y-3 text-right">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-800 rounded-lg text-xs font-bold border border-amber-500/20">
                    <Sparkles className="w-3.5 h-3.5" />
                    أسرع طريقة للفتح على هاتفك
                  </div>
                  <h4 className="text-base font-black text-stone-900">
                    امسح رمز الـ QR بكاميرا هاتفك
                  </h4>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    وجّه كاميرا هاتفك الذكي (آيفون أو أندرويد) نحو الرمز، واضغط على الرابط الذي يظهر لفتح الأداة مباشرة بدون أي خطوات إضافية.
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={handleCopy}
                      className="inline-flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span>تم نسخ الرابط!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>نسخ رابط الأداة</span>
                        </>
                      )}
                    </button>

                    <a
                      href={currentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold px-3 py-2 rounded-xl transition-all border border-stone-300"
                    >
                      <span>فتح بتبويب جديد</span>
                      <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Install Instructions on Mobile */}
              <div className="space-y-4">
                <h4 className="text-sm font-black text-stone-900 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#433c71]" />
                  <span>تثبيت الأداة كتطبيق رسمي على الشاشة الرئيسية للهاتف:</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* iOS Safari */}
                  <div className="border border-stone-200 bg-stone-50/70 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-stone-800 bg-white px-2.5 py-1 rounded-lg border border-stone-200">
                        أجهزة آيفون وآيباد (iOS)
                      </span>
                      <span className="text-[11px] text-stone-500 font-mono">Safari</span>
                    </div>
                    <ol className="text-xs text-stone-600 space-y-2 list-decimal list-inside pr-1 leading-relaxed">
                      <li>افتح الرابط في متصفح <strong>Safari</strong>.</li>
                      <li>
                        اضغط على زر المشاركة{' '}
                        <Share2 className="w-3.5 h-3.5 inline text-sky-600 mx-0.5" /> في أسفل الشاشة.
                      </li>
                      <li>
                        اختر <strong>«إضافة إلى الشاشة الرئيسية»</strong>{' '}
                        <PlusSquare className="w-3.5 h-3.5 inline text-stone-700 mx-0.5" /> (Add to Home Screen).
                      </li>
                      <li>اضغط <strong>إضافة (Add)</strong>، وسيظهر التطبيق بأيقونة الرؤية المضيئة المعتمدة على شاشتك.</li>
                    </ol>
                  </div>

                  {/* Android Chrome */}
                  <div className="border border-stone-200 bg-stone-50/70 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-stone-800 bg-white px-2.5 py-1 rounded-lg border border-stone-200">
                        أجهزة أندرويد (Android)
                      </span>
                      <span className="text-[11px] text-stone-500 font-mono">Chrome</span>
                    </div>
                    <ol className="text-xs text-stone-600 space-y-2 list-decimal list-inside pr-1 leading-relaxed">
                      <li>افتح الرابط في متصفح <strong>Google Chrome</strong>.</li>
                      <li>اضغط على قائمة الثلاث نقاط <strong>(⋮)</strong> في الأعلى.</li>
                      <li>اختر <strong>«تثبيت التطبيق»</strong> أو <strong>«إضافة إلى الشاشة الرئيسية»</strong>.</li>
                      <li>سيتم تثبيت التطبيق فوراً والعمل بوضع الشاشة الكاملة وبدون شريط المتصفح!</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DESKTOP */}
          {activeTab === 'desktop' && (
            <div className="space-y-6">
              {/* Direct Web link card */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-5 h-5 text-[#433c71]" />
                    <h4 className="text-sm font-black text-stone-900">
                      الفتح المباشر على أي متصفح بالكمبيوتر
                    </h4>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    متاح دائماً عبر السحابة
                  </span>
                </div>

                <p className="text-xs text-stone-600 leading-relaxed">
                  يمكنك حفظ الرابط في المفضلة (Bookmarks) في Chrome أو Edge أو Firefox والوصول إليه بضغطة زر.
                </p>

                <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-stone-200">
                  <input
                    type="text"
                    readOnly
                    value={currentUrl}
                    className="flex-1 text-xs font-mono text-stone-700 bg-transparent outline-hidden select-all"
                  />
                  <button
                    onClick={handleCopy}
                    className="shrink-0 inline-flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
                  </button>
                </div>
              </div>

              {/* Install PWA Button on Desktop */}
              <div className="border-2 border-dashed border-[#433c71]/30 bg-[#433c71]/5 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h5 className="text-sm font-black text-[#433c71] flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      <span>تثبيت كبرنامج مستقل لسطح المكتب (Desktop App)</span>
                    </h5>
                    <p className="text-xs text-stone-600">
                      يفتح التطبيق كنافذة نظام مستقلة على شريط المهام في Windows أو Mac بدون واجهة المتصفح.
                    </p>
                  </div>
                  {isInstallable && (
                    <button
                      onClick={install}
                      className="inline-flex items-center gap-2 bg-[#433c71] hover:bg-[#342e58] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md"
                    >
                      <Download className="w-4 h-4" />
                      <span>تثبيت على الجهاز الآن</span>
                    </button>
                  )}
                </div>

                {!isInstallable && (
                  <div className="bg-white/90 p-3 rounded-xl border border-stone-200 text-xs text-stone-600 leading-relaxed">
                    💡 <strong>طريقة التثبيت يدوياً:</strong> من شريط العنوان في متصفحك (Chrome أو Edge)، اضغط على أيقونة الشاشة/السهم{' '}
                    <span className="font-mono bg-stone-100 px-1.5 py-0.5 rounded border border-stone-300">
                      Install / تثبيت التطبيق
                    </span>{' '}
                    الموجودة في أقصى يمين أو يسار شريط الروابط، وسيتم تثبيته فوراً.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: GOOGLE DOCS & WORD */}
          {activeTab === 'docs' && (
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <FileEdit className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-emerald-950">
                      مستندات جوجل Google Docs برابط تعديل مفتوح للجميع
                    </h4>
                    <p className="text-xs text-emerald-800">
                      تصدير مباشر لملف Word سحابي يمكنك تعديله فورياً من الهاتف المحمول
                    </p>
                  </div>
                </div>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  بمجرد الضغط على زر <strong>«فتح في مستندات جوجل»</strong> داخل شاشة العرض أو السلة، يتم إنشاء مستند رسمي متكامل به كافة الجداول والأسعار والشروط، مع ضبط إعدادات المشاركة تلقائياً لتكون <strong>«أي شخص لديه الرابط يمكنه التعديل (Editor)»</strong>.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-stone-900 font-bold text-xs">
                    <Smartphone className="w-4 h-4 text-amber-600" />
                    <span>التعديل من الهاتف المحمول:</span>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    عند إرسال الرابط لك أو لمهندسي المكتب عبر الواتساب، يمكنك الضغط عليه وفتحه مباشرة في تطبيق Google Docs على الجوال أو في متصفح الهاتف لتعديل الأسعار والملاحظات فوراً وأنت في الموقع.
                  </p>
                </div>

                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-stone-900 font-bold text-xs">
                    <Download className="w-4 h-4 text-blue-600" />
                    <span>تحميل بصيغة Word (.docx):</span>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    يتوفر أيضاً زر مباشر لتنزيل ملف مايكروسوفت وورد رسمي منسق بالكامل بجداول وبيانات العرض، لفتحه بأي برنامج Word أو إرساله للعميل للتعديل المكتبي.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EXPORT ZIP / SOURCE CODE */}
          {activeTab === 'code' && (
            <div className="space-y-5">
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <FolderArchive className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-emerald-950">
                      تصدير الكود البرمجي الكامل (ZIP / GitHub)
                    </h4>
                    <p className="text-[11px] text-emerald-700">
                      المشروع مبني بـ React 19 + TypeScript + Vite + Tailwind CSS وجاهز للتشغيل على أي سيرفر
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs text-stone-700 bg-white p-4 rounded-xl border border-emerald-100">
                  <div className="font-bold text-stone-900 mb-1">
                    خطوات استخراج المشروع كملف ZIP من AI Studio:
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-800 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      من أعلى شاشة AI Studio، اضغط على زر القائمة أو الإعدادات <strong>(Settings / Menu)</strong> في الزاوية العلوية.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-800 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      اختر <strong>«Export to ZIP»</strong> لتنزيل مجلد المشروع كاملاً بضغطة زر، أو <strong>«Export to GitHub»</strong> لربطه بمستودعك.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-800 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <span>
                      لتشغيله محلياً على حاسوبك: افتح المجلد في Terminal واكتب الأمرين:
                    </span>
                  </div>
                  <div className="bg-stone-900 text-emerald-400 p-2.5 rounded-lg font-mono text-[11px] flex items-center justify-between">
                    <span>npm install && npm run dev</span>
                    <Terminal className="w-4 h-4 text-stone-400" />
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-800 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      4
                    </span>
                    <span>
                      لرفعه على دومين مخصص باسم شركتك (مثل <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-800 font-mono">luminous-vision.com</code>): يمكنك رفعه مجاناً وبنقرة واحدة عبر منصات مثل <strong>Vercel</strong> أو <strong>Netlify</strong> أو <strong>Firebase Hosting</strong> بمجرد ربط الكود.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-stone-100 p-4 border-t border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>متوافق مع جميع الأنظمة وشاشات العرض</span>
          </div>
          <button
            onClick={onClose}
            className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
