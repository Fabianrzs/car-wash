import { deleteClientHandler } from "@/modules/clients/handlers/delete-client.handler";
import { getClientByIdHandler } from "@/modules/clients/handlers/get-client-by-id.handler";
import { updateClientHandler } from "@/modules/clients/handlers/update-client.handler";

export const GET = getClientByIdHandler;
export const PUT = updateClientHandler;
export const DELETE = deleteClientHandler;

