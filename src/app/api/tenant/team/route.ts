import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { requireTenant, requireTenantMember, handleTenantError } from "@/lib/tenant";
import crypto from "crypto";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { tenantId } = await requireTenant(request.headers);
    await requireTenantMember(session.user.id, tenantId, session.user.globalRole);

    const members = await prisma.tenantUser.findMany({
      where: { tenantId },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(members);
  } catch (error) {
    try { return handleTenantError(error); } catch {}
    console.error("Error al obtener equipo:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { tenantId } = await requireTenant(request.headers);
    const tenantUser = await requireTenantMember(session.user.id, tenantId, session.user.globalRole);

    if (tenantUser.role === "EMPLOYEE") {
      return NextResponse.json({ error: "No tienes permisos para invitar" }, { status: 403 });
    }

    const body = await request.json();
    const { email, role } = body;

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    // Check if already a member
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const existingMember = await prisma.tenantUser.findUnique({
        where: { userId_tenantId: { userId: existingUser.id, tenantId } },
      });
      if (existingMember) {
        return NextResponse.json({ error: "El usuario ya es miembro" }, { status: 400 });
      }
    }

    // Check for pending invitation
    const existingInvitation = await prisma.invitation.findFirst({
      where: { email, tenantId, acceptedAt: null, expiresAt: { gt: new Date() } },
    });
    if (existingInvitation) {
      return NextResponse.json({ error: "Ya hay una invitacion pendiente para este email" }, { status: 400 });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await prisma.invitation.create({
      data: {
        email,
        tenant: { connect: { id: tenantId } },
        role: role || "EMPLOYEE",
        token,
        expiresAt,
        invitedBy: { connect: { id: session.user.id } },
      },
    });

    return NextResponse.json(invitation, { status: 201 });
  } catch (error) {
    try { return handleTenantError(error); } catch {}
    console.error("Error al invitar miembro:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { tenantId } = await requireTenant(request.headers);
    const tenantUser = await requireTenantMember(session.user.id, tenantId, session.user.globalRole);

    if (tenantUser.role !== "OWNER") {
      return NextResponse.json({ error: "Solo el propietario puede cambiar roles" }, { status: 403 });
    }

    const body = await request.json();
    const { tenantUserId, role } = body;

    if (!tenantUserId || !role) {
      return NextResponse.json({ error: "ID y rol son requeridos" }, { status: 400 });
    }

    if (!["ADMIN", "EMPLOYEE"].includes(role)) {
      return NextResponse.json({ error: "Rol invalido" }, { status: 400 });
    }

    const target = await prisma.tenantUser.findUnique({ where: { id: tenantUserId } });
    if (!target || target.tenantId !== tenantId) {
      return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
    }
    if (target.role === "OWNER") {
      return NextResponse.json({ error: "No se puede cambiar el rol del propietario" }, { status: 400 });
    }

    const updated = await prisma.tenantUser.update({
      where: { id: tenantUserId },
      data: { role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    try { return handleTenantError(error); } catch {}
    console.error("Error al cambiar rol:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { tenantId } = await requireTenant(request.headers);
    const tenantUser = await requireTenantMember(session.user.id, tenantId, session.user.globalRole);

    if (tenantUser.role !== "OWNER") {
      return NextResponse.json({ error: "Solo el propietario puede remover miembros" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const tenantUserId = searchParams.get("id");

    if (!tenantUserId) {
      return NextResponse.json({ error: "ID del miembro requerido" }, { status: 400 });
    }

    const target = await prisma.tenantUser.findUnique({ where: { id: tenantUserId } });
    if (!target || target.tenantId !== tenantId) {
      return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
    }
    if (target.role === "OWNER") {
      return NextResponse.json({ error: "No se puede remover al propietario" }, { status: 400 });
    }

    await prisma.tenantUser.delete({ where: { id: tenantUserId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    try { return handleTenantError(error); } catch {}
    console.error("Error al remover miembro:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
