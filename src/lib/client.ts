import { type Writable, type Readable, writable, get } from 'svelte/store';
import type { Page } from '@sveltejs/kit';
import { onDestroy, tick } from 'svelte';
import { BROWSER as browser } from 'esm-env';
import { afterNavigate } from '$app/navigation';
import { serialize, type CookieSerializeOptions } from './cookie-es-main/index.js';
import { navigating } from '$app/stores';

const d = console.log;

export type FlashOptions = Partial<{
  clearArray: boolean;
  clearOnNavigate: boolean;
  clearAfterMs: number;
  flashCookieOptions: CookieSerializeOptions;
}>;

type FlashContext = {
  store: Writable<App.PageData['flash']>;
  options: FlashOptions;
  optionHash: string;
};

const flashStores = new WeakMap<Readable<Page>, FlashContext>();

const defaultOptions = {
  clearOnNavigate: true,
  flashCookieOptions: {
    path: '/',
    maxAge: 120,
    httpOnly: false,
    sameSite: 'strict' as const
  }
};

/**
 * @deprecated Use getFlash instead.
 */
export function initFlash(
  page: Readable<Page>,
  options?: FlashOptions
): Writable<App.PageData['flash']> {
  return _initFlash(page, options);
}

function _initFlash(page: Readable<Page>, options?: FlashOptions): Writable<App.PageData['flash']> {
  const flashStore = flashStores.get(page);
  if (flashStore && !options) return flashStore.store;

  const currentOptions: FlashOptions = options
    ? {
        ...defaultOptions,
        ...options,
        flashCookieOptions: {
          ...defaultOptions.flashCookieOptions,
          ...options?.flashCookieOptions
        }
      }
    : defaultOptions;

  if (flashStore && options && serializeOptions(currentOptions) !== flashStore.optionHash) {
    throw new Error('getFlash options can only be set once, at a top-level component.');
  }

  d('=== initFlash ===');

  const store = writable<App.PageData['flash']>();
  const context = { store, options: currentOptions, optionHash: serializeOptions(currentOptions) };

  flashStores.set(page, context);

  //let nagivated = false;

  updateFromCookie(context, get(page).data.flash);

  const unsubscribeNavigating = navigating.subscribe((nav) => {
    d('Navigating:', nav?.from?.route.id, nav?.to?.route.id);

    if (!nav) {
      //clearCookieAndUpdateIfNewData(context, get(page).data.flash);
      //updateFlash(page);
    } else if (nav && currentOptions.clearOnNavigate && nav.from?.route.id != nav.to?.route.id) {
      store.set(undefined);
    }
  });

  const unsubscribeFromPage = page.subscribe(async ($page) => {
    d('Page update, flash:', $page.data.flash?.[0]);
    updateFlash(page);
    /*
    if (browser) {
      // Wait for eventual navigation event
      setTimeout(() => updateFlash(page));
    }
    */
  });

  let unsubscribeClearFlash: () => void | undefined;
  let flashTimeout: ReturnType<typeof setTimeout> | undefined = undefined;

  if (currentOptions.clearAfterMs && browser) {
    unsubscribeClearFlash = store.subscribe(($flash) => {
      if ($flash) {
        if (flashTimeout) clearTimeout(flashTimeout);
        flashTimeout = setTimeout(() => store.set(undefined), currentOptions.clearAfterMs);
      }
    });
  }

  onDestroy(() => {
    if (unsubscribeClearFlash) {
      if (flashTimeout) clearTimeout(flashTimeout);
      unsubscribeClearFlash();
    }
    //unsubscribeCheckNav();
    unsubscribeFromPage();
    unsubscribeNavigating();
    flashStores.delete(page);
  });

  /*
  afterNavigate(async (nav) => {
    const current = get(store);

    if (
      nav.type != 'enter' &&
      currentOptions.clearOnNavigate &&
      nav.from?.url?.toString() != nav.to?.url?.toString()
    ) {
      console.log('afterNavigate tried to clear flash message')      
      //store.set(undefined);
    }

    if (nav.type == 'goto') updateFlash(page);
  });
  */

  return store;
}

function serializeOptions(opts: FlashOptions) {
  return JSON.stringify(opts);
}

/**
 * Retrieves the flash message store for display or modification.
 * @param page Page store, imported from `$app/stores`.
 * @param {FlashOptions} options for the flash message. Can only be set once, usually at the highest level component where getFlash is called for the first time.
 * @returns The flash message store.
 */
export function getFlash(
  page: Readable<Page>,
  options?: FlashOptions
): Writable<App.PageData['flash']> {
  return _initFlash(page, options);
}

/**
 * Update the flash message manually, usually after a fetch request.
 * @param page Page store, imported from `$app/stores`.
 * @param {Promise<void>} update A callback which is executed *before* the message is updated, to delay the message until navigation events are completed, for example when using `goto`.
 * @returns {Promise<boolean>} `true` if a flash message existed, `false` if not.
 */
export async function updateFlash(page: Readable<Page>, update?: () => Promise<void>) {
  const store = flashStores.get(page);
  if (!store)
    throw new Error(
      'Flash store must be initialized with getFlash(page) before calling updateFlash.'
    );

  // Update before setting the new message, so navigation events can pass through first.
  if (update) await update();
  if (browser) await tick();

  const flashMessage = parseFlashCookie() as App.PageData['flash'] | undefined;
  d('🚀 ~ updateFlash ~ flashMessage:', flashMessage);
  updateFromCookie(store, flashMessage);

  return !!flashMessage;
}

///////////////////////////////////////////////////////////

const parseCookieString = (str: string) => {
  const output = {} as Record<string, string>;
  if (!str) return output;

  return str
    .split(';')
    .map((v) => v.split('='))
    .reduce((acc, v) => {
      acc[decodeURIComponent(v[0].trim())] = decodeURIComponent(v[1].trim());
      return acc;
    }, output);
};

/////////////////////////////////////////////////////////////////////

const varName = 'flash';

function parseFlashCookie(cookieString?: string): unknown {
  if (!cookieString && browser) cookieString = document.cookie;
  if (!cookieString || !cookieString.includes(varName + '=')) return undefined;

  const cookies = parseCookieString(cookieString);
  if (cookies[varName]) {
    try {
      return JSON.parse(cookies[varName]);
    } catch (e) {
      // Ignore value if parsing failed
    }
  }
  return undefined;
}

function updateFromCookie(context: FlashContext, newData: App.PageData['flash'] | undefined) {
  if (browser) {
    document.cookie = serialize(varName, '', { ...context.options.flashCookieOptions, maxAge: 0 });
  }
  if (newData === undefined) return;

  context.store.update((flash) => {
    // Need to do a per-element comparison here, since update will be called
    // when going to the same route, while keeping the old flash message,
    // making it display multiple times.
    if (!context.options.clearArray && Array.isArray(newData)) {
      if (Array.isArray(flash)) {
        if (
          flash.length > 0 &&
          newData.length > 0 &&
          flash[flash.length - 1] === newData[newData.length - 1]
        ) {
          return flash;
        } else {
          return flash.concat(newData) as unknown as App.PageData['flash'];
        }
      }
    }

    return newData;
  });
}
