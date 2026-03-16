import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireTenant, requireTenantMember, handleTenantError, TenantError } from "@/lib/tenant";
import {
  getTeamMembersService,
  inviteTeamMemberService,
  updateTeamMemberRoleService,
  removeTeamMemberService,
} from "@/modules/tenant/services/team.service";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { tenantId } = await requireTenant(request.headers);
    await requireTenantMember(session.user.id, tenantId, session.user.globalRole);

    const members = await getTeamMembersService(tenantId);

    return NextResponse.json(members);
  } catch (error) {
    if (error instanceof TenantError) return handleTenantError(error);
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

    const { invitation, emailError } = await inviteTeamMemberService(
      tenantId,
      session.user.id,
      session.user.name ?? session.user.email ?? "Un administrador",
      email,
      role || "EMPLOYEE"
    );

    return NextResponse.json(
      { ...invitation, emailError },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof TenantError) return handleTenantError(error);
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

    const updated = await updateTeamMemberRoleService(tenantId, tenantUserId, role);

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof TenantError) return handleTenantError(error);
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

    await removeTeamMemberService(tenantId, tenantUserId);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof TenantError) return handleTenantError(error);
    if (error instanceof Error) {
      const status =
        error.message.includes("no encontrado") ? 404 :
        error.message.includes("propietario") ||
        error.message.includes("miembro") ||
        error.message.includes("pendiente")
          ? 400
          : 500;

      if (status !== 500) {
        return NextResponse.json({ error: error.message }, { status });
      }
    }
    console.error("Error al remover miembro:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
