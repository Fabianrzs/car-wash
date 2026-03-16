import { handleApiError } from "@/lib/http";

export function handleAdminHttpError(error: unknown, contextMessage: string) {
  return handleApiError(error, {
    contextMessage,
    validationMessage: "Parametros de admin invalidos",
  });
}

