import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

// Convert Arabic-Indic and Eastern Arabic numerals to standard Western digits
function normalizeDigits(input: string): string {
  return input
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
    .replace(/٫/g, '.');
}

// Parse compound Arabic written numbers (e.g., "أربعمائة وخمسون" -> 450, "ستمائة وخمسة وعشرون" -> 625)
function parseArabicWrittenNumber(text: string): number {
  if (!text) return 0;
  const s = text.trim();
  let total = 0;

  // Thousands
  if (s.includes('ثلاثة آلاف') || s.includes('ثلاثه الاف')) total += 3000;
  else if (s.includes('ألفين') || s.includes('الفين') || s.includes('ألفان') || s.includes('الفان')) total += 2000;
  else if (s.includes('ألف') || s.includes('الف')) total += 1000;

  // Hundreds
  if (s.includes('تسعمائة') || s.includes('تسعمئة') || s.includes('تسع مائة')) total += 900;
  else if (s.includes('ثمانمائة') || s.includes('ثمانمئة') || s.includes('ثمان مائة')) total += 800;
  else if (s.includes('سبعمائة') || s.includes('سبعمئة') || s.includes('سبع مائة')) total += 700;
  else if (s.includes('ستمائة') || s.includes('ستمئة') || s.includes('ست مائة')) total += 600;
  else if (s.includes('خمسمائة') || s.includes('خمسمئة') || s.includes('خمس مائة')) total += 500;
  else if (s.includes('أربعمائة') || s.includes('اربعمئة') || s.includes('اربعمائة') || s.includes('أربع مائة')) total += 400;
  else if (s.includes('ثلاثمائة') || s.includes('ثلاثمئة') || s.includes('ثلاث مائة')) total += 300;
  else if (s.includes('مائتان') || s.includes('مئتان') || s.includes('مائتين') || s.includes('مئتين')) total += 200;
  else if (s.includes('مائة') || s.includes('مئة')) total += 100;

  // Tens
  if (s.includes('تسعون') || s.includes('تسعين')) total += 90;
  else if (s.includes('ثمانون') || s.includes('ثمانين')) total += 80;
  else if (s.includes('سبعون') || s.includes('سبعين')) total += 70;
  else if (s.includes('ستون') || s.includes('ستين')) total += 60;
  else if (s.includes('خمسون') || s.includes('خمسين')) total += 50;
  else if (s.includes('أربعون') || s.includes('اربعون') || s.includes('أربعين') || s.includes('اربعين')) total += 40;
  else if (s.includes('ثلاثون') || s.includes('ثلاثين')) total += 30;
  else if (s.includes('عشرون') || s.includes('عشرين')) total += 20;

  // Units (1-9) when combined or standalone
  if (/\b(تسعة|تسعه|تسع)\b/.test(s)) total += 9;
  else if (/\b(ثمانية|ثمانيه|ثمان)\b/.test(s)) total += 8;
  else if (/\b(سبعة|سبعه|سبع)\b/.test(s)) total += 7;
  else if (/\b(ستة|سته|ست)\b/.test(s)) total += 6;
  else if (/\b(خمسة|خمسه|خمس)\b/.test(s)) total += 5;
  else if (/\b(أربعة|اربعة|أربع|اربع)\b/.test(s)) total += 4;
  else if (/\b(ثلاثة|ثلاثه|ثلاث)\b/.test(s)) total += 3;

  return total;
}

// Helper to sanitize numeric values like landArea from strings with Arabic digits, units (م٢ / m2), commas, or text
function sanitizeNumber(value: any): number {
  if (typeof value === 'number') return isNaN(value) ? 0 : Math.max(0, value);
  if (!value) return 0;

  // First remove square meter symbols BEFORE digit normalization so "م٢" / "م2" / "m2" does not turn into digit "2"
  let str = String(value)
    .replace(/م\s*[٢2²]/g, ' ')
    .replace(/[mM]\s*[2²]/g, ' ')
    .replace(/متر\s*مربع/g, ' ')
    .trim();

  str = normalizeDigits(str);

  // Handle comma as decimal if ends with ,00 or ,50 (e.g. 450,00 -> 450.00), otherwise remove thousands separators
  str = str.replace(/(\d+),(\d{1,2})(?!\d)/g, (_m, p1, p2) => {
    // If p1 is 3+ digits and p2 is 2 digits, it's a decimal comma like 450,00 or 625,50
    return `${p1}.${p2}`;
  });
  str = str.replace(/,/g, '');

  // Match all numeric tokens in the string
  const matches = str.match(/[0-9]+(?:\.[0-9]+)?/g);
  if (matches && matches.length > 0) {
    const nums = matches.map((m) => parseFloat(m)).filter((n) => !isNaN(n) && n > 0);
    if (nums.length > 0) {
      // If there's a number >= 20 (typical land area or length), prefer it over small stray numbers like "1" or "2"
      const realisticArea = nums.find((n) => n >= 20 && n <= 500000);
      return realisticArea !== undefined ? realisticArea : nums[0];
    }
  }

  // Fallback to compound Arabic written numbers if no digits were present
  return parseArabicWrittenNumber(str);
}

