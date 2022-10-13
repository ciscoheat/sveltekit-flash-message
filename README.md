# sveltekit-flash-message ⚡

This is a [Sveltekit](https://kit.svelte.dev/) library that passes temporary data to the next request, usually from [Actions](https://kit.svelte.dev/docs/routing#page-actions) and [endpoints](https://kit.svelte.dev/docs/routing#server). It's useful when you want a "success" message displayed after a POST, which should not always be displayed at the form, rather as a message on the page that the request was redirected to.

This is known as a "flash message", especially known from PHP apps, since it's easy to add this functionality with PHP's built-in session handling. With Sveltekit it's a bit harder, but this library was made to alleviate that.

The library is encouraging well-behaved web apps that [Redirects after Post](https://www.theserverside.com/news/1365146/Redirect-After-Post), so a redirect is _required_ for a flash message to be displayed.

## Installation

```
(p)npm i sveltekit-flash-message
```

## Configuration

As usual, there are a few hoops to jump through:

## 0. Add to vite.config.js

Due to [this issue](https://github.com/sveltejs/kit/issues/6501), for now the following needs to be added to the `vite.config.js` file of your project:

```js
const config = {
  plugins: [sveltekit()],
  // === Add the following: ===
  ssr: {
    noExternal: ['sveltekit-flash-message']
  }
};
```

## 1. [Typescript only] Add the flash message to app.d.ts

In `src/app.d.ts` you should add the type for the flash message to `App.PageData` as an optional property called `flash`. It can be as simple as a `string`, or something more advanced. It has to be serializable though, so only JSON-friendly data structures. Here's an example:

**src/app.d.ts**

```typescript
declare namespace App {
  interface PageData {
    flash?: { type: 'success' | 'error'; message: string };
  }
}
```

## 2. Add a load function to a top-level +page or +layout server route

If you're not using any [load functions](https://kit.svelte.dev/docs/load), this is a simple step. Create a `src/routes/+layout.server.ts` file (or `+page.server.ts`) with the following content:

**src/routes/+layout.server.ts**

```typescript
export { load } from 'sveltekit-flash-message/server';
```

If you've implemented a `load` function already, you can import `loadFlash` and use it in the load function instead:

**src/routes/+layout.server.ts**

```typescript
import type { ServerLoadEvent } from '@sveltejs/kit';
import { loadFlash } from 'sveltekit-flash-message/server';

export function load(event: ServerLoadEvent) {
  const data = {
    some: 'data'
  };

  // Returns an object: { flash: App.PageData['flash'] | undefined }
  const flashData = loadFlash(event);

  return Object.assign(flashData, data);
}
```

## 3. Display the flash message

Instantiate the client `Flash` class to display the flash message, for example in your layout component:

**src/routes/+layout.svelte**

```svelte
<script lang="ts">
  import { Flash } from 'sveltekit-flash-message/client';
  import { page } from '$app/stores';

  const flash = new Flash(page);
  const message = flash.message;
</script>

{#if $message}
  {@const bg = $message.type == 'success' ? '#3D9970' : '#FF4136'}
  <div style:background-color={bg} class="flash">{$message.message}</div>
{/if}
```

## 4. Send flash messages

### Server-side

To send a flash message, import `redirect` from `sveltekit-flash-message/server` and throw it, as in [load](https://kit.svelte.dev/docs/load#redirects) and [form actions](https://kit.svelte.dev/docs/form-actions#anatomy-of-an-action-redirects).

```typescript
import { redirect } from 'sveltekit-flash-message/server'

throw redirect(
  status: number,
  location: string,
  message: App.PageData['flash'],
  event: RequestEvent
)

// Makes a 303 redirect
throw redirect(
  location: string,
  message: App.PageData['flash'],
  event: RequestEvent
)

// Makes a 303 redirect to the current URL
throw redirect(
  message: App.PageData['flash'],
  event: RequestEvent
)

// For compatibility, the sveltekit signature can also be used
throw redirect(
  status: number,
  location: string,
)
```

### Endpoint example

**src/routes/todos/+server.ts**

```typescript
import type { RequestEvent } from '@sveltejs/kit';
import { redirect } from 'sveltekit-flash-message/server';

export const POST = async (event: RequestEvent) => {
  const message = { type: 'success', message: 'Endpoint POST successful!' };
  throw redirect(303, '/', message, event);
};
```

### Action example

**src/routes/todos/+page.server.ts**

```typescript
import type { RequestEvent } from '@sveltejs/kit';
import { redirect } from 'sveltekit-flash-message/server';

export const actions = {
  default: async (event: RequestEvent) => {
    const form = await event.request.formData();

    await api('POST', `/todos/${event.locals.userid}`, {
      text: form.get('text')
    });

    const message = { type: 'success', message: "That's the entrepreneur spirit!" };
    throw redirect(message, event);
  }
};
```

### Client-side

If you want to send a flash message in some other circumstances on the client, you can simply assign a new value to the `Flash::message` property:

**src/routes/some-route/+page.svelte**

```svelte
<script>
  import { Flash } from 'sveltekit-flash-message/client';
  import { page } from '$app/stores';

  const flash = new Flash(page);
  const message = flash.message;

  function change() {
    $message = { type: 'success', message: 'Updated from other component!' };
  }
</script>

<button on:click={change}>Update message</button>
```

Note that importing like this only works on route components (files starting with a `+`), for other components you need to pass the `page` object along to them.

## Client-side fetching and redirecting

If you're using [enhance](https://kit.svelte.dev/docs/form-actions#progressive-enhancement-use-enhance) or [fetch](https://kit.svelte.dev/docs/web-standards#fetch-apis), the flash message will be passed on to the client, but it won't be displayed automatically. To display it, you can use `Flash::updateFrom` after the fetch is completed:

### Example 1: Enhance

```svelte
<form
  method="POST"
  use:enhance={() =>
    async ({ result, update }) =>
      flash.updateFrom(result, update)}
>
  <button>Submit with enhanced form</button>
</form>
```

### Example 2: Fetch

For simplicity, this example works on client-side only.

```svelte
<script lang="ts">
  import { Flash } from 'sveltekit-flash-message/client';
  import { page } from '$app/stores';

  const flash = new Flash(page);
  const message = flash.message;

  async function submitForm(e: SubmitEvent) {
    const form = e.target as HTMLFormElement;
    const body = new FormData(e.target as HTMLFormElement);

    const response = await fetch(form.action, { method: 'POST', body });
    flash.updateFrom(response);
  }
</script>

<form method="POST" action="/test" on:submit|preventDefault={submitForm}>
  <input type="text" name="test" value="TEST" />
  <button>Submit with fetch</button>
</form>
```

## Securing the flash message

Since the flash message is transferred in a cookie, it can be easily tampered with, so don't trust its content. Treat it like you do with any user data - hanging from a ten-foot pole over a fiery pit. 🔥

To help with that, you can add a parameter to `getFlashStore`, a validation function:

```typescript
// A bit lazy validation, for the sake of the example
const validate = (value: unknown) => {
  const check = value as any;
  if (
    typeof check === 'object' &&
    ['success', 'error'].contains(check.type) &&
    typeof check.message === 'string'
  ) {
    return check;
  }

  // Validation failed
  return undefined; // or throw, or return default value, if deemed more useful
};

const flash = new Flash(page, validate);
```

This will ensure the integrity of your flash messages. Instead of returning `undefined` you can return a default value, which is useful if you're using the library for displaying multiple messages in an array, like a notification widget.

## So much work, for so little?

It may seem so, but this library works both with SSR and client, which is trickier than it seems (and maybe trickier than what it should be...?)

## Bonus: Removing flash message when navigating

This little snippet can be useful if you'd like to have the flash message removed when the user navigates to another route:

**src/routes/+layout.svelte**

```typescript
import { Flash } from 'sveltekit-flash-message/client';
import { page } from '$app/stores';
import { beforeNavigate } from '$app/navigation';

const flash = new Flash(page);
const message = flash.message;

beforeNavigate((nav) => {
  if ($message && nav.from?.url.toString() != nav.to?.url.toString()) {
    $message = undefined;
  }
});
```

Enjoy the library, and please [open a github issue](https://github.com/ciscoheat/sveltekit-flash-message/issues) if you have suggestions or feedback in general!
