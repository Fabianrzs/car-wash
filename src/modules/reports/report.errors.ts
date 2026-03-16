import { createModuleErrorClass, createModuleErrorHandler } from "@/lib/http/module-error-factory";

export const ReportModuleError = createModuleErrorClass("Report");

export const handleReportHttpError = createModuleErrorHandler(
  "Reporte",
  "Parámetros de reporte inválidos"
);

