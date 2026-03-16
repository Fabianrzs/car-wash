import {
  createTenantHandler,
  getTenantsHandler,
} from "@/modules/tenants/handlers/get-tenants.handler";

export const GET = getTenantsHandler;
export const POST = createTenantHandler;


