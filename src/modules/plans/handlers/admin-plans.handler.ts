import { ApiResponse } from "@/lib/http";
import { requireSuperAdmin } from "@/middleware/admin.middleware";
import { handlePlanHttpError } from "@/modules/plans/plan.errors";
import {
  createPlanService,
  listAdminPlansService,
} from "@/modules/plans/services/plans.service";
import { createPlanSchema } from "@/modules/plans/validations/plan.validation";

export async function getAdminPlansHandler() {
  try {
    await requireSuperAdmin();
    const plans = await listAdminPlansService();
    return ApiResponse.ok(plans);
  } catch (error) {
    return handlePlanHttpError(error, "Error al obtener planes:");
  }
}

export async function createAdminPlanHandler(request: Request) {
  try {
    await requireSuperAdmin();
    const body = await request.json();
    const data = createPlanSchema.parse(body);
    const plan = await createPlanService(data);
    return ApiResponse.created(plan);
  } catch (error) {
    return handlePlanHttpError(error, "Error al crear plan:");
  }
}

