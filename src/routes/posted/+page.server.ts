import type { PageServerLoad } from './$types';
import { loadFlash } from '#lib/server/loadFlash.js';

export const load = loadFlash(async () => {
  return {};
}) satisfies PageServerLoad;
