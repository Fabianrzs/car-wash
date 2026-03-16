import { VehicleModuleError } from "@/modules/vehicles/vehicle.errors";
import { vehicleRepository } from "@/modules/vehicles/repositories/vehicle.repository";

interface AttachVehicleClientServiceInput {
  tenantId: string;
  vehicleId: string;
  clientId: string;
}

export async function attachVehicleClientService({
  tenantId,
  vehicleId,
  clientId,
}: AttachVehicleClientServiceInput) {
  const [vehicle, client] = await Promise.all([
    vehicleRepository.findTenantVehicleById(tenantId, vehicleId),
    vehicleRepository.findTenantClientById(tenantId, clientId),
  ]);

  if (!vehicle) {
    throw new VehicleModuleError("Vehiculo no encontrado", 404);
  }

  if (!client) {
    throw new VehicleModuleError("Cliente no encontrado", 404);
  }

  return vehicleRepository.upsertClientVehicle({
    where: { clientId_vehicleId: { clientId, vehicleId } },
    create: { clientId, vehicleId, tenantId },
    update: {},
  });
}

