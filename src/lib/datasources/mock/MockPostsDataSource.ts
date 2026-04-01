import { get } from 'svelte/store';
import { posts, addPost, upvotePost } from './MockPostDataSource';
import type { MockPost } from './MockPostDataSource';
import type {
  IPostsDataSource,
  Post,
  CreatePostInput,
  UpdatePostInput,
} from '$lib/datasources/interfaces/IPostsDataSource';

function toPost(p: MockPost): Post {
  return {
    id: p.id,
    authorId: p.author,
    authorUsername: p.author,
    title: p.title,
    isPremium: p.premium,
    encryptedBlob: p.blob ?? undefined,
    postSalt: p.postSalt ?? undefined,
    iv: p.iv ?? undefined,
    content: p.content ?? undefined,
    upvotesCount: p.upvotes,
    createdAt: p.createdAt,
    updatedAt: p.createdAt,
  };
}

export class MockPostsDataSource implements IPostsDataSource {
  async createPost(input: CreatePostInput): Promise<Post> {
    const post: MockPost = {
      id: input.id,
      title: input.title,
      author: 'user',
      createdAt: new Date().toISOString(),
      upvotes: 0,
      premium: input.isPremium,
      content: input.content ?? null,
      blob: input.encryptedBlob ?? null,
      iv: input.iv ?? null,
      postSalt: input.postSalt ?? null,
      comments: [],
    };
    addPost(post);
    return toPost(post);
  }

  async getPost(id: string): Promise<Post> {
    const found = get(posts).find((p) => p.id === id);
    if (!found) throw new Error('not_found');
    return toPost(found);
  }

  async listPosts(params: {
    page: number;
    limit: number;
    premium?: boolean;
  }): Promise<{ posts: Post[]; total: number }> {
    let all = get(posts);
    if (params.premium !== undefined) all = all.filter((p) => p.premium === params.premium);
    const offset = (params.page - 1) * params.limit;
    const page = all.slice(offset, offset + params.limit);
    return { posts: page.map(toPost), total: all.length };
  }

  async updatePost(id: string, input: UpdatePostInput): Promise<Post> {
    posts.update((all) =>
      all.map((p) => {
        if (p.id !== id) return p;
        return {
          ...p,
          title: input.title ?? p.title,
          blob: input.encryptedBlob ?? p.blob,
          postSalt: input.postSalt ?? p.postSalt,
          iv: input.iv ?? p.iv,
          content: input.content ?? p.content,
        };
      }),
    );
    return this.getPost(id);
  }

  async deletePost(id: string): Promise<void> {
    posts.update((all) => all.filter((p) => p.id !== id));
  }
}
