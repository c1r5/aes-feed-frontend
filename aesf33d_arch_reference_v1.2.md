# AES F33D — Referência de Arquitetura para Agentes
# v1.2 — 2026-03-30
# Formato otimizado para context window de LLM
# Inserir no início do contexto junto com CLAUDE.md

# ============================================================================
# 1. PRODUTO
# ============================================================================

NOME: AES F33D 
TIPO: Blog dual — feed aberto (HN-style) + conteúdo premium cifrado E2E
PRINCÍPIO: "Você não controla acesso — você controla distribuição de chave."
SERVIDOR: nunca vê conteúdo decifrado, MasterKey, PostKey ou PaymentSecret em claro

# ============================================================================
# 2. STACK
# ============================================================================

FRONTEND:  SvelteKit + TypeScript (strict) + Web Crypto API + IndexedDB
BACKEND:   Go
BANCO:     PostgreSQL
PAGAMENTO: Monero (XMR) via monero-wallet-rpc
CRYPTO:    AES-GCM 256, HKDF-SHA256

# ============================================================================
# 3. HIERARQUIA DE CHAVES
# ============================================================================

# Fluxo de derivação (top-down, cada nível depende do anterior):

PaymentSecret                          # 32 bytes random, gerado pelo SERVIDOR
  │
  ├─ ikm: PaymentSecret
  ├─ salt: userSalt                    # 16 bytes random, gerado no cadastro, PÚBLICO
  ├─ info: "aesf33d-masterkey-v1"      # UTF-8 encoded
  ├─ algo: HKDF-SHA256
  ▼
MasterKey                              # CryptoKey AES-GCM 256, extractable: true
  │
  ├─ ikm: MasterKey raw bytes          # exportKey('raw') → reimportKey como HKDF
  ├─ salt: postSalt                    # 16 bytes random POR POST
  ├─ info: "aesf33d-postkey-v1:" + postId  # UTF-8 encoded
  ├─ algo: HKDF-SHA256
  ▼
PostKey                                # CryptoKey AES-GCM 256, extractable: false
  │
  ├─ iv: 12 bytes random POR OPERAÇÃO
  ├─ algo: AES-GCM
  ▼
encrypted_blob + iv

# NOTA: Web Crypto não aceita AES-GCM key como input de HKDF.
# Workaround obrigatório:
#   exportKey('raw', masterKey) → importKey('raw', bytes, 'HKDF', false, ['deriveKey'])

# ============================================================================
# 4. MODELO DE DADOS
# ============================================================================

# --- users ---
id:                 uuid PK
username:           varchar UNIQUE NOT NULL
email:              varchar UNIQUE NOT NULL
password_hash:      varchar NOT NULL           # bcrypt no backend
user_salt:          varchar NOT NULL           # 16 bytes, base64, gerado no cadastro, PÚBLICO
wallet_subaddress:  varchar NULL               # subaddress do autor para repasse XMR
subaddress_index:   int NULL                   # índice para derivação determinística
created_at:         timestamp NOT NULL

# --- posts ---
id:                 uuid PK                    # gerado pelo FRONTEND como UUID
author_id:          uuid FK → users.id
title:              varchar NOT NULL            # sempre em claro (público)
is_premium:         boolean NOT NULL DEFAULT false
encrypted_blob:     text NULL                  # conteúdo cifrado (NULL se free)
post_salt:          varchar NULL               # 16 bytes, base64 (NULL se free)
iv:                 varchar NULL               # 12 bytes, base64 (NULL se free)
upvotes_count:      int NOT NULL DEFAULT 0
created_at:         timestamp NOT NULL
updated_at:         timestamp NOT NULL

# --- subscriptions ---
id:                 uuid PK
subscriber_id:      uuid FK → users.id
payment_secret_hash: varchar NOT NULL          # NUNCA o secret em claro
secret_delivered:   boolean NOT NULL DEFAULT false  # true após primeiro fetch pelo frontend
xmr_tx_id:         varchar NOT NULL
xmr_amount:        numeric NOT NULL
valid_from:         timestamp NOT NULL
valid_until:        timestamp NOT NULL
created_at:         timestamp NOT NULL

# --- upvotes ---
id:                 uuid PK
post_id:            uuid FK → posts.id
user_id:            uuid FK → users.id
created_at:         timestamp NOT NULL
UNIQUE(post_id, user_id)

