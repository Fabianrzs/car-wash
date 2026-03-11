import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { key } = await params;
    const userId = session.user.id;
    const globalRole = session.user.globalRole;

    // Get the flow
    const flow = await prisma.onboardingFlow.findUnique({
      where: { key },
      include: {
        steps: { orderBy: { order: "asc" } },
        planAccess: true,
        tenantOverrides: true,
        completions: { where: { userId } },
      },
    });

    if (!flow || !flow.isActive) {
      return NextResponse.json(null);
    }

    // Already completed
    if (flow.completions.length > 0) {
      return NextResponse.json({ completed: true });
    }

    // SUPER_ADMIN always sees tours
    if (globalRole === "SUPER_ADMIN") {
      return NextResponse.json({ flow: { id: flow.id, key: flow.key, title: flow.title, steps: flow.steps } });
    }

    // Get tenant context for access checks
    let tenantId: string | null = null;
    let tenantPlanId: string | null = null;
    try {
      const tenantData = await requireTenant(request.headers);
      tenantId = tenantData.tenantId;
      tenantPlanId = tenantData.tenant.planId ?? null;
    } catch {
      // No tenant context — skip plan/tenant checks
    }

    if (tenantId) {
      // Check tenant override
      const tenantOverride = flow.tenantOverrides.find((o) => o.tenantId === tenantId);
      if (tenantOverride) {
        if (!tenantOverride.isEnabled) {
          return NextResponse.json(null);
        }
        // isEnabled=true override wins — show regardless of plan
        return NextResponse.json({ flow: { id: flow.id, key: flow.key, title: flow.title, steps: flow.steps } });
      }

      // Check plan restriction
      if (flow.planAccess.length > 0) {
        const hasAccess = tenantPlanId && flow.planAccess.some((p) => p.planId === tenantPlanId);
        if (!hasAccess) {
          return NextResponse.json(null);
        }
      }
    }

    return NextResponse.json({ flow: { id: flow.id, key: flow.key, title: flow.title, steps: flow.steps } });
  } catch (error) {
    console.error("[onboarding GET]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
