<script lang="ts">
	import DevModal from '$lib/components/DevModal.svelte'

	let { children } = $props()
</script>

<svelte:head>
	<title>AES F33D</title>
</svelte:head>

{@render children()}
<DevModal />

<style>
	:global(:root) {
		--bg: #0f0f0f;
		--bg-surface: #1a1a1a;
		--bg-hover: #222222;
		--border: #2a2a2a;
		--text: #cccccc;
		--text-muted: #666666;
		--accent: #cc0000;
		--accent-dim: #880000;
		--link: #4a9eff;
		--link-hover: #7ab8ff;
		--success: #4a9e4a;
		--mono: 'Courier New', Courier, monospace;
		--sans: 'Verdana', Geneva, sans-serif;
	}

	:global(*) {
		box-sizing: border-box;
		border-radius: 0;
		margin: 0;
		padding: 0;
	}

	:global(body) {
		background: var(--bg);
		color: var(--text);
		font-family: var(--sans);
		font-size: 13px;
	}

	:global(a) {
		color: var(--link);
		text-decoration: none;
	}

	:global(a:hover) {
		color: var(--link-hover);
		text-decoration: underline;
	}
</style>
