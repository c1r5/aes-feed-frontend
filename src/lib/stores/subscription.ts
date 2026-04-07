import { writable } from 'svelte/store';
import { goto } from '$app/navigation';
import { MockSubscriptionDataSource } from '$lib/datasources/mock/MockSubscriptionDataSource';
import type { SubscriptionStatus } from '$lib/datasources/interfaces/ISubscriptionDataSource';
import { deriveMasterKey } from '$lib/crypto/crypto';
import { saveMasterKey, saveUserSalt, clearCryptoData } from '$lib/crypto/store';

const datasource = new MockSubscriptionDataSource();

export const subscriptionStatus = writable<SubscriptionStatus>({ active: false, validUntil: null });

export function initSubscription(): void {
  const status = datasource.getStatus();
  subscriptionStatus.set(status);
}

export async function activateSubscription(): Promise<void> {
  const { paymentSecret, userSalt } = datasource.simulatePayment();
  const masterKey = await deriveMasterKey(paymentSecret, userSalt);
  await saveMasterKey(masterKey);
  await saveUserSalt(userSalt);
  datasource.markSecretDelivered();
  subscriptionStatus.set(datasource.getStatus());
}

export async function deactivateSubscription(): Promise<void> {
  datasource.simulateExpiration();
  subscriptionStatus.set({ active: false, validUntil: null });
}

export function resetSubscription(): void {
  datasource.clear();
  subscriptionStatus.set({ active: false, validUntil: null });
}

export async function checkAndEnforce(): Promise<boolean> {
  const status = datasource.getStatus();
  subscriptionStatus.set(status);

  if (!status.active) {
    await clearCryptoData();
    goto('/subscribe');
    return false;
  }

  return true;
}
