import type { SubscriptionStatus } from '$lib/types'

const STORAGE_KEY = 'aes-feed-subscription'

export function checkSubscription(): SubscriptionStatus {
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		if (!raw) return { valid: false }
		const data = JSON.parse(raw)
		if (!data.subscriptionValid) return { valid: false }
		if (data.validUntil && new Date(data.validUntil) < new Date()) return { valid: false }
		return { valid: true, validUntil: data.validUntil }
	} catch {
		return { valid: false }
	}
}

export function mockSubscriptionValid() {
	const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
	localStorage.setItem(STORAGE_KEY, JSON.stringify({ subscriptionValid: true, validUntil }))
}

export function mockSubscriptionExpired() {
	localStorage.setItem(STORAGE_KEY, JSON.stringify({ subscriptionValid: false }))
}
