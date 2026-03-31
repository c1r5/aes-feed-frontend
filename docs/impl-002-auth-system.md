# IMPL-002 — Login/Registro com Mock

Data: 2026-03-30
Pré-requisito: IMPL-001 (layout visual) aplicado.
Restrição: NÃO alterar arquivos em `src/lib/crypto/` ou `MockSubscriptionDataSource.ts`.

---

## RESUMO

Autenticação frontend com mock (sem backend, tudo via localStorage).
Login é pré-requisito para: escrever posts, assinar premium, votar, comentar.
Feed e leitura de posts free são acessíveis sem login.

---

## ARQUIVOS CRIADOS

```
src/lib/
├── datasources/
│   ├── errors.ts                              ← AuthError
│   ├── interfaces/
│   │   └── IAuthDataSource.ts                 ← Interfaces User, Session, IAuthDataSource
│   └── mock/
│       └── MockAuthDataSource.ts              ← Implementação mock via localStorage
└── stores/
    └── auth.ts                                ← Svelte stores reativos de auth
src/routes/
├── login/+page.svelte                         ← Página de login
└── register/+page.svelte                      ← Página de registro
```

## ARQUIVOS MODIFICADOS

```
src/routes/+layout.svelte                      ← Header com estado de auth
src/lib/components/DevModal.svelte             ← Seção auth adicionada
src/routes/write/+page.svelte                  ← Route guard + username do autor
src/routes/subscribe/+page.svelte              ← Route guard
src/routes/post/[id]/+page.svelte              ← Username em comentários + guard de form
```

---

## INTERFACES — `src/lib/datasources/interfaces/IAuthDataSource.ts`

```typescript
interface User {
  id: string;                    // uuid
  username: string;
  email: string;
  userSalt: string;              // base64, 16 bytes — público, domain separation para HKDF
  createdAt: string;             // ISO 8601
}

interface Session {
  user: User;
  token: string;                 // uuid simples no mock
  expiresAt: string;             // ISO 8601
}

interface RegisterInput {
  username: string;
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface IAuthDataSource {
  register(input: RegisterInput): Promise<Session>;
  login(input: LoginInput): Promise<Session>;
  logout(): Promise<void>;
  getSession(): Promise<Session | null>;
  getUser(userId: string): Promise<User | null>;
}
```

---

## ERROS — `src/lib/datasources/errors.ts`

```typescript
class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}
```

Usado para login, registro e validação. Componentes fazem catch e mostram inline.

---

## MOCK AUTH — `src/lib/datasources/mock/MockAuthDataSource.ts`

### localStorage keys

```
"aesf33d:users"    → StoredUser[] (array de todos os usuários)
"aesf33d:session"  → Session | null (sessão ativa)
```

### StoredUser (tipo interno, não exportado)

```typescript
interface StoredUser {
  id: string;
  username: string;
  email: string;
  password: string;        // plain text no mock
  userSalt: string;        // base64
  createdAt: string;
}
```

Função `toUser(stored)` converte StoredUser → User (remove password).

### register(input)

1. Validar username: não vazio, 3-20 chars, regex `/^[a-zA-Z0-9_]+$/`
2. Validar email: regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
3. Validar password: length >= 6
4. Verificar unicidade de email e username em `aesf33d:users`
5. Se duplicado → `AuthError("email já registrado")` ou `AuthError("username já em uso")`
6. Gerar id: `crypto.randomUUID()`
7. Gerar userSalt: `crypto.getRandomValues(new Uint8Array(16))` → copiar para ArrayBuffer limpo → `arrayBufferToBase64()`
8. Salvar user em localStorage
9. Criar session: token = `crypto.randomUUID()`, expiresAt = now + 7 dias
10. Salvar session, retornar

### Conversão de salt para base64 (sem `as`)

