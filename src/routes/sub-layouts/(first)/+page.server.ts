import { redirect } from '$lib/server';

export const actions = {
  default: ({ cookies }) => {
    redirect(303, '/sub-layouts/route2', { message: 'Redirected to route2' }, cookies);
  }
};
