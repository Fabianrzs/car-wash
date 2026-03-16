import { type ServiceTypeInput } from "@/modules/services/validations/service.validation";
import { normalizeText, normalizeOptionalText } from "@/lib/utils/normalization";

export function buildServiceWritePayload(data: ServiceTypeInput) {
  return {
    name: normalizeText(data.name),
    description: normalizeOptionalText(data.description),
    price: data.price,
    duration: data.duration,
    isActive: data.isActive,
  };
}

