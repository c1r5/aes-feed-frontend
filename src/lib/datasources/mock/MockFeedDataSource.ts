import { get } from 'svelte/store';
import { posts, upvotePost, addComment } from './MockPostDataSource';
import type {
  IFeedDataSource,
  FeedItem,
  Comment,
} from '$lib/datasources/interfaces/IFeedDataSource';

export class MockFeedDataSource implements IFeedDataSource {
  async getFeed(params: {
    page: number;
    limit: number;
    sort: 'recent' | 'top';
  }): Promise<{ posts: FeedItem[]; total: number }> {
    let all = [...get(posts)];
    if (params.sort === 'top') {
      all.sort((a, b) => b.upvotes - a.upvotes);
    } else {
      all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    const offset = (params.page - 1) * params.limit;
    const page = all.slice(offset, offset + params.limit);
    const items: FeedItem[] = page.map((p) => ({
      id: p.id,
      authorId: p.author,
      authorUsername: p.author,
      title: p.title,
      isPremium: p.premium,
      upvotesCount: p.upvotes,
      commentCount: p.comments.length,
      createdAt: p.createdAt,
    }));
    return { posts: items, total: all.length };
  }

  async upvote(postId: string): Promise<{ upvotesCount: number }> {
    upvotePost(postId);
    const post = get(posts).find((p) => p.id === postId);
    return { upvotesCount: post?.upvotes ?? 0 };
  }

  async removeUpvote(postId: string): Promise<{ upvotesCount: number }> {
    posts.update((all) =>
      all.map((p) => (p.id === postId ? { ...p, upvotes: Math.max(0, p.upvotes - 1) } : p)),
    );
    const post = get(posts).find((p) => p.id === postId);
    return { upvotesCount: post?.upvotes ?? 0 };
  }

  async addComment(postId: string, input: { body: string }): Promise<Comment> {
    const comment = {
      author: 'user',
      content: input.body,
      createdAt: new Date().toISOString(),
    };
    addComment(postId, comment);
    return {
      id: crypto.randomUUID(),
      postId,
      authorId: 'user',
      authorUsername: 'user',
      body: input.body,
      createdAt: comment.createdAt,
    };
  }

  async getComments(postId: string): Promise<Comment[]> {
    const post = get(posts).find((p) => p.id === postId);
    if (!post) return [];
    return post.comments.map((c) => ({
      id: crypto.randomUUID(),
      postId,
      authorId: c.author,
      authorUsername: c.author,
      body: c.content,
      createdAt: c.createdAt,
    }));
  }
}
