import { ClientInfo, QuotationItem } from '../types';

/**
 * Currency and number formatters for Saudi Riyals (SAR)
 */

export function formatSAR(amount: number): string {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ar-SA').format(num);
}

export const STORAGE_KEY_QUOTE_SEQ = 'lv_quote_sequence_v5';
export const MAX_QUOTE_SEQUENCE = 100000;
export const MIN_QUOTE_SEQUENCE = 0;

export function extractQuoteSequence(currentValue?: string): number | null {
  if (currentValue === undefined || currentValue === null) return null;
  const clean = String(currentValue).trim();
  if (clean === '') return null;
  // Pure number check: e.g. "0", "1", "2", "3"
  if (/^\d+$/.test(clean)) {
    const val = parseInt(clean, 10);
    if (!isNaN(val) && val >= MIN_QUOTE_SEQUENCE && val <= MAX_QUOTE_SEQUENCE) {
      return val;
    }
  }
  // Match digits at the end after the last hyphen, slash, or space (e.g., "LV-2026-0" -> 0)
  const match = clean.match(/[-/_\s](\d+)\s*$/);
  if (match) {
    const parsed = parseInt(match[1], 10);
    if (!isNaN(parsed) && parsed >= MIN_QUOTE_SEQUENCE && parsed <= MAX_QUOTE_SEQUENCE) {
      return parsed;
    }
  }
  const allDigits = clean.match(/\d+/g);
  if (allDigits && allDigits.length > 0) {
    const last = parseInt(allDigits[allDigits.length - 1], 10);
    if (!isNaN(last) && last >= MIN_QUOTE_SEQUENCE && last <= MAX_QUOTE_SEQUENCE) {
      return last;
    }
  }
  return null;
}

export function getStoredQuoteSequence(): number {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_QUOTE_SEQ);
    if (saved !== null && saved !== undefined && saved !== '') {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= MIN_QUOTE_SEQUENCE && parsed <= MAX_QUOTE_SEQUENCE) {
        return parsed;
      }
    }
    localStorage.setItem(STORAGE_KEY_QUOTE_SEQ, '0');
  } catch {}
  return 0;
}

export function setStoredQuoteSequence(seq: number): void {
  try {
    const safeSeq = Math.min(MAX_QUOTE_SEQUENCE, Math.max(MIN_QUOTE_SEQUENCE, seq));
    localStorage.setItem(STORAGE_KEY_QUOTE_SEQ, String(safeSeq));
  } catch {}
}

export function generateQuoteNumber(
  increment: boolean = false,
  currentValue?: string,
  targetSeq?: number
): string {
  let currentSeq = targetSeq ?? getStoredQuoteSequence();

  if (targetSeq === undefined && currentValue !== undefined && currentValue !== '') {
    const parsedSeq = extractQuoteSequence(currentValue);
    if (parsedSeq !== null && parsedSeq >= MIN_QUOTE_SEQUENCE && parsedSeq <= MAX_QUOTE_SEQUENCE) {
      currentSeq = parsedSeq;
    }
  }

  if (increment) {
    if (currentSeq >= MAX_QUOTE_SEQUENCE) {
      currentSeq = MAX_QUOTE_SEQUENCE;
    } else {
      currentSeq = currentSeq + 1;
    }
    setStoredQuoteSequence(currentSeq);
  }
  return String(currentSeq);
}

export function incrementQuoteNumber(currentValue?: string): string {
  return generateQuoteNumber(true, currentValue);
}

export function isMaxQuoteSequenceReached(currentValue?: string): boolean {
  const seq = extractQuoteSequence(currentValue) ?? getStoredQuoteSequence();
  return seq >= MAX_QUOTE_SEQUENCE;
}

/**
 * Explicit reset of sequence counter back to 0 without affecting past archive
 */
export function resetStoredQuoteSequence(): void {
  setStoredQuoteSequence(MIN_QUOTE_SEQUENCE);
}

/**
 * Generates the official PDF & download filename:
 * Named directly as the sequential number (0, 1, 2, 3, ... up to 100000)
 */
