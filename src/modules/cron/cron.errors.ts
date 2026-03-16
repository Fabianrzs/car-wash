import { createModuleErrorClass, createModuleErrorHandler } from "@/lib/http/module-error-factory";

export const CronModuleError = createModuleErrorClass("Cron");

export const handleCronHttpError = createModuleErrorHandler(
  "Cron",
  "Error en tarea programada"
);

