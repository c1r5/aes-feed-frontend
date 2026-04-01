import { describe, test, expect, beforeAll } from 'vitest';
import { ApiAuthDataSource } from '../ApiAuthDataSource';
import { ApiSubscriptionDataSource } from '../ApiSubscriptionDataSource';
import { apiFetch } from '../http';

describe('Subscription API Integration', () => {
  const authApi = new ApiAuthDataSource();
  const subApi = new ApiSubscriptionDataSource();

  const ts = Date.now();
  const testUser = {
    username: `sub_${ts}`,
    email: `sub_${ts}@test.com`,
    password: 'test123456',
  };

  let userId = '';

  beforeAll(async () => {
    const session = await authApi.register(testUser);
    userId = session.user.id;
    localStorage.setItem(
      'aesf33d:session',
      JSON.stringify({ token: session.token, user: session.user, expiresAt: session.expiresAt }),
    );
  });

  test('status sem assinatura retorna inactive', async () => {
    const status = await subApi.getStatus();
    expect(status.active).toBe(false);
    expect(status.paymentSecret).toBeUndefined();
  });

  test('validate com userId inexistente retorna not_found', async () => {
    const result = await subApi.validateSubscription('00000000-0000-0000-0000-000000000000');
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('not_found');
  });

  test('validate com userId do usuário registrado sem assinatura retorna not_found', async () => {
    const result = await subApi.validateSubscription(userId);
    expect(result.valid).toBe(false);
  });

  test('status após ativação via admin retorna active e paymentSecret uma única vez', async () => {
    // ativa assinatura via endpoint admin de teste
    await apiFetch(`/admin/activate-subscription/${userId}`, { method: 'POST' });

    // primeira chamada → paymentSecret presente
    const firstStatus = await subApi.getStatus();
    expect(firstStatus.active).toBe(true);
    expect(firstStatus.validUntil).toBeDefined();
    expect(firstStatus.paymentSecret).toBeDefined();
    expect(typeof firstStatus.paymentSecret).toBe('string');

    // segunda chamada → paymentSecret não retornado (secret_delivered = true)
    const secondStatus = await subApi.getStatus();
    expect(secondStatus.active).toBe(true);
    expect(secondStatus.paymentSecret).toBeUndefined();
  });

  test('validate com assinatura ativa retorna valid', async () => {
    const result = await subApi.validateSubscription(userId);
    expect(result.valid).toBe(true);
    expect(result.reason).toBe('active');
    expect(result.validUntil).toBeDefined();
  });

  test('simulatePayment lança erro em produção', () => {
    expect(() => subApi.simulatePayment()).toThrow('not available in production');
  });

  test('simulateExpiration lança erro em produção', () => {
    expect(() => subApi.simulateExpiration()).toThrow('not available in production');
  });

  test('restoreLocalSubscription persiste no localStorage', () => {
    const validUntil = new Date(Date.now() + 86400000).toISOString();
    subApi.restoreLocalSubscription(validUntil);
    expect(localStorage.getItem('aesf33d:sub:active')).toBe('true');
    expect(localStorage.getItem('aesf33d:sub:validUntil')).toBe(validUntil);
  });

  test('clearSubscriptionData limpa estado local', () => {
    subApi.clearSubscriptionData();
    expect(localStorage.getItem('aesf33d:sub:active')).toBeNull();
    expect(localStorage.getItem('aesf33d:sub:validUntil')).toBeNull();
  });
});
