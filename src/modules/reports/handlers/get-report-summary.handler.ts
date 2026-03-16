import { ApiResponse } from "@/lib/http";
import { requireAuth } from "@/middleware/auth.middleware";
import { requireTenantContext } from "@/middleware/tenant.middleware";
import { handleReportHttpError } from "@/modules/reports/report.errors";
import { getReportSummaryService } from "@/modules/reports/services/get-report-summary.service";
import { reportQuerySchema } from "@/modules/reports/validations/report.validation";

export async function getReportSummaryHandler(request: Request) {
  try {
    await requireAuth();
    const { tenantId } = await requireTenantContext(request.headers);

    const { searchParams } = new URL(request.url);
    const query = reportQuerySchema.parse({
      period: searchParams.get("period") ?? undefined,
      startDate: searchParams.get("startDate") ?? undefined,
      endDate: searchParams.get("endDate") ?? undefined,
    });

    const report = await getReportSummaryService({ tenantId, query });
    return ApiResponse.ok(report);
  } catch (error) {
    return handleReportHttpError(error, "Error al generar reporte:");
  }
}

