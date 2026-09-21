import type { ServerLoad, ServerLoadEvent } from "@sveltejs/kit";
import { parseFlash, FLASH_COOKIE_NAME } from "../flash.shared.ts";

type LoadResult = Record<string, any> | void;

const flashEventKey = Symbol("flash");

type FlashLocals = App.Locals & {
  [flashEventKey]?: App.PageData["flash"];
};

export const loadFlash = <L extends ServerLoad<any, any, LoadResult>>(
  load: L,
) => {
  return async (event: ServerLoadEvent): Promise<Awaited<ReturnType<L>>> => {
    const locals = event.locals as FlashLocals;
    let flash = locals[flashEventKey];

    if (flash === undefined) {
      const cookie = event.cookies.get(FLASH_COOKIE_NAME);
      flash = parseFlash(cookie);
      locals[flashEventKey] = flash;

      if (cookie !== undefined) {
        event.cookies.delete(FLASH_COOKIE_NAME, { path: "/" });
      }
    }

    const data = await load(event);
    return { ...(data ?? {}), flash } as Awaited<ReturnType<L>>;
  };
};
