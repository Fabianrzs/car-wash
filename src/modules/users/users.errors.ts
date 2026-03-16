import { createModuleErrorHandler } from "@/lib/http/module-error-factory";

export const handleUsersHttpError = createModuleErrorHandler(
  "Usuario",
  "Parámetros de usuarios inválidos"
);


