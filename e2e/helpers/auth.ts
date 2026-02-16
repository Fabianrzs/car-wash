import { type Page, type Cookie } from "@playwright/test";

interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Login via the UI form at /login.
 * Waits for the full redirect chain (including session relay) to complete.
 * Returns all cookies from the browser context after login completes.
 */
export async function loginAs(
  page: Page,
  { email, password }: LoginCredentials
): Promise<Cookie[]> {
  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Iniciar Sesión" }).click();

  // Wait for navigation away from /login (relay redirects may take a moment)
  await page.waitForURL((url) => !url.pathname.endsWith("/login"), {
    timeout: 20_000,
  });

  // Extra wait for relay chain to finish
  await page.waitForLoadState("domcontentloaded");

  return page.context().cookies();
}

/**
 * Login and wait for the full redirect chain (including session relay) to complete.
 * Returns cookies and final URL.
 */
export async function loginAndCapture(
  page: Page,
  { email, password }: LoginCredentials
): Promise<{ cookies: Cookie[]; url: string }> {
  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Iniciar Sesión" }).click();

  // Wait for the full redirect chain to complete (login → relay → subdomain)
  await page.waitForURL((url) => !url.pathname.endsWith("/login"), {
    timeout: 20_000,
  });
  await page.waitForLoadState("domcontentloaded");

  // Small additional wait for any final redirect
  await page.waitForTimeout(1500);

  return {
    cookies: await page.context().cookies(),
    url: page.url(),
  };
}
