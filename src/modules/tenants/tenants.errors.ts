import { handleApiError, HttpError } from "@/lib/http";

export class TenantsModuleError extends HttpError {
  constructor(message: string, status: number, details?: unknown) {
    super(message, status, details);
    this.name = "TenantsModuleError";
  }
}

export function handleTenantsHttpError(error: unknown, contextMessage: string) {
  return handleApiError(error, {
    contextMessage,
    validationMessage: "Parametros de tenants invalidos",
  });
}

