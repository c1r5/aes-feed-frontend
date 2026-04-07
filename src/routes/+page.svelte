<script lang="ts">
	import { page } from '$app/state'
	import { posts } from '$lib/mock.svelte'
	import SideNav from '$lib/components/layout/SideNav.svelte'
	import FeedTable from '$lib/components/post/FeedTable.svelte'

	const filter = $derived(page.url.searchParams.get('filter') ?? 'all')
	const filtered = $derived(
		filter === 'all'
			? posts
			: filter === 'encrypted'
				? posts.filter((p) => p.is_premium)
				: posts.filter((p) => !p.is_premium)
	)
</script>

<div class="layout">
	<SideNav active={filter} />
	<main>
		<FeedTable posts={filtered} />
	</main>
</div>

<style>
	.layout {
		display: flex;
		min-height: 100vh;
	}
	main {
		flex: 1;
		padding: 16px;
	}
</style>
