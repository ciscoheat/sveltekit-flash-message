export const FLASH_COOKIE_NAME = "flash";

type Flash = App.PageData["flash"];

export const serializeFlash = (flash: Flash) =>
  flash === undefined ? undefined : JSON.stringify(flash);

export const parseFlash = (value: string | undefined): Flash | undefined => {
  if (value === undefined) return undefined;
  try {
    return JSON.parse(value) as Flash;
  } catch {
    try {
      return JSON.parse(decodeURIComponent(value)) as Flash;
    } catch {
      return undefined;
    }
  }
};
