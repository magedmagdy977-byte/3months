import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  KeyRound,
  Check,
  AlertCircle,
  LogOut,
  User,
  Clock,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  Users,
  UserPlus,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { UserSession } from '../../types';
import {
  verifyOfficePasscode,
  updateOfficePasscode,
  saveSession,
  clearSession,
  getAuthorizedUsersList,
  addAuthorizedUser,
  removeAuthorizedUser,
  isPasscodeCustomized,
  initPasscodeListener,
  isUserPrimaryAdmin,
} from '../../lib/security';

interface AdminSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: UserSession;
  onSessionUpdated: (session: UserSession) => void;
  onLogout: () => void;
  onResetDraftSequence?: () => void;
}

export const AdminSecurityModal: React.FC<AdminSecurityModalProps> = ({
  isOpen,
  onClose,
  session,
  onSessionUpdated,
  onLogout,
  onResetDraftSequence,
}) => {
  const [activeTab, setActiveTab] = useState<'passcode' | 'users'>('passcode');

  // Passcode change states
  const [currentPin, setCurrentPin] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [showPins, setShowPins] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Authorized Users states
  const [authorizedUsers, setAuthorizedUsers] = useState<string[]>(() => getAuthorizedUsersList());
  const [newUserName, setNewUserName] = useState<string>('');
  const [userMsg, setUserMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit Engineer Name state
  const [newName, setNewName] = useState<string>(session.engineerName);
  const [nameSaved, setNameSaved] = useState<boolean>(false);

  useEffect(() => {
    const unsub = initPasscodeListener((data) => {
      if (data.authorizedUsers && data.authorizedUsers.length > 0) {
        setAuthorizedUsers(data.authorizedUsers);
      }
    });
    return () => unsub && unsub();
  }, []);

  if (!isOpen) return null;

  const isSuperAdmin = isUserPrimaryAdmin(session?.engineerName);

  if (!isSuperAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs">
        <div dir="rtl" className="bg-white rounded-3xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl border border-stone-200 animate-in fade-in">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-stone-900">صلاحية الوصول مقيدة</h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            لوحة إدارة الأمان والتحكم بالمهندسين وتغيير الرمز السري مخصصة حصرياً للإدارة (<strong>م.ماجد أو م.نور</strong>). ليس لديك صلاحية الدخول لهذه اللوحة.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-stone-900 hover:bg-stone-800 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    );
  }

  const handleUpdateName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const updated: UserSession = {
      ...session,
      engineerName: newName.trim(),
    };
    saveSession(updated);
    onSessionUpdated(updated);
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2500);
  };

  const handlePasscodeChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (!verifyOfficePasscode(currentPin.trim())) {
      setStatusMsg({ type: 'error', text: 'رمز المرور الحالي غير صحيح.' });
      return;
    }

    if (newPin.trim().length < 4) {
      setStatusMsg({ type: 'error', text: 'يجب أن يتكون رمز المرور الجديد من 4 خانات على الأقل.' });
      return;
    }

    if (newPin.trim() !== confirmPin.trim()) {
      setStatusMsg({ type: 'error', text: 'الرمز الجديد وتأكيد الرمز غير متطابقين.' });
      return;
    }

    setIsUpdating(true);
    try {
      await updateOfficePasscode(newPin.trim(), session.engineerName);
      setStatusMsg({
        type: 'success',
        text: 'تم تحديث رمز المرور بنجاح! تم إبطال الرمز القديم تماماً ومزامنته سحابياً لجميع الأجهزة.',
      });
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err?.message || 'حدث خطأ أثناء حفظ الرمز الجديد.',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserMsg(null);
    const clean = newUserName.trim();
    if (!clean) return;

    try {
      const updated = await addAuthorizedUser(clean, session.engineerName);
      setAuthorizedUsers(updated);
      setNewUserName('');
      setUserMsg({ type: 'success', text: `تمت إضافة المهندس (${clean}) بنجاح للمصرح لهم.` });
    } catch (err: any) {
      setUserMsg({ type: 'error', text: err?.message || 'تعذر إضافة المستخدم.' });
    }
  };

  const handleRemoveUser = async (userName: string) => {
    setUserMsg(null);
    if (!window.confirm(`هل أنت متأكد من إلغاء تصريح الدخول لـ (${userName})؟ لن يتمكن من فتح الأداة بعدها.`)) {
      return;
    }

    try {
      const updated = await removeAuthorizedUser(userName, session.engineerName);
      setAuthorizedUsers(updated);
      setUserMsg({ type: 'success', text: `تم إلغاء تصريح (${userName}) بنجاح.` });
    } catch (err: any) {
      setUserMsg({ type: 'error', text: err?.message || 'تعذر حذف المستخدم.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-950/80 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div
        dir="rtl"
        className="relative bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 my-8 text-stone-900"
      >
        {/* Header */}
        <div className="bg-stone-900 text-white p-5 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-md">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">لوحة إدارة الأمان والتحكم</h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  {session.engineerName}
                </span>
              </div>
              <p className="text-xs text-stone-400">
                التحكم بالرمز السري وقائمة المهندسين المعتمدين لمكتب الرؤية المضيئة
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 bg-stone-50 px-6 pt-3 gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('passcode')}
            className={`pb-2.5 text-xs font-black flex items-center gap-2 border-b-2 transition ${
              activeTab === 'passcode'
                ? 'border-amber-500 text-stone-950'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <KeyRound className="w-4 h-4 text-amber-600" />
            <span>تغيير رمز المرور السري</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`pb-2.5 text-xs font-black flex items-center gap-2 border-b-2 transition ${
              activeTab === 'users'
                ? 'border-amber-500 text-stone-950'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Users className="w-4 h-4 text-amber-600" />
            <span>إدارة المهندسين المصرح لهم ({authorizedUsers.length})</span>
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* TAB 1: PASSCODE */}
          {activeTab === 'passcode' && (
            <div className="space-y-5">
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 text-xs text-amber-950">
                <div className="font-bold flex items-center gap-1.5 mb-1 text-amber-900">
                  <Shield className="w-4 h-4 text-amber-600" />
                  <span>حماية كاملة وتحكم فوري:</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-900/90">
                  بمجرد تعيين رمز مرور جديد، يتم <strong>إلغاء وإبطال أي رمز قديم فوراً</strong> وتطبيقه سحابياً على كافة أجهزة وكمبيوترات المكتب، ولن يتمكن أي شخص من الدخول إلا بالرمز الجديد.
                </p>
              </div>

              {statusMsg && (
                <div
                  className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                    statusMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {statusMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{statusMsg.text}</span>
                </div>
              )}

              <form onSubmit={handlePasscodeChange} className="space-y-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-stone-700">
                      رمز المرور الحالي للتأكيد:
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPins(!showPins)}
                      className="text-[10px] text-stone-500 hover:text-stone-800 flex items-center gap-1"
                    >
                      {showPins ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showPins ? 'إخفاء' : 'إظهار'}</span>
                    </button>
                  </div>
                  <input
                    type={showPins ? 'text' : 'password'}
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value)}
                    placeholder="أدخل الرمز الحالي للتأكيد..."
                    required
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-stone-900 focus:ring-2 focus:ring-amber-500 outline-hidden tracking-wider"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      رمز المرور الجديد الخاص بك:
                    </label>
                    <input
                      type={showPins ? 'text' : 'password'}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      placeholder="رمز جديد (أرقام أو حروف)..."
                      required
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-stone-900 focus:ring-2 focus:ring-amber-500 outline-hidden tracking-wider"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      تأكيد الرمز الجديد:
                    </label>
                    <input
                      type={showPins ? 'text' : 'password'}
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value)}
                      placeholder="أعد كتابة الرمز الجديد..."
                      required
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-stone-900 focus:ring-2 focus:ring-amber-500 outline-hidden tracking-wider"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isUpdating}
                  className="w-full bg-stone-900 hover:bg-stone-800 text-white font-black py-3 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>{isUpdating ? 'جاري الحفظ والمزامنة السحابية...' : 'حفظ الرمز السري الجديد فوراً'}</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: USERS CONTROL */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 text-xs text-stone-700">
                <div className="font-bold flex items-center gap-1.5 mb-1 text-stone-900">
                  <Users className="w-4 h-4 text-amber-600" />
                  <span>التحكم بأسماء المستخدمين المصرح لهم:</span>
                </div>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  فقط الأسماء الموجودة في هذه القائمة هي التي يسمح لها النظام بالدخول. أي شخص خارجي يحاول كتابة أي اسم عشوائي سيتم منعه ورفضه تلقائياً.
                </p>
              </div>

              {userMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    userMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {userMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{userMsg.text}</span>
                </div>
              )}

              {/* Add User Input */}
              <form onSubmit={handleAddUser} className="flex items-center gap-2">
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="أدخل اسم مهندس جديد للتصريح له (مثال: م. فهد)..."
                  className="grow bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>إضافة</span>
                </button>
              </form>

              {/* Authorized Users List */}
              <div className="space-y-2 border border-stone-200 rounded-2xl p-3 bg-stone-50/50">
                <div className="text-[11px] font-bold text-stone-500 px-1">
                  قائمة المهندسين المصرح لهم حالياً:
                </div>
                {authorizedUsers.map((userName) => {
                  const isPrimaryAdmin = isUserPrimaryAdmin(userName);
                  return (
                    <div
                      key={userName}
                      className="bg-white border border-stone-200/90 rounded-xl p-2.5 flex items-center justify-between text-xs font-bold shadow-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${
                            isPrimaryAdmin
                              ? 'bg-amber-500/20 text-amber-700 font-black border border-amber-500/30'
                              : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="text-stone-900">{userName}</span>
                          {isPrimaryAdmin && (
                            <span className="text-[10px] bg-amber-500/15 text-amber-800 px-2 py-0.2 rounded-full font-bold mr-2">
                              مسؤول النظام (أدمن)
                            </span>
                          )}
                        </div>
                      </div>

                      {!isPrimaryAdmin && (
                        <button
                          type="button"
                          onClick={() => handleRemoveUser(userName)}
                          className="text-stone-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition"
                          title="إلغاء تصريح هذا المهندس"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Engineer Name Rename for this Session */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-stone-800 flex items-center gap-1.5">
                <User className="w-4 h-4 text-amber-600" />
                <span>الاسم المسجل في هذه الجلسة:</span>
              </span>
              <span className="text-[10px] text-stone-500 flex items-center gap-1">
                <Clock className="w-3 h-3 text-stone-400" />
                <span>دخول: {session.loginTime}</span>
              </span>
            </div>

            <form onSubmit={handleUpdateName} className="flex items-center gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="اسم المهندس في هذه الجلسة..."
                className="grow bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 focus:ring-2 focus:ring-amber-500 outline-hidden"
              />
              <button
                type="submit"
                className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold px-3 py-2 rounded-xl transition shrink-0"
              >
                {nameSaved ? 'تم الحفظ ✓' : 'تحديث الاسم'}
              </button>
            </form>
          </div>

          {/* Explicit Draft Counter Reset (Without touching past quotes or client data) */}
          {onResetDraftSequence && (
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-black text-amber-950">
                  إعادة ضبط عداد مسودة عروض الأسعار
                </div>
                <div className="text-[11px] text-amber-800/80 mt-0.5">
                  إعادة ترقيم العرض المفتوح إلى (0) دون المساس بأي عروض قديمة في الأرشيف
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('هل تريد بالتأكيد إعادة ضبط رقم مسودة العرض الحالية إلى (0)؟ لن يتم التأثير على العروض القديمة في الأرشيف.')) {
                    onResetDraftSequence();
                  }
                }}
                className="bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black px-3.5 py-2 rounded-xl transition shrink-0 cursor-pointer shadow-xs"
              >
                إعادة الضبط إلى 0
              </button>
            </div>
          )}

          {/* Logout / Lock Button */}
          <div className="pt-2 flex items-center justify-between border-t border-stone-200">
            <span className="text-[11px] text-stone-500">
              قفل الأداة على هذا المتصفح فوراً:
            </span>

            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>تسجيل الخروج وقفل الأداة</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
