<script lang="ts">
	import { page } from '$app/state'
	import { posts } from '$lib/mock.svelte'

	const post = $derived(posts.find((p) => p.slug === page.params.slug))

	const shareUrl = $derived(post ? `${page.url.origin}/post/${post.slug}` : '')

	function copyLink() {
		navigator.clipboard.writeText(shareUrl)
	}
</script>

{#if !post}
	<div class="shell">
		<p class="error">[-] post não encontrado</p>
		<p><a href="/">&larr; voltar ao feed</a></p>
	</div>
{:else}
	<div class="shell">
		<p class="success">[+] post publicado</p>
		<h1>{post.title}</h1>

		<div class="share-block">
			<span class="label">link para compartilhar</span>
			<div class="link-row">
				<code class="link-text">{shareUrl}</code>
				<button onclick={copyLink}>[ COPIAR ]</button>
			</div>
		</div>

		{#if post.is_premium}
			<p class="hint">conteúdo cifrado — apenas assinantes com MasterKey podem decifrar</p>
		{/if}

		<div class="actions">
			<a href="/post/{post.slug}">[ VER POST ]</a>
			<a href="/">&larr; feed</a>
		</div>
	</div>
{/if}

<style>
	.shell {
		max-width: 600px;
		margin: 60px auto;
		padding: 24px 16px;
	}
	.success {
		font-family: var(--mono);
		font-size: 14px;
		color: var(--success);
		margin-bottom: 8px;
	}
	h1 {
		font-family: var(--mono);
		font-size: 18px;
		color: #eee;
		margin-bottom: 20px;
	}
	.share-block {
		margin-bottom: 16px;
	}
	.label {
		font-family: var(--mono);
		font-size: 11px;
		color: var(--text-muted);
		text-transform: uppercase;
		display: block;
		margin-bottom: 6px;
	}
	.link-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.link-text {
		background: var(--bg-surface);
		border: 1px solid var(--border);
		padding: 8px;
		font-family: var(--mono);
		font-size: 12px;
		color: var(--link);
		word-break: break-all;
		flex: 1;
	}
	button {
		background: none;
		border: 1px solid var(--border);
		color: var(--text-muted);
		font-family: var(--mono);
		font-size: 11px;
		padding: 6px 10px;
		cursor: pointer;
		text-transform: uppercase;
		white-space: nowrap;
	}
	button:hover {
		border-color: var(--accent);
		color: var(--accent);
	}
	.hint {
		font-family: var(--mono);
		font-size: 12px;
		color: var(--text-muted);
		margin-bottom: 16px;
	}
	.actions {
		display: flex;
		gap: 16px;
		padding-top: 12px;
		border-top: 1px solid var(--border);
		font-family: var(--mono);
		font-size: 13px;
	}
	.error {
		font-family: var(--mono);
		font-size: 13px;
		color: var(--accent);
		margin-bottom: 12px;
	}
</style>
