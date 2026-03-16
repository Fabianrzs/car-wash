import {
  createModuleErrorClass,
  createModuleErrorHandler,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/http/module-error-factory";

export const ServiceModuleError = createModuleErrorClass("Service");

export { unauthorizedResponse, forbiddenResponse };

export const handleServiceHttpError = createModuleErrorHandler(
  "Servicio",
  "Datos de servicio inválidos"
);

