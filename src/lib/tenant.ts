import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || "localhost:3000";

/**
 * Extract tenant slug from the Host header (e.g. "demo.localhost:3000" → "demo").
 * In Next.js 16, middleware-injected headers (x-tenant-slug) are NOT propagated
 * to Route Handlers, so we read the subdomain from the Host header directly.
 */
function extractTenantSlugFromHost(host: string): string | null {
  const appHost = APP_DOMAIN.replace(/:\d+$/, "");
  if (host === APP_DOMAIN || host === appHost) return null;

  const localhostMatch = host.match(/^([^.]+)\.localhost/);
  if (localhostMatch) return localhostMatch[1];

  const subdomain = host.replace(`.${appHost}`, "").replace(/:\d+$/, "");
  if (subdomain && subdomain !== host && subdomain !== appHost) return subdomain;

  return null;
}

export async function getTenantSlugFromHeaders(): Promise<string | null> {
  const headersList = await headers();
  return (
    headersList.get("x-tenant-slug") ??
    extractTenantSlugFromHost(headersList.get("host") || "")
  );
}

export async function resolveTenant(slug: string) {
  return prisma.tenant.findUnique({
    where: { slug, isActive: true },
    include: { plan: true },
  });
}

export async function requireTenant(requestHeaders?: Headers) {
  // Try x-tenant-slug first, then extract from host header
  let slug =
    requestHeaders?.get("x-tenant-slug") ?? null;

  if (!slug) {
    const headersList = await headers();
    slug =
      headersList.get("x-tenant-slug") ??
      extractTenantSlugFromHost(headersList.get("host") || "");
  }

  if (!slug) {
    throw new TenantError("Tenant no especificado", 400);
  }

  const tenant = await resolveTenant(slug);
  if (!tenant) {
    throw new TenantError("Tenant no encontrado", 404);
  }

  return { tenantId: tenant.id, tenant };
}

export async function requireTenantMember(userId: string, tenantId: string, globalRole?: string) {
  // SUPER_ADMIN can access any tenant
  if (globalRole === "SUPER_ADMIN") {
    return { role: "OWNER" as const, userId, tenantId, isActive: true, id: "super-admin" };
  }

  const tenantUser = await prisma.tenantUser.findUnique({
    where: {
      userId_tenantId: { userId, tenantId },
      isActive: true,
    },
  });

  if (!tenantUser) {
    throw new TenantError("No eres miembro de este lavadero", 403);
  }

  return tenantUser;
}

export class TenantError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "TenantError";
  }
}

export function handleTenantError(error: unknown) {
  if (error instanceof TenantError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  throw error;
}
