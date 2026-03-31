<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { session, doLogin } from '$lib/stores/auth';
  import { AuthError } from '$lib/datasources/errors';

  let email = '';
  let password = '';
  let feedback = '';

  onMount(() => {
    if ($session) goto('/');
  });

  async function handleLogin(): Promise<void> {
    feedback = '';
    if (!email.trim() || !password) {
      feedback = '[-] preencha todos os campos';
      return;
    }
    try {
      await doLogin(email, password);
      goto('/');
    } catch (e) {
      if (e instanceof AuthError) {
        feedback = `[-] ${e.message}`;
      } else {
        feedback = `[-] erro inesperado`;
      }
    }
  }
</script>

<div class="auth-page">
  <h1 class="page-title">login</h1>

  <div class="field">
    <label for="email">email:</label>
    <input id="email" type="email" bind:value={email} />
  </div>

  <div class="field">
    <label for="password">password:</label>
    <input
      id="password"
      type="password"
      bind:value={password}
      on:keydown={(e) => e.key === 'Enter' && handleLogin()}
    />
  </div>

  <button class="primary" on:click={handleLogin}>entrar</button>

  {#if feedback}
    <div class="feedback error">{feedback}</div>
  {/if}

  <p class="alt-link">não tem conta? <a href="/register">registre-se</a></p>
</div>

<style>
  .auth-page {
    max-width: 400px;
  }

  .page-title {
    font-family: var(--font-mono);
    font-size: var(--font-size-xl);
    color: var(--text);
    font-weight: normal;
    margin-bottom: 16px;
  }

  .field {
    margin-bottom: 12px;
  }

  .field label {
    display: block;
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
    color: var(--text-muted);
    margin-bottom: 4px;
  }

  .field input {
    width: 100%;
  }

  .feedback {
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
    margin-top: 8px;
  }

  .error {
    color: var(--error);
  }

  .alt-link {
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
    color: var(--text-muted);
    margin-top: 16px;
  }
</style>
