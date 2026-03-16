// Public API exports for clients module
export { handleClientHttpError } from "@/modules/clients/client.errors";
export { buildClientFilter } from "@/modules/clients/filters/client.filter";
export { clientRepository } from "@/modules/clients/repositories/client.repository";
export { createClientService } from "@/modules/clients/services/create-client.service";
export { deleteClientService } from "@/modules/clients/services/delete-client.service";
export { getClientDetailService } from "@/modules/clients/services/get-client-detail.service";
export { getClientHistoryService } from "@/modules/clients/services/get-client-history.service";
export { listClientsService } from "@/modules/clients/services/list-clients.service";
export { updateClientService } from "@/modules/clients/services/update-client.service";
export {
  clientSchema,
  clientIdParamsSchema,
  listClientsQuerySchema,
  clientHistoryQuerySchema,
} from "@/modules/clients/validations/client.validation";
export type {
  CreateClientInput,
  UpdateClientInput,
  ClientIdParams,
  ListClientsQuery,
  ClientHistoryQuery,
} from "@/modules/clients/validations/client.validation";


