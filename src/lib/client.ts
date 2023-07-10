import { type Writable, type Readable, writable, get } from 'svelte/store';
import type { Page } from '@sveltejs/kit';
import { onDestroy, tick } from 'svelte';
import { BROWSER as browser } from 'esm-env';
import { afterNavigate } from '$app/navigation';

export type FlashOptions = Partial<{
  clearArray: boolean;
  clearOnNavigate: boolean;
}>;

type FlashContext = {
  store: Writable<App.PageData['flash']>;
  options: FlashOptions;
};

const flashStores = new WeakMap<Readable<Page>, FlashContext>();

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
  if (flashStores.has(page)) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return flashStores.get(page)!.store;
  }

  options = {
    clearArray: false,
    clearOnNavigate: true,
    ...options
  };

  const store = writable<App.PageData['flash']>();
  const context = { store, options };

  flashStores.set(page, context);
  clearCookieAndUpdateIfNewData(context, get(page).data.flash);

  let lastUpdate: 'page' | null = null;

  const unsubscribeFromPage = page.subscribe(async ($page) => {
    //console.log('🚀 ~ page.subscribe: ', $page.data.flash?.[0].text, lastUpdate);
    if (!browser && $page.data.flash !== undefined) {
      updateFlash(page);
    } else if (browser) {
      // Wait for eventual navigation event
      await tick();
      setTimeout(async () => {
        if (await updateFlash(page)) {
          lastUpdate = 'page';
        } else {
          lastUpdate = null;
        }
      });
    }
  });

  onDestroy(() => {
    unsubscribeFromPage();
    flashStores.delete(page);
  });

  afterNavigate(async (nav) => {
    if (['form', 'goto'].includes(nav.type as string)) {
      if (lastUpdate != 'page') {
        updateFlash(page);
      } else {
        const context = flashStores.get(page);

        if (
          context?.options.clearOnNavigate &&
          nav.from?.url.toString() != nav.to?.url.toString()
        ) {
          context?.store.set(undefined);
        }
      }
    }
  });

  return store;
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
  const context = flashStores.get(page);
  if (!context) return _initFlash(page, options);
  if (options)
    throw new Error(
      'getFlash options can only be set during the first call to getFlash. Set the options at the highest level component that calls getFlash.'
    );
  return context.store;
}

/**
 * Updates the flash message after a fetch request.
 * @param page Page store, imported from `$app/stores`.
 * @param {Promise<void>} update A callback which is executed *before* the message is set, to delay the message until navigation events are completed, for example when using `goto`.
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
  await tick();

  const flashMessage = parseFlashCookie() as App.PageData['flash'] | undefined;
  clearCookieAndUpdateIfNewData(store, flashMessage);

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

const path = '/';
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

function clearCookieAndUpdateIfNewData(
  context: FlashContext,
  newData: App.PageData['flash'] | undefined
) {
  if (browser) {
    document.cookie = varName + `=; Max-Age=0; Path=${path};`;
  }
  if (newData === undefined) return;

  context.store.update((flash) => {
    //console.log("🚀 ~ file: client.ts:120 ~ updateStore ~ newData:", newData)

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
