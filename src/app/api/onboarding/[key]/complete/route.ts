import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { key } = await params;
    const userId = session.user.id;

    const flow = await prisma.onboardingFlow.findUnique({ where: { key } });
    if (!flow) {
      return NextResponse.json({ error: "Flow no encontrado" }, { status: 404 });
    }

    await prisma.userOnboardingCompletion.upsert({
      where: { userId_flowId: { userId, flowId: flow.id } },
      create: { userId, flowId: flow.id },
      update: {},
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[onboarding complete POST]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
