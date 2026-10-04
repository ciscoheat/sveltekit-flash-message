import { redirect } from '#lib/server.js';

export const actions = {
  default: ({ cookies }) => {
    redirect(303, '/sub-layouts/route2', [{ status: 'ok', text: 'Redirected to route2' }], cookies);
  }
};
