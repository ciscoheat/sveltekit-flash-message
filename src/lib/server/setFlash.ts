import { getRequestEvent } from "$app/server";
import { FLASH_COOKIE_NAME } from "../flash.shared.ts";
import { serializeFlash } from "../flash.shared.ts";

export const setFlash = (flash: App.PageData["flash"]) => {
  const event = getRequestEvent();
  const value = serializeFlash(flash);

  if (value === undefined) {
    event.cookies.delete(FLASH_COOKIE_NAME, { path: "/" });
    return;
  }

  event.cookies.set(FLASH_COOKIE_NAME, value, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
  });
};
