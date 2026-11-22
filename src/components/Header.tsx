import React from 'react';
import {
  FileText,
  History,
  Printer,
  HelpCircle,
  Smartphone,
  Cloud,
  Shield,
  Lock,
  KeyRound,
  User,
  LogOut,
  Sparkles,
  PlusCircle,
  LayoutTemplate,
  CheckCircle2,
  FileSignature,
} from 'lucide-react';
import { formatSAR } from '../utils/formatters';
import { LuminousLogo } from './LuminousLogo';
import { UserSession } from '../types';
import { isUserPrimaryAdmin } from '../lib/security';

interface HeaderProps {
  cartItemCount: number;
  cartTotal: number;
  savedCount?: number;
  isCloudConnected?: boolean;
  session?: UserSession | null;
  onOpenSecurity?: () => void;
  onLogout?: () => void;
  onOpenCart: () => void;
  onOpenHistory: () => void;
  onOpenPricingGuide: () => void;
  onOpenMasterTemplate: () => void;
  onPrintDirect: () => void;
  onOpenExport: () => void;
  onOpenAiAssistant?: () => void;
  onNewQuotation?: () => void;
  isSimplifiedMode?: boolean;
  onToggleSimplifiedMode?: () => void;
  isContractAttached?: boolean;
  onOpenContractEditor?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  cartItemCount,
  cartTotal,
  savedCount = 0,
  isCloudConnected = true,
  session,
  onOpenSecurity,
  onLogout,
  onOpenCart,
  onOpenHistory,
  onOpenPricingGuide,
  onOpenMasterTemplate,
  onPrintDirect,
  onOpenExport,
  onOpenAiAssistant,
  onNewQuotation,
  isSimplifiedMode = false,
  onToggleSimplifiedMode,
  isContractAttached = false,
  onOpenContractEditor,
}) => {
  const isSuperAdmin = session && isUserPrimaryAdmin(session.engineerName);
  return (
    <header className="bg-stone-900 text-stone-100 border-b border-stone-800 sticky top-0 z-30 shadow-md no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 border border-stone-700/60 shadow-xs">
              <LuminousLogo variant="icon" className="h-8 w-auto" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-white">
                  تسعير الرؤية المضيئة
                </h1>
                <span className="text-[10px] font-bold bg-[#e37725]/20 text-[#e37725] border border-[#e37725]/40 px-2 py-0.5 rounded-full font-mono">
                  LUMINOUS VISION
                </span>
              </div>
              <p className="text-xs text-stone-400">
                مجموعة شركات الرؤية المضيئة للاستشارات الهندسية • التسعير المعتمد
              </p>
            </div>
          </div>

          {/* Mobile Actions: New Quote & Cart */}
          <div className="sm:hidden flex items-center gap-1.5">
            {onNewQuotation && (
              <button
                type="button"
                onClick={onNewQuotation}
                className="flex items-center gap-0.5 bg-stone-800 text-amber-400 border border-stone-700 px-1.5 py-1 rounded-md text-[9.5px] font-bold shadow hover:bg-stone-700 active:scale-90 transition cursor-pointer"
                title="تفريغ فوري وبدء عرض جديد فارغ"
              >
                <PlusCircle className="w-2.5 h-2.5 text-amber-400" />
                <span>جديد</span>
              </button>
            )}

            {/* Mobile Cart Trigger */}
            <button
              type="button"
              onClick={onOpenCart}
              className="flex items-center gap-2 bg-amber-500 text-stone-950 px-3 py-1.5 rounded-lg text-xs font-bold shadow hover:bg-amber-400 active:scale-95 transition cursor-pointer"
              aria-label="عرض السعر"
            >
              <FileText className="w-4 h-4" />
              <span>عرض السعر ({cartItemCount})</span>
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          {/* Smart Contract Attachment & Editor Trigger */}
          {onOpenContractEditor && (
            <button
              type="button"
              onClick={onOpenContractEditor}
              className={`inline-flex items-center gap-1.5 text-xs font-black px-3 py-2 rounded-xl transition cursor-pointer shrink-0 whitespace-nowrap ${
                isContractAttached
                  ? 'bg-[#3a3c3e] text-[#f3ebd8] border-2 border-[#a6926b] shadow-md hover:bg-[#494c4f]'
                  : 'bg-stone-800 hover:bg-stone-700 text-[#e6d7b9] border border-[#a6926b]/50 hover:border-[#a6926b]'
              }`}
              title={
                isContractAttached
                  ? 'العقد الذكي مرفق حالياً مع عرض السعر — اضغط لتعديل بنود العقد أو تبديل القالب'
                  : 'إرفاق وتعديل العقد الذكي مع عرض السعر لجميع الأقسام والخدمات'
              }
            >
              {isContractAttached ? (
                <CheckCircle2 className="w-4 h-4 text-[#d4c3a3] shrink-0" />
              ) : (
                <FileSignature className="w-4 h-4 text-[#d4c3a3] shrink-0" />
              )}
              <span>العقد الذكي</span>
              {isContractAttached && (
                <span className="text-[10px] font-black bg-[#a6926b] text-white px-1.5 py-0.5 rounded-md">
                  مرفق
                </span>
              )}
            </button>
          )}

          {/* Simplified Pricing Output Mode Toggle Button */}
          {onToggleSimplifiedMode && (
            <button
              type="button"
              onClick={onToggleSimplifiedMode}
              className={`inline-flex items-center gap-1.5 text-xs font-black px-3 py-2 rounded-xl transition cursor-pointer shrink-0 whitespace-nowrap ${
                isSimplifiedMode
                  ? 'bg-[#2C3E4C] text-white border-2 border-[#F0A429] shadow-md hover:bg-[#34495A]'
                  : 'bg-stone-800 hover:bg-stone-700 text-[#F5B43C] border border-[#F0A429]/50 hover:border-[#F0A429]'
              }`}
              title={
                isSimplifiedMode
                  ? 'برنامج الاصالة المبسط مفعّل حالياً — اضغط للعودة إلى النموذج الموحد الرسمي'
                  : 'تفعيل برنامج الاصالة المبسط لتحويل إخراج عروض الأسعار إلى التصميم البصري المبسط'
              }
            >
              {isSimplifiedMode ? (
                <CheckCircle2 className="w-4 h-4 text-[#F0A429] shrink-0" />
              ) : (
                <LayoutTemplate className="w-4 h-4 text-[#F0A429] shrink-0" />
              )}
              <span>برنامج الاصالة المبسط</span>
              {isSimplifiedMode && (
                <span className="text-[10px] font-black bg-[#F0A429] text-[#1D2B36] px-1.5 py-0.5 rounded-md">
                  مفعّل
                </span>
              )}
            </button>
          )}

          {session && (
            isSuperAdmin ? (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={onOpenSecurity}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-950/70 hover:bg-amber-900 border border-amber-500/60 px-3 py-2 rounded-lg transition shadow-xs cursor-pointer"
                  title={`لوحة تحكم الإدارة (${session.engineerName}): تغيير الرمز السري وإدارة المهندسين`}
                >
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>{session.engineerName} (الإدارة)</span>
                  <span className="hidden lg:inline text-[10px] text-amber-300 bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5 rounded-sm">
                    لوحة التحكم والأمان ⚙️
                  </span>
                </button>
                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="inline-flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-950/70 border border-red-500/30 px-2 py-2 rounded-lg transition cursor-pointer"
                    title="تسجيل الخروج"
                  >
                    <LogOut className="w-3 h-3" />
                    <span className="hidden sm:inline">خروج</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 text-xs font-bold text-stone-200 bg-stone-800/90 border border-stone-700 px-3 py-2 rounded-lg shrink-0">
                <User className="w-3.5 h-3.5 text-stone-400" />
                <span>{session.engineerName}</span>
                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="inline-flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-950/70 border border-red-500/30 px-1.5 py-0.5 rounded-sm transition cursor-pointer"
                    title="تسجيل الخروج"
                  >
                    <LogOut className="w-2.5 h-2.5" />
                    <span>خروج</span>
                  </button>
                )}
              </div>
            )
          )}

          {onOpenAiAssistant && (
            <button
              type="button"
              onClick={onOpenAiAssistant}
              className="inline-flex items-center gap-1.5 text-xs font-black text-amber-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 px-3 py-2 rounded-xl transition shadow-md border border-amber-300 cursor-pointer shrink-0"
              title="مساعد الذكاء الاصطناعي (Gemini): قراءة الصك العقاري وتعبئة البيانات تلقائياً"
            >
              <Sparkles className="w-4 h-4 text-amber-950" />
              <span>قارئ الصك (AI)</span>
              <span className="text-[10px] bg-stone-950/20 text-stone-950 font-black px-1.5 py-0.2 rounded-full hidden sm:inline">
                جديد ✨
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenExport}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-[#433c71] to-[#e37725] hover:opacity-90 px-3 py-2 rounded-lg transition shadow-xs"
            title="فتح على الموبايل أو تثبيت التطبيق واستخراج الكود"
          >
            <Smartphone className="w-4 h-4" />
            <span className="hidden md:inline">فتح بالجوال / تثبيت</span>
            <span className="md:hidden">الجوال والكمبيوتر</span>
          </button>

          <button
            type="button"
            onClick={onOpenMasterTemplate}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-300 hover:text-amber-200 bg-amber-950/40 hover:bg-amber-950/70 border border-amber-600/40 px-3 py-2 rounded-lg transition"
            title="مرجع نموذج عرض السعر الموحد (Master Template)"
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">النموذج الموحد (Template)</span>
            <span className="md:hidden">الموحد</span>
          </button>

          <button
            type="button"
            onClick={onOpenPricingGuide}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700/80 border border-stone-700 px-3 py-2 rounded-lg transition"
            title="دليل شرائح وتسعير الرؤية المضيئة"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">دليل الشرائح</span>
          </button>

          <button
            type="button"
            onClick={onOpenHistory}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700/80 border border-stone-700 px-3 py-2 rounded-lg transition relative"
            title="أرشيف عروض الأسعار السحابي الموحد لجميع المهندسين"
          >
            <Cloud className="w-4 h-4 text-amber-400" />
            <span>الأرشيف السحابي</span>
            {savedCount > 0 && (
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {savedCount}
              </span>
            )}
          </button>

          {cartItemCount > 0 && (
            <button
              type="button"
              onClick={onPrintDirect}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700/80 border border-stone-700 px-3 py-2 rounded-lg transition"
              title="طباعة عرض السعر الحالي"
            >
              <Printer className="w-4 h-4 text-stone-400" />
              <span className="hidden md:inline">طباعة</span>
            </button>
          )}

          {/* Start New Empty Quotation Trigger - Mini discrete button */}
          {onNewQuotation && (
            <button
              type="button"
              onClick={onNewQuotation}
              className="hidden sm:inline-flex items-center gap-1 bg-stone-850 hover:bg-stone-750 active:scale-90 text-amber-400 hover:text-amber-300 border border-stone-700/80 hover:border-amber-500/50 px-2.5 py-1.5 rounded-lg text-[10.5px] font-bold shadow-xs transition cursor-pointer shrink-0"
              title="تفريغ فوري ومسح العرض وتجهيز عرض جديد فارغ بنقرة واحدة"
            >
              <PlusCircle className="w-3 h-3 text-amber-400" />
              <span>جديد فارغ</span>
            </button>
          )}

          {/* Main Cart / Proposal summary badge button */}
          <button
            type="button"
            onClick={onOpenCart}
            className="hidden sm:inline-flex items-center gap-3 bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 px-4 py-2 rounded-xl text-xs font-bold shadow-md transition"
          >
            <div className="flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              <span>عرض السعر</span>
              <span className="bg-stone-950 text-amber-300 text-[11px] px-1.5 py-0.2 rounded-full font-black">
                {cartItemCount}
              </span>
            </div>
            {cartTotal > 0 && (
              <span className="border-r border-stone-950/20 pr-2 font-black text-[13px]">
                {formatSAR(cartTotal)}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
