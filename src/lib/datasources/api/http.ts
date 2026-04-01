import type { Session } from '$lib/datasources/interfaces/IAuthDataSource';

const BASE_URL = import.meta.env.PUBLIC_API_URL ?? 'http://localhost:3089/api';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message?: string,
  ) {
    super(message ?? code);
    this.name = 'ApiError';
  }
}

function getStoredToken(): string | undefined {
  if (typeof localStorage === 'undefined') return undefined;
  const raw = localStorage.getItem('aesf33d:session');
  if (!raw) return undefined;
  try {
    const session = JSON.parse(raw) as Session;
    return session.token;
  } catch {
    return undefined;
  }
}

export async function apiFetch<T>(
  path: string,
  options?: {
    method?: string;
    body?: unknown;
    token?: string;
  },
): Promise<T> {
  const token = options?.token ?? getStoredToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}${path}`, {
    method: options?.method ?? 'GET',
    headers,
    body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: 'unknown_error' })) as {
      error: string;
      message?: string;
    };
    throw new ApiError(response.status, body.error, body.message);
  }

  return response.json() as Promise<T>;
}
