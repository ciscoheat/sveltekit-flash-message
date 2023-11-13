<script lang="ts">
  import { page } from '$app/stores';
  import { getFlash } from '$lib/client';

  getFlash(page, {
    clearAfterMs: 4000
  });
</script>

<h2>Layout 2</h2>

<div>
  <slot />
</div>

<br /><a href="/">Back to start</a>
