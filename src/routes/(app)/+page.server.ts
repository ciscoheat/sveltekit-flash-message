import { fail } from '@sveltejs/kit';
import { redirect, setFlash } from '$lib/server.js';
import type { Actions, PageServerLoad } from './$types';
import count from './counter.js';

export const load = ((event) => {
  if (event.url.searchParams.has('reset')) {
    count.reset();
    throw redirect(303, '/');
  }
}) satisfies PageServerLoad;

export const actions = {
  normal: async (event) => {
    throw redirect(
      [
        {
          status: 'error',
          text: '+page.server.ts POST ' + count.next()
        }
      ],
      event
    );
  },

  enhanced: async ({ cookies }) => {
    throw redirect(
      '/posted',
      [
        {
          status: 'ok',
          text: '+page.server.ts POST to /posted ' + count.next()
        }
      ],
      cookies
    );
  },

  async noRedirect(event) {
    setFlash(
      [{ status: 'error', text: '+page.server.ts POST no redirect ' + count.next() }],
      event
    );
    return fail(400);
  },

  async toast(event) {
    redirect(
      [
        {
          status: 'ok',
          text: 'A toast to you all'
        }
      ],
      event
    );
  }
} satisfies Actions;
