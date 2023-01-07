import { type Writable, type Readable, writable } from 'svelte/store';
import type { Page } from '@sveltejs/kit';
import { onDestroy } from 'svelte';
import { BROWSER as browser } from 'esm-env';

let flashStore: Writable<App.PageData['flash']>;

const notInitialized =
  'Flash store must be initialized with initFlashStore(page) before calling getFlashStore.';

export function initFlashStore(
  page: Readable<Page>,
  defaultValue?: App.PageData['flash']
): Writable<App.PageData['flash']> {
  if (flashStore) return flashStore;
  flashStore = writable(defaultValue);

  const unsubscribe = page.subscribe((pageData) => {
    _updateFlashStore(pageData.data.flash);
  });

  onDestroy(unsubscribe);
  return flashStore;
}

export function getFlashStore() {
  if (!flashStore) throw new Error(notInitialized);
  return flashStore;
}

export function updateFlashStore() {
  if (!flashStore) throw new Error(notInitialized);
  _updateFlashStore(parseFlashCookie() as App.PageData['flash'] | undefined);
}

///////////////////////////////////////////////////////////

const parseCookie = (str: string) => {
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

  const cookies = parseCookie(cookieString);
  if (cookies[varName]) {
    try {
      return JSON.parse(cookies[varName]);
    } catch (e) {
      // Ignore value if parsing failed
    }
  }
  return undefined;
}

function _updateFlashStore(newData: App.PageData['flash'] | undefined) {
  _clearFlashCookie();

  flashStore.update((flash) => {
    if (newData === undefined) return flash;

    // Need to do a per-element comparison here, since update will be called
    // when going to the same route, while keeping the old flash message,
    // making it display multiple times.
    if (Array.isArray(flash)) {
      if (
        Array.isArray(newData) &&
        flash.length > 0 &&
        newData.length > 0 &&
        flash[flash.length - 1] === newData[newData.length - 1]
      ) {
        return flash;
      } else {
        return flash.concat(newData);
      }
    }

    return newData;
  });
}

function _clearFlashCookie() {
  //console.log('Clearing flash cookie', browser);
  if (browser) document.cookie = varName + `=; Max-Age=0; Path=${path};`;
}
