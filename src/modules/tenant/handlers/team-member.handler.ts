import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireTenant, requireTenantMember, handleTenantError, TenantError } from "@/lib/tenant";
import {
  deactivateTeamMemberService,
  updateTeamMemberRoleService,
} from "@/modules/tenant/services/team.service";

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

    const member = await updateTeamMemberRoleService(tenantId, id, body.role);

    return NextResponse.json(member);
  } catch (error) {
    if (error instanceof TenantError) return handleTenantError(error);
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

    const result = await deactivateTeamMemberService(tenantId, id);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof TenantError) return handleTenantError(error);
    if (error instanceof Error) {
      const status =
        error.message.includes("no encontrado") ? 404 :
        error.message.includes("propietario") ? 400 : 500;

      if (status !== 500) {
        return NextResponse.json({ error: error.message }, { status });
      }
    }
    console.error("Error al remover miembro:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
