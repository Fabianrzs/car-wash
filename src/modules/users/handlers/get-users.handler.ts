import { ApiResponse } from "@/lib/http";
import { requireSuperAdmin } from "@/middleware/admin.middleware";
import { handleUsersHttpError } from "@/modules/users/users.errors";
import { listUsersService } from "@/modules/users/services/list-users.service";
import { listUsersQuerySchema } from "@/modules/users/validations/users.validation";

export async function getUsersHandler(request: Request) {
  try {
    await requireSuperAdmin();

    const { searchParams } = new URL(request.url);
    const query = listUsersQuerySchema.parse({
      page: searchParams.get("page") ?? undefined,
      search: searchParams.get("search") ?? undefined,
    });

    const result = await listUsersService(query);
    return ApiResponse.ok(result);
  } catch (error) {
    return handleUsersHttpError(error, "Error al obtener usuarios:");
  }
}


