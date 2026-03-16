import {
  createModuleErrorClass,
  createModuleErrorHandler,
  unauthorizedResponse,
} from "@/lib/http/module-error-factory";

export const VehicleModuleError = createModuleErrorClass("Vehicle");

export { unauthorizedResponse };

export const handleVehicleHttpError = createModuleErrorHandler(
  "Vehículo",
  "Datos de vehículo inválidos"
);

