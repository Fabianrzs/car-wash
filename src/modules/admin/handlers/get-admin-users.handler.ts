import { ApiResponse } from "@/lib/http";
import { requireSuperAdmin } from "@/middleware/admin.middleware";
import { handleAdminHttpError } from "@/modules/admin/admin.errors";
import { listAdminUsersService } from "@/modules/admin/services/list-admin-users.service";
import { listUsersQuerySchema } from "@/modules/admin/validations/admin.validation";

export async function getAdminUsersHandler(request: Request) {
  try {
    await requireSuperAdmin();

    const { searchParams } = new URL(request.url);
    const query = listUsersQuerySchema.parse({
      page: searchParams.get("page") ?? undefined,
      search: searchParams.get("search") ?? undefined,
    });

    const result = await listAdminUsersService(query);
    return ApiResponse.ok(result);
  } catch (error) {
    return handleAdminHttpError(error, "Error al obtener usuarios:");
  }
}

