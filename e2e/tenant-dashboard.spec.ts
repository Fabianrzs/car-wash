import { test, expect } from "@playwright/test";
import { loginAs, loginAndCapture } from "./helpers/auth";
import { TENANT_USER, TENANT_BASE_URL } from "./helpers/constants";

test.describe("Tenant Dashboard E2E", () => {
  test("4.1 — Login redirects to tenant subdomain dashboard", async ({
    page,
  }) => {
    const { url } = await loginAndCapture(page, TENANT_USER);

    console.log(`=== Final URL after login: ${url} ===`);

    const parsedUrl = new URL(url);
    const expectedHost = `${TENANT_USER.slug}.localhost`;

    expect(parsedUrl.hostname).toContain(expectedHost);
    expect(parsedUrl.pathname).toBe("/dashboard");
  });

  test.describe("Authenticated tenant flows", () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page, TENANT_USER);
      // Ensure we're on the tenant subdomain
      if (!page.url().includes(`${TENANT_USER.slug}.localhost`)) {
        await page.goto(`${TENANT_BASE_URL}/dashboard`);
      }
    });

    test("4.2 — Dashboard loads without redirect to login", async ({
      page,
    }) => {
      await page.goto(`${TENANT_BASE_URL}/dashboard`, {
        waitUntil: "domcontentloaded",
      });

      const finalUrl = page.url();
      console.log(`Dashboard URL: ${finalUrl}`);
      expect(finalUrl).not.toContain("/login");

      await page.waitForLoadState("networkidle");
      const body = await page.textContent("body");
      expect(body).toBeTruthy();
    });

    test("4.3 — Dashboard APIs respond 200", async ({ page }) => {
      const endpoints = [
        { path: "/api/reports?period=daily", label: "reports" },
        { path: "/api/orders?page=1", label: "orders" },
        { path: "/api/services", label: "services" },
        { path: "/api/clients", label: "clients" },
        { path: "/api/vehicles", label: "vehicles" },
      ];

      for (const { path, label } of endpoints) {
        const result = await page.evaluate(async (url: string) => {
          const res = await fetch(url);
          return { status: res.status };
        }, path);

        console.log(`${label}: ${result.status}`);
        expect(
          result.status,
          `${label} (${path}) should respond 200`
        ).toBe(200);
      }
    });

    test("4.4 — Listing pages render without crashing", async ({ page }) => {
      const pages = [
        { path: "/services", label: "Servicios" },
        { path: "/clients", label: "Clientes" },
        { path: "/vehicles", label: "Vehiculos" },
        { path: "/orders", label: "Ordenes" },
      ];

      for (const { path, label } of pages) {
        await page.goto(`${TENANT_BASE_URL}${path}`, {
          waitUntil: "domcontentloaded",
        });
        await page.waitForLoadState("networkidle");

        const url = page.url();
        console.log(`${label}: ${url}`);

        expect(url, `${label} should not redirect to login`).not.toContain(
          "/login"
        );
      }
    });

    test("4.5 — No unexpected login redirects during navigation", async ({
      page,
    }) => {
      const routes = [
        "/dashboard",
        "/services",
        "/clients",
        "/vehicles",
        "/orders",
      ];

      for (const route of routes) {
        await page.goto(`${TENANT_BASE_URL}${route}`, {
          waitUntil: "domcontentloaded",
        });

        const finalUrl = page.url();
        console.log(`${route} → ${finalUrl}`);

        expect(
          finalUrl,
          `Navigation to ${route} should not end at /login`
        ).not.toContain("/login");
      }
    });
  });
});
