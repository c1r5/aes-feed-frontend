# IMPL-001 — Layout e Design Visual

Data: 2026-03-30
Pré-requisito: Camada funcional (crypto, mocks, IndexedDB) validada via `/test`.
Restrição: NÃO alterar nenhum arquivo em `src/lib/crypto/` ou `MockSubscriptionDataSource.ts`.

---

## RESUMO

Aplicação do design visual sobre o código funcional existente.
Estética: 0day.today — denso, utilitário, tabular.
Anti-referência: sombras, gradientes, border-radius, cards arredondados, "design moderno".

---

## ARQUIVOS CRIADOS

```
src/
├── app.css                              ← CSS global (variáveis, reset, elementos base)
├── routes/
│   ├── +layout.svelte                   ← Header, footer, slot, DevModal
│   ├── +page.svelte                     ← Feed (lista tabular de posts)
│   ├── post/[id]/+page.svelte           ← Leitura de post com decrypt
│   ├── write/+page.svelte               ← Editor com encrypt
│   └── subscribe/+page.svelte           ← Status de assinatura + backup
└── lib/
    ├── components/
    │   ├── DevModal.svelte              ← Painel dev (toggle: tecla D)
    │   ├── FeedRow.svelte               ← Linha individual do feed
    │   └── PostContent.svelte           ← Renderização de conteúdo (free/premium/locked)
    └── datasources/mock/
        └── MockPostDataSource.ts        ← Store reativo de posts mock
```

---

## CSS GLOBAL — `src/app.css`

### Variáveis CSS (`:root`)

```
--bg:           #111111       fundo principal
--bg-surface:   #1a1a1a       superfícies elevadas
--bg-input:     #0d0d0d       campos de input
--border:       #333333       bordas
--border-focus: #cc0000       borda de foco
--text:         #cccccc       texto principal
--text-muted:   #666666       texto secundário
--text-dim:     #444444       texto desativado
--accent:       #cc0000       vermelho (ÚNICO accent)
--success:      #00cc00       feedback positivo
--error:        #cc0000       feedback negativo
--link:         #cc0000       links
--font-mono:    'Courier New', 'Courier', monospace
--font-body:    'Verdana', 'Geneva', sans-serif
--font-size-xs: 11px
--font-size-sm: 12px
--font-size-md: 13px
--font-size-lg: 16px
--font-size-xl: 20px
--content-width: 780px
```

### Reset global

```css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  border-radius: 0 !important;   /* ZERO em tudo */
  box-shadow: none !important;    /* ZERO sombras */
}
```

### Elementos base estilizados

- `html`: background `--bg`, font-family `--font-body`, font-size `--font-size-md`
- `a`: cor `--accent`, sem underline, underline no hover
- `button`: font-mono, bg `--bg-surface`, border `--border`, hover border `--accent`
- `button.primary`: bg `--accent`, hover bg `#aa0000`
- `input/textarea`: font-mono, bg `--bg-input`, border `--border`, focus border `--accent`
- `.tag`: font-mono, xs, border. `.tag.premium`: border/cor `--accent`
- `.feedback`: font-mono, sm. `.success`/`.error`/`.info` com cores correspondentes
- `::selection`: bg `--accent`, cor branca
- Scrollbar: thin, `--border` sobre `--bg`

---

## LAYOUT — `src/routes/+layout.svelte`

### Estrutura

```
┌──────────────────────────────────────────────────────────────┐
│ AES F33D    [feed]  [write]  [subscribe]         user ▾      │
│──────────────────────────────────────────────────────────────│
│  <slot />                                                    │
│──────────────────────────────────────────────────────────────│
│  aes f33d — 2026                                             │
└──────────────────────────────────────────────────────────────┘
```

### Comportamento

- Importa `../app.css` no script
- Header: bg `--bg-surface`, border-bottom 1px solid `--border`
- Logo "AES F33D": font-mono, `--font-size-lg`, bold, cor `--accent`, link para `/`
- Nav links: font-mono, `--font-size-sm`, cor `--text-muted`, hover `--accent`
- Link ativo: cor `--accent` via `class:active={$page.url.pathname === link.href}`
- Conteúdo max-width `--content-width`, centralizado, padding 16px
- Footer: uma linha "aes f33d — 2026", font-mono, `--font-size-xs`, cor `--text-dim`
- Shell usa flexbox column com min-height 100vh (main com flex: 1)
- Inclui `<DevModal />` no final

### Links de navegação

```typescript
const navLinks = [
  { href: '/', label: 'feed' },
  { href: '/write', label: 'write' },
  { href: '/subscribe', label: 'subscribe' },
];
```

