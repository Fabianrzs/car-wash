import { createModuleErrorClass, createModuleErrorHandler } from "@/lib/http/module-error-factory";

export const UsersModuleError = createModuleErrorClass("Users");

export const handleUsersHttpError = createModuleErrorHandler(
  "Usuario",
  "Parámetros de usuarios inválidos"
);


