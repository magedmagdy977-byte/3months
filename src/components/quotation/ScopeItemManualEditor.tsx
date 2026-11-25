import React, { useState } from 'react';
import { Edit3, Plus, RotateCcw } from 'lucide-react';
import { MasterTemplateScopeFlags } from '../../types';
import {
  SCOPE_QUICK_CHIPS,
  SCOPE_QUICK_PRESETS,
} from '../../data/masterTemplateDefaults';

interface ScopeItemManualEditorProps {
  scopeId: keyof MasterTemplateScopeFlags;
  defaultName: string;
  defaultDescription: string;
  currentTitle: string;
  currentDescription: string;
  isCustomized: boolean;
  onChangeTitle: (nextTitle: string) => void;
  onChangeDescription: (nextDescription: string) => void;
  onApplyPreset: (title: string, description: string) => void;
  onReset: () => void;
}

export const ScopeItemManualEditor: React.FC<ScopeItemManualEditorProps> = ({
  scopeId,
  defaultName,
  defaultDescription,
  currentTitle,
  currentDescription,
  isCustomized,
  onChangeTitle,
  onChangeDescription,
  onApplyPreset,
  onReset,
}) => {
  const [quickAddInput, setQuickAddInput] = useState<string>('');

  const quickChips = SCOPE_QUICK_CHIPS[scopeId] || [];
  const quickPresets = SCOPE_QUICK_PRESETS[scopeId] || [];

  const handleAppendPhrase = (phrase: string) => {
    const cleanPhrase = phrase.trim();
    if (!cleanPhrase) return;
    const base = currentDescription.trim();
    if (!base) {
      onChangeDescription(`${cleanPhrase}.`);
      return;
    }
    const withoutTrailingPunct = base.replace(/[.،؛]+$/, '').trim();
    onChangeDescription(`${withoutTrailingPunct}، ${cleanPhrase}.`);
  };

  const handleAddCustomPhrase = () => {
    if (!quickAddInput.trim()) return;
    handleAppendPhrase(quickAddInput);
    setQuickAddInput('');
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="mt-3 pt-3 border-t border-amber-300 space-y-3 bg-white p-3.5 rounded-xl border border-amber-300 shadow-xs"
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Edit3 className="w-3.5 h-3.5 text-amber-600" />
          <span className="text-xs font-black text-amber-950">
            تعديل بند «{defaultName}» يدوياً
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md">
            صلاحية تعديل كاملة ✓
          </span>
          {isCustomized && (
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1 text-[10px] font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 px-2 py-0.5 rounded-md transition cursor-pointer"
              title="استعادة النص والمسمى الافتراضي"
            >
              <RotateCcw className="w-3 h-3" />
              <span>استعادة الافتراضي</span>
            </button>
          )}
        </div>
      </div>

      <p className="text-[11px] text-stone-600">
        يمكنك التعديل المباشر على النص بالزيادة أو النقصان أو إضافة بنود جديدة، وستظهر تعديلاتك فوراً في عرض السعر المطبوع والتصدير والعقد الذكي.
      </p>

      {/* Custom Title */}
      <div>
        <label className="block text-[11px] font-bold text-stone-700 mb-1">
          مسمى البند في العرض:
        </label>
        <input
          type="text"
          value={currentTitle}
          onChange={(e) => onChangeTitle(e.target.value)}
          placeholder={defaultName}
          className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-stone-900 focus:ring-2 focus:ring-amber-500 outline-hidden"
        />
      </div>

      {/* Free-form Editable Description Textarea */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-[11px] font-bold text-stone-700">
            نص وصف البند (زيادة / حذف / تعديل حر):
          </label>
          <span className="text-[10px] text-stone-400 font-medium">
            {currentDescription.length} حرف
          </span>
        </div>
        <textarea
          rows={3}
          value={currentDescription}
          onChange={(e) => onChangeDescription(e.target.value)}
          placeholder={defaultDescription}
          className="w-full bg-stone-50 focus:bg-white border border-stone-300 rounded-lg px-3 py-2 text-xs text-stone-900 leading-relaxed focus:ring-2 focus:ring-amber-500 outline-hidden resize-y transition"
        />
      </div>

      {/* Quick Add Custom Phrase */}
      <div>
        <label className="block text-[10.5px] font-bold text-stone-600 mb-1">
          إضافة سريعة إلى نهاية النص:
        </label>
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={quickAddInput}
            onChange={(e) => setQuickAddInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCustomPhrase();
              }
            }}
            placeholder="اكتب أي إضافة جديدة لإلحاقها بنص البند..."
            className="flex-1 bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-amber-500 outline-hidden"
          />
          <button
            type="button"
            onClick={handleAddCustomPhrase}
            className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow-2xs cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة</span>
          </button>
        </div>
      </div>

      {/* Quick-Add Chips */}
      {quickChips.length > 0 && (
        <div>
          <label className="block text-[10.5px] font-bold text-stone-600 mb-1.5">
            عبارات جاهزة للإضافة بضغطة واحدة:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {quickChips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleAppendPhrase(chip)}
                className="text-[10.5px] font-bold bg-stone-50 hover:bg-amber-50 text-stone-700 hover:text-amber-950 border border-stone-300 hover:border-amber-400 px-2 py-1 rounded-md transition cursor-pointer"
              >
                + {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Presets */}
      {(quickPresets.length > 0 || isCustomized) && (
        <div className="pt-2 border-t border-stone-200">
          <div className="flex flex-wrap items-center gap-1.5">
            {quickPresets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => onApplyPreset(preset.title, preset.description)}
                className="text-[10.5px] font-bold bg-amber-50 hover:bg-amber-100 text-stone-800 border border-amber-300 px-2 py-1 rounded-md transition cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
            <button
              type="button"
              onClick={onReset}
              className="text-[10.5px] font-bold bg-stone-100 hover:bg-stone-200 text-stone-600 border border-stone-300 px-2 py-1 rounded-md transition cursor-pointer"
            >
              استعادة النص الافتراضي
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