```typescript
const saltBytes = crypto.getRandomValues(new Uint8Array(16));
const saltBuffer = new ArrayBuffer(saltBytes.byteLength);
new Uint8Array(saltBuffer).set(saltBytes);
const userSalt = arrayBufferToBase64(saltBuffer);
```

### login(input)

1. Buscar user por email em array
2. Se não encontrar OU password diferente → `AuthError("credenciais inválidas")` (mensagem genérica)
3. Criar session, salvar, retornar

### logout()

1. `localStorage.removeItem('aesf33d:session')`
2. NÃO limpar crypto data — logout ≠ expiração de assinatura

### getSession()

1. Ler de localStorage, parsear JSON
2. Se não existir → null
3. Se `expiresAt < now` → removeSession(), retornar null
4. Se válida → retornar

### getUser(userId)

1. Buscar em array por id
2. Retornar `toUser(found)` ou null

---

## STORE REATIVO — `src/lib/stores/auth.ts`

### Estado

```typescript
const datasource = new MockAuthDataSource();

export const session = writable<Session | null>(null);
export const isLoggedIn = derived(session, ($s) => $s !== null);
export const currentUser = derived(session, ($s) => $s?.user ?? null);
export const username = derived(session, ($s) => $s?.user.username ?? null);
```

### Ações

```typescript
async function initAuth(): Promise<void>
// Chama datasource.getSession()
// Se existir e válida → session.set(s)
// Se não → session.set(null)

async function doLogin(email: string, password: string): Promise<void>
// datasource.login({ email, password }) → session.set(result)
// Lança erro se falhar

async function doRegister(username: string, email: string, password: string): Promise<void>
// datasource.register({ username, email, password }) → session.set(result)
// Lança erro se falhar

async function doLogout(): Promise<void>
// datasource.logout() → session.set(null)
```

---

## LOGIN PAGE — `src/routes/login/+page.svelte`

### Campos

- email: `<input type="email">`
- password: `<input type="password">`, Enter submete

### Comportamento

- onMount: se `$session` existe → `goto('/')`
- Submit: `doLogin(email, password)` → sucesso: `goto('/')`, erro: feedback inline
- Se campos vazios: `[-] preencha todos os campos`
- Erros do AuthError mostrados como `[-] {message}`
- Link alternativo: "não tem conta? registre-se" → `/register`

### Estilo

- `.auth-page` max-width 400px
- Campos com labels em font-mono, sm, cor `--text-muted`
- Botão `button.primary` "entrar"
- `.alt-link`: font-mono, sm, cor `--text-muted`

---

## REGISTER PAGE — `src/routes/register/+page.svelte`

### Campos

- username: `<input type="text">`
- email: `<input type="email">`
- password: `<input type="password">`, Enter submete

### Comportamento

- onMount: se `$session` existe → `goto('/')`
- Submit: `doRegister(username, email, password)` → sucesso: `goto('/')`, erro: feedback inline
- Validação acontece no MockAuthDataSource, erros propagam como AuthError
- Link alternativo: "já tem conta? entrar" → `/login`

### Estilo

Idêntico ao login (mesmas classes CSS).

---

## LAYOUT ATUALIZADO — `src/routes/+layout.svelte`

### Mudanças

**Imports adicionados:**
```typescript
import { onMount } from 'svelte';
import { initAuth, isLoggedIn, username, doLogout } from '$lib/stores/auth';
```

**Nav condicional:**
```typescript
const publicLinks = [{ href: '/', label: 'feed' }];
const authLinks = [
  { href: '/', label: 'feed' },
  { href: '/write', label: 'write' },
  { href: '/subscribe', label: 'subscribe' },
];
$: navLinks = $isLoggedIn ? authLinks : publicLinks;
```

**Header split em header-left + header-right:**
- header-left: logo + nav
- header-right: condição auth

**Não logado:**
```html
<a href="/login" class="nav-link">[entrar]</a>
```

**Logado:**
```html
<span class="user-greeting">bem vindo, <span class="user-name">{$username}</span>!</span>
<button class="logout-btn" on:click={handleLogout}>[sair]</button>
```

