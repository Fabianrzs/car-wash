import { createClientHandler } from "@/modules/clients/handlers/create-client.handler";
import { getClientsHandler } from "@/modules/clients/handlers/get-clients.handler";

export const GET = getClientsHandler;
export const POST = createClientHandler;