# --- comments ---
id:                 uuid PK
post_id:            uuid FK → posts.id
author_id:          uuid FK → users.id
body:               text NOT NULL
created_at:         timestamp NOT NULL

# --- payouts ---
id:                 uuid PK
author_id:          uuid FK → users.id
xmr_tx_id:         varchar NOT NULL
xmr_amount:        numeric NOT NULL
platform_amount:    numeric NOT NULL
author_amount:      numeric NOT NULL
signed_log:         text NOT NULL              # prova criptográfica do repasse
created_at:         timestamp NOT NULL

# --- payment_events ---
id:                 uuid PK
xmr_tx_id:         varchar NOT NULL
subaddress:         varchar NOT NULL
amount:             numeric NOT NULL
confirmations:      int NOT NULL DEFAULT 0
status:             varchar NOT NULL           # pending | confirmed | failed
detected_at:        timestamp NOT NULL
confirmed_at:       timestamp NULL

# ============================================================================
# 5. BACKEND — DOMÍNIOS GO
# ============================================================================

# Estrutura de pastas:
# cmd/server/main.go
# internal/{auth,content,crypto,payment,payout,feed}/

# Grafo de dependências:
# auth       → (ninguém)
# crypto     → monero-wallet-rpc
# content    → auth
# feed       → content, auth
# payment    → crypto, auth
# payout     → crypto, auth, payment

DOMÍNIO auth:
  CreateUser(username, email, password) → User       # gera user_salt aqui
  Login(email, password) → SessionToken
  ValidateSession(token) → UserID
  GetUser(id) → User

DOMÍNIO crypto:
  GenerateSubaddress(readerID) → subaddress
  GenerateAuthorSubaddress(authorID) → subaddress
  GeneratePaymentSecret() → Secret                   # 32 bytes random
  HashSecret(secret) → Hash
  SignLog(data) → SignedLog

DOMÍNIO payment:
  WatchPayments() → loop daemon
  ConfirmPayment(txID) → PaymentEvent
  GetSubscription(userID) → Subscription

DOMÍNIO content:
  CreatePost / GetPost / ListPosts / UpdatePost / DeletePost
  # Nunca toca em chave ou conteúdo decifrado

DOMÍNIO feed:
  GetFeed / Upvote / AddComment / GetComments

DOMÍNIO payout:
  ProcessPayout(paymentEventID)
  GetPayoutLog(authorID) / GetPublicLog()

# ============================================================================
# 6. FRONTEND — ESTRUTURA
# ============================================================================

# --- Rotas ---
/                   feed (HN-style, público)
/post/[id]          leitura de post (público, premium requer chave)
/write              editor (requer login)
/subscribe          status + pagamento + export/import crypto (requer login)
/login              autenticação
/register           cadastro
/test               validação funcional (DEV only)

# --- Arquivos crypto ---
src/lib/crypto/crypto.ts     derivação (deriveMasterKey, derivePostKey, encryptContent, decryptContent)
src/lib/crypto/store.ts      IndexedDB (saveMasterKey, loadMasterKey, saveUserSalt, clearCryptoData)
src/lib/crypto/backup.ts     export/import CryptoBackup (.aesf33d)
src/lib/crypto/utils.ts      base64 ↔ ArrayBuffer, encoding helpers

# --- IndexedDB ---
DATABASE: "aesf33d-crypto", version: 1
STORE "keys":     keyPath "id"     → { id: "masterKey"|"userSalt", value: ArrayBuffer }
STORE "postKeys": keyPath "postId" → { postId, postSalt }
# PostKeys são re-derivadas via MasterKey, não armazenadas como raw bytes

# --- DataSource pattern ---
INTERFACE                    MOCK (localStorage/IndexedDB)      PROD (API stubs)
IAuthDataSource              MockAuthDataSource                  ApiAuthDataSource
IPostsDataSource             MockPostsDataSource                 ApiPostsDataSource
IFeedDataSource              MockFeedDataSource                  ApiFeedDataSource
ISubscriptionDataSource      MockSubscriptionDataSource          ApiSubscriptionDataSource
IPayoutDataSource            MockPayoutDataSource                ApiPayoutDataSource

# Páginas Svelte NUNCA acessam storage diretamente — sempre via DataSource

