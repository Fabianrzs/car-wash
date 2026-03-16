import {
  deleteFlowTenantHandler,
  getFlowTenantsHandler,
  upsertFlowTenantHandler,
} from "@/modules/onboarding/handlers/admin-flow-tenants.handler";

export const GET = getFlowTenantsHandler;
export const POST = upsertFlowTenantHandler;
export const DELETE = deleteFlowTenantHandler;


