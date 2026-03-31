import { arrayBufferToBase64 } from '$lib/crypto/utils';
import { AuthError } from '$lib/datasources/errors';
import type { IAuthDataSource, User, Session, RegisterInput, LoginInput } from '$lib/datasources/interfaces/IAuthDataSource';

interface StoredUser {
  id: string;
  username: string;
  email: string;
  password: string;
  userSalt: string;
  createdAt: string;
}

const KEYS = {
  users: 'aesf33d:users',
  session: 'aesf33d:session',
};

function loadUsers(): StoredUser[] {
  const raw = localStorage.getItem(KEYS.users);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as StoredUser[];
  } catch {
    return [];
  }
}

function saveUsers(users: StoredUser[]): void {
  localStorage.setItem(KEYS.users, JSON.stringify(users));
}

function loadSession(): Session | null {
  const raw = localStorage.getItem(KEYS.session);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

function saveSession(session: Session): void {
  localStorage.setItem(KEYS.session, JSON.stringify(session));
}

function removeSession(): void {
  localStorage.removeItem(KEYS.session);
}

function toUser(stored: StoredUser): User {
  return {
    id: stored.id,
    username: stored.username,
    email: stored.email,
    userSalt: stored.userSalt,
    createdAt: stored.createdAt,
  };
}

function createSession(user: User): Session {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  return {
    user,
    token: crypto.randomUUID(),
    expiresAt: expiresAt.toISOString(),
  };
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export class MockAuthDataSource implements IAuthDataSource {
  async register(input: RegisterInput): Promise<Session> {
    const { username, email, password } = input;

    if (!username.trim()) throw new AuthError('username obrigatório');
    if (username.length < 3 || username.length > 20) throw new AuthError('username deve ter entre 3 e 20 caracteres');
    if (!/^[a-zA-Z0-9_]+$/.test(username)) throw new AuthError('username deve conter apenas letras, números e underscore');
    if (!isValidEmail(email)) throw new AuthError('email inválido');
    if (password.length < 6) throw new AuthError('senha deve ter pelo menos 6 caracteres');

    const users = loadUsers();

    if (users.some((u) => u.email === email)) {
      throw new AuthError('email já registrado');
    }
    if (users.some((u) => u.username === username)) {
      throw new AuthError('username já em uso');
    }

    const saltBytes = crypto.getRandomValues(new Uint8Array(16));
    const saltBuffer = new ArrayBuffer(saltBytes.byteLength);
    new Uint8Array(saltBuffer).set(saltBytes);

    const stored: StoredUser = {
      id: crypto.randomUUID(),
      username,
      email,
      password,
      userSalt: arrayBufferToBase64(saltBuffer),
      createdAt: new Date().toISOString(),
    };

    users.push(stored);
    saveUsers(users);

    const session = createSession(toUser(stored));
    saveSession(session);
    return session;
  }

  async login(input: LoginInput): Promise<Session> {
    const { email, password } = input;
    const users = loadUsers();
    const found = users.find((u) => u.email === email);

    if (!found || found.password !== password) {
      throw new AuthError('credenciais inválidas');
    }

    const session = createSession(toUser(found));
    saveSession(session);
    return session;
  }

  async logout(): Promise<void> {
    removeSession();
  }

  async getSession(): Promise<Session | null> {
    const session = loadSession();
    if (!session) return null;

    if (new Date(session.expiresAt) < new Date()) {
      removeSession();
      return null;
    }

    return session;
  }

  async getUser(userId: string): Promise<User | null> {
    const users = loadUsers();
    const found = users.find((u) => u.id === userId);
    return found ? toUser(found) : null;
  }
}
