<script lang="ts">
  import { getFlash } from '$lib/client';
  import { page } from '$app/stores';

  const flash = getFlash(page);
</script>

{#if $flash && $flash[0]}
  <p><b>{$flash[0].text}</b></p>
{/if}

<form method="POST">
  <button>Set a flash message</button>
</form>
