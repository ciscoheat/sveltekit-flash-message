import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async () => {
  redirect(303, '/issue-47/page1');
}) satisfies PageServerLoad;
