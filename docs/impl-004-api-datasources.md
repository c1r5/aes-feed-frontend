# impl-004 — API DataSources e Testes de Integração

## Resumo

Criação da camada de API que espelha os mocks existentes. O frontend agora pode operar contra
um backend real sem alterar stores ou páginas. O contrato de API foi extraído dos mocks e
formalizado em `API_CONTRACT.md`.

---

## Arquivos Criados

| Arquivo | Propósito |
|---------|-----------|
| `API_CONTRACT.md` | Contrato HTTP completo que o backend deve implementar |
| `src/lib/datasources/interfaces/IPostsDataSource.ts` | Interface + tipos para posts (Post, CreatePostInput, UpdatePostInput) |
| `src/lib/datasources/interfaces/IFeedDataSource.ts` | Interface + tipos para feed (FeedItem, Comment) |
| `src/lib/datasources/api/http.ts` | Cliente HTTP base: `apiFetch<T>()`, `ApiError` |
| `src/lib/datasources/api/ApiAuthDataSource.ts` | Auth contra API real |
| `src/lib/datasources/api/ApiPostsDataSource.ts` | Posts contra API real |
| `src/lib/datasources/api/ApiFeedDataSource.ts` | Feed contra API real |
| `src/lib/datasources/api/ApiSubscriptionDataSource.ts` | Subscription contra API real |
| `src/lib/datasources/mock/MockPostsDataSource.ts` | Adapter de classe sobre Svelte store de posts |
| `src/lib/datasources/mock/MockFeedDataSource.ts` | Adapter de classe sobre Svelte store de posts |
| `src/lib/datasources/provider.ts` | Switch mock/api baseado em `PUBLIC_USE_MOCKS` e `DEV` |
| `src/lib/datasources/api/__tests__/setup.ts` | Mock de localStorage para ambiente Node |
| `src/lib/datasources/api/__tests__/auth.integration.test.ts` | Testes Auth |
| `src/lib/datasources/api/__tests__/posts.integration.test.ts` | Testes Posts |
| `src/lib/datasources/api/__tests__/feed.integration.test.ts` | Testes Feed |
| `src/lib/datasources/api/__tests__/subscription.integration.test.ts` | Testes Subscription |
| `src/lib/datasources/api/__tests__/crypto-roundtrip.integration.test.ts` | Teste E2E crypto |
| `vitest.config.ts` | Configuração do Vitest com alias `$lib` |

---

## Arquivos Modificados

### `src/lib/datasources/interfaces/ISubscriptionDataSource.ts`
- `SubscriptionStatus` ganhou campo `paymentSecret?: string` (base64, entregue uma única vez pela API)
- `getStatus()` mudou de síncrono para `Promise<SubscriptionStatus>`
- Adicionado `restoreLocalSubscription(validUntil: string): void` à interface

### `src/lib/datasources/mock/MockSubscriptionDataSource.ts`
- `getStatus()` convertida para `async`

### `src/lib/stores/auth.ts`
- Substituído `new MockAuthDataSource()` por `authDataSource` importado de `provider.ts`

### `src/lib/stores/subscription.ts`
- Substituído `new MockSubscriptionDataSource()` por `subscriptionDataSource` importado de `provider.ts`
- `initSubscription()` convertida para `async` (awaita `getStatus()`)
- `checkAndEnforce()` atualizada para awaitar `getStatus()`
- `getSubscriptionDatasource()` retorna `typeof datasource` (tipo inferido da interface)

### `src/lib/components/DevModal.svelte`
- Substituído `getSubscriptionDatasource()` por `mockSubscriptionDatasource` importado de `provider.ts`
- Guards `if (!mockSubscriptionDatasource)` adicionados nos métodos mock-específicos

### `src/routes/test/+page.svelte`
- `checkStatus()` convertida para `async` (awaita `getStatus()`)

