import { VehicleModuleError } from "@/modules/vehicles/vehicle.errors";
import { vehicleRepository } from "@/modules/vehicles/repositories/vehicle.repository";

interface DeleteVehicleServiceInput {
  tenantId: string;
  vehicleId: string;
}

export async function deleteVehicleService({
  tenantId,
  vehicleId,
}: DeleteVehicleServiceInput) {
  const existingVehicle = await vehicleRepository.findFirst({
    where: {
      id: vehicleId,
      tenantId,
    },
    select: { id: true },
  });

  if (!existingVehicle) {
    throw new VehicleModuleError("Vehiculo no encontrado", 404);
  }

  const activeOrders = await vehicleRepository.countServiceOrders({
    where: {
      vehicleId,
      tenantId,
      status: {
        in: [...vehicleRepository.activeOrderStatuses],
      },
    },
  });

  if (activeOrders > 0) {
    throw new VehicleModuleError(
      "No se puede eliminar el vehiculo porque tiene ordenes activas",
      400
    );
  }

  await vehicleRepository.delete({
    where: { id: vehicleId },
  });

  return {
    message: "Vehiculo eliminado correctamente",
  };
}

