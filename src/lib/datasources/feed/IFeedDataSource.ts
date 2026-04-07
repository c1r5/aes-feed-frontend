import type { Post } from '$lib/datasources/posts/IPostsDataSource'

export type FeedItem = {
	post: Post
	author: string
	hasUpvoted: boolean
}

export type Comment = {
	id: string
	postID: string
	authorID: string
	authorUsername: string
	body: string
	createdAt: Date
}

export interface IFeedDataSource {
	getFeed(page: number): Promise<FeedItem[]>
	upvote(postID: string): Promise<void>
	removeUpvote(postID: string): Promise<void>
	getComments(postID: string): Promise<Comment[]>
	addComment(postID: string, body: string): Promise<Comment>
	deleteComment(commentID: string): Promise<void>
}
