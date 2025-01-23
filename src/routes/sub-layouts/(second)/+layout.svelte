<script lang="ts">
  import { page } from '$app/stores';
  import { getFlash } from '$lib/client';

  const { children } = $props();

  const flash = getFlash(page);
</script>

<div>
  <p>second layout</p>

  {#if $flash}
    <div style="border: 1px solid black;">
      {$flash.message}
    </div>
  {/if}

  {@render children()}
</div>
