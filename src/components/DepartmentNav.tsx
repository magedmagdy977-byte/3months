import React from 'react';
import { Ruler, Palette, MapPin, ShieldAlert, Hammer, ClipboardCheck } from 'lucide-react';
import { DepartmentId } from '../types';

interface DepartmentNavProps {
  activeDept: DepartmentId;
  onSelectDept: (id: DepartmentId) => void;
  departmentCounts: Record<DepartmentId, number>;
}

export const departments = [
  {
    id: 'design' as DepartmentId,
    title: 'أولاً: قسم التصميم',
    sub: 'رخص البناء، فلل وعمائر سكنية وتجارية',
    icon: Ruler,
    tag: 'معماري وإنشائي',
  },
  {
    id: 'supervision' as DepartmentId,
    title: 'ثانياً: قسم الإشراف وإدارة المشاريع',
    sub: 'إشراف بلدية، إشراف عام، إدارة مشروع، تقرير أضرار',
    icon: ClipboardCheck,
    tag: 'إشراف وتقارير فنية',
  },
  {
    id: 'decor' as DepartmentId,
    title: 'ثالثاً: قسم الديكور',
    sub: 'مودرن، نيوكلاسيك، كلاسيك وتفاصيل تنفيذية',
    icon: Palette,
    tag: 'تصميم داخلي',
  },
  {
    id: 'survey' as DepartmentId,
    title: 'رابعاً: قسم المساحة',
    sub: 'قرارات مساحية، رفع طبوغرافي، فرز وتبتير',
    icon: MapPin,
    tag: 'مخططات وأراضي',
  },
  {
    id: 'civil_defense' as DepartmentId,
    title: 'خامساً: قسم الدفاع المدني',
    sub: 'شبكات إنذار وإطفاء، تقارير فنية، ورخص سلامة',
    icon: ShieldAlert,
    tag: 'أنظمة السلامة SBC 801',
  },
  {
    id: 'execution' as DepartmentId,
    title: 'سادساً: قسم التنفيذ',
    sub: 'تسليم مفتاح، عظم، تشطيب، ومقاولات إنشائية',
    icon: Hammer,
    tag: 'مقاولات وبناء',
  },
];

export const DepartmentNav: React.FC<DepartmentNavProps> = ({
  activeDept,
  onSelectDept,
  departmentCounts,
}) => {
  return (
    <nav className="bg-white border-b border-stone-200 sticky top-[61px] z-20 shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-2 space-x-reverse overflow-x-auto py-2.5 no-scrollbar scroll-smooth">
          {departments.map((dept) => {
            const Icon = dept.icon;
            const isActive = activeDept === dept.id;
            const count = departmentCounts[dept.id] || 0;

            return (
              <button
                key={dept.id}
                type="button"
                onClick={() => onSelectDept(dept.id)}
                className={`flex-shrink-0 flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-right transition-all border ${
                  isActive
                    ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isActive ? 'bg-amber-500 text-stone-950 font-bold' : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-bold whitespace-nowrap">
                      {dept.title}
                    </span>
                    {count > 0 && (
                      <span
                        className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-amber-400 text-stone-950'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[11px] truncate max-w-[150px] sm:max-w-[200px] hidden md:block ${
                      isActive ? 'text-stone-300' : 'text-stone-500'
                    }`}
                  >
                    {dept.sub}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
