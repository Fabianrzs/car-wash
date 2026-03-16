// Public API exports for vehicles module
export { handleVehicleHttpError } from "@/modules/vehicles/vehicle.errors";
export { vehicleRepository } from "@/modules/vehicles/repositories/vehicle.repository";
export { createVehicleService } from "@/modules/vehicles/services/create-vehicle.service";
export { deleteVehicleService } from "@/modules/vehicles/services/delete-vehicle.service";
export { getVehicleDetailService } from "@/modules/vehicles/services/get-vehicle-detail.service";
export { listVehiclesService } from "@/modules/vehicles/services/list-vehicles.service";
export { updateVehicleService } from "@/modules/vehicles/services/update-vehicle.service";
export { attachVehicleClientService } from "@/modules/vehicles/services/attach-vehicle-client.service";
export { detachVehicleClientService } from "@/modules/vehicles/services/detach-vehicle-client.service";
export type { VehicleInput } from "@/modules/vehicles/validations/vehicle.validation";


