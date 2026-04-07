import type { IAuthDataSource, Session } from './IAuthDataSource'

const STORAGE_KEY = 'aes-feed-session'

export class MockAuthDataSource implements IAuthDataSource {
	async login(email: string, _password: string): Promise<Session> {
		const userID = globalThis.crypto.randomUUID()
		const username = email.split('@')[0]
		const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
		const token = btoa(`${userID}:${expiresAt.toISOString()}`)
		const session: Session = { userID, username, token, expiresAt }
		localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
		return session
	}

	async register(username: string, email: string, _password: string): Promise<Session> {
		const userID = globalThis.crypto.randomUUID()
		const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
		const token = btoa(`${userID}:${expiresAt.toISOString()}`)
		const session: Session = { userID, username, token, expiresAt }
		localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
		return session
	}

	async logout(): Promise<void> {
		localStorage.removeItem(STORAGE_KEY)
	}

	async getSession(): Promise<Session | null> {
		const raw = localStorage.getItem(STORAGE_KEY)
		if (!raw) return null
		const session = JSON.parse(raw) as Session
		session.expiresAt = new Date(session.expiresAt)
		if (session.expiresAt < new Date()) {
			localStorage.removeItem(STORAGE_KEY)
			return null
		}
		return session
	}
}
