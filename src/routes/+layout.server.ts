import { loadFlash } from '#lib/server/loadFlash.js';

export const load = loadFlash(async () => {
  return { test: 123 };
});
