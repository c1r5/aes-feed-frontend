<script lang="ts">
	import {
		generateMasterKey,
		importMasterKeyFromHex,
		TEST_MASTER_KEY_HEX
	} from '$lib/crypto'
	import { saveKey, loadKey, deleteKey } from '$lib/storage'
	import {
		checkSubscription,
		mockSubscriptionValid,
		mockSubscriptionExpired
	} from '$lib/subscription'

	let open = $state(false)
	let hasMasterKey = $state(false)
	let subStatus = $state(checkSubscription())
	let message = $state<string | null>(null)

	async function refreshStatus() {
		const key = await loadKey('masterKey')
		hasMasterKey = key !== null
		subStatus = checkSubscription()
		message = null
	}

	async function handleGenerate() {
		const key = await generateMasterKey()
		await saveKey('masterKey', key)
		message = '[+] nova MasterKey gerada'
		await refreshStatus()
	}

	async function handleLoadTest() {
		const key = await importMasterKeyFromHex(TEST_MASTER_KEY_HEX)
		await saveKey('masterKey', key)
		message = '[+] MasterKey de teste carregada'
		await refreshStatus()
	}

	async function handleClear() {
		await deleteKey('masterKey')
		message = '[+] MasterKey removida'
		await refreshStatus()
	}

	function handleSubValid() {
		mockSubscriptionValid()
		message = '[+] assinatura válida simulada'
		refreshStatus()
	}

	function handleSubExpired() {
		mockSubscriptionExpired()
		message = '[+] assinatura expirada simulada'
		refreshStatus()
	}

	function toggle() {
		open = !open
		if (open) refreshStatus()
	}
</script>

{#if import.meta.env.DEV}
	<div class="dev-widget">
		<button class="dev-toggle" onclick={toggle}>⚙ Dev</button>

		{#if open}
			<div class="dev-panel">
				<div class="dev-header">
					<span>dev tools</span>
					<button class="close" onclick={toggle}>×</button>
				</div>

				<div class="status">
					<div>MasterKey: <span class={hasMasterKey ? 'ok' : 'no'}>{hasMasterKey ? 'presente' : 'ausente'}</span></div>
					<div>
						Assinatura:
						{#if subStatus.valid}
							<span class="ok">válida até {new Date(subStatus.validUntil!).toLocaleDateString('pt-BR')}</span>
						{:else}
							<span class="no">inválida</span>
						{/if}
					</div>
				</div>

				{#if message}
					<p class="msg">{message}</p>
				{/if}

				<div class="actions">
					<button onclick={handleGenerate}>[ Gerar nova MasterKey ]</button>
					<button onclick={handleLoadTest}>[ Carregar MasterKey de teste ]</button>
					<button onclick={handleClear}>[ Limpar MasterKey ]</button>
					<button onclick={handleSubValid}>[ Simular assinatura válida ]</button>
					<button onclick={handleSubExpired}>[ Simular assinatura expirada ]</button>
				</div>
			</div>
		{/if}
	</div>
{/if}

<style>
	.dev-widget {
		position: fixed;
		bottom: 12px;
		right: 12px;
		z-index: 9999;
		font-family: var(--mono);
	}
	.dev-toggle {
		background: var(--bg-surface);
		border: 1px solid var(--border);
		color: var(--text-muted);
		font-family: var(--mono);
		font-size: 12px;
		padding: 6px 10px;
		cursor: pointer;
	}
	.dev-toggle:hover {
		color: var(--text);
		border-color: var(--accent);
	}
	.dev-panel {
		position: absolute;
		bottom: 36px;
		right: 0;
		width: 320px;
		background: var(--bg-surface);
		border: 1px solid var(--border);
		padding: 12px;
	}
	.dev-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 11px;
		color: var(--accent);
		text-transform: uppercase;
		margin-bottom: 10px;
		padding-bottom: 8px;
		border-bottom: 1px solid var(--border);
	}
	.close {
		background: none;
		border: none;
		color: var(--text-muted);
		font-size: 16px;
		cursor: pointer;
		padding: 0;
	}
	.close:hover {
		color: var(--text);
	}
	.status {
		font-size: 11px;
		color: var(--text-muted);
		margin-bottom: 10px;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.ok {
		color: var(--success);
	}
	.no {
		color: var(--accent);
	}
	.msg {
		font-size: 11px;
		color: var(--success);
		margin-bottom: 8px;
	}
	.actions {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.actions button {
		background: none;
		border: 1px solid var(--border);
		color: var(--text-muted);
		font-family: var(--mono);
		font-size: 11px;
		padding: 4px 8px;
		cursor: pointer;
		text-align: left;
	}
	.actions button:hover {
		border-color: var(--accent);
		color: var(--text);
	}
</style>
