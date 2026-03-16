import {
  deactivateTenantHandler,
  getTenantByIdHandler,
  updateTenantHandler,
} from "@/modules/tenants/handlers/get-tenant-detail.handler";

export const GET = getTenantByIdHandler;
export const PUT = updateTenantHandler;
export const DELETE = deactivateTenantHandler;


