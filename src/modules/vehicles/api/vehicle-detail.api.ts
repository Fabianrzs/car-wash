import { deleteVehicleHandler } from "@/modules/vehicles/handlers/delete-vehicle.handler";
import { getVehicleByIdHandler } from "@/modules/vehicles/handlers/get-vehicle-by-id.handler";
import { updateVehicleHandler } from "@/modules/vehicles/handlers/update-vehicle.handler";

export const GET = getVehicleByIdHandler;
export const PUT = updateVehicleHandler;
export const DELETE = deleteVehicleHandler;

