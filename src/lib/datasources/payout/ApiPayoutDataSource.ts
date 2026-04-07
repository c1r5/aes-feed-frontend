import type { IPayoutDataSource, Payout } from './IPayoutDataSource'

export class ApiPayoutDataSource implements IPayoutDataSource {
	async getPublicLog(): Promise<Payout[]> {
		throw new Error('NotImplemented: ApiPayoutDataSource.getPublicLog')
	}

	async getAuthorPayouts(_authorID: string): Promise<Payout[]> {
		throw new Error('NotImplemented: ApiPayoutDataSource.getAuthorPayouts')
	}
}
