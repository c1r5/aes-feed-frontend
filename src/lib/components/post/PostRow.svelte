<script lang="ts">
	import type { Post } from '$lib/types'
	import Badge from '$lib/components/ui/Badge.svelte'

	let { post, index }: { post: Post; index: number } = $props()

	const isNew = $derived(Date.now() - new Date(post.created_at).getTime() < 86_400_000)
	const dateStr = $derived(
		new Date(post.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })
	)
</script>

<tr class:alt={index % 2 === 0}>
	<td class="col-index">{index}</td>
	<td class="col-badges">
		{#if post.is_premium}
			<Badge label="ENC" variant="enc" />
		{:else}
			<Badge label="FREE" variant="free" />
		{/if}
		{#if isNew}
			<Badge label="NEW" variant="new" />
		{/if}
	</td>
	<td class="col-title"><a href="/post/{post.slug}">{post.title}</a></td>
	<td class="col-author">{post.author}</td>
	<td class="col-date">{dateStr}</td>
</tr>

<style>
	tr.alt {
		background: var(--bg-surface);
	}
	tr:hover {
		background: var(--bg-hover);
	}
	td {
		padding: 6px 8px;
		border-bottom: 1px solid var(--border);
		font-family: var(--mono);
		font-size: 13px;
		white-space: nowrap;
	}
	.col-index {
		color: var(--text-muted);
		width: 30px;
		text-align: right;
	}
	.col-badges {
		width: 100px;
	}
	.col-title {
		white-space: normal;
	}
	.col-author {
		color: var(--text-muted);
		width: 70px;
	}
	.col-date {
		color: var(--text-muted);
		width: 50px;
		text-align: right;
	}
</style>
