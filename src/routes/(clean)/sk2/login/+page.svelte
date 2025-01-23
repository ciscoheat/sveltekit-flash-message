<script lang="ts">
  import { getFlash } from '$lib/client';
  import { page } from '$app/state';

  const flash = getFlash(page);
  console.log('🚀 ~ flash:', $flash);
</script>

<div>{$flash?.[0].status} {$flash?.[0].text}</div>

<br /><a href="/sk2">Back</a>
