import { createModuleErrorClass, createModuleErrorHandler } from "@/lib/http/module-error-factory";

export const InviteModuleError = createModuleErrorClass("Invite");

export const handleInviteHttpError = createModuleErrorHandler(
  "Invitación",
  "Token de invitación inválido"
);

