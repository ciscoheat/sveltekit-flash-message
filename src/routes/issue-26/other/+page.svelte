<script lang="ts">
  import { getFlash } from '$lib/client';
  import { page } from '$app/stores';

  const flash = getFlash(page);
</script>

{#if $flash && $flash[0]}
  {@const bg = $flash[0].status == 'ok' ? '#3D9970' : '#FF4136'}
  <div style:background-color={bg} class="flash">{$flash[0].text}</div>
{/if}
