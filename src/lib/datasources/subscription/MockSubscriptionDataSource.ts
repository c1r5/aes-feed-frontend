import type { ISubscriptionDataSource, SubscriptionStatus, PaymentAddress } from './ISubscriptionDataSource'

const STORAGE_KEY = 'aes-feed-subscription'

export class MockSubscriptionDataSource implements ISubscriptionDataSource {
	async getStatus(): Promise<SubscriptionStatus> {
		const raw = localStorage.getItem(STORAGE_KEY)
		if (!raw) return { valid: false, validUntil: null }
		const data = JSON.parse(raw)
		if (!data.subscriptionValid) return { valid: false, validUntil: null }
		const validUntil = data.validUntil ? new Date(data.validUntil) : null
		if (validUntil && validUntil < new Date()) return { valid: false, validUntil: null }
		return { valid: true, validUntil }
	}

	async getPaymentAddress(): Promise<PaymentAddress> {
		return {
			address: '888tNkZrPN6JsEgekjMnABU4TBzc2Dt29EPAvkRxbANsAnjyPbb3iQ1YBRk1UXcdRsiKc9dhwMVgN5S9cQUiyoogDavup3H',
			amount: 0.05,
			currency: 'XMR'
		}
	}
}
