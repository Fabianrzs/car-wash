import { VehicleModuleError } from "@/modules/vehicles/vehicle.errors";
import { vehicleRepository } from "@/modules/vehicles/repositories/vehicle.repository";
import {
  buildVehicleWritePayload,
  normalizeClientIds,
} from "@/modules/vehicles/vehicle.utils";
import { type VehicleInput } from "@/modules/vehicles/validations/vehicle.validation";

interface CreateVehicleServiceInput {
  tenantId: string;
  data: VehicleInput;
}

export async function createVehicleService({
  tenantId,
  data,
}: CreateVehicleServiceInput) {
  const vehicleData = buildVehicleWritePayload(data);
  const clientIds = normalizeClientIds(data.clientIds);

  const existingVehicle = await vehicleRepository.findFirst({
    where: {
      plate: vehicleData.plate,
      tenantId,
    },
    select: { id: true },
  });

  if (existingVehicle) {
    throw new VehicleModuleError("Ya existe un vehiculo con esa placa", 400);
  }

  return vehicleRepository.withTransaction(async (database) => {
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

    const created = await vehicleRepository.create(
      {
        data: {
          ...vehicleData,
          tenant: { connect: { id: tenantId } },
        },
      },
      database
    );

    await vehicleRepository.createManyClientVehicles(
      {
        data: clientIds.map((clientId) => ({
          clientId,
          vehicleId: created.id,
          tenantId,
        })),
      },
      database
    );

    return vehicleRepository.findFirst(
      {
        where: { id: created.id, tenantId },
        include: vehicleRepository.mutationInclude,
      },
      database
    );
  });
}

