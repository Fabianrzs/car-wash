import { ApiResponse } from "@/lib/http";
import { requireSuperAdmin } from "@/middleware/admin.middleware";
import { handleTenantsHttpError } from "@/modules/tenants/tenants.errors";
import {
  createTenantService,
  listTenantsService,
} from "@/modules/tenants/services/tenants.service";
import {
  createTenantSchema,
  listTenantsQuerySchema,
} from "@/modules/tenants/validations/tenants.validation";

export async function getTenantsHandler(request: Request) {
  try {
    await requireSuperAdmin();

    const { searchParams } = new URL(request.url);
    const query = listTenantsQuerySchema.parse({
      page: searchParams.get("page") ?? undefined,
      search: searchParams.get("search") ?? undefined,
    });

    const result = await listTenantsService(query);
    return ApiResponse.ok(result);
  } catch (error) {
    return handleTenantsHttpError(error, "Error al obtener tenants:");
  }
}

export async function createTenantHandler(request: Request) {
  try {
    await requireSuperAdmin();
    const body = await request.json();
    const data = createTenantSchema.parse(body);

    const tenant = await createTenantService(data);
    return ApiResponse.created(tenant);
  } catch (error) {
    return handleTenantsHttpError(error, "Error al crear tenant:");
  }
}


