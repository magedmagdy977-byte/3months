import React, { useState, useRef } from 'react';
import {
  X,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Send,
  Loader2,
  CheckCircle2,
  Building2,
  User,
  MapPin,
  FileText,
  Phone,
  Layers,
  HelpCircle,
  RotateCcw,
  PlusCircle,
  AlertCircle,
  Maximize2,
  Edit3,
  Check,
} from 'lucide-react';
import { ClientInfo, QuotationItem } from '../../types';
import { getTodayDateString } from '../../utils/formatters';
import { detectRiyadhZone } from '../../data/pricingData';

export interface ExtractedDeedData {
  clientName?: string;
  nationalId?: string;
  phone?: string;
  buildingType?: string;
  projectCity?: string;
  district?: string;
  plotNumber?: string;
  planNumber?: string;
  blockNumber?: string;
  deedNumber?: string;
  deedDate?: string;
  deedRestrictions?: string;
  deedArchetype?: string;
  landArea?: number | string;
  rawAreaText?: string;
  buildingArea?: number | string;
  northLength?: number | string;
  southLength?: number | string;
  eastLength?: number | string;
  westLength?: number | string;
  northBorder?: string;
  southBorder?: string;
  eastBorder?: string;
  westBorder?: string;
  borders?: string;
  serviceType?: string;
  projectTitle?: string;
  notes?: string;
  suggestedScopeFlags?: {
    architectural?: boolean;
    structural?: boolean;
    electrical?: boolean;
    plumbing?: boolean;
    hvac?: boolean;
    survey?: boolean;
    civilDefense?: boolean;
    buildingLicense?: boolean;
    supervision?: boolean;
  };
}

export function cleanExtractedNumber(val: any): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const str = String(val)
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/,/g, '')
    .replace(/[^\d.]/g, ' ')
    .trim();
  const match = str.match(/\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : 0;
}

// Five Official Saudi Deed Archetypes supported by the AI Reader
export const OFFICIAL_DEED_PRESETS = [
  {
    id: 'borseh_mortgage',
    title: 'صك البورصة العقارية (تمويل ورهن)',
    shortTitle: 'البورصة العقارية • تمويل ورهن',
    owner: 'فهاد مناحي ناصر العجمي',
    idNumber: '1002527164',
    deedNumber: '993318023944',
    area: 480,
    city: 'الرياض',
    district: 'اليرموك',
    plot: '2 / 69',
    plan: '2926',
    restrictions: 'مرهون لشركة الراجحي للتطوير المحدودة بمبلغ 1,716,372 ر.س',
    badge: 'تمويل ورهن 🏦',
    tagColor: 'bg-amber-100 text-amber-900 border-amber-300',
    description: 'وثيقة تملك إلكترونية حديثة من البورصة العقارية بتمويل ورهن شركة الراجحي للتطوير المحدودة',
  },
  {
    id: 'borseh_borders',
    title: 'صك البورصة العقارية (جدول الحدود والأطوال)',
    shortTitle: 'البورصة العقارية • جدول الأبعاد',
    owner: 'خالد بن عبدالله بن علي باعطيه',
    idNumber: '1067263549',
    deedNumber: '310113011744',
    area: 598,
    city: 'الرياض',
    district: 'خنشليلة',
    plot: '206',
    plan: '2303',
    borders: 'شمالاً شارع 30م بطول 26م | جنوباً قطعة 208 بطول 26م | شرقاً قطعة 205 بطول 23م | غرباً شارع 30م بطول 23م',
    badge: 'جدول الأبعاد 📐',
    tagColor: 'bg-blue-100 text-blue-900 border-blue-300',
    description: 'وثيقة تملك إلكترونية تفصيلية مع جدول تفصيلي للأطوال الأربعة بالمتر وعروض الشوارع',
  },
  {
    id: 'court_deed',
    title: 'صك محكمة الأحوال الشخصية / إنهاءات ووصايا',
    shortTitle: 'محكمة شرعية • وصية وعمارة',
    owner: 'الأميرة ساره بنت سعود الكبير بن عبدالعزيز آل سعود',
    idNumber: '1102854856',
    deedNumber: '810702000814',
    area: 1050,
    city: 'الرياض',
    district: 'حي النهضة',
    plot: 'عمارة 2590',
    plan: '1353',
    restrictions: 'صادر عليه وصية شرعية من الموصي مالك العقار',
    borders: 'شمالاً قطعة 2591 بطول 35م | جنوباً شارع 20م بطول 35م | شرقاً قطعة 2589 بطول 30م | غرباً شارع 40م بطول 30م',
    badge: 'محكمة شرعية ⚖️',
    tagColor: 'bg-purple-100 text-purple-900 border-purple-300',
    description: 'صك رسمي صادر من كاتب العدل بمحكمة الأحوال الشخصية بالرياض (إنهاءات ووصية شرعية)',
  },
  {
    id: 'barcode_deed',
    title: 'صك كتابة العدل الحكومي بالباركود [277]',
    shortTitle: 'كتابة العدل • نموذج 277 باركود',
    owner: 'نوره بنت فهد بن ابراهيم بن بخيت',
    idNumber: '1005770134',
    deedNumber: '310108048857',
    area: 1050,
    city: 'الرياض',
    district: 'حي الملقا',
    plot: '1326',
    plan: '2460',
    borders: 'شمالاً شارع 15م بطول 30م | جنوباً قطعة 1328 بطول 30م | شرقاً شارع 30م بطول 35م | غرباً قطعة 1327 بطول 35م',
    badge: 'باركود عدلي 🏛️',
    tagColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    description: 'صك إلكتروني رسمي من وزارة العدل بنظام الباركود والمطابع الحكومية النموذج 277',
  },
  {
    id: 'rer_rega',
    title: 'صحيفة عقارية - السجل العقاري RER / REGA',
    shortTitle: 'السجل العقاري • تسجيل عيني',
    owner: 'عبدالمحسن عبدالله عمر آل الشيخ',
    idNumber: '1004389506',
    deedNumber: '9507050272500000',
    area: 875,
    city: 'الرياض',
    district: 'حطين',
    plot: '1052',
    plan: '2837',
    block: '87',
    restrictions: 'بلك 87 • تسلسل ملكية سابق: عبدالمجيد آل الشيخ (هبة) • فرز القطعة بأمانة الرياض',
    borders: 'أبعاد المضلع بالخريطة: 25.00م × 35.00م على شارعين عرض 15م',
    badge: 'السجل العقاري 🗺️',
    tagColor: 'bg-teal-100 text-teal-900 border-teal-300',
    description: 'صحيفة التسجيل العيني الأول الصادرة من الهيئة العامة للعقار (REGA) والسجل العقاري (RER)',
  },
];

