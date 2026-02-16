import { test, expect } from "@playwright/test";
import { loginAndCapture } from "./helpers/auth";
import {
  TENANT_USER,
  TENANT_BASE_URL,
} from "./helpers/constants";

test.describe("Auth Debug — Cookie & Session Diagnostics", () => {
  test("5.1 — signIn() sets session cookie after login", async ({ page }) => {
    const { cookies } = await loginAndCapture(page, TENANT_USER);

    const sessionCookies = cookies.filter(
      (c) => c.name === "next-auth.session-token"
    );

    console.log("=== ALL COOKIES AFTER LOGIN ===");
    for (const c of cookies) {
      console.log(
        `  ${c.name} | domain=${c.domain} | path=${c.path} | httpOnly=${c.httpOnly} | sameSite=${c.sameSite}`
      );
    }

    // Should have session cookies (at least on the subdomain after relay)
    expect(
      sessionCookies.length,
      "At least one session cookie should exist"
    ).toBeGreaterThan(0);
  });

  test("5.2 — Session cookie exists on tenant subdomain", async ({ page }) => {
    const { cookies } = await loginAndCapture(page, TENANT_USER);

    const subdomainCookie = cookies.find(
      (c) =>
        c.name === "next-auth.session-token" &&
        c.domain.includes(TENANT_USER.slug)
    );

    console.log("=== SESSION COOKIES ===");
    for (const c of cookies.filter(
      (c) => c.name === "next-auth.session-token"
    )) {
      console.log(`  domain=${c.domain} | httpOnly=${c.httpOnly}`);
    }

    expect(
      subdomainCookie,
      "Session cookie must exist on tenant subdomain (set via session relay)"
    ).toBeTruthy();
  });

  test("5.3 — API on subdomain responds with tenant data", async ({
    page,
  }) => {
    await loginAndCapture(page, TENANT_USER);

    const result = await page.evaluate(async () => {
      const res = await fetch("/api/services");
      return { status: res.status, body: await res.text() };
    });

    console.log(`=== /api/services response ===`);
    console.log(`  status: ${result.status}`);
    console.log(`  body: ${result.body.substring(0, 200)}`);

    expect(result.status).toBe(200);
  });

  test("5.4 — /api/auth/session returns user on subdomain", async ({
    page,
  }) => {
    await loginAndCapture(page, TENANT_USER);

    const session = await page.evaluate(async () => {
      const res = await fetch("/api/auth/session");
      return await res.json();
    });

    console.log("=== SESSION ON SUBDOMAIN ===");
    console.log(JSON.stringify(session, null, 2));

    expect(session?.user, "Session should contain a user object").toBeTruthy();
    expect(session.user.email).toBe(TENANT_USER.email);
    expect(
      session.user.tenantSlug,
      "tenantSlug must be present in session"
    ).toBeTruthy();
  });

  test("5.5 — No redirect loop on tenant dashboard", async ({ page }) => {
    await loginAndCapture(page, TENANT_USER);

    const redirects: { status: number; url: string; location: string | null }[] = [];

    page.on("response", (response) => {
      if ([301, 302, 303, 307, 308].includes(response.status())) {
        redirects.push({
          status: response.status(),
          url: response.url(),
          location: response.headers()["location"] || null,
        });
      }
    });

    await page.goto(`${TENANT_BASE_URL}/dashboard`, {
      waitUntil: "domcontentloaded",
      timeout: 15_000,
    });

    console.log("=== REDIRECT CHAIN ===");
    for (const r of redirects) {
      console.log(`  ${r.status} ${r.url.substring(0, 80)} → ${r.location}`);
    }
    console.log(`=== FINAL URL: ${page.url()} ===`);

    expect(
      page.url(),
      "Should NOT redirect back to login"
    ).not.toContain("/login");
  });
});
