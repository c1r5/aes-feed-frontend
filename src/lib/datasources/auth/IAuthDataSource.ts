export type Session = {
	userID: string
	username: string
	token: string
	expiresAt: Date
}

export interface IAuthDataSource {
	login(email: string, password: string): Promise<Session>
	register(username: string, email: string, password: string): Promise<Session>
	logout(): Promise<void>
	getSession(): Promise<Session | null>
}
