import { createModuleErrorClass, createModuleErrorHandler } from "@/lib/http/module-error-factory";

export const TenantsModuleError = createModuleErrorClass("Tenants");

export const handleTenantsHttpError = createModuleErrorHandler(
  "Tenant",
  "Parámetros de tenants inválidos"
);


