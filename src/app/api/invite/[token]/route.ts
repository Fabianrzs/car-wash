import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    select: {
      id: true,
      email: true,
      role: true,
      expiresAt: true,
      acceptedAt: true,
      tenant: { select: { name: true, slug: true } },
      invitedBy: { select: { name: true, email: true } },
    },
  });

  if (!invitation) {
    return NextResponse.json({ error: "Invitación no encontrada" }, { status: 404 });
  }

  if (invitation.acceptedAt) {
    return NextResponse.json({ error: "Esta invitación ya fue aceptada" }, { status: 400 });
  }

  if (invitation.expiresAt < new Date()) {
    return NextResponse.json({ error: "Esta invitación ha expirado" }, { status: 400 });
  }

  return NextResponse.json(invitation);
}
