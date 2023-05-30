# sveltekit-flash-message ⚡

This is a [Sveltekit](https://kit.svelte.dev/) library that passes temporary data to the next request, usually from [form actions](https://kit.svelte.dev/docs/form-actions) and [endpoints](https://kit.svelte.dev/docs/routing#server). It's useful when you want a success or failure message displayed after a POST, which should not always be displayed at the form, rather as a message on the page that the request was redirected to.

This is known as a "flash message", especially known from PHP apps, since it's easy to add this functionality with PHP's built-in session handling. With SvelteKit it's a bit harder, but this library was made to alleviate that, encouraging well-behaved web apps that [Redirects after Post](https://www.theserverside.com/news/1365146/Redirect-After-Post).

## Installation

```
npm i -D sveltekit-flash-message
```

```
pnpm i -D sveltekit-flash-message
```

## Configuration

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

But most likely you have a top-level `load` function, in that case you can import `loadFlashMessage` and wrap your load function with it:

**src/routes/+layout.server.ts**

```typescript
import { loadFlashMessage } from 'sveltekit-flash-message/server';

export const load = loadFlashMessage(async (event) => {
  const data = { someOther: 'data' };
  return data;
});
```

## 3. Display the flash message

Import the client `initFlash` function to initialize and display the flash message, for example in your layout component. This will return a store that you can use to access the message:

**src/routes/+layout.svelte**

```svelte
<script lang="ts">
  import { initFlash } from 'sveltekit-flash-message/client';
  import { page } from '$app/stores';

  const flash = initFlash(page);
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

// For compatibility, the sveltekit signature can also be used,
// which will send no flash message.
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

export const POST = async (event) => {
  const message = { type: 'success', message: 'Endpoint POST successful!' } as const;
  throw redirect(303, '/', message, event);
};
```

### Form action example

**src/routes/todos/+page.server.ts**

```typescript
import { redirect } from 'sveltekit-flash-message/server';

export const actions = {
  default: async (event) => {
    const form = await event.request.formData();

    await api('POST', `/todos/${event.locals.userid}`, {
      text: form.get('text')
    });

    const message = { type: 'success', message: "That's the entrepreneur spirit!" } as const;
    throw redirect(message, event);
  }
};
```

### Setting without redirecting

If you want to display a flash message without redirecting, as a general error message when validation fails for example, you can use the `setFlash` function:

```typescript
import { fail } from '@sveltejs/kit';
import { setFlash } from 'sveltekit-flash-message/server';

export const actions = {
  default: async (event) => {
    const form = await event.request.formData();

    if (!form.get('text')) {
      setFlash({ type: 'error', message: 'Please enter text.' }, event);
      return fail(400);
    }
  }
};
```

### Client-side

If you want to send a flash message in some other component on the client, use the `getFlash` function:

**src/routes/some-route/+page.svelte**

```svelte
<script>
  import { getFlash } from 'sveltekit-flash-message/client';
  import { page } from '$app/stores';

  const flash = getFlash(page);

  function change() {
    $flash = { type: 'success', message: 'Updated from other component!' };
  }
</script>

<button on:click={change}>Update message</button>
```

Note that `initFlash` must have been called in a higher-level component before using `getFlash`.

## Multiple messages

If you specify `App.PageData['flash']` as an array, the library will accomodate for that and will concatenate messages into the array instead of replacing them, suitable for toast notifications. But if you want to always clear the previous messages, set the `clearArray` option to `true`.

```typescript
const messages = initFlash(page, {
  clearArray: true
});
```

## Securing the flash message

Since the flash message is transferred in a cookie, it can be easily tampered with, so don't trust its content. Treat it like you do with any user data - hanging from a ten-foot pole over a fiery pit. 🔥 So never use `{@html}` to display it, and if you need to persist it for some reason, make sure you validate it.

## Together with Superforms

The sister library to sveltekit-flash-message is **Superforms**, the all-in-one solution for forms in SvelteKit. You can use them together with just a little bit of extra configuration, [found here](https://superforms.vercel.app/flash-messages) on the Superforms website.

## Useful snippets

### Removing the flash message when navigating

This little snippet can be useful if you'd like to have the flash message removed when the user navigates to another route:

**src/routes/+layout.svelte**

```typescript
import { initFlash } from 'sveltekit-flash-message/client';
import { page } from '$app/stores';
import { beforeNavigate } from '$app/navigation';

const flash = initFlash(page);

beforeNavigate((nav) => {
  if ($flash && nav.from?.url.toString() != nav.to?.url.toString()) {
    $flash = undefined;
  }
});
```

### Removing the flash message after a certain time

**src/routes/+layout.svelte**

```typescript
import { initFlash } from 'sveltekit-flash-message/client';
import { page } from '$app/stores';

const flash = initFlash(page);
const flashTimeoutMs = 5000;

let flashTimeout: ReturnType<typeof setTimeout>;
$: if ($flash) {
  clearTimeout(flashTimeout);
  flashTimeout = setTimeout(() => ($flash = undefined), flashTimeoutMs);
}
```

If you use both of these, call `clearTimeout` in `beforeNavigate` too.

Enjoy the library, and please [open a github issue](https://github.com/ciscoheat/sveltekit-flash-message/issues) if you have suggestions or feedback in general!
