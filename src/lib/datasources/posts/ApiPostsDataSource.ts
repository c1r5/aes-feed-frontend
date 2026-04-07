import type { IPostsDataSource, Post, CreatePostInput, UpdatePostInput, PostFilter } from './IPostsDataSource'

export class ApiPostsDataSource implements IPostsDataSource {
	async createPost(_post: CreatePostInput): Promise<Post> {
		throw new Error('NotImplemented: ApiPostsDataSource.createPost')
	}

	async getPost(_postID: string): Promise<Post | null> {
		throw new Error('NotImplemented: ApiPostsDataSource.getPost')
	}

	async listPosts(_filter: PostFilter): Promise<Post[]> {
		throw new Error('NotImplemented: ApiPostsDataSource.listPosts')
	}

	async updatePost(_postID: string, _input: UpdatePostInput): Promise<Post> {
		throw new Error('NotImplemented: ApiPostsDataSource.updatePost')
	}

	async deletePost(_postID: string): Promise<void> {
		throw new Error('NotImplemented: ApiPostsDataSource.deletePost')
	}
}
