import { ApiResponse } from "@/lib/http";
import { requireSuperAdmin } from "@/middleware/admin.middleware";
import { handleOnboardingHttpError } from "@/modules/onboarding/admin-onboarding.errors";
import {
  createFlowService,
  listFlowsService,
} from "@/modules/onboarding/services/admin-onboarding.service";
import { createFlowSchema } from "@/modules/onboarding/validations/admin-onboarding.validation";

export async function getFlowsHandler() {
  try {
    await requireSuperAdmin();
    const flows = await listFlowsService();
    return ApiResponse.ok(flows);
  } catch (error) {
    return handleOnboardingHttpError(error, "[admin/onboarding GET]");
  }
}

export async function createFlowHandler(request: Request) {
  try {
    await requireSuperAdmin();
    const body = await request.json();
    const data = createFlowSchema.parse(body);
    const flow = await createFlowService(data);
    return ApiResponse.created(flow);
  } catch (error) {
    return handleOnboardingHttpError(error, "[admin/onboarding POST]");
  }
}


