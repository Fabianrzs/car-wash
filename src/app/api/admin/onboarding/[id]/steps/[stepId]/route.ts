import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function requireSuperAdmin() {
  const session = await auth();
  if (!session || session.user.globalRole !== "SUPER_ADMIN") {
    throw new Error("UNAUTHORIZED");
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  try {
    await requireSuperAdmin();
    const { stepId } = await params;
    const body = await request.json();
    const { title, description, target, placement, order } = body;

    const step = await prisma.onboardingStep.update({
      where: { id: stepId },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(target !== undefined && { target: target.trim() }),
        ...(placement !== undefined && { placement }),
        ...(order !== undefined && { order }),
      },
    });

    return NextResponse.json(step);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  try {
    await requireSuperAdmin();
    const { stepId } = await params;

    await prisma.onboardingStep.delete({ where: { id: stepId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
