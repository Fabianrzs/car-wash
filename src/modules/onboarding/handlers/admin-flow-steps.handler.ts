import { ApiResponse } from "@/lib/http";
import { requireSuperAdmin } from "@/middleware/admin.middleware";
import { handleOnboardingHttpError } from "@/modules/onboarding/admin-onboarding.errors";
import {
  createFlowStepService,
  listFlowStepsService,
} from "@/modules/onboarding/services/admin-onboarding.service";
import {
  createStepSchema,
  flowIdParamsSchema,
} from "@/modules/onboarding/validations/admin-onboarding.validation";

export async function getFlowStepsHandler(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id } = flowIdParamsSchema.parse(await params);
    const steps = await listFlowStepsService(id);
    return ApiResponse.ok(steps);
  } catch (error) {
    return handleOnboardingHttpError(error, "[admin/onboarding/:id/steps GET]");
  }
}

export async function createFlowStepHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id } = flowIdParamsSchema.parse(await params);
    const body = await request.json();
    const data = createStepSchema.parse(body);
    const step = await createFlowStepService(id, data);
    return ApiResponse.created(step);
  } catch (error) {
    return handleOnboardingHttpError(error, "[admin/onboarding/:id/steps POST]");
  }
}




