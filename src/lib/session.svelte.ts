let user = $state<{ author: string } | null>(null)

export function login(author: string) {
	user = { author }
}

export function logout() {
	user = null
}

export function getUser() {
	return user
}
