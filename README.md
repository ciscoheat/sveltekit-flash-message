# sveltekit-flash-message

Temporary messages for SvelteKit: Set one during a request, read it on the next page.

Useful after a form redirect, when a message belongs on the destination page rather than beside the form. Works with both SSR and without Javascript enabled.

## Install

```sh
pnpm i -D sveltekit-flash-message
```

```sh
npm i -D sveltekit-flash-message
```

## How to use

### Define the message

Add a serializable, optional `flash` property to `App.PageData` with the type that you want for the message.

**src/app.d.ts**

```ts
declare global {
  namespace App {
    interface PageData {
      flash?: { kind: "error" | "success"; message: string };
    }
  }
}

export {};
```

### Load and display it

Wrap the top-most `+layout.server.ts` or `+page.server.ts` load function with
`loadFlash`.

**src/routes/+layout.server.ts**

```ts
import { loadFlash } from "sveltekit-flash-message/server";

export const load = loadFlash(async () => {
  return { someData: 123 };
});
```

Only wrap one top-level load function: it reads and clears the flash cookie. Then create a flash context where the message should appear.

**src/routes/+layout.svelte**

```svelte
<script lang="ts">
  import { getFlash } from 'sveltekit-flash-message';

  const flash = getFlash();
</script>

{#if flash.value}
  <p class:error={flash.value.kind === "error"} role="status">
    {flash.value.message}
  </p>
{/if}
```

## Send a flash message

### Server-side

Use `redirect` in a remote form or other server-side request. It sets the flash
message and redirects with status `303`.

```ts
import { redirect } from "sveltekit-flash-message/server";

export const actions = {
  default: async () => {
    // Redirect to a page with 303 status
    redirect("/settings", { message: "Settings saved." });

    // Or redirect to the same page
    redirect({ message: "Settings saved." });

    // Or redirect with another status
    redirect(300, "/settings", { message: "Settings saved." });
  },
};
```

Use `setFlash` to set a flash message without redirecting, at the end of a remote form call for example:

```ts
import { setFlash } from "sveltekit-flash-message/server";

setFlash({ message: "Please correct the highlighted fields." });
```

Note that `setFlash` **does not work if Javascript is disabled**. If you need to support that case, a redirect is required to clear the flash cookie properly.

### Client-side

To change the flash message, update the reactive value returned by `getFlash`:

```ts
import { getFlash } from "sveltekit-flash-message";

const flash = getFlash();
flash.value = { message: "Saved." };
```

(Set it to `undefined` to clear the message.)

For client-side navigation, use the exported `goto` wrapper to set the flash
message after navigation completes:

```ts
import { goto } from "sveltekit-flash-message";

await goto("/settings", {
  flash: { message: "Settings saved." },
});
```

The wrapper accepts all standard SvelteKit `goto` options and adds an optional
`flash` option. The message is stored in the flash cookie for the destination
page.

## Options

Pass options to `getFlash` to control how long a message remains visible:

```ts
const flash = getFlash({
  clearOnNavigate: true,
  clearAfterMs: 5_000,
});
```

`clearOnNavigate` defaults to `true`. `clearAfterMs` is `0` as default, meaning it won't be cleared.

**Security note:** Flash data is stored in a browser-readable cookie. Treat it as user input: keep it JSON-serializable and never render it with `{@html}`.
