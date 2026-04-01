import { test, expect } from "@playwright/test";
import { loginAndCapture, loginAsEmployee } from "./helpers/auth";
import { E2E_EMPLOYEE_CODE_PREFIX, TENANT_BASE_URL, TENANT_USER } from "./helpers/constants";

interface TeamMemberResponse {
  role: string;
  isActive: boolean;
  employeeCode: string | null;
}

test.describe("Employee creation flow", () => {
  test("creates employee and allows login with PIN", async ({ page, browser }) => {
    const employeeCode = `${E2E_EMPLOYEE_CODE_PREFIX}${Date.now().toString().slice(-6)}`;
    const employeeName = `Empleado ${employeeCode}`;
    const pin = "1234";

    await loginAndCapture(page, TENANT_USER);
    await page.goto(`${TENANT_BASE_URL}/team`, { waitUntil: "domcontentloaded" });

    const createResponse = await page.evaluate(
      async ({ name, employeeCode: code, pin: employeePin }) => {
        const response = await fetch("/api/tenant/team/employees", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, employeeCode: code, pin: employeePin }),
        });

        const data = await response.json().catch(() => null);
        return { status: response.status, data };
      },
      { name: employeeName, employeeCode, pin }
    );

    if (createResponse.status !== 201) {
      test.skip(
        createResponse.status === 401 || createResponse.status === 403,
        "La cuenta de pruebas no tiene sesión/permisos para crear empleados en este entorno."
      );

      throw new Error(
        `No se pudo crear empleado (status ${createResponse.status}): ${JSON.stringify(createResponse.data)}`
      );
    }

    expect(createResponse.data?.employeeCode).toBe(employeeCode);
    expect(createResponse.data?.pin).toBe(pin);
    expect(createResponse.data?.name).toBe(employeeName);

    const membersResponse = await page.evaluate(async () => {
      const response = await fetch("/api/tenant/team");
      const data = await response.json().catch(() => null);
      return { status: response.status, data };
    });

    expect(membersResponse.status).toBe(200);

    const members = Array.isArray(membersResponse.data)
      ? (membersResponse.data as TeamMemberResponse[])
      : [];

    const createdMember = members.find((member) => member.employeeCode === employeeCode) ?? null;

    expect(createdMember).toBeTruthy();
    expect(createdMember?.isActive).toBe(true);
    expect(createdMember?.role).toBe("EMPLOYEE");

    const employeeContext = await browser.newContext();
    const employeePage = await employeeContext.newPage();

    await loginAsEmployee(employeePage, {
      tenantSlug: TENANT_USER.slug,
      employeeCode,
      pin,
    });

    await employeePage.goto(`${TENANT_BASE_URL}/mis-ordenes`, {
      waitUntil: "domcontentloaded",
    });

    expect(employeePage.url()).not.toContain("/login");
    await expect(employeePage.locator("body")).toContainText(/Ordenes|Mis Ordenes|ordenes/i);

    await employeeContext.close();
  });
});
