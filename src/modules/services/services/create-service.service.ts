import { ServiceModuleError } from "@/modules/services/service.errors";
import { serviceRepository } from "@/modules/services/repositories/service.repository";
import { buildServiceWritePayload } from "@/modules/services/service.utils";
import { type ServiceTypeInput } from "@/modules/services/validations/service.validation";

interface CreateServiceServiceInput {
  tenantId: string;
  data: ServiceTypeInput;
}

export async function createServiceService({
  tenantId,
  data,
}: CreateServiceServiceInput) {
  const serviceData = buildServiceWritePayload(data);

  const existingService = await serviceRepository.findFirst({
    where: {
      name: serviceData.name,
      tenantId,
    },
    select: { id: true },
  });

  if (existingService) {
    throw new ServiceModuleError("Ya existe un servicio con ese nombre", 400);
  }

  return serviceRepository.create({
    data: {
      ...serviceData,
      tenant: { connect: { id: tenantId } },
    },
  });
}

