<script lang="ts">
  import { onMount } from 'svelte';
  import { loadMasterKey } from '$lib/crypto/store';
  import { derivePostKey, decryptContent } from '$lib/crypto/crypto';
  import { base64ToArrayBuffer } from '$lib/crypto/utils';
  import { checkAndEnforce } from '$lib/stores/subscription';
  import type { MockPost } from '$lib/datasources/mock/MockPostDataSource';

  export let post: MockPost;

  let state: 'loading' | 'free' | 'decrypted' | 'locked' | 'error' = 'loading';
  let decryptedContent = '';

  const NOISE_LINES = [
    '░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░',
    '░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░',
    '░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░',
    '░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░',
    '░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░',
  ];

  onMount(async () => {
    if (!post.premium) {
      state = 'free';
      return;
    }

    if (!post.blob || !post.iv || !post.postSalt) {
      state = 'locked';
      return;
    }

    const masterKey = await loadMasterKey();
    if (!masterKey) {
      state = 'locked';
      return;
    }

    const valid = await checkAndEnforce();
    if (!valid) return;

    try {
      const postSaltBytes = new Uint8Array(base64ToArrayBuffer(post.postSalt));
      const postKey = await derivePostKey(masterKey, post.id, postSaltBytes);
      decryptedContent = await decryptContent(postKey, post.blob, post.iv);
      state = 'decrypted';
    } catch {
      state = 'locked';
    }
  });
</script>

{#if state === 'loading'}
  <div class="content-body">
    <p class="info">[*] Carregando...</p>
  </div>
{:else if state === 'free'}
  <div class="content-body">
    {#each (post.content ?? '').split('\n') as paragraph}
      {#if paragraph.trim() === ''}
        <br />
      {:else}
        <p>{paragraph}</p>
      {/if}
    {/each}
  </div>
{:else if state === 'decrypted'}
  <div class="content-body">
    {#each decryptedContent.split('\n') as paragraph}
      {#if paragraph.trim() === ''}
        <br />
      {:else}
        <p>{paragraph}</p>
      {/if}
    {/each}
  </div>
{:else if state === 'locked'}
  <div class="locked-content">
    <div class="noise">
      {#each NOISE_LINES as line}
        <div>{line}</div>
      {/each}
    </div>
    <p class="locked-msg">[*] Conteúdo cifrado. Assine para acessar. → <a href="/subscribe">/subscribe</a></p>
  </div>
{/if}

<style>
  .content-body {
    font-family: var(--font-body);
    font-size: var(--font-size-md);
    line-height: 1.6;
    color: var(--text);
  }

  .content-body p {
    margin-bottom: 12px;
  }

  .info {
    font-family: var(--font-mono);
    color: var(--text-muted);
  }

  .locked-content {
    padding: 16px 0;
  }

  .noise {
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
    color: var(--text-dim);
    line-height: 1.4;
    margin-bottom: 16px;
    user-select: none;
  }

  .locked-msg {
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
    color: var(--text-muted);
  }

  .locked-msg a {
    color: var(--accent);
  }
</style>
