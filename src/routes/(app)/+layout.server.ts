import { flashCookieOptions, loadFlash } from '$lib/server.js';
import { redirect } from '$lib/server.js';

flashCookieOptions.sameSite = 'lax';

export const load = loadFlash(async (event) => {
  if (event.url.searchParams.has('redirect')) {
    const message = [{ status: 'error', text: 'Redirect in layout' } as const];
    throw redirect(303, '/', message, event);
  }
  return { test: 'TESTFLASH:' + event.route.id };
});
