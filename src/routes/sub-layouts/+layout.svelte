<script lang="ts">
  const { children } = $props();
</script>

<div>
  <nav>
    <a href="/">Root</a>
    <a href="/sub-layouts">Start</a>
    <a href="/sub-layouts/route2">Second</a>
  </nav>

  {@render children()}
</div>
