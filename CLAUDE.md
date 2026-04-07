## Project Configuration

- **Language**: TypeScript
- **Package Manager**: npm
- **Add-ons**: none

---

# CLAUDE.md — AES F33D

Regras de arquitetura e estilo que se aplicam a **todo** código gerado neste projeto.
Leia este arquivo antes de qualquer tarefa. Não há exceções.

---

## Identidade do projeto

**AES F33D** é um feed anônimo de posts criptografados. Autores publicam conteúdo cifrado com AES-GCM. Leitores pagam em XMR e recebem um `payment_secret` — a única chave que decifra o conteúdo. Nenhuma conta, nenhum login, nenhum histórico. O acesso é a chave.

---

## Estética visual — referência: 0day.today

A UI segue o estilo de agregadores hacker/underground como 0day.today: denso, utilitário, sem decoração. Não é cyberpunk com néon — é terminal com propósito.

### Paleta
```
--bg:          #0f0f0f   /* fundo base — quase preto */
--bg-surface:  #1a1a1a   /* cards, painéis */
--bg-hover:    #222222   /* hover de linhas */
--border:      #2a2a2a   /* divisores */
--text:        #cccccc   /* corpo de texto */
--text-muted:  #666666   /* metadata, labels */
--accent:      #cc0000   /* vermelho — ações primárias, badges */
--accent-dim:  #880000   /* hover do accent */
--link:        #4a9eff   /* links inline */
--link-hover:  #7ab8ff
--success:     #4a9e4a   /* decryptado com sucesso */
--mono:        'Courier New', Courier, monospace
--sans:        'Verdana', Geneva, sans-serif
```

### Tom visual
- Layout tabular: posts são linhas de uma tabela, não cards com sombra
- Tipografia pequena e densa: 12–13px para metadata, 14px para títulos
- Sem bordas arredondadas — `border-radius: 0` em tudo
- Sem sombras, sem gradientes, sem blur decorativo
- Separadores são `1px solid var(--border)` — nada mais
- Hover em linhas: só muda `background-color` para `--bg-hover`
- Badges são retângulos com `background: var(--accent)`, texto branco 11px uppercase
- Links não têm underline por padrão — só no hover

### Estrutura de página (inspirada no 0day.today)
```
┌─────────────────────────────────────────────┐
│ [AES F33D]              [about] [submit]     │  ← header fixo, compacto
├──────┬──────────────────────────────────────┤
│ nav  │  #   title              author  date  │  ← tabela de posts
│ cats │  1   [ENC] Post title   anon    02/03 │
│      │  2   [FREE] Post title  anon    02/03 │
│      │  ...                                  │
└──────┴──────────────────────────────────────┘
```

### Componentes visuais
- `[ENC]` — badge vermelho: post premium criptografado
- `[FREE]` — badge cinza escuro: post público
- `[NEW]` — badge accent em posts < 24h
- Formulário de decrypt: borda `1px solid #cc0000`, sem padding excessivo, label acima do input
- Mensagem de erro: texto `--accent`, prefixado com `[-]`
- Mensagem de sucesso: texto `--success`, prefixado com `[+]`
- Loading states: texto piscando com CSS animation, sem spinners

---

## Arquitetura em camadas

O projeto segue separação estrita de responsabilidades. Cada camada só conhece a camada imediatamente abaixo dela.

```
UI (routes / pages)
  └── Components (lib/components)
        └── Services (lib/services)
              └── Core (lib/crypto, lib/api, lib/db)
                    └── Types (lib/types)
```

### Camada: Core
Lógica pura, sem efeitos colaterais de UI. Funções testáveis isoladamente.
- `lib/crypto.ts` — encrypt/decrypt, key derivation
- `lib/api.ts` — fetch wrapper tipado, tratamento de erros HTTP
- `lib/db.ts` — queries (backend) ou acesso a storage (frontend)

### Camada: Services
Orquestram o Core para casos de uso reais. Não importam nada de Svelte/UI.
- `lib/services/post.ts` — buscar posts, descriptografar conteúdo
- `lib/services/auth.ts` — login, sessão, token
- `lib/services/subscription.ts` — validar assinatura, checar acesso premium

