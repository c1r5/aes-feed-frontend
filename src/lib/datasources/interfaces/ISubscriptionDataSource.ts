export interface SubscriptionStatus {
  active: boolean;
  validUntil: string | null;
  paymentSecret?: string; // base64 — presente apenas na primeira chamada após pagamento (API mode)
}

export interface SubscriptionValidation {
  valid: boolean;
  validUntil: string | null;
  reason?: 'expired' | 'not_found' | 'active';
}

export interface ISubscriptionDataSource {
  getStatus(): Promise<SubscriptionStatus>;
  simulatePayment(): { paymentSecret: Uint8Array; userSalt: Uint8Array };
  simulateExpiration(): void;
  isSecretDelivered(): boolean;
  markSecretDelivered(): void;
  getUserSalt(): Uint8Array | null;
  clear(): void;
  clearSubscriptionData(): void;
  restoreLocalSubscription(validUntil: string): void;
  validateSubscription(userId: string): Promise<SubscriptionValidation>;
}
