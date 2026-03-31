<script lang="ts">
  import { upvotePost, formatRelativeTime } from '$lib/datasources/mock/MockPostDataSource';
  import type { MockPost } from '$lib/datasources/mock/MockPostDataSource';

  export let post: MockPost;

  function handleUpvote(e: MouseEvent): void {
    e.preventDefault();
    e.stopPropagation();
    upvotePost(post.id);
  }
</script>

<a href="/post/{post.id}" class="feed-row">
  <button class="upvote" on:click={handleUpvote} aria-label="Upvote">&#9650;</button>
  <span class="count">{post.upvotes}</span>
  <span class="title">
    {#if post.premium}<span class="premium-tag">[PREMIUM]</span>{/if}
    {post.title}
  </span>
  <span class="author">@{post.author}</span>
  <span class="time">{formatRelativeTime(post.createdAt)}</span>
</a>

<style>
  .feed-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 0;
    border-bottom: 1px solid var(--border);
    text-decoration: none;
    color: var(--text);
  }

  .feed-row:hover {
    background: var(--bg-surface);
    text-decoration: none;
  }

  .upvote {
    font-size: 10px;
    color: var(--text-muted);
    background: none;
    border: none;
    padding: 2px 4px;
    cursor: pointer;
    flex-shrink: 0;
  }

  .upvote:hover {
    color: var(--accent);
    border: none;
  }

  .count {
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
    min-width: 40px;
    text-align: right;
    color: var(--text-muted);
    flex-shrink: 0;
  }

  .title {
    font-family: var(--font-body);
    font-size: var(--font-size-lg);
    color: var(--text);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .premium-tag {
    font-family: var(--font-mono);
    font-size: var(--font-size-xs);
    color: var(--accent);
    margin-right: 4px;
  }

  .author {
    font-family: var(--font-mono);
    font-size: var(--font-size-xs);
    color: var(--text-muted);
    flex-shrink: 0;
  }

  .time {
    font-family: var(--font-mono);
    font-size: var(--font-size-xs);
    color: var(--text-dim);
    flex-shrink: 0;
    min-width: 24px;
    text-align: right;
  }
</style>