// Build Partial<ClientInfo> from ExtractedDeedData to populate all designated fields in the program
export const buildClientInfoFromExtracted = (ext: ExtractedDeedData): Partial<ClientInfo> => {
  const areaNum = cleanExtractedNumber(ext.landArea);
  const bAreaNum = cleanExtractedNumber(ext.buildingArea);

  const updatedClientInfo: Partial<ClientInfo> = {};

  if (ext.clientName !== undefined && ext.clientName.trim()) {
    updatedClientInfo.clientName = ext.clientName.trim();
  }
  if (ext.nationalId !== undefined && ext.nationalId.trim()) {
    updatedClientInfo.nationalId = ext.nationalId.trim();
  }
  if (ext.phone !== undefined && ext.phone.trim()) {
    updatedClientInfo.phone = ext.phone.trim();
  }
  if (ext.projectCity !== undefined && ext.projectCity.trim()) {
    updatedClientInfo.projectCity = ext.projectCity.trim();
  }
  if (ext.district !== undefined && ext.district.trim()) {
    updatedClientInfo.district = ext.district.trim();
  }
  if (ext.plotNumber !== undefined && ext.plotNumber.trim()) {
    updatedClientInfo.plotNumber = ext.plotNumber.trim();
  }
  if (ext.planNumber !== undefined && ext.planNumber.trim()) {
    updatedClientInfo.planNumber = ext.planNumber.trim();
  }
  if (ext.deedNumber !== undefined && ext.deedNumber.trim()) {
    updatedClientInfo.deedNumber = ext.deedNumber.trim();
  }
  if (ext.deedDate !== undefined && ext.deedDate.trim()) {
    updatedClientInfo.deedDate = ext.deedDate.trim();
  }
  if (ext.borders !== undefined && ext.borders.trim()) {
    updatedClientInfo.borders = ext.borders.trim();
  }

  // Auto-detect Riyadh zone based on district
  if (ext.district) {
    const detectedZone = detectRiyadhZone(ext.district, ext.projectCity || 'الرياض');
    if (detectedZone && detectedZone !== 'none') {
      updatedClientInfo.locationZone = detectedZone;
    }
  }

  // Prioritize landArea and sync buildingArea
  if (areaNum > 0) {
    updatedClientInfo.landArea = areaNum;
    updatedClientInfo.buildingArea = bAreaNum > 0 ? bAreaNum : Math.round(areaNum * 1.68);
  } else if (bAreaNum > 0) {
    updatedClientInfo.buildingArea = bAreaNum;
    updatedClientInfo.landArea = Math.round(bAreaNum / 1.68);
  }

  if (ext.buildingType && ext.buildingType.trim()) {
    updatedClientInfo.buildingType = ext.buildingType.trim();
  }
  if (ext.serviceType && ext.serviceType.trim()) {
    updatedClientInfo.serviceType = ext.serviceType.trim();
  }

  if (ext.projectTitle && ext.projectTitle.trim()) {
    updatedClientInfo.projectTitle = ext.projectTitle.trim();
  } else if (ext.buildingType) {
    updatedClientInfo.projectTitle = `مشروع ${ext.buildingType}${ext.district ? ` - ${ext.district}` : ''}`;
  }

  // Build consolidated notes with full deed, archetype & border details
  const extraNotes: string[] = [];
  if (ext.deedArchetype) extraNotes.push(`نوع الصك: ${ext.deedArchetype}`);
  if (ext.deedNumber) extraNotes.push(`رقم الصك: ${ext.deedNumber}`);
  if (ext.deedDate) extraNotes.push(`تاريخ الصك: ${ext.deedDate}`);
  if (ext.nationalId) extraNotes.push(`رقم الهوية/السجل: ${ext.nationalId}`);
  if (ext.blockNumber) extraNotes.push(`بلك: ${ext.blockNumber}`);
  if (ext.deedRestrictions) extraNotes.push(`القيود والرهون: ${ext.deedRestrictions}`);
  if (ext.borders) extraNotes.push(`الحدود والأطوال: ${ext.borders}`);
  if (ext.notes && !ext.notes.includes(ext.deedRestrictions || '---')) extraNotes.push(ext.notes);

  if (extraNotes.length > 0) {
    updatedClientInfo.notes = extraNotes.join(' • ');
  }

  return updatedClientInfo;
};

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imagePreview?: string;
  fileName?: string;
  extracted?: ExtractedDeedData;
  timestamp: string;
}