### Camada: Components
Componentes Svelte reutilizáveis, sem lógica de negócio.
- Recebem dados via props, emitem eventos — nunca chamam services diretamente
- Não fazem fetch, não conhecem a API
- `lib/components/ui/` — primitivos: Button, Input, Badge, Card
- `lib/components/post/` — PostCard, PostBody, PremiumGate, DecryptForm
- `lib/components/layout/` — Nav, Footer, PageShell

### Camada: UI (routes)
- `+page.svelte` e `+page.server.ts` são finos — só conectam services com components
- Máximo 50 linhas por arquivo de rota
- Lógica de busca vai em `+page.server.ts`, nunca inline no `+page.svelte`

---

## Componentes reutilizáveis

Todo componente deve ser **genérico o suficiente para ser usado em dois contextos diferentes**.
Se não conseguir imaginar dois contextos, ele é específico demais — extraia a lógica e deixe o componente como wrapper fino.

```svelte
<!-- ❌ Errado: componente acoplado ao contexto -->
<PremiumPostDecryptForm postId={post.id} authorWallet={post.author.wallet} />

<!-- ✅ Certo: componente que recebe o que precisa -->
<DecryptForm
  onSuccess={(plaintext) => content = plaintext}
  onError={(e) => error = e.message}
/>
```

Props obrigatórias devem ter tipos explícitos. Sem `any`. Sem props opcionais desnecessárias.

---

## Sem boilerplate

Proibido gerar código que existe só para "completar a estrutura".

| Proibido | Alternativa |
|---|---|
| Comentários óbvios `// increment counter` | Sem comentário — o código é auto-explicativo |
| `index.ts` re-exportando tudo | Importação direta do arquivo |
| Interfaces com um único implementador | Type alias simples |
| Try/catch vazio ou com `console.log(e)` | Erros tipados, propagados ou tratados |
| Funções `handleXxx` de uma linha que só chamam outra função | Passar a função diretamente |
| Stores Svelte para estado que é local | `$state` / `let` local no componente |
| Arquivos `constants.ts` com strings mágicas que não se repetem | Inline onde é usado |

Se um bloco de código não faz nada que seu caller não pudesse fazer diretamente, delete-o.

---

## Convenções

### Nomes
- Arquivos: `kebab-case.ts`
- Componentes Svelte: `PascalCase.svelte`
- Funções: `camelCase` — verbos (`getPost`, `encryptContent`, `validateSecret`)
- Types/Interfaces: `PascalCase` — substantivos (`Post`, `CryptoError`, `SubscriptionStatus`)
- Constantes de módulo: `SCREAMING_SNAKE_CASE`

### Erros
Erros são tipos, não strings soltas.

```typescript
// lib/types.ts
export type AppError =
  | { kind: 'crypto';       message: string }
  | { kind: 'unauthorized'; message: string }
  | { kind: 'not_found';    resource: string }
  | { kind: 'network';      status: number; message: string }
```

Toda função que pode falhar retorna `Promise<Result<T, AppError>>` ou lança um `AppError` tipado — nunca `Error` genérico.

### Imports
Ordem: tipos → core → services → components → utils

```typescript
import type { Post, AppError } from '$lib/types'
import { decrypt } from '$lib/crypto'
import { getPost } from '$lib/services/post'
import PostBody from '$lib/components/post/PostBody.svelte'
```

---

## O que não fazer

- **Não gere telas completas de uma vez.** Construa os componentes base primeiro, componha depois.
- **Não duplique lógica** entre `+page.server.ts` e o componente. Se está nos dois, está errado.
- **Não use `any`**, nem `as unknown as T`. Se precisar, o tipo está errado.
- **Não crie abstrações antecipadas.** Abstraia quando houver repetição real, não por precaução.
- **Não esqueça o contrato criptográfico:** `encrypted_blob` é sempre `base64(iv[12] + ciphertext)`, salt é gerado por post, secret nunca persiste.
- **Não use frameworks CSS** (Tailwind, Bootstrap etc.) — CSS custom properties puras, conforme a paleta acima.
- **Não use border-radius, sombras ou gradientes** — a estética é flat e utilitária.
