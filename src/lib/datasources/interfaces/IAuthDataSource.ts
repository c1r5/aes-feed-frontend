export interface User {
  id: string;
  username: string;
  email: string;
  userSalt: string;
  createdAt: string;
}

export interface Session {
  user: User;
  token: string;
  expiresAt: string;
}

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface IAuthDataSource {
  register(input: RegisterInput): Promise<Session>;
  login(input: LoginInput): Promise<Session>;
  logout(): Promise<void>;
  getSession(): Promise<Session | null>;
  getUser(userId: string): Promise<User | null>;
}
