import { page } from '$app/state';
import { browser } from '$app/env';
import { afterNavigate, beforeNavigate } from '$app/navigation';
import { SvelteMap } from 'svelte/reactivity';
import { parseFlash, FLASH_COOKIE_NAME } from './flash.shared.js';

type FlashValue = App.PageData['flash'];

export type FlashOptions = {
  clearOnNavigate?: boolean;
  clearAfterMs?: number;
};

export type FlashContext = {
  value: FlashValue;
  options: Required<FlashOptions>;
};

type CookieStore = {
  get: (name: string) => Promise<{ value: string } | null>;
  delete: (name: string) => Promise<void>;
  addEventListener: (type: 'change', listener: () => void) => void;
  removeEventListener: (type: 'change', listener: () => void) => void;
};

type FlashState = {
  value: FlashValue;
  receivedCookieFlashDuringNavigation: boolean;
};

const cookiePolyfillIntervals = new SvelteMap<() => void, number>();

const cookieStorePolyfill: CookieStore = {
  get: async (name) => {
    const prefix = `${name}=`;
    const value = document.cookie
      .split(';')
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith(prefix))
      ?.slice(prefix.length);

    return value === undefined ? null : { value };
  },
  delete: async (name) => {
    document.cookie = `${name}=; Max-Age=0; Path=/`;
  },
  addEventListener: (_type, listener) => {
    cookiePolyfillIntervals.set(listener, window.setInterval(listener, 100));
  },
  removeEventListener: (_type, listener) => {
    const interval = cookiePolyfillIntervals.get(listener);
    if (interval === undefined) return;
    window.clearInterval(interval);
    cookiePolyfillIntervals.delete(listener);
  }
};

const serverCookieStore: CookieStore = {
  get: async () => null,
  delete: async () => {},
  addEventListener: () => {},
  removeEventListener: () => {}
};

const getCookieStore = (): CookieStore => {
  if (!browser) return serverCookieStore;

  const cookieStore = (window as Window & { cookieStore?: CookieStore }).cookieStore;
  return cookieStore ?? cookieStorePolyfill;
};

const bindCookieStore = (Cookie: CookieStore, Flash: FlashState) => {
  if (!browser) return;

  const globalState = globalThis as typeof globalThis & {
    __svelteKitFlashCookieListener?: () => void;
  };
  if (globalState.__svelteKitFlashCookieListener) return;

  const syncFlash = async () => {
    const cookie = await Cookie.get(FLASH_COOKIE_NAME);
    if (!cookie?.value) return;

    await Cookie.delete(FLASH_COOKIE_NAME);
    Flash.value = parseFlash(cookie.value);
    Flash.receivedCookieFlashDuringNavigation = true;
  };

  globalState.__svelteKitFlashCookieListener = syncFlash;
  Cookie.addEventListener('change', syncFlash);
  void syncFlash();
};

const getFlashState = (): FlashState => {
  if (!browser) {
    return {
      value: page.data.flash,
      receivedCookieFlashDuringNavigation: false
    };
  }

  const globalState = globalThis as typeof globalThis & {
    __svelteKitFlashState?: FlashState;
  };
  const existingFlash = globalState.__svelteKitFlashState;
  if (existingFlash) return existingFlash;

  const Flash = $state<FlashState>({
    value: undefined,
    receivedCookieFlashDuringNavigation: false
  });
  globalState.__svelteKitFlashState = Flash;
  bindCookieStore(getCookieStore(), Flash);
  return Flash;
};

/**
 * Maintains the page-wide flash value and the lifecycle policy for one caller.
 * @DCI-context
 */
export const getFlash = (options?: FlashOptions): FlashContext => {
  //#region Flash Role ////////////////////

  const Flash: FlashState = getFlashState();

  function Flash_read() {
    return Flash.value;
  }

  function Flash_write(value: FlashValue) {
    Flash.value = value;
  }

  //#endregion

  //#region Options Role ////////////////////

  const Options: {
    clearOnNavigate: boolean;
    clearAfterMs: number;
  } = $state({
    clearOnNavigate: options?.clearOnNavigate ?? true,
    clearAfterMs: options?.clearAfterMs ?? 0
  });

  function Options_scheduleClear(value: FlashValue) {
    if (!browser || value === undefined || Options.clearAfterMs <= 0) {
      Context_cancelClearTimer();
      return;
    }

    Context_cancelClearTimer();
    Context.clearTimer = window.setTimeout(() => {
      if (Flash_read() === value) Flash_write(undefined);
      Context.clearTimer = undefined;
    }, Options.clearAfterMs);
  }

  function Options_handleNavigation(type: string) {
    if (!Options.clearOnNavigate) return;
    if (type === 'form' || type === 'goto') return;
    if (Flash.receivedCookieFlashDuringNavigation) return;
    if (Page_flash() === undefined) Flash_write(undefined);
  }

  //#endregion

  //#region Page Role ////////////////////

  const Page: { data: { flash?: FlashValue } } = page;

  function Page_flash() {
    return Page.data.flash;
  }

  //#endregion

  //#region Navigation Role ////////////////////

  const Navigation: {
    before: typeof beforeNavigate;
    after: typeof afterNavigate;
  } = { before: beforeNavigate, after: afterNavigate };

  function Navigation_bindFlashLifecycle() {
    Navigation.before(() => {
      Flash.receivedCookieFlashDuringNavigation = false;
    });

    Navigation.after(({ type }) => {
      Options_handleNavigation(type);
    });
  }

  //#endregion

  //#region Context Role ////////////////////

  const Context: {
    clearTimer: number | undefined;
    lastPageFlash: FlashValue | undefined;
    flash: FlashContext;
  } = {
    clearTimer: undefined,
    lastPageFlash: Page_flash(),
    flash: Context__getFlash()
  };

  function Context_cancelClearTimer() {
    if (Context.clearTimer === undefined) return;
    window.clearTimeout(Context.clearTimer);
    Context.clearTimer = undefined;
  }

  function Context__getFlash() {
    const contextFlash = { options: Options };
    return new Proxy(contextFlash as FlashContext, {
      get(target, property, receiver) {
        if (property === 'value') return Flash_read();
        return Reflect.get(target, property, receiver);
      },
      set(target, property, value, receiver) {
        if (property === 'value') {
          Flash_write(value as FlashValue);
          return true;
        }
        return Reflect.set(target, property, value, receiver);
      }
    });
  }

  //#endregion

  // Each context owns its own clearAfterMs timer and must reschedule it when the value changes.
  $effect(() => {
    Options_scheduleClear(Context.flash.value);
  });

  if (browser) {
    // Navigation callbacks are registered per context because clearOnNavigate is per context.
    Navigation_bindFlashLifecycle();

    // Cancel this context's timer when its owner is destroyed.
    $effect(() => () => {
      Context_cancelClearTimer();
    });
  }

  if (Page_flash() !== undefined) {
    Flash_write(Page_flash());
  }

  // Apply new page data without mistaking client-side Flash updates for page-data changes.
  $effect(() => {
    const pageFlash = Page_flash();
    if (pageFlash === Context.lastPageFlash) return;

    Context.lastPageFlash = pageFlash;
    Flash_write(pageFlash);
  });

  return Context.flash;
};
