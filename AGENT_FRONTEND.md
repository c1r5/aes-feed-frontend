# CLAUDE.md — AES F33D Frontend

Este arquivo é a especificação mandatória do projeto. Leia antes de escrever qualquer código.
Violação de qualquer regra aqui é um bug.

## PROJETO

AES F33D — blog dual com conteúdo premium cifrado end-to-end.
O servidor NUNCA vê conteúdo decifrado, MasterKey, PostKey ou PaymentSecret em claro.

## STACK

- SvelteKit + TypeScript (strict, sem `any`)
- Web Crypto API (crypto.subtle) — ÚNICA fonte de crypto
- IndexedDB — armazenamento de chaves criptográficas
- localStorage — estado de subscription e preferências

## HIERARQUIA DE CHAVES

```
PaymentSecret (32 bytes, gerado pelo SERVIDOR)
    ↓ HKDF-SHA256, salt=userSalt, info="aesf33d-masterkey-v1"
MasterKey (AES-GCM 256, extractable: true)
    ↓ HKDF-SHA256, salt=postSalt, info="aesf33d-postkey-v1:" + postId
PostKey (AES-GCM 256, extractable: false)
    ↓ AES-GCM encrypt, iv=12 bytes random
encrypted_blob
```

Cada nível é derivado do anterior. Nenhum nível sobe para o servidor.

## PROIBIÇÕES ABSOLUTAS

### Crypto
- NÃO usar libs externas de crypto (forge, tweetnacl, sjcl, etc)
- NÃO enviar MasterKey, PostKey ou PaymentSecret para qualquer endpoint
- NÃO armazenar PaymentSecret após derivar MasterKey — descartar da memória
- NÃO usar localStorage para chaves criptográficas — só IndexedDB
- NÃO criar fallback que dê acesso sem chave válida
- NÃO fazer o frontend gerar PaymentSecret em produção (mock é exceção isolada)
- NÃO usar `extractable: true` em PostKey (só MasterKey precisa ser exportável)

### Código
- NÃO usar `any` — tipar tudo
- NÃO usar `as` para forçar tipos — resolver no nível correto
- NÃO usar `console.log` em produção — resultado vai para UI em dev
- NÃO criar abstrações prematuras — resolver o problema direto
- NÃO usar comentários óbvios (`// incrementa contador`) — código deve ser autoexplicativo
- NÃO instalar dependências sem autorização explícita
- NÃO criar arquivos fora da estrutura definida

### Arquitetura
- NÃO criar rotas além das definidas
- NÃO acessar storage diretamente de componentes — sempre via DataSource ou crypto layer
- NÃO misturar lógica de mock com lógica de produção no mesmo arquivo

## REGRAS DE DERIVAÇÃO

### MasterKey
```
ikm:  PaymentSecret (raw bytes)
salt: userSalt (16 bytes, gerado no cadastro, público)
info: "aesf33d-masterkey-v1" (UTF-8 encoded)
algo: HKDF-SHA256
out:  AES-GCM 256, extractable: true, usages: ['encrypt', 'decrypt']
```

### PostKey
```
ikm:  MasterKey (exportar para raw bytes via exportKey('raw') → reimportar como HKDF)
salt: postSalt (16 bytes random por post)
info: "aesf33d-postkey-v1:" + postId (UTF-8 encoded)
algo: HKDF-SHA256
out:  AES-GCM 256, extractable: false, usages: ['encrypt', 'decrypt']
```

Web Crypto não permite usar AES-GCM key como input de HKDF. O workaround é:
exportKey('raw', masterKey) → importKey('raw', bytes, 'HKDF', false, ['deriveKey'])

### Encrypt/Decrypt
```
algo: AES-GCM
iv:   12 bytes random (gerado por operação, armazenado junto com blob)
```

## IndexedDB

Database: `aesf33d-crypto`, version: 1

| Store      | keyPath  | Conteúdo                                    |
|------------|----------|---------------------------------------------|
| `keys`     | `id`     | `{ id: "masterKey", value: ArrayBuffer }`   |
| `keys`     | `id`     | `{ id: "userSalt", value: ArrayBuffer }`    |
| `postKeys` | `postId` | `{ postId, postSalt, key: ArrayBuffer }`    |

PostKeys são cacheadas como (postId, postSalt) e re-derivadas via MasterKey quando necessário.
Isso evita armazenar raw key material de PostKeys em repouso.

## ESTRUTURA DE ARQUIVOS