# --- localStorage keys (mock) ---
"aesf33d:users"                User[]
"aesf33d:session"              Session | null
"aesf33d:posts"                Post[]
"aesf33d:sub:active"           "true" | "false"
"aesf33d:sub:validUntil"       ISO 8601
"aesf33d:sub:secretDelivered"  "true" | "false"
"aesf33d:userSalt"             base64

# --- Svelte stores ---
session: writable<Session | null>
isLoggedIn: derived<boolean>
currentUser: derived<User | null>
username: derived<string | null>

# ============================================================================
# 7. AUTH — MODELO DE DADOS E REGRAS
# ============================================================================

User { id, username, email, userSalt, createdAt }
Session { user: User, token: string, expiresAt: string }

REGISTRO:
  1. Validar: username 3-20 chars alfanumérico, email válido, password ≥ 6
  2. Verificar unicidade (email + username)
  3. Gerar id = crypto.randomUUID()
  4. Gerar userSalt = crypto.getRandomValues(new Uint8Array(16)) → base64
  5. Armazenar user
  6. Criar session (token = uuid, expiresAt = now + 7d)

LOGIN:
  1. Buscar por email
  2. Validar password
  3. Erro genérico: "credenciais inválidas" (nunca revelar se email existe)
  4. Criar session

LOGOUT:
  1. Remover session do localStorage
  2. NÃO limpar crypto data (logout ≠ expiração)
  3. MasterKey permanece no IndexedDB

GUARDS:
  /write, /subscribe → requer login, redirect /login se ausente
  /, /post/[id] → público
  /login, /register → público (redirect / se já logado)

# ============================================================================
# 8. FLUXOS CRÍTICOS
# ============================================================================

# --- Escrita de post premium ---
1. Autor escreve título + conteúdo
2. Frontend: loadMasterKey() do IndexedDB
3. Frontend: postSalt = random(16), postId = crypto.randomUUID()
4. Frontend: PostKey = HKDF(MasterKey, postSalt, "aesf33d-postkey-v1:" + postId)
5. Frontend: { blob, iv } = AES-GCM encrypt(PostKey, conteúdo)
6. POST /posts → { id, title, is_premium: true, encrypted_blob, post_salt, iv }
7. Servidor salva — nunca vê o conteúdo

# --- Leitura de post premium ---
1. GET /posts/:id → { title, encrypted_blob, post_salt, iv, is_premium }
2. Se free → renderiza direto
3. Se premium:
   a. masterKey = loadMasterKey() — se null → mostrar "[PREMIUM] Assine para acessar"
   b. Verificar subscription status
   c. Se expirada → clearCryptoData() → redirect /subscribe → FIM
   d. PostKey = HKDF(masterKey, postSalt, "aesf33d-postkey-v1:" + postId)
   e. conteúdo = AES-GCM decrypt(PostKey, blob, iv)
   f. Renderiza localmente

# --- Assinatura (mock) ---
1. simulatePayment() → { paymentSecret: Uint8Array(32), userSalt: Uint8Array(16) }
2. deriveMasterKey(paymentSecret, userSalt) → CryptoKey
3. saveMasterKey(key) → IndexedDB
4. PaymentSecret sai do escopo — NUNCA persistido
5. localStorage: active=true, validUntil=now+30d

# --- Assinatura (produção) ---
1. Leitor paga XMR para subaddress único
2. Servidor detecta via view key
3. Servidor gera PaymentSecret → entrega ao frontend UMA VEZ (secret_delivered=true)
4. Frontend deriva MasterKey localmente
5. Servidor descarta PaymentSecret, guarda apenas hash

# --- Expiração ---
1. Detecta active=false OU validUntil < now
2. clearCryptoData() → wipe IndexedDB inteiro
3. Redirect /subscribe
4. ZERO acesso parcial

# --- Export backup ---
1. exportKey('raw', masterKey) → base64
2. loadUserSalt() → base64
3. Listar cached postSalts
4. Montar CryptoBackup JSON → download .aesf33d

# --- Import backup ---
1. Ler arquivo .aesf33d → JSON.parse
2. Validar version === 1
3. importKey('raw', masterKey) → CryptoKey
4. Restaurar userSalt + postSalts no IndexedDB
5. Se falhar qualquer passo → rollback (não sobrescrever)

