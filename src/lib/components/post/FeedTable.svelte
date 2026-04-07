<script lang="ts">
	import type { Post } from '$lib/types'
	import PostRow from '$lib/components/post/PostRow.svelte'

	let { posts }: { posts: Post[] } = $props()
</script>

<table>
	<thead>
		<tr>
			<th>#</th>
			<th>type</th>
			<th>title</th>
			<th>author</th>
			<th>date</th>
		</tr>
	</thead>
	<tbody>
		{#each posts as post, i}
			<PostRow {post} index={i + 1} />
		{/each}
	</tbody>
</table>

<style>
	table {
		width: 100%;
		border-collapse: collapse;
	}
	thead tr {
		border-bottom: 1px solid var(--border);
	}
	th {
		padding: 6px 8px;
		font-family: var(--mono);
		font-size: 11px;
		font-weight: normal;
		color: var(--text-muted);
		text-transform: uppercase;
		text-align: left;
	}
	th:first-child {
		text-align: right;
		width: 30px;
	}
	th:last-child {
		text-align: right;
		width: 50px;
	}
</style>