interface GeminiDeedAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClientInfo: ClientInfo;
  onApplyExtractedData: (
    updated: Partial<ClientInfo>,
    suggestedScopeFlags?: ExtractedDeedData['suggestedScopeFlags'],
    shouldAddDefaultService?: boolean
  ) => void;
}

export const GeminiDeedAssistantModal: React.FC<GeminiDeedAssistantModalProps> = ({
  isOpen,
  onClose,
  currentClientInfo,
  onApplyExtractedData,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content:
        'مرحباً بك يا بشمهندس! 👷‍♂️✨\nأنا قارئ الصكوك والمخططات الذكي المعتمد المدعوم بـ Google Gemini 3.8 Flash.\n\nتم تدريبي خصيصاً على قراءة واستيعاب وتفريغ بيانات كافة أنواع الصكوك العقارية المعتمدة في المملكة العربية السعودية بدقة 100%:\n1️⃣ صكوك البورصة العقارية الحديثة (صفقات التمويل والرهون البنكية).\n2️⃣ صكوك البورصة العقارية التفصيلية (جداول الأطوال والحدود وعروض الشوارع).\n3️⃣ صكوك المحاكم الشرعية وكتابات العدل (محكمة الأحوال الشخصية، إنهاءات، وصايا، وأوقاف).\n4️⃣ صكوك كتابة العدل الإلكترونية بالباركود ومطابع الحكومة (نموذج 277).\n5️⃣ صحائف السجل العقاري (RER) والتسجيل العيني الأول الصادرة من الهيئة العامة للعقار (REGA).\n\nارفع أي صك بصيغة PDF أو صورة، أو اختر أحد النماذج الخمسة للبدء وسأقوم بتعبئة كافة البيانات تلقائياً في خانات البرنامج فوراً!',
      timestamp: 'الآن',
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<{
    data: string; // base64
    mimeType: string;
    preview: string;
    name: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [lastExtracted, setLastExtracted] = useState<ExtractedDeedData | null>(null);
  const [appliedSuccessfully, setAppliedSuccessfully] = useState(false);
  const [autoAppliedNotice, setAutoAppliedNotice] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const processSelectedFile = (file: File) => {
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (!isImage && !isPdf) {
      setErrorMessage('يرجى اختيار صورة صك/مخطط (JPG, PNG, WEBP) أو ملف PDF');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const fileObj = {
        data: result,
        mimeType: isPdf ? 'application/pdf' : file.type || 'image/jpeg',
        preview: isImage ? result : '',
        name: file.name,
      };
      setSelectedImage(fileObj);
      setErrorMessage(null);
      // Automatically run extraction as soon as the engineer selects or drops the deed/blueprint!
      handleSendMessage(undefined, fileObj);
    };
    reader.readAsDataURL(file);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processSelectedFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleSendMessage = async (
    customPrompt?: string,
    directMediaOverride?: { data: string; mimeType: string; preview: string; name: string },
    presetId?: string
  ) => {
    const promptToSend = customPrompt !== undefined ? customPrompt : inputText;
    const mediaToUse = directMediaOverride || selectedImage;

    if (!promptToSend.trim() && !mediaToUse && !presetId) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content:
        promptToSend ||
        `تحليل واستخراج بيانات الوثيقة المرفقة (${mediaToUse?.name || 'صك / مخطط'}) ووضع مساحة الأرض وكافة العناصر تلقائياً في الخانات المختصة`,
      imagePreview: mediaToUse?.preview || undefined,
      fileName: mediaToUse?.name,
      timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (customPrompt === undefined) {
      setInputText('');
    }
    setSelectedImage(null);
    setIsLoading(true);
    setErrorMessage(null);
    setAppliedSuccessfully(false);
    setAutoAppliedNotice(false);
    scrollToBottom();

    try {
      const payload: any = {
        text: promptToSend,
        messages: messages.slice(-4).map((m) => ({
          role: m.role,
          content: m.content,
        })),
      };

      if (presetId) {
        payload.presetId = presetId;
      }

      if (mediaToUse) {
        payload.image = {
          data: mediaToUse.data,
          mimeType: mediaToUse.mimeType,
        };
      }

      const res = await fetch('/api/ai/parse-deed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `خطأ في الخادم (${res.status})`);
      }

      const data = await res.json();

      let cleanedData: ExtractedDeedData | undefined = undefined;
      if (data.extractedData) {
        const ext = data.extractedData;
        let area = cleanExtractedNumber(ext.landArea);

        // Client-side fallback if landArea is still 0: check rawAreaText or 4 boundary lengths
        if (area < 20 && ext.rawAreaText) {
          area = cleanExtractedNumber(ext.rawAreaText);
        }
        if (area < 20) {
          const nLen = cleanExtractedNumber(ext.northLength);
          const sLen = cleanExtractedNumber(ext.southLength);
          const eLen = cleanExtractedNumber(ext.eastLength);
          const wLen = cleanExtractedNumber(ext.westLength);
          const avgNS = nLen > 0 && sLen > 0 ? (nLen + sLen) / 2 : nLen || sLen;
          const avgEW = eLen > 0 && wLen > 0 ? (eLen + wLen) / 2 : eLen || wLen;
          if (avgNS >= 4 && avgEW >= 4) {
            area = Math.round(avgNS * avgEW * 100) / 100;
          }
        }

        const bArea = cleanExtractedNumber(ext.buildingArea);

        cleanedData = {
          ...ext,
          deedArchetype: ext.deedArchetype || 'صك عقاري معتمد',
          deedRestrictions: ext.deedRestrictions || '',
          blockNumber: ext.blockNumber || '',
          landArea: area,
          buildingArea: bArea > 0 ? bArea : area > 0 ? Math.round(area * 1.68) : undefined,
          clientName: ext.clientName ? String(ext.clientName).trim() : '',
          nationalId: ext.nationalId ? String(ext.nationalId).trim() : '',
          phone: ext.phone ? String(ext.phone).trim() : '',
          projectCity: ext.projectCity ? String(ext.projectCity).trim() : 'الرياض',
          district: ext.district ? String(ext.district).trim() : '',
          plotNumber: ext.plotNumber ? String(ext.plotNumber).trim() : '',
          planNumber: ext.planNumber ? String(ext.planNumber).trim() : '',
          deedNumber: ext.deedNumber ? String(ext.deedNumber).trim() : '',
          deedDate: ext.deedDate ? String(ext.deedDate).trim() : '',
          borders: ext.borders ? String(ext.borders).trim() : '',
          notes: ext.notes ? String(ext.notes).trim() : '',
          buildingType: ext.buildingType || 'فيلا سكنية خاصة',
          serviceType: ext.serviceType || 'إصدار رخصة بناء وتصاميم هندسية',
        };
      }

      const assistantMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content:
          data.replyMessage ||
          'تم استخراج مساحة الأرض وكافة المعطيات وتوزيعها تلقائياً في خانات البرنامج المعتمدة.',
        extracted: cleanedData,
        timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (cleanedData) {
        setLastExtracted(cleanedData);
        // AUTOMATICALLY POPULATE ALL DESIGNATED FIELDS IN THE PROGRAM IMMEDIATELY!
        const updatedFields = buildClientInfoFromExtracted(cleanedData);
        onApplyExtractedData(updatedFields, cleanedData.suggestedScopeFlags, false);
        setAutoAppliedNotice(true);
      }
      scrollToBottom();
    } catch (err: any) {
      console.error('Error in AI Deed parser:', err);
      const errMsg = err?.message || 'تعذر الاتصال بخدمة الذكاء الاصطناعي، يرجى المحاولة مرة أخرى.';
      setErrorMessage(errMsg);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ نعتذر، حدث خطأ: ${errMsg}`,
          timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      scrollToBottom();
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateLastExtractedField = (field: keyof ExtractedDeedData, value: any) => {
    setLastExtracted((prev) => {
      if (!prev) return prev;
      const next = { ...prev, [field]: value };
      if (field === 'landArea') {
        const areaNum = cleanExtractedNumber(value);
        next.landArea = areaNum;
        next.buildingArea = Math.round(areaNum * 1.68);
      }
      // Sync live with the program's fields immediately as the engineer edits
      const updatedFields = buildClientInfoFromExtracted(next);
      onApplyExtractedData(updatedFields, next.suggestedScopeFlags, false);
      return next;
    });
  };

  const handleApplyToProgram = (addService: boolean = false) => {
    if (!lastExtracted) return;
    const updatedClientInfo = buildClientInfoFromExtracted(lastExtracted);
    onApplyExtractedData(updatedClientInfo, lastExtracted.suggestedScopeFlags, addService);
    setAppliedSuccessfully(true);

    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/70 backdrop-blur-xs no-print animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl h-[92vh] max-h-[850px] rounded-2xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden text-stone-900 text-right">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-stone-950 flex items-center justify-center font-bold shadow-md">
              <Sparkles className="w-5 h-5 text-stone-950 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  قارئ الصكوك والمخططات الذكي • استخراج وتعبئة الحقول
                </h2>
                <span className="text-[10px] font-black bg-amber-400 text-stone-950 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Gemini 3.8 Flash ✨
                </span>
              </div>
              <p className="text-xs text-stone-300 mt-0.5">
                قراءة دقيقة لمساحة الأرض، اسم المالك، رقم القطعة والمخطط، والحدود من الصكوك والكروكيات وتوزيعها فورياً بالبرنامج.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Two columns layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-stone-50">
          {/* Right Column: Chat Stream & Input Area */}
          <div className="flex-1 flex flex-col bg-stone-100/50 border-l border-stone-200 overflow-hidden">
            {/* 5 Official Saudi Deed Archetypes Training & Test Bar */}
            <div className="p-2.5 bg-gradient-to-r from-amber-500/10 via-stone-50 to-amber-500/10 border-b border-stone-200 shrink-0 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-black text-stone-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>الأنواع الـ 5 المعتمدة للصكوك السعودية (تدريب وتعبئة فورية):</span>
                </span>
                <span className="text-[10px] text-stone-500 font-bold hidden sm:inline">
                  انقر على أي نوع لقراءة ملف الـ PDF وتعبئة البيانات تلقائياً
                </span>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-black px-3 py-1.5 rounded-xl transition shrink-0 flex items-center gap-1.5 shadow-xs border border-amber-400 cursor-pointer text-xs"
                  title="رفع صك من جهازك بصيغة PDF أو صورة"
                >
                  <Upload className="w-3.5 h-3.5 text-stone-950" />
                  <span>رفع صك (PDF / صورة) 📄</span>
                </button>

                {OFFICIAL_DEED_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    disabled={isLoading}
                    onClick={() =>
                      handleSendMessage(
                        `تحليل واستخراج الصك التدريبي المعتمد: ${preset.title} (${preset.owner} • ${preset.area} م² • ${preset.district})`,
                        undefined,
                        preset.id
                      )
                    }
                    className="bg-white hover:bg-amber-50 hover:border-amber-300 disabled:opacity-50 text-stone-800 border border-stone-200 px-2.5 py-1.5 rounded-xl font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer shadow-2xs group text-xs"
                    title={preset.description}
                  >
                    <span>{preset.badge.split(' ')[1] || '📄'}</span>
                    <div className="text-right">
                      <span className="font-black text-[11px] block text-stone-900 group-hover:text-amber-900">
                        {preset.shortTitle}
                      </span>
                      <span className="text-[10px] text-stone-500 font-mono block">
                        {preset.owner.split(' ')[0]} • {preset.area} م²
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.role === 'user' ? 'items-start' : 'items-end'}`}
                >
                  <div
                    className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                      m.role === 'user'
                        ? 'bg-amber-500 text-stone-950 font-medium rounded-tr-xs'
                        : 'bg-white text-stone-900 border border-stone-200/90 rounded-tl-xs'
                    }`}
                  >
                    {/* User uploaded image or PDF badge */}
                    {m.imagePreview ? (
                      <div className="mb-2.5 rounded-xl overflow-hidden border border-stone-900/10 max-h-48 bg-stone-900 flex items-center justify-center">
                        <img
                          src={m.imagePreview}
                          alt="صورة الصك المرفقة"
                          className="max-h-48 w-auto object-contain"
                        />
                      </div>
                    ) : m.fileName ? (
                      <div className="mb-2.5 p-2 bg-stone-900/10 rounded-xl flex items-center gap-2 text-xs font-bold">
                        <FileText className="w-4 h-4 text-stone-900 shrink-0" />
                        <span className="truncate flex-1">{m.fileName}</span>
                        <span className="text-[10px] bg-stone-900 text-amber-300 px-1.5 py-0.5 rounded font-black shrink-0">
                          {m.fileName.toLowerCase().endsWith('.pdf') ? 'مستند PDF رسمي 📄' : 'ملف معتمد'}
                        </span>
                      </div>
                    ) : null}

                    {/* Detected Archetype Tag */}
                    {m.extracted?.deedArchetype && (
                      <div className="mb-2 flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-black bg-amber-500/15 text-amber-950 border border-amber-300 px-2 py-0.5 rounded-md">
                          <span>🏷️</span>
                          <span>{m.extracted.deedArchetype}</span>
                        </span>
                        {m.extracted.deedRestrictions && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black bg-orange-100 text-orange-900 border border-orange-300 px-2 py-0.5 rounded-md">
                            <span>⚠️</span>
                            <span>{m.extracted.deedRestrictions}</span>
                          </span>
                        )}
                      </div>
                    )}

                    <div className="whitespace-pre-line">{m.content}</div>

                    {/* Highlight extracted land area directly in message if available */}
                    {m.extracted && m.extracted.landArea && (
                      <div className="mt-2.5 pt-2 border-t border-stone-200/60 flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-bold text-stone-500">مساحة الأرض المستخرجة:</span>
                        <span className="font-mono font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                          {m.extracted.landArea} م²
                        </span>
                        {m.extracted.plotNumber && (
                          <span className="text-stone-500 font-bold">
                            (قطعة {m.extracted.plotNumber} مخطط {m.extracted.planNumber || '-'})
                          </span>
                        )}
                        {m.extracted.clientName && (
                          <span className="text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            المالك: {m.extracted.clientName}
                          </span>
                        )}
                      </div>
                    )}

                    <div
                      className={`text-[10px] mt-1.5 flex items-center justify-end ${
                        m.role === 'user' ? 'text-stone-900/60' : 'text-stone-400'
                      }`}
                    >
                      <span>{m.timestamp}</span>
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-end">
                  <div className="bg-white border border-stone-200 rounded-2xl p-3.5 rounded-tl-xs text-xs flex items-center gap-2.5 text-stone-700 shadow-xs">
                    <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                    <span>جاري تحليل صورة الصك/المخطط واستخراج مساحة الأرض وكافة المعطيات بدقة عبر Gemini 3.8 Flash...</span>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-white border-t border-stone-200 shrink-0">
              {/* Selected File / Image Chip */}
              {selectedImage && (
                <div className="mb-2.5 p-2 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 overflow-hidden">
                    {selectedImage.mimeType === 'application/pdf' ? (
                      <div className="w-9 h-9 rounded-lg bg-red-100 text-red-700 border border-red-300 flex items-center justify-center font-bold text-xs shrink-0">
                        <FileText className="w-5 h-5 text-red-600" />
                      </div>
                    ) : (
                      <img
                        src={selectedImage.preview}
                        alt="Thumbnail"
                        className="w-9 h-9 object-cover rounded-lg border border-amber-300 shrink-0"
                      />
                    )}
                    <div className="truncate">
                      <span className="font-bold text-amber-950 block truncate">{selectedImage.name}</span>
                      <span className="text-[10px] text-amber-700">
                        {selectedImage.mimeType === 'application/pdf'
                          ? 'مستند PDF رسمي جاهز للقراءة والتعبئة 📄'
                          : 'صورة الصك/المخطط جاهزة للاستخراج 📷'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedImage(null)}
                    className="p-1 text-stone-400 hover:text-red-500 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-end gap-2"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf,.pdf"
                  onChange={handleImageSelect}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="إرفاق ملف الصك العقاري (PDF أو صورة) أو المخطط"
                  className="p-2.5 text-stone-600 hover:text-amber-600 hover:bg-amber-50 rounded-xl border border-stone-300 hover:border-amber-300 transition shrink-0 cursor-pointer flex items-center gap-1"
                >
                  <Upload className="w-4 h-4 text-amber-600" />
                  <span className="text-[11px] font-bold hidden sm:inline text-stone-700">رفع صك</span>
                </button>

                <div className="flex-1 relative">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="الصق رسالة العميل، تفاصيل الصك والمساحة، أو ارفع صورة الصك/المخطط..."
                    rows={2}
                    className="w-full bg-stone-50 hover:bg-white focus:bg-white border border-stone-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl p-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none resize-none font-medium transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || (!inputText.trim() && !selectedImage)}
                  className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 text-stone-950 font-black p-2.5 sm:px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md transition shrink-0 cursor-pointer"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span className="hidden sm:inline">تحليل واستخراج</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Left Column: Live Structured Data Distribution Card */}
          <div className="w-full md:w-96 bg-white border-t md:border-t-0 md:border-r border-stone-200 flex flex-col overflow-hidden shrink-0">
            <div className="p-3.5 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800 shrink-0">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-black">المعطيات المستخرجة للتعبئة</h3>
              </div>
              {lastExtracted && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsEditMode(!isEditMode)}
                    className="text-[10px] text-amber-300 hover:text-white bg-stone-800 hover:bg-stone-700 px-2 py-0.5 rounded-md font-bold transition flex items-center gap-1 cursor-pointer"
                    title={isEditMode ? 'قفل التعديل' : 'تعديل المعطيات قبل التطبيق'}
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{isEditMode ? 'إنهاء التعديل' : 'تعديل يدوي'}</span>
                  </button>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                    جاهز للتطبيق ✨
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {!lastExtracted ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                    <FileText className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-700">بانتظار الصك أو المخطط</h4>
                    <p className="text-[11px] text-stone-400 mt-1 leading-relaxed">
                      ارفع صورة الصك أو الكروكي وسيقوم الذكاء الاصطناعي باستخراج مساحة الأرض وكافة المعطيات وتجهيزها للتعبئة التلقائية.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Deed Archetype Badge */}
                  {lastExtracted.deedArchetype && (
                    <div className="p-2.5 bg-gradient-to-r from-amber-50 to-amber-100/70 border border-amber-300 rounded-xl flex items-center justify-between text-xs shadow-2xs">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <FileText className="w-4 h-4 text-amber-700 shrink-0" />
                        <span className="font-bold text-amber-950 text-[11px] truncate">
                          {lastExtracted.deedArchetype}
                        </span>
                      </div>
                      <span className="text-[10px] bg-amber-400 text-stone-950 px-2 py-0.5 rounded-full font-black shrink-0">
                        معتمد 🏛️
                      </span>
                    </div>
                  )}

                  {/* Deed Restrictions Alert if mortgage/endowment */}
                  {lastExtracted.deedRestrictions && (
                    <div className="p-2.5 bg-orange-50 border-2 border-orange-300 rounded-xl space-y-1 text-xs animate-in fade-in">
                      <div className="flex items-center justify-between text-orange-950">
                        <span className="font-black flex items-center gap-1.5 text-[11px]">
                          <AlertCircle className="w-3.5 h-3.5 text-orange-600" />
                          <span>القيود والرهون المسجلة:</span>
                        </span>
                        <span className="text-[10px] bg-orange-200 text-orange-900 font-bold px-1.5 py-0.2 rounded">
                          قيد رسمي
                        </span>
                      </div>
                      <p className="text-[11px] font-bold text-orange-900 bg-white/80 p-2 rounded-lg border border-orange-200 leading-relaxed">
                        {lastExtracted.deedRestrictions}
                      </p>
                    </div>
                  )}

                  {/* HERO ITEM: Land Area & Built-up Area */}
                  <div className="p-3 bg-gradient-to-r from-amber-50 via-amber-100/60 to-amber-50 rounded-xl border-2 border-amber-400 space-y-2 text-xs shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-amber-950 font-black flex items-center gap-1 text-xs">
                        <Maximize2 className="w-3.5 h-3.5 text-amber-600" />
                        <span>مساحة الأرض:</span>
                      </span>
                      {cleanExtractedNumber(lastExtracted.landArea) > 0 ? (
                        <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3 text-white" />
                          <span>تم الالتقاط والتعبئة تلقائياً ✨</span>
                        </span>
                      ) : (
                        <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">
                          يرجى تأكيد المساحة
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={lastExtracted.landArea || ''}
                          onChange={(e) =>
                            handleUpdateLastExtractedField('landArea', e.target.value)
                          }
                          placeholder="مساحة الأرض (مثال: 500)"
                          className="w-full bg-white border-2 border-amber-400 rounded-xl px-3 py-1.5 text-sm font-black font-mono text-amber-950 focus:ring-2 focus:ring-amber-500 outline-hidden"
                        />
                        <span className="absolute left-2.5 top-2 text-xs font-bold text-amber-700 pointer-events-none">
                          م²
                        </span>
                      </div>

                      {/* Quick Area Presets if needed */}
                      <div className="flex items-center gap-1">
                        {[400, 480, 598, 875, 1050].map((quick) => (
                          <button
                            key={quick}
                            type="button"
                            onClick={() => handleUpdateLastExtractedField('landArea', quick)}
                            className="text-[10px] bg-white hover:bg-amber-200 border border-amber-300 text-amber-900 font-bold px-1.5 py-1 rounded-lg transition cursor-pointer"
                          >
                            {quick}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-amber-200/80 flex items-center justify-between text-xs">
                      <span className="text-amber-900 font-bold text-[11px]">
                        مسطح البناء الإجمالي (م²):
                      </span>
                      <div className="relative w-32">
                        <input
                          type="number"
                          min="0"
                          value={
                            lastExtracted.buildingArea ||
                            (cleanExtractedNumber(lastExtracted.landArea) > 0
                              ? Math.round(cleanExtractedNumber(lastExtracted.landArea) * 1.68)
                              : '')
                          }
                          onChange={(e) =>
                            handleUpdateLastExtractedField(
                              'buildingArea',
                              cleanExtractedNumber(e.target.value)
                            )
                          }
                          className="w-full bg-white border border-amber-300 rounded-lg px-2 py-1 text-xs font-mono font-bold text-amber-900 text-left outline-hidden"
                        />
                        <span className="absolute left-1.5 top-1.5 text-[10px] text-amber-600 font-bold pointer-events-none">
                          م²
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Client & National ID */}
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-stone-500 text-[11px] font-bold shrink-0">اسم العميل:</span>
                      {isEditMode ? (
                        <input
                          type="text"
                          value={lastExtracted.clientName || ''}
                          onChange={(e) =>
                            handleUpdateLastExtractedField('clientName', e.target.value)
                          }
                          className="flex-1 bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs font-bold text-stone-900 text-right outline-hidden"
                        />
                      ) : (
                        <span className="font-black text-stone-900 text-left truncate">
                          {lastExtracted.clientName || 'غير محدد'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-stone-500 text-[11px] font-bold shrink-0">رقم الهوية / السجل:</span>
                      {isEditMode ? (
                        <input
                          type="text"
                          dir="ltr"
                          value={lastExtracted.nationalId || ''}
                          onChange={(e) => handleUpdateLastExtractedField('nationalId', e.target.value)}
                          placeholder="10 أرقام"
                          className="flex-1 bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs font-mono font-bold text-stone-800 text-right outline-hidden"
                        />
                      ) : (
                        <span className="font-mono font-bold text-stone-800">
                          {lastExtracted.nationalId || 'غير مسجل'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-stone-500 text-[11px] font-bold shrink-0">رقم الجوال:</span>
                      {isEditMode ? (
                        <input
                          type="text"
                          dir="ltr"
                          value={lastExtracted.phone || ''}
                          onChange={(e) => handleUpdateLastExtractedField('phone', e.target.value)}
                          className="flex-1 bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs font-mono font-bold text-stone-800 text-right outline-hidden"
                        />
                      ) : (
                        <span className="font-mono font-bold text-stone-800">
                          {lastExtracted.phone || 'غير مسجل'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-stone-500 text-[11px] font-bold shrink-0">المدينة والحي:</span>
                      {isEditMode ? (
                        <div className="flex items-center gap-1 flex-1">
                          <input
                            type="text"
                            placeholder="المدينة"
                            value={lastExtracted.projectCity || ''}
                            onChange={(e) =>
                              handleUpdateLastExtractedField('projectCity', e.target.value)
                            }
                            className="w-1/2 bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs font-bold text-stone-800 text-right outline-hidden"
                          />
                          <input
                            type="text"
                            placeholder="الحي"
                            value={lastExtracted.district || ''}
                            onChange={(e) =>
                              handleUpdateLastExtractedField('district', e.target.value)
                            }
                            className="w-1/2 bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs font-bold text-stone-800 text-right outline-hidden"
                          />
                        </div>
                      ) : (
                        <span className="font-bold text-stone-800">
                          {lastExtracted.projectCity || 'الرياض'}{' '}
                          {lastExtracted.district ? `- ${lastExtracted.district}` : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Plot, Plan, Deed, Block */}
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-stone-500 text-[11px] font-bold shrink-0">رقم القطعة:</span>
                      {isEditMode ? (
                        <input
                          type="text"
                          value={lastExtracted.plotNumber || ''}
                          onChange={(e) =>
                            handleUpdateLastExtractedField('plotNumber', e.target.value)
                          }
                          className="flex-1 bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs font-bold text-stone-900 text-right outline-hidden"
                        />
                      ) : (
                        <span className="font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {lastExtracted.plotNumber || 'غير مذكور'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-stone-500 text-[11px] font-bold shrink-0">رقم المخطط:</span>
                      {isEditMode ? (
                        <input
                          type="text"
                          value={lastExtracted.planNumber || ''}
                          onChange={(e) =>
                            handleUpdateLastExtractedField('planNumber', e.target.value)
                          }
                          className="flex-1 bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs font-bold text-stone-900 text-right outline-hidden"
                        />
                      ) : (
                        <span className="font-mono font-bold text-stone-800">
                          {lastExtracted.planNumber || 'غير مذكور'}
                        </span>
                      )}
                    </div>

                    {lastExtracted.blockNumber && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-stone-500 text-[11px] font-bold shrink-0">رقم البلك:</span>
                        <span className="font-mono font-bold text-stone-800 bg-white px-2 py-0.5 rounded border border-stone-200">
                          بلك {lastExtracted.blockNumber}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-stone-500 text-[11px] font-bold shrink-0">رقم وتاريخ الصك:</span>
                      <span className="font-mono text-[11px] font-bold text-stone-700">
                        {lastExtracted.deedNumber || 'غير مسجل'}{' '}
                        {lastExtracted.deedDate ? `(${lastExtracted.deedDate})` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Borders and Dimensions */}
                  {lastExtracted.borders && (
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-stone-700">
                        <span className="text-stone-600 font-bold text-[11px]">الحدود والأطوال:</span>
                        <span className="text-[10px] text-stone-400 font-mono">الأبعاد</span>
                      </div>
                      {isEditMode ? (
                        <textarea
                          rows={2}
                          value={lastExtracted.borders}
                          onChange={(e) => handleUpdateLastExtractedField('borders', e.target.value)}
                          className="w-full bg-white border border-stone-300 rounded-lg p-2 text-xs font-medium text-stone-900 outline-hidden resize-none"
                        />
                      ) : (
                        <p className="text-[11px] text-stone-800 leading-relaxed font-medium bg-white p-2 rounded-lg border border-stone-200">
                          {lastExtracted.borders}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Building Type & Service Type */}
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-stone-500 text-[11px] font-bold shrink-0">نوع المبنى:</span>
                      {isEditMode ? (
                        <select
                          value={lastExtracted.buildingType || 'فيلا سكنية'}
                          onChange={(e) =>
                            handleUpdateLastExtractedField('buildingType', e.target.value)
                          }
                          className="flex-1 bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs font-bold text-stone-900 text-right outline-hidden"
                        >
                          <option value="فيلا سكنية">فيلا سكنية</option>
                          <option value="عمارة سكنية">عمارة سكنية</option>
                          <option value="عمارة تجارية">عمارة تجارية</option>
                          <option value="استراحة">استراحة</option>
                          <option value="فندق / شقق مفروشة">فندق / شقق مفروشة</option>
                          <option value="محطة وقود">محطة وقود</option>
                          <option value="مصنع / منشأة صناعية">مصنع / منشأة صناعية</option>
                          <option value="مستودع / ورشة">مستودع / ورشة</option>
                        </select>
                      ) : (
                        <span className="font-bold text-[#433c71] bg-white px-2 py-0.5 rounded border border-[#433c71]/20">
                          {lastExtracted.buildingType || 'فيلا سكنية'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-stone-500 text-[11px] font-bold shrink-0">نوع الخدمة:</span>
                      {isEditMode ? (
                        <select
                          value={lastExtracted.serviceType || 'رخصة بناء جديدة'}
                          onChange={(e) =>
                            handleUpdateLastExtractedField('serviceType', e.target.value)
                          }
                          className="flex-1 bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs font-bold text-stone-900 text-right outline-hidden"
                        >
                          <option value="رخصة بناء جديدة">رخصة بناء جديدة</option>
                          <option value="تصميم مخططات">تصميم مخططات</option>
                          <option value="رخصة ترميم مبنى">رخصة ترميم مبنى</option>
                          <option value="تصحيح وضع قائم">تصحيح وضع قائم</option>
                          <option value="تعديل مكونات">تعديل مكونات</option>
                          <option value="رخصة هدم">رخصة هدم</option>
                        </select>
                      ) : (
                        <span className="font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200">
                          {lastExtracted.serviceType || 'رخصة بناء جديدة'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Suggested Scope Tags */}
                  {lastExtracted.suggestedScopeFlags && (
                    <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
                      <span className="text-[11px] font-bold text-stone-500 block">
                        النطاق والخدمات الموصى بها:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {lastExtracted.suggestedScopeFlags.architectural && (
                          <span className="text-[10px] font-bold bg-white text-stone-800 border border-stone-200 px-1.5 py-0.5 rounded">
                            معماري
                          </span>
                        )}
                        {lastExtracted.suggestedScopeFlags.structural && (
                          <span className="text-[10px] font-bold bg-white text-stone-800 border border-stone-200 px-1.5 py-0.5 rounded">
                            إنشائي
                          </span>
                        )}
                        {lastExtracted.suggestedScopeFlags.electrical && (
                          <span className="text-[10px] font-bold bg-white text-stone-800 border border-stone-200 px-1.5 py-0.5 rounded">
                            كهرباء
                          </span>
                        )}
                        {lastExtracted.suggestedScopeFlags.plumbing && (
                          <span className="text-[10px] font-bold bg-white text-stone-800 border border-stone-200 px-1.5 py-0.5 rounded">
                            صحي
                          </span>
                        )}
                        {lastExtracted.suggestedScopeFlags.buildingLicense && (
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded">
                            رخصة بناء
                          </span>
                        )}
                        {lastExtracted.suggestedScopeFlags.survey && (
                          <span className="text-[10px] font-bold bg-white text-stone-800 border border-stone-200 px-1.5 py-0.5 rounded">
                            رفع مساحي
                          </span>
                        )}
                        {lastExtracted.suggestedScopeFlags.supervision && (
                          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded">
                            إشراف هندسي
                          </span>
                        )}
                        {lastExtracted.suggestedScopeFlags.civilDefense && (
                          <span className="text-[10px] font-bold bg-red-50 text-red-800 border border-red-200 px-1.5 py-0.5 rounded">
                            دفاع مدني
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="p-3.5 bg-stone-100 border-t border-stone-200 space-y-2 shrink-0">
              {appliedSuccessfully ? (
                <div className="bg-emerald-600 text-white font-black py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>تم تطبيق وتعبئة كافة المعطيات في البرنامج بنجاح! ✨</span>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={!lastExtracted}
                    onClick={() => handleApplyToProgram(false)}
                    className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed active:scale-98 text-stone-950 font-black py-2.5 px-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-stone-950" />
                    <span>تطبيق وتعبئة كافة الخانات في البرنامج ⚡</span>
                  </button>

                  <button
                    type="button"
                    disabled={!lastExtracted}
                    onClick={() => handleApplyToProgram(true)}
                    className="w-full bg-stone-900 hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed text-amber-300 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    title="تعبئة بيانات المشروع مع إدراج حزمة التصميم والرخصة تلقائياً في السلة"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>تعبئة الخانات + إدراج حزمة التصميم في السلة</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
