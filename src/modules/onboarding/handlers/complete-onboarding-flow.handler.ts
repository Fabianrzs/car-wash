import { ApiResponse } from "@/lib/http";
import { requireAuth } from "@/middleware/auth.middleware";
import { handleOnboardingHttpError } from "@/modules/onboarding/onboarding.errors";
import { completeOnboardingFlowService } from "@/modules/onboarding/services/onboarding.service";
import { onboardingKeyParamsSchema } from "@/modules/onboarding/validations/onboarding.validation";

export async function completeOnboardingFlowHandler(
  _request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const session = await requireAuth();
    const { key } = onboardingKeyParamsSchema.parse(await params);

    const result = await completeOnboardingFlowService(key, session.user.id);
    if (!result) {
      return ApiResponse.notFound("Flow no encontrado");
    }

    return ApiResponse.ok(result);
  } catch (error) {
    return handleOnboardingHttpError(error, "[onboarding complete POST]");
  }
}

