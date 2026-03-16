import { createModuleErrorClass, createModuleErrorHandler } from "@/lib/http/module-error-factory";

export const AuthModuleError = createModuleErrorClass("Auth");

export const handleAuthHttpError = createModuleErrorHandler(
  "Auth",
  "Datos de autenticación inválidos"
);

