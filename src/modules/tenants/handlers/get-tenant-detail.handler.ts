import { ApiResponse } from "@/lib/http";
import { requireSuperAdmin } from "@/middleware/admin.middleware";
import { handleTenantsHttpError } from "@/modules/tenants/tenants.errors";
import {
  deactivateTenantService,
  getTenantByIdService,
  updateTenantService,
} from "@/modules/tenants/services/tenants.service";
import {
  tenantIdParamsSchema,
  updateTenantSchema,
} from "@/modules/tenants/validations/tenants.validation";

export async function getTenantByIdHandler(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id } = tenantIdParamsSchema.parse(await params);

    const tenant = await getTenantByIdService(id);
    return ApiResponse.ok(tenant);
  } catch (error) {
    return handleTenantsHttpError(error, "Error al obtener tenant:");
  }
}

export async function updateTenantHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id } = tenantIdParamsSchema.parse(await params);
    const body = await request.json();
    const data = updateTenantSchema.parse(body);

    const tenant = await updateTenantService(id, data);
    return ApiResponse.ok(tenant);
  } catch (error) {
    return handleTenantsHttpError(error, "Error al actualizar tenant:");
  }
}

export async function deactivateTenantHandler(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id } = tenantIdParamsSchema.parse(await params);

    const result = await deactivateTenantService(id);
    return ApiResponse.ok(result);
  } catch (error) {
    return handleTenantsHttpError(error, "Error al desactivar tenant:");
  }
}


