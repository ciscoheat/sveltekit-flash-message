<script lang="ts">
  import { enhance } from '$app/forms';
</script>

<h1>Welcome to SvelteKit</h1>
<p>Click submit, a flash message should appear on the next page.</p>
<p><a href="/">Back</a></p>

<form method="POST" use:enhance>
  <div style="padding: 5px">
    <button type="submit">Submit</button>
  </div>
</form>
