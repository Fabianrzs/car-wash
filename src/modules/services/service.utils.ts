import { type ServiceTypeInput } from "@/modules/services/validations/service.validation";

function normalizeText(value: string) {
  return value.trim();
}

export function normalizeOptionalText(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function buildServiceWritePayload(data: ServiceTypeInput) {
  return {
    name: normalizeText(data.name),
    description: normalizeOptionalText(data.description),
    price: data.price,
    duration: data.duration,
    isActive: data.isActive,
  };
}

