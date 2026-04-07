import type { IFeedDataSource, FeedItem, Comment } from './IFeedDataSource'

export class ApiFeedDataSource implements IFeedDataSource {
	async getFeed(_page: number): Promise<FeedItem[]> {
		throw new Error('NotImplemented: ApiFeedDataSource.getFeed')
	}

	async upvote(_postID: string): Promise<void> {
		throw new Error('NotImplemented: ApiFeedDataSource.upvote')
	}

	async removeUpvote(_postID: string): Promise<void> {
		throw new Error('NotImplemented: ApiFeedDataSource.removeUpvote')
	}

	async getComments(_postID: string): Promise<Comment[]> {
		throw new Error('NotImplemented: ApiFeedDataSource.getComments')
	}

	async addComment(_postID: string, _body: string): Promise<Comment> {
		throw new Error('NotImplemented: ApiFeedDataSource.addComment')
	}

	async deleteComment(_commentID: string): Promise<void> {
		throw new Error('NotImplemented: ApiFeedDataSource.deleteComment')
	}
}
