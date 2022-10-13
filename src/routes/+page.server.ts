import type { RequestEvent } from '@sveltejs/kit';
import { redirect } from '$lib/server.js';
import type { PageServerLoad } from './$types';
import count from './counter.js';

export const load: PageServerLoad = (params) => {
  if (params.url.searchParams.has('reset')) {
    count.reset();
    throw redirect(303, '/');
  }
};

export const actions = {
  normal: async (event: RequestEvent) => {
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

  enhanced: async (event: RequestEvent) => {
    throw redirect(
      '/posted',
      [
        {
          status: 'ok',
          text: '+page.server.ts POST to /posted ' + count.next()
        }
      ],
      event
    );
  }
};
