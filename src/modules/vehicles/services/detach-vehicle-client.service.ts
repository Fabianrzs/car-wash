import { VehicleModuleError } from "@/modules/vehicles/vehicle.errors";
import { vehicleRepository } from "@/modules/vehicles/repositories/vehicle.repository";

interface DetachVehicleClientServiceInput {
  tenantId: string;
  vehicleId: string;
  clientId: string;
}

export async function detachVehicleClientService({
  tenantId,
  vehicleId,
  clientId,
}: DetachVehicleClientServiceInput) {
  const activeOrders = await vehicleRepository.countServiceOrders({
    where: {
      vehicleId,
      clientId,
      tenantId,
      status: {
        in: [...vehicleRepository.activeOrderStatuses],
      },
    },
  });

  if (activeOrders > 0) {
    throw new VehicleModuleError(
      "No se puede desasociar el cliente porque tiene ordenes activas con este vehiculo",
      400
    );
  }

  await vehicleRepository.deleteManyClientVehicles({
    where: {
      clientId,
      vehicleId,
    },
  });

  return {
    message: "Asociacion eliminada correctamente",
  };
}

