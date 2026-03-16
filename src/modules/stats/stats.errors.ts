import { handleApiError } from "@/lib/http";

export function handleStatsHttpError(error: unknown, contextMessage: string) {
  return handleApiError(error, {
    contextMessage,
    validationMessage: "Error de estadisticas",
  });
}

