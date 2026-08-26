<script lang="ts">
  import { page } from '$app/state';
  import { getFlash } from '#lib/client.js';

  const { children } = $props();

  const flash = getFlash(page);
</script>

<div>
  <p>second layout</p>

  {#if $flash}
    <div style="border: 1px solid black;">
      {$flash[0]?.text}
    </div>
  {/if}

  {@render children()}
</div>
