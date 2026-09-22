import { type } from 'arktype';
import { command, form } from '$app/server';
import { redirect, setFlash } from '#lib/server/index.js';

const flashFormSchema = type({
  name: type('string.trim').to('string > 0'),
  useGoto: type('boolean').optional()
});

const coercedBoolean = type('boolean').optional();

export const remoteFlashCommand = command(type('string > 0'), async (message: string) => {
  setFlash({
    message: message + ' set at ' + new Date().toTimeString().substring(0, 8)
  });
});

export const remoteForm = form(
  flashFormSchema.merge({ shouldRedirect: coercedBoolean }),
  async ({ name, shouldRedirect }) => {
    const message =
      name +
      ` ${shouldRedirect ? '(redirect)' : '(setFlash)'} posted at ` +
      new Date().toTimeString().substring(0, 8);

    if (shouldRedirect) redirect({ message });
    else setFlash({ message });
  }
);

export const remoteRedirect = form(flashFormSchema, async ({ name, useGoto }) => {
  const message = name + ' posted at ' + new Date().toTimeString().substring(0, 8);

  if (!useGoto) redirect('/posted', { message });
});
