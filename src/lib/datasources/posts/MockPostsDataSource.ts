import type { IPostsDataSource, Post, CreatePostInput, UpdatePostInput, PostFilter } from './IPostsDataSource'

const DB_NAME = 'aes-feed-data'
const STORE_NAME = 'posts'
const DB_VERSION = 1
const PAGE_SIZE = 20

function openDB(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION)
		request.onupgradeneeded = () => {
			const db = request.result
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				db.createObjectStore(STORE_NAME, { keyPath: 'id' })
			}
		}
		request.onsuccess = () => resolve(request.result)
		request.onerror = () => reject(request.error)
	})
}

function getAllFromStore(db: IDBDatabase): Promise<Post[]> {
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, 'readonly')
		const request = tx.objectStore(STORE_NAME).getAll()
		request.onsuccess = () => {
			resolve(
				(request.result as Post[]).map((p) => ({
					...p,
					createdAt: new Date(p.createdAt)
				}))
			)
		}
		request.onerror = () => reject(request.error)
	})
}

function putInStore(db: IDBDatabase, post: Post): Promise<void> {
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, 'readwrite')
		tx.objectStore(STORE_NAME).put({ ...post, createdAt: post.createdAt.toISOString() })
		tx.oncomplete = () => resolve()
		tx.onerror = () => reject(tx.error)
	})
}

function deleteFromStore(db: IDBDatabase, id: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, 'readwrite')
		tx.objectStore(STORE_NAME).delete(id)
		tx.oncomplete = () => resolve()
		tx.onerror = () => reject(tx.error)
	})
}

export class MockPostsDataSource implements IPostsDataSource {
	private async getAuthorID(): Promise<string> {
		const raw = localStorage.getItem('aes-feed-session')
		if (!raw) throw new Error('not authenticated')
		return (JSON.parse(raw) as { userID: string }).userID
	}

	async createPost(input: CreatePostInput): Promise<Post> {
		const db = await openDB()
		const authorID = await this.getAuthorID()
		const post: Post = {
			id: globalThis.crypto.randomUUID(),
			authorID,
			title: input.title,
			isPremium: input.isPremium,
			encryptedBlob: input.encryptedBlob,
			postSalt: input.postSalt,
			iv: input.iv,
			upvotesCount: 0,
			createdAt: new Date()
		}
		await putInStore(db, post)
		return post
	}

	async getPost(postID: string): Promise<Post | null> {
		const db = await openDB()
		return new Promise((resolve, reject) => {
			const tx = db.transaction(STORE_NAME, 'readonly')
			const request = tx.objectStore(STORE_NAME).get(postID)
			request.onsuccess = () => {
				if (!request.result) {
					resolve(null)
					return
				}
				resolve({ ...request.result, createdAt: new Date(request.result.createdAt) })
			}
			request.onerror = () => reject(request.error)
		})
	}

	async listPosts(filter: PostFilter): Promise<Post[]> {
		const db = await openDB()
		let posts = await getAllFromStore(db)

		if (filter.isPremium !== undefined) {
			posts = posts.filter((p) => p.isPremium === filter.isPremium)
		}
		if (filter.authorID) {
			posts = posts.filter((p) => p.authorID === filter.authorID)
		}

		posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

		const page = filter.page ?? 0
		const start = page * PAGE_SIZE
		return posts.slice(start, start + PAGE_SIZE)
	}

	async updatePost(postID: string, input: UpdatePostInput): Promise<Post> {
		const db = await openDB()
		const existing = await this.getPost(postID)
		if (!existing) throw new Error('post not found')
		const updated: Post = {
			...existing,
			...(input.title !== undefined && { title: input.title }),
			...(input.encryptedBlob !== undefined && { encryptedBlob: input.encryptedBlob }),
			...(input.postSalt !== undefined && { postSalt: input.postSalt }),
			...(input.iv !== undefined && { iv: input.iv })
		}
		await putInStore(db, updated)
		return updated
	}

	async deletePost(postID: string): Promise<void> {
		const db = await openDB()
		await deleteFromStore(db, postID)
	}
}
