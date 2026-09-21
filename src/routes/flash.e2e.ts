import { expect, test, type Page } from "@playwright/test";

const flashMessage = (page: Page) => page.locator("#flash-message");

const formFor = (page: Page, inputId: string) =>
  page.locator(`form:has(#${inputId})`);

async function expectFlash(page: Page, message: RegExp | string) {
  await expect(flashMessage(page)).toHaveText(message);
}

async function expectNoFlash(page: Page) {
  await expect(flashMessage(page)).toHaveCount(0);
}

async function submitForm(
  page: Page,
  inputId: string,
  name: string,
  shouldRedirect = false,
) {
  const form = formFor(page, inputId);
  await form.locator(`#${inputId}`).fill(name);

  if (shouldRedirect) {
    const checkbox = form.getByRole("checkbox");
    await checkbox.check();
    await expect(checkbox).toBeChecked();
  }

  await form.getByRole("button", { name: "Submit" }).click();
}

async function expectRequiredNameIssue(page: Page, inputId: string) {
  const form = formFor(page, inputId);
  await form.locator(`#${inputId}`).fill(" ");
  await form.getByRole("button", { name: "Submit" }).click();

  const issue = form.locator("p.text-red-500");
  await expect(issue).toHaveCount(1);
  await expect(issue).not.toBeEmpty();
}

test.afterEach(async ({ page }) => {
  await page.reload();
  await expectNoFlash(page);
});

test.describe("server-side actions", () => {
  test("sets a flash message with the remote command", async ({ page }) => {
    await page.goto("/");

    await page
      .locator("#server-side")
      .getByRole("button", { name: "Set flash message" })
      .click();

    await expect(page).toHaveURL(/\/$/);
    await expectFlash(page, /Remote flash command set at/);
  });

  test("sets a flash message with the remote form", async ({ page }) => {
    await page.goto("/");

    await submitForm(page, "set-flash-name", "Set form test");

    await expect(page).toHaveURL(/\/$/);
    await expectFlash(page, /Set form test \(setFlash\) posted at/);
  });

  test("sets a flash message with a standard enhanced form action", async ({
    page,
  }) => {
    await page.goto("/");

    const form = page.locator("form:has(#action-name)");
    await form.locator("#action-name").fill("Set action form test");
    await form.getByRole("button", { name: "Submit" }).click();

    await expect(page).toHaveURL(/\/$/);
    await expectFlash(page, /Set action form test \(action\) \[JS\] posted at/);
  });

  test("clears a server-side flash message after a full page refresh", async ({
    page,
  }) => {
    await page.goto("/");

    await submitForm(page, "set-flash-name", "Refresh test");
    await expectFlash(page, /Refresh test \(setFlash\) posted at/);

    //await page.reload();
    //await expectNoFlash(page);
  });

  test("keeps the remote form open for empty or whitespace names", async ({
    page,
  }) => {
    await page.goto("/");

    await expectRequiredNameIssue(page, "set-flash-name");
    await expect(page).toHaveURL(/\/$/);
    await expectNoFlash(page);
  });

  test("redirects the remote form back to the home route when requested", async ({
    page,
  }) => {
    await page.goto("/");

    await submitForm(page, "set-flash-name", "Redirect form test", true);

    await expect(page).toHaveURL(/\/$/);
    await expectFlash(page, /Redirect form test \(redirect\) posted at/);
  });

  test("validates before redirecting with the remote redirect form", async ({
    page,
  }) => {
    await page.goto("/");

    await expectRequiredNameIssue(page, "redirect-name");
    await expect(page).toHaveURL(/\/$/);
    await expectNoFlash(page);

    await submitForm(page, "redirect-name", "Redirect test");

    await expect(page).toHaveURL(/\/posted$/);
    await expectFlash(page, /Redirect test posted at/);
  });

  test("redirects the enhanced remote form using goto", async ({ page }) => {
    await page.goto("/");
    await expectNoFlash(page);

    const form = page.locator("#redirect-form");

    await form.locator("#redirect-name").fill("Test");
    await form.locator('input[type="checkbox"]').check();
    await form.getByRole("button", { name: "Submit" }).click();

    await expect(page).toHaveURL(/\/posted$/);
    await expectFlash(page, /^Test: Redirect with goto$/);
  });
});

