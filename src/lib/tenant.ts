import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export interface TenantPlanStatus {
  isBlocked: boolean;
  reason: "no_plan" | "trial_expired" | "inactive" | "payment_overdue" | null;
  trialEndsAt: Date | null;
  planName: string | null;
  daysLeft: number | null;
  pendingInvoiceId: string | null;
}

export function getTenantPlanStatus(tenant: {
  isActive: boolean;
  trialEndsAt: Date | null;
  planId: string | null;
  stripeSubscriptionId: string | null;
  plan: { id: string; name: string; price: number | any } | null;
}, pendingInvoice?: { id: string; dueDate: Date } | null): TenantPlanStatus {
  const planName = tenant.plan?.name ?? null;
  const trialEndsAt = tenant.trialEndsAt ? new Date(tenant.trialEndsAt) : null;
  const now = new Date();
  const daysLeft = trialEndsAt
    ? Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  if (!tenant.isActive) {
    return { isBlocked: true, reason: "inactive", trialEndsAt, planName, daysLeft, pendingInvoiceId: null };
  }

  if (!tenant.planId || !tenant.plan) {
    return { isBlocked: true, reason: "no_plan", trialEndsAt, planName, daysLeft, pendingInvoiceId: pendingInvoice?.id ?? null };
  }

  // Paid plan with active stripe subscription → not blocked (legacy support)
  if (Number(tenant.plan.price) > 0 && tenant.stripeSubscriptionId) {
    return { isBlocked: false, reason: null, trialEndsAt, planName, daysLeft, pendingInvoiceId: null };
  }

  // Check period expiration (trialEndsAt used as period end)
  if (trialEndsAt && now > trialEndsAt) {
    if (tenant.stripeSubscriptionId) {
      return { isBlocked: false, reason: null, trialEndsAt, planName, daysLeft, pendingInvoiceId: null };
    }

    // Check if there's a pending invoice (plan renewal needed)
    if (pendingInvoice) {
      return {
        isBlocked: true,
        reason: "payment_overdue",
        trialEndsAt,
        planName,
        daysLeft,
        pendingInvoiceId: pendingInvoice.id,
      };
    }

    return { isBlocked: true, reason: "trial_expired", trialEndsAt, planName, daysLeft, pendingInvoiceId: null };
  }

  return { isBlocked: false, reason: null, trialEndsAt, planName, daysLeft, pendingInvoiceId: pendingInvoice?.id ?? null };
}

export async function requireActivePlan(tenantId: string, globalRole?: string) {
  // SUPER_ADMIN is never blocked
  if (globalRole === "SUPER_ADMIN") return;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { plan: true },
  });

  if (!tenant) {
    throw new TenantError("Tenant no encontrado", 404);
  }

  // Check for overdue invoices
  const pendingInvoice = await prisma.invoice.findFirst({
    where: {
      tenantId,
      status: { in: ["PENDING", "OVERDUE"] },
    },
    orderBy: { dueDate: "asc" },
    select: { id: true, dueDate: true },
  });

  const status = getTenantPlanStatus(tenant, pendingInvoice);
  if (status.isBlocked) {
    const messages: Record<string, string> = {
      no_plan: "No tienes un plan activo. Selecciona un plan para continuar.",
      trial_expired: "Tu periodo de servicio ha expirado. Renueva tu plan para continuar.",
      inactive: "Tu cuenta esta inactiva. Contacta al administrador.",
      payment_overdue: "Tienes un pago pendiente. Realiza el pago para continuar.",
    };
    throw new TenantError(messages[status.reason!] || "Plan no activo", 403);
  }
}

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || "localhost:3000";

/**
 * Extract tenant slug from the Host header (e.g. "demo.localhost:3000" → "demo").
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
  let slug = requestHeaders?.get("x-tenant-slug") ?? null;

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
