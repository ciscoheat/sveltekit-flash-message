import { loadFlashMessage } from '$lib/server.js';
import type { LayoutServerLoad } from './$types';

export const load = loadFlashMessage(async (event) => {
  return { test: 'TESTFLASH:' + event.route.id };
});
