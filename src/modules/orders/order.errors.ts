import { createModuleErrorClass, createModuleErrorHandler } from "@/lib/http/module-error-factory";

export const OrderModuleError = createModuleErrorClass("Order");

export const handleOrderHttpError = createModuleErrorHandler(
  "Orden",
  "Datos de orden inválidos"
);