test.describe("client-side actions", () => {
  test("sets a client-side flash message", async ({ page }) => {
    await page.goto("/");

    await page
      .locator("#client-side")
      .getByRole("button", { name: "Set flash message" })
      .click();

    await expectFlash(page, /Client-side flash set at/);
  });

  test("clears an existing flash message", async ({ page }) => {
    await page.goto("/");

    const clientSide = page.locator("#client-side");
    await clientSide.getByRole("button", { name: "Set flash message" }).click();
    await expectFlash(page, /Client-side flash set at/);

    await clientSide
      .getByRole("button", { name: "Clear flash message" })
      .click();
    await expectNoFlash(page);
  });

  test("replaces a client-side message with a server-side message", async ({
    page,
  }) => {
    await page.goto("/");

    await page
      .locator("#client-side")
      .getByRole("button", { name: "Set flash message" })
      .click();
    await expectFlash(page, /Client-side flash set at/);

    await page
      .locator("#server-side")
      .getByRole("button", { name: "Set flash message" })
      .click();
    await expectFlash(page, /Remote flash command set at/);
  });

  test("clears a server-side flash message from the client", async ({
    page,
  }) => {
    await page.goto("/");

    await page
      .locator("#server-side")
      .getByRole("button", { name: "Set flash message" })
      .click();
    await expectFlash(page, /Remote flash command set at/);

    await page
      .locator("#client-side")
      .getByRole("button", { name: "Clear flash message" })
      .click();
    await expectNoFlash(page);
  });
});

test.describe("client-side options", () => {
  test("clears a flash message after the configured delay", async ({
    page,
  }) => {
    await page.goto("/");

    await page
      .locator("#client-side")
      .getByRole("button", { name: "Set flash message" })
      .click();
    await expectFlash(page, /Client-side flash set at/);

    await expectNoFlash(page);
  });

  test("resets the delay when a flash message is replaced", async ({
    page,
  }) => {
    await page.goto("/");

    const setFlashButton = page
      .locator("#client-side")
      .getByRole("button", { name: "Set flash message" });

    await setFlashButton.click();
    await expectFlash(page, /Client-side flash set at/);
    await page.waitForTimeout(2500);

    await setFlashButton.click();
    await expectFlash(page, /Client-side flash set at/);
    await page.waitForTimeout(2000);
    await expectFlash(page, /Client-side flash set at/);

    await expectNoFlash(page);
  });
});

test.describe("navigation card", () => {
  test("clears a flash message when navigating", async ({ page }) => {
    await page.goto("/");

    await page
      .locator("#client-side")
      .getByRole("button", { name: "Set flash message" })
      .click();

    await expectFlash(page, /Client-side flash set at/);

    await page
      .getByRole("link", { name: "Reload this page with navigation" })
      .click();
    await expect(page).toHaveURL(/\/$/);
    await expectNoFlash(page);
  });
});

test("clears a flash message when navigating", async ({ page }) => {
  await page.goto("/");

  await page
    .locator("#client-side")
    .getByRole("button", { name: "Set flash message" })
    .click();

  const flash = page.getByText(/Client-side flash set at/);
  await expect(flash).toBeVisible();

  await page
    .getByRole("link", { name: "Reload this page with navigation" })
    .click();
  await expect(page).toHaveURL(/\/$/);
  await expect(flash).toHaveCount(0);
});

test("redirects the remote form to the posted page", async ({ page }) => {
  await page.goto("/");

  const form = page.locator("form:has(#redirect-name)");
  await form.locator("#redirect-name").fill("Redirect test");
  await form.getByRole("button", { name: "Submit" }).click();

  await expect(page).toHaveURL(/\/posted$/);
  await expect(
    page.getByRole("heading", { name: "Posted Page" }),
  ).toBeVisible();
  const flash = page.getByText(/Redirect test posted at/);
  await expect(flash).toBeVisible();

  await page.getByRole("link", { name: "Back to start" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(flash).toHaveCount(0);
});
