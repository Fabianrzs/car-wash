import { ApiResponse } from "@/lib/http";
import { requireAuth } from "@/middleware/auth.middleware";
import { requireTenantContext, ensureManagementAccess } from "@/middleware/tenant.middleware";
import { createDirectEmployeeService, handleTenantHttpError } from "@/modules/tenant";
import { z } from "zod";

const createEmployeeSchema = z.object({
  name:         z.string().trim().min(2).max(100),
  employeeCode: z.string().trim().min(2).max(20).toLowerCase().regex(/^[a-z0-9_]+$/, "Solo letras minúsculas, números y guión bajo"),
  pin:          z.string().length(4).regex(/^\d+$/, "El PIN debe ser 4 dígitos numéricos"),
});

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const { tenantId, tenant } = await requireTenantContext(request.headers);
    await ensureManagementAccess(session.user.id, tenantId, session.user.globalRole);

    const body = await request.json();
    const data = createEmployeeSchema.parse(body);

    const result = await createDirectEmployeeService({
      tenantId,
      tenantSlug: tenant.slug,
      name: data.name,
      employeeCode: data.employeeCode,
      pin: data.pin,
    });

    return ApiResponse.created(result);
  } catch (error) {
    return handleTenantHttpError(error, "Error al crear empleado:");
  }
}
