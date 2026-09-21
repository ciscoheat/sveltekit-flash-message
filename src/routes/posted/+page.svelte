<script lang="ts">
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
</script>

<span class="hidden data-test-from-layout">{data.test}</span>

<section>
  <h1>Posted Page</h1>
  <p>
    You are redirected here after a successful post. <a href="/"
      >Back to start</a
    >
  </p>
</section>
