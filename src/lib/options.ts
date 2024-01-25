import type { CookieSerializeOptions } from './cookie-es-main/types.js';

export type FlashOptions = {
  clearArray: boolean;
  clearOnNavigate: boolean;
  clearAfterMs: number;
  flashCookieOptions: CookieSerializeOptions;
};

export const defaultOptions = {
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

export function mergeOptions(options: Partial<FlashOptions> | undefined): FlashOptions {
  return {
    ...defaultOptions,
    ...options,
    flashCookieOptions: {
      ...defaultOptions.flashCookieOptions,
      ...options?.flashCookieOptions
    }
  };
}
