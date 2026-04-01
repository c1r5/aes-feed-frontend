import { describe, test, expect } from 'vitest';
import { ApiAuthDataSource } from '../ApiAuthDataSource';
import { ApiPostsDataSource } from '../ApiPostsDataSource';
import { ApiSubscriptionDataSource } from '../ApiSubscriptionDataSource';
import { apiFetch } from '../http';
import { deriveMasterKey, derivePostKey, encryptContent, decryptContent } from '$lib/crypto/crypto';
import { arrayBufferToBase64, base64ToArrayBuffer } from '$lib/crypto/utils';

describe('Crypto E2E Roundtrip via API', () => {
  test('fluxo completo: register → subscribe → write premium → read → decrypt', async () => {
    const authApi = new ApiAuthDataSource();
    const postsApi = new ApiPostsDataSource();
    const subApi = new ApiSubscriptionDataSource();

    const ts = Date.now();
    const user = {
      username: `roundtrip_${ts}`,
      email: `roundtrip_${ts}@test.com`,
      password: 'test123456',
    };

    // 1. Register
    const session = await authApi.register(user);
    localStorage.setItem(
      'aesf33d:session',
      JSON.stringify({ token: session.token, user: session.user, expiresAt: session.expiresAt }),
    );

    const userSalt = new Uint8Array(base64ToArrayBuffer(session.user.userSalt));

    // 2. Activate subscription via admin endpoint
    await apiFetch(`/admin/activate-subscription/${session.user.id}`, { method: 'POST' });

    // 3. Get PaymentSecret (entregue apenas uma vez)
    const status = await subApi.getStatus();
    expect(status.paymentSecret).toBeDefined();
    const paymentSecret = new Uint8Array(base64ToArrayBuffer(status.paymentSecret!));

    // 4. Derive MasterKey
    const masterKey = await deriveMasterKey(paymentSecret, userSalt);

    // 5. Derive PostKey e cifrar conteúdo
    const postId = crypto.randomUUID();
    const postSalt = crypto.getRandomValues(new Uint8Array(16));
    const postKey = await derivePostKey(masterKey, postId, postSalt);
    const originalContent = 'Conteúdo secreto de teste — roundtrip E2E';
    const { blob, iv } = await encryptContent(postKey, originalContent);

    // 6. Criar post premium na API
    await postsApi.createPost({
      id: postId,
      title: 'Crypto Roundtrip Test',
      isPremium: true,
      encryptedBlob: blob,
      postSalt: arrayBufferToBase64(new ArrayBuffer(postSalt.byteLength)),
      iv,
    });

    // 7. Ler post de volta
    const post = await postsApi.getPost(postId);
    expect(post.encryptedBlob).toBe(blob);

    // 8. Re-derivar PostKey a partir dos dados do servidor e decifrar
    const storedPostSalt = new Uint8Array(base64ToArrayBuffer(post.postSalt!));
    const readPostKey = await derivePostKey(masterKey, postId, storedPostSalt);
    const decrypted = await decryptContent(readPostKey, post.encryptedBlob!, post.iv!);

    // 9. Verificar integridade
    expect(decrypted).toBe(originalContent);
  });
});
