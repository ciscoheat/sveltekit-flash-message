import { getRequestEvent } from '$app/server';
import { redirect as svelteKitRedirect } from '@sveltejs/kit';
import { setFlash } from './setFlash.js';

type Flash = App.PageData['flash'];
type RedirectStatus = Parameters<typeof svelteKitRedirect>[0];

export function redirect(status: RedirectStatus, location: string | URL, message: Flash): never;
export function redirect(location: string | URL, message: Flash): never;
export function redirect(message: Flash): never;
export function redirect(status: RedirectStatus, location: string | URL): never;
export function redirect(
  statusOrLocationOrMessage: RedirectStatus | string | URL | Flash,
  locationOrMessage?: string | URL | Flash,
  message?: Flash
): never {
  const event = getRequestEvent();

  if (typeof statusOrLocationOrMessage === 'number') {
    if (arguments.length >= 3) {
      setFlash(message);
    }

    svelteKitRedirect(statusOrLocationOrMessage, locationOrMessage as string | URL);
  }

  if (typeof statusOrLocationOrMessage === 'string' || statusOrLocationOrMessage instanceof URL) {
    if (arguments.length >= 2) {
      setFlash(locationOrMessage as Flash);
    }

    svelteKitRedirect(303, statusOrLocationOrMessage);
  }

  setFlash(statusOrLocationOrMessage);
  svelteKitRedirect(303, `${event.url.pathname}${event.url.search}`);
}
