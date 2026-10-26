import React, { useState, useEffect } from 'react';
import {
  Lock,
  ShieldCheck,
  User,
  KeyRound,
  Eye,
  EyeOff,
  Building2,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { LuminousLogo } from '../LuminousLogo';
import { UserSession } from '../../types';
import {
  verifyUserLogin,
  saveSession,
  getAuthorizedUsersList,
  initPasscodeListener,
  isUserPrimaryAdmin,
} from '../../lib/security';

interface PrivatePortalLoginProps {
  onLoginSuccess: (session: UserSession) => void;
}

export const PrivatePortalLogin: React.FC<PrivatePortalLoginProps> = ({ onLoginSuccess }) => {
  const [authorizedStaff, setAuthorizedStaff] = useState<string[]>(() => getAuthorizedUsersList());
  const [engineerName, setEngineerName] = useState<string>('م.ماجد');
  const [passcode, setPasscode] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberDevice, setRememberDevice] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const unsub = initPasscodeListener((data) => {
      if (data.authorizedUsers && data.authorizedUsers.length > 0) {
        setAuthorizedStaff(data.authorizedUsers);
      }
    });
    return () => unsub && unsub();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = engineerName.trim();
    const trimmedCode = passcode.trim();

    if (!trimmedName) {
      setErrorMsg('يرجى تحديد أو إدخال اسم المهندس أو المستخدم.');
      return;
    }

    if (!trimmedCode) {
      setErrorMsg('يرجى إدخال رمز المرور السري للمكتب.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const result = verifyUserLogin(trimmedName, trimmedCode);

      if (result.success) {
        const session: UserSession = {
          engineerName: trimmedName,
          role:
            trimmedName.includes('مدير') ||
            trimmedName.includes('الإدارة') ||
            isUserPrimaryAdmin(trimmedName)
              ? 'admin'
              : 'engineer',
          loginTime: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
        };

        if (rememberDevice) {
          saveSession(session);
        }

        onLoginSuccess(session);
      } else {
        setErrorMsg(result.message || 'بيانات الدخول غير صحيحة.');
        setIsSubmitting(false);
      }
    }, 350);
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-[#1e1b2e] text-stone-100 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans select-none"
    >
      {/* Decorative luxury ambient lights */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#e37725]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#433c71]/25 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        {/* Security Portal Card */}
        <div className="bg-stone-900/90 border border-stone-800 rounded-3xl shadow-2xl backdrop-blur-xl overflow-hidden">
          {/* Top Brand Banner */}
          <div className="p-6 sm:p-8 text-center border-b border-stone-800/80 bg-gradient-to-b from-stone-850/80 to-stone-900/90 relative">
            <div className="w-20 h-20 mx-auto mb-4 bg-white/95 rounded-2xl p-2.5 shadow-xl border border-stone-700/60 flex items-center justify-center">
              <LuminousLogo variant="icon" className="w-full h-full" />
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>بوابة الاستخدام الداخلي المعتمد</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              مجموعة شركات الرؤية المضيئة
            </h1>
            <p className="text-xs text-stone-400 mt-1 font-medium">
              حاسبة ومولد عروض الأسعار الرسمية والعقود الموحدة
            </p>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-800/60 text-red-200 text-xs flex items-center gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Engineer Selection / Name */}
            <div>
              <label className="block text-xs font-bold text-stone-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-500" />
                  <span>اسم المهندس / المستخدم:</span>
                </span>
                <span className="text-[10px] text-stone-500 font-normal">
                  سيوثق في عروض الأسعار الصادرة
                </span>
              </label>

              <input
                type="text"
                value={engineerName}
                onChange={(e) => setEngineerName(e.target.value)}
                placeholder="اختر اسمك من القائمة أدناه..."
                required
                className="w-full bg-stone-950/80 border border-stone-700 rounded-xl px-4 py-2.5 text-sm font-bold text-white placeholder-stone-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
              />

              {/* Quick Staff Selection Chips */}
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {authorizedStaff.map((member) => (
                  <button
                    key={member}
                    type="button"
                    onClick={() => setEngineerName(member)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-bold transition border cursor-pointer ${
                      engineerName === member
                        ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-md font-black scale-102'
                        : 'bg-stone-850 hover:bg-stone-800 text-stone-200 border-stone-700/80'
                    }`}
                  >
                    {member}
                  </button>
                ))}
              </div>
            </div>

            {/* Office Passcode Input */}
            <div>
              <label className="block text-xs font-bold text-stone-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                  <span>رمز المرور السري للمكتب (PIN / Password):</span>
                </span>
              </label>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="أدخل رمز المرور السري للمكتب..."
                  autoFocus
                  required
                  className="w-full bg-stone-950/80 border border-stone-700 rounded-xl px-4 py-2.5 text-sm font-bold text-white placeholder-stone-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition pl-11 tracking-wider"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-2.5 text-stone-400 hover:text-stone-200 transition p-0.5"
                  title={showPassword ? 'إخفاء الرمز' : 'إظهار الرمز'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember device checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-stone-300">
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  className="w-4 h-4 text-amber-500 bg-stone-950 border-stone-700 rounded-sm focus:ring-amber-500 focus:ring-offset-stone-900"
                />
                <span>تذكر هذا الجهاز (البقاء مسجلاً)</span>
              </label>

              <span className="text-[11px] text-stone-500">
                يمكن تغيير الرمز لاحقاً من لوحة الإدارة
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-[#e37725] text-stone-950 font-black py-3 px-4 rounded-xl text-sm shadow-lg hover:brightness-105 active:scale-98 transition flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>{isSubmitting ? 'جاري التحقق من الصلاحيات...' : 'دخول المنصة الهندسية'}</span>
            </button>
          </form>

          {/* Footer security notice */}
          <div className="px-6 py-4 bg-stone-950/70 border-t border-stone-850 text-center text-[11px] text-stone-500 flex items-center justify-center gap-2">
            <Lock className="w-3 h-3 text-stone-400" />
            <span>نظام محمي ومشفر • مخصص حصرياً لمنسوبي مجموعة شركات الرؤية المضيئة</span>
          </div>
        </div>
      </div>
    </div>
  );
};