```
src/
├── app.css                  ← CSS global (variáveis, reset, elementos)
├── lib/
│   ├── crypto/
│   │   ├── crypto.ts        ← derivação, encrypt, decrypt
│   │   ├── store.ts         ← IndexedDB operations
│   │   ├── backup.ts        ← export/import CryptoBackup (.aesf33d)
│   │   └── utils.ts         ← base64 ↔ ArrayBuffer, encoding helpers
│   │
│   ├── datasources/
│   │   ├── errors.ts        ← AuthError
│   │   ├── interfaces/
│   │   │   ├── IAuthDataSource.ts         ← User, Session, IAuthDataSource
│   │   │   └── ISubscriptionDataSource.ts ← SubscriptionStatus, ISubscriptionDataSource
│   │   └── mock/
│   │       ├── MockSubscriptionDataSource.ts ← implements ISubscriptionDataSource
│   │       ├── MockAuthDataSource.ts         ← login/registro via localStorage
│   │       └── MockPostDataSource.ts         ← store reativo de posts mock
│   │
│   ├── stores/
│   │   ├── auth.ts          ← Svelte stores de sessão (session, isLoggedIn, currentUser)
│   │   └── subscription.ts  ← Store de assinatura (subscriptionStatus, activate, enforce)
│   │
│   └── components/
│       ├── DevModal.svelte  ← Painel dev (toggle: tecla D)
│       ├── FeedRow.svelte   ← Linha individual do feed
│       └── PostContent.svelte ← Renderização de conteúdo (free/premium/locked)
│
└── routes/
    ├── +layout.svelte       ← Header, footer, slot, DevModal, auth init
    ├── /                    ← feed (HN-style)
    ├── /post/[id]           ← leitura de post
    ├── /write               ← editor (requer login)
    ├── /subscribe           ← pagamento + export/import (requer login)
    ├── /login               ← página de login
    ├── /register            ← página de registro
    └── /test                ← validação funcional (DEV only)

docs/
├── impl-001-visual-design.md      ← Spec do layout e design visual
├── impl-002-auth-system.md        ← Spec do sistema de login/registro
└── impl-003-subscription-flow.md  ← Spec do fluxo de assinatura mock
```

Não criar arquivos fora desta estrutura sem autorização.

## FLUXO DE ASSINATURA (MOCK)

1. `simulatePayment()` → gera PaymentSecret (32 bytes) + userSalt (16 bytes)
2. `deriveMasterKey(paymentSecret, userSalt)` → CryptoKey
3. `saveMasterKey(key)` → IndexedDB
4. `saveUserSalt(salt)` → IndexedDB
5. PaymentSecret descartado (sai do escopo, sem referência)
6. Subscription salva em localStorage: `{ active: true, validUntil: ISO8601 }`

## FLUXO DE EXPIRAÇÃO

1. Detecta `active === false` OU `validUntil < now`
2. `clearCryptoData()` — wipe total do IndexedDB
3. Redirect → `/subscribe`
4. Sem acesso parcial, sem cache de conteúdo decifrado

## EXPORT/IMPORT (.aesf33d)

```typescript
interface CryptoBackup {
  version: 1;
  exportedAt: string;       // ISO 8601
  userId: string;
  masterKey: string;        // base64 of raw bytes
  userSalt: string;         // base64
  cachedPosts: Array<{
    postId: string;
    postSalt: string;       // base64
  }>;
}
```

- Export: `exportKey('raw', masterKey)` → base64 → JSON → download `.aesf33d`
- Import: validar `version === 1` → `importKey('raw')` → salvar IndexedDB
- 100% local — nenhum byte criptográfico trafega pelo servidor
- Rollback se qualquer passo do import falhar

## DECISÕES FIXAS — NÃO QUESTIONAR

- Assinatura à plataforma — um pagamento dá acesso a TODOS os posts premium
- PaymentSecret gerado pelo SERVIDOR — nunca pelo autor, nunca pelo frontend
- Preview de premium: somente título (sem conteúdo parcial)
- MasterKey gerada e armazenada LOCALMENTE no browser
- postId gerado pelo frontend como UUID antes do upload
- userSalt é público — não é segredo, é domain separation para HKDF
- Expiração = wipe total + redirect (sem acesso a conteúdo previamente decifrado)
- Sem ACL, sem roles — a chave é a permissão

## VISUAL (QUANDO FOR IMPLEMENTAR UI)

- Estética: densa, utilitária (referência: 0day.today)
- border-radius: 0 em tudo
- Sem sombras, sem gradientes
- Accent: #cc0000 (vermelho) — único
- Fonts: Courier New (código, headers), Verdana (corpo)
- Feedback: prefixos `[+]` sucesso, `[-]` erro, `[*]` info
- Background escuro (#111), texto claro (#ccc)

## ANTES DE CADA COMMIT

Verificar mentalmente:
1. Alguma chave criptográfica está sendo enviada ao servidor? → BUG
2. PaymentSecret está sendo persistido em qualquer lugar? → BUG
3. Existe fallback que dá acesso sem chave? → BUG
4. Algum `any` ou `as` forçado? → CORRIGIR
5. Algum arquivo fora da estrutura definida? → MOVER

## DOCUMENTAÇÃO DE IMPLEMENTAÇÃO

Após cada GRANDE solicitação (nova feature, novo sistema, refactor significativo), criar um documento em `docs/` seguindo o padrão:

- Arquivo: `docs/impl-NNN-nome-curto.md` (NNN sequencial, ex: `impl-003-payments.md`)
- Objetivo: permitir reimplementação do zero caso o projeto seja perdido
- O documento deve conter:
  1. **Resumo**: o que foi implementado e por quê
  2. **Arquivos criados**: lista completa com caminho e propósito
  3. **Arquivos modificados**: o que mudou em cada arquivo existente
  4. **Interfaces e tipos**: todas as interfaces TypeScript criadas
  5. **Lógica de negócio**: fluxos, validações, regras, estados
  6. **Decisões de design**: escolhas não-óbvias e suas razões
  7. **Integração**: como conecta com o código existente
- Atualizar a seção ESTRUTURA DE ARQUIVOS neste CLAUDE.md com novos arquivos
- NÃO documentar: código trivial, estilos CSS óbvios, implementações que o código explica sozinho
- O documento é uma SPEC, não um tutorial — linguagem direta, sem floreios
