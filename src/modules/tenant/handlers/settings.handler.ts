import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireTenant, requireTenantMember, handleTenantError, TenantError } from "@/lib/tenant";
import { tenantSettingsSchema } from "@/lib/validations";
import {
  getTenantSettingsService,
  updateTenantSettingsService,
} from "@/modules/tenant/services/settings.service";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { tenantId } = await requireTenant(request.headers);
    await requireTenantMember(session.user.id, tenantId, session.user.globalRole);

    const tenant = await getTenantSettingsService(tenantId);
    return NextResponse.json(tenant);
  } catch (error) {
    if (error instanceof TenantError) return handleTenantError(error);
    console.error("Error al obtener configuracion:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { tenantId } = await requireTenant(request.headers);
    const tenantUser = await requireTenantMember(session.user.id, tenantId, session.user.globalRole);

    if (tenantUser.role === "EMPLOYEE") {
      return NextResponse.json({ error: "No tienes permisos" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = tenantSettingsSchema.parse(body);

    const tenant = await updateTenantSettingsService(tenantId, {
      name: validatedData.name,
      phone: validatedData.phone,
      email: validatedData.email,
      address: validatedData.address,
      logoUrl: validatedData.logoUrl,
    });

    return NextResponse.json(tenant);
  } catch (error) {
    if (error instanceof TenantError) return handleTenantError(error);
    console.error("Error al actualizar configuracion:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
