import { createModuleErrorClass, createModuleErrorHandler } from "@/lib/http/module-error-factory";

export const StatsModuleError = createModuleErrorClass("Stats");

export const handleStatsHttpError = createModuleErrorHandler(
  "Estadísticas",
  "Error de estadísticas"
);


