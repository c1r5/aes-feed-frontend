export type Payout = {
	id: string
	authorID: string
	xmrTxID: string
	xmrAmount: number
	platformAmount: number
	authorAmount: number
	signedLog: string
	createdAt: Date
}

export interface IPayoutDataSource {
	getPublicLog(): Promise<Payout[]>
	getAuthorPayouts(authorID: string): Promise<Payout[]>
}
