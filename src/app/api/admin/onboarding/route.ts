import { NextResponse } from "next/server";
import { prisma } from "@/database/prisma";
import { auth } from "@/lib/auth";

async function requireSuperAdmin() {
  const session = await auth();
  if (!session || session.user.globalRole !== "SUPER_ADMIN") {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function GET() {
  try {
    await requireSuperAdmin();

    const flows = await prisma.onboardingFlow.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        _count: { select: { steps: true, completions: true } },
      },
    });

    return NextResponse.json(flows);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    console.error("[admin/onboarding GET]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireSuperAdmin();

    const body = await request.json();
    const { key, title, description } = body;

    if (!key || !title) {
      return NextResponse.json({ error: "key y title son requeridos" }, { status: 400 });
    }

    const flow = await prisma.onboardingFlow.create({
      data: { key: key.trim(), title: title.trim(), description: description?.trim() || null },
    });

    return NextResponse.json(flow, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    console.error("[admin/onboarding POST]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
