<script lang="ts">
  import { onMount } from 'svelte';
  import { MockSubscriptionDataSource } from '$lib/datasources/mock/MockSubscriptionDataSource';
  import { deriveMasterKey, derivePostKey, encryptContent, decryptContent } from '$lib/crypto/crypto';
  import { saveMasterKey, saveUserSalt, loadMasterKey, loadUserSalt, clearCryptoData, cachePostKey, loadCachedPostKey } from '$lib/crypto/store';
  import { exportCryptoBackup, importCryptoBackup, triggerDownload, readBackupFile } from '$lib/crypto/backup';
  import { arrayBufferToBase64, generateRandom } from '$lib/crypto/utils';

  const subSource = new MockSubscriptionDataSource();
  let results: string[] = [];
  let encryptInput = "Mensagem secreta premium";
  let lastPaymentSecret: Uint8Array | null = null;
  let lastPostId = "";
  let lastPostSalt = "";
  let lastBlob = "";
  let lastIv = "";

  function log(msg: string, type: '+' | '-' | '*' = '*') {
    const time = new Date().toLocaleTimeString();
    results = [`[${time}] [${type}] ${msg}`, ...results];
  }

  // --- Step 1: Subscription ---
  function handleSimulatePayment() {
    const { paymentSecret, userSalt } = subSource.simulatePayment();
    lastPaymentSecret = paymentSecret;
    log(`Pagamento simulado. PaymentSecret gerado (não persistido). userSalt: ${arrayBufferToBase64(userSalt.buffer).slice(0, 10)}...`, '+');
  }

  function handleSimulateExpiration() {
    subSource.simulateExpiration();
    log("Expiração simulada no localStorage.", '*');
  }

  async function checkStatus() {
    const status = await subSource.getStatus();
    log(`Status: active=${status.active}, validUntil=${status.validUntil}`, '*');
  }

  // --- Step 2: MasterKey ---
  async function handleDeriveMasterKey() {
    if (!lastPaymentSecret) {
      log("Erro: PaymentSecret não encontrado. Execute Etapa 1.", '-');
      return;
    }
    const userSalt = subSource.getUserSalt();
    if (!userSalt) {
      log("Erro: userSalt não encontrado.", '-');
      return;
    }

    try {
      const masterKey = await deriveMasterKey(lastPaymentSecret, userSalt);
      await saveMasterKey(masterKey);
      await saveUserSalt(userSalt);
      lastPaymentSecret = null; // Discard from memory
      log("MasterKey derivada e salva no IndexedDB. PaymentSecret descartado.", '+');
    } catch (e: any) {
      log(`Erro na derivação: ${e.message}`, '-');
    }
  }

  // --- Step 3: Encrypt/Decrypt ---
  async function handleEncrypt() {
    try {
      const masterKey = await loadMasterKey();
      if (!masterKey) throw new Error("MasterKey não encontrada.");

      // For Step 3, we'll just use a dummy PostKey derived from MasterKey directly
      // but in real app we use postId-specific derivation.
      const dummySalt = generateRandom(16);
      const postKey = await derivePostKey(masterKey, "test-id", dummySalt);
      
      const { blob, iv } = await encryptContent(postKey, encryptInput);
      lastBlob = blob;
      lastIv = iv;
      log(`Encrypted! blob: ${blob.slice(0, 20)}..., iv: ${iv}`, '+');
    } catch (e: any) {
      log(`Erro no encrypt: ${e.message}`, '-');
    }
  }

  async function handleDecrypt() {
    try {
      const masterKey = await loadMasterKey();
      if (!masterKey) throw new Error("MasterKey não encontrada.");
      if (!lastBlob || !lastIv) throw new Error("Blob/IV não encontrados.");

      // Re-derive the same dummy key (we'd need the salt used)
      // For this test, we'll just assume it's the same flow as Etapa 4 but simpler.
      log("Use a Etapa 4 para teste completo de Roundtrip.", '*');
    } catch (e: any) {
      log(`Erro: ${e.message}`, '-');
    }
  }

  // --- Step 4: Full Post Flow ---
  async function handleFullPostFlow() {
    try {
      const masterKey = await loadMasterKey();
      if (!masterKey) throw new Error("MasterKey não encontrada.");

      const postId = crypto.randomUUID();
      const postSalt = generateRandom(16);
      const postSaltB64 = arrayBufferToBase64(postSalt.buffer);

      const postKey = await derivePostKey(masterKey, postId, postSalt);
      const { blob, iv } = await encryptContent(postKey, encryptInput);

      await cachePostKey(postId, postSaltB64, postKey);

      log(`Post premium gerado. ID: ${postId}`, '+');
      log(`Salt: ${postSaltB64.slice(0, 10)}...`, '*');
      log(`Blob: ${blob.slice(0, 20)}...`, '*');

      // Decrypt roundtrip
      const recoveredKey = await loadCachedPostKey(masterKey, postId);
      if (!recoveredKey) throw new Error("Falha ao recuperar PostKey do cache.");

      const decrypted = await decryptContent(recoveredKey, blob, iv);
      if (decrypted === encryptInput) {
        log(`Roundtrip Decrypt: Sucesso! Match: "${decrypted}"`, '+');
      } else {
        log("Roundtrip Decrypt: Falha - conteúdo não condiz.", '-');
      }
    } catch (e: any) {
      log(`Erro: ${e.message}`, '-');
    }
  }

  // --- Step 5: Backup ---
  async function handleExport() {
    try {
      const backup = await exportCryptoBackup("user-123");
      log("Backup gerado com sucesso.", '+');
      log(`JSON: ${JSON.stringify(backup).slice(0, 50)}...`, '*');
      triggerDownload(backup);
    } catch (e: any) {
      log(`Erro no export: ${e.message}`, '-');
    }
  }

  async function handleImport(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    try {
      const backup = await readBackupFile(input.files[0]);
      await importCryptoBackup(backup);
      log("Backup importado com sucesso! MasterKey restaurada.", '+');
    } catch (e: any) {
      log(`Erro no import: ${e.message}`, '-');
    }
  }

  // --- Step 6: Full Lifecycle ---
  async function handleFullLifecycle() {
    results = [];
    log("Iniciando Fluxo Inteiro...", '*');
    try {
      // 1. Payment
      const { paymentSecret, userSalt } = subSource.simulatePayment();
      log("1. simulatePayment ✓", '+');

      // 2. MasterKey
      const mk = await deriveMasterKey(paymentSecret, userSalt);
      await saveMasterKey(mk);
      await saveUserSalt(userSalt);
      log("2. deriveMasterKey ✓", '+');

      // 3. PostKey + Encrypt
      const postId = "lifecycle-test";
      const pSalt = generateRandom(16);
      const pk = await derivePostKey(mk, postId, pSalt);
      const { blob, iv } = await encryptContent(pk, "Conteúdo de Ciclo de Vida");
      await cachePostKey(postId, arrayBufferToBase64(pSalt.buffer), pk);
      log("3. derivePostKey + encrypt ✓", '+');

      // 4. Decrypt
      const dec = await decryptContent(pk, blob, iv);
      log(`4. decrypt check: ${dec === "Conteúdo de Ciclo de Vida" ? "✓" : "FAILED"}`, dec === "Conteúdo de Ciclo de Vida" ? '+' : '-');

      // 5. Backup
      const backup = await exportCryptoBackup("user-test");
      log("5. export backup ✓", '+');

      // 6. Wipe
      await clearCryptoData();
      log("6. clearCryptoData (wipe) ✓", '+');

      // 7. Verify empty
      const emptyMk = await loadMasterKey();
      log(`7. verify wipe: ${emptyMk === null ? "✓" : "FAILED"}`, emptyMk === null ? '+' : '-');

      // 8. Import
      await importCryptoBackup(backup);
      log("8. import backup ✓", '+');

      // 9. Final Decrypt with restored key
      const restoredMk = await loadMasterKey();
      if (!restoredMk) throw new Error("Restored MK is null");
      const restoredPk = await loadCachedPostKey(restoredMk, postId);
      if (!restoredPk) throw new Error("Restored PK is null");
      const finalDec = await decryptContent(restoredPk, blob, iv);
      log(`9. final decrypt: ${finalDec === "Conteúdo de Ciclo de Vida" ? "✓ MATCH" : "FAILED"}`, finalDec === "Conteúdo de Ciclo de Vida" ? '+' : '-');

      log("Fluxo Completo Finalizado com Sucesso!", '+');
    } catch (e: any) {
      log(`FALHA NO FLUXO: ${e.message}`, '-');
    }
  }

  // --- Step 7: Expiration & Wipe ---
  async function handleExpirationWipe() {
    try {
      subSource.simulateExpiration();
      await clearCryptoData();
      log("localStorage limpo e IndexedDB wipe realizado.", '+');
      const mk = await loadMasterKey();
      const salt = await loadUserSalt();
      log(`Verificação: MasterKey=${mk}, UserSalt=${salt}`, mk === null && salt === null ? '+' : '-');
    } catch (e: any) {
      log(`Erro: ${e.message}`, '-');
    }
  }

