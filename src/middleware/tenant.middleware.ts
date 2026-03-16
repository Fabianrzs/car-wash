import {
  requireTenant,
  requireTenantMember,
} from "@/lib/multitenancy/tenant";
import { ForbiddenError } from "@/lib/http/errors";

export async function requireTenantContext(requestHeaders?: Headers) {
  return requireTenant(requestHeaders);
}

export async function requireTenantAccess(
  userId: string,
  tenantId: string,
  globalRole?: string
) {
  return requireTenantMember(userId, tenantId, globalRole);
}

export async function ensureManagementAccess(
  userId: string,
  tenantId: string,
  globalRole?: string
) {
  const tenantUser = await requireTenantAccess(userId, tenantId, globalRole);

  if (tenantUser.role === "EMPLOYEE") {
    throw new ForbiddenError();
  }

  return tenantUser;
}