export function generatePdfFileName(clientInfo: {
  proposalNumber?: string;
  buildingType?: string;
  serviceType?: string;
}): string {
  const quoteNo = clientInfo.proposalNumber ?? generateQuoteNumber(false);
  const seq = extractQuoteSequence(quoteNo);
  if (seq !== null) {
    return String(seq);
  }
  return quoteNo || '0';
}

export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Converts numbers into Arabic text words (Tafqeet) for official invoices
 */
export function tafqeetSAR(amount: number): string {
  const units = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
  const tens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const teens = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
  const hundreds = ['', 'مائة', 'مئتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

  if (amount === 0) return 'صفر ريال سعودي فقط لا غير';

  const intPart = Math.floor(amount);
  if (intPart >= 1000000) {
    return `${formatNumber(intPart)} ريال سعودي فقط لا غير`;
  }

  function convertGroup(n: number): string {
    let result = '';
    const h = Math.floor(n / 100);
    const remainder = n % 100;
    const t = Math.floor(remainder / 10);
    const u = remainder % 10;

    if (h > 0) {
      result += hundreds[h];
    }

    if (remainder > 0) {
      if (h > 0) result += ' و ';
      if (remainder < 10) {
        result += units[remainder];
      } else if (remainder >= 11 && remainder <= 19) {
        result += teens[remainder - 10];
      } else if (remainder === 10) {
        result += 'عشرة';
      } else {
        if (u > 0) {
          result += units[u] + ' و ' + tens[t];
        } else {
          result += tens[t];
        }
      }
    }
    return result;
  }

  let finalWords = '';
  const thousands = Math.floor(intPart / 1000);
  const remainderAfterThousands = intPart % 1000;

  if (thousands > 0) {
    if (thousands === 1) {
      finalWords += 'ألف';
    } else if (thousands === 2) {
      finalWords += 'ألفان';
    } else if (thousands >= 3 && thousands <= 10) {
      finalWords += convertGroup(thousands) + ' آلاف';
    } else {
      finalWords += convertGroup(thousands) + ' ألف';
    }
  }

  if (remainderAfterThousands > 0) {
    if (thousands > 0) finalWords += ' و ';
    finalWords += convertGroup(remainderAfterThousands);
  }

  return `فقط ${finalWords} ريال سعودي لا غير`;
}

export interface QuotationAreaDetails {
  label: string;
  value: string;
  introText: string;
  numericArea: number;
  departmentId?: string;
}

/**
 * Returns the exact context-aware area label, value, and introductory description
 * according to the active department.
 * In Decor: Always uses the actual entered floor area (المساحة الطابقية المدخلة بالفعل).
 * In Execution: Uses built-up area (مسطحات البناء المستهدفة).
 * In Civil Defense: Uses facility area (مساحة المنشأة).
 * In Survey: Uses surveyed land area (مساحة الأرض المرفوعة).
 * In Design: Uses land area (مساحة الأرض ومسطح البناء).
 */
export function getQuotationAreaDetails(
  clientInfo: ClientInfo,
  items: QuotationItem[] = []
): QuotationAreaDetails {
  // 1. Check if the quotation is primarily or exclusively Decor
  const decorItems = items.filter((i) => i.departmentId === 'decor');
  const hasDecor = decorItems.length > 0;
  const isPureDecor =
    items.length > 0
      ? items.every((i) => i.departmentId === 'decor')
      : (clientInfo.serviceType || '').includes('ديكور') ||
        (clientInfo.projectTitle || '').includes('ديكور');

  if (isPureDecor || (hasDecor && items.length === 1)) {
    const decorSum = decorItems.reduce((acc, curr) => acc + (curr.area || 0), 0);
    const rawArea = decorSum > 0 ? decorSum : (clientInfo.floorArea || 350);
    return {
      label: 'المساحة الطابقية:',
      value: `${formatNumber(rawArea)} م²`,
      introText: `والبالغ إجمالي المساحة الطابقية المشمولة بالتصميم الداخلي (${formatNumber(rawArea)} م²)`,
      numericArea: rawArea,
      departmentId: 'decor',
    };
  }

  // 2. Execution (قسم التنفيذ)
  const isPureExecution =
    items.length > 0
      ? items.every((i) => i.departmentId === 'execution')
      : (clientInfo.serviceType || '').includes('تنفيذ');
  const execItem = items.find((i) => i.departmentId === 'execution');

  if (isPureExecution && execItem) {
    const rawArea = execItem?.area || clientInfo.buildingArea || clientInfo.landArea || 650;
    return {
      label: 'مسطحات البناء المستهدفة:',
      value: `${formatNumber(rawArea)} م²`,
      introText: `والبالغ إجمالي مسطحات البناء المستهدفة للتنفيذ (${formatNumber(rawArea)} م²)`,
      numericArea: rawArea,
      departmentId: 'execution',
    };
  }

  // 3. Civil Defense (قسم الدفاع المدني)
  const isPureCivilDefense =
    items.length > 0
      ? items.every((i) => i.departmentId === 'civil_defense')
      : (clientInfo.serviceType || '').includes('دفاع مدني') ||
        (clientInfo.serviceType || '').includes('سلامة');
  const cdItem = items.find((i) => i.departmentId === 'civil_defense');

  if (isPureCivilDefense && cdItem) {
    const rawArea = cdItem?.area || clientInfo.landArea || 500;
    return {
      label: 'مساحة المنشأة / المبنى:',
      value: `${formatNumber(rawArea)} م²`,
      introText: `والبالغ إجمالي مساحة المنشأة المشمولة بالاعتماد (${formatNumber(rawArea)} م²)`,
      numericArea: rawArea,
      departmentId: 'civil_defense',
    };
  }

  // 4. Survey (قسم المساحة)
  const isPureSurvey =
    items.length > 0
      ? items.every((i) => i.departmentId === 'survey')
      : (clientInfo.serviceType || '').includes('مساح') ||
        (clientInfo.serviceType || '').includes('كروكي');
  const surveyItem = items.find((i) => i.departmentId === 'survey');

  if (isPureSurvey && surveyItem) {
    const rawArea = surveyItem?.area || clientInfo.landArea || 600;
    return {
      label: 'مساحة الأرض المرفوعة:',
      value: `${formatNumber(rawArea)} م²`,
      introText: `والبالغ إجمالي مساحة أرض المشروع المستهدفة بالرفع المساحي (${formatNumber(rawArea)} م²)`,
      numericArea: rawArea,
      departmentId: 'survey',
    };
  }

  // 5. Supervision (قسم الإشراف)
  const isPureSupervision =
    items.length > 0
      ? items.every((i) => i.departmentId === 'supervision')
      : (clientInfo.serviceType || '').includes('إشراف');
  const supItem = items.find((i) => i.departmentId === 'supervision');

  if (isPureSupervision && supItem) {
    const rawArea = supItem?.area || clientInfo.landArea || 600;
    return {
      label: 'مساحة المشروع:',
      value: `${formatNumber(rawArea)} م²`,
      introText: `والبالغ إجمالي مساحة موقع المشروع (${formatNumber(rawArea)} م²)`,
      numericArea: rawArea,
      departmentId: 'supervision',
    };
  }

  // 6. Design & Default Standard Engineering (قسم التصميم والمخططات والرخص)
  const land = clientInfo.landArea || 0;
  const bldg = clientInfo.buildingArea;
  return {
    label: 'مساحة الأرض:',
    value: `${formatNumber(land)} م²${bldg ? ` (${formatNumber(bldg)} م²)` : ''}`,
    introText: `والبالغ إجمالي مساحة أرض المشروع (${formatNumber(land)} م²)${
      bldg ? ` وبمسطح بناء إجمالي تقديري يبلغ (${formatNumber(bldg)} م²)` : ''
    }`,
    numericArea: land,
    departmentId: 'design',
  };
}
