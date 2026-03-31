<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { get } from 'svelte/store';
  import { session } from '$lib/stores/auth';
  import { subscriptionStatus, activateSubscription, deactivateSubscription, initSubscription, validateServerSubscription, restoreLocalSubscription } from '$lib/stores/subscription';
  import { loadMasterKey, loadUserSalt, listCachedPostIds } from '$lib/crypto/store';
  import { exportCryptoBackup, importCryptoBackup, triggerDownload, readBackupFile } from '$lib/crypto/backup';

  const PENDING_EXPORT_KEY = 'aesf33d:pendingExport';

  let hasMasterKey = false;
  let hasUserSalt = false;
  let cachedPostCount = 0;
  let feedback = '';
  let feedbackType: 'success' | 'error' | 'info' = 'info';
  let fileInput: HTMLInputElement;
  let loading = false;
  let showExportNudge = false;

  async function refreshCryptoState(): Promise<void> {
    const mk = await loadMasterKey();
    hasMasterKey = mk !== null;
    const us = await loadUserSalt();
    hasUserSalt = us !== null;
    const ids = await listCachedPostIds();
    cachedPostCount = ids.length;
  }

  async function handleSubscribe(): Promise<void> {
    loading = true;
    try {
      await activateSubscription();
      feedback = '[+] Assinatura ativada com sucesso';
      feedbackType = 'success';
      showExportNudge = true;
      sessionStorage.setItem(PENDING_EXPORT_KEY, 'true');
      await refreshCryptoState();
    } catch (e) {
      feedback = `[-] ${e instanceof Error ? e.message : String(e)}`;
      feedbackType = 'error';
    }
    loading = false;
  }

  async function handleCancel(): Promise<void> {
    await deactivateSubscription();
    feedback = '[+] Assinatura cancelada';
    feedbackType = 'success';
  }

  async function handleExport(): Promise<void> {
    try {
      const s = get(session);
      const backup = await exportCryptoBackup(s?.user.id ?? 'user');
      triggerDownload(backup);
      const date = new Date().toISOString().split('T')[0];
      feedback = `[+] Backup exportado: aesf33d-backup-${date}.aesf33d`;
      feedbackType = 'success';
      showExportNudge = false;
      sessionStorage.removeItem(PENDING_EXPORT_KEY);
    } catch (e) {
      feedback = `[-] ${e instanceof Error ? e.message : String(e)}`;
      feedbackType = 'error';
    }
  }

  function handleImportClick(): void {
    fileInput.click();
  }

  async function onFileSelected(e: Event): Promise<void> {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    try {
      const backup = await readBackupFile(file);

      const validation = await validateServerSubscription(backup.userId);
      if (!validation.valid) {
        feedback = '[-] Assinatura expirada. Renove antes de importar.';
        feedbackType = 'error';
        target.value = '';
        return;
      }

      await importCryptoBackup(backup);

      restoreLocalSubscription(validation.validUntil!);
      feedback = '[+] Backup importado. Acesso restaurado.';
      feedbackType = 'success';
      await refreshCryptoState();
    } catch (err) {
      feedback = `[-] ${err instanceof Error ? err.message : String(err)}`;
      feedbackType = 'error';
    }
    target.value = '';
  }

  onMount(() => {
    if (!get(session)) {
      goto('/login');
      return;
    }
    initSubscription();
    refreshCryptoState();

    if (sessionStorage.getItem(PENDING_EXPORT_KEY) === 'true') {
      showExportNudge = true;
    }
  });
</script>

<div class="subscribe-page">
  <h1 class="page-title">assinatura</h1>

  <div class="section">
    <div class="status-line">
      status:
      {#if $subscriptionStatus.active}
        <span class="status-active">&#x1F7E2; ativa até {new Date($subscriptionStatus.validUntil ?? '').toLocaleDateString('pt-BR')}</span>
      {:else}
        <span class="status-inactive">&#x1F534; inativa</span>
      {/if}
    </div>
    <div class="section-actions">
      {#if $subscriptionStatus.active}
        <button on:click={handleCancel}>[cancelar assinatura]</button>
      {:else}
        <button class="primary" on:click={handleSubscribe} disabled={loading}>
          {loading ? '[...] processando' : '[assinar]'}
        </button>
      {/if}
    </div>
  </div>

  <div class="separator"></div>

  <div class="section">
    <h2 class="section-title">backup de chaves</h2>

    <div class="key-status">
      <div>MasterKey: {hasMasterKey ? '✓ presente' : '✗ ausente'}</div>
      <div>userSalt: {hasUserSalt ? '✓ presente' : '✗ ausente'}</div>
      <div>PostKeys: {cachedPostCount} cacheadas</div>
    </div>

    <div class="actions">
      <button on:click={handleImportClick}>&#8593; importar .aesf33d</button>
    </div>
    <input
      bind:this={fileInput}
      type="file"
      accept=".aesf33d"
      on:change={onFileSelected}
      class="hidden"
    />
  </div>

  {#if feedback}
    <div class="feedback" class:success={feedbackType === 'success'} class:error={feedbackType === 'error'} class:info={feedbackType === 'info'}>
      {feedback}
    </div>
  {/if}

  {#if showExportNudge}
    <div class="export-nudge">
      <div class="nudge-title">&#9888; IMPORTANTE: exporte suas chaves AGORA.</div>
      <div class="nudge-body">
        Ao sair da conta, seus dados criptográficos serão
        apagados. Sem o backup, você perde acesso ao
        conteúdo premium permanentemente.
      </div>
      <button class="nudge-export" on:click={handleExport}>&#8595; exportar .aesf33d</button>
    </div>
  {/if}

  <div class="separator"></div>

  <div class="warning">
    &#9888; exporte suas chaves antes de limpar o cache.
    sem o backup, o acesso a conteúdo premium é perdido permanentemente.
  </div>
</div>

<style>
  .page-title {
    font-family: var(--font-mono);
    font-size: var(--font-size-xl);
    color: var(--text);
    font-weight: normal;
    margin-bottom: 16px;
  }

  .section {
    margin-bottom: 12px;
  }

  .section-title {
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
    color: var(--text-muted);
    font-weight: normal;
    margin-bottom: 8px;
  }

  .section-actions {
    margin-top: 8px;
  }

  .separator {
    border-top: 1px solid var(--border);
    margin: 16px 0;
  }

  .status-line {
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
    color: var(--text);
  }

  .status-active {
    color: var(--success);
  }

  .status-inactive {
    color: var(--error);
  }

  .key-status {
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
    color: var(--text);
    line-height: 1.6;
    margin-bottom: 12px;
  }

  .actions {
    display: flex;
    gap: 8px;
  }

  .hidden {
    display: none;
  }

  .feedback {
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
    margin-top: 8px;
  }

  .success { color: var(--success); }
  .error { color: var(--error); }
  .info { color: var(--text-muted); }

  .warning {
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
    color: var(--accent);
    line-height: 1.5;
  }

  .export-nudge {
    border: 2px solid var(--accent);
    background: var(--bg-surface);
    padding: 12px;
    margin-top: 12px;
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
    color: var(--text);
  }

  .nudge-title {
    color: var(--accent);
    font-weight: bold;
    margin-bottom: 8px;
  }

  .nudge-body {
    line-height: 1.5;
    margin-bottom: 12px;
  }

  .nudge-export {
    color: var(--accent);
    border-color: var(--accent);
  }
</style>
