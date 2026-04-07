export type SubscriptionStatus = {
	valid: boolean
	validUntil: Date | null
}

export type PaymentAddress = {
	address: string
	amount: number
	currency: 'XMR'
}

export interface ISubscriptionDataSource {
	getStatus(): Promise<SubscriptionStatus>
	getPaymentAddress(): Promise<PaymentAddress>
}
