import type { PageServerLoad } from './$types';
import { loadFlash } from '#lib/server.js';

export const load = loadFlash(async () => {
  return {};
}) satisfies PageServerLoad;
