import { ApiResponse } from "@/lib/http";
import { requireAuth } from "@/middleware/auth.middleware";
import { requireTenantContext } from "@/middleware/tenant.middleware";
import { getOrderReportService } from "@/modules/reports/services/get-order-report.service";
import { orderReportQuerySchema } from "@/modules/reports/validations/report.validation";
import { handleReportHttpError } from "@/modules/reports/report.errors";

export async function getOrdersReportHandler(request: Request) {
  try {
    await requireAuth();
    const { tenantId } = await requireTenantContext(request.headers);

    const { searchParams } = new URL(request.url);
    const query = orderReportQuerySchema.parse({
      period: searchParams.get("period") ?? undefined,
      startDate: searchParams.get("startDate") ?? undefined,
      endDate: searchParams.get("endDate") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      search: searchParams.get("search") ?? undefined,
    });

    const report = await getOrderReportService({ tenantId, query });
    return ApiResponse.ok(report);
  } catch (error) {
    return handleReportHttpError(error, "Error en reporte de ordenes:");
  }
}

