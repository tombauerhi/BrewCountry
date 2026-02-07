import type { Vote } from '../domain/types';

const DB_NAME = 'brew-country';
const STORE = 'votes';
const VERSION = 1;
const LOCAL_KEY = 'brew-country-votes';

const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('userId', 'userId', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const readAllIdb = async (): Promise<Vote[]> => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as Vote[]);
    request.onerror = () => reject(request.error);
  });
};

const upsertIdb = async (vote: Vote): Promise<void> => {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(vote);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

const deleteIdb = async (id: string): Promise<void> => {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

const clearIdb = async (): Promise<void> => {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

const readAllLocal = (): Vote[] => {
  const raw = localStorage.getItem(LOCAL_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Vote[];
  } catch {
    return [];
  }
};

const writeAllLocal = (votes: Vote[]) => {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(votes));
};

export const voteStore = {
  async getVotes(): Promise<Vote[]> {
    try {
      return await readAllIdb();
    } catch {
      return readAllLocal();
    }
  },
  async upsertVote(vote: Vote): Promise<void> {
    try {
      await upsertIdb(vote);
    } catch {
      const existing = readAllLocal();
      const next = existing.filter((item) => item.id !== vote.id).concat(vote);
      writeAllLocal(next);
    }
  },
  async deleteVote(id: string): Promise<void> {
    try {
      await deleteIdb(id);
    } catch {
      const existing = readAllLocal();
      writeAllLocal(existing.filter((item) => item.id !== id));
    }
  },
  async clearVotes(): Promise<void> {
    try {
      await clearIdb();
    } catch {
      writeAllLocal([]);
    }
  }
};

export const getCurrentUserId = () => {
  const key = 'brew-country-current-user';
  const stored = localStorage.getItem(key);
  if (stored) return stored;
  const newId = `user-${Math.random().toString(36).slice(2, 8)}`;
  localStorage.setItem(key, newId);
  return newId;
};

export const setCurrentUserId = (userId: string) => {
  localStorage.setItem('brew-country-current-user', userId);
};
