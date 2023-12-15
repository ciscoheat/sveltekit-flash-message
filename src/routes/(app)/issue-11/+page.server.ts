//import type { Actions } from '@sveltejs/kit';
import { redirect } from '$lib/server';

export const load = async (event) => {
  const message = {
    status: 'ok',
    text: 'Redirecting back to start.'
  } as const;
  console.log('🚀 ~ /issue-11 ~ message:', message);
  // SvelteKit 2 check (no throw)
  redirect(303, '/', [message], event);
};

/*
export const actions: Actions = {
  default: async (event) => {}
};
*/
