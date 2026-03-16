import { ClientModuleError } from "@/modules/clients/client.errors";
import { clientRepository } from "@/modules/clients/repositories/client.repository";

interface DeleteClientServiceInput {
  tenantId: string;
  clientId: string;
}

export async function deleteClientService({
  tenantId,
  clientId,
}: DeleteClientServiceInput) {
  const existingClient = await clientRepository.findFirst({
    where: {
      id: clientId,
      tenantId,
    },
    select: { id: true },
  });

  if (!existingClient) {
    throw new ClientModuleError("Cliente no encontrado", 404);
  }

  const activeOrders = await clientRepository.countServiceOrders({
    where: {
      clientId,
      tenantId,
      status: {
        in: [...clientRepository.activeOrderStatuses],
      },
    },
  });

  if (activeOrders > 0) {
    throw new ClientModuleError(
      "No se puede eliminar el cliente porque tiene ordenes activas",
      400
    );
  }

  await clientRepository.delete({
    where: { id: clientId },
  });

  return { message: "Cliente eliminado correctamente" };
}

