import { derivePostKey } from './crypto';
import { base64ToArrayBuffer } from './utils';

const DB_NAME = 'aesf33d-crypto';
const DB_VERSION = 2; // Incrementado para forçar atualização de schema

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Se já existem, removemos para garantir o schema correto (limpeza de dev)
      if (db.objectStoreNames.contains('keys')) {
        db.deleteObjectStore('keys');
      }
      if (db.objectStoreNames.contains('postKeys')) {
        db.deleteObjectStore('postKeys');
      }

      db.createObjectStore('keys', { keyPath: 'id' });
      db.createObjectStore('postKeys', { keyPath: 'postId' });
    };
  });
}

export async function saveMasterKey(key: CryptoKey): Promise<void> {
  const db = await openDB();
  const rawKey = await globalThis.crypto.subtle.exportKey('raw', key);
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('keys', 'readwrite');
    const store = transaction.objectStore('keys');
    const request = store.put({ id: 'masterKey', value: rawKey });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function loadMasterKey(): Promise<CryptoKey | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('keys', 'readonly');
    const store = transaction.objectStore('keys');
    const request = store.get('masterKey');
    request.onsuccess = async () => {
      const result = request.result;
      if (!result) return resolve(null);
      try {
        const key = await globalThis.crypto.subtle.importKey(
          'raw',
          result.value,
          { name: 'AES-GCM', length: 256 },
          true,
          ['encrypt', 'decrypt']
        );
        resolve(key);
      } catch (e) {
        reject(e);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

export async function saveUserSalt(salt: Uint8Array): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('keys', 'readwrite');
    const store = transaction.objectStore('keys');
    const request = store.put({ id: 'userSalt', value: salt.buffer });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function loadUserSalt(): Promise<Uint8Array | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('keys', 'readonly');
    const store = transaction.objectStore('keys');
    const request = store.get('userSalt');
    request.onsuccess = () => {
      const result = request.result;
      if (!result) return resolve(null);
      resolve(new Uint8Array(result.value));
    };
    request.onerror = () => reject(request.error);
  });
}

export async function cachePostKey(
  postId: string,
  postSalt: string,
  _key: CryptoKey // We don't store the key itself, only parameters to re-derive
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('postKeys', 'readwrite');
    const store = transaction.objectStore('postKeys');
    const request = store.put({ postId, postSalt });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function loadCachedPostKey(
  masterKey: CryptoKey,
  postId: string
): Promise<CryptoKey | null> {
  const db = await openDB();
  const entry: { postId: string; postSalt: string } | null = await new Promise((resolve, reject) => {
    const transaction = db.transaction('postKeys', 'readonly');
    const store = transaction.objectStore('postKeys');
    const request = store.get(postId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });

  if (!entry) return null;
  return derivePostKey(masterKey, postId, new Uint8Array(base64ToArrayBuffer(entry.postSalt)));
}

export async function listCachedPostIds(): Promise<string[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('postKeys', 'readonly');
    const store = transaction.objectStore('postKeys');
    const request = store.getAll();
    request.onsuccess = () => {
      const results = request.result as Array<{ postId: string }>;
      resolve(results.map(r => r.postId));
    };
    request.onerror = () => reject(request.error);
  });
}

export async function listCachedPostEntries(): Promise<Array<{ postId: string; postSalt: string }>> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('postKeys', 'readonly');
    const store = transaction.objectStore('postKeys');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function clearCryptoData(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['keys', 'postKeys'], 'readwrite');
    transaction.objectStore('keys').clear();
    transaction.objectStore('postKeys').clear();
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}