</script>

<div class="test-container">
  <h1>AES F33D — Validação Funcional</h1>

  <section>
    <h2>ETAPA 1: Subscription Mock</h2>
    <div class="actions">
      <button on:click={handleSimulatePayment}>Simular Pagamento</button>
      <button on:click={handleSimulateExpiration}>Simular Expiração</button>
      <button on:click={checkStatus}>Status</button>
    </div>
  </section>

  <section>
    <h2>ETAPA 2: Derivação de MasterKey</h2>
    <div class="actions">
      <button on:click={handleDeriveMasterKey}>Derivar MasterKey do PaymentSecret</button>
    </div>
  </section>

  <section>
    <h2>ETAPA 3: Encrypt (Test Direct)</h2>
    <div class="actions">
      <input type="text" bind:value={encryptInput} placeholder="Texto para cifrar" />
      <button on:click={handleEncrypt}>Encrypt</button>
    </div>
  </section>

  <section>
    <h2>ETAPA 4: PostKey + Encrypt de Post Premium</h2>
    <div class="actions">
      <button on:click={handleFullPostFlow}>Gerar PostKey + Encrypt Post Completo</button>
    </div>
  </section>

  <section>
    <h2>ETAPA 5: Export/Import Backup</h2>
    <div class="actions">
      <button on:click={handleExport}>Exportar .aesf33d</button>
      <label class="button">
        Importar .aesf33d
        <input type="file" accept=".aesf33d" on:change={handleImport} hidden />
      </label>
    </div>
  </section>

  <section>
    <h2>ETAPA 6: Fluxo Completo</h2>
    <div class="actions">
      <button class="primary" on:click={handleFullLifecycle}>Executar Fluxo Inteiro</button>
    </div>
  </section>

  <section>
    <h2>ETAPA 7: Expiração</h2>
    <div class="actions">
      <button on:click={handleExpirationWipe}>Simular Expiração + Verificar Wipe</button>
    </div>
  </section>

  <hr />

  <div class="results">
    {#each results as result}
      <div class="result-line" class:success={result.includes('[+]')} class:error={result.includes('[-]')} class:info={result.includes('[*]')}>
        {result}
      </div>
    {/each}
  </div>
</div>

<style>
  :global(body) {
    background: #111;
    color: #ccc;
    font-family: 'Courier New', monospace;
    padding: 20px;
  }

  .test-container {
    max-width: 800px;
    margin: 0 auto;
  }

  h1, h2 {
    color: #cc0000;
    text-transform: uppercase;
    border-bottom: 1px solid #333;
    padding-bottom: 5px;
  }

  section {
    margin-bottom: 20px;
  }

  .actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 10px;
  }

  button, .button {
    background: #333;
    border: 1px solid #555;
    color: #ccc;
    padding: 5px 10px;
    cursor: pointer;
    font-family: inherit;
    font-size: 14px;
    display: inline-block;
  }

  button:hover, .button:hover {
    background: #444;
    border-color: #777;
  }

  button.primary {
    border-color: #cc0000;
    color: #fff;
  }

  input[type="text"] {
    background: #222;
    border: 1px solid #444;
    color: #ccc;
    padding: 5px;
    font-family: inherit;
    flex-grow: 1;
  }

  .results {
    margin-top: 20px;
    background: #000;
    padding: 10px;
    border: 1px solid #333;
    max-height: 400px;
    overflow-y: auto;
    font-size: 13px;
  }

  .result-line {
    margin-bottom: 2px;
    white-space: pre-wrap;
    word-break: break-all;
  }

  .success { color: #0f0; }
  .error { color: #f00; }
  .info { color: #888; }

  hr {
    border: 0;
    border-top: 1px dashed #333;
    margin: 20px 0;
  }
</style>
