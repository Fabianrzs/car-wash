import { ApiResponse } from "@/lib/http";
import { requireSuperAdmin } from "@/middleware/admin.middleware";
import { handleOnboardingHttpError } from "@/modules/onboarding/admin-onboarding.errors";
import {
  getFlowPlansService,
  replaceFlowPlansService,
} from "@/modules/onboarding/services/admin-onboarding.service";
import {
  flowIdParamsSchema,
  updateFlowPlansSchema,
} from "@/modules/onboarding/validations/admin-onboarding.validation";

export async function getFlowPlansHandler(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id } = flowIdParamsSchema.parse(await params);
    const plans = await getFlowPlansService(id);
    return ApiResponse.ok(plans);
  } catch (error) {
    return handleOnboardingHttpError(error, "[admin/onboarding/:id/plans GET]");
  }
}

export async function replaceFlowPlansHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id } = flowIdParamsSchema.parse(await params);
    const body = await request.json();
    const { planIds } = updateFlowPlansSchema.parse(body);
    const result = await replaceFlowPlansService(id, planIds);
    return ApiResponse.ok(result);
  } catch (error) {
    return handleOnboardingHttpError(error, "[admin/onboarding/:id/plans PUT]");
  }
}


