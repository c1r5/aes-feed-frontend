const DB_NAME = 'aes-feed-data'
const DB_VERSION = 1

export const POSTS_STORE = 'posts'
export const COMMENTS_STORE = 'comments'

export function openDB(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION)
		request.onupgradeneeded = () => {
			const db = request.result
			if (!db.objectStoreNames.contains(POSTS_STORE)) {
				db.createObjectStore(POSTS_STORE, { keyPath: 'id' })
			}
			if (!db.objectStoreNames.contains(COMMENTS_STORE)) {
				db.createObjectStore(COMMENTS_STORE, { keyPath: 'id' })
			}
		}
		request.onsuccess = () => resolve(request.result)
		request.onerror = () => reject(request.error)
	})
}
