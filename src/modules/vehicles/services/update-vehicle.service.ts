import { VehicleModuleError } from "@/modules/vehicles/vehicle.errors";
import { vehicleRepository } from "@/modules/vehicles/repositories/vehicle.repository";
import { runTransaction } from "@/database/transaction-manager";
import {
  buildVehicleWritePayload,
  normalizeClientIds,
} from "@/modules/vehicles/vehicle.utils";
import { type VehicleInput } from "@/modules/vehicles/validations/vehicle.validation";

interface UpdateVehicleServiceInput {
  tenantId: string;
  vehicleId: string;
  data: VehicleInput;
}

export async function updateVehicleService({
  tenantId,
  vehicleId,
  data,
}: UpdateVehicleServiceInput) {
  const existingVehicle = await vehicleRepository.findTenantVehicleById(
    tenantId,
    vehicleId
  );

  if (!existingVehicle) {
    throw new VehicleModuleError("Vehiculo no encontrado", 404);
  }

  const vehicleData = buildVehicleWritePayload(data);
  const clientIds = normalizeClientIds(data.clientIds);

  const duplicatePlate = await vehicleRepository.findFirst({
    where: {
      plate: vehicleData.plate,
      tenantId,
      id: { not: vehicleId },
    },
    select: { id: true },
  });

  if (duplicatePlate) {
    throw new VehicleModuleError("Ya existe otro vehiculo con esa placa", 400);
  }

  return runTransaction(async (database) => {
    const validClients = await vehicleRepository.findManyClients(
      {
        where: {
          id: { in: clientIds },
          tenantId,
        },
        select: { id: true },
      },
      database
    );

    if (validClients.length !== clientIds.length) {
      throw new VehicleModuleError(
        "Uno o mas clientes no pertenecen a este lavadero",
        400
      );
    }

    await vehicleRepository.update(
      {
        where: { id: vehicleId },
        data: vehicleData,
      },
      database
    );

    await vehicleRepository.deleteManyClientVehicles(
      {
        where: {
          vehicleId,
        },
      },
      database
    );

    await vehicleRepository.createManyClientVehicles(
      {
        data: clientIds.map((clientId) => ({
          clientId,
          vehicleId,
          tenantId,
        })),
      },
      database
    );

    return vehicleRepository.findFirst(
      {
        where: { id: vehicleId, tenantId },
        include: vehicleRepository.mutationInclude,
      },
      database
    );
  });
}

