import { flashResponse } from "$lib/server.js";
import type { RequestEvent } from "@sveltejs/kit";

export function POST(event : RequestEvent) {
  const msg = {status: 'ok' as const, text: '+server.ts POST ' + Date.now()}
  return flashResponse([msg], '/')
}
