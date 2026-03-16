import { ApiResponse } from "@/lib/http/response";
import { HttpError, handleApiError } from "@/lib/http/errors";

export class VehicleModuleError extends HttpError {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message, status);
    this.name = "VehicleModuleError";
  }
}

export function unauthorizedResponse() {
  return ApiResponse.unauthorized();
}

export function handleVehicleHttpError(error: unknown, contextMessage: string) {
  return handleApiError(error, {
    contextMessage,
    validationMessage: "Datos de vehiculo invalidos",
  });
}

