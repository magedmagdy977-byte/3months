import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { UserSession } from '../types';

const STORAGE_KEY_SESSION = 'luminous_user_session_v1';
const STORAGE_KEY_PASSCODE = 'luminous_office_passcode_v1';
const STORAGE_KEY_CUSTOMIZED = 'luminous_passcode_customized_v1';
const STORAGE_KEY_AUTHORIZED_USERS = 'luminous_authorized_users_v2';

// Default authorized users for Luminous Vision
export const DEFAULT_AUTHORIZED_USERS = [
  'م.ماجد',
  'م.نور',
  'م.اصالة',
  'م.عبدالقادر',
  'م.يسرا',
  'م.يوسف',
  'م.فادي',
  'م.لحد ما يجي',
];

// In-memory cache
let cachedOfficePasscode: string = (() => {
  try {
    return localStorage.getItem(STORAGE_KEY_PASSCODE) || '2026';
  } catch {
    return '2026';
  }
})();

let cachedIsCustomized: boolean = (() => {
  try {
    return localStorage.getItem(STORAGE_KEY_CUSTOMIZED) === 'true';
  } catch {
    return false;
  }
})();

let cachedAuthorizedUsers: string[] = (() => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTHORIZED_USERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        let changed = false;
        if (!parsed.some((u: string) => u.includes('نور'))) {
          const majedIdx = parsed.findIndex((u: string) => u.includes('ماجد'));
          if (majedIdx !== -1) {
            parsed.splice(majedIdx + 1, 0, 'م.نور');
          } else {
            parsed.unshift('م.نور');
          }
          changed = true;
        }
        if (!parsed.some((u: string) => u.includes('اصال') || u.includes('أصال'))) {
          const nourIdx = parsed.findIndex((u: string) => u.includes('نور'));
          const majedIdx = parsed.findIndex((u: string) => u.includes('ماجد'));
          if (nourIdx !== -1) {
            parsed.splice(nourIdx + 1, 0, 'م.اصالة');
          } else if (majedIdx !== -1) {
            parsed.splice(majedIdx + 1, 0, 'م.اصالة');
          } else {
            parsed.unshift('م.اصالة');
          }
          changed = true;
        }
        if (!parsed.includes('م.فادي')) {
          const idx = parsed.indexOf('م.لحد ما يجي');
          if (idx !== -1) {
            parsed.splice(idx, 0, 'م.فادي');
          } else {
            parsed.push('م.فادي');
          }
          changed = true;
        }
        if (changed) {
          try {
            localStorage.setItem(STORAGE_KEY_AUTHORIZED_USERS, JSON.stringify(parsed));
          } catch {}
        }
        return parsed;
      }
    }
  } catch {}
  return [...DEFAULT_AUTHORIZED_USERS];
})();

