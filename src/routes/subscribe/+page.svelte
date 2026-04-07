<script lang="ts">
	import { goto } from '$app/navigation'
	import { subscriptionDataSource } from '$lib/datasources'
	import { generateMasterKey } from '$lib/crypto'
	import { saveKey, loadKey } from '$lib/storage'
	import { mockSubscriptionValid } from '$lib/subscription'
	import type { SubscriptionStatus } from '$lib/datasources/subscription/ISubscriptionDataSource'

	let status = $state<SubscriptionStatus | null>(null)
	let hasMasterKey = $state(false)
	let loading = $state(false)
	let error = $state<string | null>(null)
	let address = $state<string | null>(null)
	let amount = $state<number | null>(null)

	async function refreshStatus() {
		status = await subscriptionDataSource.getStatus()
		hasMasterKey = (await loadKey('masterKey')) !== null
	}

	async function loadPaymentInfo() {
		const payment = await subscriptionDataSource.getPaymentAddress()
		address = payment.address
		amount = payment.amount
	}

	async function handleMockActivation() {
		loading = true
		error = null
		try {
			const masterKey = await generateMasterKey()
			await saveKey('masterKey', masterKey)
			mockSubscriptionValid()
			await refreshStatus()
			goto('/')
		} catch {
			error = 'falha ao ativar assinatura'
		} finally {
			loading = false
		}
	}

	$effect(() => {
		refreshStatus()
		loadPaymentInfo()
	})
</script>

<div class="shell">
	<h1>[ SUBSCRIBE ]</h1>

	{#if status?.valid}
		<p class="success">[+] assinatura ativa até {status.validUntil?.toLocaleDateString('pt-BR')}</p>
		{#if hasMasterKey}
			<p class="hint">MasterKey presente — posts premium serão decifrados automaticamente</p>
		{:else}
			<p class="warn">[-] MasterKey ausente — re-ative sua assinatura para derivar uma nova chave</p>
		{/if}
		<a href="/" class="action-btn">&larr; voltar ao feed</a>
	{:else}
		<p class="desc">pague com XMR para acessar conteúdo premium cifrado</p>

		{#if address}
			<div class="payment-info">
				<span class="label">endereço XMR</span>
				<pre class="address">{address}</pre>
				<span class="label">valor</span>
				<pre class="amount">{amount} XMR</pre>
			</div>
		{/if}

		<p class="hint">após confirmação do pagamento, o servidor enviará o PaymentSecret que ativa sua assinatura</p>

		{#if error}
			<p class="error">[-] {error}</p>
		{/if}

		{#if import.meta.env.DEV}
			<div class="mock-section">
				<span class="label">mock (dev only)</span>
				<button onclick={handleMockActivation} disabled={loading} class="action-btn">
					{#if loading}<span class="blink">ativando...</span>{:else}[ Simular pagamento + ativação ]{/if}
				</button>
			</div>
		{/if}
	{/if}
</div>

<style>
	.shell {
		max-width: 600px;
		margin: 60px auto;
		padding: 24px 16px;
	}
	h1 {
		font-family: var(--mono);
		font-size: 16px;
		color: var(--accent);
		margin-bottom: 16px;
	}
	.desc {
		font-family: var(--mono);
		font-size: 13px;
		color: var(--text);
		margin-bottom: 16px;
	}
	.hint {
		font-family: var(--mono);
		font-size: 11px;
		color: var(--text-muted);
		margin-bottom: 12px;
	}
	.warn {
		font-family: var(--mono);
		font-size: 12px;
		color: var(--accent);
		margin-bottom: 12px;
	}
	.label {
		font-family: var(--mono);
		font-size: 11px;
		color: var(--text-muted);
		text-transform: uppercase;
		display: block;
		margin-bottom: 4px;
	}
	.payment-info {
		margin-bottom: 16px;
	}
	.address {
		background: var(--bg-surface);
		border: 1px solid var(--border);
		padding: 8px;
		font-family: var(--mono);
		font-size: 11px;
		color: var(--link);
		word-break: break-all;
		margin-bottom: 8px;
	}
	.amount {
		background: var(--bg-surface);
		border: 1px solid var(--border);
		padding: 8px;
		font-family: var(--mono);
		font-size: 13px;
		color: var(--text);
		margin-bottom: 8px;
	}
	.mock-section {
		margin-top: 20px;
		padding-top: 12px;
		border-top: 1px solid var(--border);
	}
	.action-btn {
		display: inline-block;
		font-family: var(--mono);
		font-size: 13px;
		border: 1px solid var(--accent);
		color: var(--accent);
		padding: 8px 16px;
		text-decoration: none;
		background: none;
		cursor: pointer;
		margin-top: 8px;
	}
	.action-btn:hover:not(:disabled) {
		background: var(--accent);
		color: #fff;
		text-decoration: none;
	}
	.action-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.success {
		font-family: var(--mono);
		font-size: 14px;
		color: var(--success);
		margin-bottom: 8px;
	}
	.error {
		font-family: var(--mono);
		font-size: 13px;
		color: var(--accent);
		margin-bottom: 8px;
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
