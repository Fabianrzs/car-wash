import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 400 });
    }

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { tenant: true },
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitacion no encontrada" }, { status: 404 });
    }

    if (invitation.acceptedAt) {
      return NextResponse.json({ error: "Invitacion ya fue aceptada" }, { status: 400 });
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invitacion expirada" }, { status: 400 });
    }

    // Check if user is already a member
    const existingMember = await prisma.tenantUser.findUnique({
      where: {
        userId_tenantId: { userId: session.user.id, tenantId: invitation.tenantId },
      },
    });

    if (existingMember) {
      return NextResponse.json({ error: "Ya eres miembro de este lavadero" }, { status: 400 });
    }

    // Accept invitation
    await prisma.$transaction([
      prisma.tenantUser.create({
        data: {
          user: { connect: { id: session.user.id } },
          tenant: { connect: { id: invitation.tenantId } },
          role: invitation.role,
        },
      }),
      prisma.invitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      }),
    ]);

    return NextResponse.json({
      message: "Invitacion aceptada",
      tenant: {
        id: invitation.tenant.id,
        name: invitation.tenant.name,
        slug: invitation.tenant.slug,
      },
    });
  } catch (error) {
    console.error("Error al aceptar invitacion:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
