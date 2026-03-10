import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { requireTenant, requireTenantMember, handleTenantError, TenantError } from "@/lib/tenant";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { tenantId } = await requireTenant(request.headers);
    const tenantUser = await requireTenantMember(session.user.id, tenantId, session.user.globalRole);

    const { id } = await params;
    const body = await request.json();
    const { assignedToId } = body;

    const existingOrder = await prisma.serviceOrder.findFirst({
      where: { id, tenantId },
      select: { id: true, assignedToId: true, status: true },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    if (tenantUser.role === "EMPLOYEE") {
      // Employees can only self-assign unassigned orders
      if (assignedToId !== session.user.id) {
        return NextResponse.json({ error: "Solo puedes asignarte órdenes a ti mismo" }, { status: 403 });
      }
      if (existingOrder.assignedToId) {
        return NextResponse.json({ error: "Esta orden ya tiene un lavador asignado" }, { status: 400 });
      }
    }

    if (assignedToId !== null && assignedToId !== undefined) {
      const assignee = await prisma.tenantUser.findFirst({
        where: {
          tenantId,
          userId: assignedToId,
          isActive: true,
          user: { globalRole: "USER" },
        },
        select: { id: true },
      });

      if (!assignee) {
        return NextResponse.json(
          { error: "El usuario asignado no es miembro activo del tenant" },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.serviceOrder.update({
      where: { id },
      data: { assignedToId: assignedToId ?? null },
      include: {
        assignedTo: { select: { id: true, name: true } },
        client: { select: { id: true, firstName: true, lastName: true, phone: true } },
        vehicle: { select: { id: true, plate: true, brand: true, model: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof TenantError) return handleTenantError(error);
    console.error("Error al asignar orden:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
