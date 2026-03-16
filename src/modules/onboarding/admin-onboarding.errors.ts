import { handleApiError, HttpError } from "@/lib/http";

export class OnboardingError extends HttpError {
  constructor(message: string, status: number, details?: unknown) {
    super(message, status, details);
    this.name = "OnboardingError";
  }
}

export function handleOnboardingHttpError(error: unknown, contextMessage: string) {
  return handleApiError(error, {
    contextMessage,
    validationMessage: "Datos de onboarding invalidos",
  });
}


