import { ApiResponse } from "@/lib/http";
import { requireSuperAdmin } from "@/middleware/admin.middleware";
import { handleOnboardingHttpError } from "@/modules/onboarding/admin-onboarding.errors";
import {
  deleteFlowStepService,
  updateFlowStepService,
} from "@/modules/onboarding/services/admin-onboarding.service";
import {
  flowStepParamsSchema,
  updateStepSchema,
} from "@/modules/onboarding/validations/admin-onboarding.validation";

export async function updateFlowStepHandler(
  request: Request,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  try {
    await requireSuperAdmin();
    const { stepId } = flowStepParamsSchema.parse(await params);
    const body = await request.json();
    const data = updateStepSchema.parse(body);
    const step = await updateFlowStepService(stepId, data);
    return ApiResponse.ok(step);
  } catch (error) {
    return handleOnboardingHttpError(error, "[admin/onboarding/:id/steps/:stepId PUT]");
  }
}

export async function deleteFlowStepHandler(
  _request: Request,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  try {
    await requireSuperAdmin();
    const { stepId } = flowStepParamsSchema.parse(await params);
    const result = await deleteFlowStepService(stepId);
    return ApiResponse.ok(result);
  } catch (error) {
    return handleOnboardingHttpError(error, "[admin/onboarding/:id/steps/:stepId DELETE]");
  }
}




