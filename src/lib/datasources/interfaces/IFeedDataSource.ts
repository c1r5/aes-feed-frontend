export interface FeedItem {
  id: string;
  authorId: string;
  authorUsername: string;
  title: string;
  isPremium: boolean;
  upvotesCount: number;
  commentCount: number;
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorUsername: string;
  body: string;
  createdAt: string;
}

export interface IFeedDataSource {
  getFeed(params: { page: number; limit: number; sort: 'recent' | 'top' }): Promise<{ posts: FeedItem[]; total: number }>;
  upvote(postId: string): Promise<{ upvotesCount: number }>;
  removeUpvote(postId: string): Promise<{ upvotesCount: number }>;
  addComment(postId: string, input: { body: string }): Promise<Comment>;
  getComments(postId: string): Promise<Comment[]>;
}
