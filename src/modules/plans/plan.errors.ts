import { createModuleErrorClass, createModuleErrorHandler } from "@/lib/http/module-error-factory";

export const PlanModuleError = createModuleErrorClass("Plan");

export const handlePlanHttpError = createModuleErrorHandler(
  "Plan",
  "Datos de plan inválidos"
);

