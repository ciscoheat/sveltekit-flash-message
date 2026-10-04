import type { RequestEvent } from '@sveltejs/kit';

type Handle = (input: {
  event: RequestEvent;
  resolve: (event: RequestEvent) => Promise<Response>;
}) => Response | Promise<Response>;

// Used to test hooks compatibility with the flash message.
export const handle = (async ({ event, resolve }) => {
  return await resolve(event);
}) satisfies Handle;
