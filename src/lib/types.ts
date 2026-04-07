export type AppError =
	| { kind: 'crypto'; message: string }
	| { kind: 'not_found'; resource: string }
	| { kind: 'network'; status: number; message: string }

export type SubscriptionStatus = {
	valid: boolean
	validUntil?: string
}

export type Post = {
	id: string
	slug: string
	title: string
	author: string
	is_premium: boolean
	created_at: string
	body?: string
	encrypted_blob?: string
	post_salt?: string
}
