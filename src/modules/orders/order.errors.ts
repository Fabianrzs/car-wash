import { HttpError, handleApiError } from "@/lib/http/errors";

export class OrderModuleError extends HttpError {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown
  ) {
    super(message, status, details);
    this.name = "OrderModuleError";
  }
}

export function handleOrderHttpError(error: unknown, contextMessage: string) {
  return handleApiError(error, {
    contextMessage,
    validationMessage: "Datos de orden invalidos",
  });
}

