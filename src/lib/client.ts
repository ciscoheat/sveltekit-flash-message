import { type Writable, type Readable, get } from 'svelte/store';
import type { Page } from '@sveltejs/kit';
import { tick } from 'svelte';
import { BROWSER as browser } from 'esm-env';
import { serialize, type CookieSerializeOptions } from './cookie-es-main/index.js';
import { navigating } from '$app/stores';
import { FlashMessage, type FlashMessageType, type FlashOptions } from './flashMessage.js';
import { Router } from './router.js';

const d = console.log;
const cookieName = 'flash';

const routers = new WeakMap<Readable<Page>, Router>();

function getRouter(page: Readable<Page>, initialData?: FlashMessageType) {
  let router = routers.get(page);
  if (!router) {
    router = new Router(initialData);
    routers.set(page, router);
  }
  return router;
}

export function initFlash(
  page: Readable<Page>,
  options?: Partial<FlashOptions>
): Writable<App.PageData['flash']> {
  return _initFlash(page, options).message;
}

// @DCI-context
function _initFlash(page: Readable<Page>, options?: Partial<FlashOptions>): FlashMessage {
  if (!browser) {
    // The SSR version uses a simple store with no options,
    // since they are used only on the client.
    return new FlashMessage(get(page).data.flash);
  }

  const _page = get(page);

  ///// Roles //////////////////////////////////////////////////////////////////

  //#region Router /////

  const Router = getRouter(page, _page.data.flash);

  function Router_getFlashMessage() {
    const route = Router.routes.get(Page_route());
    if (route) return route;

    return options ? Router_createRoute() : Router.getClosestRoute(Page_route());
  }

  function Router_createRoute() {
    const flashMessage = Router.createRoute(Page_route(), Page_initialData(), options);
    Page_subscribeToNavigation(flashMessage);
    return flashMessage;
  }

  //#endregion

  //#region Page

  const Page = {
    store: page,
    route: _page.route.id,
    initialdata: _page.data.flash,
    navigating
  };

  function Page_initialData() {
    return Page.initialdata;
  }

  function Page_route() {
    return Page.route ?? '';
  }

  function Page_subscribeToNavigation(flash: FlashMessage) {
    if (!browser) return;

    Page.store.subscribe(() => {
      const cookieData = parseFlashCookie();
      d('Page update, cookie: ', cookieData);

      if (cookieData !== undefined) {
        flash.message.set(cookieData, { concatenateArray: !flash.options.clearArray });
        clearFlashCookie(flash.options.flashCookieOptions);
      }
    });

    Page.navigating.subscribe((nav) => {
      d('Navigating:', nav?.from?.route.id, nav?.to?.route.id);

      if (!nav) {
        const cookieData = parseFlashCookie();
        console.log('Nav ends, cookie:', cookieData);

        if (cookieData !== undefined) {
          flash.message.set(cookieData, { concatenateArray: !flash.options.clearArray });
          clearFlashCookie(flash.options.flashCookieOptions);
        }
      } else if (nav && flash.options.clearOnNavigate && nav.from?.route.id != nav.to?.route.id) {
        console.log('Nav starts, clearing message');
        flash.message.set(undefined);
      }
    });
  }

  //#endregion

  return Router_getFlashMessage();
}

/**
 * Retrieves the flash message store for display or modification.
 * @param page Page store, imported from `$app/stores`.
 * @param {FlashOptions} options for the flash message. Can only be set once, usually at the highest level component where getFlash is called for the first time.
 * @returns The flash message store.
 */
export function getFlash(
  page: Readable<Page>,
  options?: Partial<FlashOptions>
): Writable<App.PageData['flash']> {
  return _initFlash(page, options).message;
}

/**
 * Update the flash message manually, usually after a fetch request.
 * @param page Page store, imported from `$app/stores`.
 * @param {Promise<void>} update A callback which is executed *before* the message is updated, to delay the message until navigation events are completed, for example when using `goto`.
 * @returns {Promise<boolean>} `true` if a flash message existed, `false` if not.
 */
export async function updateFlash(page: Readable<Page>, update?: () => Promise<void>) {
  const flashMessage = getRouter(page).getFlashMessage(get(page).route.id);

  // Update before setting the new message, so navigation events can pass through first.
  if (update) await update();
  if (browser) await tick();

  const cookieData = parseFlashCookie() as App.PageData['flash'] | undefined;

  if (cookieData !== undefined) {
    console.log('updateFlash parsed cookie', cookieData, '(deleting on client)');
    flashMessage.message.set(cookieData, { concatenateArray: !flashMessage.options.clearArray });
  }

  clearFlashCookie(flashMessage.options.flashCookieOptions);

  return !!cookieData;
}

///////////////////////////////////////////////////////////

function clearFlashCookie(options: CookieSerializeOptions) {
  // Clear parsed cookie
  if (browser) {
    document.cookie = serialize(cookieName, '', {
      ...options,
      maxAge: 0
    });
  }
}

function parseFlashCookie(cookieString?: string): App.PageData['flash'] | undefined {
  if (!cookieString && browser) cookieString = document.cookie;
  if (!cookieString || !cookieString.includes(cookieName + '=')) return undefined;

  function parseCookieString(str: string) {
    const output = {} as Record<string, string>;
    if (!str) return output;

    return str
      .split(';')
      .map((v) => v.split('='))
      .reduce((acc, v) => {
        acc[decodeURIComponent(v[0].trim())] = decodeURIComponent(v[1].trim());
        return acc;
      }, output);
  }

  const cookies = parseCookieString(cookieString);
  if (cookies[cookieName]) {
    try {
      return JSON.parse(cookies[cookieName]);
    } catch (e) {
      // Ignore value if parsing failed
    }
  }
  return undefined;
}
