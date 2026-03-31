import { writable, get } from 'svelte/store';
import { goto } from '$app/navigation';
import { MockSubscriptionDataSource } from '$lib/datasources/mock/MockSubscriptionDataSource';
import type { SubscriptionStatus, SubscriptionValidation } from '$lib/datasources/interfaces/ISubscriptionDataSource';
import { deriveMasterKey, derivePostKey, encryptContent } from '$lib/crypto/crypto';
import { saveMasterKey, saveUserSalt, clearCryptoData, cachePostKey } from '$lib/crypto/store';
import { generateRandom, arrayBufferToBase64 } from '$lib/crypto/utils';
import { posts, PREMIUM_CONTENT_SERVER } from '$lib/datasources/mock/MockPostDataSource';

const datasource = new MockSubscriptionDataSource();

export const subscriptionStatus = writable<SubscriptionStatus>({ active: false, validUntil: null });

export function initSubscription(): void {
  const status = datasource.getStatus();
  subscriptionStatus.set(status);
}

async function encryptPremiumPosts(masterKey: CryptoKey): Promise<void> {
  const allPosts = get(posts);
  const toEncrypt = allPosts.filter((p) => p.premium && !p.blob);
  if (toEncrypt.length === 0) return;

  const updated = [...allPosts];
  for (const post of toEncrypt) {
    const plaintext = post.content ?? PREMIUM_CONTENT_SERVER[post.id];
    if (!plaintext) continue;

    const postSalt = generateRandom(16);
    const postKey = await derivePostKey(masterKey, post.id, postSalt);
    const encrypted = await encryptContent(postKey, plaintext);
    const postSaltBuffer = new ArrayBuffer(postSalt.byteLength);
    new Uint8Array(postSaltBuffer).set(postSalt);
    const postSaltB64 = arrayBufferToBase64(postSaltBuffer);

    await cachePostKey(post.id, postSaltB64, postKey);

    const idx = updated.findIndex((p) => p.id === post.id);
    updated[idx] = { ...updated[idx], content: null, blob: encrypted.blob, iv: encrypted.iv, postSalt: postSaltB64 };
  }
  posts.set(updated);
}

export async function activateSubscription(): Promise<void> {
  const { paymentSecret, userSalt } = datasource.simulatePayment();
  const masterKey = await deriveMasterKey(paymentSecret, userSalt);
  await saveMasterKey(masterKey);
  await saveUserSalt(userSalt);
  await encryptPremiumPosts(masterKey);
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

export async function clearAllSubscriptionData(): Promise<void> {
  datasource.clearSubscriptionData();
  await clearCryptoData();
}

export async function validateServerSubscription(userId: string): Promise<SubscriptionValidation> {
  return datasource.validateSubscription(userId);
}

export function restoreLocalSubscription(validUntil: string): void {
  datasource.restoreLocalSubscription(validUntil);
  subscriptionStatus.set({ active: true, validUntil });
}

export function getSubscriptionDatasource(): MockSubscriptionDataSource {
  return datasource;
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
