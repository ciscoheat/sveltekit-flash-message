import type { Actions, PageServerLoad } from './$types';
import { redirect } from '$lib/server';

export const actions: Actions = {
  default: async (event) => {
    redirect(303, '/sk2/login', [{ status: 'ok', text: 'Account created. Please login.' }], event);
  }
};
