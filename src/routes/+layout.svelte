<script lang="ts">
  import './layout.css';
  import { getFlash } from '#lib/flash.svelte.js';

  let { children, data } = $props();

  const test = $derived(data.test * 2);

  const flash = getFlash({ clearAfterMs: 3500 });
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<main>
  <span class="hidden data-test-layout">{test}</span>
  {#if flash.value?.message}
    <div id="flash-message" class="items-center p-3xs bg-indigo-800">
      {flash.value.message}
    </div>
  {/if}
  {@render children()}
</main>
