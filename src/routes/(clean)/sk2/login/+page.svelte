<script lang="ts">
  import { getFlash } from '$lib/client';
  import { page } from '$app/stores';

  const flash = getFlash(page);
  flash.subscribe(($flash) => {
    console.log($flash);
  });
</script>

<div>{$flash?.[0].status} {$flash?.[0].text}</div>

<br /><a href="/sk2">Back</a>
