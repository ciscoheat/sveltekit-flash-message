import type { Handle } from '@sveltejs/kit';

// Used to test hooks compatibility with the flash message.
export const handle = (async ({ event, resolve }) => {
  return await resolve(event);
}) satisfies Handle;
