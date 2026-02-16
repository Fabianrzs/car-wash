import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { requireTenant, requireTenantMember, handleTenantError } from "@/lib/tenant";
import { createCheckoutSession, createBillingPortalSession } from "@/lib/stripe";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { tenantId } = await requireTenant(request.headers);
    await requireTenantMember(session.user.id, tenantId, session.user.globalRole);

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        plan: true,
      },
    });

    return NextResponse.json({
      plan: tenant?.plan || null,
      stripeSubscriptionId: tenant?.stripeSubscriptionId || null,
      stripeCustomerId: tenant?.stripeCustomerId || null,
    });
  } catch (error) {
    try { return handleTenantError(error); } catch {}
    console.error("Error al obtener facturacion:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { tenantId } = await requireTenant(request.headers);
    const tenantUser = await requireTenantMember(session.user.id, tenantId, session.user.globalRole);

    if (tenantUser.role === "EMPLOYEE") {
      return NextResponse.json({ error: "No tienes permisos" }, { status: 403 });
    }

    const body = await request.json();
    const { action, planId } = body;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { plan: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
    }

    if (action === "portal" && tenant.stripeCustomerId) {
      const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || "localhost:3000";
      const protocol = appDomain.includes("localhost") ? "http" : "https";
      const portalSession = await createBillingPortalSession({
        stripeCustomerId: tenant.stripeCustomerId,
        returnUrl: `${protocol}://${tenant.slug}.${appDomain}/billing`,
      });
      return NextResponse.json({ url: portalSession.url });
    }

    if (action === "checkout" && planId) {
      const plan = await prisma.plan.findUnique({ where: { id: planId } });
      if (!plan || !plan.stripePriceId) {
        return NextResponse.json({ error: "Plan no valido" }, { status: 400 });
      }

      const checkoutSession = await createCheckoutSession({
        tenantId,
        tenantName: tenant.name,
        stripePriceId: plan.stripePriceId,
        customerEmail: session.user.email || tenant.email || "",
        stripeCustomerId: tenant.stripeCustomerId || undefined,
      });

      return NextResponse.json({ url: checkoutSession.url });
    }

    return NextResponse.json({ error: "Accion no valida" }, { status: 400 });
  } catch (error) {
    try { return handleTenantError(error); } catch {}
    console.error("Error en facturacion:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
