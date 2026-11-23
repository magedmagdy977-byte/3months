import { BankAccountDetails, CompanyId } from '../types';

export interface CompanyProfile {
  id: CompanyId;
  shortNameAr: string;
  fullNameAr: string;
  groupNameAr: string;
  fullTitleAr: string;
  subtitleAr: string;
  shortNameEn: string;
  englishWord1: string;
  englishWord2: string;
  englishSubtitle: string;
  englishFull: string;
  appTitleAr: string;
  headerSubtitleAr: string;
  credentialsLineAr: string;
  crNumber: string;
  email: string;
  addressAr: string;
  contractPrefix: string;
  secondPartyText: string;
  defaultBankDetails: BankAccountDetails;
  colors: {
    primary: string;
    accent: string;
    primaryHex: string; // Without '#' for docx
    accentHex: string; // Without '#' for docx
    ribbonBg: string;
    ribbonAccent: string;
  };
}

export const STORAGE_KEY_ACTIVE_COMPANY = 'alroaya_active_company_v1';

export const COMPANIES: Record<CompanyId, CompanyProfile> = {
  luminous: {
    id: 'luminous',
    shortNameAr: 'الرؤية المضيئة',
    fullNameAr: 'شركة الرؤية المضيئة للاستشارات الهندسية',
    groupNameAr: 'مجموعة شركات الرؤية المضيئة',
    fullTitleAr: 'مجموعة شركات الرؤية المضيئة للاستشارات الهندسية والتصميم',
    subtitleAr: 'للاستشارات الهندسية والتصميم',
    shortNameEn: 'LUMINOUS VISION',
    englishWord1: 'LUMINOUS',
    englishWord2: 'VISION',
    englishSubtitle: 'ENGINEERING CONSULTANCY',
    englishFull: 'LUMINOUS VISION Engineering & Design Consultancy',
    appTitleAr: 'تسعير الرؤية المضيئة',
    headerSubtitleAr: 'مجموعة شركات الرؤية المضيئة للاستشارات الهندسية • التسعير المعتمد',
    credentialsLineAr:
      'تصميم معماري وإنشائي وكهروميكانيكي • كود البناء السعودي SBC • رخص بلدي • إشراف هندسي • دفاع مدني',
    crNumber: '1010788646',
    email: 'lv2000design@gmail.com',
    addressAr: 'مدينة الرياض – حي الملقا – طريق محمد بن سعد بن عبد العزيز',
    contractPrefix: 'LV',
    secondPartyText:
      'شركة الرؤية المضيئة للاستشارات الهندسية – سجل تجاري رقم (1010788646)، عنوانها مدينة الرياض – حي الملقا – طريق محمد بن سعد بن عبد العزيز، بريد الكتروني (lv2000design@gmail.com)، ويشار إليه فيما بعد بالطرف الثاني أو الاستشاري.',
    defaultBankDetails: {
      bankName: 'البنك السعودي للاستثمار',
      accountName: 'شركة الرؤية المضيئة للاستشارات الهندسية',
      iban: 'SA83 6500 0000 1383 4937 6001',
      accountNumber: '0138-349376-001',
    },
    colors: {
      primary: '#433c71',
      accent: '#e37725',
      primaryHex: '433C71',
      accentHex: 'E37725',
      ribbonBg: '#2C3E4C',
      ribbonAccent: '#F0A429',
    },
  },
  arq: {
    id: 'arq',
    shortNameAr: 'أرك للاستشارات الهندسية',
    fullNameAr: 'شركة أرك للاستشارات الهندسية',
    groupNameAr: 'شركة أرك للاستشارات الهندسية',
    fullTitleAr: 'شركة أرك للاستشارات الهندسية',
    subtitleAr: 'للاستشارات الهندسية والتصميم',
    shortNameEn: 'ARQ',
    englishWord1: 'ARQ',
    englishWord2: 'ENGINEERING CONSULTANCY',
    englishSubtitle: 'ENGINEERING CONSULTANCY',
    englishFull: 'ARQ Engineering Consultancy',
    appTitleAr: 'تسعير أرك الهندسية',
    headerSubtitleAr: 'شركة أرك للاستشارات الهندسية • التسعير المعتمد',
    credentialsLineAr:
      'تصميم معماري وإنشائي وكهروميكانيكي • كود البناء السعودي SBC • رخص بلدي • إشراف هندسي • دفاع مدني',
    crNumber: '1010788646',
    email: 'lv2000design@gmail.com',
    addressAr: 'مدينة الرياض – حي الملقا – طريق محمد بن سعد بن عبد العزيز',
    contractPrefix: 'ARQ',
    secondPartyText:
      'شركة أرك للاستشارات الهندسية – سجل تجاري رقم (1010788646)، عنوانها مدينة الرياض – حي الملقا – طريق محمد بن سعد بن عبد العزيز، بريد الكتروني (lv2000design@gmail.com)، ويشار إليه فيما بعد بالطرف الثاني أو الاستشاري.',
    defaultBankDetails: {
      bankName: 'البنك السعودي للاستثمار',
      accountName: 'شركة أرك للاستشارات الهندسية',
      iban: 'SA83 6500 0000 1383 4937 6001',
      accountNumber: '0138-349376-001',
    },
    colors: {
      primary: '#1c1917',
      accent: '#a6926b',
      primaryHex: '1C1917',
      accentHex: 'A6926B',
      ribbonBg: '#26282a',
      ribbonAccent: '#a6926b',
    },
  },
};

export const COMPANY_LIST: CompanyProfile[] = [COMPANIES.luminous, COMPANIES.arq];

export function resolveCompanyId(companyId?: CompanyId | string | null): CompanyId {
  return companyId === 'arq' ? 'arq' : 'luminous';
}

export function getCompanyProfile(companyId?: CompanyId | string | null): CompanyProfile {
  return COMPANIES[resolveCompanyId(companyId)];
}

export function getSavedActiveCompanyId(): CompanyId {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_COMPANY);
    if (saved === 'arq' || saved === 'luminous') {
      return saved;
    }
  } catch {
    // ignore
  }
  return 'luminous';
}

export function saveActiveCompanyId(companyId: CompanyId): void {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_COMPANY, companyId);
  } catch {
    // ignore
  }
}

export function isDefaultCompanyAccountName(accountName?: string): boolean {
  if (!accountName || !accountName.trim()) return true;
  const clean = accountName.trim();
  return (
    clean === COMPANIES.luminous.defaultBankDetails.accountName ||
    clean === COMPANIES.arq.defaultBankDetails.accountName ||
    clean === 'شركة مجموعة الرؤية المضيئة للاستشارات الهندسية'
  );
}

export function isDefaultSecondPartyText(text?: string): boolean {
  if (!text || !text.trim()) return true;
  const clean = text.trim();
  return (
    clean === COMPANIES.luminous.secondPartyText ||
    clean === COMPANIES.arq.secondPartyText
  );
}