// Extract area from free text or calculate from dimensions if mentioned
function extractAreaFallbackFromText(text: string): number {
  if (!text) return 0;
  const cleaned = normalizeDigits(
    text
      .replace(/م\s*[٢2²]/g, ' متر مربع ')
      .replace(/[mM]\s*[2²]/g, ' متر مربع ')
  );

  // 1. Explicit area patterns in Arabic / English
  const areaPatterns = [
    /(?:مساحة\s*الأرض|المساحة\s*الإجمالية|مساحتها\s*الإجمالية|مساحتها|المساحة\s*بالصك|المساحة\s*الرقمية|مساحة\s*الموقع|المساحة|Area|Plot\s*Area)\s*[:=\-–(]*\s*([0-9]+(?:[.,][0-9]+)?)/i,
    /([0-9]{2,6}(?:\.[0-9]+)?)\s*(?:متر\s*مربع|م\s*مربع|متراً\s*مربعاً|متر)/i,
  ];

  for (const pattern of areaPatterns) {
    const m = cleaned.match(pattern);
    if (m && m[1]) {
      const val = sanitizeNumber(m[1]);
      if (val >= 30 && val <= 500000) return val;
    }
  }

  // 2. Dimension multiplication pattern e.g. "20 × 25" or "20م * 30م" or "20x25"
  const multMatch = cleaned.match(/([0-9]{1,3}(?:\.[0-9]+)?)\s*م?\s*[×xX*]\s*([0-9]{1,3}(?:\.[0-9]+)?)/);
  if (multMatch) {
    const d1 = parseFloat(multMatch[1]);
    const d2 = parseFloat(multMatch[2]);
    if (d1 >= 5 && d2 >= 5 && d1 * d2 >= 30) {
      return Math.round(d1 * d2 * 100) / 100;
    }
  }

  // 3. Extract 4 boundary lengths from Arabic deed/plan text (شمالاً ... بطول X ... شرقاً ... بطول Y)
  const northM = cleaned.match(/شمال(?:اً|ا)?[^0-9]*?(?:بطول|طولها|طوله|طول)\s*([0-9]+(?:\.[0-9]+)?)/);
  const southM = cleaned.match(/جنوب(?:اً|ا)?[^0-9]*?(?:بطول|طولها|طوله|طول)\s*([0-9]+(?:\.[0-9]+)?)/);
  const eastM = cleaned.match(/شرق(?:اً|ا)?[^0-9]*?(?:بطول|طولها|طوله|طول)\s*([0-9]+(?:\.[0-9]+)?)/);
  const westM = cleaned.match(/غرب(?:اً|ا)?[^0-9]*?(?:بطول|طولها|طوله|طول)\s*([0-9]+(?:\.[0-9]+)?)/);

  const nLen = northM ? parseFloat(northM[1]) : 0;
  const sLen = southM ? parseFloat(southM[1]) : 0;
  const eLen = eastM ? parseFloat(eastM[1]) : 0;
  const wLen = westM ? parseFloat(westM[1]) : 0;

  const avgNS = nLen > 0 && sLen > 0 ? (nLen + sLen) / 2 : nLen || sLen;
  const avgEW = eLen > 0 && wLen > 0 ? (eLen + wLen) / 2 : eLen || wLen;
  if (avgNS >= 5 && avgEW >= 5) {
    return Math.round(avgNS * avgEW * 100) / 100;
  }

  // 4. Written Arabic area in text
  const written = parseArabicWrittenNumber(cleaned);
  if (written >= 50) return written;

  return 0;
}

// Normalize serviceType to match the exact labels in UnifiedProjectDataSection and DesignCalculator
function normalizeServiceType(raw?: string): string {
  if (!raw) return 'إصدار رخصة بناء وتصاميم هندسية';
  const s = raw.trim();
  if (s.includes('ترميم')) return 'رخصة ترميم مبنى وتصاميم هندسية';
  if (s.includes('تصحيح') || s.includes('قائم')) return 'تصحيح وضع مبنى قائم وشهادة التحمل الإنشائي';
  if (s.includes('تعديل')) return 'تعديل مكونات البناء وتعديل رخصة البناء';
  if (s.includes('هدم') || s.includes('إزالة')) return 'إصدار رخصة هدم للمبنى';
  if (s.includes('مخططات فقط') || (s.includes('تصميم مخططات') && !s.includes('رخصة'))) {
    return 'تصميم مخططات هندسية';
  }
  return 'إصدار رخصة بناء وتصاميم هندسية';
}

// Normalize buildingType to match the standard labels in the app
function normalizeBuildingType(raw?: string): string {
  if (!raw) return 'فيلا سكنية خاصة';
  const b = raw.trim();
  if (b.includes('مصنع') || b.includes('صناع')) return 'مصنع / منشأة صناعية';
  if (b.includes('مستودع') || b.includes('ورش') || b.includes('هناجر')) return 'ورش ومستودعات تجارية / صناعية';
  if (b.includes('فندق') || b.includes('ضيافة') || b.includes('شقق مفروشة')) return 'فندق / منشأة ضيافة فندقية';
  if (b.includes('محطة') || b.includes('وقود')) return 'محطة وقود وخدمات سيارات';
  if (b.includes('استراحة') || b.includes('شاليه') || b.includes('مزرعة')) return 'استراحة / شاليهات خاصة';
  if (b.includes('تجاري') || b.includes('معرض') || b.includes('مكاتب') || b.includes('إداري')) return 'عمارة تجارية / إدارية';
  if (b.includes('عمارة')) return 'عمارة سكنية متعددة الأدوار';
  return 'فيلا سكنية خاصة';
}

async function startServer() {
  const app = express();

  // Support up to 30mb for high-resolution deed / license scan images
  app.use(express.json({ limit: '30mb' }));
  app.use(express.urlencoded({ extended: true, limit: '30mb' }));

  // Initialize Gemini client on server with required User-Agent
  const apiKey = process.env.GEMINI_API_KEY || '';
  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Five Official Saudi Deed Archetypes supported by the AI Reader
  const PRESET_DEEDS = [
    {
      id: 'borseh_mortgage',
      title: 'صك البورصة العقارية - تمويل ورهن بنكي',
      category: 'وثيقة تملك حديثة (البورصة العقارية)',
      fileName: '______3___3__49248f9a.pdf',
      sampleOwner: 'فهاد مناحي ناصر العجمي',
      sampleId: '1002527164',
      sampleDeedNo: '993318023944',
      sampleArea: 480,
      sampleCity: 'الرياض',
      sampleDistrict: 'اليرموك',
      samplePlot: '2 / 69',
      samplePlan: '2926',
      sampleRestrictions: 'مرهون لشركة الراجحي للتطوير المحدودة بقيمة 1,716,372 ر.س',
      badge: 'تمويل ورهن 🏦',
    },
    {
      id: 'borseh_borders',
      title: 'صك البورصة العقارية - جدول الحدود والأطوال',
      category: 'وثيقة تملك تفصيلية (البورصة العقارية)',
      fileName: '______3___4__dcb99b64.pdf',
      sampleOwner: 'خالد بن عبدالله بن علي باعطيه',
      sampleId: '1067263549',
      sampleDeedNo: '310113011744',
      sampleArea: 598,
      sampleCity: 'الرياض',
      sampleDistrict: 'خنشليلة',
      samplePlot: '206',
      samplePlan: '2303',
      sampleBorders: 'شمالاً شارع 30م بطول 26م | جنوباً قطعة 208 بطول 26م | شرقاً قطعة 205 بطول 23م | غرباً شارع 30م بطول 23م',
      badge: 'جدول الأبعاد 📐',
    },
    {
      id: 'court_deed',
      title: 'صك محكمة الأحوال الشخصية / إنهاءات ووصايا',
      category: 'صك شرعي ممسوح ضوئياً (المحاكم الشرعية)',
      fileName: '______4__00e79f18.pdf',
      sampleOwner: 'الأميرة ساره بنت سعود الكبير بن عبدالعزيز آل سعود',
      sampleId: '1102854856',
      sampleDeedNo: '810702000814',
      sampleArea: 1050,
      sampleCity: 'الرياض',
      sampleDistrict: 'حي النهضة',
      samplePlot: 'عمارة 2590',
      samplePlan: '1353',
      sampleRestrictions: 'صادر عليه وصية من الموصي مالك العقار',
      badge: 'محكمة شرعية ⚖️',
    },
    {
      id: 'barcode_deed',
      title: 'صك كتابة العدل الإلكتروني بالباركود [277]',
      category: 'صك وزارة العدل الحكومي المعتمد',
      fileName: '310108048857__1___1__4e98de86.pdf',
      sampleOwner: 'نوره بنت فهد بن ابراهيم بن بخيت',
      sampleId: '1005770134',
      sampleDeedNo: '310108048857',
      sampleArea: 1050,
      sampleCity: 'الرياض',
      sampleDistrict: 'حي الملقا',
      samplePlot: '1326',
      samplePlan: '2460',
      sampleBorders: 'شمالاً شارع 15م بطول 30م | جنوباً قطعة 1328 بطول 30م | شرقاً شارع 30م بطول 35م | غرباً قطعة 1327 بطول 35م',
      badge: 'باركود عدلي 🏛️',
    },
    {
      id: 'rer_rega',
      title: 'صحيفة عقارية - السجل العقاري RER / REGA',
      category: 'التسجيل العيني للعقار (الهيئة العامة للعقار)',
      fileName: '______2__a37fa023.pdf',
      sampleOwner: 'عبدالمحسن عبدالله عمر آل الشيخ',
      sampleId: '1004389506',
      sampleDeedNo: '9507050272500000 (رقم العقار بالسجل العقاري)',
      sampleArea: 875,
      sampleCity: 'الرياض',
      sampleDistrict: 'حطين',
      samplePlot: '1052',
      samplePlan: '2837',
      sampleRestrictions: 'بلك 87 • تسلسل ملكية سابق: عبدالمجيد آل الشيخ (هبة) • فرز القطعة بأمانة الرياض',
      badge: 'السجل العقاري 🗺️',
    },
  ];

  // API Route to list preset training deeds
  app.get('/api/ai/preset-deeds', (_req, res) => {
    res.json({ success: true, presets: PRESET_DEEDS });
  });

  // AI Deed & Project Data Extraction Route
  app.post('/api/ai/parse-deed', async (req, res) => {
    try {
      const { image, images, text, messages, presetId } = req.body;

      // Build contents parts
      const parts: any[] = [];
      const mediaList: Array<{ data: string; mimeType?: string }> = [];

      // Support loading a preset deed file directly by ID from server assets
      if (presetId) {
        const foundPreset = PRESET_DEEDS.find((p) => p.id === presetId);
        if (foundPreset) {
          const filePath = path.resolve(__dirname, 'public', 'assets', 'aistudio', foundPreset.fileName);
          if (fs.existsSync(filePath)) {
            const fileBuffer = fs.readFileSync(filePath);
            const base64 = fileBuffer.toString('base64');
            mediaList.push({
              data: base64,
              mimeType: 'application/pdf',
            });
          }
        }
      }

      if (Array.isArray(images) && images.length > 0) {
        mediaList.push(...images);
      } else if (image && image.data) {
        mediaList.push(image);
      }

      if (mediaList.length === 0 && !text && (!messages || messages.length === 0)) {
        return res.status(400).json({ error: 'يرجى تقديم صورة الصك أو ملف PDF أو نص البيانات للمساعد' });
      }

      const systemInstruction = `أنت الخبير الهندسي والمساحي الأول المتخصص في قراءة وتفسير الصكوك العقارية، رخص البناء، القرارات المساحية، الكروكيات التنظيمية، والمخططات الهندسية في المملكة العربية السعودية (وفق أنظمة وزارة العدل، منصة ناجز، البورصة العقارية، الهيئة العامة للعقار REGA، السجل العقاري RER، ومنصة بلدي وأمانات المناطق وكود البناء السعودي).

مهمتك الجوهرية: قراءة واستيعاب وتفريغ بيانات الصك العقاري بدقة 100% وبدون أي خطأ في الحقول المخصصة لها، وعلى رأسها **مساحة الأرض الصافية (landArea)** واسم المالك، رقم الهوية، المدينة، الحي، رقم القطعة، رقم المخطط، الحدود والأطوال، والقيود/الرهون، ونوع العقار.

══════════════════════════════════════════════════════════════════════
دليل التدريب الهندسي المتخصص للأنواع الـ 5 الرئيسية للصكوك السعودية:
══════════════════════════════════════════════════════════════════════

1. [النوع الأول: وثيقة تملك عقار إلكترونية حديثة - البورصة العقارية / وزارة العدل (مثل صكوك التمويل والرهن)]:
   - الترويسة: ترويسة البورصة العقارية (Real Estate Market) ووزارة العدل.
   - الباركود والكيو آر كود: يظهران في الزاوية العلوية والسفلية.
   - جدول "البيانات الأساسية":
     * رقم الوثيقة (مثل: 993318023944): ضعه في deedNumber.
     * تاريخ الوثيقة (مثل: 1446/2/14 أو 2024/08/18): ضعه في deedDate.
     * المساحة (مثل: 480): ضعه فوراً في landArea.
     * القيود (مثل: مرهون، لا يوجد قيود).
   - جدول "القيود":
     * القيد: مرهون.
     * الجهة المرتهنة (مثل: شركة الراجحي للتطوير المحدودة شركة شخص واحد).
     * رقم المنشأة (مثل: 7010997174).
     * قيمة الرهن (مثل: 1,716,372 ر.س).
     * يجب استخراج هذا القيد نصياً في deedRestrictions ودمجه في notes (مثال: "العقار مرهون لـ شركة الراجحي للتطوير المحدودة بقيمة 1,716,372 ر.س").
   - جدول "الملاك":
     * الاسم (مثل: فهاد مناحي ناصر العجمي): ضعه في clientName.
     * رقم الهوية (مثل: 1002527164): ضعه في nationalId.
   - جدول "العقار":
     * المدينة (مثل: الرياض): ضعه في projectCity.
     * الحي (مثل: اليرموك): ضعه في district.
     * رقم المخطط (مثل: 2926): ضعه في planNumber.
     * رقم القطعة (مثل: 2 / 69 أو 69 / 2): ضعه في plotNumber.
     * مساحة العقار (م²) (مثل: 480 م²): أكّد landArea = 480.
     * نوع العقار (مثل: قطعة الارض): اجعل buildingType = "فيلا سكنية خاصة" للمساحات السكنية أو حسب الاستعمال.
     * رقم الهوية العقارية (مثل: 1142284605420001): احفظه في notes.
   - نوع الصك deedArchetype: "وثيقة تملك عقار (البورصة العقارية - تمويل ورهن)"

2. [النوع الثاني: وثيقة تملك عقار إلكترونية مع جدول الحدود والأطوال التفصيلي - البورصة العقارية]:
   - الترويسة: "وثيقة تملك عقار" - الرقم والتاريخ في الأعلى.
   - جدول البيانات الأساسية: رقم الوثيقة (310113011744)، تاريخ الوثيقة (1428/11/17 أو 2007/11/27)، المساحة (598 م²).
   - الملاك: الاسم (خالد بن عبدالله بن علي باعطيه)، رقم الهوية (1067263549).
   - العقار: المدينة (الرياض)، الحي (خنشليلة)، رقم المخطط (2303)، رقم القطعة (206)، مساحة العقار (598 م²).
   - جدول "الحدود والأطوال" في أسفل الصك:
     * شمالاً: النوع (شارع)، وصف الحد (عرض 30 م)، الطول (26 ستة وعشرون متر) -> northLength = 26
     * جنوباً: النوع (قطعة)، وصف الحد (رقم 208)، الطول (26 ستة وعشرون متر) -> southLength = 26
     * شرقاً: النوع (قطعة)، وصف الحد (رقم 205)، الطول (23 ثلاثة وعشرون متر) -> eastLength = 23
     * غرباً: النوع (شارع)، وصف الحد (عرض 30 م)، الطول (23 ثلاثة وعشرون متراً) -> westLength = 23
   - صياغة حقل borders: "شمالاً: شارع عرض 30م بطول 26م | جنوباً: قطعة رقم 208 بطول 26م | شرقاً: قطعة رقم 205 بطول 23م | غرباً: شارع عرض 30م بطول 23م".
   - مساحة الأرض landArea = 598.
   - نوع الصك deedArchetype: "وثيقة تملك عقار (البورصة العقارية - جدول الحدود والأطوال)"

3. [النوع الثالث: صكوك المحاكم الشرعية وكتابات العدل (أحوال شخصية / إنهاءات / وقفيات / وصايا / صكوك ممسوحة ضوئياً)]:
   - الترويسة: المملكة العربية السعودية - وزارة العدل - كاتب العدل المكلف بمحكمة الأحوال الشخصية (أو كتابة العدل الأولى أو الثانية).
   - رقم الصك وتاريخه: يُكتب في الترويسة العليا اليمين أو اليسار (مثل: الرقم: 810702000814 التاريخ: 23 / 1 / 1440 هـ)، ويُذكر أحياناً الصك الأساسي في المتن (برقم 310106300795 في 11/11/1427 هـ). استخدم رقم الصك الحديث 810702000814 في deedNumber وتاريخه 23/1/1440 في deedDate.
   - صيغة المتن: "الحمد لله وحده والصلاة والسلام على من لا نبي بعده، وبعد: فإن العمارة / قطعة الأرض رقم 2590 من المخطط رقم 1353 الواقعة في حي النهضة بمدينة الرياض...":
     * رقم القطعة أو العمارة: 2590 -> plotNumber
     * رقم المخطط: 1353 -> planNumber
     * الحي: حي النهضة -> district
     * المدينة: الرياض -> projectCity
     * نوع المبنى: إذا ذُكر "فإن العمارة رقم..." اجعل buildingType = "عمارة سكنية متعددة الأدوار"
   - الحدود والأطوال في المتن:
     * شمالاً: قطعة رقم 2591 بطول: (35) خمسة وثلاثون متر -> northLength = 35
     * جنوباً: شارع عرض 20م بطول: (35) خمسة وثلاثون متر -> southLength = 35
     * شرقاً: قطعة رقم 2589 بطول: (30) ثلاثون متر -> eastLength = 30
     * غرباً: شارع عرض 40م بطول: (30) ثلاثون متر -> westLength = 30
   - المساحة: "ومساحتها: (1050) ألف وخمسون متر مربعاً" -> landArea = 1050
   - المالك: "هي في ملك / الأميرة ساره بنت سعود الكبير بن عبدالعزيز آل سعود ... بموجب سجل مدني رقم 1102854856":
     * الاسم: ساره بنت سعود الكبير بن عبدالعزيز آل سعود (أو الأميرة ساره بنت سعود الكبير) -> clientName
     * السجل المدني: 1102854856 -> nationalId
   - القيود والوصايا: "والعقار صادر عليه وصية من الموصي مالك العقار أعلاه..." -> استخرجها في deedRestrictions و notes.
   - نوع الصك deedArchetype: "صك شرعي (محكمة الأحوال الشخصية / إنهاءات ووصايا)"

4. [النوع الرابع: صكوك كتابة العدل الحكومية المعتمدة بالباركود ومطابع الحكومة (نموذج وزارة العدل [277])]:
   - المظهر: كود باركود عمودي في أعلى اليمين مع تاريخ الصك (مثل: 12/6/1440 هـ) ورقم الصك (مثل: 310108048857) وختم مطابع الحكومة [277].
   - المتن الرسمي:
     "الحمد لله وحده والصلاة والسلام على من لا نبي بعده، وبعد: فإن قطعة الارض رقم 1326 من المخطط رقم 2460 الواقع في حي الملقا بمدينة الرياض. وحدودها وأطوالها كالتالي:
     شمالاً: شارع عرض 15م بطول: (30) ثلاثون متر -> northLength = 30
     جنوباً: قطعة رقم 1328 بطول: (30) ثلاثون متر -> southLength = 30
     شرقاً: شارع عرض 30م بطول: (35) خمسة وثلاثون متر -> eastLength = 35
     غرباً: قطعة رقم 1327 بطول: (35) خمسة وثلاثون متر -> westLength = 35
     ومساحتها (: 1050) ألف وخمسون متر مربعاً فقط...
     هي في ملك / نوره بنت فهد بن ابراهيم بن بخيت سعودية الجنسية بموجب سجل مدني رقم 1005770134":
     * deedNumber: 310108048857
     * deedDate: 1440/06/12
     * plotNumber: 1326
     * planNumber: 2460
     * district: حي الملقا
     * projectCity: الرياض
     * landArea: 1050
     * clientName: نوره بنت فهد بن ابراهيم بن بخيت
     * nationalId: 1005770134
   - نوع الصك deedArchetype: "صك كتابة العدل الإلكتروني بالباركود [277]"

5. [النوع الخامس: صحيفة عقارية - السجل العقاري RER / الهيئة العامة للعقار REGA (نظام التسجيل العيني الأول)]:
   - الترويسة والشعارات: شعار الهيئة العامة للعقار (REGA) في الأعلى، وشعار السجل العقاري (RER) في الأسفل، مع باركود التحقق وعنوان "صحيفة عقارية".
   - قسم وصف العقار:
     * رقم العقار (16 رقم مثل: 9507050272500000): يمثل الرقم الموحد للعقار في السجل العقاري الوطني؛ ضعه في deedNumber واذكر في notes أنه رقم العقار بالسجل العقاري.
     * تاريخ التسجيل العيني الأول / تاريخ النشر (مثل: 2024-08-14) وتاريخ إصدار النسخة (مثل: 2025/05/21): استخدم تاريخ التسجيل 2024-08-14 في deedDate.
     * اسم المدينة (مثل: الرياض): projectCity
     * اسم الحي (مثل: حطين): district
     * رقم القطعة (مثل: 1052): plotNumber
     * رقم المخطط (مثل: 2837): planNumber
     * رقم البلك (مثل: 87): blockNumber واذكره في notes.
     * المساحة رقماً (مثل: 875): ضعه مباشرة في landArea = 875.
     * استعمال العقار: سكني -> buildingType = "فيلا سكنية خاصة".
     * حالة العقار: مبنى / نوع العقار: مبنى سكني.
   - قسم ملاك العقار:
     * المالك (مثل: عبدالمحسن عبدالله عمر آل الشيخ): clientName
     * نوع الهوية (هوية وطنية) ورقم الهوية (مثل: 1004389506): nationalId
     * نسبة التملك: 100.000%
     * المسجل العقاري وتاريخ التسجيل (مثل: نجود كتيب الشمري - 2025-05-21).
   - قسم تسلسل ملاك العقار والصحائف السابقة (إن وجد):
     * استخرج المالك السابق (مثل: عبدالمجيد عبدالله عمر آل الشيخ - هبة) ومصدر الإجراء (فرز القطعة بأمانة الرياض) واذكرها في notes.
   - الصفحة الثانية (خريطة قطعة الأرض):
     * توضح أبعاد القطعة بوضوح (25م × 35م = 875 م²) مع الشوارع المحيطة، استخدمها لتأكيد الأبعاد.
   - نوع الصك deedArchetype: "صحيفة عقارية - السجل العقاري RER / الهيئة العامة للعقار REGA"

══════════════════════════════════════════════════════════════════════
قواعد هندسية صارمة للحساب والتنظيف:
══════════════════════════════════════════════════════════════════════
- مساحة الأرض (landArea): يجب أن تكون رقماً نقياً بالمتر المربع (بدون نصوص أو م2). إذا كانت الأبعاد موجودة (شمال، جنوب، شرق، غرب) ولم تكن المساحة مكتوبة صراحة، احسبها: متوسط الشمال والجنوب × متوسط الشرق والغرب.
- مسطح البناء (buildingArea): إذا كان صك أرض أو صحيفة عقارية فضاء، مسطح البناء = Math.round(landArea * 1.68). إذا كانت رخصة بناء، استخرج إجمالي مسطحات البناء منها بدقة.
- الحدود والأطوال (borders): صيغة واضحة ووافية تجمع الحدود الأربعة وعروض الشوارع.
- اسم العميل (clientName): الاسم النقي بدون كلمات "السيد" أو "المكرم" أو "المواطن".
- رقم الهوية (nationalId): 10 أرقام مجردة بدون مسافات.
- القيود والرهون (deedRestrictions): سجل الرهن البنكي أو الوصية أو الهبة بوضوح.`;

      for (const media of mediaList) {
        if (media && media.data) {
          const base64Data = media.data.includes('base64,')
            ? media.data.split('base64,')[1]
            : media.data;
          const mimeType = media.mimeType || 'image/jpeg';
          parts.push({
            inlineData: {
              mimeType,
              data: base64Data,
            },
          });
        }
      }

      // Add user prompt and context
      let promptText = text || '';
      if (messages && Array.isArray(messages) && messages.length > 0) {
        const historyText = messages
          .map((m: any) => `${m.role === 'user' ? 'المستخدم' : 'المساعد'}: ${m.content}`)
          .join('\n');
        promptText = `${historyText}\n${promptText ? `رسالة المستخدم الحالية: ${promptText}` : ''}`;
      }

      if (!promptText.trim() && mediaList.length > 0) {
        promptText =
          'افحص وثيقة الصك العقاري أو المخطط المرفق بدقة 100%. حدد نوع الصك (deedArchetype) واستخرج مساحة الأرض الإجمالية (landArea)، وأطوال الأضلاع الأربعة، واسم المالك، ورقم الهوية، والمدينة، والحي، ورقم القطعة، ورقم المخطط، ورقم وتاريخ الصك، والقيود/الرهون، ونوع المبنى لتعبئتها تلقائياً في خانات البرنامج.';
      }

      parts.push({ text: promptText });

      // Build responseSchema with Complete Fields
      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          replyMessage: {
            type: Type.STRING,
            description: 'رسالة ترحيب وشرح هندسي واضح باللغة العربية تلخص ما تم قراءته من الوثيقة (نوع الصك، مساحة الأرض، المالك، المدينة والحي، القطعة والمخطط والرهون إن وجدت) وتؤكد تعبئتها تلقائياً في الخانات.',
          },
          extractedData: {
            type: Type.OBJECT,
            properties: {
              deedArchetype: {
                type: Type.STRING,
                description: 'نوع وطراز الصك المكتشف (مثال: وثيقة تملك عقار (البورصة العقارية)، صك شرعي (محكمة الأحوال الشخصية)، صك كتابة العدل بالباركود [277]، صحيفة عقارية (السجل العقاري RER / REGA)، قرار مساحي، رخصة بناء)',
              },
              documentType: {
                type: Type.STRING,
                description: 'تصنيف الوثيقة (صك إلكتروني، صك ورقي، صحيفة عقارية، رخصة بناء، كروكي)',
              },
              rawAreaText: {
                type: Type.STRING,
                description: 'النص أو الرقم الحرفي لمساحة الأرض كما هو مسجل في الصك بالأرقام والحروف',
              },
              northLength: {
                type: Type.NUMBER,
                description: 'طول الضلع الشمالي بالمتر (0 إذا غير مذكور)',
              },
              southLength: {
                type: Type.NUMBER,
                description: 'طول الضلع الجنوبي بالمتر (0 إذا غير مذكور)',
              },
              eastLength: {
                type: Type.NUMBER,
                description: 'طول الضلع الشرقي بالمتر (0 إذا غير مذكور)',
              },
              westLength: {
                type: Type.NUMBER,
                description: 'طول الضلع الغربي بالمتر (0 إذا غير مذكور)',
              },
              landArea: {
                type: Type.NUMBER,
                description: 'مساحة الأرض الإجمالية النهائية الصافية كرقم نقي بالمتر المربع.',
              },
              buildingArea: {
                type: Type.NUMBER,
                description: 'مسطح البناء الإجمالي بالمتر المربع (من الرخصة أو مساحة الأرض × 1.68).',
              },
              clientName: { type: Type.STRING, description: 'اسم العميل أو المالك بالكامل كما في الصك' },
              nationalId: { type: Type.STRING, description: 'رقم الهوية الوطنية (10 أرقام) أو السجل التجاري' },
              phone: { type: Type.STRING, description: 'رقم الجوال إن وجد' },
              projectCity: { type: Type.STRING, description: 'اسم المدينة (مثال: الرياض)' },
              district: { type: Type.STRING, description: 'اسم الحي (مثال: اليرموك، خنشليلة، حي النهضة، حي الملقا، حطين)' },
              plotNumber: { type: Type.STRING, description: 'رقم القطعة أو العمارة بدقة (مثال: 69 / 2 أو 206 أو 2590 أو 1326 أو 1052)' },
              planNumber: { type: Type.STRING, description: 'رقم المخطط المعتمد بدقة (مثال: 2926 أو 2303 أو 1353 أو 2460 أو 2837)' },
              blockNumber: { type: Type.STRING, description: 'رقم البلك إن وجد (مثل: 87)' },
              deedNumber: { type: Type.STRING, description: 'رقم الصك العقاري أو رقم الوثيقة أو رقم العقار بالسجل العقاري' },
              deedDate: { type: Type.STRING, description: 'تاريخ الصك أو التسجيل (هجري أو ميلادي)' },
              deedRestrictions: { type: Type.STRING, description: 'القيود، الرهون، الوصايا، أو الأوقاف المسجلة على الصك إن وجدت (مثل: مرهون لشركة الراجحي للتطوير المحدودة بمبلغ 1,716,372 ر.س)' },
              buildingType: { type: Type.STRING, description: 'نوع المبنى المحدد بدقة (فيلا سكنية خاصة، عمارة سكنية، عمارة تجارية...)' },
              serviceType: { type: Type.STRING, description: 'نوع الخدمة الهندسية المحددة' },
              projectTitle: { type: Type.STRING, description: 'عنوان المشروع المقترح' },
              borders: { type: Type.STRING, description: 'ملخص الحدود والأطوال الأربعة وعروض الشوارع بالتفصيل' },
              notes: { type: Type.STRING, description: 'الملاحظات والقيود والاشتراطات المستخرجة' },
              suggestedScopeFlags: {
                type: Type.OBJECT,
                properties: {
                  survey: { type: Type.BOOLEAN },
                  architectural: { type: Type.BOOLEAN },
                  structural: { type: Type.BOOLEAN },
                  electrical: { type: Type.BOOLEAN },
                  plumbing: { type: Type.BOOLEAN },
                  hvac: { type: Type.BOOLEAN },
                  civilDefense: { type: Type.BOOLEAN },
                  buildingLicense: { type: Type.BOOLEAN },
                  supervision: { type: Type.BOOLEAN },
                  asBuiltCorrection: { type: Type.BOOLEAN },
                  modifyComponents: { type: Type.BOOLEAN },
                },
                required: [
                  'survey',
                  'architectural',
                  'structural',
                  'electrical',
                  'plumbing',
                  'hvac',
                  'civilDefense',
                  'buildingLicense',
                  'supervision',
                ],
              },
            },
            required: [
              'deedArchetype',
              'documentType',
              'rawAreaText',
              'northLength',
              'southLength',
              'eastLength',
              'westLength',
              'landArea',
              'buildingArea',
              'clientName',
              'nationalId',
              'phone',
              'projectCity',
              'district',
              'plotNumber',
              'planNumber',
              'deedNumber',
              'deedDate',
              'deedRestrictions',
              'buildingType',
              'serviceType',
              'projectTitle',
              'borders',
              'notes',
              'suggestedScopeFlags',
            ],
          },
        },
        required: ['replyMessage', 'extractedData'],
      };

      // Call Gemini with low thinking latency and retry on temporary demand spikes
      let geminiResponse: any = null;
      const modelsToTry = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
      let lastError: any = null;

      for (const modelName of modelsToTry) {
        try {
          geminiResponse = await ai.models.generateContent({
            model: modelName,
            contents: { parts },
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              responseSchema,
              temperature: 0.1,
              ...(modelName.startsWith('gemini-3')
                ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
                : {}),
            },
          });
          if (geminiResponse && geminiResponse.text) {
            break;
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`Model ${modelName} with schema failed, trying next model:`, err?.message || err);
          await new Promise((r) => setTimeout(r, 250));
        }
      }

      if (!geminiResponse || !geminiResponse.text) {
        throw lastError || new Error('تعذر معالجة الطلب عبر نموذج الذكاء الاصطناعي');
      }

      const responseText = geminiResponse.text.trim();
      let parsedJson: any = null;
      try {
        parsedJson = JSON.parse(responseText);
      } catch (parseErr) {
        const cleaned = responseText.replace(/```json\n?|\n?```/g, '').trim();
        parsedJson = JSON.parse(cleaned);
      }

      // Handle case if model returned flat object without extractedData wrapper
      if (parsedJson && !parsedJson.extractedData && (parsedJson.landArea !== undefined || parsedJson.clientName !== undefined)) {
        parsedJson = {
          replyMessage: parsedJson.replyMessage || 'تم قراءة واستخراج بيانات الصك والمخطط بنجاح.',
          extractedData: parsedJson,
        };
      }

      // Server-side multi-stage post-processing to guarantee accurate landArea and all fields
      if (parsedJson && parsedJson.extractedData) {
        const ext = parsedJson.extractedData;

        // Stage 1: Direct landArea sanitization
        let resolvedLandArea = sanitizeNumber(ext.landArea);

        // Stage 2: Recover from rawAreaText if landArea was 0 or unrealistically small (< 20 m²)
        if (resolvedLandArea < 20 && ext.rawAreaText) {
          const fromRaw = sanitizeNumber(ext.rawAreaText) || extractAreaFallbackFromText(String(ext.rawAreaText));
          if (fromRaw >= 20) {
            resolvedLandArea = fromRaw;
          }
        }

        // Stage 3: Calculate geometrically from extracted 4 boundary lengths (northLength, southLength, eastLength, westLength)
        const nLen = sanitizeNumber(ext.northLength);
        const sLen = sanitizeNumber(ext.southLength);
        const eLen = sanitizeNumber(ext.eastLength);
        const wLen = sanitizeNumber(ext.westLength);
        if (resolvedLandArea < 20) {
          const avgNS = nLen > 0 && sLen > 0 ? (nLen + sLen) / 2 : nLen || sLen;
          const avgEW = eLen > 0 && wLen > 0 ? (eLen + wLen) / 2 : eLen || wLen;
          if (avgNS >= 4 && avgEW >= 4) {
            resolvedLandArea = Math.round(avgNS * avgEW * 100) / 100;
          }
        }

        // Stage 4: Fallback regex search in borders, notes, replyMessage, and input text
        if (resolvedLandArea < 20) {
          const combinedSources = [
            ext.borders,
            ext.notes,
            parsedJson.replyMessage,
            text,
          ]
            .filter(Boolean)
            .join(' | ');
          const fromFallback = extractAreaFallbackFromText(combinedSources);
          if (fromFallback >= 20) {
            resolvedLandArea = fromFallback;
          }
        }

        ext.landArea = Math.round(resolvedLandArea * 100) / 100;

        // Clean or compute buildingArea
        const rawBuildingArea = sanitizeNumber(ext.buildingArea);
        if (!rawBuildingArea || rawBuildingArea < 20) {
          if (ext.landArea > 0) {
            ext.buildingArea = Math.round(ext.landArea * 1.68);
          } else {
            ext.buildingArea = 0;
          }
        } else {
          ext.buildingArea = Math.round(rawBuildingArea);
        }

        // Clean strings & remove placeholder words like "غير مذكور" or "لا يوجد" or "null"
        const cleanField = (val: any): string => {
          if (val === null || val === undefined) return '';
          const s = normalizeDigits(String(val)).trim();
          if (
            !s ||
            s === 'null' ||
            s === 'undefined' ||
            s === 'غير مذكور' ||
            s === 'غير محدد' ||
            s === 'غير مسجل' ||
            s === 'لا يوجد' ||
            s === '-' ||
            s === 'N/A'
          ) {
            return '';
          }
          return s;
        };

        ext.clientName = cleanField(ext.clientName);
        ext.projectCity = cleanField(ext.projectCity)
          .replace(/^مدينة\s+/, '')
          .replace(/^محافظة\s+/, '')
          .trim() || 'الرياض';
        ext.district = cleanField(ext.district);
        if (ext.district && !ext.district.startsWith('حي ')) {
          ext.district = `حي ${ext.district}`;
        }
        ext.plotNumber = cleanField(ext.plotNumber).replace(/^(قطعة|رقم القطعة|قطعة رقم)\s*/i, '').trim();
        ext.planNumber = cleanField(ext.planNumber).replace(/^(مخطط|رقم المخطط|مخطط رقم)\s*/i, '').trim();
        ext.deedNumber = cleanField(ext.deedNumber);
        ext.deedDate = cleanField(ext.deedDate);
        ext.borders = cleanField(ext.borders);
        ext.notes = cleanField(ext.notes);

        // If borders is empty but we have lengths, build a clean borders string
        if (!ext.borders && (nLen > 0 || sLen > 0 || eLen > 0 || wLen > 0)) {
          const bParts: string[] = [];
          if (nLen > 0) bParts.push(`شمالاً: بطول ${nLen}م`);
          if (sLen > 0) bParts.push(`جنوباً: بطول ${sLen}م`);
          if (eLen > 0) bParts.push(`شرقاً: بطول ${eLen}م`);
          if (wLen > 0) bParts.push(`غرباً: بطول ${wLen}م`);
          ext.borders = bParts.join(' | ');
        }

        if (ext.phone) {
          ext.phone = cleanField(ext.phone)
            .replace(/[^\d+]/g, '')
            .trim();
        } else {
          ext.phone = '';
        }

        if (ext.nationalId) {
          ext.nationalId = cleanField(ext.nationalId)
            .replace(/[^\d]/g, '')
            .trim();
        } else {
          ext.nationalId = '';
        }

        ext.deedArchetype = cleanField(ext.deedArchetype) || 'صك عقاري معتمد';
        ext.deedRestrictions = cleanField(ext.deedRestrictions);
        ext.blockNumber = cleanField(ext.blockNumber);

        // Enrich notes with archetype, restrictions, and block number
        const notesElements: string[] = [];
        if (ext.deedArchetype) notesElements.push(`نوع الصك: ${ext.deedArchetype}`);
        if (ext.deedRestrictions) notesElements.push(`القيود والرهون: ${ext.deedRestrictions}`);
        if (ext.blockNumber) notesElements.push(`بلك: ${ext.blockNumber}`);
        if (ext.notes) notesElements.push(ext.notes);
        ext.notes = notesElements.join(' • ');

        // Normalize buildingType and serviceType to match the app's exact standard values
        ext.buildingType = normalizeBuildingType(ext.buildingType);
        ext.serviceType = normalizeServiceType(ext.serviceType);

        // Build clean projectTitle
        ext.projectTitle = `مشروع ${ext.buildingType}${ext.district ? ` - ${ext.district}` : ''}`;
      }

      return res.json(parsedJson);
    } catch (error: any) {
      console.error('AI Deed Extraction Error:', error);
      return res.status(500).json({
        error: error?.message || 'حدث خطأ أثناء تحليل الصك بالذكاء الاصطناعي',
      });
    }
  });

  // --- ARCHIVE PERSISTENCE HELPERS & ENDPOINTS ---
  const DATA_DIR = path.resolve(__dirname, 'data');
  const ARCHIVE_FILE = path.join(DATA_DIR, 'saved_quotations.json');

  function readArchiveFromDisk(): any[] {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (!fs.existsSync(ARCHIVE_FILE)) {
        fs.writeFileSync(ARCHIVE_FILE, JSON.stringify([], null, 2), 'utf-8');
        return [];
      }
      const raw = fs.readFileSync(ARCHIVE_FILE, 'utf-8');
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      console.error('Error reading archive from disk:', err);
      return [];
    }
  }

  function writeArchiveToDisk(quotes: any[]): boolean {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tempFile = `${ARCHIVE_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(quotes, null, 2), 'utf-8');
      fs.renameSync(tempFile, ARCHIVE_FILE);
      return true;
    } catch (err) {
      console.error('Error writing archive to disk:', err);
      return false;
    }
  }

  // 1. Get all saved quotations from server disk
  app.get('/api/archive', (_req, res) => {
    const list = readArchiveFromDisk();
    res.json({ success: true, count: list.length, quotations: list });
  });

  // 2. Save or update a quotation to server disk
  app.post('/api/archive', (req, res) => {
    const newQuote = req.body;
    if (!newQuote || !newQuote.id) {
      return res.status(400).json({ error: 'Quotation id is required' });
    }
    const current = readArchiveFromDisk();
    const existingIndex = current.findIndex(
      (q: any) => q.id === newQuote.id || (q.quoteNumber && q.quoteNumber === newQuote.quoteNumber)
    );
    if (existingIndex >= 0) {
      current[existingIndex] = { ...current[existingIndex], ...newQuote, updatedAt: new Date().toISOString() };
    } else {
      current.unshift({ ...newQuote, updatedAt: new Date().toISOString() });
    }
    writeArchiveToDisk(current);
    res.json({ success: true, quotation: newQuote, count: current.length });
  });

  // 3. Batch sync / merge quotations between client and server disk
  app.post('/api/archive/sync', (req, res) => {
    const clientQuotes = Array.isArray(req.body?.quotations) ? req.body.quotations : [];
    const serverQuotes = readArchiveFromDisk();
    const map = new Map<string, any>();

    // Put server quotes first
    for (const q of serverQuotes) {
      const key = q.id || q.quoteNumber;
      if (key) map.set(key, q);
    }
    // Merge client quotes
    for (const q of clientQuotes) {
      const key = q.id || q.quoteNumber;
      if (key) {
        if (map.has(key)) {
          const existing = map.get(key);
          map.set(key, { ...existing, ...q });
        } else {
          map.set(key, q);
        }
      }
    }
    const merged = Array.from(map.values());
    writeArchiveToDisk(merged);
    res.json({ success: true, count: merged.length, quotations: merged });
  });

  // 4. Delete quotation from server disk (Exclusively permitted for M. Maged)
  app.delete('/api/archive/:id', (req, res) => {
    const rawEngineer = (req.headers['x-engineer-name'] as string) || '';
    let engineer = '';
    try {
      engineer = decodeURIComponent(rawEngineer);
    } catch {
      engineer = rawEngineer;
    }

    const isAuthorizedAdmin =
      engineer.includes('ماجد') ||
      engineer.includes('نور') ||
      engineer.includes('اصال') ||
      engineer.includes('أصال') ||
      engineer.includes('إصال');

    if (engineer && !isAuthorizedAdmin) {
      return res.status(403).json({
        success: false,
        error: 'صلاحية حذف عروض الأسعار من الأرشيف مخصصة حصرياً للإدارة (م.ماجد / م.نور / م.اصالة)',
      });
    }

    const id = req.params.id;
    const current = readArchiveFromDisk();
    const filtered = current.filter((q: any) => q.id !== id && q.quoteNumber !== id);
    writeArchiveToDisk(filtered);
    res.json({ success: true, count: filtered.length });
  });

  // 5. Batch delete quotations from server disk (Exclusively permitted for M. Maged)
  app.post('/api/archive/batch-delete', (req, res) => {
    const rawEngineer = (req.headers['x-engineer-name'] as string) || '';
    let engineer = '';
    try {
      engineer = decodeURIComponent(rawEngineer);
    } catch {
      engineer = rawEngineer;
    }

    const isAuthorizedAdmin =
      engineer.includes('ماجد') ||
      engineer.includes('نور') ||
      engineer.includes('اصال') ||
      engineer.includes('أصال') ||
      engineer.includes('إصال');

    if (engineer && !isAuthorizedAdmin) {
      return res.status(403).json({
        success: false,
        error: 'صلاحية حذف عروض الأسعار من الأرشيف مخصصة حصرياً للإدارة (م.ماجد / م.نور / م.اصالة)',
      });
    }

    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    if (ids.length === 0) {
      return res.json({ success: true, count: 0, deletedCount: 0 });
    }

    const idSet = new Set(ids);
    const current = readArchiveFromDisk();
    const filtered = current.filter((q: any) => !idSet.has(q.id) && !idSet.has(q.quoteNumber));
    writeArchiveToDisk(filtered);
    res.json({ success: true, count: filtered.length, deletedCount: current.length - filtered.length });
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Setup Vite in development or static serve in production
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal Server Boot Error:', err);
  process.exit(1);
});
