<script lang="ts">
	import { getUser, logout } from '$lib/session.svelte'
	import { goto } from '$app/navigation'

	let { active = 'all' }: { active?: string } = $props()

	const user = $derived(getUser())

	function handleLogout() {
		logout()
		goto('/')
	}
</script>

<nav>
	<a href="/" class="site-title">AES F33D</a>
	<div class="links">
		<a href="/" class:active={active === 'all'}>[ All ]</a>
		<a href="/?filter=encrypted" class:active={active === 'encrypted'}>[ Encrypted ]</a>
		<a href="/?filter=free" class:active={active === 'free'}>[ Free ]</a>
	</div>
	<div class="auth">
		{#if user}
			<a href="/write">[ Write ]</a>
			<span class="user-info">{user.author}</span>
			<button onclick={handleLogout}>[ Logout ]</button>
		{:else}
			<a href="/login">[ Login ]</a>
		{/if}
	</div>
</nav>

<style>
	nav {
		width: 160px;
		min-width: 160px;
		padding: 16px 12px;
		border-right: 1px solid var(--border);
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}
	.site-title {
		display: block;
		font-family: var(--mono);
		font-size: 16px;
		font-weight: bold;
		color: var(--accent);
		margin-bottom: 24px;
		text-decoration: none;
	}
	.site-title:hover {
		text-decoration: none;
		color: var(--accent);
	}
	.links {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.links a {
		font-family: var(--mono);
		font-size: 12px;
		color: var(--text-muted);
		padding: 4px 0;
		text-decoration: none;
	}
	.links a:hover,
	.links a.active {
		color: var(--text);
	}
	.auth {
		margin-top: auto;
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding-top: 16px;
		border-top: 1px solid var(--border);
	}
	.auth a {
		font-family: var(--mono);
		font-size: 12px;
		color: var(--text-muted);
		text-decoration: none;
	}
	.auth a:hover {
		color: var(--text);
	}
	.user-info {
		font-family: var(--mono);
		font-size: 11px;
		color: var(--accent);
	}
	button {
		background: none;
		border: none;
		color: var(--text-muted);
		font-family: var(--mono);
		font-size: 12px;
		cursor: pointer;
		padding: 0;
		text-align: left;
	}
	button:hover {
		color: var(--text);
	}
</style>
