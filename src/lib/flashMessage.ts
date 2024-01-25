import type { Updater, Writable } from 'svelte/store';
import { browser } from '$app/environment';
import { defaultOptions, type FlashOptions } from './options.js';

export type FlashMessageType =
  | (App.PageData['flash'] extends never ? any : App.PageData['flash'])
  | undefined;

interface FlashMessageStore extends Writable<FlashMessageType> {
  set(this: void, value: FlashMessageType, options?: { concatenateArray: boolean }): void;
  update(
    this: void,
    updater: Updater<FlashMessageType>,
    options?: { concatenateArray: boolean }
  ): void;
}

export class FlashMessage {
  public options: Readonly<FlashOptions>;

  private _message: FlashMessageStore;
  public get message() {
    return this._message;
  }

  private _flashTimeout: ReturnType<typeof setTimeout> = 0;
  public get flashTimeout() {
    return this._flashTimeout;
  }

  constructor(message: Writable<FlashMessageType>, options?: FlashOptions) {
    this.options = options ?? defaultOptions;

    this._message = {
      subscribe: message.subscribe,
      set: (value, options?: { concatenateArray: boolean }) =>
        message.update(($message) =>
          this.update($message, value, options?.concatenateArray ?? false)
        ),
      update: (updater, options?: { concatenateArray: boolean }) =>
        message.update(($message) =>
          this.update($message, updater($message), options?.concatenateArray ?? false)
        )
    };
  }

  private update(current: FlashMessageType, newData: FlashMessageType, concatenateArray = false) {
    if (this._flashTimeout) clearTimeout(this.flashTimeout);

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
          return current.concat(newData);
        }
      }
    }

    if (browser && newData !== undefined && this.options.clearAfterMs) {
      this._flashTimeout = setTimeout(() => {
        this.message.set(undefined);
      }, this.options.clearAfterMs);
    }

    return newData;
  }
}
