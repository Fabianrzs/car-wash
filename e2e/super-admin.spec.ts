import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";
import { SUPER_ADMIN } from "./helpers/constants";

test.describe("Super Admin E2E", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, SUPER_ADMIN);
  });

  test("3.1 — Login redirects to /admin", async ({ page }) => {
    expect(page.url()).toContain("/admin");
    await expect(
      page.getByRole("heading").first()
    ).toBeVisible();
  });

  test("3.2 — Tenant list loads", async ({ page }) => {
    await page.goto("/admin/tenants");
    await page.waitForLoadState("networkidle");

    // Table should have at least one row (seed has 8 tenants)
    const rows = page.locator("table tbody tr, [data-testid='tenant-row']");
    const rowCount = await rows.count();
    console.log(`Tenant rows found: ${rowCount}`);

    // If no table, look for cards or list items
    if (rowCount === 0) {
      const cards = page.locator("[class*='card'], [class*='Card']");
      const cardCount = await cards.count();
      console.log(`Tenant cards found: ${cardCount}`);
      expect(cardCount).toBeGreaterThan(0);
    } else {
      expect(rowCount).toBeGreaterThan(0);
    }
  });

  test("3.3 — Tenant detail page loads", async ({ page }) => {
    await page.goto("/admin/tenants");
    await page.waitForLoadState("networkidle");

    // Click the first tenant link
    const firstLink = page.locator("a[href*='/admin/tenants/']").first();
    await expect(firstLink).toBeVisible({ timeout: 10_000 });
    await firstLink.click();
    await page.waitForLoadState("networkidle");

    expect(page.url()).toMatch(/\/admin\/tenants\/.+/);

    // Should show some detail content
    const pageContent = await page.textContent("body");
    expect(pageContent).toBeTruthy();
    console.log(`Detail page URL: ${page.url()}`);
  });

  test("3.4 — Tenant detail has action buttons", async ({ page }) => {
    await page.goto("/admin/tenants");
    await page.waitForLoadState("networkidle");

    const firstLink = page.locator("a[href*='/admin/tenants/']").first();
    await expect(firstLink).toBeVisible({ timeout: 10_000 });
    await firstLink.click();
    await page.waitForLoadState("networkidle");

    // Look for action buttons (edit, activate, deactivate)
    const buttons = page.locator("button");
    const buttonCount = await buttons.count();
    console.log(`Buttons on detail page: ${buttonCount}`);

    const buttonTexts: string[] = [];
    for (let i = 0; i < buttonCount; i++) {
      const text = await buttons.nth(i).textContent();
      if (text?.trim()) buttonTexts.push(text.trim());
    }
    console.log(`Button labels: ${buttonTexts.join(", ")}`);

    expect(buttonCount).toBeGreaterThan(0);
  });

  test("3.5 — Admin APIs respond 200", async ({ page }) => {
    const endpoints = [
      "/api/admin/stats",
      "/api/admin/tenants",
      "/api/admin/plans",
      "/api/admin/users",
    ];

    for (const endpoint of endpoints) {
      const response = await page.request.get(
        `http://localhost:3000${endpoint}`
      );
      console.log(`${endpoint} → ${response.status()}`);
      expect(
        response.status(),
        `${endpoint} should respond 200`
      ).toBe(200);
    }
  });

  test("3.6 — Session cookie is set correctly after login", async ({
    page,
  }) => {
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(
      (c) => c.name === "next-auth.session-token"
    );

    expect(sessionCookie, "Session cookie must exist").toBeTruthy();
    expect(sessionCookie!.httpOnly).toBe(true);
    expect(sessionCookie!.path).toBe("/");

    console.log("=== Session Cookie ===");
    console.log(`  domain:   ${sessionCookie!.domain}`);
    console.log(`  httpOnly: ${sessionCookie!.httpOnly}`);
    console.log(`  sameSite: ${sessionCookie!.sameSite}`);
    console.log(`  secure:   ${sessionCookie!.secure}`);
  });
});
