import { ApiResponse } from "@/lib/http";
import { requireAuth } from "@/middleware/auth.middleware";
import { requireTenantContext, requireTenantAccess, ensureManagementAccess } from "@/middleware/tenant.middleware";
import { handleTenantHttpError } from "@/modules/tenant/tenant.errors";
import { tenantSettingsSchema } from "@/modules/tenant/validations/tenant.validation";
import {
  getTenantSettingsService,
  updateTenantSettingsService,
} from "@/modules/tenant/services/settings.service";

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { tenantId } = await requireTenantContext(request.headers);
    await requireTenantAccess(session.user.id, tenantId, session.user.globalRole);

    const tenant = await getTenantSettingsService(tenantId);
    return ApiResponse.ok(tenant);
  } catch (error) {
    return handleTenantHttpError(error, "Error al obtener configuracion:");
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireAuth();
    const { tenantId } = await requireTenantContext(request.headers);
    await ensureManagementAccess(session.user.id, tenantId, session.user.globalRole);

    const body = await request.json();
    const validatedData = tenantSettingsSchema.parse(body);

    const tenant = await updateTenantSettingsService(tenantId, {
      name: validatedData.name,
      phone: validatedData.phone,
      email: validatedData.email,
      address: validatedData.address,
      logoUrl: validatedData.logoUrl,
    });

    return ApiResponse.ok(tenant);
  } catch (error) {
    return handleTenantHttpError(error, "Error al actualizar configuracion:");
  }
}
