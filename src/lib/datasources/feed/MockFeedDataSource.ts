import type { IFeedDataSource, FeedItem, Comment } from './IFeedDataSource'
import type { Post } from '$lib/datasources/posts/IPostsDataSource'

const DB_NAME = 'aes-feed-data'
const COMMENTS_STORE = 'comments'
const POSTS_STORE = 'posts'
const DB_VERSION = 1
const UPVOTES_KEY = 'aes-feed-upvotes'
const PAGE_SIZE = 20

function openDB(): Promise<IDBDatabase> {
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

function getUpvotes(): Set<string> {
	const raw = localStorage.getItem(UPVOTES_KEY)
	return raw ? new Set(JSON.parse(raw)) : new Set()
}

function saveUpvotes(upvotes: Set<string>) {
	localStorage.setItem(UPVOTES_KEY, JSON.stringify([...upvotes]))
}

function getSessionUserID(): string {
	const raw = localStorage.getItem('aes-feed-session')
	if (!raw) return 'anonymous'
	return (JSON.parse(raw) as { userID: string; username: string }).userID
}

function getSessionUsername(): string {
	const raw = localStorage.getItem('aes-feed-session')
	if (!raw) return 'anonymous'
	return (JSON.parse(raw) as { username: string }).username
}

export class MockFeedDataSource implements IFeedDataSource {
	async getFeed(page: number): Promise<FeedItem[]> {
		const db = await openDB()
		const posts: Post[] = await new Promise((resolve, reject) => {
			const tx = db.transaction(POSTS_STORE, 'readonly')
			const request = tx.objectStore(POSTS_STORE).getAll()
			request.onsuccess = () =>
				resolve(
					(request.result as Post[]).map((p) => ({
						...p,
						createdAt: new Date(p.createdAt)
					}))
				)
			request.onerror = () => reject(request.error)
		})

		posts.sort((a, b) => b.upvotesCount - a.upvotesCount)

		const start = page * PAGE_SIZE
		const slice = posts.slice(start, start + PAGE_SIZE)
		const upvotes = getUpvotes()

		return slice.map((post) => ({
			post,
			author: post.authorID.substring(0, 6),
			hasUpvoted: upvotes.has(post.id)
		}))
	}

	async upvote(postID: string): Promise<void> {
		const upvotes = getUpvotes()
		upvotes.add(postID)
		saveUpvotes(upvotes)

		const db = await openDB()
		const post = await new Promise<Post | null>((resolve, reject) => {
			const tx = db.transaction(POSTS_STORE, 'readonly')
			const req = tx.objectStore(POSTS_STORE).get(postID)
			req.onsuccess = () => (req.result ? resolve({ ...req.result, createdAt: new Date(req.result.createdAt) }) : resolve(null))
			req.onerror = () => reject(req.error)
		})
		if (post) {
			post.upvotesCount++
			const tx = db.transaction(POSTS_STORE, 'readwrite')
			tx.objectStore(POSTS_STORE).put({ ...post, createdAt: post.createdAt.toISOString() })
		}
	}

	async removeUpvote(postID: string): Promise<void> {
		const upvotes = getUpvotes()
		upvotes.delete(postID)
		saveUpvotes(upvotes)

		const db = await openDB()
		const post = await new Promise<Post | null>((resolve, reject) => {
			const tx = db.transaction(POSTS_STORE, 'readonly')
			const req = tx.objectStore(POSTS_STORE).get(postID)
			req.onsuccess = () => (req.result ? resolve({ ...req.result, createdAt: new Date(req.result.createdAt) }) : resolve(null))
			req.onerror = () => reject(req.error)
		})
		if (post && post.upvotesCount > 0) {
			post.upvotesCount--
			const tx = db.transaction(POSTS_STORE, 'readwrite')
			tx.objectStore(POSTS_STORE).put({ ...post, createdAt: post.createdAt.toISOString() })
		}
	}

	async getComments(postID: string): Promise<Comment[]> {
		const db = await openDB()
		const all: Comment[] = await new Promise((resolve, reject) => {
			const tx = db.transaction(COMMENTS_STORE, 'readonly')
			const request = tx.objectStore(COMMENTS_STORE).getAll()
			request.onsuccess = () =>
				resolve(
					(request.result as Comment[]).map((c) => ({
						...c,
						createdAt: new Date(c.createdAt)
					}))
				)
			request.onerror = () => reject(request.error)
		})
		return all
			.filter((c) => c.postID === postID)
			.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
	}

	async addComment(postID: string, body: string): Promise<Comment> {
		const db = await openDB()
		const comment: Comment = {
			id: globalThis.crypto.randomUUID(),
			postID,
			authorID: getSessionUserID(),
			authorUsername: getSessionUsername(),
			body,
			createdAt: new Date()
		}
		await new Promise<void>((resolve, reject) => {
			const tx = db.transaction(COMMENTS_STORE, 'readwrite')
			tx.objectStore(COMMENTS_STORE).put({
				...comment,
				createdAt: comment.createdAt.toISOString()
			})
			tx.oncomplete = () => resolve()
			tx.onerror = () => reject(tx.error)
		})
		return comment
	}

	async deleteComment(commentID: string): Promise<void> {
		const db = await openDB()
		await new Promise<void>((resolve, reject) => {
			const tx = db.transaction(COMMENTS_STORE, 'readwrite')
			tx.objectStore(COMMENTS_STORE).delete(commentID)
			tx.oncomplete = () => resolve()
			tx.onerror = () => reject(tx.error)
		})
	}
}
