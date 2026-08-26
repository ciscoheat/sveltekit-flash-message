import { redirect } from '#lib/server.js';
import type { PageServerLoad } from './$types';

export const load = (async (event) => {
  redirect(303, '/issue-47/page1', [{ status: 'ok', text: 'You got a message!' }], event.cookies);
}) satisfies PageServerLoad;
