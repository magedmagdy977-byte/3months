import React, { useState } from 'react';
import {
  X,
  FileEdit,
  ExternalLink,
  Copy,
  Check,
  Download,
  Share2,
  Globe,
  Smartphone,
  AlertCircle,
  Loader2,
  Sparkles,
  Mail,
  HelpCircle,
  UploadCloud,
} from 'lucide-react';
import { downloadWordDocument } from '../../lib/wordExport';
import {
  openGoogleDocsInUserAccount,
  copyQuotationToClipboardForGoogleDocs,
} from '../../lib/googleDocsExport';
import { QuotationItem, ClientInfo } from '../../types';

interface GoogleDocExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  error: string | null;
  docUrl: string | null;
  docTitle: string | null;
  clientInfo: ClientInfo;
  items: QuotationItem[];
  onRetry: () => void;
}

export const GoogleDocExportModal: React.FC<GoogleDocExportModalProps> = ({
  isOpen,
  onClose,
  isLoading,
  error,
  docUrl,
  docTitle,
  clientInfo,
  items,
  onRetry,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedContent, setCopiedContent] = useState(false);
  const [hasOpenedGmailDoc, setHasOpenedGmailDoc] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (!docUrl) return;
    navigator.clipboard.writeText(docUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleOpenInUserGmail = async () => {
    await openGoogleDocsInUserAccount(clientInfo, items);
    setHasOpenedGmailDoc(true);
    setCopiedContent(true);
    setTimeout(() => setCopiedContent(false), 4000);
  };

  const handleCopyContentOnly = async () => {
    await copyQuotationToClipboardForGoogleDocs(clientInfo, items);
    setCopiedContent(true);
    setTimeout(() => setCopiedContent(false), 3000);
  };

  const handleDownloadWord = () => {
    downloadWordDocument(clientInfo, items);
  };

  const handleOpenDrive = () => {
    window.open('https://drive.google.com', '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/75 backdrop-blur-xs no-print animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden text-right text-stone-900 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2d2a4a] to-[#433c71] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300">
              <FileEdit className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black">فتح وتعديل العرض في مستندات جوجل</h3>
                <span className="text-[10px] font-bold bg-amber-400 text-stone-950 px-2 py-0.5 rounded-full">
                  Google Docs
                </span>
              </div>
              <p className="text-xs text-stone-300 mt-0.5">
                تعديل عرض السعر المعتمد مباشرة عبر حساب Gmail الخاص بك من الجوال أو الكمبيوتر
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5">
          {/* METHOD 1 (PRIMARY): Open in User's own Gmail directly (docs.new) */}
          <div className="bg-gradient-to-br from-indigo-50/80 via-white to-amber-50/50 border-2 border-[#433c71]/30 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#433c71] text-white flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-stone-900">
                    الفتح المباشر في حسابك الخاص (Google Docs)
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    يفتح مستنداً جديداً في حساب Gmail الخاص بك فوراً بدون أية نوافذ مصادقة أو أخطاء
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full shrink-0">
                مضمون 100%
              </span>
            </div>

            <p className="text-xs text-stone-700 leading-relaxed">
              بنقرة واحدة سيتم <strong>نسخ كافة جداول وبيانات عرض السعر المنسقة</strong> وفتح مستند جديد في حسابك على Google Docs. كل ما عليك فعله داخل المستند هو الضغط على <strong>«لصق / Paste»</strong> لتظهر الوثيقة كاملة طبق الأصل وجاهزة للتعديل!
            </p>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={handleOpenInUserGmail}
                className="flex-1 bg-[#433c71] hover:bg-[#342f58] active:scale-[0.98] text-white py-3 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition"
              >
                <ExternalLink className="w-4 h-4 text-amber-400 shrink-0" />
                <span>فتح مستند جديد في حسابك بالجيميل (Google Docs)</span>
              </button>

              <button
                type="button"
                onClick={handleCopyContentOnly}
                className="bg-stone-100 hover:bg-stone-200 active:scale-[0.98] text-stone-800 py-3 px-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shrink-0"
                title="نسخ محتوى العرض والجداول المنسقة للحافظة"
              >
                {copiedContent ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-stone-500" />}
                <span>{copiedContent ? 'تم النسخ!' : 'نسخ المحتوى'}</span>
              </button>
            </div>

            {hasOpenedGmailDoc && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs flex items-center gap-2 animate-in fade-in duration-200">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>تم فتح المستند ونسخ العرض!</strong> اضغط <strong>(لصق / Paste)</strong> أو <strong>Ctrl + V</strong> داخل المستند ليظهر عرض السعر كاملاً في حسابك.
                </span>
              </div>
            )}
          </div>

          {/* METHOD 2: Download Word (.docx) and Open in Google Drive */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Download className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-black text-stone-900">
                  تحميل ملف Word (.docx) المكتمل طبق الأصل
                </h4>
                <p className="text-[11px] text-stone-500">
                  ملف رسمي جاهز يمكنك تعديله في برنامج Word أو رفعه على Google Drive
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleDownloadWord}
                className="flex-1 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition"
              >
                <Download className="w-4 h-4 text-white" />
                <span>تحميل ملف Word (.docx) للجهاز أو الجوال</span>
              </button>

              <button
                type="button"
                onClick={handleOpenDrive}
                className="bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
                title="فتح Google Drive لرفع وتعديل ملف الوورد"
              >
                <UploadCloud className="w-4 h-4 text-blue-600" />
                <span>فتح Google Drive</span>
              </button>
            </div>
          </div>

          {/* METHOD 3: Cloud Shared Link (Google Cloud API) */}
          {docUrl && !isLoading && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl space-y-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-700" />
                <h4 className="text-xs font-black text-emerald-950">
                  تم إنشاء رابط سحابي مفتوح للتعديل للجميع:
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={docUrl}
                  className="flex-1 bg-white border border-emerald-300 rounded-xl px-3 py-2 text-xs text-stone-800 font-mono select-all focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                    copiedLink
                      ? 'bg-emerald-600 text-white'
                      : 'bg-stone-800 hover:bg-stone-700 text-white'
                  }`}
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'تم النسخ!' : 'نسخ الرابط'}</span>
                </button>
              </div>

              <a
                href={docUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <ExternalLink className="w-4 h-4" />
                <span>فتح الرابط السحابي الآن</span>
              </a>
            </div>
          )}

          {/* Loading status for Cloud API */}
          {isLoading && (
            <div className="bg-stone-50 border border-stone-200 p-4 rounded-2xl flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-[#433c71] animate-spin shrink-0" />
              <div className="text-xs text-stone-600">
                جاري محاولة إنشاء الرابط السحابي التلقائي... يمكنك في هذه الأثناء استخدام خيار «الفتح المباشر في حسابك» أعلاه.
              </div>
            </div>
          )}

          {/* Cloud API error info if user tried it */}
          {error && !isLoading && !docUrl && (
            <div className="bg-amber-50/70 border border-amber-200 text-amber-900 p-3 rounded-xl text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold">تنبيه المصادقة:</span>
                <p className="leading-relaxed">
                  إذا واجهتك أي نافذة مصادقة محظورة من المتصفح، يرجى استخدام <strong>«الفتح المباشر في حسابك الخاص»</strong> أعلاه، فهو يعمل فوراً بدون أي شروط أو أذونات.
                </p>
                <button
                  type="button"
                  onClick={onRetry}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#433c71] hover:underline pt-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>محاولة الربط السحابي التلقائي مجدداً</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-stone-100 p-3 sm:p-4 border-t border-stone-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
            <Smartphone className="w-4 h-4 text-amber-600" />
            <span>متوافق مع الهواتف الذكية (آيفون وأندرويد) وأجهزة الكمبيوتر</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold px-5 py-2 rounded-xl transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
