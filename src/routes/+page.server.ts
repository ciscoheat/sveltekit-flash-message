import { setFlash, redirect } from '#lib/server/index.js';
import type { Actions, PageServerLoad } from './$types';

export const load = (async () => {
  return { test: 456 };
}) satisfies PageServerLoad;

export const actions = {
  default: async ({ request }) => {
    const formData = await request.formData();
    const name = String(formData.get('name') ?? '').trim();

    if (name.length === 0) {
      return { success: false };
    }

    const js = formData.has('js');

    const message =
      name +
      ' (action) ' +
      (js ? '[JS]' : '[No JS]') +
      ' posted at ' +
      new Date().toTimeString().substring(0, 8);

    if (js) {
      setFlash({ message });
      return { success: true };
    } else {
      redirect({ message });
    }
  }
} satisfies Actions;
