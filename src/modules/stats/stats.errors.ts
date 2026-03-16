import { createModuleErrorHandler } from "@/lib/http/module-error-factory";

export const handleStatsHttpError = createModuleErrorHandler(
  "Estadísticas",
  "Error de estadísticas"
);


