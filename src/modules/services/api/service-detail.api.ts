import { deleteServiceHandler } from "@/modules/services/handlers/delete-service.handler";
import { getServiceByIdHandler } from "@/modules/services/handlers/get-service-by-id.handler";
import { updateServiceHandler } from "@/modules/services/handlers/update-service.handler";

export const GET = getServiceByIdHandler;
export const PUT = updateServiceHandler;
export const DELETE = deleteServiceHandler;

