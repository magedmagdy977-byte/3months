import { SavedQuotation } from '../types';
import { extractQuoteSequence } from '../utils/formatters';
import {
  saveQuotationToCloud,
  deleteQuotationFromCloud,
  subscribeToQuotations,
} from './firebase';

export const PRIMARY_STORAGE_KEY = 'alroaya_saved_quotes_v1';
export const BACKUP_STORAGE_KEY = 'alroaya_saved_quotes_backup_v1';
const IDB_NAME = 'alroaya_quotations_vault_v1';
const IDB_STORE = 'quotations';

// Initialize IndexedDB database for fail-safe browser persistence
function openIDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return resolve(null);
    }
    try {
      const request = indexedDB.open(IDB_NAME, 1);
      request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

// Read from IndexedDB
async function readFromIDB(): Promise<SavedQuotation[]> {
  const db = await openIDB();
  if (!db) return [];
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.getAll();
      req.onsuccess = () => resolve(Array.isArray(req.result) ? req.result : []);
      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

// Write to IndexedDB
async function writeToIDB(quotes: SavedQuotation[]): Promise<void> {
  const db = await openIDB();
  if (!db) return;
  try {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    store.clear();
    for (const q of quotes) {
      if (q && q.id) {
        store.put(q);
      }
    }
  } catch {
    // ignore
  }
}

// Read from LocalStorage (Primary and Backup)
export function readFromLocalStorage(): SavedQuotation[] {
  try {
    const primaryRaw = localStorage.getItem(PRIMARY_STORAGE_KEY);
    if (primaryRaw) {
      const parsed = JSON.parse(primaryRaw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // try backup
  }

  try {
    const backupRaw = localStorage.getItem(BACKUP_STORAGE_KEY);
    if (backupRaw) {
      const parsed = JSON.parse(backupRaw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }

  return [];
}

// Write to LocalStorage (both primary and backup)
export function writeToLocalStorage(quotes: SavedQuotation[]): void {
  try {
    const json = JSON.stringify(quotes);
    localStorage.setItem(PRIMARY_STORAGE_KEY, json);
    localStorage.setItem(BACKUP_STORAGE_KEY, json);
  } catch (err) {
    console.warn('LocalStorage quota exceeded or unavailable:', err);
  }
}

// Deduplicate and sort quotation list: newest sequential number first
export function deduplicateQuotations(list: SavedQuotation[]): SavedQuotation[] {
  const map = new Map<string, SavedQuotation>();

  for (const q of list) {
    if (!q || (!q.id && !q.quoteNumber)) continue;
    const key = q.id || q.quoteNumber;
    if (!map.has(key)) {
      map.set(key, q);
    } else {
      // Merge properties if newer
      const existing = map.get(key)!;
      map.set(key, { ...existing, ...q });
    }
  }

  const quotes = Array.from(map.values());

  quotes.sort((a, b) => {
    const seqA = extractQuoteSequence(a.quoteNumber) || 0;
    const seqB = extractQuoteSequence(b.quoteNumber) || 0;
    if (seqA !== seqB) return seqB - seqA;
    return (b.id || '').localeCompare(a.id || '');
  });

  return quotes;
}

// Fetch all quotations from Server Disk Storage (/api/archive)
export async function fetchServerArchive(): Promise<SavedQuotation[]> {
  try {
    const res = await fetch('/api/archive');
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.quotations) ? data.quotations : [];
  } catch (err) {
    console.warn('Failed to reach /api/archive on server:', err);
    return [];
  }
}

// Save single quotation to Server Disk Storage (/api/archive)
export async function saveToServerArchive(quote: SavedQuotation): Promise<void> {
  try {
    await fetch('/api/archive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quote),
    });
  } catch (err) {
    console.warn('Failed to save to /api/archive:', err);
  }
}

// Delete single quotation from Server Disk Storage (/api/archive/:id)
export async function deleteFromServerArchive(id: string, requestingEngineer?: string): Promise<void> {
  try {
    await fetch(`/api/archive/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        'x-engineer-name': encodeURIComponent(requestingEngineer || ''),
      },
    });
  } catch (err) {
    console.warn('Failed to delete from /api/archive:', err);
  }
}

// Sync batch to server disk
export async function syncBatchToServerArchive(quotes: SavedQuotation[]): Promise<SavedQuotation[]> {
  try {
    const res = await fetch('/api/archive/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quotations: quotes }),
    });
    if (!res.ok) return quotes;
    const data = await res.json();
    return Array.isArray(data?.quotations) ? data.quotations : quotes;
  } catch {
    return quotes;
  }
}

/**
 * Complete, resilient boot loader:
 * Merges quotations from:
 * 1) LocalStorage (Primary + Backup)
 * 2) IndexedDB
 * 3) Server Disk (/api/archive)
 * 4) Firebase (handled via real-time callback)
 * Then writes the merged pool back to all storages!
 */
export async function loadInitialArchive(): Promise<SavedQuotation[]> {
  const localList = readFromLocalStorage();
  const idbList = await readFromIDB();
  const serverList = await fetchServerArchive();

  const combined = deduplicateQuotations([...localList, ...idbList, ...serverList]);

  // Persist the consolidated list across all stores so no store is left empty
  writeToLocalStorage(combined);
  writeToIDB(combined);
  if (combined.length > serverList.length) {
    syncBatchToServerArchive(combined).catch(() => {});
  }

  return combined;
}

/**
 * Universal permanent save function:
 * Saves the quotation to:
 * 1) LocalStorage (primary + backup)
 * 2) IndexedDB
 * 3) Server Disk (/api/archive)
 * 4) Firebase Firestore (best effort)
 */
export async function persistQuotationPermanently(
  quote: SavedQuotation,
  currentList: SavedQuotation[]
): Promise<SavedQuotation[]> {
  const updatedList = deduplicateQuotations([quote, ...currentList]);

  // Immediate synchronous & local persistence
  writeToLocalStorage(updatedList);
  writeToIDB(updatedList);

  // Background server disk persistence
  saveToServerArchive(quote).catch(() => {});

  // Best-effort Firestore cloud persistence
  try {
    await saveQuotationToCloud(quote);
  } catch {
    // Handled: cloud permission or offline issues will not affect local + disk persistence
  }

  return updatedList;
}

/**
 * Universal permanent delete function:
 * Deletes the quotation from:
 * 1) LocalStorage (primary + backup)
 * 2) IndexedDB
 * 3) Server Disk (/api/archive)
 * 4) Firebase Firestore (best effort)
 */
export async function deleteQuotationPermanently(
  id: string,
  currentList: SavedQuotation[],
  requestingEngineer?: string
): Promise<SavedQuotation[]> {
  const filtered = currentList.filter((q) => q.id !== id && q.quoteNumber !== id);

  writeToLocalStorage(filtered);
  writeToIDB(filtered);

  deleteFromServerArchive(id, requestingEngineer).catch(() => {});

  try {
    await deleteQuotationFromCloud(id);
  } catch {
    // ignore
  }

  return filtered;
}

/**
 * Universal permanent batch delete function:
 * Deletes multiple selected quotations from:
 * 1) LocalStorage (primary + backup)
 * 2) IndexedDB
 * 3) Server Disk (/api/archive/batch-delete)
 * 4) Firebase Firestore (best effort)
 */
export async function deleteMultipleQuotationsPermanently(
  ids: string[],
  currentList: SavedQuotation[],
  requestingEngineer?: string
): Promise<SavedQuotation[]> {
  if (!ids || ids.length === 0) return currentList;

  const idSet = new Set(ids);
  const filtered = currentList.filter((q) => !idSet.has(q.id) && !idSet.has(q.quoteNumber));

  writeToLocalStorage(filtered);
  writeToIDB(filtered);

  // Server disk batch deletion
  try {
    await fetch('/api/archive/batch-delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-engineer-name': encodeURIComponent(requestingEngineer || ''),
      },
      body: JSON.stringify({ ids }),
    });
  } catch (err) {
    console.warn('Failed to batch delete from /api/archive/batch-delete:', err);
  }

  // Cloud deletion (best effort)
  try {
    await Promise.allSettled(ids.map((id) => deleteQuotationFromCloud(id)));
  } catch {
    // ignore
  }

  return filtered;
}
