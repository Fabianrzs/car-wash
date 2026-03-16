import { createVehicleHandler } from "@/modules/vehicles/handlers/create-vehicle.handler";
import { getVehiclesHandler } from "@/modules/vehicles/handlers/get-vehicles.handler";

export const GET = getVehiclesHandler;
export const POST = createVehicleHandler;

