export type Post = {
	id: string
	authorID: string
	title: string
	isPremium: boolean
	encryptedBlob: string | null
	postSalt: string | null
	iv: string | null
	upvotesCount: number
	createdAt: Date
}

export type CreatePostInput = {
	title: string
	isPremium: boolean
	encryptedBlob: string | null
	postSalt: string | null
	iv: string | null
}

export type UpdatePostInput = {
	title?: string
	encryptedBlob?: string
	postSalt?: string
	iv?: string
}

export type PostFilter = {
	isPremium?: boolean
	authorID?: string
	page?: number
}

export interface IPostsDataSource {
	createPost(post: CreatePostInput): Promise<Post>
	getPost(postID: string): Promise<Post | null>
	listPosts(filter: PostFilter): Promise<Post[]>
	updatePost(postID: string, input: UpdatePostInput): Promise<Post>
	deletePost(postID: string): Promise<void>
}
