/**
 * Generic error handling factory for modules
 * Provides consistent error handling across all modules
 */

import { ApiResponse } from "@/lib/http/response";
import { HttpError, handleApiError } from "@/lib/http/errors";

/**
 * Base error class for any module
 */
export class ModuleError extends HttpError {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown
  ) {
    super(message, status, details);
    this.name = "ModuleError";
  }
}

/**
 * Factory to create module-specific error classes
 */
export function createModuleErrorClass(moduleName: string) {
  return class extends HttpError {
    constructor(
      message: string,
      public readonly status: number,
      public readonly details?: unknown
    ) {
      super(message, status, details);
      this.name = `${moduleName}ModuleError`;
    }
  };
}

/**
 * Create HTTP error handler for a specific module
 */
export function createModuleErrorHandler(
  moduleName: string,
  validationMessageOverride?: string
) {
  return (error: unknown, contextMessage: string) => {
    return handleApiError(error, {
      contextMessage,
      validationMessage:
        validationMessageOverride || `Datos de ${moduleName.toLowerCase()} inválidos`,
    });
  };
}

/**
 * Standard response helpers
 */
export function unauthorizedResponse() {
  return ApiResponse.unauthorized();
}

export function forbiddenResponse() {
  return ApiResponse.forbidden();
}

export function conflictResponse(message?: string) {
  return ApiResponse.conflict(message);
}

export function notFoundResponse(message?: string) {
  return ApiResponse.notFound(message);
}

