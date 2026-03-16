import { handleApiError, HttpError } from "@/lib/http";

export class ReportModuleError extends HttpError {
  constructor(message: string, status: number, details?: unknown) {
    super(message, status, details);
    this.name = "ReportModuleError";
  }
}

export function handleReportHttpError(error: unknown, contextMessage: string) {
  return handleApiError(error, {
    contextMessage,
    validationMessage: "Parametros de reporte invalidos",
  });
}

