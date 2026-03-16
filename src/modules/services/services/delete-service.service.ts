import { ServiceModuleError } from "@/modules/services/service.errors";
import { serviceRepository } from "@/modules/services/repositories/service.repository";

interface DeleteServiceServiceInput {
  tenantId: string;
  serviceId: string;
}

export async function deleteServiceService({
  tenantId,
  serviceId,
}: DeleteServiceServiceInput) {
  const existingService = await serviceRepository.findFirst({
    where: {
      id: serviceId,
      tenantId,
    },
    select: { id: true },
  });

  if (!existingService) {
    throw new ServiceModuleError("Servicio no encontrado", 404);
  }

  await serviceRepository.update({
    where: { id: serviceId },
    data: { isActive: false },
  });

  return {
    message: "Servicio desactivado correctamente",
  };
}

