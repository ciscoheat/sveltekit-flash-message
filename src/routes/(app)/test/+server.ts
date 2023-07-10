import type { RequestEvent } from '@sveltejs/kit';
import { redirect } from '$lib/server.js';
import counter from '../counter';

export function POST(event: RequestEvent) {
  const msg = { status: 'ok' as const, text: '+server.ts POST ' + counter.next() };
  throw redirect(303, '/', [msg], event);
}
