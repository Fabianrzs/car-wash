import { ServiceModuleError } from "@/modules/services/service.errors";
import { serviceRepository } from "@/modules/services/repositories/service.repository";

interface GetServiceDetailServiceInput {
  tenantId: string;
  serviceId: string;
}

export async function getServiceDetailService({
  tenantId,
  serviceId,
}: GetServiceDetailServiceInput) {
  const service = await serviceRepository.findFirst({
    where: {
      id: serviceId,
      tenantId,
    },
  });

  if (!service) {
    throw new ServiceModuleError("Servicio no encontrado", 404);
  }

  return service;
}

