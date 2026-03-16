import { ApiResponse } from "@/lib/http";
import { requireSuperAdmin } from "@/middleware/admin.middleware";
import { handlePlanHttpError } from "@/modules/plans/plan.errors";
import {
  getAdminPlanByIdService,
  updatePlanService,
} from "@/modules/plans/services/plans.service";
import {
  planIdParamsSchema,
  updatePlanSchema,
} from "@/modules/plans/validations/plan.validation";

export async function getAdminPlanByIdHandler(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id } = planIdParamsSchema.parse(await params);
    const plan = await getAdminPlanByIdService(id);
    return ApiResponse.ok(plan);
  } catch (error) {
    return handlePlanHttpError(error, "Error al obtener plan:");
  }
}

export async function updateAdminPlanHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id } = planIdParamsSchema.parse(await params);
    const body = await request.json();
    const data = updatePlanSchema.parse(body);
    const plan = await updatePlanService(id, data);
    return ApiResponse.ok(plan);
  } catch (error) {
    return handlePlanHttpError(error, "Error al actualizar plan:");
  }
}

