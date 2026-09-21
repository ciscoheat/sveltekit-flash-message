import type { PageServerLoad } from "./$types";
import { loadFlash } from "#lib/server/loadFlash.ts";

export const load = loadFlash(async () => {
  return {};
}) satisfies PageServerLoad;
