import { createModuleErrorClass, createModuleErrorHandler } from "@/lib/http/module-error-factory";

export const UserModuleError = createModuleErrorClass("User");

export const handleUserHttpError = createModuleErrorHandler(
  "User",
  "Datos de usuario inválidos"
);

