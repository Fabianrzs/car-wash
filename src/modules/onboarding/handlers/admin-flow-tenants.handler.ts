import { ApiResponse } from "@/lib/http";
import { requireSuperAdmin } from "@/middleware/admin.middleware";
import { handleOnboardingHttpError } from "@/modules/onboarding/admin-onboarding.errors";
import {
  deleteFlowTenantOverrideService,
  listFlowTenantOverridesService,
  upsertFlowTenantOverrideService,
} from "@/modules/onboarding/services/admin-onboarding.service";
import {
  flowIdParamsSchema,
  flowTenantDeleteQuerySchema,
  upsertFlowTenantOverrideSchema,
} from "@/modules/onboarding/validations/admin-onboarding.validation";

export async function getFlowTenantsHandler(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id } = flowIdParamsSchema.parse(await params);
    const overrides = await listFlowTenantOverridesService(id);
    return ApiResponse.ok(overrides);
  } catch (error) {
    return handleOnboardingHttpError(error, "[admin/onboarding/:id/tenants GET]");
  }
}

export async function upsertFlowTenantHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id } = flowIdParamsSchema.parse(await params);
    const body = await request.json();
    const data = upsertFlowTenantOverrideSchema.parse(body);
    const override = await upsertFlowTenantOverrideService(id, data);
    return ApiResponse.created(override);
  } catch (error) {
    return handleOnboardingHttpError(error, "[admin/onboarding/:id/tenants POST]");
  }
}

export async function deleteFlowTenantHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id } = flowIdParamsSchema.parse(await params);
    const { searchParams } = new URL(request.url);
    const { tenantId } = flowTenantDeleteQuerySchema.parse({
      tenantId: searchParams.get("tenantId") ?? undefined,
    });

    const result = await deleteFlowTenantOverrideService(id, tenantId);
    return ApiResponse.ok(result);
  } catch (error) {
    return handleOnboardingHttpError(error, "[admin/onboarding/:id/tenants DELETE]");
  }
}


