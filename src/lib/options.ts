import type { SerializeOptions } from 'cookie';

export type FlashOptions = {
  clearArray: boolean;
  clearOnNavigate: boolean;
  clearAfterMs: number;
  flashCookieOptions: SerializeOptions;
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

export function mergeOptions(
  parentOptions: FlashOptions,
  options: Partial<FlashOptions> | undefined
): FlashOptions {
  return {
    ...parentOptions,
    ...options,
    flashCookieOptions: {
      ...parentOptions.flashCookieOptions,
      ...options?.flashCookieOptions
    }
  };
}
