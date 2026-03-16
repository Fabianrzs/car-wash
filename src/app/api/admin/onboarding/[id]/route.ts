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

    const flow = await prisma.onboardingFlow.findUnique({
      where: { id },
      include: {
        steps: { orderBy: { order: "asc" } },
        planAccess: { include: { plan: { select: { id: true, name: true, slug: true } } } },
        tenantOverrides: { include: { tenant: { select: { id: true, name: true, slug: true } } } },
        _count: { select: { completions: true } },
      },
    });

    if (!flow) {
      return NextResponse.json({ error: "Flow no encontrado" }, { status: 404 });
    }

    return NextResponse.json(flow);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id } = await params;
    const body = await request.json();
    const { title, description, isActive } = body;

    const flow = await prisma.onboardingFlow.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(flow);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id } = await params;

    await prisma.onboardingFlow.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
