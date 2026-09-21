import { expect, test, type Page } from "@playwright/test";

async function expectNoFlash(page: Page) {
  await expect(page.locator("#flash-message")).toHaveCount(0);
}

test.afterEach(async ({ page }) => {
  await page.reload();
  await expectNoFlash(page);
});

test.describe("server-side forms without JavaScript", () => {
  test("redirects with the remote form", async ({ page }) => {
    await page.goto("/");

    const form = page.locator("form:has(#set-flash-name)");
    await form.locator("#set-flash-name").fill("No JS redirect test");
    await form.getByRole("checkbox").check();
    await form.getByRole("button", { name: "Submit" }).click();

    await expect(page).toHaveURL(/\/\?\/remote=/);
    await expect(page.locator("#flash-message")).toHaveText(
      /No JS redirect test \(redirect\) posted at/,
    );
  });

  test("redirects with the remote redirect form", async ({ page }) => {
    await page.goto("/");

    const form = page.locator("form:has(#redirect-name)");
    await form.locator("#redirect-name").fill("No JS posted test");
    await form.getByRole("button", { name: "Submit" }).click();

    await expect(page).toHaveURL(/\/posted$/);
    await expect(page.locator("#flash-message")).toHaveText(
      /No JS posted test posted at/,
    );
  });

  test("sets a flash message with a standard enhanced form action", async ({
    page,
  }) => {
    await page.goto("/");

    const form = page.locator("form:has(#action-name)");
    await form.locator("#action-name").fill("Set action form test");
    await form.getByRole("button", { name: "Submit" }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator("#flash-message")).toHaveText(
      /Set action form test \(action\) \[No JS\] posted at/,
    );
  });
});
