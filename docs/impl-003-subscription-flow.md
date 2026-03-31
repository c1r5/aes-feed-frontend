# IMPL-003 — Fluxo de Subscription (Mock)

Data: 2026-03-30
Pré-requisito: IMPL-001 (visual), IMPL-002 (auth).
Restrição: NÃO alterar arquivos em `src/lib/crypto/`.

---

## RESUMO

Implementação do fluxo de assinatura mock: ativar, expirar, enforcement,
integração com crypto layer e UI. Separação clara entre detecção de expiração
e enforcement (wipe + redirect).

---

## ARQUIVOS CRIADOS

```
src/lib/datasources/interfaces/ISubscriptionDataSource.ts   ← Interface
src/lib/stores/subscription.ts                              ← Store reativo + ações
```

## ARQUIVOS MODIFICADOS

```
src/lib/datasources/mock/MockSubscriptionDataSource.ts      ← Implementa ISubscriptionDataSource
src/routes/subscribe/+page.svelte                           ← Usa subscription store
src/routes/+layout.svelte                                   ← Chama initSubscription()
src/lib/components/DevModal.svelte                          ← Usa subscription store
src/lib/components/PostContent.svelte                       ← checkAndEnforce() antes de decifrar
```

---

## INTERFACE — `ISubscriptionDataSource.ts`

```typescript
interface SubscriptionStatus {
  active: boolean;
  validUntil: string | null;     // ISO 8601
}

interface ISubscriptionDataSource {
  getStatus(): SubscriptionStatus;
  simulatePayment(): { paymentSecret: Uint8Array; userSalt: Uint8Array };
  simulateExpiration(): void;
  isSecretDelivered(): boolean;
  markSecretDelivered(): void;
  getUserSalt(): Uint8Array | null;
}
```

---

## MOCK — `MockSubscriptionDataSource.ts`

### localStorage keys

```
aesf33d:sub:active          "true" | "false"
aesf33d:sub:validUntil      ISO 8601
aesf33d:sub:secretDelivered "true" | "false"
aesf33d:userSalt            base64
aesf33d:session             Session JSON (lido para obter userSalt do user logado)
```

### simulatePayment()

1. `paymentSecret = crypto.getRandomValues(new Uint8Array(32))`
2. Tenta obter `userSalt` do user logado: lê `aesf33d:session` → `session.user.userSalt` base64 → Uint8Array
3. Se não disponível, tenta `aesf33d:userSalt` do localStorage
4. Se nenhum existe, gera novo: `generateRandom(16)`, salva em `aesf33d:userSalt`
5. Define `active=true`, `validUntil=now+30d`, `secretDelivered=false`
6. Retorna `{ paymentSecret, userSalt }`

### simulateExpiration()

1. `active=false`, remove `validUntil` e `secretDelivered`
2. NÃO chama `clearCryptoData()` — enforcement é responsabilidade do store

### getStatus()

1. Lê `active` e `validUntil` do localStorage
2. Se `active=true` e `validUntil > now` → `{ active: true, validUntil }`
3. Se `active=true` mas expirado → chama `simulateExpiration()` (auto-expire)
4. Default: `{ active: false, validUntil: null }`

### Função auxiliar: getSessionUserSalt()

Lê `aesf33d:session` do localStorage, extrai `session.user.userSalt` base64 → Uint8Array.
Não depende de Svelte stores — acessa localStorage diretamente.

---

## STORE — `src/lib/stores/subscription.ts`

```typescript
export const subscriptionStatus = writable<SubscriptionStatus>({ active: false, validUntil: null });
```

### initSubscription()

Sincroniza store com DataSource: `datasource.getStatus()` → `subscriptionStatus.set()`.
Chamado em `+layout.svelte` onMount.

### activateSubscription()

1. `datasource.simulatePayment()` → `{ paymentSecret, userSalt }`
2. `deriveMasterKey(paymentSecret, userSalt)` → CryptoKey
3. `saveMasterKey(key)` + `saveUserSalt(userSalt)` → IndexedDB
4. `datasource.markSecretDelivered()`
5. `subscriptionStatus.set(datasource.getStatus())`
6. PaymentSecret sai do escopo — NUNCA persistido

### deactivateSubscription()

1. `datasource.simulateExpiration()`
2. `subscriptionStatus.set({ active: false, validUntil: null })`
3. NÃO chama clearCryptoData — apenas marca como inativo

### checkAndEnforce()

1. `status = datasource.getStatus()` → atualiza store
2. Se `!active` → `clearCryptoData()` → `goto('/subscribe')` → return `false`
3. Se `active` → return `true`
4. Chamado em PostContent antes de decifrar post premium

---

## SUBSCRIBE PAGE — `src/routes/subscribe/+page.svelte`

### Seção status

- Reativo via `$subscriptionStatus`
- Se ativa: 🟢 + data + botão `[cancelar assinatura]`
- Se inativa: 🔴 + botão `[assinar]` (primary)
- `[assinar]` chama `activateSubscription()`, mostra loading state

### Seção backup

- Status crypto: MasterKey ✓/✗, userSalt ✓/✗, PostKeys N cacheadas
- Botões: `↓ exportar .aesf33d` / `↑ importar .aesf33d`
- Export usa `$session.user.id` como userId no backup

### Integração

- Route guard: `if (!get(session)) goto('/login')`
- `initSubscription()` + `refreshCryptoState()` no onMount

---

## DEVMODAL — Mudanças

- Remove `MockSubscriptionDataSource` direto — usa `activateSubscription()` e `deactivateSubscription()` do store
- Status reativo via `$subscriptionStatus` (com emoji 🟢/🔴)
- `[simular pagamento]` → `activateSubscription()`
- `[simular expira]` → `deactivateSubscription()` + `initSubscription()`

---

## POSTCONTENT — Mudanças

### Fluxo de decifração atualizado

```
1. Se !post.premium → state = 'free'
2. Se !post.blob/iv/postSalt → state = 'locked'
3. loadMasterKey() → se null → state = 'locked'
4. checkAndEnforce() → se false → return (redirect já aconteceu)
5. derivePostKey() + decryptContent() → state = 'decrypted'
6. catch → state = 'locked'
```

A mudança chave é o passo 4: antes de derivar e decifrar, verifica se a assinatura ainda está válida. Se expirada, `checkAndEnforce()` limpa as chaves e redireciona para `/subscribe`.

---

## LAYOUT — Mudanças

```typescript
import { initSubscription } from '$lib/stores/subscription';

onMount(() => {
  initAuth();
  initSubscription();
});
```

---

## DECISÕES DE DESIGN

1. **Separação detecção vs enforcement**: `simulateExpiration()` apenas marca como inativo no localStorage. `checkAndEnforce()` no store faz o wipe + redirect. Isso permite testar cada parte isoladamente.
2. **userSalt do auth**: `simulatePayment()` tenta obter o salt do user logado (via Session no localStorage) antes de gerar novo. Garante consistência entre auth e subscription.
3. **PaymentSecret efêmero**: existe apenas no escopo de `activateSubscription()`, nunca atribuído a variável persistente.
4. **Store como camada de orquestração**: componentes nunca chamam DataSource + crypto diretamente — usam ações do store que coordenam ambos.
