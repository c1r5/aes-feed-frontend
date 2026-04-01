import { apiFetch } from './http';
import type {
  IAuthDataSource,
  User,
  Session,
  RegisterInput,
  LoginInput,
} from '$lib/datasources/interfaces/IAuthDataSource';

export class ApiAuthDataSource implements IAuthDataSource {
  async register(input: RegisterInput): Promise<Session> {
    return apiFetch<Session>('/auth/register', { method: 'POST', body: input });
  }

  async login(input: LoginInput): Promise<Session> {
    return apiFetch<Session>('/auth/login', { method: 'POST', body: input });
  }

  async logout(): Promise<void> {
    await apiFetch<Record<string, never>>('/auth/logout', { method: 'POST' });
  }

  async getSession(): Promise<Session | null> {
    try {
      const result = await apiFetch<{ user: User }>('/auth/me');
      const raw =
        typeof localStorage !== 'undefined' ? localStorage.getItem('aesf33d:session') : null;
      if (!raw) return null;
      const stored = JSON.parse(raw) as Session;
      return { ...stored, user: result.user };
    } catch {
      return null;
    }
  }

  async getUser(userId: string): Promise<User | null> {
    try {
      const result = await apiFetch<{ user: User }>(`/users/${userId}`);
      return result.user;
    } catch {
      return null;
    }
  }
}
