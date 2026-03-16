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

    const overrides = await prisma.onboardingFlowTenant.findMany({
      where: { flowId: id },
      include: { tenant: { select: { id: true, name: true, slug: true } } },
    });

    return NextResponse.json(overrides);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id: flowId } = await params;
    const body = await request.json();
    const { tenantId, isEnabled } = body;

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId es requerido" }, { status: 400 });
    }

    const override = await prisma.onboardingFlowTenant.upsert({
      where: { flowId_tenantId: { flowId, tenantId } },
      create: { flowId, tenantId, isEnabled: isEnabled ?? true },
      update: { isEnabled: isEnabled ?? true },
      include: { tenant: { select: { id: true, name: true, slug: true } } },
    });

    return NextResponse.json(override, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id: flowId } = await params;
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId es requerido" }, { status: 400 });
    }

    await prisma.onboardingFlowTenant.delete({
      where: { flowId_tenantId: { flowId, tenantId } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