Renderizados como `[feed]`, `[write]`, `[subscribe]` com colchetes.

---

## MOCK POST DATA SOURCE — `src/lib/datasources/mock/MockPostDataSource.ts`

### Interface MockPost

```typescript
interface MockPost {
  id: string;
  title: string;
  author: string;
  createdAt: string;          // ISO 8601
  upvotes: number;
  premium: boolean;
  content: string | null;     // plaintext para posts free
  blob: string | null;        // encrypted blob base64 para premium
  iv: string | null;          // IV base64 para premium
  postSalt: string | null;    // salt base64 para derivação de PostKey
  comments: MockComment[];
}

interface MockComment {
  author: string;
  content: string;
  createdAt: string;
}
```

### Seed data

5 posts pré-definidos:
1. "Como eu saí da Matrix" — free, @satoshi, 3h atrás, 142 upvotes, 3 comentários
2. "Zero-knowledge na prática" — PREMIUM, @alice, 1d, 87 upvotes
3. "Monero vs Bitcoin: trade-offs reais" — free, @bob, 2d, 34 upvotes, 1 comentário
4. "OPSEC para iniciantes" — PREMIUM, @eve, 5d, 12 upvotes
5. "Meu setup de servidor caseiro" — free, @mallory, 7d, 3 upvotes, 2 comentários

Posts premium no seed têm `content/blob/iv/postSalt = null` (sempre mostram locked).

### Store e persistência

- Svelte `writable<MockPost[]>` exportado como `posts`
- Persistido em `sessionStorage` (key: `aesf33d:mockPosts`)
- Carregado do sessionStorage no init; fallback para SEED_POSTS
- Subscriber no store persiste automaticamente a cada mudança

### Funções exportadas

```typescript
addPost(post: MockPost): void          // prepend ao array
upvotePost(id: string): void           // incrementa upvotes
addComment(postId: string, comment: MockComment): void
getPost(id: string, allPosts: MockPost[]): MockPost | undefined
formatRelativeTime(isoDate: string): string   // "3h", "1d", "2w", "agora"
```

### formatRelativeTime

- < 1 min → "agora"
- < 60 min → `${min}m`
- < 24h → `${hours}h`
- < 7d → `${days}d`
- >= 7d → `${weeks}w`

---

## FEED — `src/routes/+page.svelte`

Simples: importa `posts` store e `FeedRow`, renderiza `{#each $posts as post}`.

---

## FEED ROW — `src/lib/components/FeedRow.svelte`

### Props

```typescript
export let post: MockPost;
```

### Estrutura HTML

Toda a linha é um `<a href="/post/{post.id}">` com display flex:

```
[▲ button] [count] [título com [PREMIUM] se aplicável] [@autor] [tempo]
```

### Comportamento

- Upvote `▲` é `<button>` dentro do `<a>`, com `e.preventDefault()` + `e.stopPropagation()` para não navegar
- Chama `upvotePost(post.id)` no click
- Linha inteira clicável, hover muda background para `--bg-surface`
- Border-bottom 1px solid `--border` entre linhas

### Estilo por elemento

- `.upvote`: font-size 10px, sem background/border, cor `--text-muted`, hover `--accent`
- `.count`: font-mono, sm, min-width 40px, text-align right, cor `--text-muted`
- `.title`: font-body, lg, cor `--text`, flex: 1, overflow ellipsis
- `.premium-tag`: font-mono, xs, cor `--accent`, dentro do `.title`
- `.author`: font-mono, xs, cor `--text-muted`, flex-shrink 0
- `.time`: font-mono, xs, cor `--text-dim`, flex-shrink 0, min-width 24px

---

## POST CONTENT — `src/lib/components/PostContent.svelte`

### Props

```typescript
export let post: MockPost;
```

### Estados

```typescript
let state: 'loading' | 'free' | 'decrypted' | 'locked' | 'error' = 'loading';
```

### Lógica (onMount)

1. Se `!post.premium` → state = `'free'`, renderiza `post.content`
2. Se premium mas `!post.blob || !post.iv || !post.postSalt` → state = `'locked'`
3. Tenta `loadMasterKey()` do IndexedDB
4. Se null → `'locked'`
5. Deriva PostKey via `derivePostKey(masterKey, post.id, postSaltBytes)`
6. Decifra via `decryptContent(postKey, post.blob, post.iv)`
7. Se sucesso → state = `'decrypted'`, guarda conteúdo em `decryptedContent`
8. Se catch → state = `'locked'`

### Renderização por estado

