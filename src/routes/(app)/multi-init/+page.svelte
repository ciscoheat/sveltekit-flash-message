<script lang="ts">
  import { getFlash } from '$lib/client';
  import { page } from '$app/stores';

  let error = '';

  try {
    getFlash(page, { clearOnNavigate: false });
  } catch (e) {
    error = String(e);
  }
</script>

<aside class="interactions"></aside>

<article>
  <p>{error}</p>
</article>
