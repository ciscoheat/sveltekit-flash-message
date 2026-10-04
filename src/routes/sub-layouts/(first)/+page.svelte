<script lang="ts">
  import { enhance } from '$app/forms';
</script>

<form method="POST" use:enhance>
  <button type="submit">Redirect to 2nd layout with flash</button>
</form>