- **free / decrypted**: Renderiza parágrafos split por `\n`, em font-body, line-height 1.6
- **locked**: Bloco de ruído visual (5 linhas de `░` repetido em `--text-dim`, user-select: none) + mensagem `[*] Conteúdo cifrado. Assine para acessar. → /subscribe`
- **loading**: `[*] Carregando...` em font-mono, `--text-muted`
- **error**: `[-] {errorMessage}` em font-mono, `--error`

---

## POST PAGE — `src/routes/post/[id]/+page.svelte`

### Estrutura

```
┌──────────────────────────────────────────────────────────┐
│  [PREMIUM] Título do post                                │
│  @autor · 23 mar 2026 · ▲ 142                           │
│──────────────────────────────────────────────────────────│
│  <PostContent {post} />                                  │
│──────────────────────────────────────────────────────────│
│  comentários (N)                                         │
│  @alice · 2h                                             │
│  Texto do comentário                                     │
│──────────────────────────────────────────────────────────│
│  [input: escrever comentário]                [enviar]    │
└──────────────────────────────────────────────────────────┘
```

### Comportamento

- Post ID via `$page.params.id`
- Busca post reativo: `$: post = getPost($page.params.id ?? '', $posts)`
- Data formatada via `toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })`
- Comentários: form com input text + botão "enviar", Enter submete
- Autor do comentário usa `'anon'` (atualizado para usar username do auth na impl-002)
- Se post não encontrado: `[-] Post não encontrado.`

---

## EDITOR — `src/routes/write/+page.svelte`

### Campos

- `título`: input text, width 100%
- `tipo`: radio buttons `free` / `premium`, bind:group com boolean
- `conteúdo`: textarea, font-mono, min-height 300px, resize vertical

### Fluxo de publicação

**Post free:**
1. Gera `postId = crypto.randomUUID()`
2. `addPost(...)` com `content` em plaintext, campos crypto null

**Post premium:**
1. `loadMasterKey()` — se null: `[-] MasterKey não encontrada. Assine primeiro.`
2. `postSalt = generateRandom(16)`
3. `postKey = derivePostKey(masterKey, postId, postSalt)`
4. `encrypted = encryptContent(postKey, content)`
5. `cachePostKey(postId, postSaltB64, postKey)` no IndexedDB
6. `addPost(...)` com `blob/iv/postSalt`, content null

**Após publicação:** limpa campos, mostra `[+] Post publicado: {uuid}`

### Conversão de salt para base64 (sem `as`)

```typescript
const postSaltBuffer = new ArrayBuffer(postSalt.byteLength);
new Uint8Array(postSaltBuffer).set(postSalt);
const postSaltB64 = arrayBufferToBase64(postSaltBuffer);
```

---

## SUBSCRIBE — `src/routes/subscribe/+page.svelte`

### Seções

1. **Status**: 🟢/🔴 + "ativa até DD/MM/AAAA" ou "inativa" (via `MockSubscriptionDataSource.getStatus()`)
2. **Backup de chaves**: MasterKey ✓/✗, userSalt ✓/✗, PostKeys N cacheadas
3. **Botões**: `↓ exportar .aesf33d` / `↑ importar .aesf33d`
4. **Warning**: `⚠ exporte suas chaves antes de limpar o cache...`

### Refresh

`refreshState()` no onMount consulta `sub.getStatus()`, `loadMasterKey()`, `loadUserSalt()`, `listCachedPostIds()`.

### Import

- `<input type="file" accept=".aesf33d">` hidden, acionado por botão
- `readBackupFile(file)` → `importCryptoBackup(backup)` → `refreshState()`

---

## DEV MODAL — `src/lib/components/DevModal.svelte`

### Toggle

- Tecla `D` (ignora se foco em INPUT/TEXTAREA)
- `window.addEventListener('keydown')` no onMount, cleanup no onDestroy

### Posição

- `position: fixed`, bottom: 16px, right: 16px, width: 360px, z-index: 9999
- bg `--bg-surface`, border 1px solid `--border`
- Font: font-mono, `--font-size-xs`

### Seções

**subscription:**
- Botões: `[simular pagamento]` `[simular expira]`
- Pagamento: `simulatePayment()` → `deriveMasterKey()` → `saveMasterKey()` + `saveUserSalt()` + `markSecretDelivered()`
- Expiração: `simulateExpiration()` → `clearCryptoData()`
- Status: "ativo até DD/MM/AAAA" ou "inativo"

**crypto:**
- Info: MasterKey ✓/✗, userSalt ✓/✗, Posts N
- Botões: `[exportar]` `[importar]` `[limpar tudo]`

### Log

- Array `results: string[]`, acumulativo
- Prefixos `[+]`/`[-]`/`[*]` com cores correspondentes
- max-height 120px, overflow-y auto
