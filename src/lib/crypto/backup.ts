import { arrayBufferToBase64, base64ToArrayBuffer } from './utils';
import { loadMasterKey, loadUserSalt, saveMasterKey, saveUserSalt, listCachedPostEntries, cachePostKey, clearCryptoData } from './store';

export interface CryptoBackup {
  version: 1;
  exportedAt: string;
  userId: string;
  masterKey: string;       // base64
  userSalt: string;        // base64
  cachedPosts: Array<{     // salts para re-derivação
    postId: string;
    postSalt: string;
  }>;
}

export async function exportCryptoBackup(userId: string): Promise<CryptoBackup> {
  const masterKey = await loadMasterKey();
  if (!masterKey) throw new Error('MasterKey not found in storage');

  const userSalt = await loadUserSalt();
  if (!userSalt) throw new Error('UserSalt not found in storage');

  const rawMasterKey = await globalThis.crypto.subtle.exportKey('raw', masterKey);
  const cachedPosts = await listCachedPostEntries();

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    userId,
    masterKey: arrayBufferToBase64(rawMasterKey),
    userSalt: arrayBufferToBase64(userSalt.buffer),
    cachedPosts
  };
}

export async function importCryptoBackup(backup: CryptoBackup): Promise<void> {
  if (backup.version !== 1) throw new Error('Unsupported backup version');
  if (!backup.masterKey || !backup.userSalt) throw new Error('Invalid backup format');

  // Validate we can import the key before clearing current data
  const rawMasterKey = base64ToArrayBuffer(backup.masterKey);
  const masterKey = await globalThis.crypto.subtle.importKey(
    'raw',
    rawMasterKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  const userSalt = new Uint8Array(base64ToArrayBuffer(backup.userSalt));

  // Perform wipe and save
  await clearCryptoData();
  await saveMasterKey(masterKey);
  await saveUserSalt(userSalt);

  for (const post of backup.cachedPosts) {
    // We pass a dummy key because store doesn't use it
    await cachePostKey(post.postId, post.postSalt, {} as CryptoKey);
  }
}

export function triggerDownload(backup: CryptoBackup): void {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `aesf33d-backup-${date}.aesf33d`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function readBackupFile(file: File): Promise<CryptoBackup> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const backup = JSON.parse(reader.result as string) as CryptoBackup;
        if (backup.version === 1) {
          resolve(backup);
        } else {
          reject(new Error('Invalid backup version'));
        }
      } catch (e) {
        reject(new Error('Failed to parse backup file'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
