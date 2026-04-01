import { apiFetch } from './http';
import type {
  IFeedDataSource,
  FeedItem,
  Comment,
} from '$lib/datasources/interfaces/IFeedDataSource';

export class ApiFeedDataSource implements IFeedDataSource {
  async getFeed(params: {
    page: number;
    limit: number;
    sort: 'recent' | 'top';
  }): Promise<{ posts: FeedItem[]; total: number }> {
    const query = new URLSearchParams({
      page: String(params.page),
      limit: String(params.limit),
      sort: params.sort,
    });
    return apiFetch<{ posts: FeedItem[]; total: number }>(`/feed?${query}`);
  }

  async upvote(postId: string): Promise<{ upvotesCount: number }> {
    return apiFetch<{ upvotesCount: number }>(`/posts/${postId}/upvote`, { method: 'POST' });
  }

  async removeUpvote(postId: string): Promise<{ upvotesCount: number }> {
    return apiFetch<{ upvotesCount: number }>(`/posts/${postId}/upvote`, { method: 'DELETE' });
  }

  async addComment(postId: string, input: { body: string }): Promise<Comment> {
    const result = await apiFetch<{ comment: Comment }>(`/posts/${postId}/comments`, {
      method: 'POST',
      body: input,
    });
    return result.comment;
  }

  async getComments(postId: string): Promise<Comment[]> {
    const result = await apiFetch<{ comments: Comment[] }>(`/posts/${postId}/comments`);
    return result.comments;
  }
}
