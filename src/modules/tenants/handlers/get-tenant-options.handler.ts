import { ApiResponse } from "@/lib/http";
import { requireSuperAdmin } from "@/middleware/admin.middleware";
import { handleTenantsHttpError } from "@/modules/tenants/tenants.errors";
import { listTenantOptionsService } from "@/modules/tenants/services/tenants.service";
import { listTenantOptionsQuerySchema } from "@/modules/tenants/validations/tenants.validation";

export async function getTenantOptionsHandler(request: Request) {
  try {
    await requireSuperAdmin();

    const { searchParams } = new URL(request.url);
    const query = listTenantOptionsQuerySchema.parse({
      search: searchParams.get("search") ?? undefined,
    });

    const result = await listTenantOptionsService(query.search);
    return ApiResponse.ok(result);
  } catch (error) {
    return handleTenantsHttpError(error, "Error al listar tenants:");
  }
}


