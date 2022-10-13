import { redirect, type RequestEvent } from '@sveltejs/kit';
import { redirect303 } from '$lib/server.js';
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
    throw redirect303(
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
    throw redirect303(
      [
        {
          status: 'ok',
          text: '+page.server.ts POST to /posted ' + count.next()
        }
      ],
      event,
      '/posted'
    );
  }
};
