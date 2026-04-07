<script lang="ts">
	import {
		generateMasterKey,
		derivePostKey,
		encryptPost,
		decryptPost,
		bytesToBase64,
		base64ToBytes
	} from '$lib/crypto'
	import type { AppError } from '$lib/types'

	let encPlaintext = $state('')
	let encPostId = $state(crypto.randomUUID())
	let encResult = $state<{ blob: string; salt: string; postId: string } | null>(null)
	let encLoading = $state(false)

	let decBlob = $state('')
	let decSalt = $state('')
	let decPostId = $state('')
	let decResult = $state<string | null>(null)
	let decError = $state<string | null>(null)
	let decLoading = $state(false)

	let sessionKey: CryptoKey | null = null

	async function ensureKey(): Promise<CryptoKey> {
		if (!sessionKey) sessionKey = await generateMasterKey()
		return sessionKey
	}

	async function handleEncrypt() {
		encLoading = true
		encResult = null
		try {
			const masterKey = await ensureKey()
			const postSalt = crypto.getRandomValues(new Uint8Array(16))
			const postKey = await derivePostKey(masterKey, encPostId, postSalt)
			const blob = await encryptPost(postKey, encPlaintext)
			encResult = { blob, salt: bytesToBase64(postSalt), postId: encPostId }
		} finally {
			encLoading = false
		}
	}

	async function handleDecrypt() {
		decLoading = true
		decResult = null
		decError = null
		try {
			const masterKey = await ensureKey()
			const saltBytes = base64ToBytes(decSalt)
			const postKey = await derivePostKey(masterKey, decPostId, saltBytes)
			decResult = await decryptPost(postKey, decBlob)
		} catch (e) {
			const err = e as AppError
			decError = err.kind === 'crypto' ? err.message : 'erro desconhecido'
		} finally {
			decLoading = false
		}
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text)
	}
</script>

<div class="sandbox">
	<div class="panel">
		<h2>encrypt</h2>
		<label for="enc-plaintext">plaintext</label>
		<textarea id="enc-plaintext" bind:value={encPlaintext} rows="6" placeholder="conteúdo para cifrar"></textarea>
		<label for="enc-postid">post_id</label>
		<input id="enc-postid" type="text" bind:value={encPostId} autocomplete="off" />
		<button onclick={handleEncrypt} disabled={!encPlaintext || encLoading}>
			{#if encLoading}<span class="blink">cifrando...</span>{:else}[ ENCRYPT ]{/if}
		</button>

		{#if encResult}
			<div class="output">
				<div class="output-row">
					<span class="output-label">encrypted_blob</span>
					<button class="copy" onclick={() => copyToClipboard(encResult!.blob)}>[ COPY ]</button>
				</div>
				<pre>{encResult.blob}</pre>
				<div class="output-row">
					<span class="output-label">post_salt (base64)</span>
					<button class="copy" onclick={() => copyToClipboard(encResult!.salt)}>[ COPY ]</button>
				</div>
				<pre>{encResult.salt}</pre>
				<div class="output-row">
					<span class="output-label">post_id</span>
					<button class="copy" onclick={() => copyToClipboard(encResult!.postId)}>[ COPY ]</button>
				</div>
				<pre>{encResult.postId}</pre>
			</div>
		{/if}
	</div>

	<div class="panel">
		<h2>decrypt</h2>
		<label for="dec-blob">encrypted_blob</label>
		<textarea id="dec-blob" bind:value={decBlob} rows="4" placeholder="blob base64"></textarea>
		<label for="dec-salt">post_salt (base64)</label>
		<input id="dec-salt" type="text" bind:value={decSalt} placeholder="salt base64" autocomplete="off" />
		<label for="dec-postid">post_id</label>
		<input id="dec-postid" type="text" bind:value={decPostId} placeholder="UUID do post" autocomplete="off" />
		<button onclick={handleDecrypt} disabled={!decBlob || !decSalt || !decPostId || decLoading}>
			{#if decLoading}<span class="blink">decifrando...</span>{:else}[ DECRYPT ]{/if}
		</button>

		{#if decResult}
			<div class="output">
				<p class="success">[+] decifrado</p>
				<pre>{decResult}</pre>
			</div>
		{/if}
		{#if decError}
			<p class="error">[-] falhou: {decError}</p>
		{/if}
	</div>
</div>

<style>
	.sandbox {
		display: flex;
		min-height: 100vh;
	}
	.panel {
		flex: 1;
		padding: 24px 16px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.panel:first-child {
		border-right: 1px solid var(--border);
	}
	h2 {
		font-family: var(--mono);
		font-size: 14px;
		color: var(--accent);
		text-transform: uppercase;
		margin-bottom: 8px;
	}
	label,
	.output-label {
		font-family: var(--mono);
		font-size: 11px;
		color: var(--text-muted);
		text-transform: uppercase;
	}
	textarea,
	input {
		background: var(--bg);
		border: 1px solid var(--border);
		color: var(--text);
		font-family: var(--mono);
		font-size: 13px;
		padding: 8px;
		outline: none;
		resize: vertical;
	}
	textarea:focus,
	input:focus {
		border-color: var(--link);
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
	}
	button:hover:not(:disabled) {
		background: var(--accent);
		color: #fff;
	}
	button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.output {
		margin-top: 8px;
	}
	.output-row {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 4px;
	}
	.copy {
		font-size: 11px;
		padding: 2px 6px;
		border-color: var(--border);
		color: var(--text-muted);
	}
	.copy:hover {
		border-color: var(--accent);
		color: var(--accent);
		background: none;
	}
	pre {
		background: var(--bg-surface);
		border: 1px solid var(--border);
		padding: 8px;
		font-family: var(--mono);
		font-size: 12px;
		white-space: pre-wrap;
		word-break: break-all;
		margin-bottom: 8px;
	}
	.success {
		font-family: var(--mono);
		font-size: 13px;
		color: var(--success);
		margin-bottom: 4px;
	}
	.error {
		font-family: var(--mono);
		font-size: 13px;
		color: var(--accent);
		margin-top: 8px;
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
