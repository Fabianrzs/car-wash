import { vehicleRepository } from "@/modules/vehicles/repositories/vehicle.repository";
import { buildVehicleFilter } from "@/modules/vehicles/filters/vehicle.filter";

interface ListVehiclesServiceInput {
  tenantId: string;
  page: number;
  take: number;
  search: string;
  clientId: string;
}

export async function listVehiclesService({
  tenantId,
  page,
  take,
  search,
  clientId,
}: ListVehiclesServiceInput) {
  const where = buildVehicleFilter({ tenantId, search, clientId });

  const skip = (page - 1) * take;

  const [vehicles, total] = await Promise.all([
    vehicleRepository.findMany({
      where,
      include: vehicleRepository.listInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    vehicleRepository.count({ where }),
  ]);

  return {
    vehicles,
    total,
    pages: Math.ceil(total / take),
  };
}

