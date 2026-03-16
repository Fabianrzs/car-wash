import { ApiResponse } from "@/lib/http";
import { handlePlanHttpError } from "@/modules/plans/plan.errors";
import { listPublicPlansService } from "@/modules/plans/services/plans.service";

export async function getPublicPlansHandler() {
  try {
    const plans = await listPublicPlansService();
    return ApiResponse.ok(plans);
  } catch (error) {
    return handlePlanHttpError(error, "Error al obtener planes:");
  }
}

