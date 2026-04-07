<script lang="ts">
	import { page } from '$app/state'
	import { posts } from '$lib/mock.svelte'
	import { derivePostKey, decryptPost, base64ToBytes } from '$lib/crypto'
	import { loadKey } from '$lib/storage'
	import { checkSubscription } from '$lib/subscription'
	import type { AppError } from '$lib/types'
	import PostBody from '$lib/components/post/PostBody.svelte'
	import Badge from '$lib/components/ui/Badge.svelte'

	const post = $derived(posts.find((p) => p.slug === page.params.slug))

	let decryptedContent = $state<string | null>(null)
	let error = $state<string | null>(null)
	let noKey = $state(false)
	let subExpired = $state(false)
	let loading = $state(false)

	async function tryDecrypt() {
		if (!post?.is_premium || !post.encrypted_blob || !post.post_salt) return

		loading = true
		error = null
		noKey = false
		subExpired = false

		const masterKey = await loadKey('masterKey')
		if (!masterKey) {
			noKey = true
			loading = false
			return
		}

		const sub = checkSubscription()
		if (!sub.valid) {
			subExpired = true
			loading = false
			return
		}

		try {
			const saltBytes = base64ToBytes(post.post_salt)
			const postKey = await derivePostKey(masterKey, post.id, saltBytes)
			decryptedContent = await decryptPost(postKey, post.encrypted_blob)
		} catch (e) {
			const err = e as AppError
			error = err.kind === 'crypto' ? err.message : 'erro desconhecido'
		} finally {
			loading = false
		}
	}

	$effect(() => {
		if (post?.is_premium && !decryptedContent && !error && !noKey && !subExpired) {
			tryDecrypt()
		}
	})
</script>

{#if !post}
	<div class="shell">
		<p class="error">[-] post não encontrado</p>
		<p><a href="/">&larr; voltar ao feed</a></p>
	</div>
{:else}
	<div class="shell">
		<div class="header">
			<a href="/" class="back">&larr; feed</a>
			<Badge label={post.is_premium ? 'ENC' : 'FREE'} variant={post.is_premium ? 'enc' : 'free'} />
		</div>
		<h1>{post.title}</h1>
		<div class="meta">
			<span>{post.author}</span>
			<span>{new Date(post.created_at).toLocaleDateString('pt-BR')}</span>
		</div>

		{#if !post.is_premium && post.body}
			<PostBody content={post.body} />
		{:else if loading}
			<p class="blink">decifrando...</p>
		{:else if decryptedContent}
			<p class="success">[+] decifrado</p>
			<PostBody content={decryptedContent} />
		{:else if noKey}
			<div class="gate">
				<p>conteúdo premium — necessita de assinatura</p>
				<a href="/subscribe" class="action-btn">[ Assinar ]</a>
			</div>
		{:else if subExpired}
			<div class="gate">
				<p class="error">[-] Assinatura expirada</p>
				<a href="/subscribe" class="action-btn">[ Renovar assinatura ]</a>
			</div>
		{:else if error}
			<div class="gate">
				<p class="error">[-] {error}</p>
				<button onclick={tryDecrypt} class="action-btn">[ Tentar novamente ]</button>
			</div>
		{/if}
	</div>
{/if}

<style>
	.shell {
		max-width: 720px;
		margin: 0 auto;
		padding: 24px 16px;
	}
	.header {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 12px;
	}
	.back {
		font-family: var(--mono);
		font-size: 12px;
	}
	h1 {
		font-family: var(--mono);
		font-size: 18px;
		color: #eee;
		margin-bottom: 8px;
	}
	.meta {
		font-family: var(--mono);
		font-size: 12px;
		color: var(--text-muted);
		display: flex;
		gap: 16px;
		margin-bottom: 16px;
		padding-bottom: 12px;
		border-bottom: 1px solid var(--border);
	}
	.gate {
		padding: 16px 0;
		font-family: var(--mono);
		font-size: 13px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.action-btn {
		display: inline-block;
		font-family: var(--mono);
		font-size: 13px;
		border: 1px solid var(--accent);
		color: var(--accent);
		padding: 8px 16px;
		text-decoration: none;
		background: none;
		cursor: pointer;
		align-self: flex-start;
	}
	.action-btn:hover {
		background: var(--accent);
		color: #fff;
		text-decoration: none;
	}
	.error {
		font-family: var(--mono);
		font-size: 13px;
		color: var(--accent);
	}
	.success {
		font-family: var(--mono);
		font-size: 13px;
		color: var(--success);
		margin-bottom: 8px;
	}
	.blink {
		font-family: var(--mono);
		font-size: 13px;
		color: var(--text-muted);
		animation: blink 1s step-end infinite;
	}
	@keyframes blink {
		50% {
			opacity: 0;
		}
	}
</style>
