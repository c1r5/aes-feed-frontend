import { apiFetch } from './http';
import type {
  IPostsDataSource,
  Post,
  CreatePostInput,
  UpdatePostInput,
} from '$lib/datasources/interfaces/IPostsDataSource';

export class ApiPostsDataSource implements IPostsDataSource {
  async createPost(input: CreatePostInput): Promise<Post> {
    const result = await apiFetch<{ post: Post }>('/posts', { method: 'POST', body: input });
    return result.post;
  }

  async getPost(id: string): Promise<Post> {
    const result = await apiFetch<{ post: Post }>(`/posts/${id}`);
    return result.post;
  }

  async listPosts(params: {
    page: number;
    limit: number;
    premium?: boolean;
  }): Promise<{ posts: Post[]; total: number }> {
    const query = new URLSearchParams({
      page: String(params.page),
      limit: String(params.limit),
    });
    if (params.premium !== undefined) query.set('premium', String(params.premium));
    return apiFetch<{ posts: Post[]; total: number }>(`/posts?${query}`);
  }

  async updatePost(id: string, input: UpdatePostInput): Promise<Post> {
    const result = await apiFetch<{ post: Post }>(`/posts/${id}`, {
      method: 'PUT',
      body: input,
    });
    return result.post;
  }

  async deletePost(id: string): Promise<void> {
    await apiFetch<Record<string, never>>(`/posts/${id}`, { method: 'DELETE' });
  }
}
