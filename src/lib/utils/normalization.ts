/**
 * Centralized normalization utilities for consistent data processing
 * Reduces duplication across modules
 */

/**
 * Normalize text by trimming whitespace
 */
export function normalizeText(value: string): string {
  return value.trim();
}

/**
 * Normalize optional text by trimming or returning null
 */
export function normalizeOptionalText(value?: string | null): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

/**
 * Normalize plate by trimming and converting to uppercase
 */
export function normalizePlate(value: string): string {
  return value.trim().toUpperCase();
}

/**
 * Generic write payload builder for common fields
 */
export interface WritePayloadBuilderOptions {
  trimText?: boolean;
  uppercase?: boolean;
}

/**
 * Build normalized object for any entity write operation
 */
export function buildNormalizedPayload<T extends Record<string, any>>(
  data: T,
  options: WritePayloadBuilderOptions = {}
): T {
  const { trimText = true } = options;

  if (!trimText) return data;

  const result: any = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "string") {
      result[key] = normalizeText(value);
    } else if (value === null || value === undefined) {
      result[key] = value;
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

