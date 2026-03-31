<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { get } from 'svelte/store';
  import { session, currentUser } from '$lib/stores/auth';
  import { addPost } from '$lib/datasources/mock/MockPostDataSource';
  import { loadMasterKey } from '$lib/crypto/store';
  import { derivePostKey, encryptContent } from '$lib/crypto/crypto';
  import { generateRandom, arrayBufferToBase64 } from '$lib/crypto/utils';
  import { cachePostKey } from '$lib/crypto/store';

  let title = '';
  let content = '';
  let premium = false;
  let feedback = '';
  let feedbackType: 'success' | 'error' | 'info' = 'info';

  onMount(() => {
    if (!get(session)) goto('/login');
  });

  async function handlePublish(): Promise<void> {
    if (!title.trim()) {
      feedback = '[-] Título obrigatório.';
      feedbackType = 'error';
      return;
    }
    if (!content.trim()) {
      feedback = '[-] Conteúdo obrigatório.';
      feedbackType = 'error';
      return;
    }

    const postId = crypto.randomUUID();

    if (premium) {
      const masterKey = await loadMasterKey();
      if (!masterKey) {
        feedback = '[-] MasterKey não encontrada. Assine primeiro.';
        feedbackType = 'error';
        return;
      }

      try {
        const postSalt = generateRandom(16);
        const postKey = await derivePostKey(masterKey, postId, postSalt);
        const encrypted = await encryptContent(postKey, content);
        const postSaltBuffer = new ArrayBuffer(postSalt.byteLength);
        new Uint8Array(postSaltBuffer).set(postSalt);
        const postSaltB64 = arrayBufferToBase64(postSaltBuffer);

        await cachePostKey(postId, postSaltB64, postKey);

        addPost({
          id: postId,
          title: title.trim(),
          author: $currentUser?.username ?? 'anon',
          createdAt: new Date().toISOString(),
          upvotes: 0,
          premium: true,
          content: null,
          blob: encrypted.blob,
          iv: encrypted.iv,
          postSalt: postSaltB64,
          comments: [],
        });

        feedback = `[+] Post premium publicado: ${postId}`;
        feedbackType = 'success';
      } catch (e) {
        feedback = `[-] Erro na cifração: ${e instanceof Error ? e.message : String(e)}`;
        feedbackType = 'error';
        return;
      }
    } else {
      addPost({
        id: postId,
        title: title.trim(),
        author: $currentUser?.username ?? 'anon',
        createdAt: new Date().toISOString(),
        upvotes: 0,
        premium: false,
        content: content,
        blob: null,
        iv: null,
        postSalt: null,
        comments: [],
      });

      feedback = `[+] Post publicado: ${postId}`;
      feedbackType = 'success';
    }

    title = '';
    content = '';
    premium = false;
  }
</script>

<div class="editor">
  <h1 class="page-title">novo post</h1>

  <div class="field">
    <label for="title">título:</label>
    <input id="title" type="text" bind:value={title} />
  </div>

  <div class="field">
    <span class="field-label">tipo:</span>
    <div class="radio-group">
      <label class="radio-label">
        <input type="radio" bind:group={premium} value={false} /> free
      </label>
      <label class="radio-label">
        <input type="radio" bind:group={premium} value={true} /> premium
      </label>
    </div>
  </div>

  <div class="field">
    <label for="content">conteúdo:</label>
    <textarea id="content" bind:value={content} rows="15"></textarea>
  </div>

  <button class="primary" on:click={handlePublish}>publicar</button>

  {#if feedback}
    <div class="feedback" class:success={feedbackType === 'success'} class:error={feedbackType === 'error'} class:info={feedbackType === 'info'}>
      {feedback}
    </div>
  {/if}
</div>

<style>
  .editor {
    max-width: 100%;
  }

  .page-title {
    font-family: var(--font-mono);
    font-size: var(--font-size-xl);
    color: var(--text);
    font-weight: normal;
    margin-bottom: 16px;
  }

  .field {
    margin-bottom: 12px;
  }

  .field label,
  .field .field-label {
    display: block;
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
    color: var(--text-muted);
    margin-bottom: 4px;
  }

  .field input[type="text"] {
    width: 100%;
  }

  .field textarea {
    width: 100%;
    min-height: 300px;
    resize: vertical;
  }

  .radio-group {
    display: flex;
    gap: 16px;
  }

  .radio-label {
    display: inline-flex !important;
    align-items: center;
    gap: 4px;
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
    color: var(--text);
    cursor: pointer;
  }

  .feedback {
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
    margin-top: 8px;
  }

  .success { color: var(--success); }
  .error { color: var(--error); }
  .info { color: var(--text-muted); }
</style>
