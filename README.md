# sveltekit-flash-message ⚡

This [Sveltekit](https://kit.svelte.dev/) library passes temporary data to the next request, usually in [form actions](https://kit.svelte.dev/docs/form-actions) and [endpoints](https://kit.svelte.dev/docs/routing#server). It's useful for displaying a success or failure message after a POST, which should not always be displayed at the form, rather as a message on the page that the request was redirected to.

Since it's a temporary message it's also known as a "flash message", especially known from PHP apps, since it's easy to add this functionality with PHP's built-in session handling. With SvelteKit it's a bit harder, but this library was made to alleviate that, encouraging well-behaved web apps that [Redirects after Post](https://www.theserverside.com/news/1365146/Redirect-After-Post).

## Installation

```
pnpm i -D sveltekit-flash-message
```

```
npm i -D sveltekit-flash-message
```

## How to use

### 1. Add the flash message to app.d.ts (Typescript only)

In `src/app.d.ts`, add the type for the flash message to `App.PageData` as an optional property called `flash`. It can be as simple as a `string`, or something more advanced. It has to be serializable though, so only JSON-friendly data structures. For example:

**src/app.d.ts**

```ts
declare namespace App {
  interface PageData {
    flash?: { type: 'success' | 'error'; message: string };
  }
}
```

### 2. Wrap the load function of a top-level +layout or +page route

If you're not using any [load functions](https://kit.svelte.dev/docs/load), this is a simple step. Create a `src/routes/+layout.server.ts` file with the following content:

**src/routes/+layout.server.ts**

```ts
export { load } from 'sveltekit-flash-message/server';
```

But most likely you already have a top-level `load` function, in which case you can import `loadFlash` and wrap your load function with it:

**src/routes/+layout.server.ts**

```ts
import { loadFlash } from 'sveltekit-flash-message/server';

export const load = loadFlash(async (event) => {
  const data = { someOther: 'data' };
  return data;
});
```

### 3. Display the flash message

Import `getFlash` in a layout or page component to display the flash message. `getFlash` will return a store that you'll use to access the message:

**src/routes/+layout.svelte**

```svelte
<script lang="ts">
  import { getFlash } from 'sveltekit-flash-message';
  import { page } from '$app/stores';

  const flash = getFlash(page);
</script>

{#if $flash}
  {@const bg = $flash.type == 'success' ? '#3D9970' : '#FF4136'}
  <div style:background-color={bg} class="flash">{$flash.message}</div>
{/if}
```

## 4. Send flash messages

### Server-side

To send a flash message from the server, import `redirect` from `sveltekit-flash-message/server` and use it in [load functions](https://kit.svelte.dev/docs/load#redirects) and [form actions](https://kit.svelte.dev/docs/form-actions#anatomy-of-an-action-redirects).

**Note:** With SvelteKit 2, you don't need to [throw the redirect](https://kit.svelte.dev/docs/migrating-to-sveltekit-2#redirect-and-error-are-no-longer-thrown-by-you), just call `redirect`. If you're still on SvelteKit 1, `throw` the function call.

```ts
import { redirect } from 'sveltekit-flash-message/server'

// The most specific: Redirect with a specific HTTP status to a specific location.
redirect(
  status: number,
  location: string,
  message: App.PageData['flash'],
  event: RequestEvent | Cookies
)

// Makes a 303 redirect to a specific location.
redirect(
  location: string,
  message: App.PageData['flash'],
  event: RequestEvent | Cookies
)

// Makes a 303 redirect to the current location.
redirect(
  message: App.PageData['flash'],
  event: RequestEvent
)

// For compatibility, the sveltekit signature can also be used, which will send no flash message.
redirect(
  status: number,
  location: string,
)
```

#### Form action example

**src/routes/todos/+page.server.ts**

```ts
import { redirect } from 'sveltekit-flash-message/server';

export const actions = {
  default: async ({ request, locals, cookies }) => {
    const form = await request.formData();

    await api('POST', `/todos/${locals.userid}`, {
      text: form.get('text')
    });

    redirect('/', { type: 'success', message: "That's the entrepreneur spirit!" }, cookies);
  }
};
```

#### Endpoint example

**src/routes/todos/+server.ts**

```ts
import type { RequestEvent } from '@sveltejs/kit';
import { redirect } from 'sveltekit-flash-message/server';

export const POST = async ({ cookies }) => {
  redirect('/', { type: 'success', message: 'Endpoint POST successful!' }, cookies);
};
```

#### Setting without redirecting

If you want to display a flash message without redirecting, as an error message when validation fails for example, you can use the `setFlash` function:

```ts
import { fail } from '@sveltejs/kit';
import { setFlash } from 'sveltekit-flash-message/server';

export const actions = {
  default: async ({ request, cookies }) => {
    const form = await request.formData();

    if (!form.get('text')) {
      setFlash({ type: 'error', message: 'Please enter text.' }, cookies);
      return fail(400);
    }
  }
};
```

### Client-side

If you want to update the flash message on the client, use `getFlash` in any component:

**src/routes/some-route/+page.svelte**

```svelte
<script>
  import { getFlash } from 'sveltekit-flash-message';
  import { page } from '$app/stores';

  const flash = getFlash(page);

  function showMessage() {
    $flash = { type: 'success', message: 'Updated from other component!' };
  }
</script>

<button on:click={showMessage}>Show flash message</button>
```

This will of course not set a cookie for the next request, it'll only update the flash message on the client.

## Client-side fetching and redirecting

The flash message will update automatically on redirect or navigation, but when using [fetch](https://kit.svelte.dev/docs/web-standards#fetch-apis), you must call `updateFlash` afterwards:

```svelte
<script lang="ts">
  import { updateFlash } from 'sveltekit-flash-message';
  import { page } from '$app/stores';

  async function submitForm(e: Event) {
    const form = e.target as HTMLFormElement;
    const body = new FormData(e.target as HTMLFormElement);

    await fetch(form.action, { method: 'POST', body });
    await updateFlash(page);
  }
</script>

<form method="POST" action="/test" on:submit|preventDefault={submitForm}>
  <input type="text" name="test" value="TEST" />
  <button>Submit with fetch</button>
</form>
```

`updateFlash` can take a second parameter, which is used to run a function **before** updating, so navigation events will pass through before showing the flash message. This is useful when you want to redirect based on the fetch response:

```ts
async function submitForm(e: Event) {
  const response = await fetch(new URL('/logout', $page.url), { method: 'POST' });
  if (response.redirected) {
    await updateFlash(page, () => goto(response.url, { invalidateAll: true }));
  }
}
```

## Toast messages, event-style

A common use case for flash messages is to show a toast notification, but a toast is more like an event than data that should be displayed on the page, as we've done previously. But you can use the `flash` store as an event handler with a reactive statement:

**src/routes/+layout.svelte**

```ts
import { getFlash } from 'sveltekit-flash-message';
import { page } from '$app/stores';
import toast, { Toaster } from 'svelte-french-toast';

const flash = getFlash(page);

$: if ($flash) {
  toast($flash.message, {
    icon: $flash.type == 'success' ? '✅' : '❌'
  });

  // Clear the flash message to avoid double-toasting.
  $flash = undefined;
}
```

## Flash message options

When calling `getFlash`, you can specify options, which will be inherited for the current route and the ones below.

```ts
const flash = getFlash(page, {
  clearOnNavigate: true,
  clearAfterMs: undefined,
  clearArray: false,
  flashCookieOptions: CookieSerializeOptions
});
```

You can also use `initFlash`, if you don't display a flash message in a certain layout but still want to set options for the routes below:

```ts
import { initFlash } from 'sveltekit-flash-message';
import { page } from '$app/stores';

initFlash(page, {
  clearAfterMs: 10000
});
```

### clearOnNavigate

If `true` (the default), the flash message will be removed when navigating to a different route.

### clearAfterMs

Can be set to a number of milliseconds before the flash message is automatically set to `undefined`.

### clearArray

If you specify `App.PageData['flash']` as an array, the library will concatenate messages into the array instead of replacing them. But if you always want to clear the previous messages for arrays, set the `clearArray` option to `true`. If your flash message isn't an array, this option will have no effect.

### flashCookieOptions

You can change the options for the cookie being sent, like this on the server:

```ts
import { loadFlash, flashCookieOptions } from 'sveltekit-flash-message/server';

flashCookieOptions.sameSite = 'lax';

export const load = loadFlash(async (event) => {
  // ...load function...
});
```

And correspondingly, on the client (in a top-level component):

```ts
import { initFlash } from 'sveltekit-flash-message';

initFlash(page, {
  flashCookieOptions: { sameSite: 'lax' }
});
```

All options can be found in the [cookie npm package](https://github.com/jshttp/cookie#options-1). Default options for the flash cookie are:

```ts
{
  path: '/',
  maxAge: 120,
  sameSite: 'strict',
  httpOnly: false // Setting this to true will most likely break things client-side.
}
```

The name of the cookie, `flash`, cannot be changed currently, let me know if that's inconvenient. ⚡

## Securing the flash message

Since the flash message is transferred in a cookie, it can be easily tampered with, so don't trust its content. Treat it like you do with any user data - hanging from a ten-foot pole over a fiery pit. 🔥 So never use `{@html}` to display it, and if you need to persist it for some reason, make sure you validate it.

## Together with Superforms

The sister library to sveltekit-flash-message is [Superforms](https://superforms.rocks), the all-in-one solution for forms in SvelteKit. You can use them together without any extra work, but there are options for closer integration, [found here](https://superforms.rocks/flash-messages) on the Superforms website.

# Notes

## When setting cookies in a response

If you're using `+hooks.server.ts/js`, or anywhere you have access to `response`, calling `response.headers.set('set-cookie', ...)` will discard the flash message cookie. You must use `response.headers.append` instead.

## Redirecting in the load function

In SvelteKit, links are [preloaded on hover](https://kit.svelte.dev/docs/link-options#data-sveltekit-preload-data) for increased responsiveness of the app. This can have the side-effect of accidentally setting a flash cookie, if a flash message redirect is made in a load function, and the user hovers over a link leading to it, so it is preloaded. To prevent this, set the `data-sveltekit-preload-data="tap"` attribute on links where a redirect could happen in the load function.

# Migration guides

## From 0.x to 1.x

The only thing you need to do when upgrading to 1.x is to remove all calls to `updateFlash` in `use:enhance`.

```diff
 <form
    method="POST"
-   use:enhance={() =>
-     ({ update }) =>
-       updateFlash(page, update)}
+   use:enhance
 >
```

## From 1.x to 2.x

1. Rename functions:

- `initFlash` is deprecated, `getFlash` can now be used directly instead.
- `loadFlashMessage` is deprecated and renamed to `loadFlash`.

2. If you've added the `beforeNavigate` snippet that clears the flash message after navigation - it can now be removed since it's automatic (though it can be prevented by setting the `clearOnNavigate` option to `false`).

3. If you're using the snippet for clearing the message after a certain amount of time, you can remove it and use the `clearAfterMs` option instead.

## Feedback and issues

Please [open a github issue](https://github.com/ciscoheat/sveltekit-flash-message/issues) for suggestions, if you find a bug or have feedback in general!
