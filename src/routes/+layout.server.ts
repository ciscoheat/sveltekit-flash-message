import { loadFlash } from "#lib/server/loadFlash.ts";

export const load = loadFlash(async () => {
  return { test: 123 };
});
