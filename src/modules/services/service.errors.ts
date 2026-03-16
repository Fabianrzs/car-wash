import { ZodError } from "zod";
import { NextResponse } from "next/server";
import { TenantError, handleTenantError } from "@/lib/tenant";

export class ServiceModuleError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ServiceModuleError";
  }
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}

export function forbiddenResponse() {
  return NextResponse.json(
    { error: "No tienes permisos para realizar esta accion" },
    { status: 403 }
  );
}

export function handleServiceHttpError(error: unknown, contextMessage: string) {
  if (error instanceof TenantError) {
    return handleTenantError(error);
  }

  if (error instanceof ServiceModuleError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Datos de servicio invalidos",
        details: error.flatten(),
      },
      { status: 400 }
    );
  }

  console.error(contextMessage, error);
  return NextResponse.json(
    { error: "Error interno del servidor" },
    { status: 500 }
  );
}

