import { generateRandom, arrayBufferToBase64, base64ToArrayBuffer } from '$lib/crypto/utils';
import type { ISubscriptionDataSource, SubscriptionStatus } from '$lib/datasources/interfaces/ISubscriptionDataSource';
import type { Session } from '$lib/datasources/interfaces/IAuthDataSource';

const KEYS = {
  active: 'aesf33d:sub:active',
  validUntil: 'aesf33d:sub:validUntil',
  secretDelivered: 'aesf33d:sub:secretDelivered',
  userSalt: 'aesf33d:userSalt',
  session: 'aesf33d:session',
};

function getSessionUserSalt(): Uint8Array | null {
  const raw = localStorage.getItem(KEYS.session);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as Session;
    if (session.user.userSalt) {
      return new Uint8Array(base64ToArrayBuffer(session.user.userSalt));
    }
  } catch {
    // ignore
  }
  return null;
}

export class MockSubscriptionDataSource implements ISubscriptionDataSource {
  getStatus(): SubscriptionStatus {
    const activeStr = localStorage.getItem(KEYS.active);
    const validUntil = localStorage.getItem(KEYS.validUntil);

    if (activeStr === 'true' && validUntil) {
      const expirationDate = new Date(validUntil);
      if (expirationDate > new Date()) {
        return { active: true, validUntil };
      }
    }

    if (activeStr === 'true') {
      this.simulateExpiration();
    }

    return { active: false, validUntil: null };
  }

  isSecretDelivered(): boolean {
    return localStorage.getItem(KEYS.secretDelivered) === 'true';
  }

  markSecretDelivered(): void {
    localStorage.setItem(KEYS.secretDelivered, 'true');
  }

  simulatePayment(): { paymentSecret: Uint8Array; userSalt: Uint8Array } {
    const paymentSecret = generateRandom(32);

    let userSaltRaw = getSessionUserSalt();

    if (!userSaltRaw) {
      userSaltRaw = this.getUserSalt();
    }

    if (!userSaltRaw) {
      userSaltRaw = generateRandom(16);
      const saltBuffer = new ArrayBuffer(userSaltRaw.byteLength);
      new Uint8Array(saltBuffer).set(userSaltRaw);
      localStorage.setItem(KEYS.userSalt, arrayBufferToBase64(saltBuffer));
    }

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    localStorage.setItem(KEYS.active, 'true');
    localStorage.setItem(KEYS.validUntil, validUntil.toISOString());
    localStorage.setItem(KEYS.secretDelivered, 'false');

    return { paymentSecret, userSalt: userSaltRaw };
  }

  simulateExpiration(): void {
    localStorage.setItem(KEYS.active, 'false');
    localStorage.removeItem(KEYS.validUntil);
    localStorage.removeItem(KEYS.secretDelivered);
  }

  getUserSalt(): Uint8Array | null {
    const saltB64 = localStorage.getItem(KEYS.userSalt);
    if (!saltB64) return null;
    return new Uint8Array(base64ToArrayBuffer(saltB64));
  }

  clear(): void {
    localStorage.removeItem(KEYS.active);
    localStorage.removeItem(KEYS.validUntil);
    localStorage.removeItem(KEYS.secretDelivered);
  }
}
