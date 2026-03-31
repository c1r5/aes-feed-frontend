export interface SubscriptionStatus {
  active: boolean;
  validUntil: string | null;
}

export interface SubscriptionValidation {
  valid: boolean;
  validUntil: string | null;
  reason?: 'expired' | 'not_found' | 'active';
}

export interface ISubscriptionDataSource {
  getStatus(): SubscriptionStatus;
  simulatePayment(): { paymentSecret: Uint8Array; userSalt: Uint8Array };
  simulateExpiration(): void;
  isSecretDelivered(): boolean;
  markSecretDelivered(): void;
  getUserSalt(): Uint8Array | null;
  clear(): void;
  clearSubscriptionData(): void;
  validateSubscription(userId: string): Promise<SubscriptionValidation>;
}
