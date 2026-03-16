import { clientRepository } from "@/modules/clients/repositories/client.repository";
import { type CreateClientInput } from "@/modules/clients/validations/client.validation";
import {
  buildClientWritePayload,
  buildVehicleWritePayload,
} from "@/modules/clients/client.utils";
import { ClientModuleError } from "@/modules/clients/client.errors";

interface CreateClientServiceInput {
  tenantId: string;
  data: CreateClientInput;
}

export async function createClientService({
  tenantId,
  data,
}: CreateClientServiceInput) {
  const clientData = buildClientWritePayload(data);

  if (clientData.email) {
    const existingClient = await clientRepository.findFirst({
      where: {
        tenantId,
        email: clientData.email,
      },
      select: { id: true },
    });

    if (existingClient) {
      throw new ClientModuleError("Ya existe un cliente con ese email", 400);
    }
  }

  return clientRepository.withTransaction(async (database) => {
    const client = await clientRepository.create(
      {
        data: {
          ...clientData,
          tenant: { connect: { id: tenantId } },
        },
      },
      database
    );

    if (!data.vehicle) {
      return client;
    }

    const vehicleData = buildVehicleWritePayload(data.vehicle);
    const existingVehicle = await clientRepository.findFirstVehicle(
      {
        where: {
          tenantId,
          plate: vehicleData.plate,
        },
        select: { id: true },
      },
      database
    );

    if (existingVehicle) {
      throw new ClientModuleError("Ya existe un vehiculo con esa placa", 400);
    }

    const vehicle = await clientRepository.createVehicle(
      {
        data: {
          ...vehicleData,
          tenant: { connect: { id: tenantId } },
        },
      },
      database
    );

    await clientRepository.createClientVehicle(
      {
        data: {
          clientId: client.id,
          vehicleId: vehicle.id,
          tenantId,
        },
      },
      database
    );

    return client;
  });
}

