import { createServiceHandler } from "@/modules/services/handlers/create-service.handler";
import { getServicesHandler } from "@/modules/services/handlers/get-services.handler";

export const GET = getServicesHandler;
export const POST = createServiceHandler;

