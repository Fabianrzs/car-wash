import { ServiceModuleError } from "@/modules/services/service.errors";
import { serviceRepository } from "@/modules/services/repositories/service.repository";
import { buildServiceWritePayload } from "@/modules/services/service.utils";
import { type ServiceTypeInput } from "@/modules/services/validations/service.validation";

interface UpdateServiceServiceInput {
  tenantId: string;
  serviceId: string;
  data: ServiceTypeInput;
}

export async function updateServiceService({
  tenantId,
  serviceId,
  data,
}: UpdateServiceServiceInput) {
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

  const serviceData = buildServiceWritePayload(data);

  const duplicateName = await serviceRepository.findFirst({
    where: {
      name: serviceData.name,
      tenantId,
      id: { not: serviceId },
    },
    select: { id: true },
  });

  if (duplicateName) {
    throw new ServiceModuleError("Ya existe otro servicio con ese nombre", 400);
  }

  return serviceRepository.update({
    where: { id: serviceId },
    data: serviceData,
  });
}

