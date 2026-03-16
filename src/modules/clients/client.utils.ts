import { type CreateClientInput } from "@/modules/clients/validations/client.validation";

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

export function buildClientWritePayload(data: CreateClientInput) {
  return {
    firstName: normalizeText(data.firstName),
    lastName: normalizeText(data.lastName),
    email: normalizeOptionalText(data.email),
    phone: normalizeText(data.phone),
    address: normalizeOptionalText(data.address),
    notes: normalizeOptionalText(data.notes),
    isFrequent: data.isFrequent,
  };
}

export function buildVehicleWritePayload(vehicle: NonNullable<CreateClientInput["vehicle"]>) {
  return {
    plate: normalizePlate(vehicle.plate),
    brand: normalizeText(vehicle.brand),
    model: normalizeText(vehicle.model),
    year: vehicle.year ?? null,
    color: normalizeOptionalText(vehicle.color),
    vehicleType: vehicle.vehicleType,
  };
}

