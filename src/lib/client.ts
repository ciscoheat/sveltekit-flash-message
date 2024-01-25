import { type Writable, type Readable, get, writable } from 'svelte/store';
import type { Page } from '@sveltejs/kit';
import { tick } from 'svelte';
import { BROWSER as browser } from 'esm-env';
import { serialize, type CookieSerializeOptions } from './cookie-es-main/index.js';
import { navigating } from '$app/stores';
import { FlashMessage, type FlashMessageType } from './flashMessage.js';
import { FlashRouter } from './router.js';
import type { FlashOptions } from './options.js';

const cookieName = 'flash';

const routers = new WeakMap<Readable<Page>, FlashRouter>();

function getRouter(page: Readable<Page>, initialData?: FlashMessageType) {
  let router = routers.get(page);
  if (!router) {
    router = new FlashRouter();
    routers.set(page, router);
    subscribeToNavigation(page);
    router.getFlashMessage(get(page).route.id).message.set(initialData);
  }

  /*
  else if (routeId && initialData !== undefined) {
    const flashMessage = router.getFlashMessage(routeId);
    flashMessage.message.set(
      initialData ?? parseFlashCookie(flashMessage.options.flashCookieOptions),
      { concatenateArray: !flashMessage.options.clearArray }
    );
  }
  */

  /*
  Array.from(router.routes.entries())
    .map(([route, flash]) => {
      return { route, message: get(flash.message) };
    })
    .forEach((m) => console.log(m));
  */

  return router;
}

function subscribeToNavigation(page: Readable<Page>) {
  if (!browser) return;

  page.subscribe(($page) => {
    const flash = getRouter(page).getFlashMessage($page.route.id);
    const cookieData = parseFlashCookie(flash.options.flashCookieOptions);

    if (cookieData !== undefined) {
      flash.message.set(cookieData, { concatenateArray: !flash.options.clearArray });
    }
  });

  navigating.subscribe((nav) => {
    if (!nav) {
      const flash = getRouter(page).getFlashMessage(get(page).route.id);
      const cookieData = parseFlashCookie(flash.options.flashCookieOptions);

      if (cookieData !== undefined) {
        flash.message.set(cookieData, { concatenateArray: !flash.options.clearArray });
      }
      return;
    } else {
      const navTo = nav?.to?.route.id;
      if (navTo) {
        const flash = getRouter(page).getFlashMessage(navTo);

        if (flash.options.clearOnNavigate && nav.from?.route.id != navTo) {
          flash.message.set(undefined);
        }
      }
    }
  });
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
    return new FlashMessage(writable(get(page).data.flash));
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
    return Router.createRoute(Page_route(), Page_initialData(), options);
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

  const cookieData = parseFlashCookie(flashMessage.options.flashCookieOptions) as
    | App.PageData['flash']
    | undefined;

  if (cookieData !== undefined) {
    flashMessage.message.set(cookieData, { concatenateArray: !flashMessage.options.clearArray });
  }

  return !!cookieData;
}

///////////////////////////////////////////////////////////

function parseFlashCookie(
  clearOptions?: CookieSerializeOptions
): App.PageData['flash'] | undefined {
  const cookieString = document.cookie;
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

  function clearFlashCookie(options: CookieSerializeOptions) {
    // Clear parsed cookie
    if (browser) {
      document.cookie = serialize(cookieName, '', {
        ...options,
        maxAge: 0
      });
    }
  }

  const cookies = parseCookieString(cookieString);
  if (clearOptions) clearFlashCookie(clearOptions);

  if (cookies[cookieName]) {
    try {
      return JSON.parse(cookies[cookieName]);
    } catch (e) {
      // Ignore value if parsing failed
    }
  }
  return undefined;
}
