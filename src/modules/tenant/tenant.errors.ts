import { createModuleErrorClass, createModuleErrorHandler } from "@/lib/http/module-error-factory";

export const TenantModuleError = createModuleErrorClass("Tenant");

export const handleTenantHttpError = createModuleErrorHandler(
  "Tenant",
  "Datos de tenant inválidos"
);

