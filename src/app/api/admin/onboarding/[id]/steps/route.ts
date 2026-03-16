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

    const steps = await prisma.onboardingStep.findMany({
      where: { flowId: id },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(steps);
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
    const { title, description, target, placement, order } = body;

    if (!title || !target) {
      return NextResponse.json({ error: "title y target son requeridos" }, { status: 400 });
    }

    const step = await prisma.onboardingStep.create({
      data: {
        flowId,
        title: title.trim(),
        description: description?.trim() || null,
        target: target.trim(),
        placement: placement || "bottom",
        order: order ?? 0,
      },
    });

    return NextResponse.json(step, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
