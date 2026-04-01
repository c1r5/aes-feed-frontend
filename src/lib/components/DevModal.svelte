<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { loadMasterKey, loadUserSalt, listCachedPostIds, clearCryptoData } from '$lib/crypto/store';
  import { exportCryptoBackup, importCryptoBackup, triggerDownload, readBackupFile } from '$lib/crypto/backup';
  import { session, doLogout } from '$lib/stores/auth';
  import { subscriptionStatus, activateSubscription, deactivateSubscription, initSubscription } from '$lib/stores/subscription';
  import { mockSubscriptionDatasource } from '$lib/datasources/provider';

  let visible = false;
  let results: string[] = [];
  let fileInput: HTMLInputElement;

  let hasMasterKey = false;
  let hasUserSalt = false;
  let cachedPostCount = 0;
  let serverSubStatus: string = 'n/a';
  let serverSubValid = false;

  function log(prefix: string, msg: string): void {
    results = [...results, `${prefix} ${msg}`];
  }

  async function refreshCrypto(): Promise<void> {
    const mk = await loadMasterKey();
    hasMasterKey = mk !== null;
    const us = await loadUserSalt();
    hasUserSalt = us !== null;
    const ids = await listCachedPostIds();
    cachedPostCount = ids.length;
  }

  function refreshServerMock(): void {
    const s = $session;
    if (!s || !mockSubscriptionDatasource) {
      serverSubStatus = 'n/a';
      serverSubValid = false;
      return;
    }
    const entry = mockSubscriptionDatasource.getServerSubscriptionStatus(s.user.id);
    if (!entry) {
      serverSubStatus = 'não encontrada';
      serverSubValid = false;
    } else if (!entry.active || new Date(entry.validUntil) < new Date()) {
      serverSubStatus = `inválida (até ${new Date(entry.validUntil).toLocaleDateString('pt-BR')})`;
      serverSubValid = false;
    } else {
      serverSubStatus = `válida até ${new Date(entry.validUntil).toLocaleDateString('pt-BR')}`;
      serverSubValid = true;
    }
  }

  function handleInvalidateServer(): void {
    const s = $session;
    if (!s || !mockSubscriptionDatasource) return;
    mockSubscriptionDatasource.invalidateServerSubscription(s.user.id);
    log('[+]', 'Sub invalidada no servidor mock');
    refreshServerMock();
  }

  function handleRestoreServer(): void {
    const s = $session;
    if (!s || !mockSubscriptionDatasource) return;
    mockSubscriptionDatasource.restoreServerSubscription(s.user.id);
    log('[+]', 'Sub restaurada no servidor mock (+30d)');
    refreshServerMock();
  }

  async function handlePayment(): Promise<void> {
    try {
      await activateSubscription();
      log('[+]', 'Pagamento simulado + MasterKey derivada');
      await refreshCrypto();
      refreshServerMock();
    } catch (e) {
      log('[-]', `Erro: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async function handleExpiration(): Promise<void> {
    await deactivateSubscription();
    log('[+]', 'Expiração simulada');
    initSubscription();
  }

  async function handleExport(): Promise<void> {
    try {
      const backup = await exportCryptoBackup('dev-user');
      triggerDownload(backup);
      log('[+]', 'Backup exportado');
    } catch (e) {
      log('[-]', `Export: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async function handleImport(): Promise<void> {
    fileInput.click();
  }

  async function onFileSelected(e: Event): Promise<void> {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    try {
      const backup = await readBackupFile(file);
      await importCryptoBackup(backup);
      log('[+]', 'Backup importado');
      await refreshCrypto();
    } catch (err) {
      log('[-]', `Import: ${err instanceof Error ? err.message : String(err)}`);
    }
    target.value = '';
  }

  async function handleClearAll(): Promise<void> {
    await clearCryptoData();
    log('[+]', 'Crypto data limpo');
    await refreshCrypto();
  }

  async function handleForceLogout(): Promise<void> {
    await doLogout();
    log('[+]', 'Logout forçado');
  }

  function handleClearAllUsers(): void {
    localStorage.removeItem('aesf33d:users');
    localStorage.removeItem('aesf33d:session');
    session.set(null);
    log('[+]', 'Todos os users removidos');
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'd' || e.key === 'D') {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      visible = !visible;
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    refreshCrypto();
    refreshServerMock();
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', handleKeydown);
    }
  });
</script>

{#if visible}
  <div class="dev-modal">
    <div class="dev-header">
      <span class="dev-label">[dev]</span>
      <button class="close-btn" on:click={() => (visible = false)}>&times;</button>
    </div>

    <div class="dev-section">
      <div class="section-title">auth</div>
      {#if $session}
        <div class="dev-info">
          user: {$session.user.username} (id: {$session.user.id.slice(0, 8)}...)
        </div>
        <div class="dev-info">
          session expires: {new Date($session.expiresAt).toLocaleString('pt-BR')}
        </div>
        <div class="dev-info">
          userSalt: {$session.user.userSalt.slice(0, 12)}...
        </div>
      {:else}
        <div class="dev-info">user: nenhum</div>
      {/if}
      <div class="dev-actions">
        <button on:click={handleForceLogout}>logout forçado</button>
        <button on:click={handleClearAllUsers}>limpar todos os users</button>
      </div>
    </div>

    <div class="dev-section">
      <div class="section-title">subscription</div>
      <div class="dev-actions">
        <button on:click={handlePayment}>simular pagamento</button>
        <button on:click={handleExpiration}>simular expira</button>
      </div>
      <div class="dev-status">
        {#if $subscriptionStatus.active}
          > &#x1F7E2; ativo até {new Date($subscriptionStatus.validUntil ?? '').toLocaleDateString('pt-BR')}
        {:else}
          > &#x1F534; inativo
        {/if}
      </div>
    </div>

    <div class="dev-section">
      <div class="section-title">crypto</div>
      <div class="dev-info">
        MasterKey: {hasMasterKey ? '✓' : '✗'}
        &nbsp; userSalt: {hasUserSalt ? '✓' : '✗'}
        &nbsp; Posts: {cachedPostCount}
      </div>
      <div class="dev-actions">
        <button on:click={handleExport}>exportar</button>
        <button on:click={handleImport}>importar</button>
        <button on:click={handleClearAll}>limpar tudo</button>
      </div>
      <input
        bind:this={fileInput}
        type="file"
        accept=".aesf33d"
        on:change={onFileSelected}
        class="hidden-input"
      />
    </div>

    <div class="dev-section">
      <div class="section-title">server mock</div>
      <div class="dev-info">
        sub: {serverSubStatus}
      </div>
      <div class="dev-actions">
        <button on:click={handleInvalidateServer}>invalidar no servidor</button>
        <button on:click={handleRestoreServer}>restaurar no servidor</button>
      </div>
    </div>

    {#if results.length > 0}
      <div class="dev-log">
        {#each results as line}
          <div class="log-line" class:log-success={line.startsWith('[+]')} class:log-error={line.startsWith('[-]')} class:log-info={line.startsWith('[*]')}>
            {line}
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/if}

<style>
  .dev-modal {
    position: fixed;
    bottom: 16px;
    right: 16px;
    width: 360px;
    max-width: calc(100vw - 32px);
    background: var(--bg-surface);
    border: 1px solid var(--border);
    font-family: var(--font-mono);
    font-size: var(--font-size-xs);
    color: var(--text);
    z-index: 9999;
  }

  .dev-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 8px;
    border-bottom: 1px solid var(--border);
  }

  .dev-label {
    color: var(--accent);
    font-weight: bold;
  }

  .close-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 16px;
    padding: 0 4px;
    cursor: pointer;
  }

  .close-btn:hover {
    color: var(--accent);
    border: none;
  }

  .dev-section {
    padding: 6px 8px;
    border-top: 1px solid var(--border);
  }

  .section-title {
    color: var(--text-muted);
    margin-bottom: 4px;
  }

  .dev-actions {
    display: flex;
    gap: 4px;
    margin: 4px 0;
    flex-wrap: wrap;
  }

  .dev-actions button {
    padding: 2px 8px;
    font-size: var(--font-size-xs);
  }

  .dev-status, .dev-info {
    color: var(--text-muted);
    margin-top: 4px;
  }

  .dev-log {
    border-top: 1px solid var(--border);
    padding: 4px 8px;
    max-height: 120px;
    overflow-y: auto;
  }

  .log-line {
    line-height: 1.4;
  }

  .log-success {
    color: var(--success);
  }

  .log-error {
    color: var(--error);
  }

  .log-info {
    color: var(--text-muted);
  }

  .hidden-input {
    display: none;
  }
</style>
