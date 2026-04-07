import type { ISubscriptionDataSource, SubscriptionStatus, PaymentAddress } from './ISubscriptionDataSource'

export class ApiSubscriptionDataSource implements ISubscriptionDataSource {
	async getStatus(): Promise<SubscriptionStatus> {
		throw new Error('NotImplemented: ApiSubscriptionDataSource.getStatus')
	}

	async getPaymentAddress(): Promise<PaymentAddress> {
		throw new Error('NotImplemented: ApiSubscriptionDataSource.getPaymentAddress')
	}
}
