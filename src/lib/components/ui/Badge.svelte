<script lang="ts">
	let { label, variant }: { label: string; variant: 'enc' | 'free' | 'new' } = $props()
</script>

<span class="badge {variant}">[{label}]</span>

<style>
	.badge {
		display: inline-block;
		padding: 1px 4px;
		font-family: var(--mono);
		font-size: 11px;
		font-weight: bold;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
	.enc {
		background: var(--accent);
		color: #fff;
	}
	.free {
		background: #333;
		color: #999;
	}
	.new {
		background: var(--accent);
		color: #fff;
	}
</style>
