import { attachVehicleClientHandler } from "@/modules/vehicles/handlers/attach-vehicle-client.handler";
import { detachVehicleClientHandler } from "@/modules/vehicles/handlers/detach-vehicle-client.handler";

export const POST = attachVehicleClientHandler;
export const DELETE = detachVehicleClientHandler;

