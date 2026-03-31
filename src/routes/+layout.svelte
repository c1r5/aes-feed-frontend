<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import DevModal from '$lib/components/DevModal.svelte';
  import { initAuth, isLoggedIn, username, doLogout } from '$lib/stores/auth';
  import { initSubscription } from '$lib/stores/subscription';

  const publicLinks = [
    { href: '/', label: 'feed' },
  ];

  const authLinks = [
    { href: '/', label: 'feed' },
    { href: '/write', label: 'write' },
    { href: '/subscribe', label: 'subscribe' },
  ];

  $: navLinks = $isLoggedIn ? authLinks : publicLinks;

  onMount(() => {
    initAuth();
    initSubscription();
  });

  async function handleLogout(): Promise<void> {
    await doLogout();
  }
</script>

<div class="shell">
  <header>
    <div class="header-inner">
      <div class="header-left">
        <a href="/" class="logo">AES F33D</a>
        <nav>
          {#each navLinks as link}
            <a
              href={link.href}
              class="nav-link"
              class:active={$page.url.pathname === link.href}
            >[{link.label}]</a>
          {/each}
        </nav>
      </div>
      <div class="header-right">
        {#if $isLoggedIn}
          <span class="user-greeting">bem vindo, <span class="user-name">{$username}</span>!</span>
          <button class="logout-btn" on:click={handleLogout}>[sair]</button>
        {:else}
          <a href="/login" class="nav-link">[entrar]</a>
        {/if}
      </div>
    </div>
  </header>

  <main>
    <slot />
  </main>

  <footer>
    <div class="footer-inner">aes f33d — 2026</div>
  </footer>
</div>

<DevModal />

<style>
  .shell {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  header {
    background: var(--bg-surface);
    border-bottom: 1px solid var(--border);
  }

  .header-inner {
    max-width: var(--content-width);
    margin: 0 auto;
    padding: 8px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .logo {
    font-family: var(--font-mono);
    font-size: var(--font-size-lg);
    font-weight: bold;
    color: var(--accent);
    text-decoration: none;
  }

  .logo:hover {
    text-decoration: none;
  }

  nav {
    display: flex;
    gap: 12px;
  }

  .nav-link {
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
    color: var(--text-muted);
    text-decoration: none;
  }

  .nav-link:hover {
    color: var(--accent);
    text-decoration: none;
  }

  .nav-link.active {
    color: var(--accent);
  }

  .user-greeting {
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
    color: var(--text-muted);
  }

  .user-name {
    color: var(--accent);
  }

  .logout-btn {
    font-family: var(--font-mono);
    font-size: var(--font-size-xs);
    color: var(--text-dim);
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
  }

  .logout-btn:hover {
    color: var(--accent);
    border: none;
  }

  main {
    flex: 1;
    max-width: var(--content-width);
    width: 100%;
    margin: 0 auto;
    padding: 16px;
  }

  footer {
    border-top: 1px solid var(--border);
  }

  .footer-inner {
    max-width: var(--content-width);
    margin: 0 auto;
    padding: 8px 16px;
    font-family: var(--font-mono);
    font-size: var(--font-size-xs);
    color: var(--text-dim);
  }
</style>
