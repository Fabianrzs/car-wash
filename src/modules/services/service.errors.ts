import { ApiResponse } from "@/lib/http/response";
import { HttpError, handleApiError } from "@/lib/http/errors";

export class ServiceModuleError extends HttpError {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message, status);
    this.name = "ServiceModuleError";
  }
}

export function unauthorizedResponse() {
  return ApiResponse.unauthorized();
}

export function forbiddenResponse() {
  return ApiResponse.forbidden();
}

export function handleServiceHttpError(error: unknown, contextMessage: string) {
  return handleApiError(error, {
    contextMessage,
    validationMessage: "Datos de servicio invalidos",
  });
}

