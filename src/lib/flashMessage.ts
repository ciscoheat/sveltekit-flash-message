import { writable, type Updater, type Writable } from 'svelte/store';
import type { CookieSerializeOptions } from './cookie-es-main/index.js';
import { onDestroy } from 'svelte';
import { browser } from '$app/environment';

export type FlashMessageType =
  | (App.PageData['flash'] extends never ? any : App.PageData['flash'])
  | undefined;

export type FlashOptions = {
  clearArray: boolean;
  clearOnNavigate: boolean;
  clearAfterMs: number;
  flashCookieOptions: CookieSerializeOptions;
};

const defaultOptions = {
  clearArray: false,
  clearOnNavigate: true,
  clearAfterMs: 0,
  flashCookieOptions: {
    path: '/',
    maxAge: 120,
    httpOnly: false,
    sameSite: 'strict' as const
  }
} satisfies FlashOptions;

function mergeOptions(options: Partial<FlashOptions> | undefined): FlashOptions {
  return {
    ...defaultOptions,
    ...options,
    flashCookieOptions: {
      ...defaultOptions.flashCookieOptions,
      ...options?.flashCookieOptions
    }
  };
}

interface FlashMessageStore extends Writable<FlashMessageType> {
  set(this: void, value: FlashMessageType, options?: { concatenateArray: boolean }): void;
  update(
    this: void,
    updater: Updater<FlashMessageType>,
    options?: { concatenateArray: boolean }
  ): void;
}

export class FlashMessage {
  public readonly options: Readonly<FlashOptions>;

  // Move update method to store
  private _message: FlashMessageStore;
  public get message() {
    return this._message;
  }

  private _flashTimeout: ReturnType<typeof setTimeout> = 0;
  public get flashTimeout() {
    return this._flashTimeout;
  }

  constructor(initialData: FlashMessageType, options?: Partial<FlashOptions>) {
    const messageStore = writable<FlashMessageType | undefined>(initialData);

    this.options = options ? mergeOptions(options) : defaultOptions;

    this._message = {
      subscribe: messageStore.subscribe,
      set: (value, options?: { concatenateArray: boolean }) =>
        messageStore.update(($message) => this.update($message, value, options?.concatenateArray)),
      update: (updater, options?: { concatenateArray: boolean }) =>
        messageStore.update(($message) =>
          this.update($message, updater($message), options?.concatenateArray)
        )
    };

    onDestroy(() => clearTimeout(this._flashTimeout));
    this.autoClearMessage(initialData);
  }

  private autoClearMessage(newData: FlashMessageType) {
    if (!browser) return;
    if (this._flashTimeout) clearTimeout(this.flashTimeout);

    if (newData !== undefined && this.options.clearAfterMs) {
      this._flashTimeout = setTimeout(() => this.message.set(undefined), this.options.clearAfterMs);
    }
  }

  private update(current: FlashMessageType, newData: FlashMessageType, concatenateArray = false) {
    // Need to do a per-element comparison here, since update will be called
    // when going to the same route, while keeping the old flash message,
    // making it display multiple times.
    if (concatenateArray && Array.isArray(newData)) {
      if (Array.isArray(current)) {
        if (
          current.length > 0 &&
          newData.length > 0 &&
          current[current.length - 1] === newData[newData.length - 1]
        ) {
          return current;
        } else {
          return current.concat(newData) as unknown as App.PageData['flash'];
        }
      }
    }

    this.autoClearMessage(newData);
    return newData;
  }
}