// Real-time listener for Firestore security configuration
export function initPasscodeListener(
  onUpdated?: (data: { passcode: string; isCustomized: boolean; authorizedUsers: string[] }) => void
) {
  try {
    const docRef = doc(db, 'app_settings', 'security');
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data) {
            if (data.officePasscode) {
              cachedOfficePasscode = String(data.officePasscode).trim();
              try {
                localStorage.setItem(STORAGE_KEY_PASSCODE, cachedOfficePasscode);
              } catch {}
            }
            if (typeof data.isCustomized === 'boolean') {
              cachedIsCustomized = data.isCustomized;
              try {
                localStorage.setItem(STORAGE_KEY_CUSTOMIZED, String(cachedIsCustomized));
              } catch {}
            }
            if (Array.isArray(data.authorizedUsers) && data.authorizedUsers.length > 0) {
              const hasOldMockNames = data.authorizedUsers.some(
                (u: string) => u.includes('م. أحمد') || u.includes('م. إبراهيم') || u.includes('م. خالد')
              );
              if (hasOldMockNames) {
                cachedAuthorizedUsers = [...DEFAULT_AUTHORIZED_USERS];
                setDoc(docRef, { authorizedUsers: DEFAULT_AUTHORIZED_USERS }, { merge: true }).catch(() => {});
              } else {
                let list = [...data.authorizedUsers];
                let changed = false;
                if (!list.some((u: string) => u.includes('نور'))) {
                  const majedIdx = list.findIndex((u: string) => u.includes('ماجد'));
                  if (majedIdx !== -1) {
                    list.splice(majedIdx + 1, 0, 'م.نور');
                  } else {
                    list.unshift('م.نور');
                  }
                  changed = true;
                }
                if (!list.some((u: string) => u.includes('اصال') || u.includes('أصال'))) {
                  const nourIdx = list.findIndex((u: string) => u.includes('نور'));
                  const majedIdx = list.findIndex((u: string) => u.includes('ماجد'));
                  if (nourIdx !== -1) {
                    list.splice(nourIdx + 1, 0, 'م.اصالة');
                  } else if (majedIdx !== -1) {
                    list.splice(majedIdx + 1, 0, 'م.اصالة');
                  } else {
                    list.unshift('م.اصالة');
                  }
                  changed = true;
                }
                if (!list.includes('م.فادي')) {
                  const idx = list.indexOf('م.لحد ما يجي');
                  if (idx !== -1) {
                    list = [...list.slice(0, idx), 'م.فادي', ...list.slice(idx)];
                  } else {
                    list = [...list, 'م.فادي'];
                  }
                  changed = true;
                }
                if (changed) {
                  setDoc(docRef, { authorizedUsers: list }, { merge: true }).catch(() => {});
                }
                cachedAuthorizedUsers = list;
              }
              try {
                localStorage.setItem(STORAGE_KEY_AUTHORIZED_USERS, JSON.stringify(cachedAuthorizedUsers));
              } catch {}
            } else {
              setDoc(docRef, { authorizedUsers: DEFAULT_AUTHORIZED_USERS }, { merge: true }).catch(() => {});
            }
            if (onUpdated) {
              onUpdated({
                passcode: cachedOfficePasscode,
                isCustomized: cachedIsCustomized,
                authorizedUsers: cachedAuthorizedUsers,
              });
            }
          }
        }
      },
      (err) => {
        console.warn('Security settings Firestore sync error, using local/default:', err);
      }
    );
  } catch (e) {
    console.warn('Error starting security listener:', e);
    return () => {};
  }
}

/**
 * Normalizes Arabic strings for comparison (removes diacritics, extra spaces, standardizes hamzas)
 */
function normalizeArabic(str: string): string {
  return str
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .toLowerCase();
}

/**
 * Checks if a user is an admin (م.ماجد أو م.نور أو م.اصالة)
 */
export function isUserPrimaryAdmin(userName?: string): boolean {
  if (!userName) return false;
  const clean = userName.trim();
  const normalized = normalizeArabic(clean);
  return (
    clean === 'م.ماجد' ||
    clean.includes('ماجد') ||
    clean === 'م.نور' ||
    clean.includes('نور') ||
    clean === 'م.اصالة' ||
    normalized.includes('اصال')
  );
}

/**
 * Checks if a user name is on the authorized roster
 */
export function isUserAuthorized(inputName: string): boolean {
  if (!inputName || !inputName.trim()) return false;
  const normalizedInput = normalizeArabic(inputName);

  return cachedAuthorizedUsers.some((authorized) => {
    const normAuth = normalizeArabic(authorized);
    // Exact or direct prefix match (e.g. "م.ماجد" or "م.نور")
    return (
      normAuth === normalizedInput ||
      normAuth.startsWith(normalizedInput) ||
      normalizedInput.startsWith(normAuth)
    );
  });
}

/**
 * Full authentication check: verifies both user authorization and password
 */
