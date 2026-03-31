import { generateRandom, utf8Encode, utf8Decode, base64ToArrayBuffer, arrayBufferToBase64 } from './utils';

export async function deriveMasterKey(
  paymentSecret: Uint8Array,
  userSalt: Uint8Array
): Promise<CryptoKey> {
  if (!globalThis.crypto?.subtle) throw new Error('Web Crypto API (subtle) is not available. Ensure you are in a Secure Context (HTTPS or localhost).');

  const ikm = await globalThis.crypto.subtle.importKey(
    'raw',
    paymentSecret,
    'HKDF',
    false,
    ['deriveKey']
  );

  return globalThis.crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: userSalt,
      info: utf8Encode('aesf33d-masterkey-v1')
    },
    ikm,
    { name: 'AES-GCM', length: 256 },
    true, // extractable: true (needed for PostKey derivation and export)
    ['encrypt', 'decrypt']
  );
}

export async function derivePostKey(
  masterKey: CryptoKey,
  postId: string,
  postSalt: Uint8Array
): Promise<CryptoKey> {
  const rawMasterKey = await globalThis.crypto.subtle.exportKey('raw', masterKey);
  
  const ikm = await globalThis.crypto.subtle.importKey(
    'raw',
    rawMasterKey,
    'HKDF',
    false,
    ['deriveKey']
  );

  return globalThis.crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: postSalt,
      info: utf8Encode('aesf33d-postkey-v1:' + postId)
    },
    ikm,
    { name: 'AES-GCM', length: 256 },
    false, // extractable: false (security rule)
    ['encrypt', 'decrypt']
  );
}

export async function encryptContent(
  postKey: CryptoKey,
  content: string
): Promise<{ blob: string; iv: string }> {
  const iv = generateRandom(12);
  const ciphertext = await globalThis.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    postKey,
    utf8Encode(content)
  );

  return {
    blob: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(iv.buffer)
  };
}

export async function decryptContent(
  postKey: CryptoKey,
  blob: string,
  iv: string
): Promise<string> {
  const plaintext = await globalThis.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToArrayBuffer(iv) },
    postKey,
    base64ToArrayBuffer(blob)
  );

  return utf8Decode(plaintext);
}
