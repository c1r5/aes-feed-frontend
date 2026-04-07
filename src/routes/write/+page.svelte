<script lang="ts">
	import { goto } from '$app/navigation'
	import { getUser } from '$lib/session.svelte'
	import { derivePostKey, encryptPost, base64ToBytes, bytesToBase64 } from '$lib/crypto'
	import { loadKey } from '$lib/storage'
	import { addPost } from '$lib/mock.svelte'
	import type { Post } from '$lib/types'

	const user = $derived(getUser())

	let title = $state('')
	let body = $state('')
	let isPremium = $state(false)
	let loading = $state(false)
	let error = $state<string | null>(null)

	function toSlug(t: string): string {
		return (
			t
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-|-$/g, '') +
			'-' +
			Math.random().toString(36).substring(2, 6)
		)
	}

	async function handleSubmit(e: Event) {
		e.preventDefault()
		if (!user) return
		if (!title.trim() || !body.trim()) {
			error = 'título e conteúdo são obrigatórios'
			return
		}

		loading = true
		error = null

		const postId = crypto.randomUUID()
		const slug = toSlug(title)
		const post: Post = {
			id: postId,
			slug,
			title: title.trim(),
			author: user.author,
			is_premium: isPremium,
			created_at: new Date().toISOString()
		}

		if (isPremium) {
			const masterKey = await loadKey('masterKey')
			if (!masterKey) {
				error = 'MasterKey não encontrada — gere uma no painel Dev'
				loading = false
				return
			}
			const postSalt = crypto.getRandomValues(new Uint8Array(16))
			const postKey = await derivePostKey(masterKey, postId, postSalt)
			post.encrypted_blob = await encryptPost(postKey, body)
			post.post_salt = bytesToBase64(postSalt)
		} else {
			post.body = body
		}

		addPost(post)
		loading = false
		goto(`/post/${slug}/created`)
	}

	$effect(() => {
		if (!getUser()) goto('/login')
	})
</script>

{#if user}
	<div class="shell">
		<h1>[ WRITE ]</h1>

		{#if error}
			<p class="error">[-] {error}</p>
		{/if}

		<form onsubmit={handleSubmit}>
			<label for="post-title">título</label>
			<input id="post-title" type="text" bind:value={title} placeholder="título do post" autocomplete="off" />

			<label for="post-body">conteúdo (markdown)</label>
			<textarea id="post-body" bind:value={body} rows="12" placeholder="escreva seu conteúdo aqui..."></textarea>

			<fieldset>
				<legend>tipo</legend>
				<label class="radio-label">
					<input type="radio" bind:group={isPremium} value={false} /> FREE
				</label>
				<label class="radio-label">
					<input type="radio" bind:group={isPremium} value={true} /> PREMIUM
				</label>
			</fieldset>

			{#if isPremium}
				<p class="hint">o conteúdo será cifrado com sua MasterKey local. leitores precisam de assinatura para decifrar.</p>
			{/if}

			<button type="submit" disabled={loading}>
				{#if loading}<span class="blink">publicando...</span>{:else}[ PUBLICAR ]{/if}
			</button>
		</form>
	</div>
{/if}

<style>
	.shell {
		max-width: 600px;
		margin: 40px auto;
		padding: 24px 16px;
	}
	h1 {
		font-family: var(--mono);
		font-size: 16px;
		color: var(--accent);
		margin-bottom: 20px;
	}
	.error {
		font-family: var(--mono);
		font-size: 13px;
		color: var(--accent);
		margin-bottom: 12px;
	}
	.hint {
		font-family: var(--mono);
		font-size: 11px;
		color: var(--text-muted);
		margin: 4px 0;
	}
	form {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	label {
		font-family: var(--mono);
		font-size: 12px;
		color: var(--text-muted);
		text-transform: uppercase;
	}
	input[type='text'],
	textarea {
		background: var(--bg);
		border: 1px solid var(--border);
		color: var(--text);
		font-family: var(--mono);
		font-size: 13px;
		padding: 8px;
		outline: none;
		resize: vertical;
	}
	input[type='text']:focus,
	textarea:focus {
		border-color: var(--link);
	}
	fieldset {
		border: 1px solid var(--border);
		padding: 8px 12px;
		display: flex;
		gap: 16px;
	}
	legend {
		font-family: var(--mono);
		font-size: 11px;
		color: var(--text-muted);
		text-transform: uppercase;
		padding: 0 4px;
	}
	.radio-label {
		display: flex;
		align-items: center;
		gap: 4px;
		cursor: pointer;
	}
	input[type='radio'] {
		accent-color: var(--accent);
	}
	button {
		background: none;
		border: 1px solid var(--accent);
		color: var(--accent);
		font-family: var(--mono);
		font-size: 13px;
		padding: 8px 16px;
		cursor: pointer;
		text-transform: uppercase;
		align-self: flex-start;
		margin-top: 8px;
	}
	button:hover:not(:disabled) {
		background: var(--accent);
		color: #fff;
	}
	button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.blink {
		animation: blink 1s step-end infinite;
	}
	@keyframes blink {
		50% {
			opacity: 0;
		}
	}
</style>
