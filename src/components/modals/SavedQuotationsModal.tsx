import React, { useState } from 'react';
import { SavedQuotation } from '../../types';
import { formatSAR } from '../../utils/formatters';
import {
  X,
  History,
  Trash2,
  ArrowUpRight,
  Calendar,
  User,
  FileText,
  Cloud,
  Search,
  Users,
  CheckCircle2,
  Download,
  AlertTriangle,
  CheckSquare,
  Square,
  Check,
} from 'lucide-react';
import { getAuthorizedUsersList } from '../../lib/security';
import { downloadWordDocument } from '../../lib/wordExport';

interface SavedQuotationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedQuotations: SavedQuotation[];
  onLoadQuotation: (quote: SavedQuotation) => void;
  onDeleteQuotation: (id: string) => void;
  onDeleteMultipleQuotations?: (ids: string[]) => void;
  isCloudConnected?: boolean;
  isAdmin?: boolean;
  onRefresh?: () => void;
}

export const SavedQuotationsModal: React.FC<SavedQuotationsModalProps> = ({
  isOpen,
  onClose,
  savedQuotations,
  onLoadQuotation,
  onDeleteQuotation,
  onDeleteMultipleQuotations,
  isCloudConnected = true,
  isAdmin = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEngineer, setSelectedEngineer] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBatchConfirm, setShowBatchConfirm] = useState<boolean>(false);
  const [singleDeleteTarget, setSingleDeleteTarget] = useState<SavedQuotation | null>(null);

  if (!isOpen) return null;

  // Active authorized engineers list
  const authorizedStaff = getAuthorizedUsersList();

  const filteredQuotes = savedQuotations.filter((q) => {
    if (!q) return false;
    const engineerName = q.preparedBy || q.clientInfo?.preparedBy || 'م.ماجد';

    // Filter by engineer (defaults to 'all' so every engineer sees all quotations)
    if (selectedEngineer !== 'all') {
      if (engineerName !== selectedEngineer && !engineerName.includes(selectedEngineer)) {
        return false;
      }
    }

    // Filter by search term
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (q.quoteNumber && q.quoteNumber.toLowerCase().includes(term)) ||
      (q.clientInfo?.clientName && q.clientInfo.clientName.toLowerCase().includes(term)) ||
      (q.clientInfo?.projectTitle && q.clientInfo.projectTitle.toLowerCase().includes(term)) ||
      (q.clientInfo?.projectCity && q.clientInfo.projectCity.toLowerCase().includes(term)) ||
      engineerName.toLowerCase().includes(term)
    );
  });

  const filteredIds = filteredQuotes.map((q) => q.id);
  const areAllFilteredSelected =
    filteredQuotes.length > 0 && filteredQuotes.every((q) => selectedIds.includes(q.id));

  const handleToggleSelectAll = () => {
    if (areAllFilteredSelected) {
      // Unselect all currently filtered
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      // Select all currently filtered
      setSelectedIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleToggleItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExecuteBatchDelete = () => {
    if (selectedIds.length === 0) return;
    if (onDeleteMultipleQuotations) {
      onDeleteMultipleQuotations(selectedIds);
    } else {
      selectedIds.forEach((id) => onDeleteQuotation(id));
    }
    setSelectedIds([]);
    setShowBatchConfirm(false);
  };

  const handleExecuteSingleDelete = (quote: SavedQuotation) => {
    onDeleteQuotation(quote.id);
    setSelectedIds((prev) => prev.filter((id) => id !== quote.id));
    setSingleDeleteTarget(null);
  };

  // Selected quotes details for confirmation modal preview
  const selectedQuotesPreview = savedQuotations.filter((q) => selectedIds.includes(q.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs no-print animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden text-stone-900 text-right relative">
        {/* Header */}
        <div className="bg-stone-900 text-white p-5 flex items-center justify-between border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black">أرشيف عروض الأسعار وتوثيق المهندسين</h2>
                {isCloudConnected ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <Cloud className="w-3 h-3" />
                    مزامنة سحابية نشطة
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    وضع غير متصل
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                تتبع عروض الأسعار ومعرفة المهندس القائم بإعداد كل عرض ({savedQuotations.length} عرض مسجل)
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

        {/* Permission Information Notice */}
        <div className="px-4 py-2 bg-stone-100/90 border-b border-stone-200 flex flex-wrap items-center justify-between text-[11px] text-stone-600 shrink-0 gap-2">
          <div className="flex items-center gap-1.5">
            {isAdmin ? (
              <>
                <span className="font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md">
                  👑 صلاحية الإدارة (م.ماجد / م.نور / م.اصالة)
                </span>
                <span className="font-medium text-stone-700">
                  يمكنك تحديد عروض أسعار متعددة أو فردية وحذفها دفعة واحدة من الأرشيف.
                </span>
              </>
            ) : (
              <>
                <span className="font-bold text-[#433c71] bg-[#433c71]/10 border border-[#433c71]/20 px-2 py-0.5 rounded-md">
                  👥 أرشيف مفتوح لكافة المهندسين
                </span>
                <span className="font-medium text-stone-700">
                  يمكنك استرجاع وتصفح وطباعة أي عرض سعر • صلاحية الحذف مخصصة حصرياً للإدارة (م.ماجد / م.نور / م.اصالة).
                </span>
              </>
            )}
          </div>
          <span className="text-[10px] text-stone-400 font-bold hidden sm:inline">
            مزامنة سحابية حية ☁️
          </span>
        </div>

        {/* Filter Controls: Search & Engineer Filter */}
        <div className="p-3.5 bg-stone-50 border-b border-stone-200 space-y-2.5 shrink-0">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث برقم العرض، اسم العميل، اسم المهندس، المشروع أو المدينة..."
              className="w-full bg-white border border-stone-300 rounded-xl pr-9 pl-3 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
            />
            <Search className="w-4 h-4 text-stone-400 absolute right-3 top-2.5" />
          </div>

          {/* Filter by Engineer buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-black text-stone-500 shrink-0 ml-1 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-stone-400" />
              <span>تصفية حسب المهندس:</span>
            </span>

            <button
              type="button"
              onClick={() => setSelectedEngineer('all')}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition shrink-0 cursor-pointer ${
                selectedEngineer === 'all'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-white hover:bg-stone-200 text-stone-700 border border-stone-200'
              }`}
            >
              الكل ({savedQuotations.length})
            </button>

            {authorizedStaff.map((staff) => {
              const count = savedQuotations.filter((q) => {
                const en = q.preparedBy || q.clientInfo?.preparedBy || 'م.ماجد';
                return en === staff || en.includes(staff);
              }).length;

              return (
                <button
                  key={staff}
                  type="button"
                  onClick={() => setSelectedEngineer(staff)}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    selectedEngineer === staff
                      ? 'bg-amber-500 text-stone-950 shadow-xs font-black'
                      : 'bg-white hover:bg-stone-200 text-stone-700 border border-stone-200'
                  }`}
                >
                  <span>{staff}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      selectedEngineer === staff
                        ? 'bg-stone-950/20 text-stone-950'
                        : 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Batch Selection Action Bar (Strictly for Eng. Maged / Admin) */}
        {isAdmin && filteredQuotes.length > 0 && (
          <div className="px-4 py-2.5 bg-amber-50/70 border-b border-amber-200/80 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 transition">
            <div className="flex items-center gap-3">
              {/* Select All Checkbox Button */}
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="flex items-center gap-2 font-bold text-stone-850 hover:text-amber-900 transition cursor-pointer select-none"
              >
                <span
                  className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                    areAllFilteredSelected
                      ? 'bg-amber-500 border-amber-600 text-stone-950 shadow-xs'
                      : selectedIds.length > 0
                      ? 'bg-amber-100 border-amber-400 text-amber-700'
                      : 'bg-white border-stone-300 text-transparent'
                  }`}
                >
                  {areAllFilteredSelected ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : selectedIds.length > 0 ? (
                    <div className="w-2.5 h-1.5 bg-amber-600 rounded-xs" />
                  ) : (
                    <Square className="w-4 h-4 text-stone-400" />
                  )}
                </span>
                <span className="text-xs font-black">
                  {areAllFilteredSelected
                    ? 'إلغاء تحديد الكل'
                    : `تحديد الكل في هذه القائمة (${filteredQuotes.length})`}
                </span>
              </button>

              {selectedIds.length > 0 && (
                <span className="bg-amber-200/90 text-amber-950 font-black px-2.5 py-0.5 rounded-full text-[11px] border border-amber-300 shadow-2xs">
                  تم تحديد ({selectedIds.length}) عرض سعر
                </span>
              )}
            </div>

            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="text-stone-600 hover:text-stone-900 text-xs font-bold px-2.5 py-1 rounded-lg hover:bg-stone-200/60 transition cursor-pointer"
                >
                  إلغاء التحديد
                </button>

                <button
                  type="button"
                  onClick={() => setShowBatchConfirm(true)}
                  className="bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                  title="حذف جميع العروض المحددة نهائياً من الأرشيف"
                >
                  <Trash2 className="w-3.5 h-3.5 text-white" />
                  <span>حذف العروض المحددة ({selectedIds.length})</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* List of Quotations */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {filteredQuotes.length === 0 ? (
            <div className="bg-stone-50 border-2 border-dashed border-stone-200 rounded-2xl p-10 text-center space-y-2">
              <FileText className="w-8 h-8 text-stone-400 mx-auto" />
              <div className="text-xs font-bold text-stone-700">
                {searchTerm || selectedEngineer !== 'all'
                  ? 'لا توجد عروض أسعار تطابق التصفية المحددة'
                  : 'لا توجد عروض أسعار محفوظة بالأرشيف'}
              </div>
              <p className="text-[11px] text-stone-500">
                {searchTerm || selectedEngineer !== 'all'
                  ? 'جرّب إلغاء التصفية أو اختيار مهندس آخر لعرض أعماله.'
                  : 'عند إضافة البنود إلى سلة التسعير، اضغط "حفظ بالأرشيف" لحفظ العرض وتوثيقه باسم المهندس.'}
              </p>
            </div>
          ) : (
            filteredQuotes.map((q) => {
              const engineer = q.preparedBy || q.clientInfo?.preparedBy || 'م.ماجد';
              const isSelected = selectedIds.includes(q.id);

              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isSelected
                      ? 'bg-red-50/25 border-red-300 ring-2 ring-red-400/20 shadow-xs'
                      : 'bg-white border-stone-200 hover:border-amber-400/80 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Admin Multi-Select Checkbox */}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleToggleItem(q.id)}
                        className="mt-1 shrink-0 transition cursor-pointer focus:outline-none"
                        title={isSelected ? 'إلغاء تحديد هذا العرض' : 'تحديد هذا العرض للحذف'}
                      >
                        <span
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                            isSelected
                              ? 'bg-red-600 border-red-700 text-white shadow-xs'
                              : 'bg-white border-stone-300 text-transparent hover:border-amber-500'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                      </button>
                    )}

                    <div className="space-y-1.5 flex-1">
                      {/* Top metadata tags */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {q.quoteNumber}
                        </span>

                        {/* Prominent Engineer Badge */}
                        <span className="text-[11px] font-bold text-[#433c71] bg-[#433c71]/10 border border-[#433c71]/20 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                          <User className="w-3 h-3 text-[#e37725]" />
                          <span>
                            إعداد المهندس: <strong>{engineer}</strong>
                          </span>
                        </span>

                        <span className="text-xs text-stone-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{q.createdAt}</span>
                        </span>

                        <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 flex items-center gap-0.5 font-bold">
                          <Cloud className="w-2.5 h-2.5" />
                          سحابي
                        </span>
                      </div>

                      <h4 className="text-sm font-black text-stone-900 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-stone-400" />
                        <span>{q.clientInfo.clientName || 'عميل بدون اسم'}</span>
                        <span className="text-xs font-normal text-stone-500">
                          - {q.clientInfo.projectTitle || 'مشروع هندسي'}
                        </span>
                      </h4>

                      <div className="text-[11px] text-stone-500">
                        عدد البنود: {q.items.length} بنود • المدينة: {q.clientInfo.projectCity || 'غير محدد'} • نوع الخدمة: {q.clientInfo.serviceType || 'تصميم'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0">
                    <div className="text-left">
                      <span className="text-[10px] text-stone-400 block">الإجمالي</span>
                      <span className="text-base font-black text-amber-800">
                        {formatSAR(q.grandTotal)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => downloadWordDocument(q.clientInfo, q.items)}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 font-bold px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1 transition shadow-xs cursor-pointer"
                        title="تحميل كملف Word (.docx)"
                      >
                        <Download className="w-3.5 h-3.5 text-blue-600" />
                        <span className="hidden sm:inline">Word</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onLoadQuotation(q)}
                        className="bg-stone-900 hover:bg-stone-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition shadow-xs cursor-pointer"
                        title="فتح واسترجاع تفاصيل هذا العرض"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
                        <span>استرجاع العرض</span>
                      </button>

                      {/* Admin Individual Delete */}
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => setSingleDeleteTarget(q)}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="حذف هذا العرض من الأرشيف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Batch Delete Confirmation Modal Overlay */}
        {showBatchConfirm && (
          <div className="absolute inset-0 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 text-right shadow-2xl border border-stone-200 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-stone-900">
                    تأكيد حذف عروض الأسعار المحددة
                  </h3>
                  <p className="text-xs text-stone-500">
                    أنت على وشك حذف ({selectedIds.length}) عرض سعر نهائياً من الأرشيف
                  </p>
                </div>
              </div>

              <div className="p-3 bg-red-50/70 border border-red-200 rounded-xl text-xs text-red-900 space-y-1.5">
                <p className="font-bold">
                  ⚠️ تنبيه: سيتم حذف العروض المحددة نهائياً من الأرشيف والسحابة وقاعدة البيانات، ولا يمكن التراجع عن هذا الإجراء.
                </p>
                {selectedQuotesPreview.length > 0 && (
                  <div className="pt-2 border-t border-red-200/60 max-h-32 overflow-y-auto space-y-1">
                    <span className="text-[11px] font-black block text-red-950">العروض المحددة للحذف:</span>
                    {selectedQuotesPreview.slice(0, 6).map((item) => (
                      <div key={item.id} className="text-[11px] text-red-800 flex items-center justify-between">
                        <span className="font-mono font-bold">{item.quoteNumber}</span>
                        <span>{item.clientInfo?.clientName || 'عميل'}</span>
                      </div>
                    ))}
                    {selectedQuotesPreview.length > 6 && (
                      <div className="text-[10px] text-red-700 font-bold text-center">
                        + {selectedQuotesPreview.length - 6} عروض أخرى
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBatchConfirm(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-100 transition cursor-pointer"
                >
                  إلغاء الأمر
                </button>
                <button
                  type="button"
                  onClick={handleExecuteBatchDelete}
                  className="bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>تأكيد الحذف النهائي ({selectedIds.length})</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Single Item Delete Confirmation Modal Overlay */}
        {singleDeleteTarget && (
          <div className="absolute inset-0 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 text-right shadow-2xl border border-stone-200 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-stone-900">
                    تأكيد حذف عرض السعر
                  </h3>
                  <p className="text-xs text-stone-500">
                    رقم العرض: <strong className="font-mono text-stone-800">{singleDeleteTarget.quoteNumber}</strong>
                  </p>
                </div>
              </div>

              <p className="text-xs text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-200">
                هل أنت متأكد من حذف عرض السعر الخاص بالعميل{' '}
                <strong>({singleDeleteTarget.clientInfo?.clientName || 'عميل'})</strong> نهائياً من الأرشيف والسحابة؟
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSingleDeleteTarget(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-100 transition cursor-pointer"
                >
                  إلغاء الأمر
                </button>
                <button
                  type="button"
                  onClick={() => handleExecuteSingleDelete(singleDeleteTarget)}
                  className="bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>تأكيد الحذف</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
