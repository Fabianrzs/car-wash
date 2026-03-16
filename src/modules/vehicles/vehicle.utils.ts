import { type VehicleInput } from "@/modules/vehicles/validations/vehicle.validation";

function normalizeText(value: string) {
  return value.trim();
}

export function normalizeOptionalText(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function normalizePlate(value: string) {
  return value.trim().toUpperCase();
}

export function buildVehicleWritePayload(data: VehicleInput) {
  return {
    plate: normalizePlate(data.plate),
    brand: normalizeText(data.brand),
    model: normalizeText(data.model),
    year: data.year ?? null,
    color: normalizeOptionalText(data.color),
    vehicleType: data.vehicleType,
  };
}

export function normalizeClientIds(clientIds: string[]) {
  return [...new Set(clientIds.map((clientId) => clientId.trim()).filter(Boolean))];
}

