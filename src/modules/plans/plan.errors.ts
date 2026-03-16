import { handleApiError, HttpError } from "@/lib/http";

export class PlanModuleError extends HttpError {
  constructor(message: string, status: number, details?: unknown) {
    super(message, status, details);
    this.name = "PlanModuleError";
  }
}

export function handlePlanHttpError(error: unknown, contextMessage: string) {
  return handleApiError(error, {
    contextMessage,
    validationMessage: "Datos de plan invalidos",
  });
}

