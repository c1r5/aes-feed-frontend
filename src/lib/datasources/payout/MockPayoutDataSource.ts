import type { IPayoutDataSource, Payout } from './IPayoutDataSource'

const MOCK_PAYOUTS: Payout[] = [
	{
		id: 'payout-001',
		authorID: 'author-a3f7c1',
		xmrTxID: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
		xmrAmount: 0.42,
		platformAmount: 0.042,
		authorAmount: 0.378,
		signedLog: 'eyJhbGciOiJFZDI1NTE5IiwidHlwIjoiSldUIn0.mock-signature-001',
		createdAt: new Date('2026-03-15T10:00:00Z')
	},
	{
		id: 'payout-002',
		authorID: 'author-b9e2d4',
		xmrTxID: 'deadbeefcafebabe1234567890abcdefdeadbeefcafebabe1234567890abcdef',
		xmrAmount: 1.15,
		platformAmount: 0.115,
		authorAmount: 1.035,
		signedLog: 'eyJhbGciOiJFZDI1NTE5IiwidHlwIjoiSldUIn0.mock-signature-002',
		createdAt: new Date('2026-03-20T14:30:00Z')
	},
	{
		id: 'payout-003',
		authorID: 'author-a3f7c1',
		xmrTxID: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
		xmrAmount: 0.78,
		platformAmount: 0.078,
		authorAmount: 0.702,
		signedLog: 'eyJhbGciOiJFZDI1NTE5IiwidHlwIjoiSldUIn0.mock-signature-003',
		createdAt: new Date('2026-03-25T08:15:00Z')
	}
]

export class MockPayoutDataSource implements IPayoutDataSource {
	async getPublicLog(): Promise<Payout[]> {
		return [...MOCK_PAYOUTS].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
	}

	async getAuthorPayouts(authorID: string): Promise<Payout[]> {
		return MOCK_PAYOUTS.filter((p) => p.authorID === authorID).sort(
			(a, b) => b.createdAt.getTime() - a.createdAt.getTime()
		)
	}
}
