import { ApiResponse } from "@/lib/http";
import { requireSuperAdmin } from "@/middleware/admin.middleware";
import { handleOnboardingHttpError } from "@/modules/onboarding/admin-onboarding.errors";
import {
  deleteFlowService,
  getFlowDetailService,
  updateFlowService,
} from "@/modules/onboarding/services/admin-onboarding.service";
import {
  flowIdParamsSchema,
  updateFlowSchema,
} from "@/modules/onboarding/validations/admin-onboarding.validation";

export async function getFlowByIdHandler(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id } = flowIdParamsSchema.parse(await params);
    const flow = await getFlowDetailService(id);
    return ApiResponse.ok(flow);
  } catch (error) {
    return handleOnboardingHttpError(error, "[admin/onboarding/:id GET]");
  }
}

export async function updateFlowHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id } = flowIdParamsSchema.parse(await params);
    const body = await request.json();
    const data = updateFlowSchema.parse(body);
    const flow = await updateFlowService(id, data);
    return ApiResponse.ok(flow);
  } catch (error) {
    return handleOnboardingHttpError(error, "[admin/onboarding/:id PUT]");
  }
}

export async function deleteFlowHandler(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id } = flowIdParamsSchema.parse(await params);
    const result = await deleteFlowService(id);
    return ApiResponse.ok(result);
  } catch (error) {
    return handleOnboardingHttpError(error, "[admin/onboarding/:id DELETE]");
  }
}




