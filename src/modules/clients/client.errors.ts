import { createModuleErrorClass, createModuleErrorHandler } from "@/lib/http/module-error-factory";

export const ClientModuleError = createModuleErrorClass("Client");

export const handleClientHttpError = createModuleErrorHandler(
  "Cliente",
  "Datos de cliente inválidos"
);

