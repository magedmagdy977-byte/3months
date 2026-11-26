import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { SavedQuotation } from '../types';
import { extractQuoteSequence } from '../utils/formatters';

// Initialize Firebase App & Firestore with specified database ID
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const GOOGLE_WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/drive.file',
];

GOOGLE_WORKSPACE_SCOPES.forEach((scope) => {
  googleProvider.addScope(scope);
});

// In-memory access token cache for Google Workspace APIs
let cachedAccessToken: string | null = null;

auth.onAuthStateChanged((user) => {
  if (!user) {
    cachedAccessToken = null;
  }
});

export function setCachedAccessToken(token: string | null) {
  cachedAccessToken = token;
}

export function getCachedAccessToken(): string | null {
  return cachedAccessToken;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test on boot as required by Firebase integration guidelines
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or connecting...');
      return false;
    }
    // Any permission or missing doc error still means the server responded
    return true;
  }
}

// Subscribe to central company quotations archive
export function subscribeToQuotations(
  onData: (quotations: SavedQuotation[]) => void,
  onError?: (err: Error) => void
): () => void {
  const collRef = collection(db, 'saved_quotations');

  return onSnapshot(
    collRef,
    (snapshot) => {
      const quotes: SavedQuotation[] = [];
      snapshot.forEach((docSnap) => {
        quotes.push(docSnap.data() as SavedQuotation);
      });
      // Sort in-memory: newest quotation sequence first
      quotes.sort((a, b) => {
        const seqA = extractQuoteSequence(a.quoteNumber) || 0;
        const seqB = extractQuoteSequence(b.quoteNumber) || 0;
        if (seqA !== seqB) return seqB - seqA;
        return (b.id || '').localeCompare(a.id || '');
      });
      onData(quotes);
    },
    (error) => {
      console.warn('Failed to listen to saved_quotations:', error);
      if (onError) onError(error);
      try {
        handleFirestoreError(error, OperationType.GET, 'saved_quotations');
      } catch (e) {
        // Handled: error logged with FirestoreErrorInfo format without crashing execution thread
      }
    }
  );
}

// Save or update quotation in central cloud database
export async function saveQuotationToCloud(quote: SavedQuotation): Promise<void> {
  const path = `saved_quotations/${quote.id}`;
  try {
    const docRef = doc(db, 'saved_quotations', quote.id);
    const sanitizedPayload = JSON.parse(
      JSON.stringify({
        ...quote,
        updatedAt: new Date().toISOString(),
      })
    );
    await setDoc(docRef, sanitizedPayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Delete quotation from central cloud database
export async function deleteQuotationFromCloud(quoteId: string): Promise<void> {
  const path = `saved_quotations/${quoteId}`;
  try {
    const docRef = doc(db, 'saved_quotations', quoteId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Quick Google sign-in helper
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
    }
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    if (
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request'
    ) {
      console.warn('Google sign-in popup was closed by user');
      const friendlyErr = new Error('تم إغلاق نافذة المصادقة قبل اختيار حساب Google.');
      (friendlyErr as any).code = error.code;
      throw friendlyErr;
    }
    if (error?.code === 'auth/popup-blocked') {
      console.warn('Google sign-in popup was blocked by browser');
      const friendlyErr = new Error('قام المتصفح بحظر النافذة المنبثقة، يرجى السماح بالنوافذ المنبثقة (Popups).');
      (friendlyErr as any).code = error.code;
      throw friendlyErr;
    }
    console.error('Google Sign-in failed:', error);
    throw error;
  }
}

export async function getGoogleAccessToken(): Promise<string> {
  if (cachedAccessToken) return cachedAccessToken;
  const loginRes = await loginWithGoogle();
  if (!loginRes.accessToken) {
    throw new Error('لم يتم الحصول على رمز صلاحية Google للمستندات');
  }
  return loginRes.accessToken;
}

// Sign-out helper
export async function logoutUser() {
  cachedAccessToken = null;
  await signOut(auth);
}

// Run initial connection test
testConnection().catch(() => {});
