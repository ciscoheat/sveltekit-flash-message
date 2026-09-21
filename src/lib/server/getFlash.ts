import { getRequestEvent } from "$app/server";
import { FLASH_COOKIE_NAME, parseFlash } from "../flash.shared.ts";

export const getFlash = (): App.PageData["flash"] | undefined => {
  const event = getRequestEvent();
  return parseFlash(event.cookies.get(FLASH_COOKIE_NAME));
};
