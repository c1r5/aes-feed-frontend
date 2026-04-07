<script lang="ts">
	let {
		onSuccess,
		onError
	}: { onSuccess: (plaintext: string) => void; onError: (message: string) => void } = $props()

	let secret = $state('')
	let loading = $state(false)

	function handleSubmit(e: Event) {
		e.preventDefault()
		onSuccess(secret)
	}
</script>

<form onsubmit={handleSubmit}>
	<label for="payment-secret">payment_secret</label>
	<input
		id="payment-secret"
		type="text"
		bind:value={secret}
		placeholder="enter payment secret"
		autocomplete="off"
		spellcheck="false"
	/>
	<button type="submit" disabled={!secret || loading}>
		{#if loading}
			<span class="blink">decrypting...</span>
		{:else}
			[ DECRYPT ]
		{/if}
	</button>
</form>

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: 8px;
		max-width: 400px;
	}
	label {
		font-family: var(--mono);
		font-size: 12px;
		color: var(--text-muted);
		text-transform: uppercase;
	}
	input {
		background: var(--bg);
		border: 1px solid var(--accent);
		color: var(--text);
		font-family: var(--mono);
		font-size: 13px;
		padding: 8px;
		outline: none;
	}
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
	.blink {
		animation: blink 1s step-end infinite;
	}
	@keyframes blink {
		50% {
			opacity: 0;
		}
	}
</style>
