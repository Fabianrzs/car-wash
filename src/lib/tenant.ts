import { NextResponse } from "next/server";

/**
 * Custom error class for tenant-related errors
 */
export class TenantError extends Error {
  constructor(
    message: string,
    public statusCode: number = 403
  ) {
    super(message);
    this.name = "TenantError";
  }
}

/**
 * Middleware to extract tenant from request headers
 * Returns { tenantId, tenant }
 */
export async function requireTenant(headers: any): Promise<{ tenantId: string; tenant?: string }> {
  const tenantId = headers.get?.("x-tenant-id") || headers["x-tenant-id"];

  if (!tenantId) {
    throw new TenantError("Tenant ID es requerido", 400);
  }

  return { tenantId };
}

/**
 * Middleware to verify tenant membership
 * Verifies that a user has access to a specific tenant
 */
export async function requireTenantMember(
  userId: string,
  tenantId: string,
  globalRole?: string
): Promise<{ role: string }> {
  if (!userId || !tenantId) {
    throw new TenantError("Usuario y Tenant son requeridos", 400);
  }

  // Super admins have access to all tenants as ADMIN
  if (globalRole === "SUPER_ADMIN") {
    return { role: "ADMIN" };
  }

  // For regular users, return default role
  // In a real implementation, this would query the database
  return { role: "EMPLOYEE" };
}

/**
 * Error handler for tenant-related errors
 */
export function handleTenantError(error: unknown): NextResponse {
  if (error instanceof TenantError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error) {
    return NextResponse.json(
      { error: error.message || "Error desconocido" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { error: "Error desconocido" },
    { status: 500 }
  );
}




