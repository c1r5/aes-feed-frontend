import { apiFetch } from './http';
import type {
  ISubscriptionDataSource,
  SubscriptionStatus,
  SubscriptionValidation,
} from '$lib/datasources/interfaces/ISubscriptionDataSource';

const KEYS = {
  active: 'aesf33d:sub:active',
  validUntil: 'aesf33d:sub:validUntil',
};

export class ApiSubscriptionDataSource implements ISubscriptionDataSource {
  async getStatus(): Promise<SubscriptionStatus> {
    return apiFetch<SubscriptionStatus>('/subscription/status');
  }

  simulatePayment(): { paymentSecret: Uint8Array; userSalt: Uint8Array } {
    throw new Error('not available in production');
  }

  simulateExpiration(): void {
    throw new Error('not available in production');
  }

  isSecretDelivered(): boolean {
    return false;
  }

  markSecretDelivered(): void {
    // server tracks delivery; noop on client
  }

  getUserSalt(): Uint8Array | null {
    return null;
  }

  clear(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(KEYS.active);
      localStorage.removeItem(KEYS.validUntil);
    }
  }

  clearSubscriptionData(): void {
    this.clear();
  }

  restoreLocalSubscription(validUntil: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(KEYS.active, 'true');
      localStorage.setItem(KEYS.validUntil, validUntil);
    }
  }

  async validateSubscription(userId: string): Promise<SubscriptionValidation> {
    return apiFetch<SubscriptionValidation>(
      `/subscription/validate?userId=${encodeURIComponent(userId)}`,
    );
  }
}
