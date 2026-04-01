export interface Post {
  id: string;
  authorId: string;
  authorUsername: string;
  title: string;
  isPremium: boolean;
  encryptedBlob?: string;
  postSalt?: string;
  iv?: string;
  content?: string;
  upvotesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostInput {
  id: string;
  title: string;
  isPremium: boolean;
  encryptedBlob?: string;
  postSalt?: string;
  iv?: string;
  content?: string;
}

export interface UpdatePostInput {
  title?: string;
  encryptedBlob?: string;
  postSalt?: string;
  iv?: string;
  content?: string;
}

export interface IPostsDataSource {
  createPost(input: CreatePostInput): Promise<Post>;
  getPost(id: string): Promise<Post>;
  listPosts(params: { page: number; limit: number; premium?: boolean }): Promise<{ posts: Post[]; total: number }>;
  updatePost(id: string, input: UpdatePostInput): Promise<Post>;
  deletePost(id: string): Promise<void>;
}