### `package.json`
- Adicionado `vitest: ^2.0.0` em devDependencies
- Scripts: `test:unit`, `test:integration` adicionados

---

## Interfaces e Tipos

### `IPostsDataSource`
```typescript
interface Post {
  id, authorId, authorUsername, title, isPremium,
  encryptedBlob?, postSalt?, iv?, content?,
  upvotesCount, createdAt, updatedAt
}
interface CreatePostInput { id, title, isPremium, encryptedBlob?, postSalt?, iv?, content? }
interface UpdatePostInput { title?, encryptedBlob?, postSalt?, iv?, content? }
interface IPostsDataSource {
  createPost(input): Promise<Post>
  getPost(id): Promise<Post>
  listPosts(params): Promise<{ posts: Post[]; total: number }>
  updatePost(id, input): Promise<Post>
  deletePost(id): Promise<void>
}
```

### `IFeedDataSource`
```typescript
interface FeedItem { id, authorId, authorUsername, title, isPremium, upvotesCount, commentCount, createdAt }
interface Comment { id, postId, authorId, authorUsername, body, createdAt }
interface IFeedDataSource {
  getFeed(params): Promise<{ posts: FeedItem[]; total: number }>
  upvote(postId): Promise<{ upvotesCount: number }>
  removeUpvote(postId): Promise<{ upvotesCount: number }>
  addComment(postId, input): Promise<Comment>
  getComments(postId): Promise<Comment[]>
}
```

---

## Lógica de Negócio

### Switch Mock/API (`provider.ts`)
```
USE_MOCKS = DEV && PUBLIC_USE_MOCKS !== 'false'
```
- `DEV` sem override → mocks (comportamento atual preservado)
- `DEV + PUBLIC_USE_MOCKS=false` → API real (para testes de integração local)
- `PROD` → API real sempre

### `http.ts` — Token de Auth
Token lido de `localStorage['aesf33d:session'].token`. Sem import circular (lê diretamente do
localStorage em vez de importar o store). Se `localStorage` não está disponível (Node), token
fica `undefined`.

### `ApiSubscriptionDataSource`
- `simulatePayment()` e `simulateExpiration()` lançam `Error('not available in production')`
- `getStatus()` retorna `paymentSecret` se presente (entregue pelo servidor uma única vez)
- `restoreLocalSubscription()` persiste estado local após import de backup

### Testes de Integração
Requerem backend rodando em `http://localhost:8080`. Executar com:
```bash
pnpm test:integration
```
O teste `crypto-roundtrip` é o teste canário: se passar, a integração E2E está validada.

---

## Decisões de Design

**`mockSubscriptionDatasource` exportado de provider.ts**
DevModal precisa chamar métodos mock-específicos (`getServerSubscriptionStatus`,
`invalidateServerSubscription`, `restoreServerSubscription`). Para evitar cast `as` (proibido),
o provider exporta a instância tipada concretamente. É `null` em produção — DevModal guarda
`if (!mockSubscriptionDatasource)` antes de usar.

**`getStatus()` assíncrono na interface**
A API HTTP é assíncrona por natureza. Mock wrapped em `async` é trivial. Alternativa de manter
duas interfaces seria mais complexa sem ganho real.

**Mocks de Posts/Feed como adapters de classe**
`MockPostDataSource` é um Svelte store (não uma classe). Para o provider exportar
`IPostsDataSource` em mock mode, foram criados `MockPostsDataSource` e `MockFeedDataSource`
como thin wrappers sobre o store existente. As rotas existentes continuam usando o store
diretamente — sem regressão.

---

## Integração

- Stores (`auth.ts`, `subscription.ts`) agora importam de `provider.ts`
- DevModal importa `mockSubscriptionDatasource` de `provider.ts`
- Rotas de posts/feed continuam usando `MockPostDataSource` (Svelte store) diretamente — refactor
  para usar `postsDataSource`/`feedDataSource` do provider é trabalho futuro
