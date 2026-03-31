<script lang="ts">
  import { page } from '$app/stores';
  import { posts, getPost, addComment, formatRelativeTime } from '$lib/datasources/mock/MockPostDataSource';
  import type { MockPost } from '$lib/datasources/mock/MockPostDataSource';
  import PostContent from '$lib/components/PostContent.svelte';
  import { isLoggedIn, currentUser } from '$lib/stores/auth';

  let commentText = '';
  let post: MockPost | undefined;

  $: post = getPost($page.params.id ?? '', $posts);

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  function handleComment(): void {
    if (!commentText.trim() || !post || !$isLoggedIn) return;
    addComment(post.id, {
      author: $currentUser?.username ?? 'anon',
      content: commentText.trim(),
      createdAt: new Date().toISOString(),
    });
    commentText = '';
  }
</script>

{#if post}
  <article class="post">
    <header class="post-header">
      <h1 class="post-title">
        {#if post.premium}<span class="premium-tag">[PREMIUM]</span>{/if}
        {post.title}
      </h1>
      <div class="post-meta">
        @{post.author} · {formatDate(post.createdAt)} · ▲ {post.upvotes}
      </div>
    </header>

    <div class="post-separator"></div>

    <div class="post-body">
      <PostContent {post} />
    </div>

    <div class="post-separator"></div>

    <section class="comments">
      <h2 class="comments-title">comentários ({post.comments.length})</h2>

      {#each post.comments as comment}
        <div class="comment">
          <div class="comment-meta">@{comment.author} · {formatRelativeTime(comment.createdAt)}</div>
          <div class="comment-body">{comment.content}</div>
        </div>
      {/each}

      {#if $isLoggedIn}
        <div class="comment-form">
          <input
            type="text"
            bind:value={commentText}
            placeholder="escrever comentário"
            on:keydown={(e) => e.key === 'Enter' && handleComment()}
          />
          <button on:click={handleComment}>enviar</button>
        </div>
      {:else}
        <p class="login-prompt">[*] <a href="/login">entre</a> para comentar</p>
      {/if}
    </section>
  </article>
{:else}
  <p class="not-found">[-] Post não encontrado.</p>
{/if}

<style>
  .post-header {
    margin-bottom: 12px;
  }

  .post-title {
    font-family: var(--font-mono);
    font-size: var(--font-size-xl);
    color: var(--text);
    font-weight: normal;
  }

  .premium-tag {
    color: var(--accent);
    font-size: var(--font-size-sm);
  }

  .post-meta {
    font-family: var(--font-mono);
    font-size: var(--font-size-xs);
    color: var(--text-muted);
    margin-top: 4px;
  }

  .post-separator {
    border-top: 1px solid var(--border);
    margin: 12px 0;
  }

  .post-body {
    min-height: 100px;
  }

  .comments-title {
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
    color: var(--text-muted);
    font-weight: normal;
    margin-bottom: 12px;
  }

  .comment {
    margin-bottom: 12px;
  }

  .comment-meta {
    font-family: var(--font-mono);
    font-size: var(--font-size-xs);
    color: var(--text-muted);
    margin-bottom: 2px;
  }

  .comment-body {
    font-family: var(--font-body);
    font-size: var(--font-size-md);
    color: var(--text);
    line-height: 1.5;
  }

  .comment-form {
    display: flex;
    gap: 8px;
    margin-top: 12px;
  }

  .comment-form input {
    flex: 1;
  }

  .login-prompt {
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
    color: var(--text-muted);
    margin-top: 12px;
  }

  .not-found {
    font-family: var(--font-mono);
    color: var(--error);
  }
</style>
