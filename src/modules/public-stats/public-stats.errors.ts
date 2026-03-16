import { createModuleErrorClass, createModuleErrorHandler } from "@/lib/http/module-error-factory";

export const PublicStatsModuleError = createModuleErrorClass("PublicStats");

export const handlePublicStatsHttpError = createModuleErrorHandler(
  "Estadísticas",
  "Error obteniendo estadísticas públicas"
);