CryptoBackup {
  version: 1,
  exportedAt: ISO8601,
  userId: string,
  masterKey: base64,
  userSalt: base64,
  cachedPosts: [{ postId, postSalt }]
}

# ============================================================================
# 9. PAGAMENTOS MONERO
# ============================================================================

MODELO: assinatura à PLATAFORMA (não por autor)
  → um pagamento dá acesso a TODOS os posts premium de TODOS os autores

SUBADDRESSES:
  Carteira principal
    └── subaddress(0, readerID) → endereço único por leitor
    └── subaddress(0, authorID) → endereço para repasse ao autor

REPASSE:
  - Periódico (não no momento do pagamento)
  - Split: X% plataforma, Y% autores
  - Proporcional a posts/leituras por autor
  - Código de repasse é ABERTO (auditável)
  - Log público assinado criptograficamente (SignLog)
  - Autor verifica via view key do próprio subaddress

# ============================================================================
# 10. VISUAL
# ============================================================================

ESTÉTICA: densa, utilitária (ref: 0day.today)
ANTI-PADRÃO: sombras, gradientes, border-radius, cards arredondados

PALETA:
  --bg:           #111111    fundo
  --bg-surface:   #1a1a1a    superfícies
  --bg-input:     #0d0d0d    campos
  --border:       #333333    bordas
  --border-focus: #cc0000    foco
  --text:         #cccccc    principal
  --text-muted:   #666666    secundário
  --text-dim:     #444444    desativado
  --accent:       #cc0000    ÚNICO accent (vermelho)
  --success:      #00cc00    [+]
  --error:        #cc0000    [-]

FONTES:
  --font-mono:    'Courier New', monospace    → headers, nav, código, DevModal
  --font-body:    'Verdana', sans-serif       → corpo, comentários
  Sem web fonts.

REGRAS CSS:
  border-radius: 0 em TUDO
  box-shadow: none
  gradientes: ZERO
  animações: ZERO

FEEDBACK:
  [+] sucesso (--success)
  [-] erro (--error)
  [*] info (--text-muted)
  Inline abaixo da ação, sem toasts, sem modais, sem banners.

FEED: tabular — uma linha por post, NÃO cards
  [▲ count] [título] [tag premium] [@autor] [tempo relativo]

PREMIUM LOCKED: bloco de ░░░ em --text-dim + mensagem + link /subscribe
  Sem blur, sem overlay, sem animação.

HEADER:
  Não logado: AES F33D  [feed]                           [entrar]
  Logado:     AES F33D  [feed] [write] [subscribe]   bem vindo, {user}!  [sair]
  {user} em --accent (vermelho)

# ============================================================================
# 11. QUESTÕES ABERTAS — BACKEND CRYPTO
# ============================================================================

GenerateSubaddress   → Quem chama: payment ou auth no cadastro?
subaddress_index     → Rastreado no banco ou consultado via RPC?
PaymentSecret        → Formato: UUID? bytes aleatórios? tamanho definido: 32 bytes
HashSecret           → Algoritmo: bcrypt, SHA-256, Argon2?
SignLog              → Algoritmo: Ed25519? RSA? Onde fica a chave privada?

# ============================================================================
# 12. DECISÕES FIXAS — NÃO ALTERAR
# ============================================================================

- Assinatura à plataforma — um pagamento dá acesso a TODOS os posts premium
- Repasse periódico e proporcional — não no momento do pagamento
- PaymentSecret gerado pelo SERVIDOR — nunca pelo autor, nunca pelo frontend
- Preview premium: somente título (sem conteúdo parcial)
- Pagamento exclusivamente em Monero (XMR)
- MasterKey gerada e armazenada LOCALMENTE no browser
- Código de repasse ABERTO, restante do backend FECHADO
- postId gerado pelo frontend como UUID antes do upload
- Expiração = clearCryptoData() + redirect /subscribe — wipe total
- Sem ACL, sem roles — a chave é a permissão
- userSalt é público, gerado no cadastro — não é segredo
- Export/Import via .aesf33d — 100% local, nenhum dado crypto sai pelo servidor
- Logout ≠ wipe crypto — sessão HTTP e chaves crypto são layers independentes
- Erro de login genérico — nunca revelar se email existe
- Web Crypto API exclusivamente — zero libs externas de crypto

# ============================================================================
# FIM
# ============================================================================
