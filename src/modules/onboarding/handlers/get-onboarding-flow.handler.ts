import { ApiResponse } from "@/lib/http";
import { requireAuth } from "@/middleware/auth.middleware";
import { handleOnboardingHttpError } from "@/modules/onboarding/onboarding.errors";
import { getOnboardingFlowService } from "@/modules/onboarding/services/onboarding.service";
import { onboardingKeyParamsSchema } from "@/modules/onboarding/validations/onboarding.validation";

export async function getOnboardingFlowHandler(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const session = await requireAuth();
    const { key } = onboardingKeyParamsSchema.parse(await params);

    const result = await getOnboardingFlowService({
      key,
      userId: session.user.id,
      globalRole: session.user.globalRole,
      requestHeaders: request.headers,
    });

    return ApiResponse.ok(result);
  } catch (error) {
    return handleOnboardingHttpError(error, "[onboarding GET]");
  }
}

