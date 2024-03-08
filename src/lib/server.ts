import type { Cookies, RequestEvent, ServerLoad, ServerLoadEvent } from '@sveltejs/kit';
import { redirect as redir } from '@sveltejs/kit';
import type { CookieSerializeOptions } from './cookie-es-main/index.js';

//const d = console.debug;

// Cannot change.
const cookieName = 'flash';

export const flashCookieOptions: CookieSerializeOptions = {
  path: '/',
  maxAge: 120,
  httpOnly: false,
  sameSite: 'strict'
};

/////////////////////////////////////////////////////////////////////

/**
 * @deprecated Renamed to loadFlash.
 */
export function loadFlashMessage<S extends ServerLoad, E extends ServerLoadEvent>(cb: S) {
  return loadFlash<S, E>(cb);
}

/**
 * Retrieves the flash message from the previous request.
 * Use as a wrapper around a top-level load function, usually in a +layout.server.ts file.
 */
export function loadFlash<S extends ServerLoad, E extends ServerLoadEvent>(cb: S) {
  return async (event: E) => {
    const flash = _loadFlash(event).flash;
    const loadFunction = await cb(event);
    return { flash, ...loadFunction } as ReturnType<S>;
  };
}

export function _loadFlash<T extends ServerLoadEvent>(
  event: T
): { flash: App.PageData['flash'] | undefined } {
  const dataString = event.cookies.get(cookieName);
  if (!dataString) {
    //d('No flash cookie found.');
    return { [cookieName]: undefined };
  }

  let data = undefined;

  if (dataString) {
    // Detect if event is XMLHttpRequest, basically by checking if the browser
    // is honoring the sec-fetch-dest header, or accepting json.
    // event.isDataRequest is also used.
    const setFetchDest = event.request.headers.get('sec-fetch-dest');
    const accept = event.request.headers.get('accept');

    if (
      event.isDataRequest ||
      setFetchDest == 'empty' ||
      accept == '*/*' ||
      accept?.includes('application/json')
    ) {
      //d('Possible fetch request, keeping cookie for client.');
    } else {
      //d('Flash cookie found, clearing');
      event.cookies.delete(cookieName, { path: flashCookieOptions.path ?? '/' });
    }

    try {
      data = JSON.parse(dataString);
    } catch (e) {
      // Ignore data if parsing error
    }
  }

  return {
    [cookieName]: data
  };
}

export const load = _loadFlash;

/////////////////////////////////////////////////////////////////////

type RedirectStatus = Parameters<typeof redir>[0];

/**
 * Redirect a request. When called during request handling, SvelteKit will return a redirect response.
 * Make sure you're not catching the thrown redirect, which would prevent SvelteKit from handling it.
 * @param {300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308 | ({} & number)} status The [HTTP status code](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status#redirection_messages). Must be in the range 300-308.
 * @param {string | URL} location The location to redirect to.
 * @throws {Redirect} This error instructs SvelteKit to redirect to the specified location.
 * @throws {Error} If the provided status is invalid.
 * @return {never}
 */
export function redirect(status: RedirectStatus, location: string | URL): ReturnType<typeof redir>;

/**
 * Redirect a request to the current URL, with HTTP status 303 and a flash message.
 * When called during request handling, SvelteKit will return a redirect response.
 * Make sure you're not catching the thrown redirect, which would prevent SvelteKit from handling it.
 * @param {App.PageData['flash']} message The flash message.
 * @param {RequestEvent | Cookies} event The event for the load function or form action.
 */
export function redirect(
  message: App.PageData['flash'],
  event: RequestEvent
): ReturnType<typeof redir>;

/**
 * Redirect a request to a specific location, with HTTP status 303 and a flash message.
 * When called during request handling, SvelteKit will return a redirect response.
 * Make sure you're not catching the thrown redirect, which would prevent SvelteKit from handling it.
 * @param {string | URL} location The redirect URL/location.
 * @param {App.PageData['flash']} message The flash message.
 * @param {RequestEvent | Cookies} event The event for the load function or form action.
 */
export function redirect(
  location: string | URL,
  message: App.PageData['flash'],
  event: RequestEvent | Cookies
): ReturnType<typeof redir>;

/**
 * Redirect a request to a specific location, with a specific HTTP status and a flash message.
 * If thrown during request handling, SvelteKit will return a redirect response.
 * Make sure you're not catching the thrown redirect, which would prevent SvelteKit from handling it.
 * @param {300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308} status The [HTTP status code](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status#redirection_messages). Must be in the range 300-308.
 * @param {string | URL} location The redirect URL/location.
 * @param {App.PageData['flash']} message The flash message.
 * @param {RequestEvent | Cookies} event The event for the load function or form action.
 */
export function redirect(
  status: RedirectStatus,
  location: string | URL,
  message: App.PageData['flash'],
  event: RequestEvent | Cookies
): ReturnType<typeof redir>;

export function redirect(
  status: unknown,
  location: unknown,
  message?: unknown,
  event?: RequestEvent | Cookies
): ReturnType<typeof redir> {
  switch (arguments.length) {
    case 2:
      if (typeof status === 'number') {
        return realRedirect(status as RedirectStatus, `${location}`);
      } else {
        const message = status as App.PageData['flash'];
        const event = location as RequestEvent;
        // Remove the named action, if it exists
        const redirectUrl = new URL(event.url);
        for (const [key] of redirectUrl.searchParams) {
          if (key.startsWith('/')) {
            redirectUrl.searchParams.delete(key);
          }
          break;
        }
        return realRedirect(303, redirectUrl, message, event);
      }

    case 3:
      return realRedirect(
        303,
        status as string | URL,
        location as App.PageData['flash'],
        message as RequestEvent
      );

    case 4:
      return realRedirect(
        status as RedirectStatus,
        location as string | URL,
        message as App.PageData['flash'],
        event
      );

    default:
      throw new Error('Invalid redirect arguments');
  }
}

function realRedirect(
  status: RedirectStatus,
  location: string | URL,
  message?: App.PageData['flash'],
  event?: RequestEvent | Cookies
) {
  if (!message) return redir(status, location.toString());
  if (!event) throw new Error('RequestEvent is required for redirecting with flash message');

  const cookies = 'cookies' in event ? event.cookies : event;

  cookies.set(cookieName, JSON.stringify(message), {
    ...flashCookieOptions,
    path: flashCookieOptions.path ?? '/'
  });
  return redir(status, location.toString());
}

////////////////////////////////////////////////////////

/**
 * Set the flash message without redirecting, for example when validation fails in a form action.
 * @param {App.PageData['flash']} message The flash message.
 * @param {RequestEvent} event The event for the form action or load function.
 */
export function setFlash(message: App.PageData['flash'], event: RequestEvent | Cookies) {
  const cookies = 'cookies' in event ? event.cookies : event;
  cookies.set(cookieName, JSON.stringify(message), {
    ...flashCookieOptions,
    path: flashCookieOptions.path ?? '/'
  });
}
