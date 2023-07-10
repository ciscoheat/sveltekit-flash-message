import { redirect } from '$lib/server.js';

export const actions = {
  default: async (event) => {
    throw redirect(
      [
        {
          status: 'error',
          text: 'This should be removed soon.'
        }
      ],
      event
    );
  }
};
