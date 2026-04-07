export interface SubscriptionStatus {
  active: boolean;
  validUntil: string | null;
}

export interface ISubscriptionDataSource {
  getStatus(): SubscriptionStatus;
  simulatePayment(): { paymentSecret: Uint8Array; userSalt: Uint8Array };
  simulateExpiration(): void;
  isSecretDelivered(): boolean;
  markSecretDelivered(): void;
  getUserSalt(): Uint8Array | null;
  clear(): void;
}
