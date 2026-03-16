import {TenantError} from "@/lib";
import { ApiResponse } from "@/lib/http/response";

export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = "No autorizado") {
    super(message, 401);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = "No tienes permisos para realizar esta accion") {
    super(message, 403);
    this.name = "ForbiddenError";
  }
}

interface HandleApiErrorOptions {
  contextMessage: string;
  validationMessage: string;
}

export function handleApiError(
  error: unknown,
  {
    contextMessage,
    validationMessage,
  }: HandleApiErrorOptions
) {
  if (error instanceof TenantError) {
    if (error.status === 404) {
      return ApiResponse.notFound(error.message);
    }

    if (error.status === 403) {
      return ApiResponse.forbidden(error.message);
    }

    if (error.status === 401) {
      return ApiResponse.unauthorized(error.message);
    }

    return ApiResponse.badRequest(error.message);
  }

  if (error instanceof ZodError) {
    return ApiResponse.badRequest(validationMessage, error.flatten());
  }

  if (error instanceof HttpError) {
    if (error.status === 401) {
      return ApiResponse.unauthorized(error.message);
    }

    if (error.status === 403) {
      return ApiResponse.forbidden(error.message);
    }

    if (error.status === 404) {
      return ApiResponse.notFound(error.message);
    }

    if (error.status === 400) {
      return ApiResponse.badRequest(error.message, error.details);
    }

    return ApiResponse.serverError(error.message);
  }

  console.error(contextMessage, error);
  return ApiResponse.serverError();
}

