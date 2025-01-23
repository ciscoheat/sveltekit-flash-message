<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<a href="/issue-47/page2">Go to page 2 and get redirected back here with a flash message.</a>
