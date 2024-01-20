import type { PageServerLoad } from './$types';
import { loadFlash } from '$lib/server';

export const load = loadFlash(async () => {
  return {};
}) satisfies PageServerLoad;
