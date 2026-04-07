<script lang="ts">
	import { goto } from '$app/navigation'
	import { getUser, login } from '$lib/session.svelte'

	let handle = $state('')

	function generateHandle(): string {
		const bytes = crypto.getRandomValues(new Uint8Array(3))
		return Array.from(bytes)
			.map((b) => b.toString(16).padStart(2, '0'))
			.join('')
	}

	function handleSubmit(e: Event) {
		e.preventDefault()
		const author = handle.trim() || generateHandle()
		login(author)
		goto('/')
	}

	if (getUser()) goto('/')
</script>

<div class="shell">
	<h1>[ LOGIN ]</h1>
	<p class="desc">enter a handle or leave blank for random identity</p>
	<form onsubmit={handleSubmit}>
		<label for="handle">handle</label>
		<input
			id="handle"
			type="text"
			bind:value={handle}
			placeholder="e.g. a3f7c1"
			autocomplete="off"
			spellcheck="false"
			maxlength="12"
		/>
		<button type="submit">[ LOGIN ]</button>
	</form>
</div>

<style>
	.shell {
		max-width: 400px;
		margin: 80px auto;
		padding: 24px 16px;
	}
	h1 {
		font-family: var(--mono);
		font-size: 16px;
		color: var(--accent);
		margin-bottom: 8px;
	}
	.desc {
		font-family: var(--mono);
		font-size: 12px;
		color: var(--text-muted);
		margin-bottom: 24px;
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
	input {
		background: var(--bg);
		border: 1px solid var(--border);
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
	button:hover {
		background: var(--accent);
		color: #fff;
	}
</style>
