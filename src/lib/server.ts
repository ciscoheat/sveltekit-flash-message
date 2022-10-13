import type { RequestEvent, ServerLoadEvent } from '@sveltejs/kit';
import { redirect as redir } from '@sveltejs/kit';
import { parse } from 'cookie';

//const d = console.debug

const cookieName = 'flash';
const httpOnly = false;
const path = '/';
const maxAge = 120;

/////////////////////////////////////////////////////////////////////

export function loadFlash(event: ServerLoadEvent) {
  const header = event.request.headers.get('cookie') || '';
  if (!header.includes(cookieName + '=')) {
    //d('No flash cookie found.')
    return { [cookieName]: undefined };
  }

  const cookies = parse(header);
  const dataString = cookies[cookieName];

  let data = undefined;

  if (dataString) {
    // Detect if event is XMLHttpRequest, basically by checking if the browser
    // is honoring the sec-fetch-dest header, or accepting html.
    if (
      event.request.headers.get('sec-fetch-dest') == 'empty' ||
      event.request.headers.get('accept') == '*/*'
    ) {
      //d('Possible fetch request, keeping cookie for client.')
    } else {
      //d('Flash cookie found, clearing')
      event.cookies.delete(cookieName);
    }

    try {
      data = JSON.parse(dataString);
    } catch (e) {
      // Ignore data if parsing error
    }

    //d('setting flash message: ' + data)
  }

  return {
    [cookieName]: data as App.PageData['flash'] | undefined
  };
}

export const load = loadFlash;

/////////////////////////////////////////////////////////////////////

export function redirect(
  status: number,
  location: string,
  message?: App.PageData['flash'],
  event?: RequestEvent
) {
  if (!message) return redir(status, location);
  if (!event) throw new Error('RequestEvent is required for redirecting with flash message');

  event.cookies.set(cookieName, JSON.stringify(message), { httpOnly, path, maxAge });
  return redir(status, location);
}

export function redirect303(
  message: App.PageData['flash'],
  event: RequestEvent,
  location?: string
) {
  if (!event) throw new Error('RequestEvent is required for redirecting with flash message');

  // Trim the named action, if it exists
  const redirectUrl = location ?? event.url.toString().replace(/\?\/\w+/, '');

  return redirect(303, redirectUrl, message, event);
}
