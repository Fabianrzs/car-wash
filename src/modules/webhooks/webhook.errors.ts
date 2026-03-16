import { createModuleErrorClass, createModuleErrorHandler } from "@/lib/http/module-error-factory";

export const WebhookModuleError = createModuleErrorClass("Webhook");

export const handleWebhookHttpError = createModuleErrorHandler(
  "Webhook",
  "Error procesando webhook"
);

