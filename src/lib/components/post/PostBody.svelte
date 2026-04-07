<script lang="ts">
	import { marked } from 'marked'

	let { content }: { content: string } = $props()

	const html = $derived(marked.parse(content) as string)
</script>

<div class="post-body">
	{@html html}
</div>

<style>
	.post-body {
		font-family: var(--sans);
		font-size: 14px;
		line-height: 1.6;
		color: var(--text);
		padding: 16px 0;
	}
	.post-body :global(h1),
	.post-body :global(h2),
	.post-body :global(h3) {
		color: #eee;
		margin: 16px 0 8px;
		font-family: var(--mono);
	}
	.post-body :global(h1) {
		font-size: 18px;
	}
	.post-body :global(h2) {
		font-size: 15px;
	}
	.post-body :global(code) {
		font-family: var(--mono);
		font-size: 12px;
		background: var(--bg-surface);
		padding: 1px 4px;
	}
	.post-body :global(pre) {
		background: var(--bg-surface);
		border: 1px solid var(--border);
		padding: 12px;
		overflow-x: auto;
		margin: 8px 0;
	}
	.post-body :global(pre code) {
		background: none;
		padding: 0;
	}
	.post-body :global(blockquote) {
		border-left: 2px solid var(--accent);
		padding-left: 12px;
		color: var(--text-muted);
		margin: 8px 0;
	}
	.post-body :global(table) {
		border-collapse: collapse;
		margin: 8px 0;
	}
	.post-body :global(th),
	.post-body :global(td) {
		border: 1px solid var(--border);
		padding: 4px 8px;
		font-size: 12px;
	}
	.post-body :global(th) {
		background: var(--bg-surface);
		color: #eee;
	}
	.post-body :global(ul),
	.post-body :global(ol) {
		padding-left: 20px;
		margin: 8px 0;
	}
	.post-body :global(p) {
		margin: 8px 0;
	}
	.post-body :global(strong) {
		color: #eee;
	}
</style>
