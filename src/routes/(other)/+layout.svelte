<script lang="ts">
  import { page } from '$app/state';
  import { initFlash } from '#lib/client.js';

  initFlash(page, {
    clearAfterMs: 4000
  });
</script>

<h2>Layout 2</h2>

<div>
  <slot />
</div>

<br /><a href="/">Back to start</a>
