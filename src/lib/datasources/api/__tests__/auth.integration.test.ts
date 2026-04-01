import { describe, test, expect, beforeAll } from 'vitest';
import { ApiAuthDataSource } from '../ApiAuthDataSource';
import { ApiError } from '../http';

describe('Auth API Integration', () => {
  const api = new ApiAuthDataSource();
  const ts = Date.now();
  const testUser = {
    username: `test_${ts}`,
    email: `test_${ts}@test.com`,
    password: 'test123456',
  };

  let registeredToken = '';

  test('register retorna session com userSalt', async () => {
    const session = await api.register(testUser);
    expect(session.user.id).toBeDefined();
    expect(session.user.username).toBe(testUser.username);
    expect(session.user.email).toBe(testUser.email);
    expect(session.user.userSalt).toBeDefined();
    expect(session.user.userSalt.length).toBeGreaterThan(0);
    expect(session.token).toBeDefined();
    expect(session.expiresAt).toBeDefined();
    registeredToken = session.token;
  });

  test('login com credenciais válidas retorna session', async () => {
    const session = await api.login({ email: testUser.email, password: testUser.password });
    expect(session.user.email).toBe(testUser.email);
    expect(session.token).toBeDefined();
  });

  test('login com credenciais inválidas lança ApiError 401', async () => {
    await expect(
      api.login({ email: testUser.email, password: 'senha_errada' }),
    ).rejects.toThrow(ApiError);

    await expect(
      api.login({ email: testUser.email, password: 'senha_errada' }),
    ).rejects.toMatchObject({ status: 401, code: 'invalid_credentials' });
  });

  test('register com email duplicado lança ApiError 409', async () => {
    await expect(api.register(testUser)).rejects.toThrow(ApiError);
    await expect(api.register(testUser)).rejects.toMatchObject({
      status: 409,
      code: 'email_taken',
    });
  });

  test('getSession com token válido no localStorage retorna session', async () => {
    localStorage.setItem('aesf33d:session', JSON.stringify({ token: registeredToken, user: {}, expiresAt: '' }));
    const session = await api.getSession();
    expect(session).not.toBeNull();
    expect(session?.user.email).toBe(testUser.email);
    localStorage.removeItem('aesf33d:session');
  });

  test('getSession sem token retorna null', async () => {
    localStorage.removeItem('aesf33d:session');
    const session = await api.getSession();
    expect(session).toBeNull();
  });

  test('logout com token válido retorna 200', async () => {
    localStorage.setItem('aesf33d:session', JSON.stringify({ token: registeredToken, user: {}, expiresAt: '' }));
    await expect(api.logout()).resolves.toBeUndefined();
    localStorage.removeItem('aesf33d:session');
  });
});
