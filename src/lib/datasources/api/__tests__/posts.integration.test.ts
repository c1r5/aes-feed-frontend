import { describe, test, expect, beforeAll } from 'vitest';
import { ApiAuthDataSource } from '../ApiAuthDataSource';
import { ApiPostsDataSource } from '../ApiPostsDataSource';
import { ApiError } from '../http';

describe('Posts API Integration', () => {
  const authApi = new ApiAuthDataSource();
  const postsApi = new ApiPostsDataSource();

  const ts = Date.now();
  const testUser = {
    username: `posts_${ts}`,
    email: `posts_${ts}@test.com`,
    password: 'test123456',
  };

  let createdFreePostId = '';
  let createdPremiumPostId = '';

  beforeAll(async () => {
    const session = await authApi.register(testUser);
    localStorage.setItem(
      'aesf33d:session',
      JSON.stringify({ token: session.token, user: session.user, expiresAt: session.expiresAt }),
    );
  });

  test('criar post free', async () => {
    const id = crypto.randomUUID();
    const post = await postsApi.createPost({
      id,
      title: 'Test Free Post',
      isPremium: false,
      content: 'Hello world from integration test',
    });
    expect(post.id).toBe(id);
    expect(post.isPremium).toBe(false);
    expect(post.content).toBe('Hello world from integration test');
    expect(post.encryptedBlob).toBeUndefined();
    createdFreePostId = post.id;
  });

  test('criar post premium com blob cifrado', async () => {
    const id = crypto.randomUUID();
    const fakeBlob = btoa('encrypted-content-placeholder');
    const fakePostSalt = btoa('0123456789abcdef');
    const fakeIv = btoa('012345678901');

    const post = await postsApi.createPost({
      id,
      title: 'Test Premium Post',
      isPremium: true,
      encryptedBlob: fakeBlob,
      postSalt: fakePostSalt,
      iv: fakeIv,
    });
    expect(post.id).toBe(id);
    expect(post.isPremium).toBe(true);
    expect(post.encryptedBlob).toBe(fakeBlob);
    expect(post.postSalt).toBe(fakePostSalt);
    expect(post.iv).toBe(fakeIv);
    expect(post.content).toBeUndefined();
    createdPremiumPostId = post.id;
  });

  test('servidor não altera blob cifrado (roundtrip fiel)', async () => {
    const id = crypto.randomUUID();
    const originalBlob = btoa(
      Array.from(crypto.getRandomValues(new Uint8Array(64)))
        .map((b) => String.fromCharCode(b))
        .join(''),
    );
    const postSalt = btoa('saltsaltsaltsalt');
    const iv = btoa('iviviviviviv');

    await postsApi.createPost({
      id,
      title: 'Blob Integrity Test',
      isPremium: true,
      encryptedBlob: originalBlob,
      postSalt,
      iv,
    });

    const fetched = await postsApi.getPost(id);
    expect(fetched.encryptedBlob).toBe(originalBlob);
    expect(fetched.postSalt).toBe(postSalt);
    expect(fetched.iv).toBe(iv);
  });

  test('ler post free por id', async () => {
    const post = await postsApi.getPost(createdFreePostId);
    expect(post.id).toBe(createdFreePostId);
    expect(post.isPremium).toBe(false);
  });

  test('ler post inexistente lança ApiError 404', async () => {
    await expect(postsApi.getPost('00000000-0000-0000-0000-000000000000')).rejects.toThrow(
      ApiError,
    );
    await expect(
      postsApi.getPost('00000000-0000-0000-0000-000000000000'),
    ).rejects.toMatchObject({ status: 404 });
  });

  test('listar posts retorna array paginado', async () => {
    const result = await postsApi.listPosts({ page: 1, limit: 10 });
    expect(Array.isArray(result.posts)).toBe(true);
    expect(result.total).toBeGreaterThan(0);
    expect(result.posts.length).toBeLessThanOrEqual(10);
  });

  test('listar apenas posts premium', async () => {
    const result = await postsApi.listPosts({ page: 1, limit: 20, premium: true });
    expect(result.posts.every((p) => p.isPremium)).toBe(true);
  });

  test('atualizar título de post', async () => {
    const updated = await postsApi.updatePost(createdFreePostId, { title: 'Updated Title' });
    expect(updated.title).toBe('Updated Title');
  });

  test('deletar post', async () => {
    const id = crypto.randomUUID();
    await postsApi.createPost({
      id,
      title: 'To be deleted',
      isPremium: false,
      content: 'ephemeral',
    });
    await expect(postsApi.deletePost(id)).resolves.toBeUndefined();
    await expect(postsApi.getPost(id)).rejects.toMatchObject({ status: 404 });
  });
});
