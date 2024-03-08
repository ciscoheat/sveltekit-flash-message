//import type { Actions } from '@sveltejs/kit';
import { redirect } from '$lib/server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
  const message = {
    status: 'ok',
    text: 'Redirecting back to start.'
  } as const;
  console.log('🚀 ~ /issue-11 ~ message:', message);
  // SvelteKit 2 check (no throw)
  redirect(303, '/', [message], event);
};
