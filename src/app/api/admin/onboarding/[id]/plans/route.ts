import { NextResponse } from "next/server";
import { prisma } from "@/database/prisma";
import { auth } from "@/lib/auth";

async function requireSuperAdmin() {
  const session = await auth();
  if (!session || session.user.globalRole !== "SUPER_ADMIN") {
    throw new Error("UNAUTHORIZED");
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id } = await params;

    const [planAccess, allPlans] = await Promise.all([
      prisma.onboardingFlowPlan.findMany({ where: { flowId: id } }),
      prisma.plan.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    ]);

    return NextResponse.json({
      allPlans,
      selectedPlanIds: planAccess.map((p) => p.planId),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// PUT: replace all plan whitelist entries
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id: flowId } = await params;
    const body = await request.json();
    const { planIds } = body as { planIds: string[] };

    await prisma.$transaction([
      prisma.onboardingFlowPlan.deleteMany({ where: { flowId } }),
      ...(planIds.length > 0
        ? [
            prisma.onboardingFlowPlan.createMany({
              data: planIds.map((planId) => ({ flowId, planId })),
              skipDuplicates: true,
            }),
          ]
        : []),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
