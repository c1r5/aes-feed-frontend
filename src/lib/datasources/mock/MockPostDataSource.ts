import { writable } from 'svelte/store';

export interface MockComment {
  author: string;
  content: string;
  createdAt: string;
}

export interface MockPost {
  id: string;
  title: string;
  author: string;
  createdAt: string;
  upvotes: number;
  premium: boolean;
  content: string | null;
  blob: string | null;
  iv: string | null;
  postSalt: string | null;
  comments: MockComment[];
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function hoursAgo(hours: number): string {
  const d = new Date();
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}

const SEED_POSTS: MockPost[] = [
  {
    id: 'seed-001',
    title: 'Como eu saí da Matrix',
    author: 'satoshi',
    createdAt: hoursAgo(3),
    upvotes: 142,
    premium: false,
    content: 'A maioria das pessoas vive dentro de sistemas que nunca questionou. Não estou falando de conspiração — estou falando de dependência tecnológica.\n\nQuando decidi sair, comecei pelo mais básico: meu próprio servidor de email. Depois, DNS. Depois, uma VPN que eu mesmo opero.\n\nO custo? Uns 30 dólares por mês em VPS. O ganho? Eu sei exatamente onde meus dados estão.\n\nNão é paranoia — é higiene digital.',
    blob: null,
    iv: null,
    postSalt: null,
    comments: [
      { author: 'alice', content: 'Qual VPS você usa? Tenho interesse em fazer o mesmo.', createdAt: hoursAgo(2) },
      { author: 'bob', content: 'Fiz algo similar ano passado. A parte mais difícil é email — SPF/DKIM/DMARC dá trabalho.', createdAt: hoursAgo(1) },
      { author: 'eve', content: 'Self-hosting é o caminho. Recomendo começar com Yunohost.', createdAt: hoursAgo(0.5) }
    ]
  },
  {
    id: 'seed-002',
    title: 'Zero-knowledge na prática',
    author: 'alice',
    createdAt: daysAgo(1),
    upvotes: 87,
    premium: true,
    content: null,
    blob: null,
    iv: null,
    postSalt: null,
    comments: []
  },
  {
    id: 'seed-003',
    title: 'Monero vs Bitcoin: trade-offs reais',
    author: 'bob',
    createdAt: daysAgo(2),
    upvotes: 34,
    premium: false,
    content: 'O debate Monero vs Bitcoin normalmente gera mais calor que luz. Vou tentar ser objetivo.\n\nBitcoin: transparência total on-chain. Isso é feature, não bug — auditabilidade pública. Mas para transações privadas, você depende de layers (Lightning, CoinJoin) que têm trade-offs próprios.\n\nMonero: privacidade by default via RingCT + Stealth Addresses. O custo é um blockchain maior e verificação mais lenta.\n\nPara a maioria dos casos de uso, a pergunta certa não é "qual é melhor" mas "qual modelo de ameaça estou enfrentando?"',
    blob: null,
    iv: null,
    postSalt: null,
    comments: [
      { author: 'satoshi', content: 'Análise justa. Eu usaria ambos dependendo do contexto.', createdAt: daysAgo(1) }
    ]
  },
  {
    id: 'seed-004',
    title: 'OPSEC para iniciantes',
    author: 'eve',
    createdAt: daysAgo(5),
    upvotes: 12,
    premium: true,
    content: null,
    blob: null,
    iv: null,
    postSalt: null,
    comments: []
  },
  {
    id: 'seed-005',
    title: 'Meu setup de servidor caseiro',
    author: 'mallory',
    createdAt: daysAgo(7),
    upvotes: 3,
    premium: false,
    content: 'Estou rodando um Intel NUC com Proxmox há 6 meses. Dentro dele:\n\n- VM com Debian para email (Postfix + Dovecot)\n- Container LXC com Nginx reverse proxy\n- Container LXC com Gitea\n- Container LXC com Wireguard\n\nConsumo: ~15W. Barulho: zero. Custo mensal de energia: insignificante.\n\nO maior desafio foi configurar IPv6 corretamente com meu ISP. Levou 3 dias de tentativa e erro.',
    blob: null,
    iv: null,
    postSalt: null,
    comments: [
      { author: 'bob', content: 'Proxmox é excelente. Uso há 2 anos sem problemas.', createdAt: daysAgo(6) },
      { author: 'alice', content: 'Qual modelo do NUC? Estou pensando em montar algo similar.', createdAt: daysAgo(5) }
    ]
  }
];

function loadPosts(): MockPost[] {
  if (typeof window === 'undefined') return SEED_POSTS;
  const stored = sessionStorage.getItem('aesf33d:mockPosts');
  if (stored) {
    try {
      return JSON.parse(stored) as MockPost[];
    } catch {
      return [...SEED_POSTS];
    }
  }
  return [...SEED_POSTS];
}

function persistPosts(posts: MockPost[]): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem('aesf33d:mockPosts', JSON.stringify(posts));
}

export const posts = writable<MockPost[]>(loadPosts());

posts.subscribe((value) => {
  persistPosts(value);
});

export function addPost(post: MockPost): void {
  posts.update((current) => [post, ...current]);
}

export function upvotePost(id: string): void {
  posts.update((current) =>
    current.map((p) => (p.id === id ? { ...p, upvotes: p.upvotes + 1 } : p))
  );
}

export function addComment(postId: string, comment: MockComment): void {
  posts.update((current) =>
    current.map((p) =>
      p.id === postId ? { ...p, comments: [...p.comments, comment] } : p
    )
  );
}

export function getPost(id: string, allPosts: MockPost[]): MockPost | undefined {
  return allPosts.find((p) => p.id === id);
}

export function formatRelativeTime(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return `${diffWeeks}w`;
}
