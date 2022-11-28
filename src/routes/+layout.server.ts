import { loadFlash } from '$lib/server.js';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
  const flashData = loadFlash(event);
  return flashData;
};
