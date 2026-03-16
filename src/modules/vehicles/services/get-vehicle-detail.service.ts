import { VehicleModuleError } from "@/modules/vehicles/vehicle.errors";
import { vehicleRepository } from "@/modules/vehicles/repositories/vehicle.repository";

interface GetVehicleDetailServiceInput {
  tenantId: string;
  vehicleId: string;
}

export async function getVehicleDetailService({
  tenantId,
  vehicleId,
}: GetVehicleDetailServiceInput) {
  const vehicle = await vehicleRepository.findFirst({
    where: { id: vehicleId, tenantId },
    include: vehicleRepository.detailInclude,
  });

  if (!vehicle) {
    throw new VehicleModuleError("Vehiculo no encontrado", 404);
  }

  return vehicle;
}

