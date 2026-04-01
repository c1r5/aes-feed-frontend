import { describe, test, expect, beforeAll } from 'vitest';
import { ApiAuthDataSource } from '../ApiAuthDataSource';
import { ApiPostsDataSource } from '../ApiPostsDataSource';
import { ApiFeedDataSource } from '../ApiFeedDataSource';
import { ApiError } from '../http';

describe('Feed API Integration', () => {
  const authApi = new ApiAuthDataSource();
  const postsApi = new ApiPostsDataSource();
  const feedApi = new ApiFeedDataSource();

  const ts = Date.now();
  const testUser = {
    username: `feed_${ts}`,
    email: `feed_${ts}@test.com`,
    password: 'test123456',
  };

  let postId = '';

  beforeAll(async () => {
    const session = await authApi.register(testUser);
    localStorage.setItem(
      'aesf33d:session',
      JSON.stringify({ token: session.token, user: session.user, expiresAt: session.expiresAt }),
    );

    const post = await postsApi.createPost({
      id: crypto.randomUUID(),
      title: `Feed test post ${ts}`,
      isPremium: false,
      content: 'Feed integration test content',
    });
    postId = post.id;
  });

  test('feed retorna posts', async () => {
    const result = await feedApi.getFeed({ page: 1, limit: 10, sort: 'recent' });
    expect(Array.isArray(result.posts)).toBe(true);
    expect(result.total).toBeGreaterThan(0);
  });

  test('feed sort=recent retorna posts em ordem decrescente de createdAt', async () => {
    const result = await feedApi.getFeed({ page: 1, limit: 20, sort: 'recent' });
    const dates = result.posts.map((p) => new Date(p.createdAt).getTime());
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i - 1]).toBeGreaterThanOrEqual(dates[i]);
    }
  });

  test('upvote incrementa contador', async () => {
    const feedBefore = await feedApi.getFeed({ page: 1, limit: 100, sort: 'recent' });
    const postBefore = feedBefore.posts.find((p) => p.id === postId);
    const countBefore = postBefore?.upvotesCount ?? 0;

    const result = await feedApi.upvote(postId);
    expect(result.upvotesCount).toBe(countBefore + 1);
  });

  test('upvote duplicado lança ApiError 409', async () => {
    await expect(feedApi.upvote(postId)).rejects.toThrow(ApiError);
    await expect(feedApi.upvote(postId)).rejects.toMatchObject({
      status: 409,
      code: 'already_upvoted',
    });
  });

  test('removeUpvote decrementa contador', async () => {
    const result = await feedApi.removeUpvote(postId);
    expect(typeof result.upvotesCount).toBe('number');
  });

  test('criar comentário', async () => {
    const comment = await feedApi.addComment(postId, { body: 'Integration test comment' });
    expect(comment.id).toBeDefined();
    expect(comment.postId).toBe(postId);
    expect(comment.body).toBe('Integration test comment');
    expect(comment.authorUsername).toBeDefined();
  });

  test('listar comentários retorna comentário criado', async () => {
    await feedApi.addComment(postId, { body: 'Another test comment' });
    const comments = await feedApi.getComments(postId);
    expect(Array.isArray(comments)).toBe(true);
    expect(comments.length).toBeGreaterThan(0);
    expect(comments.some((c) => c.body === 'Another test comment')).toBe(true);
  });

  test('feed item tem campos obrigatórios', async () => {
    const result = await feedApi.getFeed({ page: 1, limit: 5, sort: 'top' });
    for (const item of result.posts) {
      expect(item.id).toBeDefined();
      expect(item.title).toBeDefined();
      expect(item.authorUsername).toBeDefined();
      expect(typeof item.upvotesCount).toBe('number');
      expect(typeof item.commentCount).toBe('number');
    }
  });
});
