import { loadFlashMessage } from '$lib/server.js';
import { redirect } from '$lib/server.js';

export const load = loadFlashMessage(async (event) => {
  if (event.url.searchParams.has('redirect')) {
    const message = [{ status: 'error', text: 'Redirect in layout' } as const];
    throw redirect(303, '/', message, event);
  }
  return { test: 'TESTFLASH:' + event.route.id };
});
