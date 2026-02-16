import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { requireTenant, requireTenantMember, handleTenantError } from "@/lib/tenant";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { tenantId } = await requireTenant(request.headers);
    const currentUser = await requireTenantMember(session.user.id, tenantId, session.user.globalRole);

    if (currentUser.role !== "OWNER") {
      return NextResponse.json({ error: "Solo el propietario puede cambiar roles" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const targetMember = await prisma.tenantUser.findFirst({
      where: { id, tenantId },
    });

    if (!targetMember) {
      return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
    }

    if (targetMember.role === "OWNER") {
      return NextResponse.json({ error: "No se puede cambiar el rol del propietario" }, { status: 400 });
    }

    const member = await prisma.tenantUser.update({
      where: { id },
      data: { role: body.role },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(member);
  } catch (error) {
    try { return handleTenantError(error); } catch {}
    console.error("Error al actualizar miembro:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { tenantId } = await requireTenant(request.headers);
    const currentUser = await requireTenantMember(session.user.id, tenantId, session.user.globalRole);

    if (currentUser.role === "EMPLOYEE") {
      return NextResponse.json({ error: "No tienes permisos" }, { status: 403 });
    }

    const { id } = await params;

    const targetMember = await prisma.tenantUser.findFirst({
      where: { id, tenantId },
    });

    if (!targetMember) {
      return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
    }

    if (targetMember.role === "OWNER") {
      return NextResponse.json({ error: "No se puede remover al propietario" }, { status: 400 });
    }

    await prisma.tenantUser.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: "Miembro removido correctamente" });
  } catch (error) {
    try { return handleTenantError(error); } catch {}
    console.error("Error al remover miembro:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
