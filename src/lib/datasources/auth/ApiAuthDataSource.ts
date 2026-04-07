import type { IAuthDataSource, Session } from './IAuthDataSource'

export class ApiAuthDataSource implements IAuthDataSource {
	async login(_email: string, _password: string): Promise<Session> {
		throw new Error('NotImplemented: ApiAuthDataSource.login')
	}

	async register(_username: string, _email: string, _password: string): Promise<Session> {
		throw new Error('NotImplemented: ApiAuthDataSource.register')
	}

	async logout(): Promise<void> {
		throw new Error('NotImplemented: ApiAuthDataSource.logout')
	}

	async getSession(): Promise<Session | null> {
		throw new Error('NotImplemented: ApiAuthDataSource.getSession')
	}
}
