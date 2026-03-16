import { handleApiError } from "@/lib/http";

export function handleUsersHttpError(error: unknown, contextMessage: string) {
  return handleApiError(error, {
    contextMessage,
    validationMessage: "Parametros de usuarios invalidos",
  });
}

