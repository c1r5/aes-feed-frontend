<script lang="ts">
  import { posts } from '$lib/datasources/mock/MockPostDataSource';
  import FeedRow from '$lib/components/FeedRow.svelte';
</script>

<div class="feed">
  {#each $posts as post (post.id)}
    <FeedRow {post} />
  {/each}
</div>

<style>
  .feed {
    width: 100%;
  }
</style>