export function verifyUserLogin(
  inputName: string,
  inputCode: string
): { success: boolean; errorReason?: 'unauthorized_user' | 'invalid_passcode'; message?: string } {
  // 1. Check user authorization
  if (!isUserAuthorized(inputName)) {
    return {
      success: false,
      errorReason: 'unauthorized_user',
      message: `المستخدم "${inputName}" غير مسجل ضمن قائمة فريق العمل المصرح له. يرجى اختيار مهندس معتمد أو مراجعة الإدارة (م.ماجد / م.نور / م.اصالة) لإضافتك.`,
    };
  }

  // 2. Check Passcode
  const cleanCode = (inputCode || '').trim();
  if (!cleanCode) {
    return {
      success: false,
      errorReason: 'invalid_passcode',
      message: 'يرجى إدخال رمز المرور السري.',
    };
  }

  // If a custom passcode was set by the admin, ONLY the custom passcode is accepted
  if (cachedIsCustomized) {
    if (cleanCode === cachedOfficePasscode) {
      return { success: true };
    }
    return {
      success: false,
      errorReason: 'invalid_passcode',
      message: 'رمز المرور السري غير صحيح. تم تغيير الرمز من قِبل الإدارة.',
    };
  }

  // Initial state before admin customization: allows current code or initial office default (2026)
  if (cleanCode === cachedOfficePasscode || cleanCode === '2026' || cleanCode === 'LV2026') {
    return { success: true };
  }

  return {
    success: false,
    errorReason: 'invalid_passcode',
    message: 'رمز المرور السري غير صحيح.',
  };
}

/**
 * Helper to check passcode validity alone
 */
export function verifyOfficePasscode(inputCode: string): boolean {
  const clean = (inputCode || '').trim();
  if (!clean) return false;

  if (cachedIsCustomized) {
    return clean === cachedOfficePasscode;
  }
  return clean === cachedOfficePasscode || clean === '2026' || clean === 'LV2026';
}

/**
 * Update the office passcode (saves locally & cloud Firestore)
 * Automatically marks isCustomized = true, completely invalidating old defaults!
 * RESTRICTED: Only administrators (م.ماجد / م.نور) have permission!
 */
