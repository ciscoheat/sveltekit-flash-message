<script lang="ts">
  import { page } from '$app/state';
  import { getFlash } from '$lib/client';
  import type { LayoutData } from './$types';

  interface Props {
    data: LayoutData;
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();
  let message = $state('');

  const flash = getFlash(page);

  $effect(() => {
    if ($flash?.length) {
      switch ($flash[0].status) {
        case 'ok':
          message = $flash[0].text;
          break;
        case 'error':
          message = $flash[0].text;
          break;
      }
    }
  });
</script>

<h2>{message}</h2>

{@render children?.()}
