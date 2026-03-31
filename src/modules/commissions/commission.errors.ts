import { createModuleErrorClass, createModuleErrorHandler } from "@/lib/http/module-error-factory";

export const CommissionModuleError = createModuleErrorClass("Commission");

export const handleCommissionHttpError = createModuleErrorHandler(
  "Comisión",
  "Datos de comisión inválidos"
);