export async function updateOfficePasscode(newCode: string, requestingUserName?: string): Promise<void> {
  if (requestingUserName && !isUserPrimaryAdmin(requestingUserName)) {
    throw new Error('عذراً! صلاحية تغيير رمز المرور السري مقتصرة حصرياً على الإدارة (م.ماجد / م.نور / م.اصالة).');
  }

  const clean = newCode.trim();
  if (clean.length < 4) {
    throw new Error('يجب ألا يقل رمز المرور عن 4 خانات');
  }

  cachedOfficePasscode = clean;
  cachedIsCustomized = true;

  try {
    localStorage.setItem(STORAGE_KEY_PASSCODE, clean);
    localStorage.setItem(STORAGE_KEY_CUSTOMIZED, 'true');
  } catch {}

  // Sync to Cloud Firestore
  try {
    const docRef = doc(db, 'app_settings', 'security');
    await setDoc(
      docRef,
      {
        officePasscode: clean,
        isCustomized: true,
        authorizedUsers: cachedAuthorizedUsers,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Failed to sync passcode to Firestore cloud:', err);
  }
}

/**
 * Add a new authorized user to the roster
 * RESTRICTED: Only administrators (م.ماجد / م.نور) have permission!
 */
export async function addAuthorizedUser(name: string, requestingUserName?: string): Promise<string[]> {
  if (requestingUserName && !isUserPrimaryAdmin(requestingUserName)) {
    throw new Error('عذراً! صلاحية إضافة مهندسين مصرح لهم مقتصرة حصرياً على الإدارة (م.ماجد / م.نور / م.اصالة).');
  }

  const cleanName = name.trim();
  if (!cleanName) throw new Error('يرجى كتابة اسم المهندس أو الموظف');

  if (isUserAuthorized(cleanName)) {
    throw new Error('هذا الاسم مسجل ومصرح له بالفعل');
  }

  cachedAuthorizedUsers = [...cachedAuthorizedUsers, cleanName];

  try {
    localStorage.setItem(STORAGE_KEY_AUTHORIZED_USERS, JSON.stringify(cachedAuthorizedUsers));
  } catch {}

  try {
    const docRef = doc(db, 'app_settings', 'security');
    await setDoc(
      docRef,
      {
        authorizedUsers: cachedAuthorizedUsers,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Failed to sync authorized users to Firestore:', err);
  }

  return cachedAuthorizedUsers;
}

/**
 * Remove an authorized user from the roster
 * RESTRICTED: Only administrators (م.ماجد / م.نور) have permission!
 */
export async function removeAuthorizedUser(name: string, requestingUserName?: string): Promise<string[]> {
  if (requestingUserName && !isUserPrimaryAdmin(requestingUserName)) {
    throw new Error('عذراً! صلاحية إلغاء وحذف المهندسين مقتصرة حصرياً على الإدارة (م.ماجد / م.نور / م.اصالة).');
  }

  const cleanName = name.trim();
  if (isUserPrimaryAdmin(cleanName)) {
    throw new Error('لا يمكن حذف حساب المسؤول الرئيسي (م.ماجد / م.نور / م.اصالة)');
  }

  cachedAuthorizedUsers = cachedAuthorizedUsers.filter((u) => u !== cleanName);

  try {
    localStorage.setItem(STORAGE_KEY_AUTHORIZED_USERS, JSON.stringify(cachedAuthorizedUsers));
  } catch {}

  try {
    const docRef = doc(db, 'app_settings', 'security');
    await setDoc(
      docRef,
      {
        authorizedUsers: cachedAuthorizedUsers,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Failed to sync authorized users to Firestore:', err);
  }

  return cachedAuthorizedUsers;
}

export function getAuthorizedUsersList(): string[] {
  let changed = false;
  if (!cachedAuthorizedUsers.some((u) => u.includes('نور'))) {
    const majedIdx = cachedAuthorizedUsers.findIndex((u) => u.includes('ماجد'));
    if (majedIdx !== -1) {
      cachedAuthorizedUsers.splice(majedIdx + 1, 0, 'م.نور');
    } else {
      cachedAuthorizedUsers.unshift('م.نور');
    }
    changed = true;
  }
  if (!cachedAuthorizedUsers.some((u) => u.includes('اصال') || u.includes('أصال'))) {
    const nourIdx = cachedAuthorizedUsers.findIndex((u) => u.includes('نور'));
    const majedIdx = cachedAuthorizedUsers.findIndex((u) => u.includes('ماجد'));
    if (nourIdx !== -1) {
      cachedAuthorizedUsers.splice(nourIdx + 1, 0, 'م.اصالة');
    } else if (majedIdx !== -1) {
      cachedAuthorizedUsers.splice(majedIdx + 1, 0, 'م.اصالة');
    } else {
      cachedAuthorizedUsers.unshift('م.اصالة');
    }
    changed = true;
  }
  if (!cachedAuthorizedUsers.includes('م.فادي')) {
    const idx = cachedAuthorizedUsers.indexOf('م.لحد ما يجي');
    if (idx !== -1) {
      cachedAuthorizedUsers.splice(idx, 0, 'م.فادي');
    } else {
      cachedAuthorizedUsers.push('م.فادي');
    }
    changed = true;
  }
  if (changed) {
    try {
      localStorage.setItem(STORAGE_KEY_AUTHORIZED_USERS, JSON.stringify(cachedAuthorizedUsers));
    } catch {}
  }
  return [...cachedAuthorizedUsers];
}

/**
 * Session Management
 */
export function getSavedSession(): UserSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSION);
    if (!raw) return null;
    const session = JSON.parse(raw) as UserSession;
    if (session && session.engineerName && isUserAuthorized(session.engineerName)) {
      return session;
    }
  } catch {}
  return null;
}

export function saveSession(session: UserSession): void {
  try {
    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
  } catch {}
}

export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_SESSION);
  } catch {}
}

export function getCachedOfficePasscode(): string {
  return cachedOfficePasscode;
}

export function isPasscodeCustomized(): boolean {
  return cachedIsCustomized;
}
