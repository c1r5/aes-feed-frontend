const DB_NAME = 'aes-feed-keys'
const STORE_NAME = 'keys'
const DB_VERSION = 1

function openDB(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION)
		request.onupgradeneeded = () => {
			request.result.createObjectStore(STORE_NAME)
		}
		request.onsuccess = () => resolve(request.result)
		request.onerror = () => reject(request.error)
	})
}

export async function saveKey(name: string, key: CryptoKey): Promise<void> {
	const db = await openDB()
	const raw = await globalThis.crypto?.subtle!.exportKey('raw', key)
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, 'readwrite')
		tx.objectStore(STORE_NAME).put(raw, name)
		tx.oncomplete = () => resolve()
		tx.onerror = () => reject(tx.error)
	})
}

export async function loadKey(name: string): Promise<CryptoKey | null> {
	const db = await openDB()
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, 'readonly')
		const request = tx.objectStore(STORE_NAME).get(name)
		request.onsuccess = async () => {
			if (!request.result) {
				resolve(null)
				return
			}
			const key = await globalThis.crypto?.subtle!.importKey('raw', request.result, { name: 'AES-GCM' }, true, [
				'encrypt',
				'decrypt'
			])
			resolve(key)
		}
		request.onerror = () => reject(request.error)
	})
}

export async function deleteKey(name: string): Promise<void> {
	const db = await openDB()
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, 'readwrite')
		tx.objectStore(STORE_NAME).delete(name)
		tx.oncomplete = () => resolve()
		tx.onerror = () => reject(tx.error)
	})
}