**onMount:** chama `initAuth()` para recuperar sessão existente.

### Estilos adicionados

- `.header-left/.header-right`: flex, align-items center
- `.user-greeting`: font-mono, sm, cor `--text-muted`
- `.user-name`: cor `--accent`
- `.logout-btn`: font-mono, xs, cor `--text-dim`, sem background/border, hover `--accent`

---

## DEV MODAL ATUALIZADO — `src/lib/components/DevModal.svelte`

### Imports adicionados

```typescript
import { session, doLogout } from '$lib/stores/auth';
```

### Seção "auth" (primeira seção, antes de subscription)

**Se logado (`$session` truthy):**
```
user: {username} (id: {id truncado 8 chars}...)
session expires: {data formatada pt-BR}
userSalt: {salt truncado 12 chars}...
```

**Se não logado:**
```
user: nenhum
```

**Botões:**
- `[logout forçado]`: chama `doLogout()`, log `[+] Logout forçado`
- `[limpar todos os users]`: remove `aesf33d:users` e `aesf33d:session` do localStorage, `session.set(null)`, log `[+] Todos os users removidos`

### Estilo

Botões do dev-actions com `flex-wrap: wrap` para acomodar mais botões.

---

## ROUTE GUARDS

### Páginas protegidas (requerem login)

**`/write` e `/subscribe`:**
```typescript
import { get } from 'svelte/store';
import { session } from '$lib/stores/auth';

onMount(() => {
  if (!get(session)) goto('/login');
});
```

### Páginas públicas

- `/` (feed): sempre acessível
- `/post/[id]`: sempre acessível (premium locked mostra mensagem, não redirect)
- `/login` e `/register`: sempre acessíveis (redirect para `/` se já logado)
- `/test`: sempre acessível

---

## POST PAGE ATUALIZADO — `src/routes/post/[id]/+page.svelte`

### Imports adicionados

```typescript
import { isLoggedIn, currentUser } from '$lib/stores/auth';
```

### Comentários

- Autor usa `$currentUser?.username ?? 'anon'`
- Guard no handleComment: `if (!$isLoggedIn) return`
- Form de comentário: só aparece se `$isLoggedIn`
- Se não logado: `[*] entre para comentar` com link para `/login`

### Estilo adicionado

```css
.login-prompt { font-mono, sm, cor --text-muted, margin-top 12px }
```

---

## WRITE PAGE ATUALIZADO — `src/routes/write/+page.svelte`

### Imports adicionados

```typescript
import { onMount } from 'svelte';
import { goto } from '$app/navigation';
import { get } from 'svelte/store';
import { session, currentUser } from '$lib/stores/auth';
```

### Mudanças

- Route guard no onMount
- Autor de posts usa `$currentUser?.username ?? 'anon'` (ambos free e premium)

---

## SUBSCRIBE PAGE ATUALIZADO — `src/routes/subscribe/+page.svelte`

### Imports adicionados

```typescript
import { goto } from '$app/navigation';
import { get } from 'svelte/store';
import { session } from '$lib/stores/auth';
```

### Mudanças

- Route guard no onMount (antes de refreshState)

---

## DECISÕES DE DESIGN

1. **userSalt gerado no registro, persiste para sempre** — se o user já existe, o salt não muda
2. **Senha em plain text no mock** — backend real usará bcrypt
3. **Mensagem genérica no login** — "credenciais inválidas" não revela se email existe
4. **Logout ≠ wipe crypto** — conceitos separados (sessão HTTP vs chaves crypto)
5. **Session recovery no mount** — `initAuth()` em `+layout.svelte` onMount
6. **Token é uuid simples** — sem JWT, validação é lookup no localStorage
7. **userSalt acessível via `$currentUser.userSalt`** — qualquer parte do app acessa
8. **Route guards simples** — check no onMount com `get(session)`, sem middleware
