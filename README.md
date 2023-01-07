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

If you've implemented a `load` function already, you can import `loadFlashMessage` instead and pass your load function to it:

**src/routes/+layout.server.ts**

```typescript
import type { LayoutServerLoad } from './$types';
import { loadFlashMessage } from 'sveltekit-flash-message/server';

export const load = loadFlashMessage(async (event) => {
  const data = { someOther: 'data' };
  return data;
}) satisfies LayoutServerLoad;
```

## 3. Display the flash message

Import the client `initFlashStore` class to initialize and display the flash message, for example in your layout component:

**src/routes/+layout.svelte**

```svelte
<script lang="ts">
  import { initFlashStore } from 'sveltekit-flash-message/client';
  import { page } from '$app/stores';

  const flash = initFlashStore(page);
</script>

{#if $flash}
  {@const bg = $flash.type == 'success' ? '#3D9970' : '#FF4136'}
  <div style:background-color={bg} class="flash">{$flash.message}</div>
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

If you want to send a flash message in some other component on the client, use the `getFlashStore` function:

**src/routes/some-route/+page.svelte**

```svelte
<script>
  import { getFlashStore } from 'sveltekit-flash-message/client';

  const flash = getFlashStore();

  function change() {
    $flash = { type: 'success', message: 'Updated from other component!' };
  }
</script>

<button on:click={change}>Update message</button>
```

Note that `initFlashStore` must have been called in a higher-level component before using `getFlashStore`.

## Client-side fetching and redirecting

If you're using [enhance](https://kit.svelte.dev/docs/form-actions#progressive-enhancement-use-enhance) the flash message will be updated automatically, but if you're using [fetch](https://kit.svelte.dev/docs/web-standards#fetch-apis) you must use `updateFlashStore` after fetching:

```svelte
<script lang="ts">
  import { updateFlashStore } from 'sveltekit-flash-message/client';

  async function submitForm(e: Event) {
    const form = e.target as HTMLFormElement;
    const body = new FormData(e.target as HTMLFormElement);

    await fetch(form.action, { method: 'POST', body });
    updateFlashStore();
  }
</script>

<form method="POST" action="/test" on:submit|preventDefault={submitForm}>
  <input type="text" name="test" value="TEST" />
  <button>Submit with fetch</button>
</form>
```

## Securing the flash message

Since the flash message is transferred in a cookie, it can be easily tampered with, so don't trust its content. Treat it like you do with any user data - hanging from a ten-foot pole over a fiery pit. 🔥 So never use `{@html}` to display it, and if you need to persist it for some reason, make sure you validate its type.

## Bonus: Removing flash message when navigating

This little snippet can be useful if you'd like to have the flash message removed when the user navigates to another route:

**src/routes/+layout.svelte**

```typescript
import { initFlashStore } from 'sveltekit-flash-message/client';
import { page } from '$app/stores';
import { beforeNavigate } from '$app/navigation';

const flash = initFlashStore(page);

beforeNavigate((nav) => {
  if ($flash && nav.from?.url.toString() != nav.to?.url.toString()) {
    $flash = undefined;
  }
});
```

Enjoy the library, and please [open a github issue](https://github.com/ciscoheat/sveltekit-flash-message/issues) if you have suggestions or feedback in general!
