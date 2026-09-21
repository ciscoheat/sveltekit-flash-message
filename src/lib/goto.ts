import { goto as svelteKitGoto } from "$app/navigation";
import type { GotoOptions as SvelteKitGotoOptions } from "$app/navigation";
import { serializeFlash } from "./flash.shared.ts";

export type GotoOptions = SvelteKitGotoOptions & {
  flash?: App.PageData["flash"];
};

export const goto = async (url: string | URL, options?: GotoOptions) => {
  const { flash, ...svelteKitOptions } = options ?? {};
  await svelteKitGoto(url, svelteKitOptions as SvelteKitGotoOptions);

  const value = serializeFlash(flash);
  document.cookie =
    value === undefined
      ? "flash=; Max-Age=0; Path=/"
      : `flash=${encodeURIComponent(value)}; Path=/; SameSite=Lax`;
};
