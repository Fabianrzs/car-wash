import { handleApiError } from "@/lib/http";

export function handleOnboardingHttpError(error: unknown, contextMessage: string) {
  return handleApiError(error, {
    contextMessage,
    validationMessage: "Parametros de onboarding invalidos",
  });
}

