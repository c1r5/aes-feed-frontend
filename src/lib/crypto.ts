import type { AppError } from '$lib/types'

function getSubtle(): SubtleCrypto {
	const subtle = globalThis.crypto?.subtle
	if (!subtle) {
		throw new Error(
			'Web Crypto API indisponível. Acesse via https:// ou http://localhost (secure context necessário).'
		)
	}
	return subtle
}

export function bytesToBase64(bytes: Uint8Array): string {
	let binary = ''
	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i])
	}
	return btoa(binary)
}

export function base64ToBytes(b64: string): Uint8Array {
	const binary = atob(b64)
	const bytes = new Uint8Array(binary.length)
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i)
	}
	return bytes
}

export async function generateMasterKey(): Promise<CryptoKey> {
	return getSubtle().generateKey({ name: 'AES-GCM', length: 256 }, true, [
		'encrypt',
		'decrypt'
	])
}

export async function importMasterKeyFromHex(hex: string): Promise<CryptoKey> {
	const bytes = new Uint8Array(hex.length / 2)
	for (let i = 0; i < hex.length; i += 2) {
		bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
	}
	return getSubtle().importKey('raw', bytes, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt'])
}

export async function derivePostKey(
	masterKey: CryptoKey,
	postId: string,
	postSalt: Uint8Array
): Promise<CryptoKey> {
	const rawKey = await getSubtle().exportKey('raw', masterKey)
	const hkdfKey = await getSubtle().importKey('raw', rawKey, 'HKDF', false, ['deriveKey'])
	return getSubtle().deriveKey(
		{
			name: 'HKDF',
			salt: postSalt as Uint8Array<ArrayBuffer>,
			info: new TextEncoder().encode(postId),
			hash: 'SHA-256'
		},
		hkdfKey,
		{ name: 'AES-GCM', length: 256 },
		false,
		['encrypt', 'decrypt']
	)
}

export async function encryptPost(
	postKey: CryptoKey,
	content: string
): Promise<string> {
	const iv = globalThis.crypto.getRandomValues(new Uint8Array(12))
	const encoded = new TextEncoder().encode(content)
	const ciphertext = new Uint8Array(
		await getSubtle().encrypt({ name: 'AES-GCM', iv }, postKey, encoded)
	)
	const combined = new Uint8Array(iv.length + ciphertext.length)
	combined.set(iv)
	combined.set(ciphertext, iv.length)
	return bytesToBase64(combined)
}

export async function decryptPost(
	postKey: CryptoKey,
	encrypted_blob: string
): Promise<string> {
	try {
		const combined = base64ToBytes(encrypted_blob)
		const iv = combined.slice(0, 12)
		const ciphertext = combined.slice(12)
		const plainBuffer = await getSubtle().decrypt({ name: 'AES-GCM', iv }, postKey, ciphertext)
		return new TextDecoder().decode(plainBuffer)
	} catch {
		throw {
			kind: 'crypto',
			message: 'Chave inválida, sua assinatura pode ter expirado'
		} satisfies AppError
	}
}

export const TEST_MASTER_KEY_HEX = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
