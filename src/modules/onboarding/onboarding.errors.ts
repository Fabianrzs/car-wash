import { createModuleErrorClass, createModuleErrorHandler } from "@/lib/http/module-error-factory";

export const OnboardingModuleError = createModuleErrorClass("Onboarding");

export const handleOnboardingHttpError = createModuleErrorHandler(
  "Onboarding",
  "Parametros de onboarding invalidos"
);


