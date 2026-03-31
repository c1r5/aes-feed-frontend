import { writable, derived } from 'svelte/store';
import type { Session, User } from '$lib/datasources/interfaces/IAuthDataSource';
import { MockAuthDataSource } from '$lib/datasources/mock/MockAuthDataSource';
import { subscriptionStatus, clearAllSubscriptionData } from './subscription';

const datasource = new MockAuthDataSource();

export const session = writable<Session | null>(null);

export const isLoggedIn = derived(session, ($s) => $s !== null);
export const currentUser = derived(session, ($s) => $s?.user ?? null);
export const username = derived(session, ($s) => $s?.user.username ?? null);

export async function initAuth(): Promise<void> {
  const s = await datasource.getSession();
  session.set(s);
}

export async function doLogin(email: string, password: string): Promise<void> {
  const s = await datasource.login({ email, password });
  session.set(s);
}

export async function doRegister(username: string, email: string, password: string): Promise<void> {
  const s = await datasource.register({ username, email, password });
  session.set(s);
}

export async function doLogout(): Promise<void> {
  await datasource.logout();
  await clearAllSubscriptionData();
  session.set(null);
  subscriptionStatus.set({ active: false, validUntil: null });
}
